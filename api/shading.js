import { cors, rateLimit, validate } from './utils/middleware.js';
import { shadingService } from './services/shadingService.js';

const validateShading = (query) => {
  const { lat, lon, timestamp } = query;
  if (!lat || !lon) {
    return { isValid: false, errors: ['Latitude and longitude are required'] };
  }
  return { isValid: true, data: { lat, lon, timestamp } };
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validateShading)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, timestamp } = req.validatedData;

  try {
    const weatherData = await shadingService.getWeatherData(lat, lon);
    const currentTime = timestamp ? new Date(parseInt(timestamp)) : new Date();
    const hour = currentTime.getHours();
    const month = currentTime.getMonth();

    const shadingFactor = shadingService.calculateShadingFactor(hour, month, weatherData);
    const sunPosition = shadingService.calculateSunPosition(lat, lon, currentTime);
    const shadowLength = shadingService.calculateShadowLength(weatherData, hour);
    const solarIrradiance = shadingService.calculateSolarIrradiance(month, hour, shadingFactor);

    const shadingData = {
      timestamp: currentTime.toISOString(),
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      shadingFactor,
      weather: weatherData,
      analysis: {
        sunPosition,
        shadowLength,
        solarIrradiance,
      },
    };

    return res.status(200).json(shadingData);
  } catch (error) {
    console.error('Shading analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze shading' });
  }
} 