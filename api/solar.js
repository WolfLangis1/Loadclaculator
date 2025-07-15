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

    // Make request to Google Solar API
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&radiusMeters=${radiusMeters}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Solar API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Solar API request failed',
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