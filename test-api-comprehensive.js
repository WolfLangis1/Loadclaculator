#!/usr/bin/env node

/**
 * Comprehensive API Test Suite for Load Calculator
 * Tests all API endpoints to ensure configuration stability
 * 
 * Usage: node test-api-comprehensive.js
 * Environment: Requires GOOGLE_MAPS_API_KEY in .env or environment
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Test configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-url.vercel.app'  // Update with your actual Vercel URL
  : 'http://localhost:3000';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Test data
const TEST_DATA = {
  address: '1600 Amphitheatre Parkway, Mountain View, CA',
  placeInput: '1600 Amphitheatre',
  coordinates: { lat: 37.4224764, lng: -122.0842499 },
  invalidAddress: '',
  longAddress: 'a'.repeat(201), // Too long
  sessionToken: 'test-session-' + Date.now()
};

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class ApiTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async runTest(name, testFunction) {
    this.results.total++;
    this.log(`\n${colors.bold}Testing: ${name}${colors.reset}`);
    
    try {
      const result = await testFunction();
      if (result.success) {
        this.results.passed++;
        this.log(`✅ PASS: ${result.message}`, colors.green);
      } else {
        this.results.failed++;
        this.log(`❌ FAIL: ${result.message}`, colors.red);
        if (result.details) {
          this.log(`   Details: ${result.details}`, colors.yellow);
        }
      }
      this.results.tests.push({ name, ...result });
    } catch (error) {
      this.results.failed++;
      this.log(`💥 ERROR: ${error.message}`, colors.red);
      this.results.tests.push({ 
        name, 
        success: false, 
        message: error.message,
        error: true 
      });
    }
  }

  async testApiEndpoint(endpoint, params = {}, expectedStatus = 200) {
    const url = new URL(`${BASE_URL}/api/${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  // Google Maps API Tests
  async testGeocodingValid() {
    const result = await this.testApiEndpoint('geocode', {
      address: TEST_DATA.address
    });

    if (result.status === 200 && result.data.status === 'OK') {
      return {
        success: true,
        message: `Geocoding successful. Found ${result.data.results.length} results`,
        details: `First result: ${result.data.results[0]?.formatted_address}`
      };
    }

    return {
      success: false,
      message: `Geocoding failed: ${result.data.error || result.data.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testGeocodingInvalid() {
    const result = await this.testApiEndpoint('geocode', {
      address: TEST_DATA.invalidAddress
    }, 400);

    if (result.status === 400) {
      return {
        success: true,
        message: 'Invalid address properly rejected',
        details: result.data.message
      };
    }

    return {
      success: false,
      message: `Expected 400 status for invalid address, got ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testPlacesAutocomplete() {
    const result = await this.testApiEndpoint('places', {
      input: TEST_DATA.placeInput,
      sessiontoken: TEST_DATA.sessionToken
    });

    if (result.status === 200 && result.data.status === 'OK') {
      return {
        success: true,
        message: `Places autocomplete successful. Found ${result.data.predictions.length} predictions`,
        details: `First prediction: ${result.data.predictions[0]?.description}`
      };
    }

    return {
      success: false,
      message: `Places autocomplete failed: ${result.data.error || result.data.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testPlacesInvalidInput() {
    const result = await this.testApiEndpoint('places', {
      input: 'a' // Too short
    }, 400);

    if (result.status === 400) {
      return {
        success: true,
        message: 'Short input properly rejected',
        details: result.data.message
      };
    }

    return {
      success: false,
      message: `Expected 400 status for short input, got ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testSatelliteImagery() {
    const result = await this.testApiEndpoint('satellite', {
      lat: TEST_DATA.coordinates.lat,
      lng: TEST_DATA.coordinates.lng,
      zoom: 18,
      size: '640x640'
    });

    if (result.status === 200) {
      const isImage = result.headers['content-type']?.includes('image') || 
                     result.data.error === undefined;
      return {
        success: isImage,
        message: isImage ? 'Satellite imagery retrieved successfully' : 'Response is not an image',
        details: `Content-Type: ${result.headers['content-type']}`
      };
    }

    return {
      success: false,
      message: `Satellite imagery failed with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testEnhancedSatellite() {
    const result = await this.testApiEndpoint('satellite-enhanced', {
      lat: TEST_DATA.coordinates.lat,
      lng: TEST_DATA.coordinates.lng,
      zoom: 20,
      size: '640x640'
    });

    if (result.status === 200) {
      const isImage = result.headers['content-type']?.includes('image') || 
                     result.data.error === undefined;
      return {
        success: isImage,
        message: isImage ? 'Enhanced satellite imagery retrieved successfully' : 'Response is not an image',
        details: `Content-Type: ${result.headers['content-type']}`
      };
    }

    return {
      success: false,
      message: `Enhanced satellite imagery failed with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testUSGSImagery() {
    const result = await this.testApiEndpoint('usgs-imagery', {
      lat: TEST_DATA.coordinates.lat,
      lng: TEST_DATA.coordinates.lng,
      zoom: 18,
      size: '640x640'
    });

    // USGS only works for US locations, so we accept both success and geographical errors
    if (result.status === 200 || (result.status === 400 && result.data.error?.includes('USGS'))) {
      return {
        success: true,
        message: 'USGS imagery endpoint responding correctly',
        details: result.status === 200 ? 'Image retrieved' : 'Geographic limitation handled'
      };
    }

    return {
      success: false,
      message: `USGS imagery unexpected failure with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testEsriImagery() {
    const result = await this.testApiEndpoint('esri-imagery', {
      lat: TEST_DATA.coordinates.lat,
      lng: TEST_DATA.coordinates.lng,
      zoom: 18,
      size: '640x640'
    });

    if (result.status === 200) {
      const isImage = result.headers['content-type']?.includes('image') || 
                     result.data.error === undefined;
      return {
        success: isImage,
        message: isImage ? 'Esri imagery retrieved successfully' : 'Response is not an image',
        details: `Content-Type: ${result.headers['content-type']}`
      };
    }

    return {
      success: false,
      message: `Esri imagery failed with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testZoomLevelDetection() {
    const result = await this.testApiEndpoint('test-zoom', {
      lat: TEST_DATA.coordinates.lat,
      lng: TEST_DATA.coordinates.lng
    });

    if (result.status === 200 && result.data.maxZoom) {
      return {
        success: true,
        message: `Zoom level detection successful. Max zoom: ${result.data.maxZoom}`,
        details: `Provider: ${result.data.provider || 'default'}`
      };
    }

    return {
      success: false,
      message: `Zoom level detection failed with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testSolarAPI() {
    const result = await this.testApiEndpoint('solar', {
      lat: TEST_DATA.coordinates.lat,
      lng: TEST_DATA.coordinates.lng
    });

    // Solar API may not always be available, so we're more lenient
    if (result.status === 200 || result.status === 503) {
      return {
        success: true,
        message: 'Solar API endpoint responding',
        details: result.status === 200 ? 'Solar data retrieved' : 'Service temporarily unavailable (expected)'
      };
    }

    return {
      success: false,
      message: `Solar API unexpected response with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  async testHealthEndpoint() {
    const result = await this.testApiEndpoint('health');

    if (result.status === 200 && result.data.status) {
      return {
        success: true,
        message: `Health check passed. Status: ${result.data.status}`,
        details: `Timestamp: ${result.data.timestamp}`
      };
    }

    return {
      success: false,
      message: `Health check failed with status ${result.status}`,
      details: JSON.stringify(result.data, null, 2)
    };
  }

  // CORS and Security Tests
  async testCORSHeaders() {
    const result = await this.testApiEndpoint('health');
    
    const hasCORS = result.headers['access-control-allow-origin'] === '*';
    
    return {
      success: hasCORS,
      message: hasCORS ? 'CORS headers properly configured' : 'CORS headers missing or incorrect',
      details: `Access-Control-Allow-Origin: ${result.headers['access-control-allow-origin']}`
    };
  }

  async testOptionsMethod() {
    const url = `${BASE_URL}/api/health`;
    const response = await fetch(url, { method: 'OPTIONS' });
    
    if (response.status === 200 || response.status === 204) {
      return {
        success: true,
        message: 'OPTIONS method properly handled',
        details: `Status: ${response.status}`
      };
    }

    return {
      success: false,
      message: `OPTIONS method failed with status ${response.status}`,
      details: `Expected 200 or 204, got ${response.status}`
    };
  }

  // Environment and Configuration Tests
  async testEnvironmentConfiguration() {
    if (!API_KEY || API_KEY.startsWith('your_')) {
      return {
        success: false,
        message: 'Google Maps API key not configured',
        details: 'Set GOOGLE_MAPS_API_KEY in environment variables'
      };
    }

    return {
      success: true,
      message: 'Environment configuration appears valid',
      details: `API key configured (${API_KEY.substring(0, 10)}...)`
    };
  }

  async runAllTests() {
    this.log(`${colors.bold}${colors.cyan}🚀 Starting Comprehensive API Test Suite${colors.reset}`);
    this.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}`);
    this.log(`${colors.blue}Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`);

    // Environment Tests
    this.log(`\n${colors.bold}${colors.magenta}📋 ENVIRONMENT TESTS${colors.reset}`);
    await this.runTest('Environment Configuration', () => this.testEnvironmentConfiguration());

    // Core API Tests
    this.log(`\n${colors.bold}${colors.magenta}🗺️  GOOGLE MAPS API TESTS${colors.reset}`);
    await this.runTest('Geocoding - Valid Address', () => this.testGeocodingValid());
    await this.runTest('Geocoding - Invalid Address', () => this.testGeocodingInvalid());
    await this.runTest('Places Autocomplete - Valid Input', () => this.testPlacesAutocomplete());
    await this.runTest('Places Autocomplete - Invalid Input', () => this.testPlacesInvalidInput());

    // Imagery Tests
    this.log(`\n${colors.bold}${colors.magenta}🛰️  SATELLITE IMAGERY TESTS${colors.reset}`);
    await this.runTest('Standard Satellite Imagery', () => this.testSatelliteImagery());
    await this.runTest('Enhanced Satellite Imagery', () => this.testEnhancedSatellite());
    await this.runTest('USGS High-Resolution Imagery', () => this.testUSGSImagery());
    await this.runTest('Esri World Imagery', () => this.testEsriImagery());
    await this.runTest('Zoom Level Detection', () => this.testZoomLevelDetection());

    // Additional Services
    this.log(`\n${colors.bold}${colors.magenta}☀️  ADDITIONAL SERVICES${colors.reset}`);
    await this.runTest('Solar API', () => this.testSolarAPI());
    await this.runTest('Health Endpoint', () => this.testHealthEndpoint());

    // Security Tests
    this.log(`\n${colors.bold}${colors.magenta}🔒 SECURITY & CORS TESTS${colors.reset}`);
    await this.runTest('CORS Headers', () => this.testCORSHeaders());
    await this.runTest('OPTIONS Method', () => this.testOptionsMethod());

    this.printSummary();
  }

  printSummary() {
    this.log(`\n${colors.bold}${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
    this.log(`${colors.bold}Total Tests: ${this.results.total}${colors.reset}`);
    this.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    this.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    const statusColor = successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red;
    this.log(`${statusColor}Success Rate: ${successRate}%${colors.reset}`);

    if (this.results.failed > 0) {
      this.log(`\n${colors.bold}${colors.red}❌ FAILED TESTS:${colors.reset}`);
      this.results.tests
        .filter(test => !test.success)
        .forEach(test => {
          this.log(`   • ${test.name}: ${test.message}`, colors.red);
        });
    }

    this.log(`\n${colors.bold}${colors.cyan}🎯 RECOMMENDATIONS:${colors.reset}`);
    if (this.results.failed === 0) {
      this.log(`${colors.green}✅ All tests passed! Your API configuration is stable.${colors.reset}`);
    } else {
      this.log(`${colors.yellow}⚠️  ${this.results.failed} test(s) failed. Review the failures above.${colors.reset}`);
    }
    
    this.log(`${colors.blue}💡 Run this test suite after any configuration changes.${colors.reset}`);
    this.log(`${colors.blue}💡 Set up CI/CD to run these tests automatically.${colors.reset}`);
  }
}

// Main execution
async function main() {
  const tester = new ApiTester();
  
  try {
    await tester.runAllTests();
    process.exit(tester.results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error(`${colors.red}💥 Test suite crashed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ApiTester;