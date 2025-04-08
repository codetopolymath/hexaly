/**
 * Main application for SMS Encoding Tool
 * Orchestrates all components and provides global app functionality
 */

const App = (() => {
    /**
     * Initialize the application
     */
    function init() {
      console.log('SMS Encoding Tool starting...');
      
      // Create help/info button
      createInfoButton();
      
      // Set up global event listeners
      setupGlobalEvents();
      
      // Add API integration button if needed
      setupApiIntegration();
      
      // Add example data and templates
      setupExamples();
      
      console.log('SMS Encoding Tool initialized');
    }
    
    /**
     * Set up global event listeners
     */
    function setupGlobalEvents() {
      // Handle keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + E to encode
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
          e.preventDefault();
          if (TabsUI.getActiveTab() === 'encode') {
            FormsUI.handleEncode();
          }
        }
        
        // Ctrl/Cmd + D to decode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault();
          if (TabsUI.getActiveTab() === 'decode') {
            FormsUI.handleDecode();
          }
        }
      });
      
      // Listen for tab changes
      document.addEventListener('tabChanged', (e) => {
        Utils.log(`Tab changed to: ${e.detail.tab}`, CONFIG.DEBUG.LOG_LEVELS.INFO);
      });
    }
    
    /**
     * Create info/help button and modal
     */
    function createInfoButton() {
      // Create info button in header
      const container = document.querySelector('.container');
      const heading = container.querySelector('h1');
      
      if (heading) {
        const infoButton = document.createElement('button');
        infoButton.className = 'info-btn';
        infoButton.innerHTML = '<span>?</span>';
        infoButton.setAttribute('title', 'Help & Information');
        
        // Insert after heading
        heading.appendChild(infoButton);
        
        // Add event listener
        infoButton.addEventListener('click', showInfoModal);
      }
      
      // Create info modal
      const infoModal = document.createElement('div');
      infoModal.className = 'info-modal';
      infoModal.id = 'info-modal';
      
      infoModal.innerHTML = `
        <div class="info-content">
          <span class="close-btn">&times;</span>
          <h2>SMS Encoding Tool Help</h2>
          
          <div class="tabs">
            <button class="info-tab-btn active" data-info-tab="general">General</button>
            <button class="info-tab-btn" data-info-tab="encoding">Encoding</button>
            <button class="info-tab-btn" data-info-tab="gsm7">GSM-7</button>
            <button class="info-tab-btn" data-info-tab="utf16">UTF-16</button>
            <button class="info-tab-btn" data-info-tab="api">API</button>
          </div>
          
          <div class="info-tab-content active" id="general-info">
            <h3>About This Tool</h3>
            <p>This tool helps you encode and decode SMS messages in different formats, primarily for testing and debugging SMS systems.</p>
            
            <h3>Features</h3>
            <ul>
              <li>Encode text messages to hex format</li>
              <li>Decode hex messages back to text</li>
              <li>Support for GSM-7 and UTF-16 encodings</li>
              <li>Character and segment counting</li>
              <li>Debug mode for detailed logging</li>
            </ul>
            
            <h3>Getting Started</h3>
            <p>Choose the <strong>Encode</strong> tab to convert text to hex, or the <strong>Decode</strong> tab to convert hex back to text.</p>
          </div>
          
          <div class="info-tab-content" id="encoding-info">
            <h3>SMS Message Encoding</h3>
            <p>SMS messages can be encoded in different ways depending on the characters used:</p>
            
            <h4>Encoding Types</h4>
            <ul>
              <li><strong>GSM-7</strong>: Used for Latin alphabet (English, etc.). Up to 160 characters per message.</li>
              <li><strong>UTF-16</strong>: Used for non-Latin scripts (Hindi, Arabic, etc.). Up to 70 characters per message.</li>
            </ul>
            
            <h4>Multipart Messages</h4>
            <p>When a message exceeds the character limit, it's split into multiple parts:</p>
            <ul>
              <li>GSM-7: 153 characters per part</li>
              <li>UTF-16: 67 characters per part</li>
            </ul>
            <p>Each part has additional header information, reducing the available characters per part.</p>
          </div>
          
          <div class="info-tab-content" id="gsm7-info">
            <h3>GSM-7 Encoding</h3>
            <p>GSM-7 (also called GSM 03.38) is a 7-bit encoding used for SMS messages with Latin characters.</p>
            
            <h4>Key Features</h4>
            <ul>
              <li>Uses 7 bits per character (packed into 8-bit bytes)</li>
              <li>Supports basic Latin alphabet, numbers, and common symbols</li>
              <li>Limited to a specific character set (no emoji or special symbols)</li>
              <li>Up to 160 characters in a single message</li>
            </ul>
            
            <h4>Extended Characters</h4>
            <p>Some characters require two bytes (escape sequence + character code):</p>
            <ul>
              <li>{ } [ ] ~ \\ | ^ € </li>
            </ul>
            <p>Using extended characters reduces the available message length.</p>
          </div>
          
          <div class="info-tab-content" id="utf16-info">
            <h3>UTF-16 Encoding</h3>
            <p>UTF-16 encoding is used for SMS messages containing non-Latin scripts or symbols not in the GSM-7 alphabet.</p>
            
            <h4>Key Features</h4>
            <ul>
              <li>Uses 16 bits (2 bytes) per character</li>
              <li>Supports all Unicode characters (including emoji, all languages)</li>
              <li>Limited to 70 characters in a single message due to larger size</li>
            </ul>
            
            <h4>When to Use UTF-16</h4>
            <p>Use UTF-16 encoding when:</p>
            <ul>
              <li>Your message contains non-Latin characters (Hindi, Arabic, Chinese, etc.)</li>
              <li>Your message contains emoji or special symbols not in GSM-7 alphabet</li>
              <li>You're unsure if all characters are supported by GSM-7</li>
            </ul>
          </div>
          
          <div class="info-tab-content" id="api-info">
            <h3>SMS Verification API</h3>
            <p>This tool can interact with the SMS Verification API for validating messages.</p>
            
            <h4>API Endpoint</h4>
            <pre>https://smartping-backend.goflipo.com/api/main/verify-scrubbing-logs</pre>
            
            <h4>Key Parameters</h4>
            <ul>
              <li><strong>authcode</strong>: Authentication token</li>
              <li><strong>senderid</strong>: Sender ID of the message</li>
              <li><strong>pe_id</strong>: Platform Entity ID</li>
              <li><strong>number</strong>: Recipient phone number</li>
              <li><strong>content_id</strong>: Content ID</li>
              <li><strong>message_hex</strong>: Hexadecimal representation of the message</li>
              <li><strong>encoding_type</strong>: "0" for GSM-7, "8" for UTF-16</li>
            </ul>
            
            <h4>Multipart Parameters</h4>
            <p>For multipart messages, additional parameters are required:</p>
            <ul>
              <li><strong>message_ref_num</strong>: Reference number linking all parts</li>
              <li><strong>total_segments</strong>: Total number of parts</li>
              <li><strong>segment_seqnum</strong>: Sequence number of this part (starts at 1)</li>
              <li><strong>original_message_length</strong>: Original message length</li>
            </ul>
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(infoModal);
      
      // Add event listeners
      const closeBtn = infoModal.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', hideInfoModal);
      }
      
      // Close when clicking outside the modal
      window.addEventListener('click', (e) => {
        if (e.target === infoModal) {
          hideInfoModal();
        }
      });
      
      // Tab switching in the info modal
      const infoTabBtns = infoModal.querySelectorAll('.info-tab-btn');
      infoTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabName = btn.getAttribute('data-info-tab');
          
          // Update active tab button
          infoTabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update active tab content
          const tabContents = infoModal.querySelectorAll('.info-tab-content');
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-info`) {
              content.classList.add('active');
            }
          });
        });
      });
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .info-btn {
          background: #3498db;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-weight: bold;
          cursor: pointer;
          margin-left: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
        }
        
        .info-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          overflow: auto;
        }
        
        .info-modal.active {
          display: block;
        }
        
        .info-content {
          background-color: white;
          margin: 50px auto;
          padding: 25px;
          width: 80%;
          max-width: 800px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          position: relative;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .close-btn {
          position: absolute;
          top: 15px;
          right: 20px;
          font-size: 28px;
          font-weight: bold;
          color: #aaa;
          cursor: pointer;
        }
        
        .close-btn:hover {
          color: #333;
        }
        
        .info-content h2 {
          margin-top: 0;
          color: #2c3e50;
        }
        
        .info-content h3 {
          color: #3498db;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        
        .info-content h4 {
          color: #555;
          margin-top: 15px;
          margin-bottom: 8px;
        }
        
        .info-content p {
          line-height: 1.6;
          color: #333;
        }
        
        .info-content ul {
          padding-left: 20px;
        }
        
        .info-content li {
          margin-bottom: 5px;
        }
        
        .info-tab-btn {
          padding: 8px 15px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #777;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        
        .info-tab-btn.active {
          color: #3498db;
          border-bottom: 2px solid #3498db;
        }
        
        .info-tab-content {
          display: none;
          padding-top: 15px;
        }
        
        .info-tab-content.active {
          display: block;
        }
        
        .info-content pre {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-family: monospace;
        }
      `;
      document.head.appendChild(style);
    }
    
    /**
     * Show the info modal
     */
    function showInfoModal() {
      const modal = document.getElementById('info-modal');
      if (modal) {
        modal.classList.add('active');
      }
    }
    
    /**
     * Hide the info modal
     */
    function hideInfoModal() {
      const modal = document.getElementById('info-modal');
      if (modal) {
        modal.classList.remove('active');
      }
    }
    
    /**
     * Set up API integration UI if needed
     */
    function setupApiIntegration() {
      // Create API integration tab
      const tabsContainer = document.querySelector('.tabs');
      if (tabsContainer) {
        const apiTabBtn = document.createElement('button');
        apiTabBtn.className = 'tab-btn';
        apiTabBtn.setAttribute('data-tab', 'api');
        apiTabBtn.textContent = 'API Test';
        
        tabsContainer.appendChild(apiTabBtn);
        
        // Create API tab content
        const apiTabContent = document.createElement('div');
        apiTabContent.className = 'tab-content';
        apiTabContent.id = 'api';
        
        apiTabContent.innerHTML = `
          <h2>API Test</h2>
          <div class="form-group">
            <label for="api-text-input">Message Text:</label>
            <textarea id="api-text-input" placeholder="Enter your message text here..."></textarea>
          </div>
          
          <div class="form-group">
            <label>Encoding Type:</label>
            <div class="radio-group">
              <input type="radio" id="api-gsm7" name="api-encode-type" value="gsm7" checked>
              <label for="api-gsm7">GSM-7 (Latin/English)</label>
              
              <input type="radio" id="api-utf16" name="api-encode-type" value="utf16">
              <label for="api-utf16">UTF-16 (Unicode/Hindi)</label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="api-sender-input">Sender ID:</label>
            <input type="text" id="api-sender-input" placeholder="e.g. BANKEX" value="SMSTOOL">
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label for="api-peid-input">PE ID:</label>
              <input type="text" id="api-peid-input" placeholder="Platform Entity ID" value="1501664220000010227">
            </div>
            
            <div class="form-group half">
              <label for="api-number-input">Number:</label>
              <input type="text" id="api-number-input" placeholder="Recipient number" value="9876543210">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label for="api-contentid-input">Content ID:</label>
              <input type="text" id="api-contentid-input" placeholder="Content ID" value="1507167577648640535">
            </div>
            
            <div class="form-group half">
              <label for="api-authcode-input">Auth Code:</label>
              <input type="text" id="api-authcode-input" placeholder="Auth code" value="127a10a9-33d0-423a-9cc6-d705c6eef9a5">
            </div>
          </div>
          
          <div class="form-group">
            <label>Multipart Handling:</label>
            <div class="checkbox-group">
              <input type="checkbox" id="api-multipart" checked>
              <label for="api-multipart">Use multipart messages if needed</label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Test Mode:</label>
            <div class="checkbox-group">
              <input type="checkbox" id="api-mock" checked>
              <label for="api-mock">Use mock API (no actual API calls)</label>
            </div>
          </div>
          
          <button id="api-submit-btn" class="action-btn">Test API</button>
          
          <div class="result-group">
            <div class="result">
              <h3>Result:</h3>
              <div id="api-result-container" class="api-result">
                <p class="placeholder">API test results will appear here...</p>
              </div>
            </div>
          </div>
        `;
        
        // Add to container
        const container = document.querySelector('.container');
        container.appendChild(apiTabContent);
        
        // Add API-specific styles
        const style = document.createElement('style');
        style.textContent = `
          .form-row {
            display: flex;
            gap: 20px;
          }
          
          .form-group.half {
            flex: 1;
          }
          
          input[type="text"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          
          .checkbox-group {
            display: flex;
            align-items: center;
          }
          
          .checkbox-group input {
            margin-right: 8px;
          }
          
          .api-result {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            min-height: 100px;
            font-family: monospace;
            white-space: pre-wrap;
          }
          
          .api-result .placeholder {
            color: #888;
            font-style: italic;
          }
          
          .api-result.success {
            background-color: #d4edda;
            border-color: #c3e6cb;
          }
          
          .api-result.error {
            background-color: #f8d7da;
            border-color: #f5c6cb;
          }
          
          .api-result .dlr-code {
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .api-result .dlr-success {
            color: #155724;
          }
          
          .api-result .dlr-error {
            color: #721c24;
          }
          
          .api-result .dlr-pending {
            color: #856404;
          }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        const apiSubmitBtn = document.getElementById('api-submit-btn');
        if (apiSubmitBtn) {
          apiSubmitBtn.addEventListener('click', handleApiTest);
        }
      }
    }
    
    /**
     * Handle API test submission
     */
    async function handleApiTest() {
      const resultContainer = document.getElementById('api-result-container');
      if (!resultContainer) return;
      
      try {
        // Clear previous results
        resultContainer.innerHTML = '<p>Processing request...</p>';
        resultContainer.className = 'api-result';
        
        // Get form values
        const text = document.getElementById('api-text-input').value;
        const encodingType = document.querySelector('input[name="api-encode-type"]:checked').value === 'gsm7' 
          ? CONFIG.ENCODING.GSM7 
          : CONFIG.ENCODING.UTF16;
        const senderId = document.getElementById('api-sender-input').value;
        const peId = document.getElementById('api-peid-input').value;
        const number = document.getElementById('api-number-input').value;
        const contentId = document.getElementById('api-contentid-input').value;
        const authCode = document.getElementById('api-authcode-input').value;
        const useMultipart = document.getElementById('api-multipart').checked;
        const useMock = document.getElementById('api-mock').checked;
        
        // Validate form
        if (!text) {
          throw new Error('Message text is required');
        }
        
        if (!senderId || !peId || !number || !contentId || !authCode) {
          throw new Error('All fields are required');
        }
        
        // Check if text can be encoded with selected encoding
        if (encodingType === CONFIG.ENCODING.GSM7 && !GSM7Service.canEncode(text)) {
          throw new Error('Text contains characters that cannot be encoded with GSM-7. Try UTF-16 encoding.');
        }
        
        // Prepare message parameters
        const messageParams = APIService.prepareMessageParams({
          text,
          encodingType,
          senderid: senderId,
          pe_id: peId,
          number,
          content_id: contentId,
          authcode: authCode,
          useMultipart
        });
        
        Utils.log('API test message parameters', CONFIG.DEBUG.LOG_LEVELS.INFO, messageParams);
        
        // Process the request (either mock or real)
        let results = [];
        
        if (Array.isArray(messageParams)) {
          // Multipart message
          for (let i = 0; i < messageParams.length; i++) {
            const params = messageParams[i];
            let result;
            
            if (useMock) {
              result = APIService.generateMockResponse(params);
            } else {
              result = await APIService.verifyMessage(params);
            }
            
            results.push({
              segment: i + 1,
              params,
              result
            });
          }
        } else {
          // Single-part message
          let result;
          
          if (useMock) {
            result = APIService.generateMockResponse(messageParams);
          } else {
            result = await APIService.verifyMessage(messageParams);
          }
          
          results.push({
            segment: 1,
            params: messageParams,
            result
          });
        }
        
        // Display results
        displayApiResults(results, resultContainer);
        
      } catch (error) {
        Utils.log('API test error', CONFIG.DEBUG.LOG_LEVELS.ERROR, error);
        
        resultContainer.className = 'api-result error';
        resultContainer.innerHTML = `<div class="dlr-code dlr-error">Error</div><div>${error.message}</div>`;
      }
    }
    
    /**
     * Display API test results
     * @param {Array} results - API test results
     * @param {HTMLElement} container - Result container element
     */
    function displayApiResults(results, container) {
      if (!results || !results.length || !container) return;
      
      const isMultipart = results.length > 1;
      const lastResult = results[results.length - 1].result;
      
      // Determine overall status
      let overallStatus = 'success';
      if (lastResult.dispatch_status === 'FAILED') {
        overallStatus = 'error';
      } else if (lastResult.dispatch_status === 'PENDING') {
        overallStatus = 'pending';
      }
      
      container.className = `api-result ${overallStatus}`;
      
      // Generate result HTML
      let html = '';
      
      if (isMultipart) {
        html += `<div class="dlr-code dlr-${overallStatus}">Multipart Message (${results.length} segments)</div>`;
        
        for (let i = 0; i < results.length; i++) {
          const { segment, result } = results[i];
          
          html += `<div class="segment-result">
            <strong>Segment ${segment}/${results.length}:</strong>
            <div>DLR Code: <span class="dlr-${result.dispatch_status === 'SUCCESS' ? 'success' : result.dispatch_status === 'PENDING' ? 'pending' : 'error'}">${result.dlr_code}</span></div>
            <div>Status: ${result.dispatch_status}</div>
            <div>Description: ${result.description}</div>
          </div>`;
        }
      } else {
        const result = results[0].result;
        
        html += `<div class="dlr-code dlr-${overallStatus}">${result.dlr_code}: ${result.description}</div>
          <div>Status: ${result.dispatch_status}</div>
          <div>Message: ${result.message}</div>`;
      }
      
      // Add technical details in expandable section
      html += `<div class="technical-details">
        <details>
          <summary>Technical Details</summary>
          <pre>${JSON.stringify(results, null, 2)}</pre>
        </details>
      </div>`;
      
      container.innerHTML = html;
    }
    
    /**
     * Set up example data and templates
     */
    function setupExamples() {
      // Add example buttons for encode tab
      addExampleButtons('encode', [
        {
          name: 'English SMS',
          text: 'Your OTP is 12345 on BANKEX for transaction INR 10,000. Valid for 10 minutes only. Do not share with anyone.',
          type: 'gsm7'
        },
        {
          name: 'Hindi SMS',
          text: 'आपका OTP 12345 है। कृपया किसी को बांट कया जाए।',
          type: 'utf16'
        }
      ]);
      
      // Add example buttons for decode tab
      addExampleButtons('decode', [
        {
          name: 'GSM-7 Example',
          hex: '37d91d6fe7a21c27c154a20134a01ce9439318196cf690010351be0df721b2141049e0122cb164542c66837c1ce430039741872df073b30e18eeb0137e91bef43749827914c42001831b3061630c186bb410030d61b61d3665a10c19adf011072c6061820c36c1a6df013a751974e7221c37c1bedb01177982e8906f110d1badf0110741ce0d3961a39c197430034f71d69d3a21a30c1bef301376f196e5f20b',
          type: 'gsm7'
        },
        {
          name: 'UTF-16 Example',
          hex: '0906092a0915093e0020004f005400500020003100320033003400350020093909480964002009150943092a092f093e00200915093f0938094000200915094b0020092c093e0902091f00200915092f093e0020091c093e090f0964',
          type: 'utf16'
        }
      ]);
      
      // Add API test examples
      addApiTestExamples([
        {
          name: 'English OTP',
          text: 'Your OTP is 12345 on BANKEX for transaction INR 10,000. Valid for 10 minutes only. Do not share with anyone.',
          type: 'gsm7',
          sender: 'BANKEX'
        },
        {
          name: 'Hindi OTP',
          text: 'आपका OTP 12345 है। कृपया किसी को बांट कया जाए।',
          type: 'utf16',
          sender: 'BANKEX'
        },
        {
          name: 'Long Message (Multipart)',
          text: 'Confirmation: Your flight AI302 Delhi to Mumbai is confirmed for May 15th, 2025 at 09:30. Please arrive 2 hours before departure and bring your ID and booking reference ABC123. Thank you for choosing our service. We wish you a pleasant journey!',
          type: 'gsm7',
          sender: 'TRAVEL'
        }
      ]);
    }
    
    /**
     * Add example buttons to a specific tab
     * @param {string} tabId - Tab ID ('encode' or 'decode')
     * @param {Array} examples - Array of example objects
     */
    /**
     * Add API test example buttons
     * @param {Array} examples - Array of example objects
     */
    function addApiTestExamples(examples) {
      if (!examples || !examples.length) return;
      
      const apiTab = document.getElementById('api');
      if (!apiTab) return;
      
      const formGroup = apiTab.querySelector('.form-group:first-child');
      if (!formGroup) return;
      
      // Create examples section
      const exampleDiv = document.createElement('div');
      exampleDiv.className = 'examples';
      
      let html = '<label>Test Examples:</label><div class="example-buttons">';
      
      for (const example of examples) {
        html += `<button class="example-btn" 
                  data-text="${example.text.replace(/"/g, '&quot;')}" 
                  data-type="${example.type}"
                  data-sender="${example.sender || 'SMSTOOL'}">${example.name}</button>`;
      }
      
      html += '</div>';
      exampleDiv.innerHTML = html;
      
      // Append to form group
      formGroup.appendChild(exampleDiv);
      
      // Add event listeners
      const buttons = exampleDiv.querySelectorAll('.example-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          Utils.log(`API example button clicked: ${btn.textContent}`, CONFIG.DEBUG.LOG_LEVELS.DEBUG);
          
          const text = btn.getAttribute('data-text');
          const type = btn.getAttribute('data-type');
          const sender = btn.getAttribute('data-sender');
          
          const textInput = document.getElementById('api-text-input');
          const typeRadio = document.querySelector(`#api-${type}`);
          const senderInput = document.getElementById('api-sender-input');
          
          if (textInput) textInput.value = text;
          if (typeRadio) typeRadio.checked = true;
          if (senderInput && sender) senderInput.value = sender;
        });
      });
    }
    
    // Public API
    return {
      init
    };
  })();
  
  // Initialize the application on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });