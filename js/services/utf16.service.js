/**
 * UTF-16 encoding and decoding service
 * Handles UTF-16 encoding operations for SMS
 */

const UTF16Service = (() => {
    /**
     * Encode text to UTF-16 hex string (big-endian)
     * @param {string} text - Text to encode
     * @returns {string} Hex string representation of the UTF-16 encoded text
     */
    function encodeUTF16(text) {
      Utils.log('Encoding text to UTF-16', CONFIG.DEBUG.LOG_LEVELS.INFO, text);
      
      try {
        let hexString = '';
        
        for (let i = 0; i < text.length; i++) {
          // Get the character code
          const codePoint = text.charCodeAt(i);
          
          Utils.log(`Character: ${text[i]}, Code point: ${codePoint}`, CONFIG.DEBUG.LOG_LEVELS.DEBUG);
          
          // Split into high and low bytes (big-endian format)
          const highByte = (codePoint >> 8) & 0xFF;
          const lowByte = codePoint & 0xFF;
          
          // Convert to hex and append to result
          const highByteHex = highByte.toString(16).padStart(2, '0').toLowerCase();
          const lowByteHex = lowByte.toString(16).padStart(2, '0').toLowerCase();
          
          hexString += highByteHex + lowByteHex;
        }
        
        Utils.log('Encoded UTF-16 hex string', CONFIG.DEBUG.LOG_LEVELS.INFO, hexString);
        return hexString;
      } catch (error) {
        Utils.log('Error encoding UTF-16', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        throw error;
      }
    }
  
    /**
     * Decode UTF-16 hex string to text
     * @param {string} hexString - Hex string of the UTF-16 encoded text
     * @returns {string} Decoded text
     */
    function decodeUTF16(hexString) {
      Utils.log('Decoding UTF-16 hex string', CONFIG.DEBUG.LOG_LEVELS.INFO, hexString);
      
      try {
        // Clean up hex string (remove spaces, etc.)
        hexString = hexString.replace(/\s+/g, '');
        
        if (!Utils.isValidHex(hexString)) {
          throw new Error("Invalid hex string: contains non-hexadecimal characters");
        }
        
        // Ensure we have an even number of hex digits
        if (hexString.length % 4 !== 0) {
          throw new Error("UTF-16 hex string length must be a multiple of 4");
        }
        
        let text = '';
        
        // Process 2 bytes (4 hex digits) at a time
        for (let i = 0; i < hexString.length; i += 4) {
          // Extract the high and low bytes
          const highByte = parseInt(hexString.substring(i, i + 2), 16);
          const lowByte = parseInt(hexString.substring(i + 2, i + 4), 16);
          
          // Combine into a character code
          const codePoint = (highByte << 8) | lowByte;
          
          Utils.log(`Hex pair: ${hexString.substring(i, i + 4)}, Code point: ${codePoint}`, CONFIG.DEBUG.LOG_LEVELS.DEBUG);
          
          // Convert to character and append to result
          text += String.fromCharCode(codePoint);
        }
        
        Utils.log('Decoded UTF-16 text', CONFIG.DEBUG.LOG_LEVELS.INFO, text);
        return text;
      } catch (error) {
        Utils.log('Error decoding UTF-16', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        throw error;
      }
    }
  
    // Public API
    return {
      encode: encodeUTF16,
      decode: decodeUTF16
    };
  })();
  
  // Initialize
  Utils.log('UTF16Service initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);