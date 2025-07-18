
// Vercel Serverless Function for Google Street View API

const validateStreetView = (query) => {
  const { lat, lon, address, heading = 0, pitch = 0, fov = 90, width = 640, height = 640, skipValidation = false } = query;
  
  if (!lat && !lon && !address) {
    return { isValid: false, errors: ['Either latitude/longitude or address is required'] };
  }
  
  return { 
    isValid: true, 
    data: { lat, lon, address, heading, pitch, fov, width, height, skipValidation } 
  };
};

const getStreetViewImageUrl = (location, width, height, heading, pitch, fov, apiKey) => {
  const params = new URLSearchParams({
    size: `${width}x${height}`,
    location: location,
    heading: heading.toString(),
    pitch: pitch.toString(),
    fov: fov.toString(),
    key: apiKey
  });
  
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
};

const getStreetViewMetadata = async (location, heading, apiKey) => {
  const params = new URLSearchParams({
    location: location,
    heading: heading.toString(),
    key: apiKey
  });
  
  const response = await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?${params.toString()}`);
  return await response.json();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader(corsHeaders).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate input
  const validation = validateStreetView(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid parameters',
      details: validation.errors,
      timestamp: new Date().toISOString()
    });
  }

  const { lat, lon, address, heading = 0, pitch = 0, fov = 90, width = 640, height = 640, skipValidation = false } = validation.data;

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey.startsWith('your_')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Google Maps API key not configured',
        available: false,
        fallbackType: 'satellite'
      });
    }

    let location = address ? encodeURIComponent(address) : `${lat},${lon}`;
    let validatedCoords = null;

    // Validate street view availability unless skipped
    if (skipValidation !== 'true' && skipValidation !== true) {
      const metadata = await getStreetViewMetadata(location, heading, apiKey);
      if (metadata.status !== 'OK') {
        return res.status(404).json({
          error: 'Street view not available',
          status: metadata.status,
          message: `Street view not available for this location: ${metadata.status}`,
          available: false,
          fallbackType: 'satellite',
        });
      }
      if (metadata.location) {
        validatedCoords = metadata.location;
        location = `${metadata.location.lat},${metadata.location.lng}`;
      }
    }

    const imageUrl = getStreetViewImageUrl(location, width, height, heading, pitch, fov, apiKey);

    const streetViewData = {
      type: 'image',
      url: imageUrl,
      provider: 'google',
      available: true,
      validated: skipValidation !== 'true' && skipValidation !== true,
      location: address || location,
      coordinates: validatedCoords || (lat && lon ? { lat: parseFloat(lat), lng: parseFloat(lon) } : null),
      heading: parseInt(heading),
      pitch: parseInt(pitch),
      fov: parseInt(fov),
      dimensions: { width: parseInt(width), height: parseInt(height) },
    };

    return res.status(200).json(streetViewData);
  } catch (error) {
    console.error('Street View API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get street view imagery', 
      message: error.message || 'Internal server error',
      available: false, 
      fallbackType: 'satellite',
      timestamp: new Date().toISOString()
    });
  }
}
