/**
 * UTF-16 encoding and decoding utilities
 * This file handles UTF-16 encoding and decoding for SMS
 */

/**
 * Encode text to UTF-16 hex string
 * @param {string} text - Text to encode
 * @returns {string} Hex string representation of the UTF-16 encoded text
 */
function encodeUTF16(text) {
    let hexString = '';
    
    for (let i = 0; i < text.length; i++) {
        // Get the character code
        const codePoint = text.charCodeAt(i);
        
        // Split into high and low bytes (big-endian format)
        const highByte = (codePoint >> 8) & 0xFF;
        const lowByte = codePoint & 0xFF;
        
        // Convert to hex and append to result
        hexString += highByte.toString(16).padStart(2, '0').toLowerCase();
        hexString += lowByte.toString(16).padStart(2, '0').toLowerCase();
    }
    
    return hexString;
}

/**
 * Decode UTF-16 hex string to text
 * @param {string} hexString - Hex string of the UTF-16 encoded text
 * @returns {string} Decoded text
 */
function decodeUTF16(hexString) {
    // Clean up hex string (remove spaces, etc.)
    hexString = hexString.replace(/\s+/g, '');
    
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
        
        // Convert to character and append to result
        text += String.fromCharCode(codePoint);
    }
    
    return text;
}

// Export the functions for use in other scripts
window.UTF16 = {
    encode: encodeUTF16,
    decode: decodeUTF16
};