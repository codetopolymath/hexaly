/**
 * GSM-7 encoding and decoding service
 * Handles GSM 7-bit encoding, packing, and unpacking operations
 */

const GSM7Service = (() => {
    // GSM 7-bit default alphabet mapping
    const gsmAlphabet = {
      '@': 0, '£': 1, '$': 2, '¥': 3, 'è': 4, 'é': 5, 'ù': 6, 'ì': 7,
      'ò': 8, 'Ç': 9, '\n': 10, 'Ø': 11, 'ø': 12, '\r': 13, 'Å': 14, 'å': 15,
      'Δ': 16, '_': 17, 'Φ': 18, 'Γ': 19, 'Λ': 20, 'Ω': 21, 'Π': 22, 'Ψ': 23,
      'Σ': 24, 'Θ': 25, 'Ξ': 26, '\u001B': 27, 'Æ': 28, 'æ': 29, 'ß': 30, 'É': 31,
      ' ': 32, '!': 33, '"': 34, '#': 35, '¤': 36, '%': 37, '&': 38, '\'': 39,
      '(': 40, ')': 41, '*': 42, '+': 43, ',': 44, '-': 45, '.': 46, '/': 47,
      '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55,
      '8': 56, '9': 57, ':': 58, ';': 59, '<': 60, '=': 61, '>': 62, '?': 63,
      '¡': 64, 'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71,
      'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78, 'O': 79,
      'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84, 'U': 85, 'V': 86, 'W': 87,
      'X': 88, 'Y': 89, 'Z': 90, 'Ä': 91, 'Ö': 92, 'Ñ': 93, 'Ü': 94, '§': 95,
      '¿': 96, 'a': 97, 'b': 98, 'c': 99, 'd': 100, 'e': 101, 'f': 102, 'g': 103,
      'h': 104, 'i': 105, 'j': 106, 'k': 107, 'l': 108, 'm': 109, 'n': 110, 'o': 111,
      'p': 112, 'q': 113, 'r': 114, 's': 115, 't': 116, 'u': 117, 'v': 118, 'w': 119,
      'x': 120, 'y': 121, 'z': 122, 'ä': 123, 'ö': 124, 'ñ': 125, 'ü': 126, 'à': 127
    };
  
    // Create reverse mapping
    const gsmAlphabetReverse = {};
    for (const [char, code] of Object.entries(gsmAlphabet)) {
      gsmAlphabetReverse[code] = char;
    }
  
    // GSM 7-bit extension table
    const gsmExtendedChars = {
      '\f': 10, '^': 20, '{': 40, '}': 41, '\\': 47, '[': 60, '~': 61, ']': 62, '|': 64, '€': 101
    };
  
    // Create reverse mapping for extended characters
    const gsmExtendedCharsReverse = {};
    for (const [char, code] of Object.entries(gsmExtendedChars)) {
      gsmExtendedCharsReverse[code] = char;
    }
  
    /**
     * Check if a character is in the GSM-7 alphabet
     * @param {string} char - Single character to check
     * @returns {boolean} True if the character is in the GSM-7 alphabet
     */
    function isGsmChar(char) {
      return char in gsmAlphabet || char in gsmExtendedChars;
    }
  
    /**
     * Check if text can be encoded using GSM-7
     * @param {string} text - Text to check
     * @returns {boolean} True if all characters in the text can be encoded using GSM-7
     */
    function canEncodeAsGsm7(text) {
      Utils.log('Checking if text can be encoded as GSM-7', CONFIG.DEBUG.LOG_LEVELS.DEBUG, text);
      
      if (!text) return true;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (!isGsmChar(char)) {
          Utils.log(`Character not in GSM-7 alphabet: ${char} (code: ${char.charCodeAt(0)})`, 
                    CONFIG.DEBUG.LOG_LEVELS.DEBUG);
          return false;
        }
      }
      
      Utils.log('Text can be encoded as GSM-7', CONFIG.DEBUG.LOG_LEVELS.DEBUG);
      return true;
    }
  
    /**
     * Convert text to GSM-7 septets
     * @param {string} text - Text to convert
     * @returns {number[]} Array of GSM-7 septet values
     */
    function textToGsm7Septets(text) {
      Utils.log('Converting text to GSM-7 septets', CONFIG.DEBUG.LOG_LEVELS.DEBUG, text);
      
      const septets = [];
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char in gsmAlphabet) {
          septets.push(gsmAlphabet[char]);
        } else if (char in gsmExtendedChars) {
          // Extended character, push escape followed by the actual code
          septets.push(27); // ESC
          septets.push(gsmExtendedChars[char]);
        } else {
          // Character not in GSM-7 alphabet, replace with '?'
          Utils.log(`Replacing unsupported character: ${char}`, CONFIG.DEBUG.LOG_LEVELS.WARN);
          septets.push(gsmAlphabet['?']);
        }
      }
      
      Utils.log('Generated septets', CONFIG.DEBUG.LOG_LEVELS.DEBUG, septets);
      return septets;
    }
  
    /**
     * Pack GSM-7 septets into octets (8-bit bytes)
     * @param {number[]} septets - Array of GSM-7 septet values
     * @returns {number[]} Array of packed octets
     */
    function packGsm7Septets(septets) {
      Utils.log('Packing GSM-7 septets into octets', CONFIG.DEBUG.LOG_LEVELS.DEBUG);
      
      const octets = [];
      let shift = 0;
      let currentOctet = 0;
      
      for (let i = 0; i < septets.length; i++) {
        const septet = septets[i] & 0x7F; // Ensure we only use 7 bits
        
        // Add bits from current septet to current octet
        currentOctet |= septet << shift;
        
        // If we've used more than 0 bits, we have a complete octet
        if (shift >= 1) {
          octets.push(currentOctet & 0xFF);
          currentOctet = septet >> (8 - shift);
        }
        
        // Update shift for next iteration
        shift = (shift + 7) % 8;
        
        // If shift is 0, we're at a byte boundary
        if (shift === 0) {
          octets.push(currentOctet);
          currentOctet = 0;
        }
      }
      
      // Push any remaining bits as the final octet
      if (shift !== 0) {
        octets.push(currentOctet);
      }
      
      Utils.log('Packed octets', CONFIG.DEBUG.LOG_LEVELS.DEBUG, octets);
      return octets;
    }
  
    /**
     * Convert text to GSM-7 bit packed hex string
     * @param {string} text - Text to encode
     * @returns {string} Hex string representation of the packed GSM-7 data
     */
    function encodeGsm7(text) {
      Utils.log('Encoding text to GSM-7', CONFIG.DEBUG.LOG_LEVELS.INFO, text);
      
      // Check if all characters can be encoded
      if (!canEncodeAsGsm7(text)) {
        const error = new Error("Text contains characters that cannot be encoded with GSM-7");
        Utils.log(error.message, CONFIG.DEBUG.LOG_LEVELS.ERROR);
        throw error;
      }
      
      // Convert text to septets
      const septets = textToGsm7Septets(text);
      
      // Pack septets into octets
      const octets = packGsm7Septets(septets);
      
      // Convert octets to hex string
      let hexString = '';
      for (let i = 0; i < octets.length; i++) {
        hexString += octets[i].toString(16).padStart(2, '0').toLowerCase();
      }
      
      Utils.log('Encoded GSM-7 hex string', CONFIG.DEBUG.LOG_LEVELS.INFO, hexString);
      return hexString;
    }
  
    /**
     * Unpack GSM-7 bit packed octets into septets
     * @param {number[]} octets - Array of packed octets (8-bit bytes)
     * @returns {number[]} Array of GSM-7 septet values
     */
    function unpackGsm7Octets(octets) {
      Utils.log('Unpacking GSM-7 octets to septets', CONFIG.DEBUG.LOG_LEVELS.DEBUG, octets);
      
      const septets = [];
      let shift = 0;
      let septet = 0;
      let prevByte = 0;
      
      for (let i = 0; i < octets.length; i++) {
        const octet = octets[i];
        
        // Extract bits from current octet
        septet = (octet >> shift) & (0xFF >> shift);
        
        // If not the first octet, combine with bits from previous octet
        if (i > 0) {
          const prevBits = (prevByte << (8 - shift)) & 0x7F;
          septet |= prevBits;
        }
        
        septets.push(septet);
        
        // If we have room for another septet in this octet
        if (shift < 1) {
          shift = (shift + 7) % 8;
        } else {
          // Extract second septet from this octet
          septet = (octet >> shift) & (0xFF >> shift);
          septets.push(septet);
          shift = (shift + 7) % 8;
        }
        
        prevByte = octet;
      }
      
      // The last septet might be invalid if it's partially filled
      if (septets.length > 0 && septets[septets.length - 1] > 127) {
        septets.pop();
      }
      
      Utils.log('Unpacked septets', CONFIG.DEBUG.LOG_LEVELS.DEBUG, septets);
      return septets;
    }
  
    /**
     * Convert GSM-7 septets to text
     * @param {number[]} septets - Array of GSM-7 septet values
     * @returns {string} Decoded text
     */
    function gsm7SeptetsToText(septets) {
      Utils.log('Converting GSM-7 septets to text', CONFIG.DEBUG.LOG_LEVELS.DEBUG);
      
      let text = '';
      let escapeMode = false;
      
      for (let i = 0; i < septets.length; i++) {
        const septet = septets[i];
        
        if (escapeMode) {
          // Handle extended character
          const extChar = gsmExtendedCharsReverse[septet];
          text += extChar || '?';
          escapeMode = false;
        } else if (septet === 27) {
          // ESC character, next septet is part of an extended character
          escapeMode = true;
        } else {
          // Regular GSM character
          const char = gsmAlphabetReverse[septet];
          text += char || '?';
        }
      }
      
      Utils.log('Decoded text from septets', CONFIG.DEBUG.LOG_LEVELS.DEBUG, text);
      return text;
    }
  
    /**
     * Decode GSM-7 bit packed hex string to text
     * @param {string} hexString - Hex string of the packed GSM-7 data
     * @returns {string} Decoded text
     */
    function decodeGsm7(hexString) {
      Utils.log('Decoding GSM-7 hex string', CONFIG.DEBUG.LOG_LEVELS.INFO, hexString);
      
      try {
        // Clean up hex string (remove spaces, etc.)
        hexString = hexString.replace(/\s+/g, '');
        
        if (!Utils.isValidHex(hexString)) {
          throw new Error("Invalid hex string: contains non-hexadecimal characters");
        }
        
        // Convert hex string to octets
        const octets = [];
        for (let i = 0; i < hexString.length; i += 2) {
          if (i + 1 < hexString.length) {
            const octet = parseInt(hexString.substring(i, i + 2), 16);
            octets.push(octet);
          }
        }
        
        // Unpack octets to septets
        const septets = unpackGsm7Octets(octets);
        
        // Convert septets to text
        const text = gsm7SeptetsToText(septets);
        
        Utils.log('Decoded GSM-7 text', CONFIG.DEBUG.LOG_LEVELS.INFO, text);
        return text;
      } catch (error) {
        Utils.log('Error decoding GSM-7', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        throw error;
      }
    }
  
    // Public API
    return {
      encode: encodeGsm7,
      decode: decodeGsm7,
      canEncode: canEncodeAsGsm7
    };
  })();
  
  // Initialize
  Utils.log('GSM7Service initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);