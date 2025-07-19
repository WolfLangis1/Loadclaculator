# API Configuration Test Suite

This comprehensive test suite ensures that all API endpoints remain stable and properly configured. It's designed to catch configuration drift and prevent production issues.

## 🚀 Quick Start

```bash
# Run all API tests
npm run test:api

# Run tests with CI output (includes reports)
npm run test:api:ci
```

## 📋 What Gets Tested

### Google Maps API Endpoints
- **Geocoding API** (`/api/geocode`) - Address to coordinates conversion
- **Places API** (`/api/places`) - Address autocomplete
- **Static Maps API** (`/api/satellite`) - Standard satellite imagery
- **Enhanced Satellite** (`/api/satellite-enhanced`) - High-resolution imagery

### Additional Imagery Providers
- **USGS National Map** (`/api/usgs-imagery`) - 6-inch resolution US imagery
- **Esri World Imagery** (`/api/esri-imagery`) - Global high-resolution satellite
- **Zoom Level Detection** (`/api/test-zoom`) - Maximum zoom capabilities

### Additional Services
- **Solar API** (`/api/solar`) - Google Solar API integration
- **Health Check** (`/api/health`) - Service health monitoring

### Security & Configuration
- **CORS Headers** - Cross-origin request handling
- **HTTP Methods** - Proper OPTIONS handling
- **Environment Variables** - API key configuration
- **Error Handling** - Proper error responses
- **Input Validation** - Parameter validation

## 🧪 Test Types

### 1. Functional Tests
- Valid requests return expected data
- Invalid requests are properly rejected
- API response formats are correct
- Status codes are appropriate

### 2. Security Tests
- CORS headers are properly configured
- API keys are not exposed in responses
- Input validation prevents malicious requests
- Error messages don't leak sensitive information

### 3. Configuration Tests
- Environment variables are properly set
- API endpoints are accessible
- Service dependencies are available
- Build configuration is correct

## 📊 Test Output

### Console Output
```
🚀 Starting Comprehensive API Test Suite
Base URL: http://localhost:3000
Environment: development

📋 ENVIRONMENT TESTS
✅ PASS: Environment Configuration - API key configured (AIzaSyBxyz...)

🗺️  GOOGLE MAPS API TESTS
✅ PASS: Geocoding - Valid Address - Geocoding successful. Found 1 results
✅ PASS: Geocoding - Invalid Address - Invalid address properly rejected
✅ PASS: Places Autocomplete - Valid Input - Places autocomplete successful. Found 5 predictions

📊 TEST SUMMARY
Total Tests: 12
Passed: 12
Failed: 0
Success Rate: 100.0%
```

### Report Files (CI Mode)
- `test-reports/api-tests.xml` - JUnit format for CI systems
- `test-reports/api-test-report.md` - Human-readable Markdown report
- `test-reports/api-tests.json` - Structured JSON data

## 🔧 Configuration

### Environment Variables Required
```bash
# Required
GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Optional
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### For Production Testing
Update the `BASE_URL` in `test-api-comprehensive.js`:
```javascript
const BASE_URL = 'https://your-vercel-app.vercel.app';
```

## 🤖 Automated Testing

### GitHub Actions Integration
The test suite automatically runs on:
- **Push to main/develop** - On API-related file changes
- **Pull Requests** - Before merging changes
- **Daily Schedule** - 6 AM UTC to catch external API issues
- **Manual Trigger** - On-demand testing

### CI Features
- Multi-node testing (Node 18, 20)
- JUnit XML output for test reporting
- PR comments with test results
- Slack/Discord notifications
- Test artifact uploads

### Setup CI
1. Add `GOOGLE_MAPS_API_KEY` to GitHub Secrets
2. Optionally add `SLACK_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL`
3. The workflow file is already in `.github/workflows/api-tests.yml`

## 🛠️ Development Workflow

### Before Making Changes
```bash
# Test current configuration
npm run test:api
```

### After Making Changes
```bash
# Test your changes
npm run test:api

# If tests pass, commit and push
git add .
git commit -m "Update API configuration"
git push
```

### Testing in Different Environments

#### Local Development
```bash
npm run dev
npm run test:api
```

#### Production-like Testing
```bash
npm run build
npm run preview
# Update BASE_URL to http://localhost:4173
npm run test:api
```

#### Vercel Testing
```bash
vercel dev
# Update BASE_URL to http://localhost:3000
npm run test:api
```

## 🔍 Troubleshooting

### Common Issues

#### API Key Not Configured
```
❌ FAIL: Environment Configuration - Google Maps API key not configured
```
**Solution**: Set `GOOGLE_MAPS_API_KEY` in your `.env` file

#### Network Connectivity
```
❌ FAIL: Geocoding - Valid Address - fetch failed
```
**Solution**: Check internet connection and API endpoint accessibility

#### API Quota Exceeded
```
❌ FAIL: Places Autocomplete - API returned status: OVER_QUERY_LIMIT
```
**Solution**: Check Google Cloud Console for quota usage and billing

#### CORS Issues
```
❌ FAIL: CORS Headers - CORS headers missing or incorrect
```
**Solution**: Verify API endpoints include proper CORS headers

### Debug Mode
Add debug logging by setting environment variable:
```bash
DEBUG=1 npm run test:api
```

## 📈 Monitoring & Maintenance

### Regular Tasks
1. **Weekly**: Review test results and success rates
2. **Monthly**: Check API usage and quotas in Google Cloud Console
3. **Quarterly**: Update test data and add new test cases
4. **Annually**: Review and update API provider configurations

### Performance Monitoring
- Track test execution time trends
- Monitor API response times
- Set up alerts for test failures
- Review error patterns and frequencies

### Adding New Tests
1. Add test method to `ApiTester` class in `test-api-comprehensive.js`
2. Call the test in `runAllTests()` method
3. Update this documentation
4. Test locally before committing

## 🎯 Success Criteria

Your API configuration is considered stable when:
- ✅ All tests pass (100% success rate)
- ✅ Response times are under 2 seconds
- ✅ No authentication or authorization errors
- ✅ All required endpoints are accessible
- ✅ Error handling is working correctly

## 🔗 Related Documentation

- [Google Maps API Documentation](https://developers.google.com/maps)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [API Endpoint Documentation](./CLAUDE.md#google-api-integration--high-resolution-satellite-providers)
- [Environment Setup Guide](./CLAUDE.md#required-environment-variables)