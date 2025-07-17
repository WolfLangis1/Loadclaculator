
import { SecureApiService } from '../../src/services/secureApiService.js';

const validateRoofAnalysis = (body) => {
  const { lat, lon, roofData } = body;
  if (!lat || !lon) {
    return { isValid: false, errors: ['Latitude and longitude are required'] };
  }
  return { isValid: true, data: { lat, lon, roofData } };
};

const getWeatherData = async (lat, lon) => {
  const openweatherApiKey = process.env.OPENWEATHER_API_KEY;
  if (!openweatherApiKey) {
    throw new Error('Weather API key not configured');
  }
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}&units=imperial`
  );
  return response.json();
};

const getSatelliteUrl = (lat, lon) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
    return null;
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=20&size=640x640&maptype=satellite&key=${googleMapsApiKey}`;
};

const performRoofAnalysis = (lat, lon, weatherData, roofData) => {
  const optimalOrientation = calculateOptimalOrientation(lat);
  const optimalTilt = calculateOptimalTilt(lat);
  const roofSuitability = analyzeRoofSuitability(weatherData, roofData);
  const solarPotential = calculateSolarPotential(lat, lon, weatherData, roofData);
  const shadingAnalysis = analyzeShadingPatterns(lat, lon, weatherData);
  return {
    optimalOrientation,
    optimalTilt,
    roofSuitability,
    solarPotential,
    shadingAnalysis,
    efficiencyScore: calculateEfficiencyScore(roofSuitability, solarPotential, shadingAnalysis),
  };
};

const calculateOptimalOrientation = (lat) => (lat > 0 ? 180 : 0);

const calculateOptimalTilt = (lat) => Math.abs(lat);

const analyzeRoofSuitability = (weatherData, roofData) => {
  const suitability = { score: 0, factors: [] };
  if (weatherData.clouds?.all < 50) {
    suitability.score += 30;
    suitability.factors.push('Good sunlight exposure');
  }
  if (weatherData.main?.temp > 32) {
    suitability.score += 10;
    suitability.factors.push('Warm climate suitable for solar');
  }
  if (roofData?.area > 100) {
    suitability.score += 20;
    suitability.factors.push('Adequate roof area');
  }
  if (roofData?.condition === 'good') {
    suitability.score += 15;
    suitability.factors.push('Good roof condition');
  }
  suitability.score += 25;
  suitability.factors.push('Standard roof configuration');
  return suitability;
};

const calculateSolarPotential = (lat, lon, weatherData, roofData) => {
  const baseSolarPotential = 1500;
  const latitudeFactor = 1 - (Math.abs(lat) - 30) * 0.01;
  const weatherFactor = 1 - (weatherData.clouds?.all / 100) * 0.3;
  const areaFactor = Math.min(roofData?.area / 100, 2) || 1;
  const annualPotential = baseSolarPotential * latitudeFactor * weatherFactor * areaFactor;
  return {
    annualPotential: Math.round(annualPotential),
    dailyAverage: Math.round(annualPotential / 365),
    monthlyAverage: Math.round(annualPotential / 12),
    factors: { latitudeFactor, weatherFactor, areaFactor },
  };
};

const analyzeShadingPatterns = (lat, lon, weatherData) => {
  const shading = { morningShading: 0.1, afternoonShading: 0.1, seasonalVariation: 0.2, weatherImpact: 0.3 };
  if (weatherData.clouds?.all > 70) {
    shading.weatherImpact = 0.5;
  }
  const totalShading = Object.values(shading).reduce((sum, val) => sum + val, 0) / 4;
  return { ...shading, totalShading, impact: totalShading < 0.3 ? 'Low' : totalShading < 0.6 ? 'Medium' : 'High' };
};

const calculateEfficiencyScore = (roofSuitability, solarPotential, shadingAnalysis) => {
  const suitabilityScore = roofSuitability.score;
  const potentialScore = (solarPotential.annualPotential / 2000) * 30;
  const shadingScore = (1 - shadingAnalysis.totalShading) * 40;
  const totalScore = Math.min(100, suitabilityScore + potentialScore + shadingScore);
  return {
    score: Math.round(totalScore),
    breakdown: { suitability: Math.round(suitabilityScore), potential: Math.round(potentialScore), shading: Math.round(shadingScore) },
    grade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D',
  };
};

const generateRecommendations = (roofAnalysis, weatherData) => {
  const recommendations = [];
  if (roofAnalysis.optimalOrientation !== 180) {
    recommendations.push('Consider south-facing orientation for optimal solar exposure');
  }
  if (Math.abs(roofAnalysis.optimalTilt - 30) > 10) {
    recommendations.push(`Adjust panel tilt to approximately ${Math.round(roofAnalysis.optimalTilt)}° for maximum efficiency`);
  }
  if (roofAnalysis.shadingAnalysis.impact === 'High') {
    recommendations.push('Consider tree trimming or panel positioning to reduce shading');
  }
  if (weatherData.clouds?.all > 70) {
    recommendations.push('Monitor weather patterns for optimal panel cleaning schedule');
  }
  if (roofAnalysis.efficiencyScore.score < 60) {
    recommendations.push('Consider energy efficiency improvements before solar installation');
  }
  return recommendations;
};

export const roofAnalysisService = {
  validateRoofAnalysis,
  getWeatherData,
  getSatelliteUrl,
  performRoofAnalysis,
  generateRecommendations,
};
