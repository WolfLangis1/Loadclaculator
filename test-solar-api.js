#!/usr/bin/env node

/**
 * Google Solar API Testing & Debugging Utility
 * Tests Solar API access in both Docker and Vercel environments
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const TEST_COORDINATES = [
  { name: 'New York City', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Phoenix', lat: 33.4484, lon: -112.0740 }
];

async function testGoogleSolarAPI() {
  console.log('🔍 Google Solar API Diagnostic Tool');
  console.log('=====================================\n');

  // Check API key
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_MAPS_API_KEY environment variable not found');
    console.log('💡 Please set your Google Maps API key in .env file:');
    console.log('   GOOGLE_MAPS_API_KEY=your_actual_api_key_here\n');
    return;
  }

  console.log('✅ Google Maps API key found');
  console.log(`🔑 Key: ${GOOGLE_API_KEY.substring(0, 8)}...${GOOGLE_API_KEY.substring(GOOGLE_API_KEY.length - 4)}\n`);

  // Test Solar API endpoints
  for (const location of TEST_COORDINATES) {
    console.log(`📍 Testing ${location.name} (${location.lat}, ${location.lon})`);
    await testSolarAPILocation(location);
    console.log('');
  }

  // Test API permissions
  await testAPIPermissions();
}

async function testSolarAPILocation(location) {
  const endpoints = [
    {
      name: 'Building Insights',
      url: `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${location.lat}&location.longitude=${location.lon}&key=${GOOGLE_API_KEY}`
    },
    {
      name: 'Data Layers',
      url: `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${location.lat}&location.longitude=${location.lon}&radiusMeters=100&view=FULL_LAYERS&requiredQuality=HIGH&pixelSizeMeters=0.5&key=${GOOGLE_API_KEY}`
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing ${endpoint.name}...`);
      
      const response = await fetch(endpoint.url);
      const data = await response.json();

      if (response.ok) {
        console.log(`  ✅ ${endpoint.name}: SUCCESS`);
        if (data.name) {
          console.log(`     Building: ${data.name}`);
        }
        if (data.solarPotential) {
          console.log(`     Solar Potential: ${data.solarPotential.maxArrayPanelsCount} panels max`);
        }
      } else {
        console.log(`  ❌ ${endpoint.name}: FAILED (${response.status})`);
        console.log(`     Error: ${data.error?.message || data.message || 'Unknown error'}`);
        
        if (response.status === 403) {
          console.log(`     🚨 Permission denied - Solar API access not enabled`);
        }
        if (response.status === 404) {
          console.log(`     ℹ️  No solar data available for this location`);
        }
      }
    } catch (error) {
      console.log(`  💥 ${endpoint.name}: NETWORK ERROR`);
      console.log(`     Error: ${error.message}`);
    }
  }
}

async function testAPIPermissions() {
  console.log('🔐 Testing API Permissions');
  console.log('===========================');

  const apis = [
    {
      name: 'Maps JavaScript API',
      url: `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}`,
      method: 'HEAD'
    },
    {
      name: 'Geocoding API',
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${GOOGLE_API_KEY}`
    },
    {
      name: 'Places API',
      url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=New+York&types=address&key=${GOOGLE_API_KEY}`
    },
    {
      name: 'Static Maps API',
      url: `https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=18&size=640x640&maptype=satellite&key=${GOOGLE_API_KEY}`,
      method: 'HEAD'
    }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.url, { method: api.method || 'GET' });
      
      if (response.ok || response.status === 200) {
        console.log(`✅ ${api.name}: ENABLED`);
      } else {
        console.log(`❌ ${api.name}: DISABLED (${response.status})`);
      }
    } catch (error) {
      console.log(`💥 ${api.name}: ERROR - ${error.message}`);
    }
  }
}

async function testLocalServer() {
  console.log('\n🖥️  Testing Local Server Endpoints');
  console.log('===================================');

  const localEndpoints = [
    'http://localhost:3001/api/health',
    'http://localhost:3001/api/solar?lat=40.7128&lon=-74.0060'
  ];

  for (const endpoint of localEndpoints) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${endpoint}: SUCCESS`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`❌ ${endpoint}: FAILED (${response.status})`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint}: CONNECTION ERROR`);
      console.log(`   Error: ${error.message}`);
      console.log(`   💡 Make sure your local server is running: npm run server`);
    }
  }
}

async function provideSolarAPISetupGuide() {
  console.log('\n📋 Google Solar API Setup Guide');
  console.log('================================');
  console.log('');
  console.log('1. 🔑 Enable APIs in Google Cloud Console:');
  console.log('   • Go to https://console.cloud.google.com/apis/library');
  console.log('   • Search for and enable: "Solar API"');
  console.log('   • Also enable: Maps JavaScript API, Geocoding API, Places API');
  console.log('');
  console.log('2. 🚨 IMPORTANT: Solar API Requires Special Access');
  console.log('   • The Solar API is currently in Preview/Limited Access');
  console.log('   • You may need to request access from Google');
  console.log('   • Contact: https://developers.google.com/maps/documentation/solar');
  console.log('');
  console.log('3. 🔐 API Key Configuration:');
  console.log('   • Ensure your API key has Solar API permissions');
  console.log('   • Add HTTP referrers: localhost:*, your-domain.com/*');
  console.log('   • Consider IP restrictions for production');
  console.log('');
  console.log('4. 💳 Billing:');
  console.log('   • Solar API requires a billing account');
  console.log('   • Check pricing: https://developers.google.com/maps/documentation/solar/usage-and-billing');
  console.log('');
  console.log('5. 🛠️  Fallback Strategy:');
  console.log('   • The application includes enhanced fallback calculations');
  console.log('   • AI roof analysis works independently of Google Solar API');
  console.log('   • Geographic solar estimates based on latitude/climate data');
  console.log('');
}

// Main execution
(async () => {
  try {
    await testGoogleSolarAPI();
    await testLocalServer();
    await provideSolarAPISetupGuide();
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
})();