/**
 * API Health Check Endpoint
 * Provides comprehensive health status for monitoring and debugging
 */

import { cors, healthCheck, requestLogger } from './utils/middleware.js';
import ErrorHandler from './utils/errorHandler.js';

export default async function handler(req, res) {
  try {
    // Enable CORS
    if (cors(req, res)) return;
    
    // Log request
    requestLogger(req, res, () => {});
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      const error = ErrorHandler.createApiError(
        `Method ${req.method} not allowed`,
        405,
        'METHOD_NOT_ALLOWED'
      );
      return ErrorHandler.sendResponse(res, error);
    }
    
    // Return health status
    healthCheck(req, res);
    
  } catch (error) {
    ErrorHandler.logError(error, { endpoint: 'health', method: req.method });
    const apiError = ErrorHandler.createApiError('Health check failed');
    ErrorHandler.sendResponse(res, apiError);
  }
}