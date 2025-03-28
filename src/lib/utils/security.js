/**
 * PDF Buddy - Security Utilities
 * 
 * This module provides security-related utilities for the extension,
 * including input sanitization, data validation, and encryption.
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Replace HTML special characters with their entity equivalents
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes an object by sanitizing all string properties
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - The sanitized object
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Validates that a string matches a specific pattern
 * @param {string} input - The input string to validate
 * @param {RegExp} pattern - The pattern to match
 * @returns {boolean} - Whether the input matches the pattern
 */
export function validatePattern(input, pattern) {
  if (typeof input !== 'string') {
    return false;
  }
  
  return pattern.test(input);
}

/**
 * Validates that a string is within a specific length range
 * @param {string} input - The input string to validate
 * @param {number} minLength - The minimum length
 * @param {number} maxLength - The maximum length
 * @returns {boolean} - Whether the input is within the length range
 */
export function validateLength(input, minLength, maxLength) {
  if (typeof input !== 'string') {
    return false;
  }
  
  const length = input.length;
  return length >= minLength && length <= maxLength;
}

/**
 * Validates a URL for security
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid and safe
 */
export function validateUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // Check for valid protocols
    const safeProtocols = ['http:', 'https:'];
    if (!safeProtocols.includes(parsedUrl.protocol)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a color value
 * @param {string} color - The color value to validate
 * @returns {boolean} - Whether the color is valid
 */
export function validateColor(color) {
  if (typeof color !== 'string') {
    return false;
  }
  
  // Check for hex color format
  const hexPattern = /^#([0-9A-F]{3}){1,2}$/i;
  if (hexPattern.test(color)) {
    return true;
  }
  
  // Check for rgb/rgba format
  const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i;
  const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i;
  if (rgbPattern.test(color) || rgbaPattern.test(color)) {
    return true;
  }
  
  // Check for named colors (simplified check)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'purple', 
    'orange', 'gray', 'grey', 'cyan', 'magenta', 'pink', 'brown',
    'transparent'
  ];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Validates a font family
 * @param {string} fontFamily - The font family to validate
 * @returns {boolean} - Whether the font family is valid
 */
export function validateFontFamily(fontFamily) {
  if (typeof fontFamily !== 'string') {
    return false;
  }
  
  // List of safe fonts
  const safeFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New',
    'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
    'Tahoma', 'Trebuchet MS', 'Arial Black', 'Impact', 'Comic Sans MS'
  ];
  
  // Check if the font is in our safe list
  const normalizedFont = fontFamily.replace(/['"]/g, '').trim();
  return safeFonts.some(font => normalizedFont.toLowerCase() === font.toLowerCase());
}

/**
 * Validates a number is within a range
 * @param {number} value - The number to validate
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {boolean} - Whether the number is within the range
 */
export function validateNumberRange(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  
  return value >= min && value <= max;
}

/**
 * Validates watermark configuration for security
 * @param {Object} config - The watermark configuration
 * @returns {Object} - Validated and sanitized configuration
 */
export function validateWatermarkConfig(config) {
  if (typeof config !== 'object' || config === null) {
    return null;
  }
  
  const validatedConfig = {};
  
  // Validate and sanitize text
  if (config.type === 'text' && typeof config.text === 'string') {
    validatedConfig.type = 'text';
    validatedConfig.text = sanitizeString(config.text);
    
    // Validate position
    const validPositions = ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
    validatedConfig.position = validPositions.includes(config.position) ? config.position : 'center';
    
    // Validate opacity
    validatedConfig.opacity = validateNumberRange(config.opacity, 0, 1) ? config.opacity : 0.5;
    
    // Validate color
    validatedConfig.color = validateColor(config.color) ? config.color : '#FF0000';
    
    // Validate font size
    validatedConfig.fontSize = validateNumberRange(config.fontSize, 8, 72) ? config.fontSize : 48;
    
    // Validate font family
    validatedConfig.fontFamily = validateFontFamily(config.fontFamily) ? config.fontFamily : 'Arial';
    
    // Validate rotation
    validatedConfig.rotation = validateNumberRange(config.rotation, -180, 180) ? config.rotation : 0;
  } else if (config.type === 'image') {
    // Image watermarks would require additional validation
    // This is a placeholder for premium features
    validatedConfig.type = 'image';
    // Additional validation would go here
  } else {
    return null;
  }
  
  return validatedConfig;
}

/**
 * Simple encryption function (for demonstration purposes only)
 * In a real implementation, use a proper encryption library
 * @param {string} text - The text to encrypt
 * @param {string} key - The encryption key
 * @returns {string} - The encrypted text
 */
export function encryptText(text, key) {
  // This is a placeholder for demonstration
  // In a real implementation, use a proper encryption library
  console.warn('Using placeholder encryption - not secure for production');
  
  // Simple XOR encryption (NOT SECURE - DEMO ONLY)
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  
  return btoa(result); // Base64 encode
}

/**
 * Simple decryption function (for demonstration purposes only)
 * In a real implementation, use a proper encryption library
 * @param {string} encryptedText - The encrypted text
 * @param {string} key - The encryption key
 * @returns {string} - The decrypted text
 */
export function decryptText(encryptedText, key) {
  // This is a placeholder for demonstration
  // In a real implementation, use a proper encryption library
  console.warn('Using placeholder decryption - not secure for production');
  
  try {
    const text = atob(encryptedText); // Base64 decode
    
    // Simple XOR decryption (NOT SECURE - DEMO ONLY)
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

/**
 * Generates a secure random string
 * @param {number} length - The length of the string
 * @returns {string} - A random string
 */
export function generateRandomString(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto API if available for better randomness
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
}

/**
 * Checks if an object has been tampered with using a simple hash
 * @param {Object} obj - The object to check
 * @param {string} hash - The hash to compare against
 * @returns {boolean} - Whether the object matches the hash
 */
export function verifyIntegrity(obj, hash) {
  const objHash = simpleHash(JSON.stringify(obj));
  return objHash === hash;
}

/**
 * Creates a simple hash of a string (for basic integrity checks only)
 * @param {string} str - The string to hash
 * @returns {string} - A simple hash of the string
 */
export function simpleHash(str) {
  let hash = 0;
  
  if (str.length === 0) {
    return hash.toString(16);
  }
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16);
}

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {*} defaultValue - The default value to return if parsing fails
 * @returns {*} - The parsed object or the default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return defaultValue;
  }
}

/**
 * Safely stringifies an object to JSON with error handling
 * @param {*} value - The value to stringify
 * @param {string} defaultValue - The default value to return if stringification fails
 * @returns {string} - The JSON string or the default value
 */
export function safeJsonStringify(value, defaultValue = '{}') {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('JSON stringification failed:', error);
    return defaultValue;
  }
}
