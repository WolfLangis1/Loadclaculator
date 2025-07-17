import { createComponentLogger } from './loggingService';

const logger = createComponentLogger('SecureApiService');

// Input validation interfaces
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

// Simple in-memory rate limiter (for production, use Redis)
class SimpleRateLimiter {
  private requests = new Map<string, number[]>();

  constructor() {
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }
  
  isAllowed(key: string, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const keyRequests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = keyRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + windowMs
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: now + windowMs
    };
  }
  
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > now - maxAge);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Secure API Service - Uses backend proxy or direct API calls depending on environment
export class SecureApiService {
  private static rateLimiter = new SimpleRateLimiter();
  private static readonly API_BASE = (() => {
    // Always use backend proxy in production for security
    if (import.meta.env.PROD) {
      return '/api';
    }
    
    // Development: use configured backend or proxy
    if (import.meta.env.API_BASE_URL === '') {
      return '/api';
    }
    
    return import.meta.env.API_BASE_URL ? 
      `${import.meta.env.API_BASE_URL}/api` : '/api';
  })();

  // Enhanced request method with retry logic and better error handling
  private static async makeRequest(
    url: string, 
    options: RequestInit = {},
    retries = 2
  ): Promise<any> {
    const requestId = Math.random().toString(36).substring(7);
    logger.info(`🌐 API Request [${requestId}]: ${options.method || 'GET'} ${url}`);
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            ...options.headers
          }
        });
        
        // Parse response
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = { message: await response.text() };
        }
        
        if (!response.ok) {
          // Handle specific error responses
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            logger.warn(`Rate limited. Retry after: ${retryAfter}s`);
            
            if (attempt < retries && retryAfter) {
              await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
              continue;
            }
          }
          
          throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        logger.info(`✅ API Success [${requestId}]: ${response.status}`);
        return data;
        
      } catch (error) {
        logger.error(`❌ API Error [${requestId}] (attempt ${attempt + 1}/${retries + 1}):`, error instanceof Error ? error : new Error(String(error)));
        
        // Don't retry on client errors (4xx)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('4')) {
          throw error;
        }
        
        // Retry on network/server errors
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff
          logger.info(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
  }

  // Geocoding API
  static async geocodeAddress(address: string): Promise<any> {
    if (!address || address.trim().length < 3) {
      throw new Error('Address must be at least 3 characters long');
    }
    
    const url = `${this.API_BASE}/geocode?address=${encodeURIComponent(address.trim())}`;
    return this.makeRequest(url);
  }

  // Places Autocomplete API
  static async getPlaceSuggestions(input: string, sessionToken?: string): Promise<any> {
    if (!input || input.trim().length < 2) {
      throw new Error('Search input must be at least 2 characters long');
    }
    
    let url = `${this.API_BASE}/places?input=${encodeURIComponent(input.trim())}`;
    
    if (sessionToken) {
      url += `&sessiontoken=${encodeURIComponent(sessionToken)}`;
    }
    
    return this.makeRequest(url);
  }

  // Weather API
  static async getWeatherData(lat: number, lon: number, provider: 'openweather' | 'noaa' = 'openweather'): Promise<any> {
    const validation = this.validateCoordinatesExternal(lat, lon);
    if (!validation.isValid) {
      throw new Error(`Invalid coordinates: ${validation.errors.join(', ')}`);
    }
    
    const url = `${this.API_BASE}/weather?lat=${lat}&lon=${lon}&provider=${provider}`;
    return this.makeRequest(url);
  }

  // Satellite Imagery API
  static async getSatelliteImage(
    lat: number, 
    lon: number, 
    zoom: number = 18, 
    width: number = 640, 
    height: number = 640,
    provider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar' = 'google'
  ): Promise<any> {
    const validation = this.validateCoordinatesExternal(lat, lon);
    if (!validation.isValid) {
      throw new Error(`Invalid coordinates: ${validation.errors.join(', ')}`);
    }
    
    // Validate parameters
    if (zoom < 1 || zoom > 20) {
      throw new Error('Zoom level must be between 1 and 20');
    }
    
    if (width < 100 || width > 2048 || height < 100 || height > 2048) {
      throw new Error('Image dimensions must be between 100 and 2048 pixels');
    }
    
    const url = `${this.API_BASE}/satellite?lat=${lat}&lon=${lon}&zoom=${zoom}&width=${width}&height=${height}&provider=${provider}`;
    return this.makeRequest(url);
  }
  

  // Get satellite image URL (for direct image display)
  static getSatelliteImageUrl(
    lat: number, 
    lon: number, 
    zoom: number = 18, 
    width: number = 640, 
    height: number = 640,
    provider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar' = 'google'
  ): string {
    return `${this.API_BASE}/satellite?lat=${lat}&lon=${lon}&zoom=${zoom}&width=${width}&height=${height}&provider=${provider}`;
  }

  // Solar API (Google Solar API)
  static async getSolarData(
    lat: number,
    lon: number,
    radiusMeters: number = 100
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/solar?lat=${lat}&lon=${lon}&radiusMeters=${radiusMeters}`
      );
      
      if (!response.ok) {
        throw new Error(`Solar API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Solar API error', error instanceof Error ? error : new Error(String(error)), { lat, lon, radiusMeters });
      throw error;
    }
  }

  // Multi-source imagery with fallback
  static async getMultiSourceImagery(
    lat: number,
    lon: number,
    zoom: number = 18,
    width: number = 640,
    height: number = 640,
    preferredProvider: 'google' | 'mapbox' | 'bing' = 'google'
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/satellite?lat=${lat}&lon=${lon}&zoom=${zoom}&width=${width}&height=${height}&provider=${preferredProvider}`
      );
      
      if (!response.ok) {
        throw new Error(`Multi-source imagery failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Multi-source imagery error', error instanceof Error ? error : new Error(String(error)), { lat, lon, zoom, preferredProvider });
      throw error;
    }
  }

  // Real-time shading analysis
  static async getRealTimeShading(
    lat: number,
    lon: number,
    timestamp?: number
  ): Promise<any> {
    try {
      let url = `${this.API_BASE}/shading?lat=${lat}&lon=${lon}`;
      if (timestamp) {
        url += `&timestamp=${timestamp}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Shading analysis failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Shading analysis error', error instanceof Error ? error : new Error(String(error)), { lat, lon, timestamp: timestamp?.toString() });
      throw error;
    }
  }

  // Street View API
  static async getStreetView(
    lat: number,
    lon: number,
    heading: number = 0,
    pitch: number = 0,
    fov: number = 90,
    width: number = 640,
    height: number = 640
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/streetview?lat=${lat}&lon=${lon}&heading=${heading}&pitch=${pitch}&fov=${fov}&width=${width}&height=${height}`
      );
      
      if (!response.ok) {
        throw new Error(`Street View API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Street View API error', error instanceof Error ? error : new Error(String(error)), { lat, lon, heading, pitch, fov });
      throw error;
    }
  }

  // Street View by address
  static async getStreetViewByAddress(
    address: string,
    heading: number = 0,
    pitch: number = 0,
    fov: number = 90,
    width: number = 640,
    height: number = 640
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/streetview?address=${encodeURIComponent(address)}&heading=${heading}&pitch=${pitch}&fov=${fov}&width=${width}&height=${height}`
      );
      
      if (!response.ok) {
        throw new Error(`Street View API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Street View API error', error instanceof Error ? error : new Error(String(error)), { address, heading, pitch, fov });
      throw error;
    }
  }

  // AI Roof Analysis
  static async getAIRoofAnalysis(
    lat: number,
    lon: number,
    roofData?: any
  ): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/roof-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lon,
          roofData
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI roof analysis failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('AI roof analysis error', error instanceof Error ? error : new Error(String(error)), { lat, lon, roofData });
      throw error;
    }
  }

  // Enhanced health check for API availability
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
    responseTime: number;
    backend: string;
  }> {
    const startTime = performance.now();
    const services: Record<string, boolean> = {};
    
    // Test core services with lightweight requests
    const testServices = [
      { name: 'health', endpoint: 'health' },
      { name: 'geocoding', endpoint: 'geocode?address=test', expectError: true },
      { name: 'places', endpoint: 'places?input=test', expectError: true }
    ];
    
    const results = await Promise.allSettled(
      testServices.map(async (service) => {
        try {
          const response = await fetch(`${this.API_BASE}/${service.endpoint}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          
          // For services that expect errors, 4xx is still "healthy"
          const isHealthy = service.expectError ? 
            response.status < 500 : 
            response.status < 400;
            
          services[service.name] = isHealthy;
          return isHealthy;
        } catch (error) {
          services[service.name] = false;
          return false;
        }
      })
    );
    
    const healthyServices = results.filter(result => 
      result.status === 'fulfilled' && result.value
    ).length;
    
    const totalServices = testServices.length;
    const responseTime = performance.now() - startTime;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      services,
      timestamp: new Date().toISOString(),
      responseTime: Math.round(responseTime),
      backend: this.API_BASE
    };
  }

  // Real-time API monitoring dashboard data
  static async getMonitoringDashboard(): Promise<{
    overview: any;
    recentRequests: any[];
    errorRate: number;
    avgResponseTime: number;
  }> {
    const overview = await this.healthCheck();
    
    // This would typically pull from monitoring service
    // For now, return simulated data
    return {
      overview,
      recentRequests: [], // Would come from request logs
      errorRate: 0, // Would be calculated from logs
      avgResponseTime: overview.responseTime
    };
  }

  // Client-side circuit breaker pattern
  private static circuitBreakers = new Map<string, {
    failures: number;
    lastFailure: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  }>();

  static createCircuitBreaker(serviceName: string, failureThreshold = 3, resetTimeoutMs = 30000) {
    return async <T>(operation: () => Promise<T>): Promise<T> => {
      const breaker = this.circuitBreakers.get(serviceName) || {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED' as const
      };

      // Check if circuit should be half-open
      if (breaker.state === 'OPEN' && 
          Date.now() - breaker.lastFailure > resetTimeoutMs) {
        breaker.state = 'HALF_OPEN';
      }

      // Reject if circuit is open
      if (breaker.state === 'OPEN') {
        throw new Error(`Service ${serviceName} is temporarily unavailable (circuit breaker open)`);
      }

      try {
        const result = await operation();
        
        // Reset on success
        if (breaker.state === 'HALF_OPEN') {
          breaker.failures = 0;
          breaker.state = 'CLOSED';
        }
        
        this.circuitBreakers.set(serviceName, breaker);
        return result;
        
      } catch (error) {
        breaker.failures++;
        breaker.lastFailure = Date.now();

        // Open circuit if threshold reached
        if (breaker.failures >= failureThreshold) {
          breaker.state = 'OPEN';
          logger.warn(`Circuit breaker opened for ${serviceName} after ${breaker.failures} failures`);
        }

        this.circuitBreakers.set(serviceName, breaker);
        throw error;
      }
    };
  }

  // Check specific service health
  static async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      let endpoint: string;
      switch (serviceName) {
        case 'geocoding':
          endpoint = 'geocode?address=test';
          break;
        case 'places':
          endpoint = 'places?input=test';
          break;
        case 'solar':
          endpoint = 'solar?lat=37.7749&lon=-122.4194';
          break;
        case 'weather':
          endpoint = 'weather?lat=37.7749&lon=-122.4194';
          break;
        case 'satellite':
          endpoint = 'satellite?lat=37.7749&lon=-122.4194';
          break;
        default:
          return false;
      }
      
      const response = await fetch(`${this.API_BASE}/${endpoint}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      return response.status < 500;
    } catch (error) {
      logger.warn(`Service ${serviceName} health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Get API status with caching
  private static apiStatusCache: { 
    timestamp: number; 
    status: any; 
  } | null = null;
  
  static async getApiStatus(forceRefresh = false): Promise<any> {
    const cacheExpiry = 30000; // 30 seconds
    const now = Date.now();
    
    if (!forceRefresh && 
        this.apiStatusCache && 
        (now - this.apiStatusCache.timestamp) < cacheExpiry) {
      return this.apiStatusCache.status;
    }
    
    const status = await this.healthCheck();
    this.apiStatusCache = {
      timestamp: now,
      status
    };
    
    return status;
  }

  // ================== VALIDATION METHODS ==================

  // Public coordinate validation for external use
  static validateCoordinatesExternal(lat: any, lon: any): ValidationResult {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    const errors: string[] = [];
    
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
    
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? { lat: latitude, lon: longitude } : undefined
    };
  }

  // Address validation
  static validateAddress(address: any): ValidationResult {
    const errors: string[] = [];
    
    if (!address || typeof address !== 'string') {
      errors.push('Address must be a non-empty string');
    } else {
      const trimmedAddress = address.trim();
      
      if (trimmedAddress.length < 5) {
        errors.push('Address must be at least 5 characters long');
      }
      
      if (trimmedAddress.length > 200) {
        errors.push('Address must be less than 200 characters');
      }
      
      // Basic format validation - should contain alphanumeric characters
      if (!/[a-zA-Z0-9]/.test(trimmedAddress)) {
        errors.push('Address must contain alphanumeric characters');
      }
      
      // Check for potential injection attempts
      if (this.containsSuspiciousPatterns(trimmedAddress)) {
        errors.push('Address contains invalid characters');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? address.trim() : undefined
    };
  }

  // Numeric parameter validation
  static validateNumericParam(
    value: any, 
    paramName: string, 
    options: { min?: number; max?: number; integer?: boolean; required?: boolean } = {}
  ): ValidationResult {
    const { min, max, integer = false, required = true } = options;
    const errors: string[] = [];
    
    if (value === undefined || value === null || value === '') {
      if (required) {
        errors.push(`${paramName} is required`);
      }
      return {
        isValid: !required,
        errors,
        data: null
      };
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      errors.push(`${paramName} must be a valid number`);
    } else {
      if (integer && !Number.isInteger(numValue)) {
        errors.push(`${paramName} must be an integer`);
      }
      
      if (min !== undefined && numValue < min) {
        errors.push(`${paramName} must be at least ${min}`);
      }
      
      if (max !== undefined && numValue > max) {
        errors.push(`${paramName} must be at most ${max}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? numValue : undefined
    };
  }

  // Check for suspicious patterns that might indicate injection attempts
  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:.*base64/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /\.\.\/\.\./, // Path traversal
      /\.\.\\\.\.\\/,
      /\/etc\/passwd/i,
      /\/proc\/self/i,
      /system\s*\(/i,
      /file:\/\//i,
      /\${.*}/  // Template injection
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  // Sanitize string input
  static sanitizeString(input: any, maxLength = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>'"]/g, '') // Remove basic HTML/JS chars
      .replace(/\0/g, ''); // Remove null bytes
  }

  // Complete validation for coordinate-based requests
  static validateCoordinateRequest(
    params: { lat?: any; lon?: any; [key: string]: any },
    additionalParams: Record<string, { min?: number; max?: number; integer?: boolean; required?: boolean }> = {}
  ): ValidationResult {
    const { lat, lon, ...otherParams } = params;
    const coordValidation = this.validateCoordinatesExternal(lat, lon);
    
    const errors = [...coordValidation.errors];
    const data: any = coordValidation.data ? { ...coordValidation.data } : {};
    
    // Validate additional parameters
    for (const [paramName, options] of Object.entries(additionalParams)) {
      const paramValidation = this.validateNumericParam(otherParams[paramName], paramName, options);
      errors.push(...paramValidation.errors);
      if (paramValidation.isValid && paramValidation.data !== null) {
        data[paramName] = paramValidation.data;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }

  // Rate limiting check
  static checkRateLimit(identifier: string, limit: number, windowMs: number): {
    allowed: boolean;
    headers: Record<string, string>;
    error?: { status: number; body: any };
  } {
    const rateLimitResult = this.rateLimiter.isAllowed(identifier, limit, windowMs);
    
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
    };

    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        headers,
        error: {
          status: 429,
          body: {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          }
        }
      };
    }

    return { allowed: true, headers };
  }

  // Create standardized validation error response
  static createValidationErrorResponse(errors: string[]): {
    error: string;
    message: string;
    details: string[];
    timestamp: string;
  } {
    return {
      error: 'Validation failed',
      message: 'Request parameters are invalid',
      details: errors,
      timestamp: new Date().toISOString()
    };
  }
} 