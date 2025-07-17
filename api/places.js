import { cors, rateLimit, validate } from './utils/middleware.js';
import { SecureApiService } from '../src/services/secureApiService.js';

const validatePlaces = (query) => {
  const inputValidation = SecureApiService.validateAddress(query.input);
  if (!inputValidation.isValid) {
    return inputValidation;
  }
  const sessiontoken = query.sessiontoken ? SecureApiService.sanitizeString(query.sessiontoken, 100) : undefined;
  return { isValid: true, data: { input: inputValidation.data, sessiontoken } };
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(validatePlaces)(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, sessiontoken } = req.validatedData;

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`;
    if (sessiontoken) {
      url += `&sessiontoken=${sessiontoken}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Places API error:', error);
    return res.status(500).json({ error: 'Failed to get place suggestions' });
  }
} 