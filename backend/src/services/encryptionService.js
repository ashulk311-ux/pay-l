const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Encryption Service for GDPR Compliance
 * Handles encryption/decryption of sensitive data
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    logger.warn('ENCRYPTION_KEY not set in environment. Using default (NOT SECURE FOR PRODUCTION)');
    // In production, this should throw an error
    return crypto.scryptSync('default-key-change-in-production', 'salt', KEY_LENGTH);
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted data (format: iv:salt:tag:encrypted)
 */
function encrypt(text) {
  try {
    if (!text) return null;
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return format: iv:salt:tag:encrypted
    return `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data (format: iv:salt:tag:encrypted)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
  try {
    if (!encryptedData) return null;
    
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, saltHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for comparison)
 * @param {string} text - Text to hash
 * @returns {string} - Hashed value
 */
function hash(text) {
  if (!text) return null;
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Mask sensitive data for display (e.g., PAN: ABCDE****F)
 * @param {string} text - Text to mask
 * @param {number} visibleStart - Number of characters to show at start
 * @param {number} visibleEnd - Number of characters to show at end
 * @returns {string} - Masked text
 */
function mask(text, visibleStart = 2, visibleEnd = 1) {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return '****';
  }
  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const masked = '*'.repeat(Math.max(4, text.length - visibleStart - visibleEnd));
  return `${start}${masked}${end}`;
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  mask
};



