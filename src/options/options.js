/**
 * PDF Buddy - Options Page Script
 * 
 * This script handles the options page UI interactions and saves settings.
 */

// DOM Elements
const formElements = {
  defaultText: document.getElementById('default-text'),
  defaultPosition: document.getElementById('default-position'),
  defaultOpacity: document.getElementById('default-opacity'),
  opacityValue: document.getElementById('opacity-value'),
  defaultColor: document.getElementById('default-color'),
  defaultFontSize: document.getElementById('default-font-size'),
  fontSizeValue: document.getElementById('font-size-value'),
  defaultFontFamily: document.getElementById('default-font-family'),
  saveLocation: document.getElementById('save-location')
};

const actionButtons = {
  saveSettings: document.getElementById('save-settings'),
  resetSettings: document.getElementById('reset-settings'),
  upgradeButton: document.getElementById('upgrade-button'),
  privacyPolicy: document.getElementById('privacy-policy'),
  termsOfService: document.getElementById('terms-of-service'),
  contactSupport: document.getElementById('contact-support')
};

const saveSuccessNotification = document.getElementById('save-success');

// Default settings
const defaultSettings = {
  defaultWatermarkText: 'CONFIDENTIAL',
  defaultPosition: 'center',
  defaultOpacity: 0.5,
  defaultColor: '#FF0000',
  defaultFontSize: 48,
  defaultFontFamily: 'Arial',
  saveLocation: 'downloads'
};

// Initialize the options page
document.addEventListener('DOMContentLoaded', () => {
  initializeFormControls();
  initializeButtons();
  
  // Load saved settings
  loadSettings();
});

/**
 * Initializes form controls and their event listeners
 */
function initializeFormControls() {
  // Update opacity value display when slider changes
  formElements.defaultOpacity.addEventListener('input', () => {
    const value = formElements.defaultOpacity.value;
    formElements.opacityValue.textContent = `${Math.round(value * 100)}%`;
  });
  
  // Update font size value display when slider changes
  formElements.defaultFontSize.addEventListener('input', () => {
    const value = formElements.defaultFontSize.value;
    formElements.fontSizeValue.textContent = `${value}px`;
  });
}

/**
 * Initializes button click handlers
 */
function initializeButtons() {
  // Save settings
  actionButtons.saveSettings.addEventListener('click', () => {
    saveSettings();
  });
  
  // Reset settings to defaults
  actionButtons.resetSettings.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
    }
  });
  
  // Upgrade to premium
  actionButtons.upgradeButton.addEventListener('click', () => {
    showPremiumUpgradeOptions();
  });
  
  // Privacy policy
  actionButtons.privacyPolicy.addEventListener('click', (e) => {
    e.preventDefault();
    openPrivacyPolicy();
  });
  
  // Terms of service
  actionButtons.termsOfService.addEventListener('click', (e) => {
    e.preventDefault();
    openTermsOfService();
  });
  
  // Contact support
  actionButtons.contactSupport.addEventListener('click', (e) => {
    e.preventDefault();
    openContactSupport();
  });
}

/**
 * Loads settings from storage
 */
function loadSettings() {
  chrome.storage.sync.get('settings', (result) => {
    const settings = result.settings || defaultSettings;
    
    // Apply settings to form
    formElements.defaultText.value = settings.defaultWatermarkText || defaultSettings.defaultWatermarkText;
    formElements.defaultPosition.value = settings.defaultPosition || defaultSettings.defaultPosition;
    formElements.defaultOpacity.value = settings.defaultOpacity || defaultSettings.defaultOpacity;
    formElements.opacityValue.textContent = `${Math.round((settings.defaultOpacity || defaultSettings.defaultOpacity) * 100)}%`;
    formElements.defaultColor.value = settings.defaultColor || defaultSettings.defaultColor;
    formElements.defaultFontSize.value = settings.defaultFontSize || defaultSettings.defaultFontSize;
    formElements.fontSizeValue.textContent = `${settings.defaultFontSize || defaultSettings.defaultFontSize}px`;
    formElements.defaultFontFamily.value = settings.defaultFontFamily || defaultSettings.defaultFontFamily;
    formElements.saveLocation.value = settings.saveLocation || defaultSettings.saveLocation;
  });
}

/**
 * Saves settings to storage
 */
function saveSettings() {
  const settings = {
    defaultWatermarkText: formElements.defaultText.value,
    defaultPosition: formElements.defaultPosition.value,
    defaultOpacity: parseFloat(formElements.defaultOpacity.value),
    defaultColor: formElements.defaultColor.value,
    defaultFontSize: parseInt(formElements.defaultFontSize.value),
    defaultFontFamily: formElements.defaultFontFamily.value,
    saveLocation: formElements.saveLocation.value
  };
  
  chrome.storage.sync.set({ settings }, () => {
    showSaveSuccessNotification();
  });
}

/**
 * Resets settings to defaults
 */
function resetSettings() {
  // Apply default settings to form
  formElements.defaultText.value = defaultSettings.defaultWatermarkText;
  formElements.defaultPosition.value = defaultSettings.defaultPosition;
  formElements.defaultOpacity.value = defaultSettings.defaultOpacity;
  formElements.opacityValue.textContent = `${Math.round(defaultSettings.defaultOpacity * 100)}%`;
  formElements.defaultColor.value = defaultSettings.defaultColor;
  formElements.defaultFontSize.value = defaultSettings.defaultFontSize;
  formElements.fontSizeValue.textContent = `${defaultSettings.defaultFontSize}px`;
  formElements.defaultFontFamily.value = defaultSettings.defaultFontFamily;
  formElements.saveLocation.value = defaultSettings.saveLocation;
  
  // Save default settings to storage
  chrome.storage.sync.set({ settings: defaultSettings }, () => {
    showSaveSuccessNotification();
  });
}

/**
 * Shows the save success notification
 */
function showSaveSuccessNotification() {
  saveSuccessNotification.classList.add('show');
  
  setTimeout(() => {
    saveSuccessNotification.classList.remove('show');
  }, 3000);
}

/**
 * Shows premium upgrade options
 * This is a placeholder for the premium upgrade flow
 */
function showPremiumUpgradeOptions() {
  // In a real implementation, this would open a payment page or show upgrade options
  alert('Premium upgrade feature will be implemented in the future.');
}

/**
 * Opens the privacy policy page
 * This is a placeholder for the privacy policy page
 */
function openPrivacyPolicy() {
  // In a real implementation, this would open the privacy policy page
  alert('Privacy Policy will be available soon.');
}

/**
 * Opens the terms of service page
 * This is a placeholder for the terms of service page
 */
function openTermsOfService() {
  // In a real implementation, this would open the terms of service page
  alert('Terms of Service will be available soon.');
}

/**
 * Opens the contact support page
 * This is a placeholder for the contact support page
 */
function openContactSupport() {
  // In a real implementation, this would open the contact support page
  alert('Support contact information will be available soon.');
}
