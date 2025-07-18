
// Simple CORS handler
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  // Handle CORS
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, zoom = 18, width = 640, height = 640, provider = 'google' } = req.query;

  // Basic validation
  if (!lat || !lon) {
    return res.status(400).json({ 
      error: 'Invalid parameters', 
      message: 'Latitude and longitude are required' 
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ 
      error: 'Invalid coordinates', 
      message: 'Latitude and longitude must be valid numbers' 
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not configured');
      return res.status(500).json({ 
        error: 'Service configuration error',
        message: 'Google Maps API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&key=${apiKey}`;

    console.log('Calling Google Static Maps API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google Static Maps API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Google API error',
        message: `Google API returned ${response.status}: ${response.statusText}`
      });
    }

    // For satellite imagery, we return the URL since it's an image
    const imageUrl = url;
    console.log('Google Static Maps API success');
    
    return res.status(200).json({ 
      imageUrl,
      coordinates: { lat: latitude, lon: longitude },
      zoom: parseInt(zoom),
      size: { width: parseInt(width), height: parseInt(height) }
    });
  } catch (error) {
    console.error('Satellite API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to get satellite imagery',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
 