/**
 * Utility functions for encrypting and decrypting data
 */

// Salt for key derivation
const SALT = 'do-it-brainstorming-salt';

/**
 * Generate a cryptographic key from a password
 * @param password Password to derive key from
 * @returns Promise that resolves with the key
 */
export async function deriveKey(password: string): Promise<CryptoKey> {
  // Convert password and salt to ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(SALT);

  // Import the password as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive a key for AES-GCM
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-GCM
 * @param data Data to encrypt
 * @param password Password to encrypt with
 * @returns Promise that resolves with encrypted data
 */
export async function encrypt(data: unknown, password: string): Promise<string> {
  try {
    // Generate a key from the password
    const key = await deriveKey(password);

    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Convert data to JSON and then to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBuffer
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with AES-GCM
 * @param encryptedData Encrypted data
 * @param password Password to decrypt with
 * @returns Promise that resolves with decrypted data
 */
export async function decrypt<T>(encryptedData: string, password: string): Promise<T> {
  try {
    // Generate a key from the password
    const key = await deriveKey(password);

    // Convert base64 to Uint8Array
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);

    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    // Convert ArrayBuffer to string and parse JSON
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if the Web Crypto API is available
 * @returns True if available, false otherwise
 */
export function isEncryptionAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.encrypt === 'function'
  );
}

/**
 * Generate a random password
 * @param length Password length
 * @returns Random password
 */
export function generateRandomPassword(length = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  const randomValues = window.crypto.getRandomValues(new Uint8Array(length));
  let result = '';

  for (let i = 0; i < length; i++) {
    // Use a safe method to access array elements
    const index = randomValues[i] % charset.length;
    // Ensure index is within bounds
    if (index >= 0 && index < charset.length) {
      result += charset.charAt(index);
    }
  }

  return result;
}
