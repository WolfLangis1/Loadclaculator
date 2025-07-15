// Vercel serverless function for Real-time Shading Analysis
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get parameters from query
  const { lat, lon, timestamp } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    // Get API keys from environment variables (server-side only)
    const openweatherApiKey = process.env.OPENWEATHER_API_KEY;
    const noaaApiKey = process.env.NOAA_API_KEY;
    
    if (!openweatherApiKey && !noaaApiKey) {
      return res.status(500).json({ error: 'Weather API keys not configured' });
    }

    // Get current weather data for shading analysis
    let weatherData;
    if (openweatherApiKey) {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}&units=imperial`
      );
      weatherData = await response.json();
    } else {
      // Fallback to NOAA API
      const response = await fetch(
        `https://api.weather.gov/points/${lat},${lon}`,
        {
          headers: {
            'User-Agent': 'LoadCalculator/1.0',
            'Accept': 'application/geo+json'
          }
        }
      );
      weatherData = await response.json();
    }

    // Calculate shading based on weather data and time
    const currentTime = timestamp ? new Date(parseInt(timestamp)) : new Date();
    const hour = currentTime.getHours();
    const month = currentTime.getMonth();

    // Simple shading calculation based on time of day and season
    const shadingFactor = calculateShadingFactor(hour, month, weatherData);

    const shadingData = {
      timestamp: currentTime.toISOString(),
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      shadingFactor,
      weather: weatherData,
      analysis: {
        sunPosition: calculateSunPosition(lat, lon, currentTime),
        shadowLength: calculateShadowLength(weatherData, hour),
        solarIrradiance: calculateSolarIrradiance(month, hour, shadingFactor)
      }
    };

    return res.status(200).json(shadingData);
  } catch (error) {
    console.error('Shading analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze shading' });
  }
}

// Helper functions for shading calculations
function calculateShadingFactor(hour, month, weatherData) {
  // Base shading factor (0 = no shading, 1 = full shade)
  let baseShading = 0;
  
  // Time-based shading (more shade in early morning and late afternoon)
  if (hour < 8 || hour > 18) {
    baseShading = 0.8; // High shading
  } else if (hour < 10 || hour > 16) {
    baseShading = 0.3; // Medium shading
  } else {
    baseShading = 0.1; // Low shading (peak sun hours)
  }
  
  // Weather-based adjustments
  if (weatherData.clouds && weatherData.clouds.all) {
    baseShading += (weatherData.clouds.all / 100) * 0.3;
  }
  
  return Math.min(baseShading, 1);
}

function calculateSunPosition(lat, lon, time) {
  // Simplified sun position calculation
  const date = new Date(time);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // Approximate solar declination
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 80) * (Math.PI / 180));
  
  // Approximate solar hour angle
  const hour = date.getHours() + date.getMinutes() / 60;
  const hourAngle = (hour - 12) * 15;
  
  return {
    azimuth: hourAngle,
    elevation: 90 - Math.abs(lat - declination),
    declination
  };
}

function calculateShadowLength(weatherData, hour) {
  // Calculate shadow length based on sun angle and weather
  const sunAngle = Math.max(0, 90 - Math.abs(hour - 12) * 7.5);
  const baseShadowLength = 10 / Math.tan(sunAngle * Math.PI / 180);
  
  // Adjust for weather conditions
  let weatherMultiplier = 1;
  if (weatherData.clouds && weatherData.clouds.all > 50) {
    weatherMultiplier = 0.8;
  }
  
  return Math.max(0, baseShadowLength * weatherMultiplier);
}

function calculateSolarIrradiance(month, hour, shadingFactor) {
  // Base solar irradiance (W/m²)
  const baseIrradiance = 1000;
  
  // Seasonal adjustment
  const seasonalFactor = 1 + 0.3 * Math.sin((month - 6) * Math.PI / 6);
  
  // Time of day adjustment
  const timeFactor = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
  
  // Shading adjustment
  const shadingAdjustment = 1 - shadingFactor;
  
  return baseIrradiance * seasonalFactor * timeFactor * shadingAdjustment;
} 