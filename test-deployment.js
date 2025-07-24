#!/usr/bin/env node

/**
 * Pre-deployment test script
 * Run this before deploying to catch common issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Running pre-deployment checks...\n');

const checks = [];

// Check 1: Verify vercel.json exists
if (fs.existsSync('vercel.json')) {
  checks.push('✅ vercel.json exists');
} else {
  checks.push('❌ vercel.json missing');
}

// Check 2: Verify .env.example exists
if (fs.existsSync('.env.example')) {
  checks.push('✅ .env.example exists');
} else {
  checks.push('❌ .env.example missing');
}

// Check 3: Check package.json for required scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts['vercel-build']) {
  checks.push('✅ vercel-build script exists');
} else {
  checks.push('❌ vercel-build script missing');
}

// Check 4: Verify API service uses dynamic URLs
const apiServiceContent = fs.readFileSync('src/services/api.ts', 'utf8');
if (apiServiceContent.includes('import.meta.env.PROD')) {
  checks.push('✅ API service uses dynamic URLs');
} else {
  checks.push('❌ API service still uses hardcoded localhost');
}

// Check 5: Verify server has production CORS
const serverContent = fs.readFileSync('server/server.js', 'utf8');
if (serverContent.includes('process.env.NODE_ENV === \'production\'')) {
  checks.push('✅ Server has production CORS configuration');
} else {
  checks.push('❌ Server missing production CORS configuration');
}

// Check 6: Verify all required dependencies
const requiredDeps = [
  'express', 'mongoose', 'cors', 'dotenv', 'bcryptjs', 'jsonwebtoken'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
if (missingDeps.length === 0) {
  checks.push('✅ All required dependencies present');
} else {
  checks.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
}

// Print results
console.log('📋 Pre-deployment Check Results:\n');
checks.forEach(check => console.log(check));

const failedChecks = checks.filter(check => check.startsWith('❌'));
if (failedChecks.length === 0) {
  console.log('\n🎉 All checks passed! Ready for deployment.');
  console.log('\n📝 Next steps:');
  console.log('1. Commit and push your changes');
  console.log('2. Deploy to Vercel');
  console.log('3. Configure environment variables in Vercel dashboard');
  console.log('4. Update CORS with your Vercel URL');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedChecks.length} checks failed. Please fix these issues before deploying.`);
  process.exit(1);
}