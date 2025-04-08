/**
 * Tab switching functionality for the SMS Encoding Tool
 */

const TabsUI = (() => {
    // Private members
    let activeTab = 'encode'; // Default active tab
    
    /**
     * Initialize tabs
     * @param {Object} options - Configuration options
     * @param {string} [options.defaultTab='encode'] - Default tab to show
     */
    function init(options = {}) {
      Utils.log('Initializing tabs', CONFIG.DEBUG.LOG_LEVELS.INFO);
      
      const defaultTab = options.defaultTab || 'encode';
      
      // Get all tabs and tab contents
      const tabBtns = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      
      // Set up event listeners for tabs
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabName = btn.getAttribute('data-tab');
          switchToTab(tabName, tabBtns, tabContents);
        });
      });
      
      // Show default tab
      switchToTab(defaultTab, tabBtns, tabContents);
    }
    
    /**
     * Switch to a specific tab
     * @param {string} tabName - Tab identifier
     * @param {NodeList} tabBtns - Tab buttons
     * @param {NodeList} tabContents - Tab content areas
     */
    function switchToTab(tabName, tabBtns, tabContents) {
      Utils.log(`Switching to tab: ${tabName}`, CONFIG.DEBUG.LOG_LEVELS.DEBUG);
      
      // Update active tab button
      tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Update active tab content
      tabContents.forEach(content => {
        if (content.id === tabName) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Update active tab tracking
      activeTab = tabName;
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('tabChanged', { 
        detail: { tab: tabName } 
      }));
    }
    
    /**
     * Get the currently active tab
     * @returns {string} Active tab name
     */
    function getActiveTab() {
      return activeTab;
    }
    
    // Public API
    return {
      init,
      getActiveTab
    };
  })();
  
  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    TabsUI.init();
    Utils.log('TabsUI initialized', CONFIG.DEBUG.LOG_LEVELS.INFO);
  });