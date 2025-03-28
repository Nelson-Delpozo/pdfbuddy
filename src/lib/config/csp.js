/**
 * PDF Buddy - Content Security Policy Configuration
 * 
 * This module defines the Content Security Policy (CSP) for the extension.
 * CSP helps prevent XSS attacks by controlling which resources can be loaded.
 */

/**
 * Default CSP directives for the extension
 * These will be applied to the manifest.json
 */
export const DEFAULT_CSP = {
  // Restrict where scripts can be loaded from
  'script-src': [
    "'self'", // Allow scripts from the extension itself
  ],
  
  // Restrict where styles can be loaded from
  'style-src': [
    "'self'", // Allow styles from the extension itself
    "'unsafe-inline'" // Allow inline styles (needed for dynamic styling)
  ],
  
  // Restrict where images can be loaded from
  'img-src': [
    "'self'", // Allow images from the extension itself
    "data:", // Allow data URLs for images
    "blob:" // Allow blob URLs for images
  ],
  
  // Restrict where fonts can be loaded from
  'font-src': [
    "'self'" // Allow fonts from the extension itself
  ],
  
  // Restrict where objects can be loaded from
  'object-src': [
    "'none'" // Disallow objects (Flash, etc.)
  ],
  
  // Restrict where media can be loaded from
  'media-src': [
    "'self'" // Allow media from the extension itself
  ],
  
  // Restrict where frames can be loaded from
  'frame-src': [
    "'self'" // Allow frames from the extension itself
  ],
  
  // Restrict where the page can be framed
  'frame-ancestors': [
    "'self'" // Allow the extension to be framed by itself
  ],
  
  // Restrict where forms can be submitted to
  'form-action': [
    "'self'" // Allow forms to be submitted to the extension itself
  ],
  
  // Restrict where connections can be made to
  'connect-src': [
    "'self'" // Allow connections to the extension itself
  ],
  
  // Default source for any directive not explicitly listed
  'default-src': [
    "'self'" // Default to allowing only from the extension itself
  ]
};

/**
 * CSP directives for the popup page
 * These will be applied to the popup.html page
 */
export const POPUP_CSP = {
  ...DEFAULT_CSP,
  // Add any popup-specific CSP directives here
};

/**
 * CSP directives for the options page
 * These will be applied to the options.html page
 */
export const OPTIONS_CSP = {
  ...DEFAULT_CSP,
  // Add any options-specific CSP directives here
};

/**
 * CSP directives for the background script
 * These will be applied to the background service worker
 */
export const BACKGROUND_CSP = {
  ...DEFAULT_CSP,
  // Add any background-specific CSP directives here
};

/**
 * CSP directives for the content scripts
 * These will be applied to the content scripts
 */
export const CONTENT_CSP = {
  ...DEFAULT_CSP,
  // Content scripts need to interact with the page
  'script-src': [
    "'self'",
    "'unsafe-eval'" // Allow eval in content scripts (needed for some operations)
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'" // Allow inline styles (needed for dynamic styling)
  ]
};

/**
 * Converts CSP directives object to a string
 * @param {Object} cspDirectives - The CSP directives object
 * @returns {string} - The CSP string
 */
export function cspToString(cspDirectives) {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Gets the CSP string for the manifest
 * @returns {string} - The CSP string for the manifest
 */
export function getManifestCSP() {
  return cspToString(DEFAULT_CSP);
}

/**
 * Gets the CSP string for a specific page
 * @param {string} page - The page to get the CSP for ('popup', 'options', 'background', 'content')
 * @returns {string} - The CSP string for the page
 */
export function getPageCSP(page) {
  switch (page) {
    case 'popup':
      return cspToString(POPUP_CSP);
    case 'options':
      return cspToString(OPTIONS_CSP);
    case 'background':
      return cspToString(BACKGROUND_CSP);
    case 'content':
      return cspToString(CONTENT_CSP);
    default:
      return cspToString(DEFAULT_CSP);
  }
}

/**
 * Adds CSP headers to a response
 * @param {Response} response - The response to add CSP headers to
 * @param {string} page - The page to get the CSP for
 * @returns {Response} - The response with CSP headers
 */
export function addCSPHeaders(response, page) {
  const csp = getPageCSP(page);
  
  // Clone the response to modify headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });
  
  // Add CSP header
  newResponse.headers.set('Content-Security-Policy', csp);
  
  return newResponse;
}

/**
 * Validates a URL against the CSP
 * @param {string} url - The URL to validate
 * @param {string} directive - The CSP directive to check against
 * @param {Object} cspDirectives - The CSP directives object
 * @returns {boolean} - Whether the URL is allowed by the CSP
 */
export function isUrlAllowedByCSP(url, directive, cspDirectives = DEFAULT_CSP) {
  if (!url || !directive) {
    return false;
  }
  
  // Get the sources for the directive
  const sources = cspDirectives[directive] || cspDirectives['default-src'] || [];
  
  // Check if the URL is allowed by any of the sources
  return sources.some(source => {
    // Self source
    if (source === "'self'" && url.startsWith(chrome.runtime.getURL(''))) {
      return true;
    }
    
    // Data URL
    if (source === "data:" && url.startsWith('data:')) {
      return true;
    }
    
    // Blob URL
    if (source === "blob:" && url.startsWith('blob:')) {
      return true;
    }
    
    // Exact domain match
    if (source.startsWith('http') && url.startsWith(source)) {
      return true;
    }
    
    // Wildcard domain match
    if (source.startsWith('*.') && url.includes(source.substring(2))) {
      return true;
    }
    
    return false;
  });
}
