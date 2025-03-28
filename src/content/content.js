/**
 * PDF Buddy - Content Script
 * 
 * This script is injected into web pages and handles:
 * - Page preparation for PDF generation
 * - Communication with the background script
 * - DOM manipulation if needed for PDF generation
 */

// Import utilities (note: content scripts can't directly import modules,
// but we're including this for documentation purposes - in a real implementation
// we would need to bundle these with a tool like webpack or rollup)
// const { errorHandler, ErrorSeverity } = chrome.runtime.getBackgroundPage().errorHandler;
// const { trackError } = chrome.runtime.getBackgroundPage().analytics;

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
      preparePage()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('Error preparing page:', error);
          // Report error to background script
          chrome.runtime.sendMessage({
            action: 'reportError',
            error: {
              message: error.message,
              stack: error.stack,
              type: 'content_script',
              context: 'preparePage'
            }
          });
          sendResponse({ success: false, error: error.message });
        });
      return true; // Indicates async response
      
    case 'getPageMetadata':
      try {
        const metadata = getPageMetadata();
        sendResponse({ success: true, metadata });
      } catch (error) {
        console.error('Error getting page metadata:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
      
    default:
      // Unknown action
      sendResponse({ success: false, error: 'Unknown action' });
      return true;
  }
});

/**
 * Gets metadata about the current page
 * @returns {Object} Page metadata
 */
function getPageMetadata() {
  return {
    title: document.title,
    url: window.location.href,
    description: getMetaContent('description'),
    author: getMetaContent('author'),
    keywords: getMetaContent('keywords'),
    timestamp: new Date().toISOString()
  };
}

/**
 * Gets content from a meta tag
 * @param {string} name - The name of the meta tag
 * @returns {string} The content of the meta tag
 */
function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return meta ? meta.getAttribute('content') : '';
}

/**
 * Prepares the page for PDF generation
 * This could include:
 * - Removing unnecessary elements
 * - Adjusting styles for better printing
 * - Handling lazy-loaded images
 * - Expanding collapsed sections
 * @returns {Promise} A promise that resolves when preparation is complete
 */
function preparePage() {
  return new Promise((resolve, reject) => {
    try {
      // Store original styles to restore later if needed
      const originalStyles = storeOriginalStyles();
      
      // Apply print-friendly styles
      applyPrintStyles();
      
      // Ensure all images are loaded
      ensureImagesLoaded()
        .then(() => {
          try {
            // Expand any collapsed content that should be visible in the PDF
            expandCollapsedContent();
            
            // Remove potentially problematic elements
            removeProblematicElements();
            
            // Small delay to ensure all DOM changes are complete
            setTimeout(() => {
              resolve();
            }, 500);
          } catch (error) {
            reject(error);
          }
        })
        .catch(error => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stores original styles that might be modified during preparation
 * @returns {Object} Object containing original style information
 */
function storeOriginalStyles() {
  try {
    // This is a simple implementation that could be expanded
    const styles = {
      bodyOverflow: document.body.style.overflow,
      bodyBackgroundColor: document.body.style.backgroundColor,
      // Store styles of fixed elements
      fixedElements: Array.from(document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]'))
        .map(el => ({
          element: el,
          position: el.style.position,
          top: el.style.top,
          left: el.style.left,
          zIndex: el.style.zIndex
        }))
    };
    
    return styles;
  } catch (error) {
    console.error('Error storing original styles:', error);
    // Return empty object as fallback
    return {};
  }
}

/**
 * Applies styles that make the page more suitable for PDF generation
 */
function applyPrintStyles() {
  try {
    // Ensure the body takes up the full viewport
    document.body.style.overflow = 'visible';
    
    // Ensure there's a white background if none exists
    if (!document.body.style.backgroundColor) {
      document.body.style.backgroundColor = 'white';
    }
    
    // Remove fixed positioning from headers/footers that might overlap content
    const fixedElements = document.querySelectorAll('.header, .footer, [style*="position: fixed"], [style*="position:fixed"]');
    fixedElements.forEach(el => {
      if (el.style.position === 'fixed') {
        el.style.position = 'absolute';
      }
    });
    
    // Remove any existing print styles we might have added
    const existingStyle = document.getElementById('pdfbuddy-print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add any additional print-specific styles
    const style = document.createElement('style');
    style.id = 'pdfbuddy-print-styles';
    style.textContent = `
      @media print {
        /* Ensure all content is visible */
        body, html {
          height: auto !important;
          overflow: visible !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Hide elements often not needed in PDFs */
        .ad, .advertisement, .banner, .cookie-notice, .popup, .modal, .overlay,
        [class*="cookie"], [class*="popup"], [class*="modal"], [class*="overlay"],
        [id*="cookie"], [id*="popup"], [id*="modal"], [id*="overlay"] {
          display: none !important;
        }
        
        /* Ensure text is readable */
        * {
          color: black !important;
          text-shadow: none !important;
        }
        
        /* Ensure backgrounds print */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Ensure links are readable */
        a {
          text-decoration: underline !important;
        }
        
        /* Break avoid for headings */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Ensure images are properly sized */
        img {
          max-width: 100% !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Ensure tables don't get cut off */
        table {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: auto !important;
          break-after: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error applying print styles:', error);
    // Continue without styles as fallback
  }
}

/**
 * Ensures all images on the page are loaded
 * @returns {Promise} A promise that resolves when all images are loaded
 */
function ensureImagesLoaded() {
  return new Promise((resolve) => {
    try {
      // Get all images on the page
      const images = Array.from(document.querySelectorAll('img'));
      
      // If no images, resolve immediately
      if (images.length === 0) {
        resolve();
        return;
      }
      
      // Count loaded images
      let loadedImages = 0;
      
      // Function to check if all images are loaded
      const checkAllImagesLoaded = () => {
        loadedImages++;
        if (loadedImages === images.length) {
          resolve();
        }
      };
      
      // Check each image
      images.forEach(img => {
        // If image is already loaded, increment counter
        if (img.complete) {
          checkAllImagesLoaded();
        } else {
          // Otherwise wait for load event
          img.addEventListener('load', checkAllImagesLoaded);
          img.addEventListener('error', checkAllImagesLoaded); // Count errors as "loaded" to avoid hanging
        }
        
        // Handle lazy-loaded images
        if (img.loading === 'lazy') {
          img.loading = 'eager'; // Force eager loading
          
          // Handle common lazy-loading patterns
          if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
          }
          
          if (img.dataset.lazySrc && !img.src) {
            img.src = img.dataset.lazySrc;
          }
          
          if (img.dataset.originalSrc && !img.src) {
            img.src = img.dataset.originalSrc;
          }
        }
        
        // Handle background images in style attributes
        const bgImage = img.style.backgroundImage;
        if (bgImage && bgImage.includes('url(') && !img.src) {
          const url = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
          if (url) {
            img.src = url;
          }
        }
      });
      
      // Handle background images in other elements
      const elementsWithBgImage = Array.from(document.querySelectorAll('[style*="background-image"]'));
      elementsWithBgImage.forEach(el => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
          const url = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
          if (url) {
            const img = new Image();
            img.src = url;
          }
        }
      });
      
      // Set a timeout in case some images never load
      setTimeout(resolve, 3000);
    } catch (error) {
      console.error('Error ensuring images loaded:', error);
      // Resolve anyway to continue the process
      resolve();
    }
  });
}

/**
 * Expands collapsed content that should be visible in the PDF
 */
function expandCollapsedContent() {
  try {
    // Expand common collapsible elements
    
    // Bootstrap collapse elements
    const bootstrapCollapses = document.querySelectorAll('.collapse');
    bootstrapCollapses.forEach(el => {
      el.classList.add('show');
    });
    
    // Accordion elements
    const accordions = document.querySelectorAll('details');
    accordions.forEach(el => {
      el.setAttribute('open', 'true');
    });
    
    // Common "read more" patterns - safely try to click them
    const readMoreButtons = document.querySelectorAll(
      '[class*="read-more"], [class*="readmore"], [class*="expand"], [id*="read-more"], [id*="readmore"]'
    );
    readMoreButtons.forEach(button => {
      try {
        button.click();
      } catch (error) {
        // Ignore click errors
      }
    });
    
    // Handle elements with display:none that should be visible in print
    const hiddenElements = document.querySelectorAll(
      '.hidden-content, [class*="hidden-content"], [class*="expandable"], [class*="collapsible"]'
    );
    hiddenElements.forEach(el => {
      if (window.getComputedStyle(el).display === 'none') {
        el.style.display = 'block';
      }
    });
    
    // Handle aria-expanded elements
    const expandableElements = document.querySelectorAll('[aria-expanded="false"]');
    expandableElements.forEach(el => {
      el.setAttribute('aria-expanded', 'true');
      
      // Find associated content
      const controls = el.getAttribute('aria-controls');
      if (controls) {
        const controlledElement = document.getElementById(controls);
        if (controlledElement) {
          controlledElement.style.display = 'block';
          controlledElement.style.height = 'auto';
          controlledElement.style.overflow = 'visible';
          controlledElement.style.opacity = '1';
          controlledElement.style.visibility = 'visible';
        }
      }
    });
  } catch (error) {
    console.error('Error expanding collapsed content:', error);
    // Continue without expansion as fallback
  }
}

/**
 * Removes elements that might cause problems in PDF generation
 */
function removeProblematicElements() {
  try {
    // Remove elements that might cause problems
    const problematicSelectors = [
      // Video players
      'video', 'iframe[src*="youtube"]', 'iframe[src*="vimeo"]',
      // Chat widgets
      '[class*="chat-widget"]', '[id*="chat-widget"]', '[class*="livechat"]', '[id*="livechat"]',
      // Feedback widgets
      '[class*="feedback-widget"]', '[id*="feedback-widget"]',
      // Social media widgets
      '[class*="social-widget"]', '[id*="social-widget"]',
      // Cookie banners
      '[class*="cookie-banner"]', '[id*="cookie-banner"]', '[class*="gdpr"]', '[id*="gdpr"]',
      // Notification banners
      '[class*="notification-banner"]', '[id*="notification-banner"]',
      // Sticky elements
      '[class*="sticky-header"]', '[id*="sticky-header"]', '[class*="sticky-footer"]', '[id*="sticky-footer"]'
    ];
    
    const problematicElements = document.querySelectorAll(problematicSelectors.join(', '));
    problematicElements.forEach(el => {
      el.style.display = 'none';
    });
  } catch (error) {
    console.error('Error removing problematic elements:', error);
    // Continue without removal as fallback
  }
}
