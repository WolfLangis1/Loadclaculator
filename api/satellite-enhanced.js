/**
 * Enhanced Google Maps Satellite API with maximum zoom detection
 * Vercel Serverless Function
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, zoom, width = 800, height = 600, format = 'png', maptype = 'satellite' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const zoomLevel = parseInt(zoom) || 18;

  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    // Try the requested zoom level first
    let currentZoom = Math.min(zoomLevel, 25); // Cap at theoretical maximum
    let imageResponse;
    let attempts = 0;
    const maxAttempts = 5;

    // Try progressively lower zoom levels until we get a valid image
    while (attempts < maxAttempts && currentZoom >= 18) {
      const googleMapsUrl = `https://maps.googleapis.com/maps/api/staticmap?` + 
        new URLSearchParams({
          center: `${latitude},${longitude}`,
          zoom: currentZoom.toString(),
          size: `${width}x${height}`,
          maptype: maptype,
          format: format,
          key: API_KEY,
          scale: '2' // Request high-DPI image
        });

      console.log(`Attempting zoom ${currentZoom} for coordinates ${latitude}, ${longitude}`);
      
      imageResponse = await fetch(googleMapsUrl);
      
      if (imageResponse.ok) {
        const contentType = imageResponse.headers.get('content-type');
        
        // Check if we got an actual image (not an error image)
        if (contentType && contentType.startsWith('image/')) {
          const imageBuffer = await imageResponse.arrayBuffer();
          
          // Basic check: Google returns very small images for invalid requests
          if (imageBuffer.byteLength > 10000) { // Reasonable minimum size
            console.log(`✅ Successfully got zoom ${currentZoom} image (${imageBuffer.byteLength} bytes)`);
            
            // Set cache headers for successful high-res images
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            res.setHeader('Content-Type', contentType);
            res.setHeader('X-Actual-Zoom', currentZoom.toString());
            res.setHeader('X-Resolution', calculateResolution(currentZoom, latitude).toString());
            
            return res.send(Buffer.from(imageBuffer));
          }
        }
      }
      
      // Try next lower zoom level
      currentZoom--;
      attempts++;
    }

    // If we get here, all attempts failed
    return res.status(404).json({ 
      error: 'No high-resolution imagery available for this location',
      maxTestedZoom: zoomLevel,
      minTestedZoom: Math.max(18, zoomLevel - maxAttempts)
    });

  } catch (error) {
    console.error('Enhanced satellite API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch enhanced satellite imagery',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Calculate resolution in meters per pixel
 */
function calculateResolution(zoom, latitude) {
  const earthCircumference = 40075017; // meters
  return earthCircumference * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom + 8);
}