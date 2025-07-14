# Setting Up Real Satellite Imagery

The aerial view feature currently uses mock data for development. To enable real satellite imagery, follow these steps:

## Option 1: Google Maps Static API (Recommended)

### Step 1: Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - **Maps Static API** (for satellite images)
   - **Geocoding API** (for address lookup)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### Step 2: Configure Environment Variables
Create a `.env` file in the project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
VITE_MAPBOX_API_KEY=your_mapbox_key_if_using_mapbox
VITE_USE_REAL_AERIAL_DATA=true
```

### Step 3: Update the Service
In `src/services/aerialViewService.ts`, replace the mock API keys:

```typescript
// Replace these lines:
private static readonly GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
private static readonly MAPBOX_API_KEY = 'YOUR_MAPBOX_API_KEY';

// With:
private static readonly GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
private static readonly MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY || 'YOUR_MAPBOX_API_KEY';
private static readonly USE_REAL_DATA = import.meta.env.VITE_USE_REAL_AERIAL_DATA === 'true';
```

### Step 4: Enable Production Mode
Update the `geocodeAddress` and `getSatelliteImage` methods to use real APIs when enabled.

## Option 2: Mapbox Static Images API

### Step 1: Get Mapbox API Key
1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for an account
3. Go to Account → Access Tokens
4. Copy your default public token or create a new one

### Step 2: Configure Environment
Same as Google Maps, but use `VITE_MAPBOX_API_KEY`

## Option 3: Free Alternative - OpenStreetMap

For a free alternative (lower quality), you can use:
- **Nominatim** for geocoding (OpenStreetMap)
- **OpenStreetMap tiles** for imagery

## Implementation Example

Here's how to modify the service for real data:

```typescript
static async geocodeAddress(address: string): Promise<GeocodeResult> {
  if (this.USE_REAL_DATA && this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    return await this.realGeocodeAddress(address);
  } else {
    return await this.mockGeocodeAddress(address);
  }
}

static async getSatelliteImage(
  latitude: number,
  longitude: number,
  options: Partial<SatelliteImageOptions> = {}
): Promise<string> {
  if (this.USE_REAL_DATA && this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    return this.getGoogleSatelliteImageUrl(latitude, longitude, finalOptions);
  } else {
    return await this.mockSatelliteImage(latitude, longitude, finalOptions);
  }
}
```

## Cost Considerations

### Google Maps Pricing (as of 2024)
- **Static Maps API**: $2 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests
- **Free tier**: $200 credit per month (covers ~40k satellite images)

### Mapbox Pricing
- **Static Images API**: $0.50 per 1,000 requests
- **Geocoding API**: $0.50 per 1,000 requests
- **Free tier**: 50,000 requests per month

## Security Notes

⚠️ **Important**: Never commit API keys to version control!

1. Always use environment variables
2. Add `.env` to `.gitignore`
3. For production deployment, set environment variables in your hosting service
4. Consider using server-side proxy to hide API keys from client

## Testing Real Implementation

1. Set up environment variables
2. Update the service code
3. Enter a real address in the Project Information section
4. Click "Generate Aerial View" in the SLD tab
5. You should see real satellite imagery instead of placeholder

## Troubleshooting

### Common Issues:
- **API key not working**: Check that APIs are enabled in Google Cloud Console
- **CORS errors**: Use server-side proxy for sensitive API keys
- **Image not loading**: Check browser network tab for error details
- **Wrong location**: Verify geocoding is working correctly

### Debug Mode:
Add console logging to see what's happening:

```typescript
console.log('Using real data:', this.USE_REAL_DATA);
console.log('API key configured:', this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
console.log('Generated URL:', imageUrl);
```