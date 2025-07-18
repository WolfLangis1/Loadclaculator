// Vercel Serverless Function for Google Solar API

const validateCoordinates = (lat, lon) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const errors = [];
  
  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push('Latitude must be a number between -90 and 90');
  }
  
  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push('Longitude must be a number between -180 and 180');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? { lat: latitude, lon: longitude } : undefined
  };
};

const generateFallbackSolarData = (lat, lon, radiusMeters = 100) => {
  // Basic solar calculation fallback
  const avgSunHours = Math.max(4, Math.min(8, 6 + Math.sin(lat * Math.PI / 180) * 2));
  const solarPotential = avgSunHours * 365 * 0.8; // kWh/year per kW installed
  
  return {
    solarPotential,
    sunlightHoursPerYear: avgSunHours * 365,
    panelCapacityWatts: 4000,
    yearlyEnergyDcKwh: solarPotential * 4,
    carbonOffsetFactorKgPerMwh: 400,
    panelAreaSquareMeters: 25,
    installationSize: {
      panelCapacityWatts: 4000,
      panelLifetimeYears: 20
    },
    buildingInsights: {
      statisticalArea: radiusMeters,
      boundingBox: {
        sw: { latitude: lat - 0.001, longitude: lon - 0.001 },
        ne: { latitude: lat + 0.001, longitude: lon + 0.001 }
      },
      imageryDate: { year: 2023, month: 6, day: 15 },
      regionCode: 'US'
    }
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader(corsHeaders).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, radiusMeters = 100 } = req.query;

  // Validate coordinates
  const validation = validateCoordinates(lat, lon);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid coordinates',
      details: validation.errors,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey.startsWith('your_')) {
      console.warn('Google Solar API key not configured, using fallback data');
      const fallbackData = generateFallbackSolarData(validation.data.lat, validation.data.lon, parseInt(radiusMeters));
      return res.status(200).json({ ...fallbackData, dataSource: 'fallback_calculation', fallbackUsed: true });
    }

    // Try Google Solar API
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${validation.data.lat}&location.longitude=${validation.data.lon}&requiredQuality=MEDIUM&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Solar API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json({ ...data, dataSource: 'google_solar_api', fallbackUsed: false });
    
  } catch (error) {
    console.warn('Google Solar API failed, using fallback:', error.message);
    const fallbackData = generateFallbackSolarData(validation.data.lat, validation.data.lon, parseInt(radiusMeters));
    return res.status(200).json({ ...fallbackData, dataSource: 'fallback_calculation', fallbackUsed: true });
  }
}