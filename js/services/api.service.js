/**
 * API Service for SMS Verification
 * Handles communication with the backend API
 */

const APIService = (() => {
    /**
     * Verify a message with the SMS Verification API
     * @param {Object} params - Message parameters
     * @param {string} params.authcode - Authentication code
     * @param {string} params.senderid - Sender ID
     * @param {string} params.pe_id - PE ID
     * @param {string} params.number - Recipient phone number
     * @param {string} params.content_id - Content ID
     * @param {string} params.message_hex - Hex-encoded message content
     * @param {string} params.encoding_type - Encoding type (0 for GSM7, 8 for UTF16)
     * @param {number} [params.message_ref_num] - Message reference number for multipart
     * @param {number} [params.total_segments] - Total segments in multipart message
     * @param {number} [params.segment_seqnum] - Sequence number of this segment
     * @param {string} [params.message_language] - Message language code
     * @param {number} [params.original_message_length] - Original message length
     * @returns {Promise<Object>} API response
     */
    async function verifyMessage(params) {
      Utils.log('Verifying message with API', CONFIG.DEBUG.LOG_LEVELS.INFO, params);
      
      try {
        // Validate required parameters
        const requiredParams = ['authcode', 'senderid', 'pe_id', 'number', 'content_id', 'message_hex', 'encoding_type'];
        for (const param of requiredParams) {
          if (!params[param]) {
            throw new Error(`Missing required parameter: ${param}`);
          }
        }
        
        // Multipart message validation
        if (params.total_segments && params.total_segments > 1) {
          if (!params.message_ref_num) {
            throw new Error('message_ref_num is required for multipart messages');
          }
          if (!params.segment_seqnum) {
            throw new Error('segment_seqnum is required for multipart messages');
          }
        }
  
        // Make API call
        const response = await fetch(CONFIG.API.VERIFY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
  
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json();
        Utils.log('API response received', CONFIG.DEBUG.LOG_LEVELS.INFO, data);
        
        return data;
      } catch (error) {
        Utils.log('API error', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        throw error;
      }
    }
  
    /**
     * Generate a mock DLR response for testing
     * @param {Object} params - Message parameters
     * @returns {Object} Mock API response
     */
    function generateMockResponse(params) {
      Utils.log('Generating mock API response', CONFIG.DEBUG.LOG_LEVELS.INFO, params);
      
      // Simulate multipart message handling
      if (params.total_segments && params.total_segments > 1 && 
          params.segment_seqnum < params.total_segments) {
        return {
          dlr_code: CONFIG.DLR_CODES.PENDING,
          description: "Multipart message waiting for other segments",
          dispatch_status: "PENDING",
          status: true,
          message: "Scrubbing log report generation pending"
        };
      }
      
      // Simulate URL detection (for demo purposes)
      const messageHex = params.message_hex || '';
      let messageText = '';
      
      try {
        if (params.encoding_type === CONFIG.ENCODING.GSM7) {
          messageText = GSM7Service.decode(messageHex);
        } else {
          messageText = UTF16Service.decode(messageHex);
        }
      } catch (e) {
        // Ignore decoding errors in mock
      }
      
      // Check for URL patterns
      const hasUrl = /https?:\/\/|www\./i.test(messageText);
      
      if (hasUrl) {
        return {
          dlr_code: "903",
          description: "Failed Due to URL",
          dispatch_status: "FAILED",
          status: true,
          message: "Scrubbing log report generated successfully"
        };
      }
      
      // Default success response
      return {
        dlr_code: CONFIG.DLR_CODES.SUCCESS,
        description: "Success",
        dispatch_status: "SUCCESS",
        status: true,
        message: "Scrubbing log report generated successfully"
      };
    }
    
    /**
     * Prepare a message for API verification
     * @param {Object} options - Message options
     * @param {string} options.text - Message text
     * @param {string} options.encodingType - Encoding type (CONFIG.ENCODING.GSM7 or CONFIG.ENCODING.UTF16)
     * @param {string} options.senderid - Sender ID
     * @param {string} options.pe_id - PE ID
     * @param {string} options.number - Recipient phone number
     * @param {string} options.content_id - Content ID
     * @param {string} options.authcode - Authentication code
     * @param {boolean} [options.useMultipart=false] - Whether to use multipart if message exceeds limits
     * @param {string} [options.language] - Message language code
     * @returns {Object|Array<Object>} Message params for API (or array for multipart)
     */
    function prepareMessageParams(options) {
      Utils.log('Preparing message parameters', CONFIG.DEBUG.LOG_LEVELS.INFO, options);
      
      const { text, encodingType, senderid, pe_id, number, content_id, authcode, useMultipart = false, language } = options;
      
      if (!text) {
        throw new Error('Message text is required');
      }
      
      // Calculate segments
      const segmentInfo = Utils.calculateSegments(text, encodingType);
      Utils.log('Segment calculation', CONFIG.DEBUG.LOG_LEVELS.DEBUG, segmentInfo);
      
      // Check if we need multipart
      const needsMultipart = segmentInfo.count > 1 && useMultipart;
      
      // Generate message_ref_num for multipart
      const messageRefNum = needsMultipart ? Math.floor(Math.random() * 65535) : undefined;
      
      // For single part messages
      if (!needsMultipart) {
        // Encode the message
        let messageHex;
        if (encodingType === CONFIG.ENCODING.GSM7) {
          messageHex = GSM7Service.encode(text);
        } else {
          messageHex = UTF16Service.encode(text);
        }
        
        return {
          authcode,
          senderid,
          pe_id,
          number,
          content_id,
          message_hex: messageHex,
          encoding_type: encodingType,
          message_language: language
        };
      }
      
      // For multipart messages
      const messages = [];
      const totalSegments = segmentInfo.count;
      
      // Split text into segments
      for (let i = 0; i < totalSegments; i++) {
        const start = i * segmentInfo.charsPerSegment;
        const end = Math.min(start + segmentInfo.charsPerSegment, text.length);
        const segmentText = text.substring(start, end);
        
        // Encode the segment
        let messageHex;
        if (encodingType === CONFIG.ENCODING.GSM7) {
          messageHex = GSM7Service.encode(segmentText);
        } else {
          messageHex = UTF16Service.encode(segmentText);
        }
        
        messages.push({
          authcode,
          senderid,
          pe_id,
          number,
          content_id,
          message_hex: messageHex,
          encoding_type: encodingType,
          message_ref_num: messageRefNum,
          total_segments: totalSegments,
          segment_seqnum: i + 1,
          original_message_length: text.length,
          message_language: language
        });
      }
      
      return messages;
    }
    
    // Public API
    return {
      verifyMessage,
      generateMockResponse,
      prepareMessageParams
    };
  })();
  
  // Initialize
  Utils.log('APIService initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);