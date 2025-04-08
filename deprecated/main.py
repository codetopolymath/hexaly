#!/usr/bin/env python3
"""
Text-Hex Converter for Various Encodings
Supports:
- GSM 7-bit encoding (unpacked)
- GSM 7-bit encoding packed into 8-bit
- UTF-16 encoding
"""

import argparse
import codecs
import binascii

# GSM 7-bit alphabet (3GPP TS 23.038)
GSM7_BASIC_ALPHABET = (
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
)

# GSM extension table (escape code 0x1B)
GSM7_EXTENSION = {
    0x0A: '\f',  # Form feed
    0x14: '^',   # Caret
    0x28: '{',   # Left curly bracket
    0x29: '}',   # Right curly bracket
    0x2F: '\\',  # Backslash
    0x3C: '[',   # Left square bracket
    0x3D: '~',   # Tilde
    0x3E: ']',   # Right square bracket
    0x40: '|',   # Vertical bar
    0x65: '€',   # Euro sign
}

# Reverse mappings
GSM7_BASIC_REVERSE = {char: i for i, char in enumerate(GSM7_BASIC_ALPHABET)}
GSM7_EXTENSION_REVERSE = {char: code for code, char in GSM7_EXTENSION.items()}

def text_to_gsm7_unpacked(text):
    """Convert text to GSM 7-bit unpacked format (septet per byte)"""
    result = []
    for char in text:
        if char in GSM7_BASIC_REVERSE:
            # Character in basic alphabet
            result.append(GSM7_BASIC_REVERSE[char])
        elif char in GSM7_EXTENSION_REVERSE:
            # Character in extension table - add escape character first
            result.append(0x1B)  # ESC character
            result.append(GSM7_EXTENSION_REVERSE[char])
        else:
            # Character not supported, replace with space
            result.append(GSM7_BASIC_REVERSE[' '])
    return result

def gsm7_unpacked_to_packed(septets):
    """Pack GSM 7-bit septets into octets"""
    if not septets:
        return []
    
    result = []
    shift = 0
    carry = 0
    
    for septet in septets:
        # Mask to ensure 7 bits only
        septet &= 0x7F
        
        # Add bits from current septet to current octet
        octet = carry | (septet << shift)
        result.append(octet & 0xFF)
        
        # Save bits that didn't fit for next octet
        carry = septet >> (8 - shift)
        
        # Update shift for next iteration
        shift = (shift + 7) % 8
        
        # If we completed a cycle, store the final octet
        if shift == 0:
            result.append(carry & 0xFF)
            carry = 0
    
    # Add remaining bits if any
    if shift != 0:
        result[-1] = carry & 0xFF
    
    return result

def decode_gsm7_packed(octets):
    """Decode GSM 7-bit packed octets to text"""
    septets = []
    shift = 0
    septet = 0
    
    for i, octet in enumerate(octets):
        # Extract bits from current octet
        septet |= (octet << shift)
        septets.append(septet & 0x7F)
        septet >>= 7
        
        # Update shift
        shift = (shift + 1) % 7
        
        # Every 7 octets, we get 8 septets
        if shift == 0 and i < len(octets) - 1:
            septets.append(septet & 0x7F)
            septet = 0
    
    # Process special characters
    result = []
    escape = False
    for septet in septets:
        if escape:
            if septet in GSM7_EXTENSION:
                result.append(GSM7_EXTENSION[septet])
            else:
                result.append(' ')  # Unknown extension
            escape = False
        elif septet == 0x1B:
            escape = True
        elif septet < len(GSM7_BASIC_ALPHABET):
            result.append(GSM7_BASIC_ALPHABET[septet])
        else:
            result.append('?')  # Unknown character
    
    return ''.join(result)

def hex_to_bytes(hex_str):
    """Convert hex string to bytes"""
    return binascii.unhexlify(hex_str)

def bytes_to_hex(data):
    """Convert bytes to uppercase hex string"""
    return binascii.hexlify(data).decode('ascii').upper()

def text_to_utf16_hex(text):
    """Convert text to UTF-16 (big endian) hex representation"""
    utf16_bytes = text.encode('utf-16-be')
    return bytes_to_hex(utf16_bytes)

def utf16_hex_to_text(hex_str):
    """Convert UTF-16 (big endian) hex to text"""
    utf16_bytes = hex_to_bytes(hex_str)
    return utf16_bytes.decode('utf-16-be')

def main():
    parser = argparse.ArgumentParser(description='Text/Hex Converter for Various Encodings')
    
    # Mode selection
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--encode', action='store_true', help='Convert text to hex')
    mode_group.add_argument('--decode', action='store_true', help='Convert hex to text')
    
    # Format selection
    parser.add_argument('--format', '-f', choices=['gsm7', 'gsm7-packed', 'utf16'], 
                      required=True, help='Encoding format')
    
    # Input
    parser.add_argument('input', help='Input text or hex string (depending on mode)')
    
    args = parser.parse_args()
    
    # ENCODE: Text to Hex
    if args.encode:
        if args.format == 'gsm7':
            # Text to GSM 7-bit unpacked
            septets = text_to_gsm7_unpacked(args.input)
            bytes_data = bytes(septets)
            print(bytes_to_hex(bytes_data))
            
        elif args.format == 'gsm7-packed':
            # Text to GSM 7-bit packed
            septets = text_to_gsm7_unpacked(args.input)
            octets = gsm7_unpacked_to_packed(septets)
            bytes_data = bytes(octets)
            print(bytes_to_hex(bytes_data))
            
        elif args.format == 'utf16':
            # Text to UTF-16
            print(text_to_utf16_hex(args.input))
    
    # DECODE: Hex to Text
    else:
        # Clean input hex string
        hex_input = args.input.replace(' ', '').upper()
        
        if args.format == 'gsm7':
            # Hex to GSM 7-bit unpacked
            bytes_data = hex_to_bytes(hex_input)
            result = ''
            escape = False
            
            for b in bytes_data:
                if escape:
                    if b in GSM7_EXTENSION:
                        result += GSM7_EXTENSION[b]
                    else:
                        result += ' '  # Unknown extension
                    escape = False
                elif b == 0x1B:
                    escape = True
                elif b < len(GSM7_BASIC_ALPHABET):
                    result += GSM7_BASIC_ALPHABET[b]
                else:
                    result += '?'  # Unknown character
            
            print(result)
            
        elif args.format == 'gsm7-packed':
            # Hex to GSM 7-bit packed
            octets = list(hex_to_bytes(hex_input))
            result = decode_gsm7_packed(octets)
            print(result)
            
        elif args.format == 'utf16':
            # Hex to UTF-16
            print(utf16_hex_to_text(hex_input))

if __name__ == '__main__':
    main()