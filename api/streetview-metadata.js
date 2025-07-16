// Vercel serverless function for Google Street View Metadata API
// This endpoint validates street view image availability before fetching actual images
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
    source = 'default' // 'default' or 'outdoor'
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

    // Build the location parameter
    let location;
    if (address) {
      location = encodeURIComponent(address);
    } else {
      location = `${lat},${lon}`;
    }

    // Build Street View Metadata API URL
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
      `location=${location}` +
      `&heading=${heading}` +
      `&source=${source}` +
      `&key=${apiKey}`;
    
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
        `location=${metadata.location.lat},${metadata.location.lng}` +
        `&heading=${heading}` +
        `&size=640x640` +
        `&key=${apiKey}`;
      
      result.imageUrl = imageUrl;
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Street View Metadata API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get street view metadata',
      available: false,
      status: 'ERROR'
    });
  }
}

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