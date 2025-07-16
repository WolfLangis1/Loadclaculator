// Vercel serverless function for Google Street View Static API with metadata validation
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get parameters from query
  const { 
    lat, 
    lon, 
    address,
    heading = 0, 
    pitch = 0, 
    fov = 90, 
    width = 640, 
    height = 640,
    skipValidation = false // Allow bypassing validation for testing
  } = req.query;

  // Require either coordinates or address
  if (!lat && !lon && !address) {
    return res.status(400).json({ error: 'Either latitude/longitude or address is required' });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

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
          fallbackType: 'satellite' // Suggest fallback to satellite imagery
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
      `location=${location}` +
      `&size=${width}x${height}` +
      `&heading=${heading}` +
      `&pitch=${pitch}` +
      `&fov=${fov}` +
      `&key=${apiKey}`;
    
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

    return res.status(200).json(streetViewData);
  } catch (error) {
    console.error('Street View API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get street view imagery',
      available: false,
      fallbackType: 'satellite'
    });
  }
}

// Helper function to provide user-friendly error messages
function getErrorMessage(status) {
  switch (status) {
    case 'ZERO_RESULTS':
      return 'No street view imagery available at this location. Try a nearby address or use satellite imagery instead.';
    case 'NOT_FOUND':
      return 'The specified location could not be found. Please check the address and try again.';
    case 'OVER_QUERY_LIMIT':
      return 'Street View API quota exceeded. Please try again later.';
    case 'REQUEST_DENIED':
      return 'Street View request was denied. Please contact support.';
    case 'INVALID_REQUEST':
      return 'Invalid street view request parameters. Please check your input.';
    case 'UNKNOWN_ERROR':
      return 'Unknown error occurred while fetching street view. Please try again.';
    default:
      return `Street view unavailable (${status}). Satellite imagery may be available instead.`;
  }
}