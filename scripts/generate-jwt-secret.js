#!/usr/bin/env node

/**
 * Generate a secure random JWT secret for production use
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a 64-byte random string (512 bits)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Generated JWT Secret for Production:\n');
console.log('='.repeat(80));
console.log(jwtSecret);
console.log('='.repeat(80));
console.log('\n📋 Copy this value and set it as JWT_SECRET in your Render environment variables.\n');
console.log('⚠️  Keep this secret secure and never commit it to version control!\n');
