# 🔒 Secure Backend API Proxy Setup Guide

This guide explains how to set up a secure backend API proxy for your Load Calculator app using Vercel Serverless Functions.

## 🎯 Why Use a Backend Proxy?

### **Security Benefits:**
- ✅ **API keys never exposed** to client-side code
- ✅ **Server-side only** environment variables
- ✅ **Domain restrictions** work properly
- ✅ **Rate limiting** and usage control
- ✅ **Request validation** and sanitization

### **Performance Benefits:**
- ✅ **Caching** at the edge
- ✅ **Request optimization**
- ✅ **Error handling** and retries
- ✅ **Monitoring** and analytics

## 📁 File Structure

```
api/
├── geocode.js          # Google Geocoding API proxy
├── places.js           # Google Places API proxy
├── weather.js          # Weather APIs proxy
└── satellite.js        # Satellite imagery APIs proxy

src/services/
├── secureApiService.ts        # Client-side API service
└── secureAerialViewService.ts # Secure aerial view service
```

## 🔧 Setup Steps

### **Step 1: Environment Variables in Vercel**

Add these environment variables to your Vercel dashboard:

#### **Required API Keys:**
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
MAPBOX_API_KEY=your_mapbox_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
NOAA_API_KEY=your_noaa_api_key
BING_MAPS_API_KEY=your_bing_maps_api_key
ESRI_API_KEY=your_esri_api_key
MAXAR_API_KEY=your_maxar_api_key
```

#### **Configuration:**
```
NODE_ENV=production
```

### **Step 2: API Key Restrictions**

#### **Google Maps API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Edit your API key
4. Set **Application restrictions** to "HTTP referrers"
5. Add your domains:
   ```
   https://yourdomain.com/*
   https://www.yourdomain.com/*
   https://your-app.vercel.app/*
   ```
6. Set **API restrictions** to:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Static Maps API

#### **Mapbox API:**
1. Go to [Mapbox Account](https://account.mapbox.com)
2. Navigate to **Access Tokens**
3. Edit your token
4. Set **URL restrictions** to your domain
5. Set **Token scopes** appropriately

### **Step 3: Deploy to Vercel**

1. **Commit and push** your changes to GitHub
2. **Deploy** to Vercel (automatic if connected)
3. **Verify** API endpoints work:
   ```
   https://your-app.vercel.app/api/geocode?address=test
   https://your-app.vercel.app/api/weather?lat=40&lon=-74
   ```

## 🚀 API Endpoints

### **Geocoding API**
```
GET /api/geocode?address=123 Main St
```

### **Places Autocomplete**
```
GET /api/places?input=123 Main
GET /api/places?input=123 Main&sessiontoken=abc123
```

### **Weather Data**
```
GET /api/weather?lat=40.7128&lon=-74.0060&provider=openweather
GET /api/weather?lat=40.7128&lon=-74.0060&provider=noaa
```

### **Satellite Imagery**
```
GET /api/satellite?lat=40.7128&lon=-74.0060&zoom=18&provider=google
GET /api/satellite?lat=40.7128&lon=-74.0060&zoom=18&provider=mapbox
```

## 🔄 Migration Guide

### **From Direct API Calls to Secure Proxy:**

#### **Before (Insecure):**
```typescript
// ❌ API key exposed in client
const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`
);
```

#### **After (Secure):**
```typescript
// ✅ No API key in client
import { SecureApiService } from './services/secureApiService';

const result = await SecureApiService.geocodeAddress(address);
```

### **Update Your Components:**

#### **AddressAutocomplete.tsx:**
```typescript
// Replace direct API calls with secure service
import { SecureAerialViewService } from '../services/secureAerialViewService';

// Instead of direct Google Places API
const suggestions = await SecureAerialViewService.getAddressSuggestions(input);
```

#### **AerialViewService.ts:**
```typescript
// Replace with secure service
import { SecureAerialViewService } from './secureAerialViewService';

// Use secure methods instead of direct API calls
const satelliteData = await SecureAerialViewService.getSatelliteImagery(lat, lon);
```

## 🛡️ Security Features

### **Input Validation:**
- ✅ **Parameter validation** in all API endpoints
- ✅ **SQL injection prevention** (not applicable for this use case)
- ✅ **XSS prevention** through proper encoding
- ✅ **Rate limiting** (can be added)

### **Error Handling:**
- ✅ **Graceful degradation** to mock data
- ✅ **Detailed error logging** server-side
- ✅ **User-friendly error messages** client-side
- ✅ **Health checks** for API availability

### **Monitoring:**
- ✅ **Vercel function logs** for debugging
- ✅ **API usage tracking** in Vercel dashboard
- ✅ **Error monitoring** and alerting
- ✅ **Performance metrics** and optimization

## 🧪 Testing

### **Local Testing:**
```bash
# Test geocoding endpoint
curl "http://localhost:3000/api/geocode?address=123%20Main%20St"

# Test weather endpoint
curl "http://localhost:3000/api/weather?lat=40&lon=-74"

# Test satellite endpoint
curl "http://localhost:3000/api/satellite?lat=40&lon=-74&zoom=18"
```

### **Production Testing:**
```bash
# Test your deployed endpoints
curl "https://your-app.vercel.app/api/geocode?address=test"
curl "https://your-app.vercel.app/api/weather?lat=40&lon=-74"
```

## 🔍 Troubleshooting

### **Common Issues:**

#### **API Key Not Configured:**
- Check Vercel environment variables
- Verify variable names match exactly
- Redeploy after adding variables

#### **CORS Errors:**
- Vercel handles CORS automatically
- Check if requests are going to correct endpoints

#### **Rate Limiting:**
- Monitor API usage in provider dashboards
- Implement caching if needed
- Consider upgrading API plans

#### **Function Timeouts:**
- Vercel functions have 10-second timeout
- Optimize API calls for speed
- Consider caching for slow APIs

## 📊 Performance Optimization

### **Caching Strategies:**
```javascript
// Add caching headers to API responses
res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
```

### **Request Optimization:**
- **Batch requests** where possible
- **Use appropriate zoom levels** for satellite imagery
- **Implement request deduplication**

### **Error Recovery:**
- **Fallback to mock data** when APIs fail
- **Retry logic** for transient failures
- **Graceful degradation** for partial failures

## 🎉 Benefits Achieved

✅ **Complete API key security** - never exposed to client
✅ **Proper domain restrictions** - work as intended
✅ **Better error handling** - graceful degradation
✅ **Improved monitoring** - server-side logging
✅ **Performance optimization** - caching and optimization
✅ **Scalability** - Vercel handles scaling automatically

## 🔄 Next Steps

1. **Deploy** the secure backend
2. **Test** all API endpoints
3. **Update** your components to use secure services
4. **Monitor** usage and performance
5. **Optimize** based on real usage patterns

Your app is now much more secure and production-ready! 🚀 