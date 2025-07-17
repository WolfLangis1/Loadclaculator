#!/usr/bin/env node
/**
 * Development Environment Setup Script
 * Automates the setup process for new developers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class DevSetup {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.steps = [];
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '⏳'
    };
    
    const icon = icons[type] || 'ℹ️';
    console.log(`${icon} ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'progress');
    
    // Check Node.js version
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.log(`Node.js ${nodeVersion} ✓`, 'success');
      } else {
        this.log(`Node.js ${nodeVersion} - version 18+ recommended`, 'warning');
      }
    } catch (error) {
      this.log('Could not determine Node.js version', 'warning');
    }
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`npm ${npmVersion} ✓`, 'success');
    } catch (error) {
      this.log('npm not found - please install Node.js', 'error');
    }
    
    // Check Docker (optional)
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      this.log(`${dockerVersion} ✓`, 'success');
      
      // Check if Docker is running
      try {
        execSync('docker info', { stdio: 'ignore' });
        this.log('Docker daemon is running ✓', 'success');
      } catch (error) {
        this.log('Docker daemon is not running', 'warning');
      }
    } catch (error) {
      this.log('Docker not found - optional for development', 'info');
    }
    
    // Check git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      this.log(`${gitVersion} ✓`, 'success');
    } catch (error) {
      this.log('Git not found - recommended for version control', 'warning');
    }
  }

  setupEnvironmentFiles() {
    this.log('Setting up environment files...', 'progress');
    
    const envLocalPath = path.join(rootDir, '.env.local');
    const envLocalExamplePath = path.join(rootDir, '.env.local.example');
    
    // Create .env.local if it doesn't exist
    if (!fs.existsSync(envLocalPath)) {
      if (fs.existsSync(envLocalExamplePath)) {
        fs.copyFileSync(envLocalExamplePath, envLocalPath);
        this.log('Created .env.local from template', 'success');
        this.log('⚠️  Please edit .env.local with your actual API keys', 'warning');
      } else {
        this.log('.env.local.example not found', 'error');
      }
    } else {
      this.log('.env.local already exists', 'info');
    }
    
    // Check .gitignore
    const gitignorePath = path.join(rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const requiredEntries = ['.env.local', '.env', 'node_modules'];
      
      for (const entry of requiredEntries) {
        if (!gitignoreContent.includes(entry)) {
          this.log(`Adding ${entry} to .gitignore`, 'info');
          fs.appendFileSync(gitignorePath, `\n${entry}\n`);
        }
      }
      
      this.log('.gitignore entries verified ✓', 'success');
    }
  }

  installDependencies() {
    this.log('Installing dependencies...', 'progress');
    
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.log('package.json not found', 'error');
      return;
    }
    
    try {
      // Check if node_modules exists
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        this.log('Dependencies already installed', 'info');
        
        // Check if package-lock.json is newer
        const packageLockPath = path.join(rootDir, 'package-lock.json');
        if (fs.existsSync(packageLockPath)) {
          const packageStats = fs.statSync(packageJsonPath);
          const lockStats = fs.statSync(packageLockPath);
          const nodeModulesStats = fs.statSync(nodeModulesPath);
          
          if (packageStats.mtime > nodeModulesStats.mtime || lockStats.mtime > nodeModulesStats.mtime) {
            this.log('Package files updated, running npm ci...', 'progress');
            execSync('npm ci', { cwd: rootDir, stdio: 'inherit' });
          }
        }
      } else {
        this.log('Running npm install...', 'progress');
        execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
      }
      
      this.log('Dependencies installed ✓', 'success');
    } catch (error) {
      this.log(`Failed to install dependencies: ${error.message}`, 'error');
    }
  }

  createDevScripts() {
    this.log('Setting up development scripts...', 'progress');
    
    const scriptsDir = path.join(rootDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir);
    }
    
    // Create Docker development script
    const dockerDevScript = `#!/bin/bash
# Docker Development Environment Script

echo "🐳 Starting Load Calculator Development Environment"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please run 'npm run setup' first."
    exit 1
fi

# Load environment variables
source .env.local

# Check required variables
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo "❌ GOOGLE_MAPS_API_KEY not set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"

# Start fullstack development environment
echo "🚀 Starting containers..."
docker-compose --profile fullstack up -d

# Show status
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://localhost:3003"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/api/health"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
`;

    const dockerScriptPath = path.join(scriptsDir, 'start-dev.sh');
    fs.writeFileSync(dockerScriptPath, dockerDevScript);
    fs.chmodSync(dockerScriptPath, '755');
    this.log('Created Docker development script', 'success');
    
    // Create package.json scripts section update
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const newScripts = {
      'setup': 'node scripts/setup-dev.js',
      'validate-env': 'node scripts/validate-env.js',
      'dev:docker': 'scripts/start-dev.sh',
      'docker:logs': 'docker-compose logs -f',
      'docker:stop': 'docker-compose down',
      'docker:rebuild': 'docker-compose down && docker-compose --profile fullstack up -d --build'
    };
    
    let scriptsUpdated = false;
    for (const [scriptName, scriptCommand] of Object.entries(newScripts)) {
      if (!packageJson.scripts[scriptName]) {
        packageJson.scripts[scriptName] = scriptCommand;
        scriptsUpdated = true;
      }
    }
    
    if (scriptsUpdated) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      this.log('Updated package.json scripts', 'success');
    }
  }

  setupAPIGuides() {
    this.log('Creating API setup guides...', 'progress');
    
    const guidesDir = path.join(rootDir, 'docs');
    if (!fs.existsSync(guidesDir)) {
      fs.mkdirSync(guidesDir);
    }
    
    const apiSetupGuide = `# API Setup Guide

## Required API Keys

### 1. Google Maps Platform
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (New)
   - Solar API
   - Maps Static API
4. Create credentials > API Key
5. Set restrictions:
   - HTTP referrers: your domain(s)
   - API restrictions: select the APIs above

### 2. Supabase
1. Go to [Supabase](https://app.supabase.com/)
2. Create a new project
3. Go to Settings > API
4. Copy your URL and anon key
5. Optional: Set up Google OAuth in Authentication > Providers

### 3. OpenWeather (Optional)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free account
3. Get your API key from dashboard

## Environment Setup

1. Copy your API keys to .env.local:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

2. Edit .env.local with your actual keys:
\`\`\`bash
# Replace placeholder values with your actual keys
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
\`\`\`

3. Validate your configuration:
\`\`\`bash
npm run validate-env
\`\`\`

## Development Commands

\`\`\`bash
# Start development server
npm run dev

# Start with Docker (includes backend)
npm run dev:docker

# Validate environment
npm run validate-env

# View Docker logs
npm run docker:logs

# Stop Docker containers
npm run docker:stop
\`\`\`
`;

    const guidePath = path.join(guidesDir, 'API_SETUP.md');
    fs.writeFileSync(guidePath, apiSetupGuide);
    this.log('Created API setup guide', 'success');
  }

  runValidation() {
    this.log('Running environment validation...', 'progress');
    
    try {
      execSync('node scripts/validate-env.js', { cwd: rootDir, stdio: 'inherit' });
    } catch (error) {
      this.log('Environment validation found issues - please check above', 'warning');
    }
  }

  showNextSteps() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SETUP COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n📋 Next Steps:\n');
    
    const nextSteps = [
      '1. Edit .env.local with your actual API keys (see docs/API_SETUP.md)',
      '2. Run "npm run validate-env" to check your configuration',
      '3. Start development with "npm run dev" or "npm run dev:docker"',
      '4. Visit http://localhost:3000 (or 3003 for Docker)',
      '5. Check the health endpoint at /api/health'
    ];
    
    nextSteps.forEach(step => console.log(`  ${step}`));
    
    console.log('\n💡 Helpful Commands:\n');
    console.log('  npm run validate-env  - Check environment configuration');
    console.log('  npm run dev          - Start development server');
    console.log('  npm run dev:docker   - Start with Docker backend');
    console.log('  npm run docker:logs  - View Docker container logs');
    console.log('  npm run docker:stop  - Stop Docker containers');
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings to address:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors to fix:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    console.log('\n📚 Documentation:');
    console.log('  • docs/API_SETUP.md - Detailed API configuration guide');
    console.log('  • README.md - Project overview and features');
    console.log('  • CLAUDE.md - Development guidelines and architecture');
    
    console.log('\n' + '='.repeat(60));
  }

  async run() {
    console.log('🚀 Load Calculator Development Setup\n');
    console.log('This script will set up your development environment.\n');
    
    try {
      await this.checkPrerequisites();
      this.setupEnvironmentFiles();
      this.installDependencies();
      this.createDevScripts();
      this.setupAPIGuides();
      this.runValidation();
      this.showNextSteps();
      
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
    
    // Exit with warning code if there are issues
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Run the setup
const setup = new DevSetup();
setup.run();