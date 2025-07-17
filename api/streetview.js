
import { cors, rateLimit, validate } from './utils/middleware.js';
import { streetviewService } from './services/streetviewService.js';

const validateStreetView = (query) => {
  const { lat, lon, address, heading = 0, pitch = 0, fov = 90, width = 640, height = 640, skipValidation = false } = query;
  if (!lat && !lon && !address) {
    return { isValid: false, errors: ['Either latitude/longitude or address is required'] };
  }
  return { isValid: true, data: { lat, lon, address, heading, pitch, fov, width, height, skipValidation } };
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validateStreetView)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, address, heading, pitch, fov, width, height, skipValidation } = req.validatedData;

  try {
    let location = address ? encodeURIComponent(address) : `${lat},${lon}`;
    let validatedCoords = null;

    if (skipValidation !== 'true') {
      const metadata = await streetviewService.getStreetViewMetadata(location, heading);
      if (metadata.status !== 'OK') {
        return res.status(404).json({
          error: 'Street view not available',
          status: metadata.status,
          message: streetviewService.getErrorMessage(metadata.status),
          available: false,
          fallbackType: 'satellite',
        });
      }
      if (metadata.location) {
        validatedCoords = metadata.location;
        location = `${metadata.location.lat},${metadata.location.lng}`;
      }
    }

    const imageUrl = streetviewService.getStreetViewImageUrl(location, width, height, heading, pitch, fov);

    const streetViewData = {
      type: 'image',
      url: imageUrl,
      provider: 'google',
      available: true,
      validated: skipValidation !== 'true',
      location: address || location,
      coordinates: validatedCoords || (lat && lon ? { lat: parseFloat(lat), lng: parseFloat(lon) } : null),
      heading: parseInt(heading),
      pitch: parseInt(pitch),
      fov: parseInt(fov),
      dimensions: { width: parseInt(width), height: parseInt(height) },
    };

    return res.status(200).json(streetViewData);
  } catch (error) {
    console.error('Street View API error:', error);
    return res.status(500).json({ error: 'Failed to get street view imagery', available: false, fallbackType: 'satellite' });
  }
}
