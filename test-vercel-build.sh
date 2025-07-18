#!/bin/bash

# Test script to simulate Vercel's build environment

echo "🚀 Testing with Vercel-like conditions..."

# 1. Clean environment
echo "📦 Cleaning previous builds..."
rm -rf dist node_modules .vercel

# 2. Install dependencies with CI mode
echo "📥 Installing dependencies (CI mode)..."
npm ci

# 3. Run TypeScript check
echo "🔍 Running TypeScript check..."
npm run typecheck

# 4. Build with production settings
echo "🔨 Building with production settings..."
NODE_ENV=production VITE_NODE_ENV=production npm run build

# 5. Check build output
echo "📊 Build statistics:"
du -sh dist/
ls -la dist/

# 6. Test with Vercel CLI
echo "🔧 Testing with Vercel CLI..."
npx vercel build

echo "✅ Build test complete!"
echo ""
echo "To preview the build locally, run:"
echo "  npm run preview"
echo ""
echo "To test with Vercel dev server, run:"
echo "  npx vercel dev"