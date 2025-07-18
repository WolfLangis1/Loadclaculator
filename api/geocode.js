// Vercel Serverless Function for Google Geocoding API

const validateAddress = (address) => {
  const errors = [];
  
  if (!address || typeof address !== 'string') {
    errors.push('Address parameter is required and must be a string');
  } else if (address.trim().length < 3) {
    errors.push('Address must be at least 3 characters long');
  } else if (address.length > 200) {
    errors.push('Address must be less than 200 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? address.trim() : undefined
  };
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: `Method ${req.method} not allowed`
    });
  }

  const { address } = req.query;
  
  // Validate input
  const validation = validateAddress(address);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Request parameters are invalid',
      details: validation.errors,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey.startsWith('your_')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Google Maps API key not configured'
      });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(validation.data)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message || `API returned status: ${data.status}`);
    }

    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Geocoding API error:', error);
    
    return res.status(500).json({
      error: 'Geocoding service temporarily unavailable',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
} 