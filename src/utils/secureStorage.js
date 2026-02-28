/**
 * Secure storage utility for encrypting/decrypting sensitive data
 * Uses Web Crypto API with AES-GCM encryption
 *
 * Key derivation uses a combination of:
 * - Fixed application secret
 * - Browser/device fingerprint (makes key unique per installation)
 *
 * This provides better security than plain text localStorage while
 * maintaining convenience (no password required).
 *
 * Security notes:
 * - Not immune to sophisticated XSS attacks (nothing client-side is)
 * - Protects against casual inspection and naive malicious extensions
 * - Key components are deterministic (same browser = same key)
 */

import { createLogger } from "./logger.js";

const logger = createLogger("secureStorage");

// Base application secret (publicly visible in source, but combined with device fingerprint)
const APP_SECRET = "ha-dashboard-secure-v1-2026";

// Salt for PBKDF2 key derivation (also public, but that's okay for this use case)
const SALT = "ha-dash-salt-v1";

/**
 * Generate a device/browser fingerprint from available characteristics
 * This makes the encryption key unique per browser/device installation
 * @returns {string} Fingerprint string
 */
function generateDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    navigator.hardwareConcurrency?.toString() || "0",
    navigator.platform,
  ];

  return components.join("|");
}

/**
 * Derive an encryption key using PBKDF2
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
async function deriveEncryptionKey() {
  const encoder = new TextEncoder();
  const fingerprint = generateDeviceFingerprint();
  const keyMaterial = APP_SECRET + fingerprint;

  // Import the key material
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(keyMaterial),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  // Derive the actual encryption key
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a string using AES-GCM
 * @param {string} plaintext - The text to encrypt
 * @returns {Promise<string>} Base64-encoded encrypted data (IV + ciphertext)
 */
export async function encrypt(plaintext) {
  try {
    const key = await deriveEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(plaintext),
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    logger.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string that was encrypted with encrypt()
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(encryptedData) {
  try {
    const key = await deriveEncryptionKey();

    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    logger.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Store encrypted data in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to encrypt and store
 * @returns {Promise<void>}
 */
export async function setSecureItem(key, value) {
  const encrypted = await encrypt(value);
  localStorage.setItem(key, encrypted);
  logger.log(`Stored encrypted item: ${key}`);
}

/**
 * Retrieve and decrypt data from localStorage
 * @param {string} key - Storage key
 * @returns {Promise<string|null>} Decrypted value or null if not found
 */
export async function getSecureItem(key) {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) {
    return null;
  }

  try {
    return await decrypt(encrypted);
  } catch (error) {
    logger.error(`Failed to decrypt item: ${key}`, error);
    // If decryption fails, remove the corrupted data
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - Storage key
 */
export function removeSecureItem(key) {
  localStorage.removeItem(key);
  logger.log(`Removed item: ${key}`);
}

/**
 * Check if Web Crypto API is available
 * @returns {boolean} True if crypto is supported
 */
export function isCryptoSupported() {
  return (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.encrypt === "function"
  );
}
