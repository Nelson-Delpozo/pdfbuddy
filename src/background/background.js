/**
 * PDF Buddy - Background Service Worker
 * 
 * This is the central controller for the PDF Buddy extension.
 * It handles:
 * - Context menu creation and management
 * - Communication with content scripts
 * - PDF generation and download
 * - Watermark application
 * - Storage management
 */

// Initialize context menus when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Create main context menu item
  chrome.contextMenus.create({
    id: 'pdfbuddy-save',
    title: 'Save as PDF',
    contexts: ['page']
  });

  // Create submenu items
  chrome.contextMenus.create({
    id: 'pdfbuddy-save-plain',
    parentId: 'pdfbuddy-save',
    title: 'Without Watermark',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'pdfbuddy-save-watermark',
    parentId: 'pdfbuddy-save',
    title: 'With Watermark',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'pdfbuddy-save-last',
    parentId: 'pdfbuddy-save',
    title: 'With Last Watermark',
    contexts: ['page']
  });

  // Initialize storage with default settings if not already set
  chrome.storage.sync.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          defaultWatermarkText: 'CONFIDENTIAL',
          defaultPosition: 'center',
          defaultOpacity: 0.5,
          defaultColor: '#FF0000',
          defaultFontSize: 48,
          defaultFontFamily: 'Arial',
          saveLocation: 'downloads'
        }
      });
    }
  });

  // Initialize templates storage if not already set
  chrome.storage.local.get('templates', (result) => {
    if (!result.templates) {
      chrome.storage.local.set({
        templates: [
          {
            id: 'default-confidential',
            name: 'Confidential',
            type: 'text',
            text: 'CONFIDENTIAL',
            position: 'center',
            opacity: 0.5,
            color: '#FF0000',
            fontSize: 48,
            fontFamily: 'Arial',
            rotation: 0
          },
          {
            id: 'default-draft',
            name: 'Draft',
            type: 'text',
            text: 'DRAFT',
            position: 'center',
            opacity: 0.5,
            color: '#808080',
            fontSize: 48,
            fontFamily: 'Arial',
            rotation: -45
          }
        ]
      });
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'pdfbuddy-save-plain':
      generatePDF(tab.id, { useWatermark: false });
      break;
    case 'pdfbuddy-save-watermark':
      // This will trigger the popup to open for watermark configuration
      chrome.action.openPopup();
      break;
    case 'pdfbuddy-save-last':
      // Get the last used watermark and generate PDF
      chrome.storage.local.get('lastWatermark', (result) => {
        if (result.lastWatermark) {
          generatePDF(tab.id, { 
            useWatermark: true, 
            watermarkConfig: result.lastWatermark 
          });
        } else {
          // If no last watermark, use default
          chrome.storage.sync.get('settings', (settingsResult) => {
            const settings = settingsResult.settings || {};
            const defaultWatermark = {
              type: 'text',
              text: settings.defaultWatermarkText || 'CONFIDENTIAL',
              position: settings.defaultPosition || 'center',
              opacity: settings.defaultOpacity || 0.5,
              color: settings.defaultColor || '#FF0000',
              fontSize: settings.defaultFontSize || 48,
              fontFamily: settings.defaultFontFamily || 'Arial',
              rotation: 0
            };
            
            generatePDF(tab.id, { 
              useWatermark: true, 
              watermarkConfig: defaultWatermark 
            });
          });
        }
      });
      break;
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generatePDF') {
    generatePDF(sender.tab ? sender.tab.id : message.tabId, message.options);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getTemplates') {
    chrome.storage.local.get('templates', (result) => {
      sendResponse({ templates: result.templates || [] });
    });
    return true;
  }
  
  if (message.action === 'saveTemplate') {
    saveTemplate(message.template, sendResponse);
    return true;
  }
  
  if (message.action === 'deleteTemplate') {
    deleteTemplate(message.templateId, sendResponse);
    return true;
  }
  
  if (message.action === 'getSettings') {
    chrome.storage.sync.get('settings', (result) => {
      sendResponse({ settings: result.settings || {} });
    });
    return true;
  }
  
  if (message.action === 'saveSettings') {
    chrome.storage.sync.set({ settings: message.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Generates a PDF from the specified tab
 * @param {number} tabId - The ID of the tab to capture
 * @param {Object} options - Options for PDF generation
 * @param {boolean} options.useWatermark - Whether to apply a watermark
 * @param {Object} options.watermarkConfig - Watermark configuration
 */
function generatePDF(tabId, options = {}) {
  // First, send a message to the content script to prepare the page
  chrome.tabs.sendMessage(tabId, { action: 'preparePage' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script might not be loaded, inject it
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/content.js']
      }, () => {
        // Retry after injecting content script
        setTimeout(() => generatePDF(tabId, options), 100);
      });
      return;
    }
    
    // Capture the visible tab
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing tab:', chrome.runtime.lastError);
        return;
      }
      
      // If watermark is requested, apply it
      if (options.useWatermark && options.watermarkConfig) {
        applyWatermark(dataUrl, options.watermarkConfig, (watermarkedDataUrl) => {
          // Save the watermarked image as PDF
          savePDF(watermarkedDataUrl, tabId);
          
          // Save this watermark as the last used
          chrome.storage.local.set({ lastWatermark: options.watermarkConfig });
        });
      } else {
        // Save the image as PDF without watermark
        savePDF(dataUrl, tabId);
      }
    });
  });
}

/**
 * Applies a watermark to an image
 * @param {string} imageDataUrl - The image data URL
 * @param {Object} watermarkConfig - Watermark configuration
 * @param {Function} callback - Callback function with the watermarked image
 */
function applyWatermark(imageDataUrl, watermarkConfig, callback) {
  // Create an image element to load the captured image
  const img = new Image();
  img.onload = () => {
    // Create a canvas to draw the image and watermark
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    // Apply watermark based on type and configuration
    if (watermarkConfig.type === 'text') {
      applyTextWatermark(ctx, canvas.width, canvas.height, watermarkConfig);
    } else if (watermarkConfig.type === 'image' && watermarkConfig.imageData) {
      applyImageWatermark(ctx, canvas.width, canvas.height, watermarkConfig);
    }
    
    // Convert canvas to data URL and return
    canvas.convertToBlob().then(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };
  img.src = imageDataUrl;
}

/**
 * Applies a text watermark to a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} config - Watermark configuration
 */
function applyTextWatermark(ctx, width, height, config) {
  // Save the current context state
  ctx.save();
  
  // Set watermark properties
  ctx.globalAlpha = config.opacity || 0.5;
  ctx.fillStyle = config.color || '#FF0000';
  ctx.font = `${config.fontSize || 48}px ${config.fontFamily || 'Arial'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate position
  let x = width / 2;
  let y = height / 2;
  
  if (config.position === 'topLeft') {
    x = width * 0.1;
    y = height * 0.1;
    ctx.textAlign = 'left';
  } else if (config.position === 'topRight') {
    x = width * 0.9;
    y = height * 0.1;
    ctx.textAlign = 'right';
  } else if (config.position === 'bottomLeft') {
    x = width * 0.1;
    y = height * 0.9;
    ctx.textAlign = 'left';
  } else if (config.position === 'bottomRight') {
    x = width * 0.9;
    y = height * 0.9;
    ctx.textAlign = 'right';
  }
  
  // Apply rotation if specified
  if (config.rotation) {
    ctx.translate(x, y);
    ctx.rotate(config.rotation * Math.PI / 180);
    x = 0;
    y = 0;
  }
  
  // Draw the text
  ctx.fillText(config.text, x, y);
  
  // Restore the context
  ctx.restore();
}

/**
 * Applies an image watermark to a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} config - Watermark configuration
 */
function applyImageWatermark(ctx, width, height, config) {
  // This is a placeholder for image watermark implementation
  // In the premium version, this will handle image watermarks
  console.log('Image watermarks will be implemented in the premium version');
}

/**
 * Saves an image as PDF
 * @param {string} dataUrl - The image data URL
 * @param {number} tabId - The ID of the tab being captured
 */
function savePDF(dataUrl, tabId) {
  // Get the tab information for filename
  chrome.tabs.get(tabId, (tab) => {
    // Create a filename based on the page title
    const filename = `${tab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    
    // For now, we'll just download the image
    // In a real implementation, we would convert to PDF
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });
  });
}

/**
 * Saves a watermark template
 * @param {Object} template - The template to save
 * @param {Function} callback - Callback function
 */
function saveTemplate(template, callback) {
  chrome.storage.local.get('templates', (result) => {
    const templates = result.templates || [];
    
    // Check if we're updating an existing template
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      // Update existing template
      templates[existingIndex] = template;
    } else {
      // Add new template
      // Check if we're at the limit for free version
      if (templates.length >= 3) {
        // This would be a premium feature
        callback({ success: false, error: 'Template limit reached. Upgrade to premium for unlimited templates.' });
        return;
      }
      
      // Add new template with generated ID if not provided
      if (!template.id) {
        template.id = 'template_' + Date.now();
      }
      templates.push(template);
    }
    
    // Save updated templates
    chrome.storage.local.set({ templates }, () => {
      callback({ success: true, templates });
    });
  });
}

/**
 * Deletes a watermark template
 * @param {string} templateId - The ID of the template to delete
 * @param {Function} callback - Callback function
 */
function deleteTemplate(templateId, callback) {
  chrome.storage.local.get('templates', (result) => {
    let templates = result.templates || [];
    
    // Filter out the template to delete
    templates = templates.filter(t => t.id !== templateId);
    
    // Save updated templates
    chrome.storage.local.set({ templates }, () => {
      callback({ success: true, templates });
    });
  });
}
