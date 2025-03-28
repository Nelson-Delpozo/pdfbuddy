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
                const pdfData = await generatePdfFromTab(tab.id);
                const watermarkedPdf = await createWatermarkedPdf(pdfData, validatedConfig);
                // Download the watermarked PDF
                chrome.downloads.download({
                  url: watermarkedPdf,
                  filename: `${sanitizeString(tab.title)}.pdf`,
                  saveAs: false
                });
              } else {
                // If validation fails, generate without watermark
                await generatePdfFromTab(tab.id);
              }
            } else {
              // If no last watermark, use default
              const defaultConfig = { ...DEFAULT_TEXT_WATERMARK };
              const pdfData = await generatePdfFromTab(tab.id);
              const watermarkedPdf = await createWatermarkedPdf(pdfData, defaultConfig);
              // Download the watermarked PDF
              chrome.downloads.download({
                url: watermarkedPdf,
                filename: `${sanitizeString(tab.title)}.pdf`,
                saveAs: false
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
    
    // Check if we need to apply a watermark
    if (options.useWatermark && options.watermarkConfig) {
      // Validate the watermark configuration
      const validatedConfig = validateWatermarkConfig(options.watermarkConfig);
      if (!validatedConfig) {
        throw new Error('Invalid watermark configuration');
      }
      
      // Generate PDF
      const pdfData = await generatePdfFromTab(tabId, {
        landscape: options.landscape,
        filename: options.filename,
        includeBackground: options.includeBackground,
        scale: options.scale,
        margins: options.margins,
        autoOpen: options.autoOpen
      });
      
      // Apply watermark
      const watermarkedPdf = await createWatermarkedPdf(pdfData, validatedConfig);
      
      // Save this watermark as the last used
      chrome.storage.local.set({ lastWatermark: validatedConfig });
      
      return { success: true, downloadId: watermarkedPdf };
    } else {
      // Generate PDF without watermark
      const downloadId = await generatePdfFromTab(tabId, options);
      return { success: true, downloadId };
    }
  } catch (error) {
    errorHandler.handleError(error);
    return { success: false, error: error.message };
  }
}
