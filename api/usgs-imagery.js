/**
 * USGS High-Resolution Imagery API
 * Access to USGS National Map and NAIP (National Agriculture Imagery Program)
 * Provides 6-inch to 1-meter resolution for US locations
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, width = 800, height = 600, layers = 'USGSImageryTopo' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  // Check if location is in US (USGS only covers US)
  if (!isLocationInUS(latitude, longitude)) {
    return res.status(400).json({ 
      error: 'USGS imagery is only available for US locations',
      coverage: 'United States, including Alaska and Hawaii'
    });
  }

  try {
    // Calculate bounding box for the image
    const bbox = calculateBoundingBox(latitude, longitude, width, height);
    
    // Try NAIP (National Agriculture Imagery Program) first - highest resolution
    const naipUrl = `https://services.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer?` +
      new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetMap',
        LAYERS: 'USGSImageryOnly:ImageryMapServer',
        STYLES: '',
        CRS: 'EPSG:4326',
        BBOX: `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`,
        WIDTH: width.toString(),
        HEIGHT: height.toString(),
        FORMAT: 'image/jpeg',
        TRANSPARENT: 'false'
      });

    console.log(`Requesting USGS NAIP imagery for ${latitude}, ${longitude}`);
    
    let imageResponse = await fetch(naipUrl);
    
    if (!imageResponse.ok) {
      console.log('NAIP failed, trying USGS Imagery Topo...');
      
      // Fallback to USGS Imagery Topo
      const usgsUrl = `https://basemap.nationalmap.gov/arcgis/services/USGSImageryTopo/MapServer/WMSServer?` +
        new URLSearchParams({
          SERVICE: 'WMS',
          VERSION: '1.3.0',
          REQUEST: 'GetMap',
          LAYERS: 'USGSImageryTopo:ImageryTopoMapServer',
          STYLES: '',
          CRS: 'EPSG:4326',
          BBOX: `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`,
          WIDTH: width.toString(),
          HEIGHT: height.toString(),
          FORMAT: 'image/jpeg',
          TRANSPARENT: 'false'
        });
      
      imageResponse = await fetch(usgsUrl);
    }

    if (!imageResponse.ok) {
      throw new Error(`USGS service error: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const contentType = imageResponse.headers.get('content-type');
    
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid response from USGS service');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Set response headers
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour (USGS updates less frequently)
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Provider', 'USGS National Map');
    res.setHeader('X-Resolution', '0.15'); // Typical NAIP resolution in meters
    res.setHeader('X-Coverage', 'US Only');
    
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('USGS imagery error:', error);
    return res.status(500).json({
      error: 'Failed to fetch USGS imagery',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: 'Try Google Maps Enhanced or Esri World Imagery for this location'
    });
  }
}

/**
 * Check if coordinates are within US bounds
 */
function isLocationInUS(latitude, longitude) {
  // Continental US, Alaska, and Hawaii bounds
  const bounds = [
    // Continental US
    { latMin: 24.396308, latMax: 49.384358, lngMin: -125.000000, lngMax: -66.934570 },
    // Alaska
    { latMin: 51.214183, latMax: 71.538800, lngMin: -179.148909, lngMax: -129.974167 },
    // Hawaii
    { latMin: 18.948267, latMax: 22.228024, lngMin: -162.425629, lngMax: -154.749756 }
  ];

  return bounds.some(bound => 
    latitude >= bound.latMin && latitude <= bound.latMax &&
    longitude >= bound.lngMin && longitude <= bound.lngMax
  );
}

/**
 * Calculate bounding box for WMS request
 */
function calculateBoundingBox(centerLat, centerLng, pixelWidth, pixelHeight) {
  // Approximate degrees per pixel at this latitude
  const metersPerDegree = 111320;
  const resolution = 0.15; // meters per pixel for high-res imagery
  
  const latDelta = (pixelHeight * resolution) / (2 * metersPerDegree);
  const lngDelta = (pixelWidth * resolution) / (2 * metersPerDegree * Math.cos(centerLat * Math.PI / 180));
  
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLng + lngDelta,
    west: centerLng - lngDelta
  };
}