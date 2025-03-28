/**
 * PDF Buddy - Analytics Utilities
 * 
 * This module provides analytics tracking functionality.
 * In a production environment, this would be connected to a real analytics service.
 */

/**
 * Event categories
 * @enum {string}
 */
export const EventCategory = {
  PDF: 'pdf',
  WATERMARK: 'watermark',
  TEMPLATE: 'template',
  SETTINGS: 'settings',
  PREMIUM: 'premium',
  ERROR: 'error',
  UI: 'ui'
};

/**
 * Analytics class for tracking events and user behavior
 */
export class Analytics {
  /**
   * Creates a new Analytics instance
   * @param {boolean} enabled - Whether analytics is enabled
   * @param {string} userId - Anonymous user ID
   */
  constructor(enabled = true, userId = null) {
    this.enabled = enabled;
    this.userId = userId || this.generateAnonymousId();
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.initialized = false;
    
    // Queue for events that occur before initialization
    this.eventQueue = [];
  }
  
  /**
   * Initializes the analytics system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Check if analytics is enabled in settings
      const settings = await this.getAnalyticsSettings();
      this.enabled = settings.enabled;
      
      // Process any queued events
      if (this.enabled && this.eventQueue.length > 0) {
        this.eventQueue.forEach(event => this.trackEvent(event.category, event.action, event.label, event.value));
        this.eventQueue = [];
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      // Default to disabled if there's an error
      this.enabled = false;
    }
  }
  
  /**
   * Gets analytics settings from storage
   * @returns {Promise<Object>}
   */
  async getAnalyticsSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('analyticsSettings', (result) => {
        const settings = result.analyticsSettings || { enabled: true };
        resolve(settings);
      });
    });
  }
  
  /**
   * Generates an anonymous user ID
   * @returns {string}
   */
  generateAnonymousId() {
    return 'user_' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Generates a session ID
   * @returns {string}
   */
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  }
  
  /**
   * Tracks an event
   * @param {EventCategory|string} category - Event category
   * @param {string} action - Event action
   * @param {string} label - Event label
   * @param {any} value - Event value
   */
  trackEvent(category, action, label = null, value = null) {
    if (!this.initialized) {
      // Queue the event for later if not initialized
      this.eventQueue.push({ category, action, label, value });
      return;
    }
    
    if (!this.enabled) return;
    
    const event = {
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    // Add to local events array
    this.events.push(event);
    
    // Log the event (in a real implementation, this would send to an analytics service)
    this.logEvent(event);
  }
  
  /**
   * Logs an event (placeholder for real analytics service)
   * @param {Object} event - The event to log
   */
  logEvent(event) {
    // In a real implementation, this would send the event to an analytics service
    // For now, we'll just log it to the console in development mode
    if (process.env.NODE_ENV === 'development') {
      console.info('Analytics Event:', event);
    }
  }
  
  /**
   * Tracks a PDF generation event
   * @param {boolean} withWatermark - Whether the PDF was generated with a watermark
   * @param {string} pageUrl - URL of the page that was converted
   */
  trackPdfGeneration(withWatermark, pageUrl) {
    this.trackEvent(
      EventCategory.PDF,
      'generate',
      withWatermark ? 'with_watermark' : 'without_watermark',
      { url: pageUrl }
    );
  }
  
  /**
   * Tracks a watermark creation event
   * @param {string} type - Type of watermark (text, image)
   * @param {Object} config - Watermark configuration
   */
  trackWatermarkCreation(type, config) {
    this.trackEvent(
      EventCategory.WATERMARK,
      'create',
      type,
      { config }
    );
  }
  
  /**
   * Tracks a template usage event
   * @param {string} templateId - ID of the template
   * @param {string} templateName - Name of the template
   */
  trackTemplateUsage(templateId, templateName) {
    this.trackEvent(
      EventCategory.TEMPLATE,
      'use',
      templateName,
      { templateId }
    );
  }
  
  /**
   * Tracks a template creation event
   * @param {string} templateId - ID of the template
   * @param {string} templateName - Name of the template
   */
  trackTemplateCreation(templateId, templateName) {
    this.trackEvent(
      EventCategory.TEMPLATE,
      'create',
      templateName,
      { templateId }
    );
  }
  
  /**
   * Tracks a settings change event
   * @param {string} setting - The setting that was changed
   * @param {any} value - The new value
   */
  trackSettingsChange(setting, value) {
    this.trackEvent(
      EventCategory.SETTINGS,
      'change',
      setting,
      { value }
    );
  }
  
  /**
   * Tracks a premium feature interaction
   * @param {string} feature - The premium feature
   * @param {string} action - The action taken (view, click, etc.)
   */
  trackPremiumFeature(feature, action) {
    this.trackEvent(
      EventCategory.PREMIUM,
      action,
      feature
    );
  }
  
  /**
   * Tracks an error
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   * @param {Object} metadata - Additional error metadata
   */
  trackError(errorType, errorMessage, metadata = {}) {
    this.trackEvent(
      EventCategory.ERROR,
      errorType,
      errorMessage,
      metadata
    );
  }
  
  /**
   * Tracks a UI interaction
   * @param {string} element - UI element
   * @param {string} action - Action taken
   */
  trackUIInteraction(element, action) {
    this.trackEvent(
      EventCategory.UI,
      action,
      element
    );
  }
  
  /**
   * Enables analytics
   */
  enable() {
    this.enabled = true;
    chrome.storage.sync.set({ analyticsSettings: { enabled: true } });
  }
  
  /**
   * Disables analytics
   */
  disable() {
    this.enabled = false;
    chrome.storage.sync.set({ analyticsSettings: { enabled: false } });
  }
}

// Create a default analytics instance
export const analytics = new Analytics();

// Initialize analytics
analytics.initialize().catch(console.error);

// Export convenience functions
export function trackEvent(category, action, label = null, value = null) {
  analytics.trackEvent(category, action, label, value);
}

export function trackPdfGeneration(withWatermark, pageUrl) {
  analytics.trackPdfGeneration(withWatermark, pageUrl);
}

export function trackWatermarkCreation(type, config) {
  analytics.trackWatermarkCreation(type, config);
}

export function trackTemplateUsage(templateId, templateName) {
  analytics.trackTemplateUsage(templateId, templateName);
}

export function trackTemplateCreation(templateId, templateName) {
  analytics.trackTemplateCreation(templateId, templateName);
}

export function trackSettingsChange(setting, value) {
  analytics.trackSettingsChange(setting, value);
}

export function trackPremiumFeature(feature, action) {
  analytics.trackPremiumFeature(feature, action);
}

export function trackError(errorType, errorMessage, metadata = {}) {
  analytics.trackError(errorType, errorMessage, metadata);
}

export function trackUIInteraction(element, action) {
  analytics.trackUIInteraction(element, action);
}
