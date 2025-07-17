import { cors, rateLimit, validateInput, requestLogger } from './utils/middleware.js';
import ErrorHandler from './utils/errorHandler.js';
import apiKeyManager from './utils/apiKeyManager.js';

const validateAddress = (data) => {
  const errors = [];
  const address = data.address;
  
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

export default ErrorHandler.asyncHandler(async (req, res) => {
  // Apply middleware
  if (cors(req, res)) return;
  
  // Apply rate limiting (30 requests per minute for geocoding)
  rateLimit(30, 60000)(req, res, () => {});
  
  // Log request
  requestLogger(req, res, () => {});
  
  // Validate input
  validateInput(validateAddress)(req, res, () => {});
  
  if (req.method !== 'GET') {
    const error = ErrorHandler.createApiError(
      `Method ${req.method} not allowed`,
      405,
      'METHOD_NOT_ALLOWED'
    );
    return ErrorHandler.sendResponse(res, error);
  }

  const address = req.validatedData;

  try {
    const apiKey = apiKeyManager.getGoogleMapsKey();

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw ErrorHandler.handleExternalApiError(
        'Google Geocoding API',
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        response.status
      );
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw ErrorHandler.handleExternalApiError(
        'Google Geocoding API',
        new Error(data.error_message || `API returned status: ${data.status}`)
      );
    }

    return res.status(200).json(data);
    
  } catch (error) {
    if (error.message.includes('not configured')) {
      const apiError = ErrorHandler.handleApiKeyError('Google Maps API', error);
      return ErrorHandler.sendResponse(res, apiError);
    }
    
    ErrorHandler.logError(error, { 
      endpoint: 'geocode', 
      address: address?.substring(0, 50) + '...' 
    });
    
    if (error instanceof ErrorHandler.constructor) {
      return ErrorHandler.sendResponse(res, error);
    }
    
    const apiError = ErrorHandler.createApiError('Geocoding service temporarily unavailable');
    return ErrorHandler.sendResponse(res, apiError);
  }
}); 