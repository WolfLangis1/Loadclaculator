import { cors, rateLimit, validate } from './utils/middleware.js';
import { weatherService } from './services/weatherService.js';

const validateWeather = (query) => {
  const { lat, lon, provider = 'openweather' } = query;
  if (!lat || !lon) {
    return { isValid: false, errors: ['Latitude and longitude are required'] };
  }
  return { isValid: true, data: { lat, lon, provider } };
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validateWeather)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, provider } = req.validatedData;

  try {
    const weatherData = await weatherService.getWeatherData(provider, lat, lon);
    return res.status(200).json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({ error: 'Failed to get weather data' });
  }
}