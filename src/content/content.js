/**
 * PDF Buddy - Content Script
 * 
 * This script is injected into web pages and handles:
 * - Page preparation for PDF generation
 * - Communication with the background script
 * - DOM manipulation if needed for PDF generation
 */

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'preparePage') {
    preparePage()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error preparing page:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indicates async response
  }
});

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
  return new Promise((resolve) => {
    // Store original styles to restore later if needed
    const originalStyles = storeOriginalStyles();
    
    // Apply print-friendly styles
    applyPrintStyles();
    
    // Ensure all images are loaded
    ensureImagesLoaded()
      .then(() => {
        // Expand any collapsed content that should be visible in the PDF
        expandCollapsedContent();
        
        // Small delay to ensure all DOM changes are complete
        setTimeout(() => {
          resolve();
        }, 500);
      });
  });
}

/**
 * Stores original styles that might be modified during preparation
 * @returns {Object} Object containing original style information
 */
function storeOriginalStyles() {
  // This is a simple implementation that could be expanded
  const styles = {
    bodyOverflow: document.body.style.overflow,
    bodyBackgroundColor: document.body.style.backgroundColor
  };
  
  return styles;
}

/**
 * Applies styles that make the page more suitable for PDF generation
 */
function applyPrintStyles() {
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
  
  // Add any additional print-specific styles
  const style = document.createElement('style');
  style.id = 'pdfbuddy-print-styles';
  style.textContent = `
    @media print {
      /* Ensure all content is visible */
      body, html {
        height: auto !important;
        overflow: visible !important;
      }
      
      /* Hide elements often not needed in PDFs */
      .ad, .advertisement, .banner, .cookie-notice, .popup, 
      [class*="cookie"], [class*="popup"], [id*="cookie"], [id*="popup"] {
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
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Ensures all images on the page are loaded
 * @returns {Promise} A promise that resolves when all images are loaded
 */
function ensureImagesLoaded() {
  return new Promise((resolve) => {
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
        
        // If the image has a data-src attribute (common lazy-loading pattern)
        if (img.dataset.src && !img.src) {
          img.src = img.dataset.src;
        }
      }
    });
    
    // Set a timeout in case some images never load
    setTimeout(resolve, 3000);
  });
}

/**
 * Expands collapsed content that should be visible in the PDF
 */
function expandCollapsedContent() {
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
  
  // Common "read more" patterns
  const readMoreButtons = document.querySelectorAll(
    '[class*="read-more"], [class*="readmore"], [class*="expand"], [id*="read-more"], [id*="readmore"]'
  );
  readMoreButtons.forEach(button => {
    button.click();
  });
  
  // Handle elements with display:none that should be visible in print
  const hiddenElements = document.querySelectorAll('.hidden-content, [class*="hidden-content"]');
  hiddenElements.forEach(el => {
    if (window.getComputedStyle(el).display === 'none') {
      el.style.display = 'block';
    }
  });
}
