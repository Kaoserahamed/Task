/**
 * Environment Variable Validation Script
 * Run this before deploying to catch missing or invalid environment variables
 * 
 * Usage: node validate-env.js
 */

require('dotenv').config();

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'ADMIN_URL',
  'COMPANY_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const optionalVars = [
  'WEATHER_API_KEY',
  'SENDINBLUE_API_KEY'
];

console.log('🔍 Validating Environment Variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('✅ Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ❌ ${varName} - MISSING`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('YOUR_')) {
    console.log(`   ⚠️  ${varName} - Still has placeholder value`);
    hasWarnings = true;
  } else {
    console.log(`   ✓ ${varName} - Set`);
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ⚠️  ${varName} - Not set (some features may not work)`);
    hasWarnings = true;
  } else {
    console.log(`   ✓ ${varName} - Set`);
  }
});

// Validate specific formats
console.log('\n🔬 Format Validation:');

// MongoDB URI
if (process.env.MONGODB_URI) {
  if (process.env.MONGODB_URI.startsWith('mongodb+srv://') || 
      process.env.MONGODB_URI.startsWith('mongodb://')) {
    console.log('   ✓ MONGODB_URI - Valid format');
  } else {
    console.log('   ❌ MONGODB_URI - Invalid format (should start with mongodb:// or mongodb+srv://)');
    hasErrors = true;
  }
  
  if (process.env.MONGODB_URI.includes('<password>')) {
    console.log('   ❌ MONGODB_URI - Contains placeholder <password>');
    hasErrors = true;
  }
}

// JWT Secret length
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    console.log(`   ⚠️  JWT_SECRET - Too short (${process.env.JWT_SECRET.length} chars, recommended: 32+)`);
    hasWarnings = true;
  } else {
    console.log(`   ✓ JWT_SECRET - Good length (${process.env.JWT_SECRET.length} chars)`);
  }
}

// URLs format
const urlVars = ['FRONTEND_URL', 'ADMIN_URL', 'COMPANY_URL'];
urlVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      if (value.endsWith('/')) {
        console.log(`   ⚠️  ${varName} - Has trailing slash (may cause CORS issues)`);
        hasWarnings = true;
      } else {
        console.log(`   ✓ ${varName} - Valid format`);
      }
    } else {
      console.log(`   ❌ ${varName} - Must start with http:// or https://`);
      hasErrors = true;
    }
  }
});

// Port validation
if (process.env.PORT) {
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.log('   ❌ PORT - Invalid port number');
    hasErrors = true;
  } else {
    console.log(`   ✓ PORT - Valid (${port})`);
  }
}

// Node environment
if (process.env.NODE_ENV) {
  const validEnvs = ['development', 'production', 'test'];
  if (validEnvs.includes(process.env.NODE_ENV)) {
    console.log(`   ✓ NODE_ENV - Valid (${process.env.NODE_ENV})`);
  } else {
    console.log(`   ⚠️  NODE_ENV - Unusual value: ${process.env.NODE_ENV}`);
    hasWarnings = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VALIDATION FAILED - Fix errors before deploying');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED - Ready to deploy!');
  process.exit(0);
}
