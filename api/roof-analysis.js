// Vercel serverless function for AI Roof Analysis
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lat, lon, roofData } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Get API keys from environment variables (server-side only)
    const openweatherApiKey = process.env.OPENWEATHER_API_KEY;
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!openweatherApiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    // Get weather data for roof analysis
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}&units=imperial`
    );
    const weatherData = await weatherResponse.json();

    // Get satellite imagery for roof analysis
    let satelliteUrl = null;
    if (googleMapsApiKey) {
      satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=20&size=640x640&maptype=satellite&key=${googleMapsApiKey}`;
    }

    // Perform AI roof analysis (simplified version)
    const roofAnalysis = await performRoofAnalysis(lat, lon, weatherData, roofData);

    const analysisResult = {
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      timestamp: new Date().toISOString(),
      weather: weatherData,
      satelliteUrl,
      roofAnalysis,
      recommendations: generateRecommendations(roofAnalysis, weatherData)
    };

    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Roof analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze roof' });
  }
}

// AI Roof Analysis function
async function performRoofAnalysis(lat, lon, weatherData, roofData) {
  // Calculate roof orientation and tilt based on location
  const optimalOrientation = calculateOptimalOrientation(lat);
  const optimalTilt = calculateOptimalTilt(lat);
  
  // Analyze roof suitability
  const roofSuitability = analyzeRoofSuitability(weatherData, roofData);
  
  // Calculate potential solar generation
  const solarPotential = calculateSolarPotential(lat, lon, weatherData, roofData);
  
  // Analyze shading patterns
  const shadingAnalysis = analyzeShadingPatterns(lat, lon, weatherData);
  
  return {
    optimalOrientation,
    optimalTilt,
    roofSuitability,
    solarPotential,
    shadingAnalysis,
    efficiencyScore: calculateEfficiencyScore(roofSuitability, solarPotential, shadingAnalysis)
  };
}

function calculateOptimalOrientation(lat) {
  // Optimal orientation is generally south-facing in Northern Hemisphere
  const isNorthernHemisphere = lat > 0;
  return isNorthernHemisphere ? 180 : 0; // 180° = South, 0° = North
}

function calculateOptimalTilt(lat) {
  // Optimal tilt is approximately equal to latitude
  return Math.abs(lat);
}

function analyzeRoofSuitability(weatherData, roofData) {
  const suitability = {
    score: 0,
    factors: []
  };
  
  // Weather-based factors
  if (weatherData.clouds && weatherData.clouds.all < 50) {
    suitability.score += 30;
    suitability.factors.push('Good sunlight exposure');
  }
  
  if (weatherData.main && weatherData.main.temp > 32) {
    suitability.score += 10;
    suitability.factors.push('Warm climate suitable for solar');
  }
  
  // Roof data factors (if provided)
  if (roofData) {
    if (roofData.area && roofData.area > 100) {
      suitability.score += 20;
      suitability.factors.push('Adequate roof area');
    }
    
    if (roofData.condition === 'good') {
      suitability.score += 15;
      suitability.factors.push('Good roof condition');
    }
  }
  
  // Environmental factors
  suitability.score += 25; // Base score for general suitability
  suitability.factors.push('Standard roof configuration');
  
  return suitability;
}

function calculateSolarPotential(lat, lon, weatherData, roofData) {
  // Calculate annual solar potential in kWh
  const baseSolarPotential = 1500; // kWh per kW per year (average)
  
  // Latitude adjustment
  const latitudeFactor = 1 - (Math.abs(lat) - 30) * 0.01;
  
  // Weather adjustment
  let weatherFactor = 1;
  if (weatherData.clouds && weatherData.clouds.all) {
    weatherFactor = 1 - (weatherData.clouds.all / 100) * 0.3;
  }
  
  // Roof area adjustment
  let areaFactor = 1;
  if (roofData && roofData.area) {
    areaFactor = Math.min(roofData.area / 100, 2); // Cap at 2x
  }
  
  const annualPotential = baseSolarPotential * latitudeFactor * weatherFactor * areaFactor;
  
  return {
    annualPotential: Math.round(annualPotential),
    dailyAverage: Math.round(annualPotential / 365),
    monthlyAverage: Math.round(annualPotential / 12),
    factors: {
      latitudeFactor,
      weatherFactor,
      areaFactor
    }
  };
}

function analyzeShadingPatterns(lat, lon, weatherData) {
  const shading = {
    morningShading: 0.1,
    afternoonShading: 0.1,
    seasonalVariation: 0.2,
    weatherImpact: 0.3
  };
  
  // Adjust based on weather conditions
  if (weatherData.clouds && weatherData.clouds.all > 70) {
    shading.weatherImpact = 0.5;
  }
  
  // Calculate total shading factor
  const totalShading = Object.values(shading).reduce((sum, val) => sum + val, 0) / 4;
  
  return {
    ...shading,
    totalShading,
    impact: totalShading < 0.3 ? 'Low' : totalShading < 0.6 ? 'Medium' : 'High'
  };
}

function calculateEfficiencyScore(roofSuitability, solarPotential, shadingAnalysis) {
  // Calculate overall efficiency score (0-100)
  const suitabilityScore = roofSuitability.score;
  const potentialScore = (solarPotential.annualPotential / 2000) * 30; // Max 30 points
  const shadingScore = (1 - shadingAnalysis.totalShading) * 40; // Max 40 points
  
  const totalScore = Math.min(100, suitabilityScore + potentialScore + shadingScore);
  
  return {
    score: Math.round(totalScore),
    breakdown: {
      suitability: Math.round(suitabilityScore),
      potential: Math.round(potentialScore),
      shading: Math.round(shadingScore)
    },
    grade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D'
  };
}

function generateRecommendations(roofAnalysis, weatherData) {
  const recommendations = [];
  
  // Orientation recommendations
  if (roofAnalysis.optimalOrientation !== 180) {
    recommendations.push('Consider south-facing orientation for optimal solar exposure');
  }
  
  // Tilt recommendations
  if (Math.abs(roofAnalysis.optimalTilt - 30) > 10) {
    recommendations.push(`Adjust panel tilt to approximately ${Math.round(roofAnalysis.optimalTilt)}° for maximum efficiency`);
  }
  
  // Shading recommendations
  if (roofAnalysis.shadingAnalysis.impact === 'High') {
    recommendations.push('Consider tree trimming or panel positioning to reduce shading');
  }
  
  // Weather-based recommendations
  if (weatherData.clouds && weatherData.clouds.all > 70) {
    recommendations.push('Monitor weather patterns for optimal panel cleaning schedule');
  }
  
  // Efficiency recommendations
  if (roofAnalysis.efficiencyScore.score < 60) {
    recommendations.push('Consider energy efficiency improvements before solar installation');
  }
  
  return recommendations;
} 