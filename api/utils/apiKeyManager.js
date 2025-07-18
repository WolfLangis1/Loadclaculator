/**
 * Centralized API Key Manager
 * Handles secure API key management with fallback strategies and rotation support
 */

import fs from 'fs';
import path from 'path';

class ApiKeyManager {
  constructor() {
    this.keys = new Map();
    this.loadApiKeys();
  }

  /**
   * Load API keys from environment variables or Docker secrets
   */
  loadApiKeys() {
    // Load from Docker secrets in production
    if (process.env.NODE_ENV === 'production') {
      this.loadFromDockerSecrets();
    }
    
    // Load from environment variables (development/fallback)
    this.loadFromEnvironment();
    
    // Validate required keys are present
    this.validateRequiredKeys();
  }

  /**
   * Load API keys from Docker secrets
   */
  loadFromDockerSecrets() {
    const secretsPath = '/run/secrets';
    const secretKeys = [
      'google_maps_api_key',
      'supabase_url',
      'supabase_anon_key', 
      'supabase_service_key',
      'openweather_api_key',
      'jwt_secret',
      'stripe_secret_key',
      'stripe_publishable_key',
      'stripe_webhook_secret'
    ];

    for (const secretKey of secretKeys) {
      try {
        const secretPath = path.join(secretsPath, secretKey);
        if (fs.existsSync(secretPath)) {
          const secretValue = fs.readFileSync(secretPath, 'utf8').trim();
          this.keys.set(secretKey.toUpperCase(), secretValue);
          console.log(`✓ Loaded ${secretKey} from Docker secrets`);
        }
      } catch (error) {
        console.warn(`⚠ Failed to load ${secretKey} from Docker secrets:`, error.message);
      }
    }
  }

  /**
   * Load API keys from environment variables
   */
  loadFromEnvironment() {
    const envKeys = {
      'GOOGLE_MAPS_API_KEY': 'GOOGLE_MAPS_API_KEY',
      'SUPABASE_URL': 'SUPABASE_URL', 
      'SUPABASE_ANON_KEY': 'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_KEY': 'SUPABASE_SERVICE_KEY',
      'OPENWEATHER_API_KEY': 'OPENWEATHER_API_KEY',
      'JWT_SECRET': 'JWT_SECRET',
      'STRIPE_SECRET_KEY': 'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY': 'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET': 'STRIPE_WEBHOOK_SECRET'
    };

    for (const [internalKey, envKey] of Object.entries(envKeys)) {
      // Only load if not already loaded from secrets
      if (!this.keys.has(internalKey)) {
        const value = process.env[envKey];
        if (value && value !== 'your_actual_' + envKey.toLowerCase() + '_here') {
          this.keys.set(internalKey, value);
          console.log(`✓ Loaded ${internalKey} from environment`);
        }
      }
    }
  }

  /**
   * Validate that required API keys are present
   */
  validateRequiredKeys() {
    const requiredKeys = ['GOOGLE_MAPS_API_KEY', 'JWT_SECRET'];
    const missingKeys = requiredKeys.filter(key => !this.keys.has(key));
    
    if (missingKeys.length > 0) {
      console.warn(`⚠ Missing required API keys: ${missingKeys.join(', ')}`);
      console.warn('Some API features may not work properly');
    } else {
      console.log('✓ All required API keys are loaded');
    }
  }

  /**
   * Get an API key by name
   */
  getKey(keyName) {
    const key = this.keys.get(keyName.toUpperCase());
    if (!key) {
      throw new Error(`API key not found: ${keyName}`);
    }
    return key;
  }

  /**
   * Check if an API key exists
   */
  hasKey(keyName) {
    return this.keys.has(keyName.toUpperCase());
  }

  /**
   * Get Google Maps API key with validation
   */
  getGoogleMapsKey() {
    const key = this.getKey('GOOGLE_MAPS_API_KEY');
    if (!key || key.startsWith('your_')) {
      throw new Error('Google Maps API key not configured or invalid');
    }
    return key;
  }

  /**
   * Get Supabase credentials
   */
  getSupabaseCredentials() {
    return {
      url: this.keys.get('SUPABASE_URL'),
      anonKey: this.keys.get('SUPABASE_ANON_KEY'),
      serviceKey: this.keys.get('SUPABASE_SERVICE_KEY')
    };
  }

  /**
   * Get OpenWeather API key
   */
  getOpenWeatherKey() {
    const key = this.keys.get('OPENWEATHER_API_KEY');
    if (!key || key.startsWith('your_')) {
      throw new Error('OpenWeather API key not configured');
    }
    return key;
  }

  /**
   * Get JWT secret
   */
  getJwtSecret() {
    const secret = this.getKey('JWT_SECRET');
    if (secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }
    return secret;
  }

  /**
   * Get Stripe secret key
   */
  getStripeSecretKey() {
    const key = this.getKey('STRIPE_SECRET_KEY');
    if (!key || key.startsWith('sk_test_') === false && key.startsWith('sk_live_') === false) {
      throw new Error('Stripe secret key not configured or invalid format');
    }
    return key;
  }

  /**
   * Get Stripe publishable key
   */
  getStripePublishableKey() {
    const key = this.getKey('STRIPE_PUBLISHABLE_KEY');
    if (!key || key.startsWith('pk_test_') === false && key.startsWith('pk_live_') === false) {
      throw new Error('Stripe publishable key not configured or invalid format');
    }
    return key;
  }

  /**
   * Get Stripe webhook secret
   */
  getStripeWebhookSecret() {
    const key = this.getKey('STRIPE_WEBHOOK_SECRET');
    if (!key || key.startsWith('whsec_') === false) {
      throw new Error('Stripe webhook secret not configured or invalid format');
    }
    return key;
  }

  /**
   * Get all available service status
   */
  getServiceStatus() {
    return {
      googleMaps: this.hasKey('GOOGLE_MAPS_API_KEY') && !this.keys.get('GOOGLE_MAPS_API_KEY').startsWith('your_'),
      supabase: this.hasKey('SUPABASE_URL') && this.hasKey('SUPABASE_ANON_KEY'),
      openWeather: this.hasKey('OPENWEATHER_API_KEY') && !this.keys.get('OPENWEATHER_API_KEY').startsWith('your_'),
      jwt: this.hasKey('JWT_SECRET') && this.keys.get('JWT_SECRET').length >= 32,
      stripe: this.hasKey('STRIPE_SECRET_KEY') && this.hasKey('STRIPE_PUBLISHABLE_KEY')
    };
  }

  /**
   * Create masked version of API key for logging
   */
  maskKey(key) {
    if (!key || key.length < 8) {
      return '***masked***';
    }
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  }

  /**
   * Log current API key status (masked)
   */
  logStatus() {
    console.log('\n🔐 API Key Manager Status:');
    
    const status = this.getServiceStatus();
    console.log(`  Google Maps: ${status.googleMaps ? '✓' : '✗'} ${status.googleMaps ? this.maskKey(this.keys.get('GOOGLE_MAPS_API_KEY')) : 'not configured'}`);
    console.log(`  Supabase: ${status.supabase ? '✓' : '✗'} ${status.supabase ? 'configured' : 'not configured'}`);
    console.log(`  OpenWeather: ${status.openWeather ? '✓' : '✗'} ${status.openWeather ? this.maskKey(this.keys.get('OPENWEATHER_API_KEY')) : 'not configured'}`);
    console.log(`  JWT Secret: ${status.jwt ? '✓' : '✗'} ${status.jwt ? 'configured' : 'not configured'}`);
    console.log(`  Stripe: ${status.stripe ? '✓' : '✗'} ${status.stripe ? this.maskKey(this.keys.get('STRIPE_SECRET_KEY')) : 'not configured'}`);
    console.log('');
  }

  /**
   * Rotate API key (for future implementation)
   */
  rotateKey(keyName, newKey) {
    const oldKey = this.keys.get(keyName.toUpperCase());
    this.keys.set(keyName.toUpperCase(), newKey);
    
    console.log(`🔄 API key rotated: ${keyName}`);
    console.log(`  Old: ${this.maskKey(oldKey)}`);
    console.log(`  New: ${this.maskKey(newKey)}`);
    
    return true;
  }
}

// Singleton instance
const apiKeyManager = new ApiKeyManager();

export default apiKeyManager;
export { ApiKeyManager };