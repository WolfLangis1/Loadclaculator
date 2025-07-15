// Simple Express server for API endpoints in Docker environment
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Mock mode for when API keys aren't available
const MOCK_MODE = !process.env.GOOGLE_MAPS_API_KEY;

if (MOCK_MODE) {
  console.log('🚨 Running in MOCK MODE - Google Maps API key not found');
} else {
  console.log('✅ Google Maps API key found - using real APIs');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mockMode: MOCK_MODE,
    message: MOCK_MODE ? 'API running in mock mode' : 'API connected to Google services'
  });
});

// Places autocomplete endpoint
app.get('/api/places', async (req, res) => {
  const { input, sessiontoken } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Input parameter is required' });
  }

  // Return mock data if no API key
  if (MOCK_MODE) {
    return res.json({
      status: 'OK',
      predictions: [
        {
          description: `${input} Street, Anytown, CA 12345`,
          place_id: 'mock_place_1',
          structured_formatting: {
            main_text: `${input} Street`,
            secondary_text: 'Anytown, CA 12345'
          }
        },
        {
          description: `${input} Avenue, Springfield, IL 62701`,
          place_id: 'mock_place_2',
          structured_formatting: {
            main_text: `${input} Avenue`,
            secondary_text: 'Springfield, IL 62701'
          }
        },
        {
          description: `${input} Boulevard, Austin, TX 78701`,
          place_id: 'mock_place_3',
          structured_formatting: {
            main_text: `${input} Boulevard`,
            secondary_text: 'Austin, TX 78701'
          }
        }
      ]
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`;
    
    if (sessiontoken) {
      url += `&sessiontoken=${sessiontoken}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Places API error:', error);
    res.status(500).json({ error: 'Failed to get place suggestions' });
  }
});

// Geocoding endpoint
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }

  // Return mock data if no API key
  if (MOCK_MODE) {
    return res.json({
      status: 'OK',
      results: [{
        formatted_address: address,
        geometry: {
          location: {
            lat: 37.7749,
            lng: -122.4194
          }
        },
        place_id: 'mock_geocode_1'
      }]
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// Satellite imagery endpoint
app.get('/api/satellite', async (req, res) => {
  const { lat, lon, zoom = 18, width = 640, height = 640, provider = 'google' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Return mock data if no API key
  if (MOCK_MODE) {
    return res.json({
      status: 'OK',
      imageUrl: `https://via.placeholder.com/${width}x${height}/87CEEB/000080?text=Mock+Satellite+Image`,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) },
      zoom: parseInt(zoom),
      provider: 'mock'
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&key=${apiKey}`;

    res.json({
      status: 'OK',
      imageUrl,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) },
      zoom: parseInt(zoom),
      provider
    });
  } catch (error) {
    console.error('Satellite API error:', error);
    res.status(500).json({ error: 'Failed to get satellite imagery' });
  }
});

// Solar API endpoint
app.get('/api/solar', async (req, res) => {
  const { lat, lon, radiusMeters = 100 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Always return mock data for now as Google Solar API requires special access
  return res.json({
    status: 'OK',
    solarPotential: {
      maxArrayPanelsCount: 50,
      maxArrayAreaMeters2: 200,
      maxSunshineHoursPerYear: 2500,
      carbonOffsetFactorKgPerMwh: 400,
      wholeRoofStats: {
        areaMeters2: 250,
        sunshineQuantiles: [1800, 2000, 2200, 2400, 2600],
        groundAreaCoveredMeters2: 200
      }
    },
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
  });
});

// Weather endpoint  
app.get('/api/weather', async (req, res) => {
  const { lat, lon, provider = 'openweather' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Return mock weather data
  return res.json({
    status: 'OK',
    weather: {
      temperature: 72,
      humidity: 65,
      windSpeed: 8,
      conditions: 'Partly Cloudy',
      visibility: 10,
      pressure: 30.15
    },
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
  });
});

// Roof analysis endpoint
app.post('/api/roof-analysis', async (req, res) => {
  const { lat, lon, roofData } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Return mock roof analysis data
  return res.json({
    status: 'OK',
    roofAnalysis: {
      totalRoofArea: 2500,
      usableArea: 2000,
      tiltAngle: 30,
      azimuthAngle: 180,
      shadingFactors: {
        trees: 0.1,
        buildings: 0.05,
        other: 0.02
      },
      solarPanelFit: {
        maxPanels: 48,
        recommendedPanels: 40,
        panelSize: '320W'
      }
    },
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
  });
});

// Shading analysis endpoint
app.get('/api/shading', async (req, res) => {
  const { lat, lon, timestamp } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Return mock shading data
  return res.json({
    status: 'OK',
    shadingAnalysis: {
      timestamp: timestamp || Date.now(),
      shadowCoverage: 15,
      sunAngle: 45,
      dayLength: 12.5,
      hourlyShading: [
        { hour: 6, coverage: 80 },
        { hour: 9, coverage: 30 },
        { hour: 12, coverage: 10 },
        { hour: 15, coverage: 20 },
        { hour: 18, coverage: 60 }
      ]
    },
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Mock mode: ${MOCK_MODE ? 'ON' : 'OFF'}`);
});