/**
 * PDF Buddy - Debugger Utility
 * 
 * This module provides utilities for using the Chrome debugger API
 * to generate PDFs from web pages.
 */

import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackError } from './analytics.js';

/**
 * PDF generation options
 * @typedef {Object} DebuggerPdfOptions
 * @property {boolean} [landscape=false] - Whether to use landscape orientation
 * @property {boolean} [printBackground=true] - Whether to include background graphics
 * @property {number} [scale=1.0] - The scale of the PDF
 * @property {number} [paperWidth=8.27] - The paper width in inches (default: A4)
 * @property {number} [paperHeight=11.69] - The paper height in inches (default: A4)
 * @property {number} [marginTop=0] - The top margin in inches
 * @property {number} [marginBottom=0] - The bottom margin in inches
 * @property {number} [marginLeft=0] - The left margin in inches
 * @property {number} [marginRight=0] - The right margin in inches
 * @property {string} [pageRanges=''] - The page ranges to print
 * @property {boolean} [preferCSSPageSize=true] - Whether to prefer page size as defined by CSS
 */

/**
 * Default PDF options
 */
const DEFAULT_PDF_OPTIONS = {
  landscape: false,
  printBackground: true,
  scale: 1.0,
  paperWidth: 8.27, // A4 width in inches
  paperHeight: 11.69, // A4 height in inches
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  pageRanges: '',
  preferCSSPageSize: true
};

/**
 * Attaches the debugger to a tab
 * @param {number} tabId - The ID of the tab to attach to
 * @returns {Promise<void>} - A promise that resolves when the debugger is attached
 */
export async function attachDebugger(tabId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.debugger.attach({ tabId }, '1.3', () => {
        if (chrome.runtime.lastError) {
          const error = errorHandler.createPDFGenerationError(
            `Failed to attach debugger: ${chrome.runtime.lastError.message}`,
            ErrorSeverity.ERROR
          );
          trackError('pdf_generation', 'debugger_attach_failed', { 
            tabId, 
            error: chrome.runtime.lastError.message 
          });
          reject(error);
          return;
        }
        
        resolve();
      });
    } catch (error) {
      const debuggerError = errorHandler.createPDFGenerationError(
        `Failed to attach debugger: ${error.message}`,
        ErrorSeverity.ERROR,
        error
      );
      trackError('pdf_generation', 'debugger_attach_failed', { 
        tabId, 
        error: error.message 
      });
      reject(debuggerError);
    }
  });
}

/**
 * Detaches the debugger from a tab
 * @param {number} tabId - The ID of the tab to detach from
 * @returns {Promise<void>} - A promise that resolves when the debugger is detached
 */
export async function detachDebugger(tabId) {
  return new Promise((resolve) => {
    try {
      chrome.debugger.detach({ tabId }, () => {
        if (chrome.runtime.lastError) {
          console.warn(`Failed to detach debugger: ${chrome.runtime.lastError.message}`);
          // We don't reject here because we want to continue even if detach fails
        }
        
        resolve();
      });
    } catch (error) {
      console.warn(`Failed to detach debugger: ${error.message}`);
      // We don't reject here because we want to continue even if detach fails
      resolve();
    }
  });
}

/**
 * Generates a PDF from a tab using the debugger API
 * @param {number} tabId - The ID of the tab to generate a PDF from
 * @param {DebuggerPdfOptions} options - PDF generation options
 * @returns {Promise<string>} - A promise that resolves with the PDF data as a base64 string
 */
export async function generatePdf(tabId, options = {}) {
  // Merge options with defaults
  const pdfOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
  
  try {
    // Attach debugger to the tab
    await attachDebugger(tabId);
    
    // Generate PDF
    const result = await sendDebuggerCommand(tabId, 'Page.printToPDF', pdfOptions);
    
    // Detach debugger
    await detachDebugger(tabId);
    
    // Return the PDF data
    return result.data;
  } catch (error) {
    // Make sure to detach debugger even if there's an error
    await detachDebugger(tabId);
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Sends a command to the debugger
 * @param {number} tabId - The ID of the tab to send the command to
 * @param {string} command - The command to send
 * @param {Object} params - The parameters for the command
 * @returns {Promise<any>} - A promise that resolves with the command result
 */
export async function sendDebuggerCommand(tabId, command, params = {}) {
  return new Promise((resolve, reject) => {
    try {
      chrome.debugger.sendCommand({ tabId }, command, params, (result) => {
        if (chrome.runtime.lastError) {
          const error = errorHandler.createPDFGenerationError(
            `Failed to send debugger command ${command}: ${chrome.runtime.lastError.message}`,
            ErrorSeverity.ERROR
          );
          trackError('pdf_generation', 'debugger_command_failed', { 
            tabId, 
            command,
            error: chrome.runtime.lastError.message 
          });
          reject(error);
          return;
        }
        
        resolve(result);
      });
    } catch (error) {
      const debuggerError = errorHandler.createPDFGenerationError(
        `Failed to send debugger command ${command}: ${error.message}`,
        ErrorSeverity.ERROR,
        error
      );
      trackError('pdf_generation', 'debugger_command_failed', { 
        tabId, 
        command,
        error: error.message 
      });
      reject(debuggerError);
    }
  });
}

/**
 * Converts a base64 string to a Blob
 * @param {string} base64Data - The base64 data
 * @param {string} contentType - The content type of the data
 * @returns {Blob} - The data as a Blob
 */
export function base64ToBlob(base64Data, contentType = 'application/pdf') {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Converts a base64 string to a data URL
 * @param {string} base64Data - The base64 data
 * @param {string} contentType - The content type of the data
 * @returns {string} - The data as a data URL
 */
export function base64ToDataUrl(base64Data, contentType = 'application/pdf') {
  return `data:${contentType};base64,${base64Data}`;
}
