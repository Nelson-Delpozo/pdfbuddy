/**
 * PDF Buddy - Permissions Utility
 * 
 * This module provides utilities for checking and requesting permissions.
 */

import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js';
import { trackError } from './analytics.js';

/**
 * Permission types
 * @enum {string}
 */
export const PermissionType = {
  DOWNLOADS: 'downloads',
  DOWNLOADS_OPEN: 'downloads.open',
  STORAGE: 'storage',
  ACTIVE_TAB: 'activeTab',
  TABS: 'tabs',
  CONTEXT_MENUS: 'contextMenus',
  NOTIFICATIONS: 'notifications'
};

/**
 * Feature permissions map
 * Maps features to the permissions they require
 */
export const FeaturePermissions = {
  PDF_GENERATION: [PermissionType.ACTIVE_TAB, PermissionType.DOWNLOADS],
  WATERMARK: [PermissionType.ACTIVE_TAB, PermissionType.DOWNLOADS],
  TEMPLATES: [PermissionType.STORAGE],
  CONTEXT_MENU: [PermissionType.CONTEXT_MENUS, PermissionType.ACTIVE_TAB, PermissionType.DOWNLOADS],
  NOTIFICATIONS: [PermissionType.NOTIFICATIONS],
  AUTO_OPEN: [PermissionType.DOWNLOADS_OPEN]
};

/**
 * Checks if a permission is granted
 * @param {string|string[]} permissions - The permission(s) to check
 * @returns {Promise<boolean>} - Whether the permission(s) are granted
 */
export async function hasPermission(permissions) {
  try {
    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions];
    
    // Filter out permissions that don't need to be checked with the permissions API
    const permissionsToCheckWithAPI = permissionsToCheck.filter(
      permission => permission !== PermissionType.STORAGE && 
                   permission !== PermissionType.CONTEXT_MENUS
    );
    
    // If there are no permissions to check with the API, return true
    if (permissionsToCheckWithAPI.length === 0) {
      return true;
    }
    
    // Check permissions with the permissions API
    const result = await chrome.permissions.contains({
      permissions: permissionsToCheckWithAPI
    });
    
    return result;
  } catch (error) {
    const permissionError = errorHandler.createPermissionError(
      `Failed to check permission: ${error.message}`,
      ErrorSeverity.WARNING,
      error
    );
    errorHandler.handleError(permissionError);
    trackError('permission', 'check_failed', { permissions });
    return false;
  }
}

/**
 * Requests permissions from the user
 * @param {string|string[]} permissions - The permission(s) to request
 * @returns {Promise<boolean>} - Whether the permission(s) were granted
 */
export async function requestPermission(permissions) {
  try {
    const permissionsToRequest = Array.isArray(permissions) ? permissions : [permissions];
    
    // Filter out permissions that don't need to be requested with the permissions API
    const permissionsToRequestWithAPI = permissionsToRequest.filter(
      permission => permission !== PermissionType.STORAGE && 
                   permission !== PermissionType.CONTEXT_MENUS
    );
    
    // If there are no permissions to request with the API, return true
    if (permissionsToRequestWithAPI.length === 0) {
      return true;
    }
    
    // Request permissions with the permissions API
    const result = await chrome.permissions.request({
      permissions: permissionsToRequestWithAPI
    });
    
    return result;
  } catch (error) {
    const permissionError = errorHandler.createPermissionError(
      `Failed to request permission: ${error.message}`,
      ErrorSeverity.ERROR,
      error
    );
    errorHandler.handleError(permissionError);
    trackError('permission', 'request_failed', { permissions });
    return false;
  }
}

/**
 * Checks if a feature has all required permissions
 * @param {string} feature - The feature to check
 * @returns {Promise<boolean>} - Whether the feature has all required permissions
 */
export async function hasFeaturePermissions(feature) {
  const requiredPermissions = FeaturePermissions[feature];
  
  if (!requiredPermissions) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  
  return hasPermission(requiredPermissions);
}

/**
 * Requests all permissions required for a feature
 * @param {string} feature - The feature to request permissions for
 * @returns {Promise<boolean>} - Whether all permissions were granted
 */
export async function requestFeaturePermissions(feature) {
  const requiredPermissions = FeaturePermissions[feature];
  
  if (!requiredPermissions) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  
  return requestPermission(requiredPermissions);
}

/**
 * Ensures a feature has all required permissions
 * If not, requests them from the user
 * @param {string} feature - The feature to ensure permissions for
 * @returns {Promise<boolean>} - Whether all permissions are granted
 */
export async function ensureFeaturePermissions(feature) {
  // Check if the feature already has all required permissions
  const hasPermissions = await hasFeaturePermissions(feature);
  
  if (hasPermissions) {
    return true;
  }
  
  // Request permissions if not already granted
  return requestFeaturePermissions(feature);
}

/**
 * Gets all currently granted permissions
 * @returns {Promise<string[]>} - Array of granted permissions
 */
export async function getGrantedPermissions() {
  try {
    const permissions = await chrome.permissions.getAll();
    return permissions.permissions || [];
  } catch (error) {
    const permissionError = errorHandler.createPermissionError(
      `Failed to get granted permissions: ${error.message}`,
      ErrorSeverity.WARNING,
      error
    );
    errorHandler.handleError(permissionError);
    trackError('permission', 'get_granted_failed');
    return [];
  }
}

/**
 * Removes a permission
 * @param {string|string[]} permissions - The permission(s) to remove
 * @returns {Promise<boolean>} - Whether the permission(s) were removed
 */
export async function removePermission(permissions) {
  try {
    const permissionsToRemove = Array.isArray(permissions) ? permissions : [permissions];
    
    // Filter out permissions that can't be removed with the permissions API
    const permissionsToRemoveWithAPI = permissionsToRemove.filter(
      permission => permission !== PermissionType.STORAGE && 
                   permission !== PermissionType.CONTEXT_MENUS
    );
    
    // If there are no permissions to remove with the API, return true
    if (permissionsToRemoveWithAPI.length === 0) {
      return true;
    }
    
    // Remove permissions with the permissions API
    const result = await chrome.permissions.remove({
      permissions: permissionsToRemoveWithAPI
    });
    
    return result;
  } catch (error) {
    const permissionError = errorHandler.createPermissionError(
      `Failed to remove permission: ${error.message}`,
      ErrorSeverity.WARNING,
      error
    );
    errorHandler.handleError(permissionError);
    trackError('permission', 'remove_failed', { permissions });
    return false;
  }
}

/**
 * Gets a user-friendly name for a permission
 * @param {string} permission - The permission to get a name for
 * @returns {string} - User-friendly name for the permission
 */
export function getPermissionName(permission) {
  const permissionNames = {
    [PermissionType.DOWNLOADS]: 'Download files',
    [PermissionType.DOWNLOADS_OPEN]: 'Open downloaded files',
    [PermissionType.STORAGE]: 'Store data',
    [PermissionType.ACTIVE_TAB]: 'Access the current tab',
    [PermissionType.TABS]: 'Access browser tabs',
    [PermissionType.CONTEXT_MENUS]: 'Add context menu items',
    [PermissionType.NOTIFICATIONS]: 'Show notifications'
  };
  
  return permissionNames[permission] || permission;
}

/**
 * Gets a user-friendly description for a permission
 * @param {string} permission - The permission to get a description for
 * @returns {string} - User-friendly description for the permission
 */
export function getPermissionDescription(permission) {
  const permissionDescriptions = {
    [PermissionType.DOWNLOADS]: 'Allows the extension to download files to your computer',
    [PermissionType.DOWNLOADS_OPEN]: 'Allows the extension to open files after downloading them',
    [PermissionType.STORAGE]: 'Allows the extension to store your settings and templates',
    [PermissionType.ACTIVE_TAB]: 'Allows the extension to access the content of the current tab',
    [PermissionType.TABS]: 'Allows the extension to access information about open tabs',
    [PermissionType.CONTEXT_MENUS]: 'Allows the extension to add items to the right-click menu',
    [PermissionType.NOTIFICATIONS]: 'Allows the extension to show notifications'
  };
  
  return permissionDescriptions[permission] || 'No description available';
}

/**
 * Gets a user-friendly name for a feature
 * @param {string} feature - The feature to get a name for
 * @returns {string} - User-friendly name for the feature
 */
export function getFeatureName(feature) {
  const featureNames = {
    PDF_GENERATION: 'PDF Generation',
    WATERMARK: 'Watermarking',
    TEMPLATES: 'Templates',
    CONTEXT_MENU: 'Context Menu',
    NOTIFICATIONS: 'Notifications',
    AUTO_OPEN: 'Auto-Open Downloads'
  };
  
  return featureNames[feature] || feature;
}

/**
 * Gets a user-friendly description for a feature
 * @param {string} feature - The feature to get a description for
 * @returns {string} - User-friendly description for the feature
 */
export function getFeatureDescription(feature) {
  const featureDescriptions = {
    PDF_GENERATION: 'Save web pages as PDF files',
    WATERMARK: 'Add text or image watermarks to PDFs',
    TEMPLATES: 'Save and reuse watermark templates',
    CONTEXT_MENU: 'Access PDF Buddy from the right-click menu',
    NOTIFICATIONS: 'Receive notifications about PDF generation',
    AUTO_OPEN: 'Automatically open PDFs after generation'
  };
  
  return featureDescriptions[feature] || 'No description available';
}
