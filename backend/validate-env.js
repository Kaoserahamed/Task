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
  'CLOUDINARY_API_SECRET',
];

const optionalVars = ['WEATHER_API_KEY', 'SENDINBLUE_API_KEY'];

const output = (...args) => process.stdout.write(`${args.join(' ')}\n`);

output('🔍 Validating Environment Variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
output('✅ Required Variables:');
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    output(`   ❌ ${varName} - MISSING`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('YOUR_')) {
    output(`   ⚠️  ${varName} - Still has placeholder value`);
    hasWarnings = true;
  } else {
    output(`   ✓ ${varName} - Set`);
  }
});

// Check optional variables
output('\n📋 Optional Variables:');
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    output(`   ⚠️  ${varName} - Not set (some features may not work)`);
    hasWarnings = true;
  } else {
    output(`   ✓ ${varName} - Set`);
  }
});

// Validate specific formats
output('\n🔬 Format Validation:');

// MongoDB URI
if (process.env.MONGODB_URI) {
  if (
    process.env.MONGODB_URI.startsWith('mongodb+srv://') ||
    process.env.MONGODB_URI.startsWith('mongodb://')
  ) {
    output('   ✓ MONGODB_URI - Valid format');
  } else {
    output('   ❌ MONGODB_URI - Invalid format (should start with mongodb:// or mongodb+srv://)');
    hasErrors = true;
  }

  if (process.env.MONGODB_URI.includes('<password>')) {
    output('   ❌ MONGODB_URI - Contains placeholder <password>');
    hasErrors = true;
  }
}

// JWT Secret length
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    output(
      `   ⚠️  JWT_SECRET - Too short (${process.env.JWT_SECRET.length} chars, recommended: 32+)`
    );
    hasWarnings = true;
  } else {
    output(`   ✓ JWT_SECRET - Good length (${process.env.JWT_SECRET.length} chars)`);
  }
}

// URLs format
const urlVars = ['FRONTEND_URL', 'ADMIN_URL', 'COMPANY_URL'];
urlVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      if (value.endsWith('/')) {
        output(`   ⚠️  ${varName} - Has trailing slash (may cause CORS issues)`);
        hasWarnings = true;
      } else {
        output(`   ✓ ${varName} - Valid format`);
      }
    } else {
      output(`   ❌ ${varName} - Must start with http:// or https://`);
      hasErrors = true;
    }
  }
});

// Port validation
if (process.env.PORT) {
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    output('   ❌ PORT - Invalid port number');
    hasErrors = true;
  } else {
    output(`   ✓ PORT - Valid (${port})`);
  }
}

// Node environment
if (process.env.NODE_ENV) {
  const validEnvs = ['development', 'production', 'test'];
  if (validEnvs.includes(process.env.NODE_ENV)) {
    output(`   ✓ NODE_ENV - Valid (${process.env.NODE_ENV})`);
  } else {
    output(`   ⚠️  NODE_ENV - Unusual value: ${process.env.NODE_ENV}`);
    hasWarnings = true;
  }
}

// Summary
output('\n' + '='.repeat(50));
if (hasErrors) {
  output('❌ VALIDATION FAILED - Fix errors before deploying');
  process.exit(1);
} else if (hasWarnings) {
  output('⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings');
  process.exit(0);
} else {
  output('✅ ALL CHECKS PASSED - Ready to deploy!');
  process.exit(0);
}
