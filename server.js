// Simple Express server for API endpoints in Docker environment
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import paymentsRouter from './api/payments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Payment routes (with raw body parsing for webhooks)
app.use('/api/payments', paymentsRouter);

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

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    console.log(`🌞 Solar API request: lat=${lat}, lon=${lon}, radius=${radiusMeters}`);
    
    // Make request to Google Solar API (radiusMeters is not supported by this endpoint)
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('Solar API error:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        location: { lat, lon }
      });
      
      // Enhanced error handling with debugging info
      if (response.status === 403) {
        return res.status(503).json({ 
          error: 'Google Solar API access not enabled',
          message: 'The Solar API requires special access from Google Cloud. It is currently in limited preview.',
          fallbackAvailable: true,
          debugInfo: {
            status: response.status,
            apiEndpoint: 'solar.googleapis.com/v1/buildingInsights',
            solution: 'Enable Solar API in Google Cloud Console or request access from Google',
            documentation: 'https://developers.google.com/maps/documentation/solar',
            environment: 'Docker/Express server'
          },
          details: errorData
        });
      }
      
      return res.status(response.status).json({ 
        error: 'Solar API request failed',
        message: `Google Solar API returned ${response.status}: ${response.statusText}`,
        fallbackAvailable: true,
        debugInfo: {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString(),
          environment: 'Docker/Express server'
        },
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Solar API error:', error);
    return res.status(500).json({ error: 'Failed to get solar data' });
  }
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

// Street View API endpoint (enhanced with validation)
app.get('/api/streetview', async (req, res) => {
  const { 
    lat, 
    lon, 
    address,
    heading = 0, 
    pitch = 0, 
    fov = 90, 
    width = 640, 
    height = 640,
    skipValidation = false
  } = req.query;

  // Require either coordinates or address
  if (!lat && !lon && !address) {
    return res.status(400).json({ error: 'Either latitude/longitude or address is required' });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let location, validatedCoords;

    // Step 1: Validate image availability using metadata API (unless skipped)
    if (skipValidation !== 'true') {
      let metadataUrl;
      if (address) {
        metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&heading=${heading}&key=${apiKey}`;
        location = encodeURIComponent(address);
      } else {
        metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&heading=${heading}&key=${apiKey}`;
        location = `${lat},${lon}`;
      }

      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Metadata API failed: ${metadataResponse.statusText}`);
      }

      const metadata = await metadataResponse.json();

      // Check if street view is available
      if (metadata.status !== 'OK') {
        return res.status(404).json({
          error: 'Street view not available',
          status: metadata.status,
          message: getErrorMessage(metadata.status),
          available: false,
          fallbackType: 'satellite'
        });
      }

      // Use validated coordinates from metadata response
      if (metadata.location) {
        validatedCoords = metadata.location;
        location = `${metadata.location.lat},${metadata.location.lng}`;
      }
    } else {
      // Build location parameter without validation
      if (address) {
        location = encodeURIComponent(address);
      } else {
        location = `${lat},${lon}`;
      }
    }

    // Step 2: Build Street View Static API URL with validated coordinates
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?` +
      `location=${location}&` +
      `size=${width}x${height}&` +
      `heading=${heading}&` +
      `pitch=${pitch}&` +
      `fov=${fov}&` +
      `key=${apiKey}`;
    
    // Return enhanced response with validation info
    const streetViewData = { 
      type: 'image',
      url: imageUrl,
      provider: 'google',
      available: true,
      validated: skipValidation !== 'true',
      location: address || location,
      coordinates: validatedCoords || (lat && lon ? { lat: parseFloat(lat), lng: parseFloat(lon) } : null),
      heading: parseInt(heading),
      pitch: parseInt(pitch),
      fov: parseInt(fov),
      dimensions: {
        width: parseInt(width),
        height: parseInt(height)
      }
    };

    res.json(streetViewData);
  } catch (error) {
    console.error('Street View API error:', error);
    res.status(500).json({ 
      error: 'Failed to get street view imagery',
      available: false,
      fallbackType: 'satellite'
    });
  }
});

// Street View Metadata API endpoint (for image validation)
app.get('/api/streetview-metadata', async (req, res) => {
  const { lat, lon, address, heading = 0, source = 'default' } = req.query;

  // Require either coordinates or address
  if (!lat && !lon && !address) {
    return res.status(400).json({ error: 'Either latitude/longitude or address is required' });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // Build the location parameter
    let location;
    if (address) {
      location = encodeURIComponent(address);
    } else {
      location = `${lat},${lon}`;
    }

    // Build Street View Metadata API URL
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
      `location=${location}&` +
      `heading=${heading}&` +
      `source=${source}&` +
      `key=${apiKey}`;
    
    // Fetch metadata from Google API
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Street View Metadata API returned ${response.status}: ${response.statusText}`);
    }
    
    const metadata = await response.json();
    
    // Process the metadata response
    const result = {
      available: metadata.status === 'OK',
      status: metadata.status,
      location: metadata.location || null,
      copyright: metadata.copyright || null,
      date: metadata.date || null,
      pano_id: metadata.pano_id || null,
      error: metadata.status !== 'OK' ? getErrorMessage(metadata.status) : null
    };

    // If image is available, include additional details
    if (result.available && metadata.location) {
      result.coordinates = {
        lat: metadata.location.lat,
        lng: metadata.location.lng
      };
      
      // Include the image URL that would be valid
      const imageUrl = `https://maps.googleapis.com/maps/api/streetview?` +
        `location=${metadata.location.lat},${metadata.location.lng}&` +
        `heading=${heading}&` +
        `size=640x640&` +
        `key=${apiKey}`;
      
      result.imageUrl = imageUrl;
    }

    res.json(result);
  } catch (error) {
    console.error('Street View Metadata API error:', error);
    res.status(500).json({ 
      error: 'Failed to get street view metadata',
      available: false,
      status: 'ERROR'
    });
  }
});

// Helper function to provide user-friendly error messages
function getErrorMessage(status) {
  switch (status) {
    case 'ZERO_RESULTS':
      return 'No street view imagery available at this location';
    case 'NOT_FOUND':
      return 'The specified location could not be found';
    case 'OVER_QUERY_LIMIT':
      return 'Street View API quota exceeded';
    case 'REQUEST_DENIED':
      return 'Street View request was denied';
    case 'INVALID_REQUEST':
      return 'Invalid street view request parameters';
    case 'UNKNOWN_ERROR':
      return 'Unknown error occurred while fetching street view';
    default:
      return `Street view unavailable (${status})`;
  }
}

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