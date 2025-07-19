#!/usr/bin/env node

/**
 * Fork Validation Script
 * 
 * This script provides a comprehensive validation framework for forked repositories.
 * It runs all critical tests and checks to ensure the fork maintains core functionality
 * while validating new features.
 * 
 * Usage:
 * - npm run fork-validation
 * - node scripts/fork-validation.js
 * - node scripts/fork-validation.js --quick (runs only critical tests)
 * - node scripts/fork-validation.js --report (generates detailed report)
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

class ForkValidator {
  constructor(options = {}) {
    this.options = {
      quick: false,
      report: false,
      verbose: false,
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      summary: '',
      recommendations: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️ ',
      debug: '🔍'
    }[level];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description, options = {}) {
    const { critical = false, timeout = 300000 } = options;
    
    this.log(`Running: ${description}`, 'info');
    
    const testResult = {
      name: description,
      command,
      status: 'running',
      duration: 0,
      output: '',
      error: null,
      critical
    };

    const startTime = Date.now();

    try {
      const output = execSync(command, {
        encoding: 'utf8',
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      testResult.duration = Date.now() - startTime;
      testResult.status = 'passed';
      testResult.output = output;
      
      this.results.passed++;
      this.log(`✅ ${description} (${testResult.duration}ms)`, 'success');
      
    } catch (error) {
      testResult.duration = Date.now() - startTime;
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.output = error.stdout || '';
      
      this.results.failed++;
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      
      if (critical) {
        this.log('Critical test failed. Stopping validation.', 'error');
        throw new Error(`Critical validation failed: ${description}`);
      }
    }

    this.results.tests.push(testResult);
    return testResult;
  }

  async validateEnvironment() {
    this.log('🔍 Validating environment...', 'info');
    
    // Check Node.js version
    await this.runCommand('node --version', 'Node.js version check');
    
    // Check npm version
    await this.runCommand('npm --version', 'npm version check');
    
    // Verify package.json exists
    if (!existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    
    // Check for required dependencies
    await this.runCommand('npm ls --depth=0', 'Dependency check', { critical: false });
  }

  async runCodeQualityTests() {
    this.log('🧹 Running code quality tests...', 'info');
    
    // ESLint
    await this.runCommand('npm run lint', 'ESLint code quality check', { critical: true });
    
    // TypeScript compilation
    await this.runCommand('npm run typecheck', 'TypeScript type checking', { critical: true });
    
    // Security audit
    await this.runCommand('npm audit --audit-level moderate', 'Security vulnerability check', { critical: false });
  }

  async runUnitTests() {
    this.log('🧪 Running unit tests...', 'info');
    
    // Unit tests with coverage
    await this.runCommand('npm run test:coverage', 'Unit tests with coverage', { critical: true });
    
    // Validate coverage thresholds
    if (existsSync('coverage/coverage-summary.json')) {
      const coverage = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
      const statements = coverage.total.statements.pct;
      const branches = coverage.total.branches.pct;
      const functions = coverage.total.functions.pct;
      const lines = coverage.total.lines.pct;
      
      this.log(`Coverage: Statements ${statements}%, Branches ${branches}%, Functions ${functions}%, Lines ${lines}%`, 'info');
      
      if (statements < 70) {
        this.results.recommendations.push('Consider increasing statement coverage to at least 70%');
      }
      if (branches < 60) {
        this.results.recommendations.push('Consider increasing branch coverage to at least 60%');
      }
    }
  }

  async runIntegrationTests() {
    this.log('🔗 Running integration tests...', 'info');
    
    // Cross-module integration tests
    await this.runCommand('npm run test -- --run src/tests/integration/', 'Integration tests', { critical: true });
    
    // API endpoint tests
    await this.runCommand('npm run test -- --run src/tests/api/', 'API endpoint tests', { critical: false });
  }

  async runBuildTests() {
    this.log('🏗️  Running build tests...', 'info');
    
    // Production build
    await this.runCommand('npm run build', 'Production build', { critical: true });
    
    // Vercel compatibility test
    await this.runCommand('npm run vercel:test', 'Vercel build compatibility', { critical: true });
    
    // Bundle size check
    if (existsSync('dist')) {
      await this.runCommand('du -sh dist', 'Bundle size check');
    }
  }

  async runPerformanceTests() {
    if (this.options.quick) {
      this.log('⏩ Skipping performance tests (quick mode)', 'warning');
      this.results.skipped++;
      return;
    }
    
    this.log('⚡ Running performance tests...', 'info');
    
    // Performance benchmarks
    await this.runCommand('npm run test -- --run src/tests/performance/', 'Performance tests', { critical: false });
  }

  async runE2ETests() {
    if (this.options.quick) {
      this.log('⏩ Skipping E2E tests (quick mode)', 'warning');
      this.results.skipped++;
      return;
    }
    
    this.log('🎭 Running E2E tests...', 'info');
    
    try {
      // Build for E2E testing
      await this.runCommand('npm run build', 'Build for E2E tests');
      
      // Start preview server and run E2E tests
      await this.runCommand('timeout 300 bash -c "npm run preview & sleep 10 && npm run cypress:run"', 'E2E tests', { 
        critical: false,
        timeout: 300000 
      });
    } catch (error) {
      this.log('E2E tests failed, but continuing validation', 'warning');
    }
  }

  async validateAPIEndpoints() {
    this.log('🌐 Validating API endpoints...', 'info');
    
    const endpoints = [
      '/api/geocode',
      '/api/places',
      '/api/satellite',
      '/api/satellite-enhanced',
      '/api/usgs-imagery',
      '/api/esri-imagery',
      '/api/streetview',
      '/api/solar',
      '/api/test-zoom'
    ];
    
    for (const endpoint of endpoints) {
      const apiFile = `api${endpoint.replace('/api', '')}.js`;
      if (existsSync(apiFile)) {
        this.log(`✅ API endpoint file exists: ${apiFile}`, 'success');
      } else {
        this.log(`❌ Missing API endpoint file: ${apiFile}`, 'error');
        this.results.recommendations.push(`Create missing API endpoint: ${apiFile}`);
      }
    }
  }

  async validateFeatureFlags() {
    this.log('🏳️  Validating feature flags...', 'info');
    
    const featureFlagFiles = [
      'src/context/featureFlags.ts',
      'src/components/TabbedInterface/TabbedInterface.tsx'
    ];
    
    for (const file of featureFlagFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf8');
        if (content.includes('SLD_ENABLED') || content.includes('CRM_ENABLED')) {
          this.log(`✅ Feature flags found in ${file}`, 'success');
        }
      }
    }
  }

  async validateCoreFunctionality() {
    this.log('🔧 Validating core functionality...', 'info');
    
    const coreModules = [
      'src/services/necCalculations.ts',
      'src/services/wireCalculations.ts',
      'src/services/validationService.ts',
      'src/context/LoadDataContext.tsx',
      'src/context/ProjectSettingsContext.tsx',
      'src/components/LoadCalculator/LoadCalculatorMain.tsx'
    ];
    
    for (const module of coreModules) {
      if (existsSync(module)) {
        this.log(`✅ Core module exists: ${module}`, 'success');
      } else {
        this.log(`❌ Missing core module: ${module}`, 'error');
        this.results.recommendations.push(`Restore missing core module: ${module}`);
      }
    }
  }

  generateReport() {
    const totalTests = this.results.passed + this.results.failed + this.results.skipped;
    const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;
    
    this.results.summary = `
Fork Validation Report
=====================

📊 Summary:
- Total Tests: ${totalTests}
- Passed: ${this.results.passed} (${successRate}%)
- Failed: ${this.results.failed}
- Skipped: ${this.results.skipped}

🎯 Overall Status: ${this.results.failed === 0 ? '✅ PASS' : '❌ FAIL'}

📋 Test Results:
${this.results.tests.map(test => 
  `${test.status === 'passed' ? '✅' : '❌'} ${test.name} (${test.duration}ms)`
).join('\n')}

${this.results.recommendations.length > 0 ? `
💡 Recommendations:
${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

⏰ Generated: ${this.results.timestamp}
    `.trim();

    if (this.options.report) {
      const reportFile = 'fork-validation-report.json';
      writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
      this.log(`📄 Detailed report saved to ${reportFile}`, 'success');
      
      const summaryFile = 'fork-validation-summary.md';
      writeFileSync(summaryFile, this.results.summary);
      this.log(`📝 Summary report saved to ${summaryFile}`, 'success');
    }

    console.log('\n' + this.results.summary);
  }

  async validate() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Starting fork validation...', 'info');
      
      // Phase 1: Environment validation
      await this.validateEnvironment();
      
      // Phase 2: Code quality
      await this.runCodeQualityTests();
      
      // Phase 3: Core functionality validation
      await this.validateCoreFunctionality();
      await this.validateFeatureFlags();
      await this.validateAPIEndpoints();
      
      // Phase 4: Unit tests
      await this.runUnitTests();
      
      // Phase 5: Integration tests
      await this.runIntegrationTests();
      
      // Phase 6: Build tests
      await this.runBuildTests();
      
      // Phase 7: Performance tests (optional in quick mode)
      await this.runPerformanceTests();
      
      // Phase 8: E2E tests (optional in quick mode)
      await this.runE2ETests();
      
      const totalTime = Date.now() - startTime;
      this.log(`🏁 Validation completed in ${totalTime}ms`, 'success');
      
      // Generate and display report
      this.generateReport();
      
      // Exit with appropriate code
      if (this.results.failed > 0) {
        this.log('❌ Fork validation failed', 'error');
        process.exit(1);
      } else {
        this.log('✅ Fork validation passed', 'success');
        process.exit(0);
      }
      
    } catch (error) {
      this.log(`💥 Validation failed with error: ${error.message}`, 'error');
      this.generateReport();
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  quick: args.includes('--quick'),
  report: args.includes('--report'),
  verbose: args.includes('--verbose')
};

// Run validation
const validator = new ForkValidator(options);
validator.validate().catch(error => {
  console.error('❌ Validation script failed:', error.message);
  process.exit(1);
});