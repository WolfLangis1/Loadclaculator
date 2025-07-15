// Local development server for testing API functions
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Log environment variables (for debugging)
console.log('🔧 Development Server Environment:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing');
console.log('OPENWEATHER_API_KEY:', process.env.OPENWEATHER_API_KEY ? '✅ Set' : '❌ Missing');

// Import and use your API functions
import geocodeHandler from './api/geocode.js';
import placesHandler from './api/places.js';
import weatherHandler from './api/weather.js';
import solarHandler from './api/solar.js';
import satelliteHandler from './api/satellite.js';
import shadingHandler from './api/shading.js';
import roofAnalysisHandler from './api/roof-analysis.js';

// API Routes
app.get('/api/geocode', async (req, res) => {
  await geocodeHandler(req, res);
});

app.get('/api/places', async (req, res) => {
  await placesHandler(req, res);
});

app.get('/api/weather', async (req, res) => {
  await weatherHandler(req, res);
});

app.get('/api/solar', async (req, res) => {
  await solarHandler(req, res);
});

app.get('/api/satellite', async (req, res) => {
  await satelliteHandler(req, res);
});

app.get('/api/shading', async (req, res) => {
  await shadingHandler(req, res);
});

app.get('/api/roof-analysis', async (req, res) => {
  await roofAnalysisHandler(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apis: {
      google: !!process.env.GOOGLE_MAPS_API_KEY,
      weather: !!process.env.OPENWEATHER_API_KEY
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/geocode?address=... - Geocoding`);
  console.log(`   GET /api/places?input=... - Places autocomplete`);
  console.log(`   GET /api/weather?lat=...&lon=... - Weather data`);
  console.log(`   GET /api/solar?lat=...&lon=... - Solar data`);
  console.log(`   GET /api/satellite?lat=...&lon=... - Satellite imagery`);
  console.log(`   GET /api/shading?lat=...&lon=... - Shading analysis`);
  console.log(`   GET /api/roof-analysis?lat=...&lon=... - Roof analysis`);
  console.log(`\n🧪 Test with: npm run test:api`);
}); 