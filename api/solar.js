// Vercel serverless function for Google Solar API
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
  const { lat, lon, radiusMeters = 100 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    // Get API key from environment variables (server-side only)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

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
            documentation: 'https://developers.google.com/maps/documentation/solar'
          },
          details: errorData
        });
      }
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'No solar data available for this location',
          message: 'Google Solar API does not have imagery or data for this specific location.',
          fallbackAvailable: true,
          debugInfo: {
            status: response.status,
            location: { lat: parseFloat(lat), lon: parseFloat(lon) },
            suggestion: 'Try a nearby address or use AI analysis for roof detection'
          },
          details: errorData
        });
      }
      
      if (response.status === 400) {
        return res.status(400).json({ 
          error: 'Invalid Solar API request',
          message: 'The request parameters are invalid or malformed.',
          fallbackAvailable: true,
          debugInfo: {
            status: response.status,
            parameters: { lat: parseFloat(lat), lon: parseFloat(lon), radiusMeters: parseInt(radiusMeters) },
            solution: 'Check that latitude and longitude are valid coordinates'
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
          endpoint: 'Vercel serverless function'
        },
        details: errorData
      });
    }

    const data = await response.json();

    // Return the solar data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Solar API error:', error);
    return res.status(500).json({ error: 'Failed to get solar data' });
  }
} 