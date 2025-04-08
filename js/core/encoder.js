/**
 * Core encoder engine for SMS Encoding Tool
 * Centralizes encoding and decoding operations, orchestrating between different encoding services
 */

const EncoderEngine = (() => {
    /**
     * Encode text to hex based on specified encoding type
     * @param {string} text - Text to encode
     * @param {string} encodingType - Encoding type (CONFIG.ENCODING.GSM7 or CONFIG.ENCODING.UTF16)
     * @returns {Object} Result object with hex string and metadata
     */
    function encodeText(text, encodingType) {
      Utils.log(`Encoding text with ${encodingType === CONFIG.ENCODING.GSM7 ? 'GSM-7' : 'UTF-16'} encoding`, 
                CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      if (!text) {
        throw new Error('No text provided for encoding');
      }
      
      try {
        let hexString = '';
        let byteCount = 0;
        let segmentInfo = Utils.calculateSegments(text, encodingType);
        
        // Select encoding method based on type
        if (encodingType === CONFIG.ENCODING.GSM7) {
          // Verify GSM-7 compatibility
          if (!GSM7Service.canEncode(text)) {
            throw new Error('Text contains characters that cannot be encoded with GSM-7');
          }
          
          hexString = GSM7Service.encode(text);
          byteCount = Math.ceil((text.length * 7) / 8); // 7 bits per character, packed into 8-bit bytes
        } else {
          hexString = UTF16Service.encode(text);
          byteCount = text.length * 2; // 2 bytes per character for UTF-16
        }
        
        Utils.log('Encoding completed successfully', CONFIG.DEBUG.LOG_LEVELS.INFO);
        
        return {
          success: true,
          hexString,
          byteCount,
          charCount: text.length,
          segmentInfo,
          encodingType
        };
      } catch (error) {
        Utils.log('Encoding failed', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        throw error;
      }
    }
    
    /**
     * Decode hex string to text based on specified encoding type
     * @param {string} hexString - Hex string to decode
     * @param {string} encodingType - Encoding type (CONFIG.ENCODING.GSM7 or CONFIG.ENCODING.UTF16)
     * @returns {Object} Result object with decoded text and metadata
     */
    function decodeHex(hexString, encodingType) {
      Utils.log(`Decoding hex with ${encodingType === CONFIG.ENCODING.GSM7 ? 'GSM-7' : 'UTF-16'} encoding`, 
                CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      if (!hexString) {
        throw new Error('No hex string provided for decoding');
      }
      
      // Clean up the hex string
      hexString = hexString.replace(/\s+/g, '');
      
      // Validate hex string
      if (!Utils.isValidHex(hexString)) {
        throw new Error('Invalid hex string: contains non-hexadecimal characters');
      }
      
      try {
        let text = '';
        let byteCount = hexString.length / 2; // 2 hex chars = 1 byte
        
        // Select decoding method based on type
        if (encodingType === CONFIG.ENCODING.GSM7) {
          text = GSM7Service.decode(hexString);
        } else {
          // Validate UTF-16 hex length (must be multiple of 4)
          if (hexString.length % 4 !== 0) {
            throw new Error('Invalid UTF-16 hex string: length must be a multiple of 4');
          }
          
          text = UTF16Service.decode(hexString);
        }
        
        Utils.log('Decoding completed successfully', CONFIG.DEBUG.LOG_LEVELS.INFO);
        
        return {
          success: true,
          text,
          byteCount,
          charCount: text.length,
          encodingType
        };
      } catch (error) {
        Utils.log('Decoding failed', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        throw error;
      }
    }
    
    /**
     * Split long text into multipart message segments
     * @param {string} text - Text to split
     * @param {string} encodingType - Encoding type (CONFIG.ENCODING.GSM7 or CONFIG.ENCODING.UTF16)
     * @returns {Array<Object>} Array of segment objects with text and metadata
     */
    function splitIntoSegments(text, encodingType) {
      Utils.log('Splitting text into segments', CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      if (!text) return [];
      
      // Get segment information
      const segmentInfo = Utils.calculateSegments(text, encodingType);
      const segmentCount = segmentInfo.count;
      
      if (segmentCount <= 1) {
        Utils.log('Text fits in a single message, no splitting needed', CONFIG.DEBUG.LOG_LEVELS.DEBUG);
        return [{
          text,
          segmentNumber: 1,
          totalSegments: 1,
          charCount: text.length
        }];
      }
      
      // For multipart messages, character limit is slightly reduced
      const charLimit = encodingType === CONFIG.ENCODING.GSM7 
        ? 153  // GSM-7 multipart limit
        : 67;  // UTF-16 multipart limit
      
      const segments = [];
      
      for (let i = 0; i < segmentCount; i++) {
        const start = i * charLimit;
        const end = Math.min(start + charLimit, text.length);
        const segmentText = text.substring(start, end);
        
        segments.push({
          text: segmentText,
          segmentNumber: i + 1,
          totalSegments: segmentCount,
          charCount: segmentText.length
        });
      }
      
      Utils.log(`Split into ${segmentCount} segments`, CONFIG.DEBUG.LOG_LEVELS.INFO, segments);
      
      return segments;
    }
    
    /**
     * Get the maximum character count per message based on encoding type
     * @param {string} encodingType - Encoding type
     * @param {boolean} isMultipart - Whether this is for a multipart message
     * @returns {number} Maximum character count
     */
    function getMaxCharsPerMessage(encodingType, isMultipart = false) {
      if (encodingType === CONFIG.ENCODING.GSM7) {
        return isMultipart ? 153 : CONFIG.CHAR_LIMITS.GSM7;
      } else {
        return isMultipart ? 67 : CONFIG.CHAR_LIMITS.UTF16;
      }
    }
    
    /**
     * Analyze text to determine optimal encoding
     * @param {string} text - Text to analyze
     * @returns {Object} Analysis results
     */
    function analyzeText(text) {
      Utils.log('Analyzing text to determine optimal encoding', CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      if (!text) {
        return {
          recommendedEncoding: CONFIG.ENCODING.GSM7,
          canUseGsm7: true,
          charCount: 0,
          segmentsGsm7: 0,
          segmentsUtf16: 0
        };
      }
      
      // Check if text can be encoded with GSM-7
      const canUseGsm7 = GSM7Service.canEncode(text);
      
      // Calculate segments for both encodings
      const gsm7SegmentInfo = Utils.calculateSegments(text, CONFIG.ENCODING.GSM7);
      const utf16SegmentInfo = Utils.calculateSegments(text, CONFIG.ENCODING.UTF16);
      
      // Determine recommended encoding
      // If text can use GSM-7, it's always preferred (fewer segments)
      const recommendedEncoding = canUseGsm7 ? CONFIG.ENCODING.GSM7 : CONFIG.ENCODING.UTF16;
      
      Utils.log('Text analysis complete', CONFIG.DEBUG.LOG_LEVELS.INFO, {
        recommendedEncoding: recommendedEncoding === CONFIG.ENCODING.GSM7 ? 'GSM-7' : 'UTF-16',
        canUseGsm7,
        segmentsGsm7: gsm7SegmentInfo.count,
        segmentsUtf16: utf16SegmentInfo.count
      });
      
      return {
        recommendedEncoding,
        canUseGsm7,
        charCount: text.length,
        segmentsGsm7: gsm7SegmentInfo.count,
        segmentsUtf16: utf16SegmentInfo.count
      };
    }
    
    /**
     * Find non-GSM7 characters in text
     * @param {string} text - Text to check
     * @returns {Array} Array of non-GSM7 characters with positions
     */
    function findNonGsm7Chars(text) {
      Utils.log('Finding non-GSM7 characters in text', CONFIG.DEBUG.LOG_LEVELS.DEBUG);
      
      if (!text) return [];
      
      const nonGsm7Chars = [];
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (!GSM7Service.canEncode(char)) {
          nonGsm7Chars.push({
            char,
            position: i,
            codePoint: char.charCodeAt(0)
          });
        }
      }
      
      if (nonGsm7Chars.length > 0) {
        Utils.log('Found non-GSM7 characters', CONFIG.DEBUG.LOG_LEVELS.DEBUG, nonGsm7Chars);
      } else {
        Utils.log('No non-GSM7 characters found', CONFIG.DEBUG.LOG_LEVELS.DEBUG);
      }
      
      return nonGsm7Chars;
    }
    
    // Public API
    return {
      encodeText,
      decodeHex,
      splitIntoSegments,
      getMaxCharsPerMessage,
      analyzeText,
      findNonGsm7Chars
    };
  })();
  
  // Initialize
  Utils.log('EncoderEngine initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);