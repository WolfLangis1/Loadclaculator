
import { cors, rateLimit, validate } from './utils/middleware.js';
import { satelliteService } from './services/satelliteService.js';

const validateSatellite = (query) => {
  const { lat, lon, zoom = 18, width = 640, height = 640, provider = 'google' } = query;
  if (!lat || !lon) {
    return { isValid: false, errors: ['Latitude and longitude are required'] };
  }
  return { isValid: true, data: { lat, lon, zoom, width, height, provider } };
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validateSatellite)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, zoom, width, height, provider } = req.validatedData;

  try {
    const satelliteData = satelliteService.getSatelliteData(provider, lat, lon, zoom, width, height);
    return res.status(200).json(satelliteData);
  } catch (error) {
    console.error('Satellite API error:', error);
    return res.status(500).json({ error: 'Failed to get satellite imagery' });
  }
}
 