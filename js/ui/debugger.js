/**
 * Debug mode functionality for the SMS Encoding Tool
 */

const DebuggerUI = (() => {
    /**
     * Initialize debug mode
     */
    function init() {
      Utils.log('Initializing debugger', CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      // Create the debug toggle button
      createDebugToggle();
      
      // Create debug panel
      createDebugPanel();
      
      // Set initial state from localStorage if available
      const savedDebugState = localStorage.getItem('smsEncoderDebugEnabled');
      if (savedDebugState === 'true') {
        enableDebugMode();
      }
    }
    
    /**
     * Create debug toggle button
     */
    function createDebugToggle() {
      const container = document.querySelector('.container');
      if (!container) return;
      
      // Create debug mode toggle
      const debugToggle = document.createElement('div');
      debugToggle.className = 'debug-toggle';
      debugToggle.innerHTML = `
        <label class="debug-switch">
          <input type="checkbox" id="debug-mode-toggle">
          <span class="slider"></span>
          <span class="label">Debug Mode</span>
        </label>
      `;
      
      // Insert after the tabs
      const tabs = document.querySelector('.tabs');
      if (tabs && tabs.nextSibling) {
        container.insertBefore(debugToggle, tabs.nextSibling);
      } else {
        container.appendChild(debugToggle);
      }
      
      // Add event listener
      const checkbox = document.getElementById('debug-mode-toggle');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            enableDebugMode();
          } else {
            disableDebugMode();
          }
        });
      }
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .debug-toggle {
          display: flex;
          justify-content: flex-end;
          padding: 10px 0;
        }
        .debug-switch {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .debug-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
          background-color: #ccc;
          border-radius: 20px;
          transition: .4s;
          margin-right: 8px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          border-radius: 50%;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #3498db;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .label {
          font-size: 14px;
          color: #555;
        }
        .debug-panel {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-top: 10px;
          padding: 15px;
          display: none;
        }
        .debug-panel.active {
          display: block;
        }
        .debug-section {
          margin-bottom: 15px;
        }
        .debug-section h4 {
          margin-bottom: 8px;
          color: #333;
        }
        .debug-log {
          max-height: 200px;
          overflow-y: auto;
          background-color: #222;
          color: #fff;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }
        .log-entry {
          margin-bottom: 5px;
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
        }
        .log-entry.info { color: #8ad4ff; }
        .log-entry.debug { color: #98c379; }
        .log-entry.warn { color: #e5c07b; }
        .log-entry.error { color: #e06c75; }
      `;
      document.head.appendChild(style);
    }
    
    /**
     * Create debug panel
     */
    function createDebugPanel() {
      const container = document.querySelector('.container');
      if (!container) return;
      
      // Create debug panel
      const debugPanel = document.createElement('div');
      debugPanel.className = 'debug-panel';
      debugPanel.id = 'debug-panel';
      
      debugPanel.innerHTML = `
        <div class="debug-section">
          <h4>Console Log</h4>
          <div class="debug-log" id="debug-log"></div>
        </div>
        <div class="debug-section">
          <h4>Actions</h4>
          <button id="clear-log-btn" class="action-btn">Clear Log</button>
        </div>
      `;
      
      // Append to container
      container.appendChild(debugPanel);
      
      // Add event listeners
      const clearLogBtn = document.getElementById('clear-log-btn');
      if (clearLogBtn) {
        clearLogBtn.addEventListener('click', clearDebugLog);
      }
      
      // Override console methods to capture logs
      setupConsoleOverride();
    }
    
    /**
     * Override console methods to capture logs in debug panel
     */
    function setupConsoleOverride() {
      // Save original console methods
      const originalConsole = {
        log: console.log,
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
      };
      
      // Override console methods
      console.log = function() {
        // Call original method
        originalConsole.log.apply(console, arguments);
        // Add to debug panel if it's enabled
        if (CONFIG.DEBUG.ENABLED) {
          addLogEntry('info', Array.from(arguments));
        }
      };
      
      console.debug = function() {
        originalConsole.debug.apply(console, arguments);
        if (CONFIG.DEBUG.ENABLED) {
          addLogEntry('debug', Array.from(arguments));
        }
      };
      
      console.info = function() {
        originalConsole.info.apply(console, arguments);
        if (CONFIG.DEBUG.ENABLED) {
          addLogEntry('info', Array.from(arguments));
        }
      };
      
      console.warn = function() {
        originalConsole.warn.apply(console, arguments);
        if (CONFIG.DEBUG.ENABLED) {
          addLogEntry('warn', Array.from(arguments));
        }
      };
      
      console.error = function() {
        originalConsole.error.apply(console, arguments);
        if (CONFIG.DEBUG.ENABLED) {
          addLogEntry('error', Array.from(arguments));
        }
      };
    }
    
    /**
     * Add a log entry to the debug panel
     * @param {string} level - Log level (info, debug, warn, error)
     * @param {Array} args - Log arguments
     */
    function addLogEntry(level, args) {
      const debugLog = document.getElementById('debug-log');
      if (!debugLog) return;
      
      // Create log entry
      const entry = document.createElement('div');
      entry.className = `log-entry ${level}`;
      
      // Create timestamp
      const timestamp = new Date().toISOString();
      
      // Format arguments
      const formattedArgs = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      // Set content
      entry.textContent = `[${timestamp}] [${level.toUpperCase()}] ${formattedArgs}`;
      
      // Add to log
      debugLog.appendChild(entry);
      
      // Scroll to bottom
      debugLog.scrollTop = debugLog.scrollHeight;
    }
    
    /**
     * Clear the debug log
     */
    function clearDebugLog() {
      const debugLog = document.getElementById('debug-log');
      if (debugLog) {
        debugLog.innerHTML = '';
      }
    }
    
    /**
     * Enable debug mode
     */
    function enableDebugMode() {
      Utils.log('Enabling debug mode', CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      // Update config
      CONFIG.DEBUG.ENABLED = true;
      
      // Update checkbox
      const checkbox = document.getElementById('debug-mode-toggle');
      if (checkbox) {
        checkbox.checked = true;
      }
      
      // Show debug panel
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        debugPanel.classList.add('active');
      }
      
      // Save state to localStorage
      localStorage.setItem('smsEncoderDebugEnabled', 'true');
      
      // Add debug class to body
      document.body.classList.add('debug-mode');
      
      // Log initial debug information
      logSystemInfo();
    }
    
    /**
     * Disable debug mode
     */
    function disableDebugMode() {
      Utils.log('Disabling debug mode', CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      // Update config
      CONFIG.DEBUG.ENABLED = false;
      
      // Update checkbox
      const checkbox = document.getElementById('debug-mode-toggle');
      if (checkbox) {
        checkbox.checked = false;
      }
      
      // Hide debug panel
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        debugPanel.classList.remove('active');
      }
      
      // Save state to localStorage
      localStorage.setItem('smsEncoderDebugEnabled', 'false');
      
      // Remove debug class from body
      document.body.classList.remove('debug-mode');
    }
    
    /**
     * Log system information
     */
    function logSystemInfo() {
      if (!CONFIG.DEBUG.ENABLED) return;
      
      console.log('🔍 Debug mode enabled');
      console.log('🌐 User Agent:', navigator.userAgent);
      console.log('⚙️ Encoding Tool Version: 1.0.0');
      console.log('📱 Screen Size:', window.innerWidth + 'x' + window.innerHeight);
      
      // Log encoding capabilities
      const testString = 'Testing GSM-7 encoding capability';
      console.log('🔤 GSM-7 Encoding Test:', GSM7Service.canEncode(testString) ? 'Supported' : 'Not Supported');
      
      // Log browser capabilities
      console.log('💾 LocalStorage:', typeof localStorage !== 'undefined' ? 'Available' : 'Not Available');
      console.log('📋 Clipboard API:', typeof navigator.clipboard !== 'undefined' ? 'Available' : 'Not Available');
      
      // Add information about initialization time
      console.log('⏱️ Debug Mode Initialized:', new Date().toISOString());
    }
    
    /**
     * Export debug log to a file
     */
    function exportDebugLog() {
      const debugLog = document.getElementById('debug-log');
      if (!debugLog) return;
      
      // Get log content
      const logContent = debugLog.innerText;
      
      // Create blob
      const blob = new Blob([logContent], { type: 'text/plain' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sms-encoder-debug-log-${new Date().toISOString().replace(/:/g, '-')}.txt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('Debug log exported to file');
    }
    
    // Public API
    return {
      init,
      enableDebugMode,
      disableDebugMode,
      clearDebugLog,
      exportDebugLog
    };
  })();
  
  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    DebuggerUI.init();
    Utils.log('DebuggerUI initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);
  });