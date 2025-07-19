import { cors } from './utils/middleware.js';

export default async function handler(req, res) {
  // Apply secure CORS middleware
  if (cors(req, res)) return;
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, sessiontoken } = req.query;

  // Basic validation
  if (!input || typeof input !== 'string' || input.length < 2) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'Input must be at least 2 characters long' 
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

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`;
    if (sessiontoken) {
      url += `&sessiontoken=${encodeURIComponent(sessiontoken)}`;
    }

    console.log('Calling Google Places API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Google API error',
        message: `Google API returned ${response.status}: ${response.statusText}`
      });
    }

    const data = await response.json();
    console.log('Google Places API success');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Places API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to get place suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 