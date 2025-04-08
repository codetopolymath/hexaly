/**
 * Main script for SMS Encoding Tool
 * Handles UI interactions and integrates encoding/decoding functions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(btn => btn.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Character count for text input
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('char-count');
    const byteCount = document.getElementById('byte-count');
    
    textInput.addEventListener('input', updateTextStats);
    
    function updateTextStats() {
        const text = textInput.value;
        const encodeType = document.querySelector('input[name="encode-type"]:checked').value;
        
        // Update character count
        charCount.textContent = text.length;
        
        // Update byte count based on encoding
        if (encodeType === 'gsm7') {
            // GSM-7: 7 bits per character, packed into 8-bit bytes
            const septets = text.length;
            const fullBytes = Math.ceil((septets * 7) / 8);
            byteCount.textContent = fullBytes;
        } else if (encodeType === 'utf16') {
            // UTF-16: 2 bytes per character
            byteCount.textContent = text.length * 2;
        }
    }
    
    // Update encoding type display when radio buttons change
    const encodingTypeRadios = document.querySelectorAll('input[name="encode-type"]');
    const encodingTypeDisplay = document.getElementById('encoding-type');
    
    encodingTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'gsm7') {
                encodingTypeDisplay.textContent = 'GSM-7 bit packed';
            } else if (radio.value === 'utf16') {
                encodingTypeDisplay.textContent = 'UTF-16';
            }
            updateTextStats();
        });
    });
    
    // Encode button click handler
    const encodeBtn = document.getElementById('encode-btn');
    const hexOutput = document.getElementById('hex-output');
    
    encodeBtn.addEventListener('click', () => {
        const text = textInput.value;
        const encodeType = document.querySelector('input[name="encode-type"]:checked').value;
        
        try {
            let result = '';
            
            if (encodeType === 'gsm7') {
                // Check if all characters can be encoded with GSM-7
                if (!window.GSM7.canEncode(text)) {
                    showMessage('Text contains characters that cannot be encoded with GSM-7. Try UTF-16 encoding.', 'error');
                    return;
                }
                result = window.GSM7.encode(text);
            } else if (encodeType === 'utf16') {
                result = window.UTF16.encode(text);
            }
            
            hexOutput.value = result;
            showMessage('Text encoded successfully!', 'success');
        } catch (error) {
            showMessage('Error encoding text: ' + error.message, 'error');
        }
    });
    
    // Decode button click handler
    const decodeBtn = document.getElementById('decode-btn');
    const hexInput = document.getElementById('hex-input');
    const textOutput = document.getElementById('text-output');
    
    decodeBtn.addEventListener('click', () => {
        const hexString = hexInput.value.trim();
        const decodeType = document.querySelector('input[name="decode-type"]:checked').value;
        
        // Basic validation
        if (!hexString) {
            showMessage('Please enter a hex string to decode', 'error');
            return;
        }
        
        // Check if input contains only hex characters
        if (!/^[0-9A-Fa-f]*$/.test(hexString)) {
            showMessage('Input contains non-hexadecimal characters', 'error');
            return;
        }
        
        try {
            let result = '';
            
            if (decodeType === 'gsm7') {
                result = window.GSM7.decode(hexString);
            } else if (decodeType === 'utf16') {
                result = window.UTF16.decode(hexString);
            }
            
            textOutput.value = result;
            showMessage('Hex decoded successfully!', 'success');
        } catch (error) {
            showMessage('Error decoding hex: ' + error.message, 'error');
        }
    });
    
    // Copy button handlers
    const copyHexBtn = document.getElementById('copy-hex');
    const copyTextBtn = document.getElementById('copy-text');
    
    copyHexBtn.addEventListener('click', () => {
        copyToClipboard(hexOutput, 'Hex result copied to clipboard!');
    });
    
    copyTextBtn.addEventListener('click', () => {
        copyToClipboard(textOutput, 'Decoded text copied to clipboard!');
    });
    
    // Helper function to copy text to clipboard
    function copyToClipboard(element, successMessage) {
        element.select();
        document.execCommand('copy');
        
        // Deselect the text
        element.setSelectionRange(0, 0);
        
        showMessage(successMessage, 'success');
    }
    
    // Create and show message notifications
    function showMessage(message, type = 'info') {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Add to document
        document.body.appendChild(messageElement);
        
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
        
        // Remove after a delay
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 500);
        }, 3000);
    }
    
    // Add example buttons
    addExampleButtons();
    
    function addExampleButtons() {
        // Create example section in encode tab
        const encodeFormGroup = document.querySelector('#encode .form-group:first-child');
        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'examples';
        exampleDiv.innerHTML = `
            <label>Examples:</label>
            <div class="example-buttons">
                <button class="example-btn" data-text="Your OTP is 12345 on BANKEX for transaction INR 10,000. Valid for 10 minutes only. Do not share with anyone." data-type="gsm7">English SMS</button>
                <button class="example-btn" data-text="आपका OTP 12345 है। कृपया किसी को बांट कया जाए।" data-type="utf16">Hindi SMS</button>
            </div>
        `;
        encodeFormGroup.appendChild(exampleDiv);
        
        // Create example section in decode tab
        const decodeFormGroup = document.querySelector('#decode .form-group:first-child');
        const decodeExampleDiv = document.createElement('div');
        decodeExampleDiv.className = 'examples';
        decodeExampleDiv.innerHTML = `
            <label>Examples:</label>
            <div class="example-buttons">
                <button class="example-btn" data-hex="37d91d6fe7a21c27c154a20134a01ce9439318196cf690010351be0df721b2141049e0122cb164542c66837c1ce430039741872df073b30e18eeb0137e91bef43749827914c42001831b3061630c186bb410030d61b61d3665a10c19adf011072c6061820c36c1a6df013a751974e7221c37c1bedb01177982e8906f110d1badf0110741ce0d3961a39c197430034f71d69d3a21a30c1bef301376f196e5f20b" data-type="gsm7">GSM-7 Example</button>
                <button class="example-btn" data-hex="0906092a0915093e0020004f005400500020003100320033003400350020093909480964002009150943092a092f093e00200915093f0938094000200915094b0020092c093e0902091f00200915092f093e0020091c093e090f0964" data-type="utf16">UTF-16 Example</button>
            </div>
        `;
        decodeFormGroup.appendChild(decodeExampleDiv);
        
        // Style the examples
        const style = document.createElement('style');
        style.textContent = `
            .examples {
                margin-top: 15px;
                border-top: 1px solid #eee;
                padding-top: 15px;
            }
            .example-buttons {
                display: flex;
                gap: 10px;
                margin-top: 8px;
            }
            .example-btn {
                padding: 8px 12px;
                background-color: #f1f1f1;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            .example-btn:hover {
                background-color: #e9e9e9;
                border-color: #ccc;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners to example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.hasAttribute('data-text')) {
                    // Encode example
                    const text = btn.getAttribute('data-text');
                    const type = btn.getAttribute('data-type');
                    
                    textInput.value = text;
                    
                    // Set the correct radio button
                    document.querySelector(`#${type}`).checked = true;
                    
                    // Update stats and encoding type display
                    if (type === 'gsm7') {
                        encodingTypeDisplay.textContent = 'GSM-7 bit packed';
                    } else if (type === 'utf16') {
                        encodingTypeDisplay.textContent = 'UTF-16';
                    }
                    updateTextStats();
                    
                    // Trigger encode button
                    encodeBtn.click();
                } else if (btn.hasAttribute('data-hex')) {
                    // Decode example
                    const hex = btn.getAttribute('data-hex');
                    const type = btn.getAttribute('data-type');
                    
                    hexInput.value = hex;
                    
                    // Set the correct radio button
                    document.querySelector(`#${type}-decode`).checked = true;
                    
                    // Trigger decode button
                    decodeBtn.click();
                }
            });
        });
    }
});