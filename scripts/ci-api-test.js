#!/usr/bin/env node

/**
 * CI/CD API Test Runner
 * Automated testing for continuous integration pipelines
 * 
 * Features:
 * - JUnit XML output for CI systems
 * - GitHub Actions integration
 * - Slack/Discord webhook notifications
 * - Detailed logging and metrics
 */

import ApiTester from '../test-api-comprehensive.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CIApiTester extends ApiTester {
  constructor() {
    super();
    this.startTime = Date.now();
    this.ciEnvironment = this.detectCIEnvironment();
  }

  detectCIEnvironment() {
    if (process.env.GITHUB_ACTIONS) return 'github-actions';
    if (process.env.VERCEL) return 'vercel';
    if (process.env.CI) return 'generic-ci';
    return 'local';
  }

  generateJUnitXML() {
    const duration = (Date.now() - this.startTime) / 1000;
    const timestamp = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="API Tests" tests="${this.results.total}" failures="${this.results.failed}" time="${duration}">
  <testsuite name="LoadCalculator.APITests" tests="${this.results.total}" failures="${this.results.failed}" time="${duration}" timestamp="${timestamp}">
`;

    this.results.tests.forEach(test => {
      const testTime = 1; // Approximate time per test
      xml += `    <testcase classname="APITest" name="${test.name}" time="${testTime}">
`;
      
      if (!test.success) {
        xml += `      <failure message="${this.escapeXML(test.message)}">
${this.escapeXML(test.details || '')}
      </failure>
`;
      }
      
      xml += `    </testcase>
`;
    });

    xml += `  </testsuite>
</testsuites>`;

    return xml;
  }

  escapeXML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async sendWebhookNotification(webhookUrl, results) {
    if (!webhookUrl) return;

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    const status = results.failed === 0 ? 'success' : 'failure';
    const color = status === 'success' ? '#00ff00' : '#ff0000';

    const payload = {
      embeds: [{
        title: '🧪 API Test Results',
        color: parseInt(color.slice(1), 16),
        fields: [
          { name: 'Total Tests', value: results.total.toString(), inline: true },
          { name: 'Passed', value: results.passed.toString(), inline: true },
          { name: 'Failed', value: results.failed.toString(), inline: true },
          { name: 'Success Rate', value: `${successRate}%`, inline: true },
          { name: 'Environment', value: this.ciEnvironment, inline: true },
          { name: 'Duration', value: `${((Date.now() - this.startTime) / 1000).toFixed(1)}s`, inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`Webhook notification failed: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Webhook notification error: ${error.message}`);
    }
  }

  generateMarkdownReport() {
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const status = this.results.failed === 0 ? '✅ PASSED' : '❌ FAILED';

    let markdown = `# API Test Report

## Summary
- **Status**: ${status}
- **Total Tests**: ${this.results.total}
- **Passed**: ${this.results.passed}
- **Failed**: ${this.results.failed}
- **Success Rate**: ${successRate}%
- **Duration**: ${duration}s
- **Environment**: ${this.ciEnvironment}
- **Timestamp**: ${new Date().toISOString()}

## Test Results

| Test Name | Status | Message |
|-----------|---------|---------|
`;

    this.results.tests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const message = test.message.replace(/\|/g, '\\|');
      markdown += `| ${test.name} | ${status} | ${message} |\n`;
    });

    if (this.results.failed > 0) {
      markdown += `\n## Failed Tests Details

`;
      this.results.tests
        .filter(test => !test.success)
        .forEach(test => {
          markdown += `### ❌ ${test.name}

**Error**: ${test.message}

`;
          if (test.details) {
            markdown += `**Details**:
\`\`\`
${test.details}
\`\`\`

`;
          }
        });
    }

    markdown += `\n## Recommendations

`;
    if (this.results.failed === 0) {
      markdown += `✅ All API tests passed! The configuration is stable and ready for production.

`;
    } else {
      markdown += `⚠️ ${this.results.failed} test(s) failed. Review the failed tests above and check:

1. Environment variable configuration
2. API key permissions and quotas
3. Network connectivity
4. Service availability

`;
    }

    markdown += `## Next Steps

- 🔄 Run this test suite after any configuration changes
- 🚀 Set up automated testing in CI/CD pipeline
- 📊 Monitor API usage and performance
- 🔧 Update test cases as new endpoints are added
`;

    return markdown;
  }

  async saveReports() {
    const reportsDir = join(__dirname, '..', 'test-reports');
    
    try {
      mkdirSync(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save JUnit XML
    const junitXML = this.generateJUnitXML();
    writeFileSync(join(reportsDir, 'api-tests.xml'), junitXML);

    // Save Markdown report
    const markdownReport = this.generateMarkdownReport();
    writeFileSync(join(reportsDir, 'api-test-report.md'), markdownReport);

    // Save JSON results for further processing
    const jsonReport = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1),
        duration: ((Date.now() - this.startTime) / 1000).toFixed(1),
        environment: this.ciEnvironment,
        timestamp: new Date().toISOString()
      },
      tests: this.results.tests
    };
    writeFileSync(join(reportsDir, 'api-tests.json'), JSON.stringify(jsonReport, null, 2));

    console.log(`\n📄 Reports saved to ${reportsDir}/`);
    console.log(`   • api-tests.xml (JUnit format)`);
    console.log(`   • api-test-report.md (Markdown)`);
    console.log(`   • api-tests.json (JSON data)`);
  }

  async runCITests() {
    console.log(`🚀 Running API tests in CI environment: ${this.ciEnvironment}`);
    
    // Set GitHub Actions output if available
    if (process.env.GITHUB_ACTIONS) {
      console.log('::group::API Test Execution');
    }

    await this.runAllTests();

    if (process.env.GITHUB_ACTIONS) {
      console.log('::endgroup::');
      
      // Set GitHub Actions outputs
      const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
      console.log(`::set-output name=total_tests::${this.results.total}`);
      console.log(`::set-output name=passed_tests::${this.results.passed}`);
      console.log(`::set-output name=failed_tests::${this.results.failed}`);
      console.log(`::set-output name=success_rate::${successRate}`);
    }

    // Save reports
    await this.saveReports();

    // Send webhook notification if configured
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl) {
      await this.sendWebhookNotification(webhookUrl, this.results);
    }

    return this.results.failed === 0;
  }
}

// Main execution for CI
async function runCITests() {
  const tester = new CIApiTester();
  
  try {
    const success = await tester.runCITests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`💥 CI test suite crashed: ${error.message}`);
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error::API test suite failed: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCITests();
}

export default CIApiTester;