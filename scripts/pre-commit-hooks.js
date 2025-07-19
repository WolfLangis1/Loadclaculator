#!/usr/bin/env node

/**
 * Pre-commit Hooks
 * 
 * This script runs before each commit to ensure code quality and prevent
 * broken commits from entering the repository.
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

class PreCommitValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️ '
    }[level];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  runCommand(command, description) {
    this.log(`Running: ${description}`, 'info');
    
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.log(`✅ ${description}`, 'success');
      return { success: true, output };
      
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      this.errors.push({
        command,
        description,
        error: error.message,
        output: error.stdout || error.stderr
      });
      return { success: false, error: error.message };
    }
  }

  getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      return [];
    }
  }

  validateStagedFiles() {
    const stagedFiles = this.getStagedFiles();
    
    if (stagedFiles.length === 0) {
      this.warnings.push('No staged files found');
      return true;
    }

    this.log(`Validating ${stagedFiles.length} staged files`, 'info');

    // Check for TypeScript/JavaScript files
    const jsFiles = stagedFiles.filter(file => 
      file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')
    );

    if (jsFiles.length > 0) {
      // Run ESLint on staged JS/TS files
      const eslintResult = this.runCommand(
        `npx eslint ${jsFiles.join(' ')}`,
        'ESLint on staged files'
      );

      if (!eslintResult.success) {
        this.errors.push({
          type: 'lint',
          message: 'ESLint errors found in staged files',
          files: jsFiles
        });
      }

      // Run TypeScript check on staged TS files
      const tsFiles = jsFiles.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
      if (tsFiles.length > 0) {
        const tscResult = this.runCommand(
          'npx tsc --noEmit',
          'TypeScript compilation check'
        );

        if (!tscResult.success) {
          this.errors.push({
            type: 'typescript',
            message: 'TypeScript compilation errors found',
            files: tsFiles
          });
        }
      }
    }

    return this.errors.length === 0;
  }

  validateCommitMessage() {
    try {
      // Read commit message from git
      const commitMsg = execSync('git log --format=%B -n 1 HEAD', { encoding: 'utf8' }).trim();
      
      if (!commitMsg) {
        // This is for pre-commit, so we can't check the actual commit message yet
        return true;
      }

      // Basic commit message validation
      const lines = commitMsg.split('\n');
      const title = lines[0];

      if (title.length < 10) {
        this.warnings.push('Commit message title is very short (< 10 characters)');
      }

      if (title.length > 72) {
        this.warnings.push('Commit message title is too long (> 72 characters)');
      }

      // Check for conventional commit format
      const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .+/;
      if (!conventionalPattern.test(title)) {
        this.warnings.push('Consider using conventional commit format (feat/fix/docs/etc.)');
      }

      return true;

    } catch (error) {
      // Commit message validation is not critical for pre-commit
      return true;
    }
  }

  validateCriticalFiles() {
    const stagedFiles = this.getStagedFiles();
    
    // Check if critical configuration files are being modified
    const criticalFiles = [
      'package.json',
      'package-lock.json',
      'vite.config.ts',
      'vitest.config.ts',
      'tsconfig.json',
      'vercel.json',
      '.env',
      '.env.example'
    ];

    const modifiedCriticalFiles = stagedFiles.filter(file => 
      criticalFiles.some(critical => file.endsWith(critical))
    );

    if (modifiedCriticalFiles.length > 0) {
      this.log(`Critical files modified: ${modifiedCriticalFiles.join(', ')}`, 'warning');
      
      // If package.json is modified, validate it
      if (modifiedCriticalFiles.includes('package.json')) {
        try {
          const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
          
          // Basic validation
          if (!packageJson.name || !packageJson.version) {
            this.errors.push({
              type: 'package-json',
              message: 'package.json missing required fields (name, version)'
            });
          }

          // Check for required scripts
          const requiredScripts = ['dev', 'build', 'test', 'lint', 'typecheck'];
          const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
          
          if (missingScripts.length > 0) {
            this.warnings.push(`Missing recommended scripts: ${missingScripts.join(', ')}`);
          }

        } catch (error) {
          this.errors.push({
            type: 'package-json',
            message: 'Invalid JSON in package.json'
          });
        }
      }
    }

    return this.errors.length === 0;
  }

  validateTestFiles() {
    const stagedFiles = this.getStagedFiles();
    
    // Check if test files are being committed
    const testFiles = stagedFiles.filter(file => 
      file.includes('.test.') || file.includes('.spec.') || file.includes('cypress/e2e/')
    );

    if (testFiles.length > 0) {
      this.log(`Test files modified: ${testFiles.length}`, 'info');
      
      // Run tests for modified test files
      const testResult = this.runCommand(
        'npm run test -- --run --reporter=verbose',
        'Running modified tests'
      );

      if (!testResult.success) {
        this.errors.push({
          type: 'tests',
          message: 'Test failures detected',
          files: testFiles
        });
      }
    }

    return this.errors.length === 0;
  }

  validateSecrets() {
    const stagedFiles = this.getStagedFiles();
    
    // Patterns that might indicate secrets
    const secretPatterns = [
      /sk_[a-zA-Z0-9]{24,}/g,           // Stripe secret keys
      /pk_[a-zA-Z0-9]{24,}/g,           // Stripe public keys
      /AIza[0-9A-Za-z\\-_]{35}/g,       // Google API keys
      /AKIA[0-9A-Z]{16}/g,              // AWS access keys
      /[0-9a-f]{32}/g,                  // Generic 32-char hex strings
      /password\s*=\s*['"][^'"]+['"]/gi, // Password assignments
      /api_key\s*=\s*['"][^'"]+['"]/gi   // API key assignments
    ];

    for (const file of stagedFiles) {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
        try {
          const content = readFileSync(file, 'utf8');
          
          for (const pattern of secretPatterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
              this.errors.push({
                type: 'security',
                message: `Potential secret detected in ${file}`,
                matches: matches.slice(0, 3) // Show first 3 matches
              });
            }
          }
        } catch (error) {
          // File might be binary or inaccessible, skip
        }
      }
    }

    return this.errors.length === 0;
  }

  generateSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      passed: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      totalChecks: 6 // Number of validation methods
    };

    console.log('\n📊 Pre-commit Validation Summary:');
    console.log(`Status: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message || error.description}`);
        if (error.files) {
          console.log(`   Files: ${error.files.join(', ')}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    return summary;
  }

  async validate() {
    this.log('🚀 Running pre-commit validation...', 'info');

    const validations = [
      () => this.validateStagedFiles(),
      () => this.validateCriticalFiles(),
      () => this.validateTestFiles(),
      () => this.validateCommitMessage(),
      () => this.validateSecrets()
    ];

    let allPassed = true;

    for (const validation of validations) {
      try {
        const result = validation();
        if (!result) {
          allPassed = false;
        }
      } catch (error) {
        this.log(`Validation error: ${error.message}`, 'error');
        allPassed = false;
      }
    }

    const summary = this.generateSummary();

    if (!allPassed) {
      console.log('\n❌ Pre-commit validation failed. Please fix the errors above.');
      console.log('\nTo bypass this check (not recommended):');
      console.log('git commit --no-verify');
      process.exit(1);
    } else {
      console.log('\n✅ Pre-commit validation passed. Proceeding with commit.');
      process.exit(0);
    }
  }
}

// Run pre-commit validation
const validator = new PreCommitValidator();
validator.validate().catch(error => {
  console.error('❌ Pre-commit validation script failed:', error.message);
  process.exit(1);
});