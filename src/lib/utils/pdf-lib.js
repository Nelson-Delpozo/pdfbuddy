/**
 * PDF Buddy - PDF Library Wrapper
 * 
 * This module provides a wrapper around jsPDF for PDF generation and manipulation.
 */

import { jsPDF } from 'jspdf';
import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackError } from './analytics.js';

/**
 * Creates a new PDF document
 * @param {Object} options - PDF creation options
 * @param {string} [options.orientation='portrait'] - PDF orientation ('portrait' or 'landscape')
 * @param {string} [options.unit='mm'] - Measurement unit ('mm', 'cm', 'in', 'pt')
 * @param {string} [options.format='a4'] - Paper format ('a4', 'letter', etc.)
 * @returns {jsPDF} - The PDF document
 */
export function createPdf(options = {}) {
  try {
    const orientation = options.orientation || 'portrait';
    const unit = options.unit || 'mm';
    const format = options.format || 'a4';
    
    return new jsPDF({
      orientation,
      unit,
      format
    });
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to create PDF document: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'create_pdf_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Adds an image to a PDF document
 * @param {jsPDF} pdf - The PDF document
 * @param {string} imageData - The image data as a data URL
 * @param {Object} options - Image options
 * @param {number} [options.x=0] - X position
 * @param {number} [options.y=0] - Y position
 * @param {number} [options.width] - Image width
 * @param {number} [options.height] - Image height
 * @returns {jsPDF} - The PDF document with the image added
 */
export function addImageToPdf(pdf, imageData, options = {}) {
  try {
    // Extract image format from data URL
    const formatMatch = imageData.match(/^data:image\/(\w+);base64,/);
    if (!formatMatch) {
      throw new Error('Invalid image data format');
    }
    
    const format = formatMatch[1];
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Default options
    const x = options.x || 0;
    const y = options.y || 0;
    
    // Add image to PDF
    pdf.addImage(base64Data, format, x, y, options.width, options.height);
    
    return pdf;
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to add image to PDF: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'add_image_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Adds text watermark to a PDF document
 * @param {jsPDF} pdf - The PDF document
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {jsPDF} - The PDF document with the watermark added
 */
export function addTextWatermarkToPdf(pdf, watermarkConfig) {
  try {
    // Save current state
    pdf.saveGraphicsState();
    
    // Set transparency
    pdf.setGState(new pdf.GState({ opacity: watermarkConfig.opacity }));
    
    // Set text properties
    pdf.setFont(watermarkConfig.fontFamily || 'helvetica');
    pdf.setFontSize(watermarkConfig.fontSize || 48);
    pdf.setTextColor(watermarkConfig.color || '#FF0000');
    
    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate position
    let x, y;
    switch (watermarkConfig.position) {
      case 'topLeft':
        x = pageWidth * 0.1;
        y = pageHeight * 0.1;
        break;
      case 'topRight':
        x = pageWidth * 0.9;
        y = pageHeight * 0.1;
        break;
      case 'bottomLeft':
        x = pageWidth * 0.1;
        y = pageHeight * 0.9;
        break;
      case 'bottomRight':
        x = pageWidth * 0.9;
        y = pageHeight * 0.9;
        break;
      case 'center':
      default:
        x = pageWidth / 2;
        y = pageHeight / 2;
        break;
    }
    
    // Apply rotation
    const rotation = watermarkConfig.rotation || 0;
    pdf.text(watermarkConfig.text, x, y, {
      align: 'center',
      angle: rotation
    });
    
    // Restore state
    pdf.restoreGraphicsState();
    
    return pdf;
  } catch (error) {
    const pdfError = errorHandler.createWatermarkError(
      `Failed to add text watermark to PDF: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('watermark', 'add_text_watermark_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Adds image watermark to a PDF document
 * @param {jsPDF} pdf - The PDF document
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {jsPDF} - The PDF document with the watermark added
 */
export function addImageWatermarkToPdf(pdf, watermarkConfig) {
  try {
    // Save current state
    pdf.saveGraphicsState();
    
    // Set transparency
    pdf.setGState(new pdf.GState({ opacity: watermarkConfig.opacity }));
    
    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate position
    let x, y;
    switch (watermarkConfig.position) {
      case 'topLeft':
        x = pageWidth * 0.1;
        y = pageHeight * 0.1;
        break;
      case 'topRight':
        x = pageWidth * 0.9;
        y = pageHeight * 0.1;
        break;
      case 'bottomLeft':
        x = pageWidth * 0.1;
        y = pageHeight * 0.9;
        break;
      case 'bottomRight':
        x = pageWidth * 0.9;
        y = pageHeight * 0.9;
        break;
      case 'center':
      default:
        x = pageWidth / 2;
        y = pageHeight / 2;
        break;
    }
    
    // Extract image format from data URL
    const formatMatch = watermarkConfig.imageData.match(/^data:image\/(\w+);base64,/);
    if (!formatMatch) {
      throw new Error('Invalid image data format');
    }
    
    const format = formatMatch[1];
    const base64Data = watermarkConfig.imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Calculate dimensions
    const scale = watermarkConfig.scale || 1.0;
    const width = (watermarkConfig.width || pageWidth * 0.3) * scale;
    const height = (watermarkConfig.height || pageHeight * 0.3) * scale;
    
    // Apply rotation
    const rotation = watermarkConfig.rotation || 0;
    
    // Add image with rotation
    pdf.addImage(base64Data, format, x - width / 2, y - height / 2, width, height, null, 'FAST', rotation);
    
    // Restore state
    pdf.restoreGraphicsState();
    
    return pdf;
  } catch (error) {
    const pdfError = errorHandler.createWatermarkError(
      `Failed to add image watermark to PDF: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('watermark', 'add_image_watermark_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Converts a PDF document to a data URL
 * @param {jsPDF} pdf - The PDF document
 * @returns {string} - The PDF data as a data URL
 */
export function pdfToDataUrl(pdf) {
  try {
    return pdf.output('datauristring');
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to convert PDF to data URL: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'pdf_to_data_url_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Converts a PDF document to a Blob
 * @param {jsPDF} pdf - The PDF document
 * @returns {Blob} - The PDF data as a Blob
 */
export function pdfToBlob(pdf) {
  try {
    return pdf.output('blob');
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to convert PDF to Blob: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'pdf_to_blob_failed', { error: error.message });
    throw pdfError;
  }
}

/**
 * Creates a PDF from an image with pre-processed dimensions
 * @param {string} imageData - The image data as a data URL
 * @param {Object} dimensions - The image dimensions
 * @param {number} dimensions.width - The image width
 * @param {number} dimensions.height - The image height
 * @param {string} dimensions.orientation - The image orientation ('landscape' or 'portrait')
 * @param {Object} options - PDF creation options
 * @returns {jsPDF} - The PDF document
 */
export function createPdfFromImage(imageData, dimensions, options = {}) {
  try {
    // Use provided dimensions or default to options
    const orientation = dimensions?.orientation || options.orientation || 'portrait';
    
    // Create PDF with appropriate orientation
    const pdf = createPdf({
      orientation,
      ...options
    });
    
    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // If we have image dimensions, use them to calculate the proper size
    if (dimensions && dimensions.width && dimensions.height) {
      // Calculate image dimensions to fit the page
      const imgRatio = dimensions.width / dimensions.height;
      const pageRatio = pageWidth / pageHeight;
      
      let imgWidth, imgHeight;
      
      if (imgRatio > pageRatio) {
        // Image is wider than the page ratio
        imgWidth = pageWidth;
        imgHeight = pageWidth / imgRatio;
      } else {
        // Image is taller than the page ratio
        imgHeight = pageHeight;
        imgWidth = pageHeight * imgRatio;
      }
      
      // Center the image on the page
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      // Add the image to the PDF
      addImageToPdf(pdf, imageData, {
        x,
        y,
        width: imgWidth,
        height: imgHeight
      });
      
      return pdf;
    } else {
      // If no dimensions provided, add image at default size
      addImageToPdf(pdf, imageData, {
        x: 0,
        y: 0
      });
      
      return pdf;
    }
  } catch (error) {
    const pdfError = errorHandler.createPDFGenerationError(
      `Failed to create PDF from image: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(pdfError);
    trackError('pdf_generation', 'create_pdf_from_image_failed', { error: error.message });
    throw pdfError;
  }
}
