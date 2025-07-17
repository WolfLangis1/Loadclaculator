#!/usr/bin/env node
/**
 * Environment Validation Script
 * Validates that all required environment variables are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class EnvironmentValidator {
  constructor() {
    this.requiredVars = {
      // Critical API keys
      GOOGLE_MAPS_API_KEY: {
        required: true,
        description: 'Google Maps API key for geocoding, places, and satellite imagery',
        validation: (value) => value && !value.startsWith('your_') && value.length > 10
      },
      
      // Authentication
      SUPABASE_URL: {
        required: true,
        description: 'Supabase project URL',
        validation: (value) => value && value.startsWith('https://') && value.includes('.supabase.co')
      },
      SUPABASE_ANON_KEY: {
        required: true,
        description: 'Supabase anonymous key',
        validation: (value) => value && !value.startsWith('your_') && value.length > 50
      },
      SUPABASE_SERVICE_KEY: {
        required: false,
        description: 'Supabase service key for backend operations',
        validation: (value) => !value || (!value.startsWith('your_') && value.length > 50)
      },
      
      // Security
      JWT_SECRET: {
        required: true,
        description: 'JWT secret for token signing (minimum 32 characters)',
        validation: (value) => value && value.length >= 32 && !value.startsWith('your_')
      },
      
      // Optional APIs
      OPENWEATHER_API_KEY: {
        required: false,
        description: 'OpenWeather API key for weather data',
        validation: (value) => !value || (!value.startsWith('your_') && value.length > 10)
      },
      MAPBOX_API_KEY: {
        required: false,
        description: 'Mapbox API key as alternative to Google Maps',
        validation: (value) => !value || (!value.startsWith('your_') && value.length > 10)
      },
      
      // Configuration
      USE_REAL_AERIAL_DATA: {
        required: false,
        description: 'Enable real aerial data (true/false)',
        validation: (value) => !value || ['true', 'false'].includes(value.toLowerCase())
      },
      AERIAL_PROVIDER: {
        required: false,
        description: 'Preferred aerial imagery provider (google/mapbox)',
        validation: (value) => !value || ['google', 'mapbox'].includes(value.toLowerCase())
      }
    };
    
    this.errors = [];
    this.warnings = [];
    this.envFiles = ['.env', '.env.local'];
  }

  loadEnvironmentFiles() {
    const env = {};
    
    // Load from process.env first
    Object.assign(env, process.env);
    
    // Load from .env files
    for (const envFile of this.envFiles) {
      const envPath = path.join(rootDir, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            }
          }
        }
        
        console.log(`✓ Loaded environment from ${envFile}`);
      } else {
        if (envFile === '.env.local') {
          this.warnings.push(`${envFile} not found - this is recommended for local development`);
        }
      }
    }
    
    return env;
  }

  validateEnvironment(env) {
    console.log('\n🔍 Validating environment variables...\n');
    
    for (const [varName, config] of Object.entries(this.requiredVars)) {
      const value = env[varName];
      const { required, description, validation } = config;
      
      if (required && !value) {
        this.errors.push(`❌ ${varName} is required but not set - ${description}`);
        continue;
      }
      
      if (!required && !value) {
        console.log(`⚪ ${varName} (optional) - not set`);
        continue;
      }
      
      if (value && validation && !validation(value)) {
        this.errors.push(`❌ ${varName} is invalid - ${description}`);
        continue;
      }
      
      // Mask sensitive values in output
      const displayValue = this.maskValue(varName, value);
      console.log(`✅ ${varName} - ${displayValue}`);
    }
  }

  maskValue(varName, value) {
    const sensitiveKeys = ['key', 'secret', 'token', 'password'];
    
    if (sensitiveKeys.some(key => varName.toLowerCase().includes(key))) {
      if (value.length < 8) {
        return '***masked***';
      }
      return value.substring(0, 4) + '***' + value.substring(value.length - 4);
    }
    
    return value;
  }

  checkFileStructure() {
    console.log('\n📁 Checking file structure...\n');
    
    const requiredFiles = [
      'package.json',
      'vite.config.js',
      'docker-compose.yml',
      '.env.example',
      '.env.local.example'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
      } else {
        this.errors.push(`❌ Required file missing: ${file}`);
      }
    }
    
    // Check for example files
    const exampleEnvPath = path.join(rootDir, '.env.example');
    if (fs.existsSync(exampleEnvPath)) {
      const content = fs.readFileSync(exampleEnvPath, 'utf8');
      if (content.includes('AIzaSy') || content.includes('your_actual_')) {
        this.warnings.push('⚠️  .env.example contains real API keys - this should only have placeholder values');
      }
    }
  }

  checkDocker() {
    console.log('\n🐳 Checking Docker configuration...\n');
    
    const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
    if (fs.existsSync(dockerComposePath)) {
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Check for build arguments (security risk)
      if (content.includes('args:') && content.includes('API_KEY')) {
        this.warnings.push('⚠️  docker-compose.yml contains API key build arguments - use runtime environment variables instead');
      }
      
      console.log('✅ Docker Compose file structure looks good');
    }
  }

  checkAPIKeySecurity() {
    console.log('\n🔐 Checking API key security...\n');
    
    // Check for API keys in source code
    const srcDir = path.join(rootDir, 'src');
    if (fs.existsSync(srcDir)) {
      this.checkDirectoryForSecrets(srcDir);
    }
    
    const apiDir = path.join(rootDir, 'api');
    if (fs.existsSync(apiDir)) {
      this.checkDirectoryForSecrets(apiDir);
    }
  }

  checkDirectoryForSecrets(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.')) {
        this.checkDirectoryForSecrets(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js') || file.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for hardcoded API keys
        const suspiciousPatterns = [
          /AIza[0-9A-Za-z_-]{35}/g, // Google API keys
          /sk_live_[0-9A-Za-z_-]+/g, // Stripe keys
          /xapp-[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/g // Other patterns
        ];
        
        for (const pattern of suspiciousPatterns) {
          const matches = content.match(pattern);
          if (matches && !fullPath.includes('.example')) {
            this.errors.push(`🚨 Potential hardcoded API key found in ${file.name}`);
          }
        }
      }
    }
  }

  generateRecommendations() {
    console.log('\n💡 Recommendations:\n');
    
    const recommendations = [
      '1. Use .env.local for local development with real API keys',
      '2. Never commit .env.local or .env with real keys to version control',
      '3. Use Docker secrets for production deployments',
      '4. Rotate API keys regularly',
      '5. Monitor API usage and set up alerts for unusual activity',
      '6. Use different API keys for development and production',
      '7. Enable API key restrictions in Google Cloud Console',
      '8. Set up proper CORS policies for production domains'
    ];
    
    recommendations.forEach(rec => console.log(`  ${rec}`));
  }

  generateSetupInstructions() {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      return;
    }
    
    console.log('\n📋 Setup Instructions:\n');
    
    if (!fs.existsSync(path.join(rootDir, '.env.local'))) {
      console.log('To set up your environment:');
      console.log('1. Copy .env.local.example to .env.local:');
      console.log('   cp .env.local.example .env.local\n');
      console.log('2. Edit .env.local with your actual API keys:');
      
      const requiredKeys = Object.entries(this.requiredVars)
        .filter(([, config]) => config.required)
        .map(([key]) => key);
        
      requiredKeys.forEach(key => {
        console.log(`   - ${key}: Get from the appropriate service dashboard`);
      });
      
      console.log('\n3. For Docker development:');
      console.log('   docker-compose --profile fullstack up -d\n');
    }
  }

  run() {
    console.log('🚀 Load Calculator Environment Validator\n');
    console.log('This script checks your environment configuration for security and completeness.\n');
    
    const env = this.loadEnvironmentFiles();
    this.validateEnvironment(env);
    this.checkFileStructure();
    this.checkDocker();
    this.checkAPIKeySecurity();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! Your environment is properly configured.');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ ERRORS (${this.errors.length}):`);
        this.errors.forEach(error => console.log(`  ${error}`));
      }
      
      if (this.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
        this.warnings.forEach(warning => console.log(`  ${warning}`));
      }
    }
    
    this.generateSetupInstructions();
    this.generateRecommendations();
    
    console.log('\n' + '='.repeat(60));
    
    // Exit with error code if there are critical errors
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Run the validator
const validator = new EnvironmentValidator();
validator.run();