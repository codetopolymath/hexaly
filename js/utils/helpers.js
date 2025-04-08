/**
 * Helper utilities for the SMS Encoding Tool
 */

const Utils = {
    /**
     * Debug logger with different levels
     * Only logs if debug mode is enabled
     * @param {string} message - Message to log
     * @param {string} level - Log level (info, warn, error, debug)
     * @param {any} data - Optional data to log
     */
    log(message, level = CONFIG.DEBUG.LOG_LEVELS.INFO, data = null) {
      if (!CONFIG.DEBUG.ENABLED) return;
      
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]:`;
      
      switch (level) {
        case CONFIG.DEBUG.LOG_LEVELS.ERROR:
          console.error(prefix, message, data || '');
          break;
        case CONFIG.DEBUG.LOG_LEVELS.WARN:
          console.warn(prefix, message, data || '');
          break;
        case CONFIG.DEBUG.LOG_LEVELS.DEBUG:
          console.debug(prefix, message, data || '');
          break;
        default:
          console.log(prefix, message, data || '');
      }
    },
    
    /**
     * Creates and displays notification messages
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, info)
     * @param {number} duration - Duration in ms to display the message
     */
    showNotification(message, type = 'info', duration = 3000) {
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = `message ${type}`;
      messageElement.textContent = message;
      
      // Style based on message type
      if (type === 'error') {
        messageElement.style.backgroundColor = '#f8d7da';
        messageElement.style.color = '#721c24';
        messageElement.style.borderColor = '#f5c6cb';
      } else if (type === 'success') {
        messageElement.style.backgroundColor = '#d4edda';
        messageElement.style.color = '#155724';
        messageElement.style.borderColor = '#c3e6cb';
      } else {
        messageElement.style.backgroundColor = '#d1ecf1';
        messageElement.style.color = '#0c5460';
        messageElement.style.borderColor = '#bee5eb';
      }
      
      // Position the message
      messageElement.style.position = 'fixed';
      messageElement.style.bottom = '20px';
      messageElement.style.right = '20px';
      messageElement.style.padding = '12px 20px';
      messageElement.style.borderRadius = '4px';
      messageElement.style.borderLeft = '4px solid';
      messageElement.style.zIndex = '1000';
      messageElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      
      // Add to document
      document.body.appendChild(messageElement);
      
      // Log message in debug mode
      Utils.log(`Notification: ${message}`, type === 'error' ? CONFIG.DEBUG.LOG_LEVELS.ERROR : CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      // Remove after a delay
      setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
          }
        }, 500);
      }, duration);
    },
    
    /**
     * Copies text to clipboard
     * @param {HTMLElement} element - Element to copy from
     * @param {string} successMessage - Message to show on success
     * @returns {boolean} Success status
     */
    copyToClipboard(element, successMessage) {
      try {
        element.select();
        document.execCommand('copy');
        
        // Deselect the text
        element.setSelectionRange(0, 0);
        
        this.showNotification(successMessage, 'success');
        return true;
      } catch (error) {
        this.log('Copy to clipboard failed', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        this.showNotification('Failed to copy to clipboard', 'error');
        return false;
      }
    },
    
    /**
     * Validates hex string
     * @param {string} hexString - Hex string to validate
     * @returns {boolean} Is valid
     */
    isValidHex(hexString) {
      return /^[0-9A-Fa-f]*$/.test(hexString);
    },
    
    /**
     * Calculates message segments based on character count and encoding type
     * @param {string} text - Text to analyze
     * @param {string} encodingType - Encoding type
     * @returns {Object} Segment information
     */
    calculateSegments(text, encodingType) {
      if (!text) return { count: 0, charsInLastSegment: 0, totalChars: 0 };
      
      const totalChars = text.length;
      let segmentLimit, segmentCount;
      
      // Determine character limit per segment based on encoding
      if (encodingType === CONFIG.ENCODING.GSM7) {
        segmentLimit = CONFIG.CHAR_LIMITS.GSM7;
      } else {
        segmentLimit = CONFIG.CHAR_LIMITS.UTF16;
      }
      
      // Calculate segments
      segmentCount = Math.ceil(totalChars / segmentLimit);
      const charsInLastSegment = totalChars % segmentLimit || segmentLimit;
      
      return {
        count: segmentCount,
        charsInLastSegment,
        totalChars,
        charsPerSegment: segmentLimit
      };
    }
  };
  
  // Self-reference for method chaining
  Utils.log('Helpers initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);