/**
 * PDF Buddy - PDF Generator Utility
 * 
 * This module provides utilities for generating PDFs from web pages.
 */

import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackPdfGeneration, trackError } from './analytics.js';
import { sanitizeString, validateUrl } from './security.js';
import { ensureFeaturePermissions } from './permissions.js';
import { 
  createPdfFromImage, 
  addTextWatermarkToPdf, 
  addImageWatermarkToPdf, 
  pdfToDataUrl, 
  pdfToBlob 
} from './pdf-lib.js';

/**
 * PDF generation options
 * @typedef {Object} PdfOptions
 * @property {boolean} [landscape=false] - Whether to use landscape orientation
 * @property {string} [filename] - The filename to use for the PDF
 * @property {boolean} [includeBackground=true] - Whether to include background graphics
 * @property {number} [scale=1.0] - The scale of the PDF
 * @property {Object} [margins] - The margins of the PDF
 * @property {number} [margins.top=0.4] - The top margin in inches
 * @property {number} [margins.bottom=0.4] - The bottom margin in inches
 * @property {number} [margins.left=0.4] - The left margin in inches
 * @property {number} [margins.right=0.4] - The right margin in inches
 * @property {boolean} [autoOpen=false] - Whether to automatically open the PDF after generation
 */

/**
 * Default PDF options
 */
const DEFAULT_PDF_OPTIONS = {
  landscape: false,
  includeBackground: true,
  scale: 1.0,
  margins: {
    top: 0.4,
    bottom: 0.4,
    left: 0.4,
    right: 0.4
  },
  autoOpen: false
};

/**
 * Generates a PDF from the current tab
 * @param {PdfOptions} options - PDF generation options
 * @returns {Promise<string>} - The download ID of the PDF
 */
export async function generatePdfFromCurrentTab(options = {}) {
  try {
    // Ensure we have the necessary permissions
    const hasPermissions = await ensureFeaturePermissions('PDF_GENERATION');
    if (!hasPermissions) {
      throw errorHandler.createPermissionError(
        'PDF generation requires additional permissions',
        ErrorSeverity.ERROR
      );
    }
    
    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw errorHandler.createPDFGenerationError(
        'No active tab found',
        ErrorSeverity.ERROR
      );
    }
    
    // Generate the PDF
    return generatePdfFromTab(tab.id, options);
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to generate PDF from current tab: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'current_tab_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Generates a PDF from a specific tab
 * @param {number} tabId - The ID of the tab to generate a PDF from
 * @param {PdfOptions} options - PDF generation options
 * @returns {Promise<string>} - The download ID of the PDF
 */
export async function generatePdfFromTab(tabId, options = {}) {
  try {
    // Merge options with defaults
    const pdfOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
    
    // Validate options
    validatePdfOptions(pdfOptions);
    
    // Generate a filename if not provided
    if (!pdfOptions.filename) {
      const tab = await chrome.tabs.get(tabId);
      pdfOptions.filename = generateFilename(tab.title);
    }
    
    // Prepare print settings
    const printSettings = {
      landscape: pdfOptions.landscape || pdfOptions.pageLayout === 'landscape',
      displayHeaderFooter: false,
      printBackground: pdfOptions.includeBackground,
      scale: pdfOptions.scale,
      paperWidth: 8.5, // Letter size
      paperHeight: 11,
      marginTop: pdfOptions.margins.top,
      marginBottom: pdfOptions.margins.bottom,
      marginLeft: pdfOptions.margins.left,
      marginRight: pdfOptions.margins.right,
      pageRanges: '',
      headerTemplate: '',
      footerTemplate: '',
      preferCSSPageSize: true
    };
    
    // Prepare the page for PDF generation
    await preparePageForPdf(tabId);
    
    // Capture the visible tab as an image
    const imageData = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Process the image in the content script to get dimensions and apply filters
    const imageInfo = await processImageInContentScript(tabId, imageData, {
      pageLayout: pdfOptions.pageLayout || (pdfOptions.landscape ? 'landscape' : 'portrait'),
      contentFilters: pdfOptions.contentFilters || {},
      captureFullPage: pdfOptions.captureFullPage === true // Default to false (current screen only)
    });
    
    // Check if we have paginated images
    if (imageInfo.isPaginated && imageInfo.pages) {
      // Create a PDF for each page
      const pdfs = [];
      
      // Send progress update
      chrome.tabs.sendMessage(tabId, {
        action: 'pdfProgress',
        progress: 'Creating PDF pages...',
        complete: false
      });
      
      // Create a PDF for each page
      for (let i = 0; i < imageInfo.pages.length; i++) {
        // Send progress update
        chrome.tabs.sendMessage(tabId, {
          action: 'pdfProgress',
          progress: `Creating PDF page ${i + 1}/${imageInfo.pages.length}...`,
          complete: false
        });
        
        // Create PDF from this page
        const pdf = await createPdfFromImage(
          imageInfo.pages[i],
          imageInfo.dimensions,
          {
            orientation: imageInfo.dimensions.orientation
          }
        );
        
        // Apply watermark if needed
        if (pdfOptions.useWatermark && pdfOptions.watermarkConfig) {
          if (pdfOptions.watermarkConfig.type === 'text') {
            addTextWatermarkToPdf(pdf, pdfOptions.watermarkConfig);
          } else if (pdfOptions.watermarkConfig.type === 'image') {
            addImageWatermarkToPdf(pdf, pdfOptions.watermarkConfig);
          }
        }
        
        pdfs.push(pdf);
      }
      
      // Merge PDFs
      const mergedPdf = pdfs[0]; // Start with the first PDF
      
      // Add all other pages to the first PDF
      for (let i = 1; i < pdfs.length; i++) {
        // Get the raw data from the other PDFs
        const pdfData = pdfs[i].output('arraybuffer');
        
        // Add the pages from the other PDF to the first PDF
        const pdfPages = pdfs[i].getNumberOfPages();
        for (let j = 1; j <= pdfPages; j++) {
          // Add the page from the other PDF
          mergedPdf.addPage(pdfs[i].getPage(j));
        }
      }
      
      // Send progress update
      chrome.tabs.sendMessage(tabId, {
        action: 'pdfProgress',
        progress: 'Finalizing PDF...',
        complete: false
      });
      
      // Convert PDF to data URL
      const pdfDataUrl = pdfToDataUrl(mergedPdf);
      
      // Download the PDF
      const downloadId = await downloadPdf(pdfDataUrl, pdfOptions.filename, pdfOptions.autoOpen);
      
      // Track the PDF generation
      trackPdfGeneration(false, pdfOptions.filename);
      
      // Send completion update
      chrome.tabs.sendMessage(tabId, {
        action: 'pdfProgress',
        progress: 'PDF generation complete!',
        complete: true
      });
      
      return downloadId;
    } else {
      // Convert the image to a PDF using the processed dimensions
      const pdf = await createPdfFromImage(
        imageInfo.imageData, 
        imageInfo.dimensions, 
        {
          orientation: imageInfo.dimensions.orientation
        }
      );
      
      // Apply watermark if needed
      if (pdfOptions.useWatermark && pdfOptions.watermarkConfig) {
        if (pdfOptions.watermarkConfig.type === 'text') {
          addTextWatermarkToPdf(pdf, pdfOptions.watermarkConfig);
        } else if (pdfOptions.watermarkConfig.type === 'image') {
          addImageWatermarkToPdf(pdf, pdfOptions.watermarkConfig);
        }
      }
      
      // Convert PDF to data URL
      const pdfDataUrl = pdfToDataUrl(pdf);
      
      // Download the PDF
      const downloadId = await downloadPdf(pdfDataUrl, pdfOptions.filename, pdfOptions.autoOpen);
      
      // Track the PDF generation
      trackPdfGeneration(false, pdfOptions.filename);
      
      // Send completion update
      chrome.tabs.sendMessage(tabId, {
        action: 'pdfProgress',
        progress: 'PDF generation complete!',
        complete: true
      });
      
      return downloadId;
    }
  } catch (error) {
    // Send error update
    try {
      chrome.tabs.sendMessage(tabId, {
        action: 'pdfProgress',
        progress: `Error: ${error.message}`,
        complete: true
      });
    } catch (e) {
      // Ignore errors sending message
    }
    
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to generate PDF from tab ${tabId}: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'tab_failed', { tabId, error: error.message });
    throw pdfError;
  }
}

/**
 * Generates a PDF from a URL
 * @param {string} url - The URL to generate a PDF from
 * @param {PdfOptions} options - PDF generation options
 * @returns {Promise<string>} - The download ID of the PDF
 */
export async function generatePdfFromUrl(url, options = {}) {
  try {
    // Validate URL
    if (!validateUrl(url)) {
      throw new Error('Invalid URL');
    }
    
    // Create a new tab with the URL
    const tab = await chrome.tabs.create({ url, active: false });
    
    // Wait for the tab to load
    await new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
    
    // Generate the PDF
    const downloadId = await generatePdfFromTab(tab.id, options);
    
    // Close the tab
    await chrome.tabs.remove(tab.id);
    
    return downloadId;
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to generate PDF from URL ${url}: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'url_failed', { url, error: error.message });
    throw pdfError;
  }
}

/**
 * Validates PDF options
 * @param {PdfOptions} options - The options to validate
 * @throws {Error} - If the options are invalid
 */
function validatePdfOptions(options) {
  // Ensure options is an object
  if (!options || typeof options !== 'object') {
    throw new Error('PDF options must be an object');
  }

  // Validate scale - ensure it's a number between 0 and 2
  if (typeof options.scale !== 'number') {
    options.scale = 1.0; // Set default if not a number
  } else if (options.scale <= 0 || options.scale > 2) {
    throw new Error('Scale must be a number between 0 and 2');
  }
  
  // Ensure margins is an object
  if (!options.margins || typeof options.margins !== 'object') {
    options.margins = {
      top: 0.4,
      bottom: 0.4,
      left: 0.4,
      right: 0.4
    };
  } else {
    // Validate individual margins
    if (typeof options.margins.top !== 'number' || options.margins.top < 0) {
      options.margins.top = 0.4;
    }
    
    if (typeof options.margins.bottom !== 'number' || options.margins.bottom < 0) {
      options.margins.bottom = 0.4;
    }
    
    if (typeof options.margins.left !== 'number' || options.margins.left < 0) {
      options.margins.left = 0.4;
    }
    
    if (typeof options.margins.right !== 'number' || options.margins.right < 0) {
      options.margins.right = 0.4;
    }
  }
  
  // Validate filename if provided
  if (options.filename && typeof options.filename !== 'string') {
    throw new Error('Filename must be a string');
  }
}

/**
 * Generates a filename for a PDF based on a page title
 * @param {string} title - The title of the page
 * @returns {string} - The generated filename
 */
function generateFilename(title) {
  // Sanitize the title
  const sanitizedTitle = sanitizeString(title || 'Untitled');
  
  // Replace invalid filename characters
  const validFilename = sanitizedTitle
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100); // Limit length
  
  // Add date and time
  const date = new Date();
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return `${validFilename}_${dateString}.pdf`;
}

/**
 * Downloads a PDF
 * @param {string} pdfData - The PDF data as a blob URL or base64 string
 * @param {string} filename - The filename to use
 * @param {boolean} autoOpen - Whether to automatically open the PDF
 * @returns {Promise<string>} - The download ID
 */
async function downloadPdf(pdfData, filename, autoOpen = false) {
  return new Promise((resolve, reject) => {
    try {
      chrome.downloads.download({
        url: pdfData,
        filename,
        saveAs: false
      }, downloadId => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (autoOpen) {
          // Check if we have the permission to open downloads
          chrome.permissions.contains({
            permissions: ['downloads.open']
          }, hasPermission => {
            if (hasPermission) {
              chrome.downloads.open(downloadId);
            }
          });
        }
        
        // Revoke the blob URL to free up memory
        if (pdfData.startsWith('blob:')) {
          URL.revokeObjectURL(pdfData);
        }
        
        resolve(downloadId);
      });
    } catch (error) {
      // Revoke the blob URL in case of error
      if (pdfData.startsWith('blob:')) {
        URL.revokeObjectURL(pdfData);
      }
      reject(error);
    }
  });
}

/**
 * Applies a watermark to a PDF
 * @param {Blob} pdfData - The PDF data as a Blob
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {Promise<string>} - The watermarked PDF data as a data URL
 */
export async function applyWatermarkToPdf(pdfData, watermarkConfig) {
  try {
    // Convert Blob to data URL
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(pdfData);
    });
    
    // Create a PDF from the data URL
    // Since we're in the background script, we can't use the Image object
    // So we'll use a default dimensions object
    const defaultDimensions = {
      width: 800,
      height: 1000,
      orientation: 'portrait'
    };
    
    const pdf = await createPdfFromImage(dataUrl, defaultDimensions, {
      orientation: 'portrait' // Default orientation
    });
    
    // Apply watermark based on type
    if (watermarkConfig.type === 'text') {
      addTextWatermarkToPdf(pdf, watermarkConfig);
    } else if (watermarkConfig.type === 'image') {
      addImageWatermarkToPdf(pdf, watermarkConfig);
    }
    
    // Convert PDF to data URL
    return pdfToDataUrl(pdf);
  } catch (error) {
    const watermarkError = errorHandler.createWatermarkError(
      `Failed to apply watermark to PDF: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(watermarkError);
    throw watermarkError;
  }
}

/**
 * Gets the status of a download
 * @param {string} downloadId - The download ID
 * @returns {Promise<chrome.downloads.DownloadItem>} - The download status
 */
export async function getDownloadStatus(downloadId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.downloads.search({ id: downloadId }, downloads => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (downloads.length === 0) {
          reject(new Error(`Download ${downloadId} not found`));
          return;
        }
        
        resolve(downloads[0]);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Cancels a download
 * @param {string} downloadId - The download ID
 * @returns {Promise<void>}
 */
export async function cancelDownload(downloadId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.downloads.cancel(downloadId, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Prepares a page for PDF generation
 * @param {number} tabId - The ID of the tab to prepare
 * @returns {Promise<void>} - A promise that resolves when the page is prepared
 */
async function preparePageForPdf(tabId) {
  return new Promise((resolve, reject) => {
    try {
      // Send a message to the content script to prepare the page
      chrome.tabs.sendMessage(
        tabId,
        {
          action: 'preparePage'
        },
        response => {
          if (chrome.runtime.lastError) {
            // Handle case where content script is not ready or not available
            console.warn('Content script error:', chrome.runtime.lastError.message);
            // Resolve anyway to continue with PDF generation
            resolve();
            return;
          }
          
          if (!response || !response.success) {
            console.warn('Page preparation failed:', response?.error || 'Unknown error');
            // Resolve anyway to continue with PDF generation
            resolve();
            return;
          }
          
          // Page preparation successful
          resolve();
        }
      );
    } catch (error) {
      console.error('Error sending message to content script:', error);
      // Resolve anyway to continue with PDF generation
      resolve();
    }
  });
}

/**
 * Processes an image in the content script to get dimensions
 * @param {number} tabId - The ID of the tab to process the image in
 * @param {string} imageData - The image data as a data URL
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - A promise that resolves with image information
 */
async function processImageInContentScript(tabId, imageData, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Send a message to the content script to process the image
      chrome.tabs.sendMessage(
        tabId,
        {
          action: 'processImage',
          imageData: imageData,
          options: options
        },
        response => {
          if (chrome.runtime.lastError) {
            // Handle case where content script is not ready or not available
            console.warn('Content script error:', chrome.runtime.lastError.message);
            // Fallback to using the image data without dimensions
            resolve({
              imageData: imageData,
              dimensions: {
                width: 0,
                height: 0,
                orientation: options.orientation || 'portrait'
              }
            });
            return;
          }
          
          if (!response || !response.success) {
            console.warn('Image processing failed:', response?.error || 'Unknown error');
            // Fallback to using the image data without dimensions
            resolve({
              imageData: imageData,
              dimensions: {
                width: 0,
                height: 0,
                orientation: options.orientation || 'portrait'
              }
            });
            return;
          }
          
          // Return the processed image information
          resolve({
            imageData: response.imageData,
            dimensions: response.dimensions
          });
        }
      );
    } catch (error) {
      console.error('Error sending message to content script:', error);
      // Fallback to using the image data without dimensions
      resolve({
        imageData: imageData,
        dimensions: {
          width: 0,
          height: 0,
          orientation: options.orientation || 'portrait'
        }
      });
    }
  });
}
