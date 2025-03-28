/**
 * PDF Buddy - Security Constants
 * 
 * This module defines security-related constants used throughout the extension.
 */

/**
 * Regular expression patterns for validation
 */
export const VALIDATION_PATTERNS = {
  // Email pattern
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // URL pattern
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  
  // Hex color pattern
  HEX_COLOR: /^#([0-9A-F]{3}){1,2}$/i,
  
  // RGB color pattern
  RGB_COLOR: /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i,
  
  // RGBA color pattern
  RGBA_COLOR: /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i,
  
  // Alphanumeric pattern
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  
  // Alphanumeric with spaces pattern
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9 ]+$/,
  
  // Alphanumeric with special characters pattern
  ALPHANUMERIC_WITH_SPECIAL: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/,
  
  // Filename pattern
  FILENAME: /^[a-zA-Z0-9_\-. ]+$/,
  
  // Path pattern
  PATH: /^[a-zA-Z0-9_\-./\\: ]+$/,
  
  // JSON pattern
  JSON: /^[\s]*(\{|\[)(.|\n)*(\}|\])[\s]*$/,
  
  // HTML tag pattern (for sanitization)
  HTML_TAG: /<[^>]*>/g,
  
  // Script tag pattern (for sanitization)
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  
  // Inline event handler pattern (for sanitization)
  INLINE_EVENT: /on\w+\s*=\s*["']?[^"']*["']?/gi,
  
  // Data URL pattern
  DATA_URL: /^data:([a-z]+\/[a-z0-9-+.]+)?;base64,([a-zA-Z0-9+/=]*)$/i,
  
  // Blob URL pattern
  BLOB_URL: /^blob:([a-z]+:\/\/[^/]+\/[a-z0-9-]+)$/i
};

/**
 * Validation constraints
 */
export const VALIDATION_CONSTRAINTS = {
  // Text length constraints
  TEXT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000
  },
  
  // Watermark text constraints
  WATERMARK_TEXT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  
  // Template name constraints
  TEMPLATE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  
  // Font size constraints
  FONT_SIZE: {
    MIN: 8,
    MAX: 72
  },
  
  // Opacity constraints
  OPACITY: {
    MIN: 0,
    MAX: 1
  },
  
  // Rotation constraints
  ROTATION: {
    MIN: -180,
    MAX: 180
  },
  
  // Image size constraints
  IMAGE: {
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 2000,
    MAX_SIZE_BYTES: 5 * 1024 * 1024 // 5MB
  },
  
  // Template constraints
  TEMPLATES: {
    MAX_FREE_TEMPLATES: 3,
    MAX_PREMIUM_TEMPLATES: 100
  },
  
  // Storage constraints
  STORAGE: {
    MAX_SYNC_BYTES: 100 * 1024, // 100KB
    MAX_LOCAL_BYTES: 5 * 1024 * 1024 // 5MB
  }
};

/**
 * Allowed values for various properties
 */
export const ALLOWED_VALUES = {
  // Allowed watermark positions
  WATERMARK_POSITIONS: [
    'center',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight'
  ],
  
  // Allowed font families
  FONT_FAMILIES: [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Courier New',
    'Courier',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Tahoma',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
    'Comic Sans MS'
  ],
  
  // Allowed image types
  IMAGE_TYPES: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml'
  ],
  
  // Allowed file types for download
  DOWNLOAD_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg'
  ]
};

/**
 * Security settings
 */
export const SECURITY_SETTINGS = {
  // Encryption settings
  ENCRYPTION: {
    KEY_LENGTH: 32,
    ALGORITHM: 'AES-GCM',
    ITERATIONS: 100000,
    SALT_LENGTH: 16,
    IV_LENGTH: 12,
    TAG_LENGTH: 128
  },
  
  // Hash settings
  HASH: {
    ALGORITHM: 'SHA-256',
    ITERATIONS: 1000,
    SALT_LENGTH: 16,
    KEY_LENGTH: 32
  },
  
  // Session settings
  SESSION: {
    TIMEOUT: 30 * 60 * 1000, // 30 minutes
    RENEWAL_THRESHOLD: 5 * 60 * 1000 // 5 minutes
  },
  
  // Rate limiting settings
  RATE_LIMITING: {
    MAX_REQUESTS: 100,
    TIME_WINDOW: 60 * 1000 // 1 minute
  }
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // Validation error messages
  VALIDATION: {
    INVALID_INPUT: 'Invalid input provided',
    INVALID_TYPE: 'Invalid type provided',
    INVALID_LENGTH: 'Input length is invalid',
    INVALID_PATTERN: 'Input does not match the required pattern',
    INVALID_RANGE: 'Input is outside the allowed range',
    INVALID_VALUE: 'Input value is not allowed'
  },
  
  // Storage error messages
  STORAGE: {
    QUOTA_EXCEEDED: 'Storage quota exceeded',
    WRITE_ERROR: 'Failed to write to storage',
    READ_ERROR: 'Failed to read from storage',
    NOT_FOUND: 'Item not found in storage'
  },
  
  // Permission error messages
  PERMISSION: {
    NOT_GRANTED: 'Required permission not granted',
    REQUEST_FAILED: 'Permission request failed'
  },
  
  // PDF generation error messages
  PDF_GENERATION: {
    FAILED: 'Failed to generate PDF',
    TIMEOUT: 'PDF generation timed out',
    INVALID_CONTENT: 'Invalid content for PDF generation'
  },
  
  // Watermark error messages
  WATERMARK: {
    INVALID_CONFIG: 'Invalid watermark configuration',
    APPLICATION_FAILED: 'Failed to apply watermark',
    INVALID_IMAGE: 'Invalid watermark image'
  },
  
  // Template error messages
  TEMPLATE: {
    LIMIT_REACHED: 'Template limit reached',
    INVALID_TEMPLATE: 'Invalid template',
    NOT_FOUND: 'Template not found'
  },
  
  // License error messages
  LICENSE: {
    INVALID: 'Invalid license',
    EXPIRED: 'License has expired',
    FEATURE_NOT_AVAILABLE: 'Feature not available in current license'
  },
  
  // Security error messages
  SECURITY: {
    INVALID_CSP: 'Content Security Policy violation',
    INVALID_ORIGIN: 'Invalid origin',
    INVALID_SIGNATURE: 'Invalid signature',
    TAMPERED_DATA: 'Data has been tampered with'
  }
};

/**
 * Secure default values
 */
export const SECURE_DEFAULTS = {
  // Default watermark configuration
  WATERMARK: {
    TYPE: 'text',
    TEXT: 'CONFIDENTIAL',
    POSITION: 'center',
    OPACITY: 0.5,
    COLOR: '#FF0000',
    FONT_SIZE: 48,
    FONT_FAMILY: 'Arial',
    ROTATION: 0
  },
  
  // Default settings
  SETTINGS: {
    SAVE_LOCATION: 'downloads',
    ANALYTICS_ENABLED: true,
    AUTO_SAVE: false,
    CONFIRM_BEFORE_SAVE: true
  }
};

/**
 * Security headers
 */
export const SECURITY_HEADERS = {
  // Content Security Policy header
  CSP: 'Content-Security-Policy',
  
  // X-Content-Type-Options header
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  
  // X-Frame-Options header
  X_FRAME_OPTIONS: 'X-Frame-Options',
  
  // X-XSS-Protection header
  X_XSS_PROTECTION: 'X-XSS-Protection',
  
  // Referrer-Policy header
  REFERRER_POLICY: 'Referrer-Policy',
  
  // Strict-Transport-Security header
  STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security'
};

/**
 * Security header values
 */
export const SECURITY_HEADER_VALUES = {
  // X-Content-Type-Options value
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  
  // X-Frame-Options value
  X_FRAME_OPTIONS: 'DENY',
  
  // X-XSS-Protection value
  X_XSS_PROTECTION: '1; mode=block',
  
  // Referrer-Policy value
  REFERRER_POLICY: 'no-referrer',
  
  // Strict-Transport-Security value
  STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains'
};
