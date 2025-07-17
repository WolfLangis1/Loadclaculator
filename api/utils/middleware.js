
import ErrorHandler from './errorHandler.js';

export const cors = (req, res) => {
  // Enhanced CORS policy with proper domain restrictions
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3003', 
    'http://localhost:3005',
    'https://load-calculator.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ];
  
  const origin = req.headers.origin;
  
  // Allow all origins in development, restrict in production
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};

// Simple in-memory rate limiter (for production, use Redis)
class SimpleRateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }
  
  isAllowed(key, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const keyRequests = this.requests.get(key);
    const validRequests = keyRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + windowMs
      };
    }
    
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

const rateLimiter = new SimpleRateLimiter();

export const rateLimit = (limit = 60, windowMs = 60000) => (req, res, next) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   req.ip || 'unknown';
  
  const rateLimitResult = rateLimiter.isAllowed(clientIP, limit, windowMs);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  
  if (!rateLimitResult.allowed) {
    const error = ErrorHandler.handleRateLimitError(limit, windowMs, clientIP);
    return ErrorHandler.sendResponse(res, error);
  }
  
  next();
};

import jwt from 'jsonwebtoken';
import apiKeyManager from './apiKeyManager.js';

export const validate = (schema) => (req, res, next) => {
  const validation = schema(req.query);
  if (!validation.isValid) {
    const error = ErrorHandler.handleValidationError(validation.errors);
    return ErrorHandler.sendResponse(res, error);
  }
  req.validatedData = validation.data;
  next();
};

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = ErrorHandler.createApiError('No token provided', 401, 'UNAUTHORIZED');
    return ErrorHandler.sendResponse(res, error);
  }

  const token = authHeader.substring(7);
  try {
    const jwtSecret = apiKeyManager.getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    const apiError = ErrorHandler.createApiError('Invalid token', 401, 'INVALID_TOKEN');
    return ErrorHandler.sendResponse(res, apiError);
  }
};

// Enhanced validation middleware with input sanitization
export const validateInput = (schema) => (req, res, next) => {
  const data = { ...req.query, ...req.body };
  
  // Basic input sanitization
  const sanitizedData = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitizedData[key] = value.trim().slice(0, 1000); // Limit length
    } else {
      sanitizedData[key] = value;
    }
  }
  
  const validation = schema(sanitizedData);
  if (!validation.isValid) {
    const error = ErrorHandler.handleValidationError(validation.errors);
    return ErrorHandler.sendResponse(res, error);
  }
  
  req.validatedData = validation.data;
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   req.ip || 'unknown';
  
  console.log(`📥 ${req.method} ${req.url} from ${clientIP}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const emoji = status >= 500 ? '🚨' : status >= 400 ? '⚠️' : '✅';
    console.log(`${emoji} ${status} ${req.method} ${req.url} - ${duration}ms`);
  });
  
  next();
};

// API health check middleware
export const healthCheck = (req, res) => {
  const status = apiKeyManager.getServiceStatus();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: status,
    uptime: process.uptime()
  };
  
  // Determine overall health
  const serviceStatuses = Object.values(status);
  if (serviceStatuses.every(s => s)) {
    health.status = 'healthy';
  } else if (serviceStatuses.some(s => s)) {
    health.status = 'degraded';
  } else {
    health.status = 'unhealthy';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
};
