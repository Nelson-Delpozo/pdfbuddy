/**
 * PDF Buddy - Template Manager
 * 
 * This module provides utilities for managing watermark templates.
 */

import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackTemplateCreation, trackTemplateUsage, trackError } from './analytics.js';
import { validateWatermarkConfig } from './security.js';
import { isFeatureAvailable } from './license-manager.js';
import { PremiumFeature } from './license-manager.js';
import { getFromLocal, setInLocal, removeFromLocal } from './storage.js';
import { safeJsonParse, safeJsonStringify, generateRandomString } from './security.js';

// Storage key for templates
const TEMPLATES_STORAGE_KEY = 'watermark_templates';

// Maximum number of templates for free users
const MAX_FREE_TEMPLATES = 3;

/**
 * Gets all templates
 * @returns {Promise<Array>} - Array of templates
 */
export async function getTemplates() {
  try {
    const templates = await getFromLocal(TEMPLATES_STORAGE_KEY, []);
    return templates;
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to get templates: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'get_failed', { error: error.message });
    return [];
  }
}

/**
 * Gets a template by ID
 * @param {string} id - The template ID
 * @returns {Promise<Object|null>} - The template or null if not found
 */
export async function getTemplateById(id) {
  try {
    const templates = await getTemplates();
    const template = templates.find(t => t.id === id);
    
    if (template) {
      trackTemplateUsage(template.id, template.name);
    }
    
    return template || null;
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to get template by ID: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'get_by_id_failed', { id, error: error.message });
    return null;
  }
}

/**
 * Saves a template
 * @param {string} name - The template name
 * @param {Object} watermarkConfig - The watermark configuration
 * @returns {Promise<Object>} - The saved template
 */
export async function saveTemplate(name, watermarkConfig) {
  try {
    // Validate watermark configuration
    const validatedConfig = validateWatermarkConfig(watermarkConfig);
    if (!validatedConfig) {
      throw new Error('Invalid watermark configuration');
    }
    
    // Get existing templates
    const templates = await getTemplates();
    
    // Check if we've reached the template limit for free users
    if (templates.length >= MAX_FREE_TEMPLATES && !isFeatureAvailable(PremiumFeature.UNLIMITED_TEMPLATES)) {
      throw new Error(`Free users are limited to ${MAX_FREE_TEMPLATES} templates. Upgrade to premium for unlimited templates.`);
    }
    
    // Create a new template
    const template = {
      id: generateRandomString(8),
      name,
      config: validatedConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add the template to the list
    templates.push(template);
    
    // Save the templates
    await setInLocal(TEMPLATES_STORAGE_KEY, templates);
    
    // Track template creation
    trackTemplateCreation(template.id, template.name);
    
    return template;
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to save template: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'save_failed', { name, error: error.message });
    throw templateError;
  }
}

/**
 * Updates a template
 * @param {string} id - The template ID
 * @param {string} name - The new template name
 * @param {Object} watermarkConfig - The new watermark configuration
 * @returns {Promise<Object>} - The updated template
 */
export async function updateTemplate(id, name, watermarkConfig) {
  try {
    // Validate watermark configuration
    const validatedConfig = validateWatermarkConfig(watermarkConfig);
    if (!validatedConfig) {
      throw new Error('Invalid watermark configuration');
    }
    
    // Get existing templates
    const templates = await getTemplates();
    
    // Find the template
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      throw new Error(`Template with ID ${id} not found`);
    }
    
    // Update the template
    templates[templateIndex] = {
      ...templates[templateIndex],
      name,
      config: validatedConfig,
      updatedAt: new Date().toISOString()
    };
    
    // Save the templates
    await setInLocal(TEMPLATES_STORAGE_KEY, templates);
    
    return templates[templateIndex];
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to update template: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'update_failed', { id, name, error: error.message });
    throw templateError;
  }
}

/**
 * Deletes a template
 * @param {string} id - The template ID
 * @returns {Promise<boolean>} - Whether the template was deleted
 */
export async function deleteTemplate(id) {
  try {
    // Get existing templates
    const templates = await getTemplates();
    
    // Find the template
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      throw new Error(`Template with ID ${id} not found`);
    }
    
    // Remove the template
    templates.splice(templateIndex, 1);
    
    // Save the templates
    await setInLocal(TEMPLATES_STORAGE_KEY, templates);
    
    return true;
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to delete template: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'delete_failed', { id, error: error.message });
    return false;
  }
}

/**
 * Imports templates from a JSON string
 * @param {string} jsonString - The JSON string containing templates
 * @returns {Promise<number>} - The number of templates imported
 */
export async function importTemplates(jsonString) {
  try {
    // Parse the JSON string
    const importedTemplates = safeJsonParse(jsonString, []);
    if (!Array.isArray(importedTemplates)) {
      throw new Error('Invalid template data');
    }
    
    // Get existing templates
    const templates = await getTemplates();
    
    // Check if we've reached the template limit for free users
    const totalTemplates = templates.length + importedTemplates.length;
    if (totalTemplates > MAX_FREE_TEMPLATES && !isFeatureAvailable(PremiumFeature.UNLIMITED_TEMPLATES)) {
      throw new Error(`Free users are limited to ${MAX_FREE_TEMPLATES} templates. Upgrade to premium for unlimited templates.`);
    }
    
    // Validate and add each template
    let importedCount = 0;
    for (const template of importedTemplates) {
      // Validate the template
      if (!template.name || !template.config) {
        continue;
      }
      
      // Validate the watermark configuration
      const validatedConfig = validateWatermarkConfig(template.config);
      if (!validatedConfig) {
        continue;
      }
      
      // Create a new template
      const newTemplate = {
        id: generateRandomString(8),
        name: template.name,
        config: validatedConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the template to the list
      templates.push(newTemplate);
      importedCount++;
      
      // Track template creation
      trackTemplateCreation(newTemplate.id, newTemplate.name);
    }
    
    // Save the templates
    await setInLocal(TEMPLATES_STORAGE_KEY, templates);
    
    return importedCount;
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to import templates: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'import_failed', { error: error.message });
    throw templateError;
  }
}

/**
 * Exports templates to a JSON string
 * @returns {Promise<string>} - The JSON string containing templates
 */
export async function exportTemplates() {
  try {
    // Get all templates
    const templates = await getTemplates();
    
    // Convert to JSON string
    return safeJsonStringify(templates);
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to export templates: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'export_failed', { error: error.message });
    throw templateError;
  }
}

/**
 * Gets the number of templates
 * @returns {Promise<number>} - The number of templates
 */
export async function getTemplateCount() {
  try {
    const templates = await getTemplates();
    return templates.length;
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to get template count: ${error.message}`,
      ErrorSeverity.WARNING,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'count_failed', { error: error.message });
    return 0;
  }
}

/**
 * Checks if a user can create more templates
 * @returns {Promise<boolean>} - Whether the user can create more templates
 */
export async function canCreateTemplate() {
  try {
    // Get the number of templates
    const count = await getTemplateCount();
    
    // Check if we've reached the template limit for free users
    return count < MAX_FREE_TEMPLATES || isFeatureAvailable(PremiumFeature.UNLIMITED_TEMPLATES);
  } catch (error) {
    const templateError = errorHandler.createTemplateError(
      `Failed to check if user can create template: ${error.message}`,
      ErrorSeverity.WARNING,
      error
    );
    errorHandler.handleError(templateError);
    trackError('template', 'can_create_failed', { error: error.message });
    return false;
  }
}

/**
 * Gets the maximum number of templates allowed
 * @returns {Promise<number>} - The maximum number of templates
 */
export async function getMaxTemplates() {
  return isFeatureAvailable(PremiumFeature.UNLIMITED_TEMPLATES) ? Infinity : MAX_FREE_TEMPLATES;
}
