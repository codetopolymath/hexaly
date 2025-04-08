/**
 * Simplified GSM-7 encoding and decoding service
 * Just handles direct GSM-7 to hex conversion without 8-bit packing
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
   * Simple encode text to GSM-7 code points and directly convert to hex
   * @param {string} text - Text to encode
   * @returns {string} Hex string representation of GSM-7 code points
   */
  function encodeGsm7(text) {
    Utils.log('Encoding text to GSM-7 hex', CONFIG.DEBUG.LOG_LEVELS.INFO, text);
    
    // Check if all characters can be encoded
    if (!canEncodeAsGsm7(text)) {
      const error = new Error("Text contains characters that cannot be encoded with GSM-7");
      Utils.log(error.message, CONFIG.DEBUG.LOG_LEVELS.ERROR);
      throw error;
    }
    
    let hexString = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let codePoint;
      
      if (char in gsmAlphabet) {
        codePoint = gsmAlphabet[char];
      } else if (char in gsmExtendedChars) {
        // For extended chars, add escape sequence followed by extended char code
        const escHex = gsmAlphabet['\u001B'].toString(16).padStart(2, '0');
        const extHex = gsmExtendedChars[char].toString(16).padStart(2, '0');
        hexString += escHex + extHex;
        continue; // Skip the rest of this iteration
      } else {
        // Character not in GSM-7 alphabet, replace with '?'
        Utils.log(`Replacing unsupported character: ${char}`, CONFIG.DEBUG.LOG_LEVELS.WARN);
        codePoint = gsmAlphabet['?'];
      }
      
      // Convert code point to hex and append to result
      hexString += codePoint.toString(16).padStart(2, '0');
    }
    
    Utils.log('Encoded GSM-7 hex string', CONFIG.DEBUG.LOG_LEVELS.INFO, hexString);
    return hexString;
  }

  /**
   * Simple decode GSM-7 hex values to text
   * @param {string} hexString - Hex string of the GSM-7 code points
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
      
      let text = '';
      let escapeMode = false;
      
      // Process hex codes byte by byte (2 hex characters = 1 byte)
      for (let i = 0; i < hexString.length; i += 2) {
        if (i + 1 < hexString.length) {
          const codePoint = parseInt(hexString.substring(i, i + 2), 16);
          
          if (escapeMode) {
            // Process extended character
            const extChar = gsmExtendedCharsReverse[codePoint];
            text += extChar || '?';
            escapeMode = false;
          } else if (codePoint === 27) {
            // ESC character, next byte is part of an extended character
            escapeMode = true;
          } else {
            // Regular GSM character
            const char = gsmAlphabetReverse[codePoint];
            text += char || '?';
          }
        }
      }
      
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
Utils.log('Simple GSM7Service initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);