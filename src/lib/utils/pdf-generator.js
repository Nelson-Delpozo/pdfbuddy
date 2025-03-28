/**
 * PDF Buddy - PDF Generator Utility
 * 
 * This module provides utilities for generating PDFs from web pages.
 */

import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackPdfGeneration, trackError } from './analytics.js';
import { sanitizeString, validateUrl } from './security.js';
import { ensureFeaturePermissions } from './permissions.js';

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
      landscape: pdfOptions.landscape,
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
    
    // Generate the PDF data
    const pdfData = await chrome.tabs.captureTab(tabId, { format: 'png' });
    
    // Download the PDF
    const downloadId = await downloadPdf(pdfData, pdfOptions.filename, pdfOptions.autoOpen);
    
    // Track the PDF generation
    trackPdfGeneration(false, pdfOptions.filename);
    
    return downloadId;
  } catch (error) {
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
  // Validate scale
  if (typeof options.scale !== 'number' || options.scale <= 0 || options.scale > 2) {
    throw new Error('Scale must be a number between 0 and 2');
  }
  
  // Validate margins
  const { margins } = options;
  if (typeof margins !== 'object') {
    throw new Error('Margins must be an object');
  }
  
  if (typeof margins.top !== 'number' || margins.top < 0) {
    throw new Error('Top margin must be a non-negative number');
  }
  
  if (typeof margins.bottom !== 'number' || margins.bottom < 0) {
    throw new Error('Bottom margin must be a non-negative number');
  }
  
  if (typeof margins.left !== 'number' || margins.left < 0) {
    throw new Error('Left margin must be a non-negative number');
  }
  
  if (typeof margins.right !== 'number' || margins.right < 0) {
    throw new Error('Right margin must be a non-negative number');
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
 * @param {string} pdfData - The PDF data as a base64 string
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
        
        resolve(downloadId);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Applies a watermark to a PDF
 * @param {string} pdfData - The PDF data as a base64 string
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {Promise<string>} - The watermarked PDF data
 */
export async function applyWatermarkToPdf(pdfData, watermarkConfig) {
  // This is a placeholder for the watermarking functionality
  // In a real implementation, this would use a PDF manipulation library
  console.warn('Watermarking functionality not yet implemented');
  return pdfData;
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
