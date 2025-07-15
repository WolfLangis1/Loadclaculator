// Vercel serverless function for Satellite Imagery APIs
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get parameters from query
  const { lat, lon, zoom = 18, width = 640, height = 640, provider = 'google' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    let satelliteData;

    if (provider === 'google') {
      // Google Static Maps API
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Google Maps API key not configured' });
      }

      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&key=${apiKey}`;
      
      // Return the image URL (client will fetch it)
      satelliteData = { 
        type: 'image',
        url: url,
        provider: 'google'
      };
    } else if (provider === 'mapbox') {
      // Mapbox Static Images API
      const apiKey = process.env.MAPBOX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Mapbox API key not configured' });
      }

      const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lon},${lat},${zoom}/${width}x${height}?access_token=${apiKey}`;
      
      satelliteData = { 
        type: 'image',
        url: url,
        provider: 'mapbox'
      };
    } else if (provider === 'bing') {
      // Bing Maps API
      const apiKey = process.env.BING_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Bing Maps API key not configured' });
      }

      const url = `https://dev.virtualearth.net/REST/v1/Imagery/Map/Aerial/${lat},${lon}/${zoom}?mapSize=${width},${height}&key=${apiKey}`;
      
      satelliteData = { 
        type: 'image',
        url: url,
        provider: 'bing'
      };
    } else {
      return res.status(400).json({ error: 'Invalid satellite provider' });
    }

    return res.status(200).json(satelliteData);
  } catch (error) {
    console.error('Satellite API error:', error);
    return res.status(500).json({ error: 'Failed to get satellite imagery' });
  }
} 