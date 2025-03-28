/**
 * PDF Buddy - License Manager
 * 
 * This module provides license management functionality for premium features.
 * In a production environment, this would connect to a license server for verification.
 */

/**
 * License types
 * @enum {string}
 */
export const LicenseType = {
  FREE: 'free',
  PREMIUM: 'premium',
  TRIAL: 'trial'
};

/**
 * Premium features
 * @enum {string}
 */
export const PremiumFeature = {
  IMAGE_WATERMARK: 'image_watermark',
  UNLIMITED_TEMPLATES: 'unlimited_templates',
  ADVANCED_STYLING: 'advanced_styling',
  BATCH_PROCESSING: 'batch_processing',
  CLOUD_STORAGE: 'cloud_storage'
};

/**
 * License manager class
 */
export class LicenseManager {
  /**
   * Creates a new LicenseManager
   */
  constructor() {
    this.licenseType = LicenseType.FREE;
    this.licenseKey = null;
    this.expiryDate = null;
    this.initialized = false;
    
    // Premium features configuration
    this.premiumFeatures = {
      [PremiumFeature.IMAGE_WATERMARK]: false,
      [PremiumFeature.UNLIMITED_TEMPLATES]: false,
      [PremiumFeature.ADVANCED_STYLING]: false,
      [PremiumFeature.BATCH_PROCESSING]: false,
      [PremiumFeature.CLOUD_STORAGE]: false
    };
  }
  
  /**
   * Initializes the license manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load license information from storage
      const licenseInfo = await this.getLicenseInfo();
      
      if (licenseInfo) {
        this.licenseType = licenseInfo.type || LicenseType.FREE;
        this.licenseKey = licenseInfo.key || null;
        this.expiryDate = licenseInfo.expiryDate ? new Date(licenseInfo.expiryDate) : null;
        
        // Set premium features based on license type
        this.updatePremiumFeatures();
        
        // Verify license if it's not free
        if (this.licenseType !== LicenseType.FREE) {
          await this.verifyLicense();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize license manager:', error);
      // Default to free license if there's an error
      this.licenseType = LicenseType.FREE;
      this.updatePremiumFeatures();
    }
  }
  
  /**
   * Gets license information from storage
   * @returns {Promise<Object>}
   */
  async getLicenseInfo() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('licenseInfo', (result) => {
        resolve(result.licenseInfo || null);
      });
    });
  }
  
  /**
   * Saves license information to storage
   * @param {Object} licenseInfo - License information
   * @returns {Promise<void>}
   */
  async saveLicenseInfo(licenseInfo) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ licenseInfo }, resolve);
    });
  }
  
  /**
   * Updates premium features based on license type
   */
  updatePremiumFeatures() {
    // Set all features to false by default
    Object.keys(this.premiumFeatures).forEach(feature => {
      this.premiumFeatures[feature] = false;
    });
    
    // Enable features based on license type
    if (this.licenseType === LicenseType.PREMIUM || this.licenseType === LicenseType.TRIAL) {
      Object.keys(this.premiumFeatures).forEach(feature => {
        this.premiumFeatures[feature] = true;
      });
    }
  }
  
  /**
   * Verifies the license with the license server
   * @returns {Promise<boolean>}
   */
  async verifyLicense() {
    // In a real implementation, this would verify the license with a server
    // For now, we'll just check if the license has expired
    
    if (!this.licenseKey) {
      await this.setLicenseType(LicenseType.FREE);
      return false;
    }
    
    if (this.expiryDate && this.expiryDate < new Date()) {
      await this.setLicenseType(LicenseType.FREE);
      return false;
    }
    
    // In production, this would make an API call to verify the license
    // Example:
    // try {
    //   const response = await fetch('https://api.pdfbuddy.app/license/verify', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //       licenseKey: this.licenseKey
    //     })
    //   });
    //   
    //   const data = await response.json();
    //   
    //   if (data.valid) {
    //     await this.setLicenseType(data.type, this.licenseKey, new Date(data.expiryDate));
    //     return true;
    //   } else {
    //     await this.setLicenseType(LicenseType.FREE);
    //     return false;
    //   }
    // } catch (error) {
    //   console.error('License verification failed:', error);
    //   return true; // Allow offline use
    // }
    
    return true;
  }
  
  /**
   * Sets the license type
   * @param {LicenseType} type - License type
   * @param {string} key - License key
   * @param {Date} expiryDate - Expiry date
   * @returns {Promise<void>}
   */
  async setLicenseType(type, key = null, expiryDate = null) {
    this.licenseType = type;
    this.licenseKey = key;
    this.expiryDate = expiryDate;
    
    // Update premium features
    this.updatePremiumFeatures();
    
    // Save license information
    await this.saveLicenseInfo({
      type: this.licenseType,
      key: this.licenseKey,
      expiryDate: this.expiryDate ? this.expiryDate.toISOString() : null
    });
  }
  
  /**
   * Activates a license
   * @param {string} licenseKey - License key
   * @returns {Promise<boolean>}
   */
  async activateLicense(licenseKey) {
    // In a real implementation, this would verify the license key with a server
    // For now, we'll just accept any key and set a premium license
    
    try {
      // In production, this would make an API call to activate the license
      // Example:
      // const response = await fetch('https://api.pdfbuddy.app/license/activate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     licenseKey: licenseKey
      //   })
      // });
      // 
      // const data = await response.json();
      // 
      // if (data.success) {
      //   await this.setLicenseType(data.type, licenseKey, new Date(data.expiryDate));
      //   return true;
      // } else {
      //   return false;
      // }
      
      // For now, we'll just accept any key and set a premium license
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await this.setLicenseType(LicenseType.PREMIUM, licenseKey, expiryDate);
      return true;
    } catch (error) {
      console.error('Failed to activate license:', error);
      return false;
    }
  }
  
  /**
   * Deactivates the license
   * @returns {Promise<boolean>}
   */
  async deactivateLicense() {
    try {
      await this.setLicenseType(LicenseType.FREE);
      return true;
    } catch (error) {
      console.error('Failed to deactivate license:', error);
      return false;
    }
  }
  
  /**
   * Starts a trial
   * @returns {Promise<boolean>}
   */
  async startTrial() {
    try {
      // Set a trial license with a 14-day expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      
      await this.setLicenseType(LicenseType.TRIAL, null, expiryDate);
      return true;
    } catch (error) {
      console.error('Failed to start trial:', error);
      return false;
    }
  }
  
  /**
   * Checks if a feature is available
   * @param {PremiumFeature} feature - Feature to check
   * @returns {boolean}
   */
  isFeatureAvailable(feature) {
    return this.premiumFeatures[feature] || false;
  }
  
  /**
   * Gets the license status
   * @returns {Object}
   */
  getLicenseStatus() {
    return {
      type: this.licenseType,
      key: this.licenseKey,
      expiryDate: this.expiryDate,
      features: { ...this.premiumFeatures }
    };
  }
  
  /**
   * Gets the remaining trial days
   * @returns {number}
   */
  getRemainingTrialDays() {
    if (this.licenseType !== LicenseType.TRIAL || !this.expiryDate) {
      return 0;
    }
    
    const now = new Date();
    const diffTime = this.expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
  
  /**
   * Checks if the license is active
   * @returns {boolean}
   */
  isLicenseActive() {
    return this.licenseType === LicenseType.PREMIUM || this.licenseType === LicenseType.TRIAL;
  }
  
  /**
   * Checks if the license is expired
   * @returns {boolean}
   */
  isLicenseExpired() {
    if (!this.expiryDate) {
      return false;
    }
    
    return this.expiryDate < new Date();
  }
}

// Create a default license manager instance
export const licenseManager = new LicenseManager();

// Initialize license manager
licenseManager.initialize().catch(console.error);

// Export convenience functions
export function isFeatureAvailable(feature) {
  return licenseManager.isFeatureAvailable(feature);
}

export function getLicenseStatus() {
  return licenseManager.getLicenseStatus();
}

export function isLicenseActive() {
  return licenseManager.isLicenseActive();
}

export function activateLicense(licenseKey) {
  return licenseManager.activateLicense(licenseKey);
}

export function startTrial() {
  return licenseManager.startTrial();
}

export function deactivateLicense() {
  return licenseManager.deactivateLicense();
}
