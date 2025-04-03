/**
 * PDF Buddy - Popup Script
 * 
 * This script handles the popup UI interactions and communicates with the background script.
 */

// State management
let currentTab = null;
let templates = [];
let currentTemplate = null;
let editingTemplateId = null;

// DOM Elements
const tabButtons = {
  quick: document.getElementById('tab-quick'),
  watermark: document.getElementById('tab-watermark'),
  templates: document.getElementById('tab-templates')
};

const tabSections = {
  quick: document.getElementById('quick-section'),
  watermark: document.getElementById('watermark-section'),
  templates: document.getElementById('templates-section')
};

const captureOptions = {
  pageLayout: document.getElementById('page-layout'),
  captureFullPage: document.getElementById('capture-full-page'),
  includeImages: document.getElementById('include-images'),
  includeBanners: document.getElementById('include-banners'),
  includeAds: document.getElementById('include-ads'),
  includeNav: document.getElementById('include-nav')
};

const watermarkForm = {
  text: document.getElementById('watermark-text'),
  position: document.getElementById('watermark-position'),
  opacity: document.getElementById('watermark-opacity'),
  opacityValue: document.getElementById('opacity-value'),
  color: document.getElementById('watermark-color'),
  size: document.getElementById('watermark-size'),
  sizeValue: document.getElementById('size-value'),
  rotation: document.getElementById('watermark-rotation'),
  rotationValue: document.getElementById('rotation-value'),
  font: document.getElementById('watermark-font'),
  image: document.getElementById('watermark-image')
};

const actionButtons = {
  savePdf: document.getElementById('save-pdf'),
  saveWithLast: document.getElementById('save-with-last'),
  saveWithWatermark: document.getElementById('save-with-watermark'),
  saveTemplate: document.getElementById('save-template'),
  newTemplate: document.getElementById('new-template'),
  openOptions: document.getElementById('open-options')
};

const modals = {
  saveTemplate: document.getElementById('save-template-modal'),
  deleteTemplate: document.getElementById('delete-template-modal')
};

const modalElements = {
  templateName: document.getElementById('template-name'),
  confirmSaveTemplate: document.getElementById('confirm-save-template'),
  cancelSaveTemplate: document.getElementById('cancel-save-template'),
  confirmDeleteTemplate: document.getElementById('confirm-delete-template'),
  cancelDeleteTemplate: document.getElementById('cancel-delete-template')
};

const templatesList = document.getElementById('templates-list');
const templateItemTemplate = document.getElementById('template-item-template');

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeFormControls();
  initializeButtons();
  initializeModals();
  
  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTab = tabs[0];
    
    // Load templates
    loadTemplates();
    
    // Load default settings
    loadSettings();
  });
});

/**
 * Initializes tab switching functionality
 */
function initializeTabs() {
  // Add click event listeners to tab buttons
  Object.keys(tabButtons).forEach(tabId => {
    tabButtons[tabId].addEventListener('click', () => {
      switchTab(tabId);
    });
  });
}

/**
 * Switches the active tab
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
  // Update tab buttons
  Object.keys(tabButtons).forEach(id => {
    tabButtons[id].classList.toggle('active', id === tabId);
  });
  
  // Update tab sections
  Object.keys(tabSections).forEach(id => {
    tabSections[id].classList.toggle('active', id === tabId);
  });
  
  // If switching to templates tab, refresh the templates list
  if (tabId === 'templates') {
    loadTemplates();
  }
}

/**
 * Initializes form controls and their event listeners
 */
function initializeFormControls() {
  // Update opacity value display when slider changes
  watermarkForm.opacity.addEventListener('input', () => {
    const value = watermarkForm.opacity.value;
    watermarkForm.opacityValue.textContent = `${Math.round(value * 100)}%`;
  });
  
  // Update size value display when slider changes
  watermarkForm.size.addEventListener('input', () => {
    const value = watermarkForm.size.value;
    watermarkForm.sizeValue.textContent = `${value}px`;
  });
  
  // Update rotation value display when slider changes
  watermarkForm.rotation.addEventListener('input', () => {
    const value = watermarkForm.rotation.value;
    watermarkForm.rotationValue.textContent = `${value}°`;
  });
}

/**
 * Initializes button click handlers
 */
function initializeButtons() {
  // Save PDF without watermark
  actionButtons.savePdf.addEventListener('click', () => {
    savePDF(false);
  });
  
  // Save PDF with last used watermark
  actionButtons.saveWithLast.addEventListener('click', () => {
    // Show loading overlay
    showLoadingOverlay('Preparing page for PDF generation...');
    
    // Get content filter options
    const contentFilters = {
      includeImages: captureOptions.includeImages.checked,
      includeBanners: captureOptions.includeBanners.checked,
      includeAds: captureOptions.includeAds.checked,
      includeNav: captureOptions.includeNav.checked
    };
    
    // Get page layout option
    const pageLayout = captureOptions.pageLayout.value;
    
    // Send message to generate PDF with last watermark
    chrome.runtime.sendMessage({
      action: 'generatePDF',
      tabId: currentTab.id,
      options: {
        useWatermark: true,
        useLastWatermark: true,
        pageLayout: pageLayout,
        contentFilters: contentFilters,
        captureFullPage: captureOptions.captureFullPage.checked // Use the checkbox value
      }
    }, (response) => {
      // Hide loading overlay
      hideLoadingOverlay();
      
      if (response && response.success) {
        window.close(); // Close popup after successful action
      } else {
        showError(response?.error || 'Failed to generate PDF with last watermark');
      }
    });
    
    // Listen for progress updates
    chrome.runtime.onMessage.addListener(function progressListener(message) {
      if (message.action === 'pdfProgress') {
        updateLoadingProgress(message.progress);
        
        // If complete, remove listener
        if (message.complete) {
          chrome.runtime.onMessage.removeListener(progressListener);
        }
      }
    });
  });
  
  // Save PDF with current watermark settings
  actionButtons.saveWithWatermark.addEventListener('click', () => {
    savePDF(true);
  });
  
  // Open save template modal
  actionButtons.saveTemplate.addEventListener('click', () => {
    openSaveTemplateModal();
  });
  
  // Create new template (switch to watermark tab)
  actionButtons.newTemplate.addEventListener('click', () => {
    // Clear form and switch to watermark tab
    resetWatermarkForm();
    editingTemplateId = null;
    switchTab('watermark');
  });
  
  // Open options page
  actionButtons.openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

/**
 * Initializes modal dialogs
 */
function initializeModals() {
  // Save template modal
  modalElements.confirmSaveTemplate.addEventListener('click', () => {
    saveCurrentTemplate();
  });
  
  modalElements.cancelSaveTemplate.addEventListener('click', () => {
    closeModal(modals.saveTemplate);
  });
  
  // Delete template modal
  modalElements.confirmDeleteTemplate.addEventListener('click', () => {
    deleteCurrentTemplate();
  });
  
  modalElements.cancelDeleteTemplate.addEventListener('click', () => {
    closeModal(modals.deleteTemplate);
  });
}

/**
 * Loads templates from storage
 */
function loadTemplates() {
  chrome.runtime.sendMessage({ action: 'getTemplates' }, (response) => {
    if (response && response.templates) {
      templates = response.templates;
      renderTemplates();
    }
  });
}

/**
 * Loads default settings from storage
 */
function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      const settings = response.settings;
      
      // Apply default values to form
      watermarkForm.text.value = settings.defaultWatermarkText || 'CONFIDENTIAL';
      watermarkForm.position.value = settings.defaultPosition || 'center';
      watermarkForm.opacity.value = settings.defaultOpacity || 0.5;
      watermarkForm.opacityValue.textContent = `${Math.round((settings.defaultOpacity || 0.5) * 100)}%`;
      watermarkForm.color.value = settings.defaultColor || '#FF0000';
      watermarkForm.size.value = settings.defaultFontSize || 48;
      watermarkForm.sizeValue.textContent = `${settings.defaultFontSize || 48}px`;
      watermarkForm.font.value = settings.defaultFontFamily || 'Arial';
    }
  });
}

/**
 * Renders the templates list
 */
function renderTemplates() {
  // Clear the templates list
  templatesList.innerHTML = '';
  
  if (templates.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'template-loading';
    emptyMessage.textContent = 'No templates yet. Create your first template!';
    templatesList.appendChild(emptyMessage);
    return;
  }
  
  // Add each template to the list
  templates.forEach(template => {
    const templateItem = document.importNode(templateItemTemplate.content, true);
    
    // Set template name
    templateItem.querySelector('.template-name').textContent = template.name;
    
    // Set template preview text
    const previewText = template.type === 'text' 
      ? `"${template.text}" (${template.position}, ${template.color})`
      : 'Image watermark';
    templateItem.querySelector('.template-preview').textContent = previewText;
    
    // Set up button actions
    const useButton = templateItem.querySelector('.use-template');
    const editButton = templateItem.querySelector('.edit-template');
    const deleteButton = templateItem.querySelector('.delete-template');
    
    useButton.addEventListener('click', () => {
      useTemplate(template);
    });
    
    editButton.addEventListener('click', () => {
      editTemplate(template);
    });
    
    deleteButton.addEventListener('click', () => {
      openDeleteTemplateModal(template);
    });
    
    // Add the template item to the list
    templatesList.appendChild(templateItem);
  });
}

/**
 * Opens the save template modal
 */
function openSaveTemplateModal() {
  // Get current watermark settings
  const templateName = editingTemplateId 
    ? templates.find(t => t.id === editingTemplateId)?.name || ''
    : '';
  
  modalElements.templateName.value = templateName;
  openModal(modals.saveTemplate);
}

/**
 * Opens the delete template confirmation modal
 * @param {Object} template - The template to delete
 */
function openDeleteTemplateModal(template) {
  currentTemplate = template;
  openModal(modals.deleteTemplate);
}

/**
 * Opens a modal dialog
 * @param {HTMLElement} modal - The modal element to open
 */
function openModal(modal) {
  modal.classList.add('active');
}

/**
 * Closes a modal dialog
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
  modal.classList.remove('active');
}

/**
 * Saves the current watermark settings as a template
 */
function saveCurrentTemplate() {
  const name = modalElements.templateName.value.trim();
  
  if (!name) {
    alert('Please enter a template name');
    return;
  }
  
  // Create template object from current form values
  const template = {
    id: editingTemplateId || `template_${Date.now()}`,
    name: name,
    type: 'text', // Only text watermarks in free version
    text: watermarkForm.text.value,
    position: watermarkForm.position.value,
    opacity: parseFloat(watermarkForm.opacity.value),
    color: watermarkForm.color.value,
    fontSize: parseInt(watermarkForm.size.value),
    fontFamily: watermarkForm.font.value,
    rotation: parseInt(watermarkForm.rotation.value)
  };
  
  // Save template
  chrome.runtime.sendMessage({
    action: 'saveTemplate',
    template: template
  }, (response) => {
    if (response && response.success) {
      templates = response.templates;
      closeModal(modals.saveTemplate);
      
      // Switch to templates tab to show the new template
      switchTab('templates');
    } else if (response && response.error) {
      alert(response.error);
    } else {
      alert('Failed to save template');
    }
  });
}

/**
 * Deletes the current template
 */
function deleteCurrentTemplate() {
  if (!currentTemplate) {
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'deleteTemplate',
    templateId: currentTemplate.id
  }, (response) => {
    if (response && response.success) {
      templates = response.templates;
      closeModal(modals.deleteTemplate);
      renderTemplates();
    } else {
      alert('Failed to delete template');
    }
  });
}

/**
 * Uses a template for PDF generation
 * @param {Object} template - The template to use
 */
function useTemplate(template) {
  // Show loading overlay
  showLoadingOverlay('Preparing page for PDF generation...');
  
  // Get content filter options
  const contentFilters = {
    includeImages: captureOptions.includeImages.checked,
    includeBanners: captureOptions.includeBanners.checked,
    includeAds: captureOptions.includeAds.checked,
    includeNav: captureOptions.includeNav.checked
  };
  
  // Get page layout option
  const pageLayout = captureOptions.pageLayout.value;
  
  // Send message to generate PDF with template
  chrome.runtime.sendMessage({
    action: 'generatePDF',
    tabId: currentTab.id,
    options: {
      useWatermark: true,
      watermarkConfig: template,
      pageLayout: pageLayout,
      contentFilters: contentFilters,
      captureFullPage: captureOptions.captureFullPage.checked // Use the checkbox value
    }
  }, (response) => {
    // Hide loading overlay
    hideLoadingOverlay();
    
    if (response && response.success) {
      window.close(); // Close popup after successful action
    } else {
      showError(response?.error || 'Failed to generate PDF with template');
    }
  });
  
  // Listen for progress updates
  chrome.runtime.onMessage.addListener(function progressListener(message) {
    if (message.action === 'pdfProgress') {
      updateLoadingProgress(message.progress);
      
      // If complete, remove listener
      if (message.complete) {
        chrome.runtime.onMessage.removeListener(progressListener);
      }
    }
  });
}

/**
 * Loads a template into the watermark form for editing
 * @param {Object} template - The template to edit
 */
function editTemplate(template) {
  // Set form values from template
  watermarkForm.text.value = template.text || '';
  watermarkForm.position.value = template.position || 'center';
  watermarkForm.opacity.value = template.opacity || 0.5;
  watermarkForm.opacityValue.textContent = `${Math.round((template.opacity || 0.5) * 100)}%`;
  watermarkForm.color.value = template.color || '#FF0000';
  watermarkForm.size.value = template.fontSize || 48;
  watermarkForm.sizeValue.textContent = `${template.fontSize || 48}px`;
  watermarkForm.rotation.value = template.rotation || 0;
  watermarkForm.rotationValue.textContent = `${template.rotation || 0}°`;
  watermarkForm.font.value = template.fontFamily || 'Arial';
  
  // Set editing state
  editingTemplateId = template.id;
  
  // Switch to watermark tab
  switchTab('watermark');
}

/**
 * Resets the watermark form to default values
 */
function resetWatermarkForm() {
  // Load default settings
  loadSettings();
  
  // Reset rotation to 0
  watermarkForm.rotation.value = 0;
  watermarkForm.rotationValue.textContent = '0°';
}

/**
 * Creates and shows a loading overlay
 * @param {string} message - The message to display
 * @returns {HTMLElement} - The loading overlay element
 */
function showLoadingOverlay(message = 'Generating PDF...') {
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    overlay.appendChild(spinner);
    
    const messageEl = document.createElement('div');
    messageEl.className = 'loading-message';
    overlay.appendChild(messageEl);
    
    const progress = document.createElement('div');
    progress.className = 'loading-progress';
    overlay.appendChild(progress);
    
    document.body.appendChild(overlay);
  }
  
  // Update message
  overlay.querySelector('.loading-message').textContent = message;
  overlay.querySelector('.loading-progress').textContent = '';
  
  // Show overlay
  overlay.style.display = 'flex';
  
  return overlay;
}

/**
 * Updates the loading overlay progress
 * @param {string} progressText - The progress text to display
 */
function updateLoadingProgress(progressText) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    const progress = overlay.querySelector('.loading-progress');
    if (progress) {
      progress.textContent = progressText;
    }
  }
}

/**
 * Hides the loading overlay
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Saves the current page as PDF
 * @param {boolean} useWatermark - Whether to apply a watermark
 */
function savePDF(useWatermark) {
  // Show loading overlay
  showLoadingOverlay('Preparing page for PDF generation...');
  
  // Get content filter options
  const contentFilters = {
    includeImages: captureOptions.includeImages.checked,
    includeBanners: captureOptions.includeBanners.checked,
    includeAds: captureOptions.includeAds.checked,
    includeNav: captureOptions.includeNav.checked
  };
  
  // Get page layout option
  const pageLayout = captureOptions.pageLayout.value;
  
  // Prepare options object
  const options = {
    useWatermark: useWatermark,
    pageLayout: pageLayout,
    contentFilters: contentFilters,
    captureFullPage: captureOptions.captureFullPage.checked // Use the checkbox value
  };
  
  // Add watermark config if needed
  if (useWatermark) {
    // Get watermark configuration from form
    const watermarkConfig = {
      type: 'text', // Only text watermarks in free version
      text: watermarkForm.text.value,
      position: watermarkForm.position.value,
      opacity: parseFloat(watermarkForm.opacity.value),
      color: watermarkForm.color.value,
      fontSize: parseInt(watermarkForm.size.value),
      fontFamily: watermarkForm.font.value,
      rotation: parseInt(watermarkForm.rotation.value)
    };
    
    // Validate watermark text
    if (!watermarkConfig.text) {
      hideLoadingOverlay();
      alert('Please enter watermark text');
      return;
    }
    
    options.watermarkConfig = watermarkConfig;
  }
  
  // Send message to generate PDF
  chrome.runtime.sendMessage({
    action: 'generatePDF',
    tabId: currentTab.id,
    options: options
  }, (response) => {
    // Hide loading overlay
    hideLoadingOverlay();
    
    if (response && response.success) {
      window.close(); // Close popup after successful action
    } else {
      showError(response?.error || 'Failed to generate PDF');
    }
  });
  
  // Listen for progress updates
  chrome.runtime.onMessage.addListener(function progressListener(message) {
    if (message.action === 'pdfProgress') {
      updateLoadingProgress(message.progress);
      
      // If complete, remove listener
      if (message.complete) {
        chrome.runtime.onMessage.removeListener(progressListener);
      }
    }
  });
}

/**
 * Shows an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
  console.error(message);
  alert(message);
}
