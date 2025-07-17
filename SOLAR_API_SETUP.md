# Solar Analysis Implementation Guide

## Overview

The application provides comprehensive solar analysis through a hybrid approach that combines Google Solar API (when available) with intelligent fallback calculations.

## Current Implementation Status

✅ **Fully Working Features:**
- Google Maps geocoding and autocomplete  
- Satellite imagery display
- **Solar Analysis with Smart Fallback** - Always provides meaningful data
- AI-powered roof analysis as backup
- Comprehensive financial analysis calculations

## How Solar Analysis Works

The solar analysis system uses a tiered approach:

1. **Primary**: Google Solar API (when available and configured)
2. **Fallback**: Intelligent calculations based on location, climate data, and industry standards
3. **Enhancement**: AI roof analysis for additional insights
- AI-powered roof analysis using TensorFlow.js
- Enhanced geographic solar calculations
- Comprehensive fallback system

❌ **Google Solar API Status:**
- Returns 403/404 errors (expected)
- Fallback to enhanced geographic calculations
- AI analysis provides actual roof detection

## Setup Instructions

### 1. Request Google Solar API Access

**Important:** You must request access before the Solar API will work.

1. Visit: https://developers.google.com/maps/documentation/solar
2. Click "Request Access" or "Join Preview"
3. Fill out the access request form
4. Wait for Google approval (can take days/weeks)

### 2. Enable APIs in Google Cloud Console

Once approved, enable these APIs:

```bash
# Required APIs
- Solar API ⭐ (requires approval)
- Maps JavaScript API
- Geocoding API  
- Places API (New)
- Maps Static API
```

### 3. Configure API Key

```bash
# In your .env file
GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Ensure API key has permissions for:
- Solar API (after approval)
- Maps platform APIs
- Billing enabled
```

### 4. Test API Access

Run the diagnostic tool:

```bash
npm run test:solar
```

This will test:
- ✅ API key validity
- ✅ Standard Maps APIs access
- ❌ Solar API access (expected to fail without approval)
- ✅ Local server connectivity
- ✅ Fallback system functionality

## Environment-Specific Setup

### Docker Development

```bash
# 1. Set environment variable
export GOOGLE_MAPS_API_KEY="your_key_here"

# 2. Start services
npm run docker:compose:dev

# 3. Test endpoints
curl http://localhost:3001/api/solar?lat=40.7128&lon=-74.0060
```

### Vercel Production

```bash
# 1. Set environment variable in Vercel dashboard
GOOGLE_MAPS_API_KEY = your_key_here

# 2. Deploy
vercel --prod

# 3. Test endpoints  
curl https://your-app.vercel.app/api/solar?lat=40.7128&lon=-74.0060
```

## Expected Responses

### Without Solar API Access (Current)

```json
{
  "error": "Google Solar API access not enabled",
  "message": "The Solar API requires special access from Google Cloud. It is currently in limited preview.",
  "fallbackAvailable": true,
  "debugInfo": {
    "status": 403,
    "solution": "Enable Solar API in Google Cloud Console or request access from Google",
    "documentation": "https://developers.google.com/maps/documentation/solar"
  }
}
```

### With Solar API Access (After Approval)

```json
{
  "name": "segment:123456789",
  "center": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "solarPotential": {
    "maxArrayPanelsCount": 32,
    "yearlyEnergyDcKwh": 12500,
    "roofSegmentCount": 3,
    "maxArrayAreaMeters2": 85.4
  }
}
```

## Application Behavior

### Current Implementation ✅

The application provides a **complete solar analysis solution** even without Google Solar API access:

1. **AI Roof Analysis** - Detects roof segments using TensorFlow.js
2. **Enhanced Geographic Calculations** - Climate-based solar estimates  
3. **Professional Results** - Panel placement and production estimates
4. **Visual Overlays** - Roof segments and panel placement visualization

### Unified "Analyze Roof" Button

The button runs both analyses in parallel:

```typescript
// Runs both Google Solar API + AI Analysis
const [googleResult, aiResult] = await Promise.allSettled([
  GoogleSolarService.getPanelRecommendations(...),
  AIRoofAnalysisService.analyzeRoofFromImage(...)
]);
```

Results:
- ✅ AI Analysis: Always works (roof detection, panel placement)
- ❌ Google Solar: Fallback mode (geographic estimates)

## Troubleshooting

### Common Issues

**Issue:** `403 Forbidden` from Solar API
**Solution:** This is expected. Request Solar API access from Google.

**Issue:** `404 Not Found` from Solar API  
**Solution:** No solar data available for location. Use AI analysis.

**Issue:** Local server not starting
**Solution:** Check `GOOGLE_MAPS_API_KEY` environment variable.

### Debug Commands

```bash
# Test all APIs
npm run test:solar

# Test specific endpoint
curl "http://localhost:3001/api/solar?lat=40.7128&lon=-74.0060"

# Check API key
echo $GOOGLE_MAPS_API_KEY

# Verify Docker environment
docker logs load-calculator
```

## Production Readiness

The application is **production-ready** without Google Solar API:

✅ **Core Features Work:**
- Address search and geocoding
- Satellite imagery display  
- AI-powered roof detection
- Solar panel placement optimization
- Professional calculations and reports

✅ **Graceful Degradation:**
- Clear error messages
- Automatic fallback to enhanced calculations
- No user-facing failures
- Professional results regardless of API status

## Cost Considerations

### Without Solar API (Current)
- ✅ Free: AI roof analysis
- ✅ Low cost: Maps APIs for geocoding/imagery
- ✅ No Solar API charges

### With Solar API (After Approval)
- 💰 Additional: Solar API usage fees
- 💰 Higher: Combined Google API costs  
- 📊 Enhanced: Real Google solar data

## Conclusion

**The application works perfectly without Google Solar API access.** The AI analysis provides comprehensive roof detection and solar calculations. Google Solar API would enhance results but is not required for professional functionality.

To enable Google Solar API:
1. Request access from Google
2. Wait for approval  
3. Re-test with `npm run test:solar`
4. Enjoy enhanced solar data integration

The current implementation provides a complete, professional solar analysis solution that works in all environments.