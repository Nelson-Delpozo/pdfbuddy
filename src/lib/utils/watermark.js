/**
 * PDF Buddy - Watermark Utility
 * 
 * This module provides utilities for creating and applying watermarks to PDFs.
 */

import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackWatermarkCreation, trackError } from './analytics.js';
import { validateWatermarkConfig } from './security.js';
import { isFeatureAvailable } from './license-manager.js';
import { PremiumFeature } from './license-manager.js';

/**
 * Watermark types
 * @enum {string}
 */
export const WatermarkType = {
  TEXT: 'text',
  IMAGE: 'image'
};

/**
 * Watermark positions
 * @enum {string}
 */
export const WatermarkPosition = {
  CENTER: 'center',
  TOP_LEFT: 'topLeft',
  TOP_RIGHT: 'topRight',
  BOTTOM_LEFT: 'bottomLeft',
  BOTTOM_RIGHT: 'bottomRight'
};

/**
 * Default text watermark configuration
 */
export const DEFAULT_TEXT_WATERMARK = {
  type: WatermarkType.TEXT,
  text: 'CONFIDENTIAL',
  position: WatermarkPosition.CENTER,
  opacity: 0.5,
  color: '#FF0000',
  fontSize: 48,
  fontFamily: 'Arial',
  rotation: -45
};

/**
 * Creates a text watermark
 * @param {string} text - The text to use for the watermark
 * @param {Object} options - Watermark options
 * @returns {Object} - The watermark configuration
 */
export function createTextWatermark(text, options = {}) {
  try {
    // Create watermark configuration
    const watermarkConfig = {
      ...DEFAULT_TEXT_WATERMARK,
      ...options,
      type: WatermarkType.TEXT,
      text
    };
    
    // Validate watermark configuration
    const validatedConfig = validateWatermarkConfig(watermarkConfig);
    if (!validatedConfig) {
      throw new Error('Invalid watermark configuration');
    }
    
    // Track watermark creation
    trackWatermarkCreation(WatermarkType.TEXT, validatedConfig);
    
    return validatedConfig;
  } catch (error) {
    const watermarkError = errorHandler.createWatermarkError(
      `Failed to create text watermark: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(watermarkError);
    trackError('watermark', 'text_creation_failed', { error: error.message });
    throw watermarkError;
  }
}

/**
 * Creates an image watermark
 * @param {string} imageData - The image data as a base64 string
 * @param {Object} options - Watermark options
 * @returns {Object} - The watermark configuration
 */
export function createImageWatermark(imageData, options = {}) {
  try {
    // Check if image watermarks are available (premium feature)
    if (!isFeatureAvailable(PremiumFeature.IMAGE_WATERMARK)) {
      throw new Error('Image watermarks are a premium feature');
    }
    
    // Create watermark configuration
    const watermarkConfig = {
      type: WatermarkType.IMAGE,
      imageData,
      position: options.position || WatermarkPosition.CENTER,
      opacity: options.opacity || 0.5,
      scale: options.scale || 1.0,
      rotation: options.rotation || 0
    };
    
    // Validate watermark configuration
    // This is a placeholder for now
    
    // Track watermark creation
    trackWatermarkCreation(WatermarkType.IMAGE, watermarkConfig);
    
    return watermarkConfig;
  } catch (error) {
    const watermarkError = errorHandler.createWatermarkError(
      `Failed to create image watermark: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(watermarkError);
    trackError('watermark', 'image_creation_failed', { error: error.message });
    throw watermarkError;
  }
}

/**
 * Applies a watermark to a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to apply the watermark to
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {HTMLCanvasElement} - The canvas with the watermark applied
 */
export function applyWatermarkToCanvas(canvas, watermarkConfig) {
  try {
    // Check if watermarkConfig is valid
    if (!watermarkConfig || !watermarkConfig.type) {
      // If not valid, try to validate it
      const validatedConfig = validateWatermarkConfig(watermarkConfig);
      if (!validatedConfig) {
        throw new Error('Invalid watermark configuration');
      }
      watermarkConfig = validatedConfig;
    }
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    // Apply watermark based on type
    if (watermarkConfig.type === WatermarkType.TEXT) {
      applyTextWatermark(ctx, canvas.width, canvas.height, watermarkConfig);
    } else if (watermarkConfig.type === WatermarkType.IMAGE) {
      // Check if image watermarks are available (premium feature)
      if (!isFeatureAvailable(PremiumFeature.IMAGE_WATERMARK)) {
        throw new Error('Image watermarks are a premium feature');
      }
      
      applyImageWatermark(ctx, canvas.width, canvas.height, watermarkConfig);
    } else {
      throw new Error(`Unknown watermark type: ${watermarkConfig.type}`);
    }
    
    return canvas;
  } catch (error) {
    const watermarkError = errorHandler.createWatermarkError(
      `Failed to apply watermark to canvas: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(watermarkError);
    trackError('watermark', 'canvas_application_failed', { error: error.message });
    throw watermarkError;
  }
}

/**
 * Applies a text watermark to a canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 * @param {Object} config - The watermark configuration
 */
function applyTextWatermark(ctx, width, height, config) {
  // Save context state
  ctx.save();
  
  // Set transparency
  ctx.globalAlpha = config.opacity;
  
  // Set text properties
  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate position
  const position = calculatePosition(width, height, config.position);
  
  // Apply rotation
  ctx.translate(position.x, position.y);
  ctx.rotate((config.rotation * Math.PI) / 180);
  
  // Draw text
  ctx.fillText(config.text, 0, 0);
  
  // Restore context state
  ctx.restore();
}

/**
 * Applies an image watermark to a canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 * @param {Object} config - The watermark configuration
 */
function applyImageWatermark(ctx, width, height, config) {
  // This is a placeholder for now
  console.warn('Image watermarking not yet implemented');
  
  // In a real implementation, this would:
  // 1. Create an image element
  // 2. Set the source to the image data
  // 3. Wait for the image to load
  // 4. Calculate position and size
  // 5. Draw the image on the canvas with the specified opacity, scale, and rotation
}

/**
 * Calculates the position for a watermark
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 * @param {string} position - The position
 * @returns {Object} - The x and y coordinates
 */
function calculatePosition(width, height, position) {
  switch (position) {
  case WatermarkPosition.CENTER:
    return { x: width / 2, y: height / 2 };
  case WatermarkPosition.TOP_LEFT:
    return { x: width * 0.1, y: height * 0.1 };
  case WatermarkPosition.TOP_RIGHT:
    return { x: width * 0.9, y: height * 0.1 };
  case WatermarkPosition.BOTTOM_LEFT:
    return { x: width * 0.1, y: height * 0.9 };
  case WatermarkPosition.BOTTOM_RIGHT:
    return { x: width * 0.9, y: height * 0.9 };
  default:
    return { x: width / 2, y: height / 2 };
  }
}

/**
 * Creates a watermarked PDF
 * @param {string} pdfData - The PDF data as a base64 string
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {Promise<string>} - The watermarked PDF data
 */
export async function createWatermarkedPdf(pdfData, watermarkConfig) {
  try {
    // Validate watermark configuration
    const validatedConfig = validateWatermarkConfig(watermarkConfig);
    if (!validatedConfig) {
      throw new Error('Invalid watermark configuration');
    }
    
    // This is a placeholder for now
    // In a real implementation, this would:
    // 1. Convert the PDF data to a canvas
    // 2. Apply the watermark to the canvas
    // 3. Convert the canvas back to PDF data
    
    console.warn('PDF watermarking not yet implemented');
    return pdfData;
  } catch (error) {
    const watermarkError = errorHandler.createWatermarkError(
      `Failed to create watermarked PDF: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(watermarkError);
    trackError('watermark', 'pdf_watermarking_failed', { error: error.message });
    throw watermarkError;
  }
}
