/**
 * Esri World Imagery API
 * High-resolution satellite imagery alternative to Google Maps
 * Free tier with good global coverage
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, width = 800, height = 600, zoom = 19 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const zoomLevel = parseInt(zoom);

  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    // Calculate tile coordinates for the center point
    const tileCoords = latLngToTile(latitude, longitude, zoomLevel);
    
    // Calculate bounding box
    const bbox = calculateBBox(latitude, longitude, parseInt(width), parseInt(height), zoomLevel);
    
    // Esri World Imagery REST API endpoint
    const esriUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?` +
      new URLSearchParams({
        bbox: `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
        bboxSR: '4326',
        imageSR: '4326',
        size: `${width},${height}`,
        format: 'jpg',
        f: 'image',
        transparent: 'false',
        dpi: '96'
      });

    console.log(`Requesting Esri World Imagery for ${latitude}, ${longitude} at zoom ${zoomLevel}`);
    
    const imageResponse = await fetch(esriUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Esri service error: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const contentType = imageResponse.headers.get('content-type');
    
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid response from Esri service');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Calculate resolution
    const resolution = calculateResolution(zoomLevel, latitude);
    
    // Set response headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Provider', 'Esri World Imagery');
    res.setHeader('X-Zoom-Level', zoomLevel.toString());
    res.setHeader('X-Resolution', resolution.toFixed(3));
    res.setHeader('X-Coverage', 'Global');
    res.setHeader('X-Attribution', 'Esri, Maxar, Earthstar Geographics, and the GIS User Community');
    
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Esri imagery error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Esri World Imagery',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: 'Try Google Maps Enhanced or USGS imagery for better resolution'
    });
  }
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const latRad = lat * Math.PI / 180;
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
  
  return { x, y, z: zoom };
}

/**
 * Calculate bounding box for the image
 */
function calculateBBox(centerLat, centerLng, pixelWidth, pixelHeight, zoom) {
  // Calculate degrees per pixel at this zoom level and latitude
  const earthCircumference = 40075017; // meters
  const metersPerPixel = earthCircumference * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom + 8);
  const degreesPerMeter = 1 / 111320; // approximate
  const degreesPerPixel = metersPerPixel * degreesPerMeter;
  
  const halfWidth = (pixelWidth / 2) * degreesPerPixel;
  const halfHeight = (pixelHeight / 2) * degreesPerPixel;
  
  return {
    xmin: centerLng - halfWidth,
    ymin: centerLat - halfHeight,
    xmax: centerLng + halfWidth,
    ymax: centerLat + halfHeight
  };
}

/**
 * Calculate resolution in meters per pixel
 */
function calculateResolution(zoom, latitude) {
  const earthCircumference = 40075017; // meters
  return earthCircumference * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom + 8);
}