/**
 * PDF Buddy - Error Handler
 * 
 * This module provides error handling utilities for the extension.
 */

/**
 * Error types
 * @enum {string}
 */
export const ErrorType = {
  STORAGE: 'storage',
  NETWORK: 'network',
  PERMISSION: 'permission',
  PDF_GENERATION: 'pdf_generation',
  WATERMARK: 'watermark',
  TEMPLATE: 'template',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 * @enum {string}
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Custom error class for PDF Buddy
 */
export class PDFBuddyError extends Error {
  /**
   * Creates a new PDFBuddyError
   * @param {string} message - Error message
   * @param {ErrorType} type - Error type
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error that caused this error
   */
  constructor(message, type = ErrorType.UNKNOWN, severity = ErrorSeverity.ERROR, originalError = null) {
    super(message);
    this.name = 'PDFBuddyError';
    this.type = type;
    this.severity = severity;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

/**
 * Error handler class
 */
export class ErrorHandler {
  /**
   * Creates a new ErrorHandler
   * @param {Function} logCallback - Function to call for logging errors
   * @param {Function} userFeedbackCallback - Function to call for user feedback
   */
  constructor(logCallback = console.error, userFeedbackCallback = null) {
    this.logCallback = logCallback;
    this.userFeedbackCallback = userFeedbackCallback;
    this.errorHistory = [];
    
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers();
    }
  }
  
  /**
   * Sets up global error handlers
   */
  setupGlobalHandlers() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(
        new PDFBuddyError(
          message,
          ErrorType.UNKNOWN,
          ErrorSeverity.ERROR,
          error
        ),
        { source, lineno, colno }
      );
      return true; // Prevents default error handling
    };
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new PDFBuddyError(
          event.reason.message || 'Unhandled Promise Rejection',
          ErrorType.UNKNOWN,
          ErrorSeverity.ERROR,
          event.reason
        ),
        { promise: event.promise }
      );
    });
  }
  
  /**
   * Handles an error
   * @param {PDFBuddyError|Error} error - The error to handle
   * @param {Object} metadata - Additional metadata about the error
   */
  handleError(error, metadata = {}) {
    // Convert to PDFBuddyError if it's not already
    const pdfBuddyError = error instanceof PDFBuddyError
      ? error
      : new PDFBuddyError(error.message, ErrorType.UNKNOWN, ErrorSeverity.ERROR, error);
    
    // Add to error history
    this.errorHistory.push({
      error: pdfBuddyError,
      metadata,
      timestamp: new Date()
    });
    
    // Trim error history if it gets too long
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }
    
    // Log the error
    this.logError(pdfBuddyError, metadata);
    
    // Provide user feedback if callback is provided
    if (this.userFeedbackCallback) {
      this.userFeedbackCallback(pdfBuddyError, metadata);
    }
    
    // Report error to analytics (in a real implementation)
    this.reportError(pdfBuddyError, metadata);
    
    return pdfBuddyError;
  }
  
  /**
   * Logs an error
   * @param {PDFBuddyError} error - The error to log
   * @param {Object} metadata - Additional metadata about the error
   */
  logError(error, metadata) {
    this.logCallback(
      `[${error.severity.toUpperCase()}] [${error.type}] ${error.message}`,
      {
        error,
        metadata,
        stack: error.stack,
        originalError: error.originalError
      }
    );
  }
  
  /**
   * Reports an error to analytics
   * @param {PDFBuddyError} error - The error to report
   * @param {Object} metadata - Additional metadata about the error
   */
  reportError(error, metadata) {
    // In a real implementation, this would send the error to an analytics service
    // For now, we'll just log it to the console
    if (error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL) {
      console.info('Would report to analytics:', {
        type: error.type,
        severity: error.severity,
        message: error.message,
        metadata,
        timestamp: error.timestamp
      });
    }
  }
  
  /**
   * Gets user-friendly error message
   * @param {PDFBuddyError} error - The error
   * @returns {string} - User-friendly error message
   */
  getUserFriendlyMessage(error) {
    // Default messages for different error types
    const defaultMessages = {
      [ErrorType.STORAGE]: 'There was a problem saving your data. Please try again.',
      [ErrorType.NETWORK]: 'There was a problem connecting to the server. Please check your internet connection and try again.',
      [ErrorType.PERMISSION]: 'PDF Buddy doesn\'t have the necessary permissions. Please check the extension permissions.',
      [ErrorType.PDF_GENERATION]: 'There was a problem generating the PDF. Please try again.',
      [ErrorType.WATERMARK]: 'There was a problem applying the watermark. Please try again with different settings.',
      [ErrorType.TEMPLATE]: 'There was a problem with the template. Please try a different template.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };
    
    return defaultMessages[error.type] || defaultMessages[ErrorType.UNKNOWN];
  }
  
  /**
   * Creates a storage error
   * @param {string} message - Error message
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error
   * @returns {PDFBuddyError} - Storage error
   */
  createStorageError(message, severity = ErrorSeverity.ERROR, originalError = null) {
    return new PDFBuddyError(message, ErrorType.STORAGE, severity, originalError);
  }
  
  /**
   * Creates a network error
   * @param {string} message - Error message
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error
   * @returns {PDFBuddyError} - Network error
   */
  createNetworkError(message, severity = ErrorSeverity.ERROR, originalError = null) {
    return new PDFBuddyError(message, ErrorType.NETWORK, severity, originalError);
  }
  
  /**
   * Creates a permission error
   * @param {string} message - Error message
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error
   * @returns {PDFBuddyError} - Permission error
   */
  createPermissionError(message, severity = ErrorSeverity.ERROR, originalError = null) {
    return new PDFBuddyError(message, ErrorType.PERMISSION, severity, originalError);
  }
  
  /**
   * Creates a PDF generation error
   * @param {string} message - Error message
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error
   * @returns {PDFBuddyError} - PDF generation error
   */
  createPDFGenerationError(message, severity = ErrorSeverity.ERROR, originalError = null) {
    return new PDFBuddyError(message, ErrorType.PDF_GENERATION, severity, originalError);
  }
  
  /**
   * Creates a watermark error
   * @param {string} message - Error message
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error
   * @returns {PDFBuddyError} - Watermark error
   */
  createWatermarkError(message, severity = ErrorSeverity.ERROR, originalError = null) {
    return new PDFBuddyError(message, ErrorType.WATERMARK, severity, originalError);
  }
  
  /**
   * Creates a template error
   * @param {string} message - Error message
   * @param {ErrorSeverity} severity - Error severity
   * @param {Error} originalError - Original error
   * @returns {PDFBuddyError} - Template error
   */
  createTemplateError(message, severity = ErrorSeverity.ERROR, originalError = null) {
    return new PDFBuddyError(message, ErrorType.TEMPLATE, severity, originalError);
  }
}

// Create a default error handler instance
export const errorHandler = new ErrorHandler();

// Export a default handleError function for convenience
export function handleError(error, metadata = {}) {
  return errorHandler.handleError(error, metadata);
}
