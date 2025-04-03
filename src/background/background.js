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

import { errorHandler, ErrorType, ErrorSeverity } from '../lib/utils/error-handler.js';
import { generatePdfFromCurrentTab, generatePdfFromTab, generatePdfFromUrl } from '../lib/utils/pdf-generator.js';
import { createTextWatermark, createImageWatermark, createWatermarkedPdf } from '../lib/utils/watermark.js';
import { getTemplates, getTemplateById, saveTemplate, updateTemplate, deleteTemplate } from '../lib/utils/template-manager.js';
import { sanitizeString, validateWatermarkConfig } from '../lib/utils/security.js';
import { ensureFeaturePermissions } from '../lib/utils/permissions.js';
import { trackError, trackUIInteraction } from '../lib/utils/analytics.js';
import { WatermarkPosition, WatermarkType, DEFAULT_TEXT_WATERMARK } from '../lib/utils/watermark.js';

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  try {
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

    // Initialize default templates if none exist
    const templates = await getTemplates();
    if (templates.length === 0) {
      // Create default templates
      await saveTemplate('Confidential', {
        ...DEFAULT_TEXT_WATERMARK,
        text: 'CONFIDENTIAL',
        position: WatermarkPosition.CENTER,
        color: '#FF0000',
        rotation: -45
      });
      
      await saveTemplate('Draft', {
        ...DEFAULT_TEXT_WATERMARK,
        text: 'DRAFT',
        position: WatermarkPosition.CENTER,
        color: '#808080',
        rotation: -45
      });
    }
  } catch (error) {
    errorHandler.handleError(error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    trackUIInteraction('context_menu', info.menuItemId);
    
    switch (info.menuItemId) {
      case 'pdfbuddy-save-plain':
        // Generate PDF without watermark
        await generatePdfFromTab(tab.id);
        break;
        
      case 'pdfbuddy-save-watermark':
        // Open popup for watermark configuration
        chrome.action.openPopup();
        break;
        
      case 'pdfbuddy-save-last':
        // Get the last used watermark from storage
        chrome.storage.local.get('lastWatermark', async (result) => {
          try {
            if (result.lastWatermark) {
              // Validate the watermark configuration
              const validatedConfig = validateWatermarkConfig(result.lastWatermark);
              if (validatedConfig) {
                // Generate PDF with the last watermark
                await generatePdfFromTab(tab.id, {
                  useWatermark: true,
                  watermarkConfig: validatedConfig
                });
              } else {
                // If validation fails, generate without watermark
                await generatePdfFromTab(tab.id);
              }
            } else {
              // If no last watermark, use default
              const defaultConfig = { ...DEFAULT_TEXT_WATERMARK };
              await generatePdfFromTab(tab.id, {
                useWatermark: true,
                watermarkConfig: defaultConfig
              });
            }
          } catch (error) {
            errorHandler.handleError(error);
          }
        });
        break;
    }
  } catch (error) {
    errorHandler.handleError(error);
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Track the message action
  trackUIInteraction('message', message.action);
  
  // Handle different message actions
  switch (message.action) {
    case 'captureVisibleTab':
      // Capture the visible tab for full-page PDF generation
      chrome.tabs.captureVisibleTab(null, { format: 'png' })
        .then(imageData => {
          sendResponse({ success: true, imageData });
        })
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'generatePDF':
      handleGeneratePDF(message, sender)
        .then(result => sendResponse(result))
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'getTemplates':
      getTemplates()
        .then(templates => sendResponse({ success: true, templates }))
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'getTemplateById':
      getTemplateById(message.templateId)
        .then(template => sendResponse({ success: true, template }))
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'saveTemplate':
      saveTemplate(message.name, message.watermarkConfig)
        .then(template => sendResponse({ success: true, template }))
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'updateTemplate':
      updateTemplate(message.id, message.name, message.watermarkConfig)
        .then(template => sendResponse({ success: true, template }))
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'deleteTemplate':
      deleteTemplate(message.templateId)
        .then(result => sendResponse({ success: result }))
        .catch(error => {
          errorHandler.handleError(error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'getSettings':
      chrome.storage.sync.get('settings', (result) => {
        sendResponse({ success: true, settings: result.settings || {} });
      });
      return true;
      
    case 'saveSettings':
      chrome.storage.sync.set({ settings: message.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
  }
});

/**
 * Handles the generatePDF message
 * @param {Object} message - The message object
 * @param {Object} sender - The sender object
 * @returns {Promise<Object>} - The result
 */
async function handleGeneratePDF(message, sender) {
  try {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    const options = message.options || {};
    
    // Extract PDF generation options
    const pdfOptions = {
      landscape: options.landscape === true,
      filename: options.filename,
      includeBackground: options.includeBackground !== false,
      scale: typeof options.scale === 'number' ? options.scale : 1.0,
      margins: options.margins || {
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4
      },
      autoOpen: options.autoOpen === true,
      captureFullPage: options.captureFullPage !== false, // Default to true
      pageLayout: options.pageLayout || 'auto', // New option for page layout
      contentFilters: options.contentFilters || { // New option for content filters
        includeImages: true,
        includeBanners: false,
        includeAds: false,
        includeNav: false
      }
    };
    
    // Check if we need to apply a watermark
    if (options.useWatermark) {
      if (options.useLastWatermark) {
        // Get the last used watermark from storage
        const result = await chrome.storage.local.get('lastWatermark');
        if (result.lastWatermark) {
          // Validate the watermark configuration
          const validatedConfig = validateWatermarkConfig(result.lastWatermark);
          if (validatedConfig) {
            // Add watermark config to options
            pdfOptions.useWatermark = true;
            pdfOptions.watermarkConfig = validatedConfig;
          }
        } else {
          // If no last watermark, use default
          pdfOptions.useWatermark = true;
          pdfOptions.watermarkConfig = { ...DEFAULT_TEXT_WATERMARK };
        }
      } else if (options.watermarkConfig) {
        // Validate the watermark configuration
        const validatedConfig = validateWatermarkConfig(options.watermarkConfig);
        if (!validatedConfig) {
          throw new Error('Invalid watermark configuration');
        }
        
        // Save this watermark as the last used
        chrome.storage.local.set({ lastWatermark: validatedConfig });
        
        // Add watermark config to options
        pdfOptions.useWatermark = true;
        pdfOptions.watermarkConfig = validatedConfig;
      }
    }
    
    // Generate PDF with all options
    const downloadId = await generatePdfFromTab(tabId, pdfOptions);
    
    return { success: true, downloadId };
  } catch (error) {
    errorHandler.handleError(error);
    return { success: false, error: error.message };
  }
}

// Listen for progress updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pdfProgress') {
    // Forward progress updates to the popup
    chrome.runtime.sendMessage(message);
    sendResponse({ success: true });
    return true;
  }
});
