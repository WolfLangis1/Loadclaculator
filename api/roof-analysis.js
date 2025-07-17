
import { cors, rateLimit, validate } from './utils/middleware.js';
import { roofAnalysisService } from './services/roofAnalysisService.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;
  if (validate(roofAnalysisService.validateRoofAnalysis)(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, roofData } = req.validatedData;

  try {
    const weatherData = await roofAnalysisService.getWeatherData(lat, lon);
    const satelliteUrl = roofAnalysisService.getSatelliteUrl(lat, lon);
    const roofAnalysis = roofAnalysisService.performRoofAnalysis(lat, lon, weatherData, roofData);
    const recommendations = roofAnalysisService.generateRecommendations(roofAnalysis, weatherData);

    const analysisResult = {
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      timestamp: new Date().toISOString(),
      weather: weatherData,
      satelliteUrl,
      roofAnalysis,
      recommendations,
    };

    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Roof analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze roof' });
  }
}
 