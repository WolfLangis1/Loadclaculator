import { cors, rateLimit, validate } from './utils/middleware.js';
import { solarService } from './services/solarService.js';
import { SecureApiService } from '../src/services/secureApiService.js';

const validateSolar = (query) => {
  return SecureApiService.validateCoordinateRequest(query, {
    radiusMeters: { min: 10, max: 1000, integer: true, required: false },
  });
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validateSolar)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, radiusMeters = 100 } = req.validatedData;

  try {
    const solarData = await solarService.getGoogleSolarData(lat, lon);
    return res.status(200).json({ ...solarData, dataSource: 'google_solar_api', fallbackUsed: false });
  } catch (error) {
    console.warn('Google Solar API failed, using fallback:', error.message);
    const fallbackData = solarService.generateFallbackSolarData(lat, lon, radiusMeters);
    return res.status(200).json({ ...fallbackData, dataSource: 'fallback_calculation', fallbackUsed: true });
  }
}