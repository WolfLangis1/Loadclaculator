// Vercel serverless function for Weather APIs
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
  const { lat, lon, provider = 'openweather' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    let weatherData;

    if (provider === 'openweather') {
      // OpenWeather API
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'OpenWeather API key not configured' });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
      );
      weatherData = await response.json();
    } else if (provider === 'noaa') {
      // NOAA API
      const apiKey = process.env.NOAA_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'NOAA API key not configured' });
      }

      const response = await fetch(
        `https://api.weather.gov/points/${lat},${lon}`,
        {
          headers: {
            'User-Agent': 'LoadCalculator/1.0',
            'Accept': 'application/geo+json'
          }
        }
      );
      weatherData = await response.json();
    } else {
      return res.status(400).json({ error: 'Invalid weather provider' });
    }

    return res.status(200).json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({ error: 'Failed to get weather data' });
  }
} 