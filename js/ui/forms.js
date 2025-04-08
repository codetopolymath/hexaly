/**
 * Form handling functionality for the SMS Encoding Tool
 */

const FormsUI = (() => {
  // Cache DOM elements
  let elements = {
    // Encode tab elements
    textInput: null,
    encodingTypeRadios: null,
    encodeBtn: null,
    hexOutput: null,
    charCount: null,
    byteCount: null,
    encodingTypeDisplay: null,
    copyHexBtn: null,
    
    // Decode tab elements
    hexInput: null,
    decodingTypeRadios: null,
    decodeBtn: null,
    textOutput: null,
    copyTextBtn: null,
    
    // Multipart info elements
    segmentCount: null,
    segmentInfo: null
  };
  
  /**
   * Initialize form handling
   */
  function init() {
    Utils.log('Initializing forms', CONFIG.DEBUG.LOG_LEVELS.INFO);
    
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  /**
   * Cache DOM elements for faster access
   */
  function cacheElements() {
    // Encode tab elements
    elements.textInput = document.getElementById('text-input');
    elements.encodingTypeRadios = document.querySelectorAll('input[name="encode-type"]');
    elements.encodeBtn = document.getElementById('encode-btn');
    elements.hexOutput = document.getElementById('hex-output');
    elements.charCount = document.getElementById('char-count');
    elements.byteCount = document.getElementById('byte-count');
    elements.encodingTypeDisplay = document.getElementById('encoding-type');
    elements.copyHexBtn = document.getElementById('copy-hex');
    elements.segmentCount = document.getElementById('segment-count');
    elements.segmentInfo = document.getElementById('segment-info');
    
    // Decode tab elements
    elements.hexInput = document.getElementById('hex-input');
    elements.decodingTypeRadios = document.querySelectorAll('input[name="decode-type"]');
    elements.decodeBtn = document.getElementById('decode-btn');
    elements.textOutput = document.getElementById('text-output');
    elements.copyTextBtn = document.getElementById('copy-text');
  }
  
  /**
   * Set up event listeners for form interactions
   */
  function setupEventListeners() {
    // Text input events
    if (elements.textInput) {
      elements.textInput.addEventListener('input', updateTextStats);
    }
    
    // Encoding type radio changes
    elements.encodingTypeRadios.forEach(radio => {
      radio.addEventListener('change', updateEncodingType);
    });
    
    // Encode button click
    if (elements.encodeBtn) {
      elements.encodeBtn.addEventListener('click', handleEncode);
    }
    
    // Decode button click
    if (elements.decodeBtn) {
      elements.decodeBtn.addEventListener('click', handleDecode);
    }
    
    // Copy buttons
    if (elements.copyHexBtn) {
      elements.copyHexBtn.addEventListener('click', () => {
        Utils.copyToClipboard(elements.hexOutput, 'Hex result copied to clipboard!');
      });
    }
    
    if (elements.copyTextBtn) {
      elements.copyTextBtn.addEventListener('click', () => {
        Utils.copyToClipboard(elements.textOutput, 'Decoded text copied to clipboard!');
      });
    }
  }
  
  /**
   * Updates character count, byte count, and segment info
   */
  function updateTextStats() {
    const text = elements.textInput.value;
    const encodingType = getSelectedEncodingType('encode');
    
    // Use EncoderEngine to get text analysis
    const analysis = EncoderEngine.analyzeText(text);
    
    // Update character count
    if (elements.charCount) {
      elements.charCount.textContent = text.length;
    }
    
    // Update byte count based on encoding
    if (elements.byteCount) {
      if (encodingType === CONFIG.ENCODING.GSM7) {
        // GSM-7: 7 bits per character, packed into 8-bit bytes
        const fullBytes = Math.ceil((text.length * 7) / 8);
        elements.byteCount.textContent = fullBytes;
      } else {
        // UTF-16: 2 bytes per character
        elements.byteCount.textContent = text.length * 2;
      }
    }
    
    // Update segment count based on current encoding
    if (elements.segmentCount) {
      const segmentInfo = Utils.calculateSegments(text, encodingType);
      elements.segmentCount.textContent = segmentInfo.count;
    }
    
    // Update segment info visualization
    updateSegmentInfoDisplay(text, encodingType);
    
    // Highlight non-GSM7 characters if GSM-7 encoding is selected
    if (encodingType === CONFIG.ENCODING.GSM7 && !analysis.canUseGsm7) {
      // Get non-GSM7 characters
      const nonGsm7Chars = EncoderEngine.findNonGsm7Chars(text);
      
      // Show warning if there are non-GSM7 characters
      if (nonGsm7Chars.length > 0) {
        const charsList = nonGsm7Chars.map(c => `"${c.char}" (position ${c.position + 1})`).join(', ');
        const warningMsg = `Text contains ${nonGsm7Chars.length} character(s) not supported by GSM-7: ${charsList}`;
        
        Utils.log(warningMsg, CONFIG.DEBUG.LOG_LEVELS.WARN);
        
        // Add subtle visual indicator
        elements.textInput.classList.add('has-invalid-chars');
      } else {
        elements.textInput.classList.remove('has-invalid-chars');
      }
    } else {
      elements.textInput.classList.remove('has-invalid-chars');
    }
  }
  
  /**
   * Update the segment info visualization
   * @param {string} text - The text to analyze
   * @param {string} encodingType - The encoding type
   */
  function updateSegmentInfoDisplay(text, encodingType) {
    if (!elements.segmentInfo) return;
    
    if (!text || text.length === 0) {
      elements.segmentInfo.style.display = 'none';
      return;
    }
    
    // Calculate segment information using EncoderEngine
    const segmentInfo = Utils.calculateSegments(text, encodingType);
    
    // For multipart messages (more than one segment)
    if (segmentInfo.count > 1) {
      const encoding = encodingType === CONFIG.ENCODING.GSM7 ? 'GSM-7' : 'UTF-16';
      const limit = EncoderEngine.getMaxCharsPerMessage(encodingType, true); // Get limit for multipart
      const segments = EncoderEngine.splitIntoSegments(text, encodingType);
      
      let segmentBars = '';
      segments.forEach(segment => {
        const percentWidth = (segment.charCount / limit * 100).toFixed(1);
        segmentBars += `<div class="segment-part">
          <div class="segment-part-bar" style="width: ${percentWidth}%" title="Segment ${segment.segmentNumber}: ${segment.charCount} chars"></div>
          <div class="segment-part-label">${segment.segmentNumber}</div>
        </div>`;
      });
      
      elements.segmentInfo.innerHTML = `
        <div class="segment-progress multi">
          ${segmentBars}
        </div>
        <div class="segment-details">
          <strong>${segmentInfo.count} ${segmentInfo.count === 1 ? 'message' : 'messages'}</strong> (${encoding})<br>
          ${text.length} characters total, using ${limit} chars per message limit
        </div>
      `;
      elements.segmentInfo.style.display = 'block';
    } 
    // For single messages
    else if (text.length > 0) {
      const encoding = encodingType === CONFIG.ENCODING.GSM7 ? 'GSM-7' : 'UTF-16';
      const limit = EncoderEngine.getMaxCharsPerMessage(encodingType, false);
      const percent = (text.length / limit * 100).toFixed(0);
      
      elements.segmentInfo.innerHTML = `
        <div class="segment-progress">
          <div class="segment-bar" style="width: ${percent}%"></div>
        </div>
        <div class="segment-details">
          <strong>Single message</strong> (${encoding})<br>
          ${text.length} characters (${percent}% of ${limit} limit)
        </div>
      `;
      elements.segmentInfo.style.display = 'block';
    } 
    else {
      elements.segmentInfo.style.display = 'none';
    }
  }
  
  /**
   * Update encoding type display when radio buttons change
   */
  function updateEncodingType() {
    const encodingType = getSelectedEncodingType('encode');
    
    if (elements.encodingTypeDisplay) {
      if (encodingType === CONFIG.ENCODING.GSM7) {
        elements.encodingTypeDisplay.textContent = 'GSM-7 bit packed';
      } else if (encodingType === CONFIG.ENCODING.UTF16) {
        elements.encodingTypeDisplay.textContent = 'UTF-16';
      }
    }
    
    updateTextStats();
  }
  
  /**
   * Get the selected encoding/decoding type value
   * @param {string} mode - 'encode' or 'decode'
   * @returns {string} Selected encoding type
   */
  function getSelectedEncodingType(mode) {
    const selector = mode === 'encode' 
      ? 'input[name="encode-type"]:checked'
      : 'input[name="decode-type"]:checked';
    
    const selectedRadio = document.querySelector(selector);
    
    if (selectedRadio) {
      return selectedRadio.value === 'gsm7' ? CONFIG.ENCODING.GSM7 : CONFIG.ENCODING.UTF16;
    }
    
    // Default to GSM7 if nothing is selected
    return CONFIG.ENCODING.GSM7;
  }
  
  /**
   * Handle encode button click
   */
  function handleEncode() {
    const text = elements.textInput.value;
    const encodingType = getSelectedEncodingType('encode');
    
    if (!text) {
      Utils.showNotification('Please enter text to encode', 'error');
      return;
    }
    
    try {
      // Use the EncoderEngine to encode the text
      const result = EncoderEngine.encodeText(text, encodingType);
      
      if (elements.hexOutput) {
        elements.hexOutput.value = result.hexString;
      }
      
      Utils.showNotification(CONFIG.NOTIFICATIONS.ENCODE_SUCCESS, 'success');
    } catch (error) {
      Utils.showNotification(CONFIG.NOTIFICATIONS.ENCODE_ERROR + error.message, 'error');
    }
  }
  
  /**
   * Handle decode button click
   */
  function handleDecode() {
    const hexString = elements.hexInput ? elements.hexInput.value.trim() : '';
    const decodingType = getSelectedEncodingType('decode');
    
    // Basic validation
    if (!hexString) {
      Utils.showNotification('Please enter a hex string to decode', 'error');
      return;
    }
    
    // Check if input contains only hex characters
    if (!Utils.isValidHex(hexString)) {
      Utils.showNotification('Input contains non-hexadecimal characters', 'error');
      return;
    }
    
    try {
      // Use the EncoderEngine to decode the hex string
      const result = EncoderEngine.decodeHex(hexString, decodingType);
      
      if (elements.textOutput) {
        elements.textOutput.value = result.text;
      }
      
      Utils.showNotification(CONFIG.NOTIFICATIONS.DECODE_SUCCESS, 'success');
    } catch (error) {
      Utils.showNotification(CONFIG.NOTIFICATIONS.DECODE_ERROR + error.message, 'error');
    }
  }
  
  // Public API
  return {
    init,
    updateTextStats,
    getSelectedEncodingType,
    handleEncode,
    handleDecode
  };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  FormsUI.init();
  Utils.log('FormsUI initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);
});