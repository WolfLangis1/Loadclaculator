#!/usr/bin/env node

// Simulate Vercel's environment locally
console.log('🚀 Testing with Vercel-like environment...\n');

// Set Vercel environment variables
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';
process.env.VERCEL_ENV = 'production';
process.env.CI = '1';

// Display environment
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('- CI:', process.env.CI);
console.log('\n');

// Run the build
const { execSync } = require('child_process');

try {
  console.log('📦 Installing dependencies (clean)...');
  execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
  execSync('npm ci', { stdio: 'inherit' });
  
  console.log('\n🔨 Building with production settings...');
  execSync('npx vite build --mode production', { stdio: 'inherit' });
  
  console.log('\n✅ Build successful! Now you can preview with: npm run preview');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}