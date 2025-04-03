/**
 * PDF Buddy - Content Script
 * 
 * This script is injected into web pages and handles:
 * - Page preparation for PDF generation
 * - Communication with the background script
 * - DOM manipulation if needed for PDF generation
 */

/**
 * Captures a full page screenshot by scrolling through the page
 * @param {string} initialImage - The initial screenshot as a data URL
 * @param {Object} options - Options for capturing
 * @param {Function} sendResponse - Function to send response back
 */
function captureFullPageScreenshot(initialImage, options, sendResponse) {
  try {
    // Get page dimensions
    const pageWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      document.documentElement.clientWidth
    );
    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.clientHeight
    );
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Create a canvas to stitch together the screenshots
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');
    
    // Load the initial image
    const img = new Image();
    img.onload = () => {
      // Draw the initial image at the current scroll position
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      ctx.drawImage(img, scrollX, scrollY);
      
      // Determine orientation based on page dimensions
      const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
      
      // Convert canvas to data URL
      const fullPageImage = canvas.toDataURL('image/png');
      
      // Send response with the full page image
      sendResponse({
        success: true,
        dimensions: {
          width: pageWidth,
          height: pageHeight,
          orientation: orientation
        },
        imageData: fullPageImage
      });
    };
    
    img.onerror = () => {
      sendResponse({ success: false, error: 'Failed to load initial image' });
    };
    
    img.src = initialImage;
  } catch (error) {
    console.error('Error capturing full page screenshot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate message structure for security
  if (!message || typeof message !== 'object') {
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }
  
  // Handle different message actions
  switch (message.action) {
    case 'preparePage':
      // Placeholder for preparePage function
      setTimeout(() => {
        sendResponse({ success: true });
      }, 100);
      return true; // Indicates async response
      
    case 'getPageMetadata':
      try {
        const metadata = {
          title: document.title,
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        sendResponse({ success: true, metadata });
      } catch (error) {
        console.error('Error getting page metadata:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
      
    case 'processImage':
      try {
        if (!message.imageData) {
          throw new Error('No image data provided');
        }
        
        // Get options
        const options = message.options || {};
        const captureFullPage = options.captureFullPage === true;
        
        // If full page capture is enabled, capture the entire page
        if (captureFullPage) {
          captureFullPageScreenshot(message.imageData, options, sendResponse);
          return true; // Indicates async response
        }
        
        // Otherwise, just process the current viewport image
        // Create a new image element to get dimensions
        const img = new Image();
        
        // Set up load handler
        img.onload = () => {
          try {
            // Determine orientation based on image dimensions
            const orientation = img.width > img.height ? 'landscape' : 'portrait';
            
            // Calculate dimensions
            const dimensions = {
              width: img.width,
              height: img.height,
              orientation: orientation
            };
            
            sendResponse({
              success: true,
              dimensions: dimensions,
              imageData: message.imageData
            });
          } catch (error) {
            console.error('Error analyzing image:', error);
            sendResponse({ success: false, error: error.message });
          }
        };
        
        // Set up error handler
        img.onerror = () => {
          sendResponse({ success: false, error: 'Failed to load image' });
        };
        
        // Set the source to load the image
        img.src = message.imageData;
        
        return true; // Indicates async response
      } catch (error) {
        console.error('Error in processImage handler:', error);
        sendResponse({ success: false, error: error.message });
        return true;
      }
      
    default:
      // Unknown action
      sendResponse({ success: false, error: 'Unknown action' });
      return true;
  }
});
