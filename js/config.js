/**
 * Configuration and constants for the SMS Encoding Tool
 */

const CONFIG = {
    // Debug settings
    DEBUG: {
      ENABLED: false,
      LOG_LEVELS: {
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
        DEBUG: 'debug'
      }
    },
    
    // Encoding types
    ENCODING: {
      GSM7: '0',    // GSM 7-bit packed into 8-bit
      UTF16: '8'    // UTF-16 encoding
    },
    
    // Character limits per segment
    CHAR_LIMITS: {
      GSM7: 160,    // Maximum chars for GSM-7 encoding
      UTF16: 70     // Maximum chars for UTF-16 encoding
    },
    
    // API endpoints (if needed)
    API: {
      VERIFY_URL: 'https://smartping-backend.goflipo.com/api/main/verify-scrubbing-logs'
    },
    
    // DLR response codes
    DLR_CODES: {
      SUCCESS: '000',
      PENDING: '920'
      // Other codes can be added as needed
    },
    
    // Message templates for notifications
    NOTIFICATIONS: {
      ENCODE_SUCCESS: 'Text encoded successfully!',
      DECODE_SUCCESS: 'Hex decoded successfully!',
      COPY_SUCCESS: 'Copied to clipboard!',
      ENCODE_ERROR: 'Error encoding text: ',
      DECODE_ERROR: 'Error decoding hex: ',
      VALIDATION_ERROR: 'Validation error: '
    }
  };
  
  // Prevent modifications to the config
  Object.freeze(CONFIG);