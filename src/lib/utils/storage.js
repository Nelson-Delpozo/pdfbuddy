/**
 * PDF Buddy - Storage Utilities
 * 
 * This module provides utility functions for working with Chrome's storage APIs.
 */

/**
 * Gets a value from sync storage
 * @param {string} key - The key to get
 * @param {*} defaultValue - The default value to return if the key doesn't exist
 * @returns {Promise<*>} - The value from storage or the default value
 */
export function getFromSync(key, defaultValue = null) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

/**
 * Sets a value in sync storage
 * @param {string} key - The key to set
 * @param {*} value - The value to set
 * @returns {Promise<void>}
 */
export function setInSync(key, value) {
  return new Promise((resolve) => {
    const data = {};
    data[key] = value;
    chrome.storage.sync.set(data, resolve);
  });
}

/**
 * Gets a value from local storage
 * @param {string} key - The key to get
 * @param {*} defaultValue - The default value to return if the key doesn't exist
 * @returns {Promise<*>} - The value from storage or the default value
 */
export function getFromLocal(key, defaultValue = null) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

/**
 * Sets a value in local storage
 * @param {string} key - The key to set
 * @param {*} value - The value to set
 * @returns {Promise<void>}
 */
export function setInLocal(key, value) {
  return new Promise((resolve) => {
    const data = {};
    data[key] = value;
    chrome.storage.local.set(data, resolve);
  });
}

/**
 * Removes a value from sync storage
 * @param {string} key - The key to remove
 * @returns {Promise<void>}
 */
export function removeFromSync(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(key, resolve);
  });
}

/**
 * Removes a value from local storage
 * @param {string} key - The key to remove
 * @returns {Promise<void>}
 */
export function removeFromLocal(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

/**
 * Gets all values from sync storage
 * @returns {Promise<Object>} - All values in sync storage
 */
export function getAllFromSync() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, resolve);
  });
}

/**
 * Gets all values from local storage
 * @returns {Promise<Object>} - All values in local storage
 */
export function getAllFromLocal() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, resolve);
  });
}

/**
 * Clears all values from sync storage
 * @returns {Promise<void>}
 */
export function clearSync() {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(resolve);
  });
}

/**
 * Clears all values from local storage
 * @returns {Promise<void>}
 */
export function clearLocal() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

/**
 * Gets the amount of bytes being used in sync storage
 * @returns {Promise<number>} - The number of bytes being used
 */
export function getSyncBytesInUse() {
  return new Promise((resolve) => {
    chrome.storage.sync.getBytesInUse(null, resolve);
  });
}

/**
 * Gets the amount of bytes being used in local storage
 * @returns {Promise<number>} - The number of bytes being used
 */
export function getLocalBytesInUse() {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, resolve);
  });
}
