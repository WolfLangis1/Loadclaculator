
import { cors, rateLimit, validate } from './utils/middleware.js';
import { streetviewService } from './services/streetviewService.js';

const validateStreetViewMetadata = (query) => {
  const { lat, lon, address, heading = 0, source = 'default' } = query;
  if (!lat && !lon && !address) {
    return { isValid: false, errors: ['Either latitude/longitude or address is required'] };
  }
  return { isValid: true, data: { lat, lon, address, heading, source } };
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validateStreetViewMetadata)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, address, heading, source } = req.validatedData;

  try {
    const location = address ? encodeURIComponent(address) : `${lat},${lon}`;
    const metadata = await streetviewService.getStreetViewMetadata(location, heading, source);

    const result = {
      available: metadata.status === 'OK',
      status: metadata.status,
      location: metadata.location || null,
      copyright: metadata.copyright || null,
      date: metadata.date || null,
      pano_id: metadata.pano_id || null,
      error: metadata.status !== 'OK' ? streetviewService.getErrorMessage(metadata.status) : null,
    };

    if (result.available && metadata.location) {
      result.coordinates = { lat: metadata.location.lat, lng: metadata.location.lng };
      result.imageUrl = streetviewService.getStreetViewImageUrl(`${metadata.location.lat},${metadata.location.lng}`, 640, 640, heading, 0, 90);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Street View Metadata API error:', error);
    return res.status(500).json({ error: 'Failed to get street view metadata', available: false, status: 'ERROR' });
  }
}
