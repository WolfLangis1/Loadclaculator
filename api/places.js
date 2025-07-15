// Vercel serverless function for Google Places API
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

  // Get the input from query parameters
  const { input, sessiontoken } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Input parameter is required' });
  }

  try {
    // Get API key from environment variables (server-side only)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    // Build the URL for Places API
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`;
    
    // Add session token if provided
    if (sessiontoken) {
      url += `&sessiontoken=${sessiontoken}`;
    }

    // Make request to Google Places API
    const response = await fetch(url);
    const data = await response.json();

    // Return the places results
    return res.status(200).json(data);
  } catch (error) {
    console.error('Places API error:', error);
    return res.status(500).json({ error: 'Failed to get place suggestions' });
  }
} 