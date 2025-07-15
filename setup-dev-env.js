#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Local Development Environment...\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, 'env.local.example');

if (!fs.existsSync(envLocalPath)) {
  console.log('📝 Creating .env.local file...');
  
  if (fs.existsSync(envExamplePath)) {
    // Copy from example
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envLocalPath, exampleContent);
    console.log('✅ Created .env.local from template');
  } else {
    // Create basic template
    const basicTemplate = `# Local Development Environment Variables
# Add your API keys here for local testing

# Google APIs (use the same key for all Google services)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Weather APIs
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Development settings
NODE_ENV=development
VITE_ENABLE_DEBUG=true
`;
    fs.writeFileSync(envLocalPath, basicTemplate);
    console.log('✅ Created basic .env.local template');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Edit .env.local and add your actual API keys');
  console.log('2. Get Google Maps API key from: https://console.cloud.google.com/');
  console.log('3. Get OpenWeather API key from: https://openweathermap.org/api');
  console.log('4. Run: npm run dev');
  console.log('5. Test with: node test-api-keys.js');
  
} else {
  console.log('✅ .env.local already exists');
  console.log('📝 Edit it to add your API keys if needed');
}

console.log('\n🔒 Security Note: .env.local is in .gitignore and will not be committed to git');
console.log('🚀 For production, add these same variables to Vercel Environment Variables'); 