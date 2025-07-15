// Test script to verify API keys are working
// Run this locally to test your API functions

const testAPIKeys = async () => {
  console.log('🧪 Testing API Keys...\n');

  // Check if development server is running
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Development server is running');
    console.log('📊 API Status:', healthData.apis);
  } catch (error) {
    console.log('❌ Development server not running. Start it with: npm run server:dev');
    console.log('   Then run this test again.');
    return;
  }

  // Test 1: Geocoding API
  try {
    console.log('\n1. Testing Geocoding API...');
    const geocodeResponse = await fetch('http://localhost:3001/api/geocode?address=123 Main St, New York, NY');
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status === 'OK') {
      console.log('✅ Geocoding API working!');
    } else {
      console.log('❌ Geocoding API error:', geocodeData.error_message);
    }
  } catch (error) {
    console.log('❌ Geocoding API failed:', error.message);
  }

  // Test 2: Places API
  try {
    console.log('\n2. Testing Places API...');
    const placesResponse = await fetch('http://localhost:3001/api/places?input=123 Main');
    const placesData = await placesResponse.json();
    
    if (placesData.status === 'OK') {
      console.log('✅ Places API working!');
    } else {
      console.log('❌ Places API error:', placesData.error_message);
    }
  } catch (error) {
    console.log('❌ Places API failed:', error.message);
  }

  // Test 3: Weather API
  try {
    console.log('\n3. Testing Weather API...');
    const weatherResponse = await fetch('http://localhost:3001/api/weather?lat=40.7128&lon=-74.0060');
    const weatherData = await weatherResponse.json();
    
    if (weatherData.main) {
      console.log('✅ Weather API working!');
    } else {
      console.log('❌ Weather API error:', weatherData.message);
    }
  } catch (error) {
    console.log('❌ Weather API failed:', error.message);
  }

  // Test 4: Solar API
  try {
    console.log('\n4. Testing Solar API...');
    const solarResponse = await fetch('http://localhost:3001/api/solar?lat=40.7128&lon=-74.0060');
    const solarData = await solarResponse.json();
    
    if (solarData.name) {
      console.log('✅ Solar API working!');
    } else {
      console.log('❌ Solar API error:', solarData.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Solar API failed:', error.message);
  }

  console.log('\n🎉 API testing complete!');
};

// Run the test
testAPIKeys(); 