/**
 * Test Maximum Zoom Level API
 * Tests if a specific zoom level is available for Google Maps
 */

export default async function handler(req, res) {
  if (req.method !== 'HEAD' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, zoom } = req.query;

  if (!lat || !lng || !zoom) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const zoomLevel = parseInt(zoom);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(zoomLevel)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    // Test with a small image size for faster response
    const testUrl = `https://maps.googleapis.com/maps/api/staticmap?` + 
      new URLSearchParams({
        center: `${latitude},${longitude}`,
        zoom: zoomLevel.toString(),
        size: '100x100',
        maptype: 'satellite',
        format: 'png',
        key: API_KEY
      });

    const testResponse = await fetch(testUrl);
    
    if (testResponse.ok) {
      const contentType = testResponse.headers.get('content-type');
      
      if (contentType && contentType.startsWith('image/')) {
        // Additional check: get the image size to verify it's not an error image
        const imageBuffer = await testResponse.arrayBuffer();
        
        if (imageBuffer.byteLength > 1000) { // Reasonable minimum for a 100x100 image
          res.setHeader('X-Zoom-Available', 'true');
          res.setHeader('X-Image-Size', imageBuffer.byteLength.toString());
          return res.status(200).json({ 
            available: true, 
            zoom: zoomLevel,
            imageSize: imageBuffer.byteLength 
          });
        }
      }
    }

    // If we get here, the zoom level is not available
    res.setHeader('X-Zoom-Available', 'false');
    return res.status(404).json({ 
      available: false, 
      zoom: zoomLevel,
      reason: 'No imagery at this zoom level'
    });

  } catch (error) {
    console.error('Zoom test error:', error);
    return res.status(500).json({ 
      error: 'Failed to test zoom level',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}