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

// Require API keys - no mock mode
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY environment variable is required');
  process.exit(1);
}
console.log('✅ Google Maps API key found - using real APIs');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API connected to Google services'
  });
});

// Places autocomplete endpoint
app.get('/api/places', async (req, res) => {
  const { input, sessiontoken } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Input parameter is required' });
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

  // Solar API requires special access - return error for now
  return res.status(501).json({
    error: 'Google Solar API not yet implemented - requires special API access'
  });
});

// Weather endpoint  
app.get('/api/weather', async (req, res) => {
  const { lat, lon, provider = 'openweather' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Weather API not implemented yet
  return res.status(501).json({
    error: 'Weather API not yet implemented'
  });
});

// Roof analysis endpoint
app.post('/api/roof-analysis', async (req, res) => {
  const { lat, lon, roofData } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Roof analysis not implemented yet
  return res.status(501).json({
    error: 'Roof analysis API not yet implemented'
  });
});

// Shading analysis endpoint
app.get('/api/shading', async (req, res) => {
  const { lat, lon, timestamp } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  // Shading analysis not implemented yet
  return res.status(501).json({
    error: 'Shading analysis API not yet implemented'
  });
});

// Street View API endpoint
app.get('/api/streetview', async (req, res) => {
  const { lat, lon, width = 640, height = 640 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
  }

  try {
    const results = [];
    const headings = [0, 90, 180, 270]; // North, East, South, West views
    const labels = ['North View', 'East View', 'South View', 'West View'];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const label = labels[i];
      
      // Construct Google Street View Static API URL
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?` +
        `size=${width}x${height}&` +
        `location=${lat},${lon}&` +
        `heading=${heading}&` +
        `pitch=0&` +
        `key=${process.env.GOOGLE_MAPS_API_KEY}`;

      results.push({
        heading,
        imageUrl: streetViewUrl,
        label
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Street View API error:', error);
    res.status(500).json({ error: 'Failed to get street view imagery' });
  }
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
  console.log('🔑 Real API mode: ON');
});