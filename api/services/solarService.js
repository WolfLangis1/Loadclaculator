
import apiKeyManager from '../utils/apiKeyManager.js';
import ErrorHandler from '../utils/errorHandler.js';

const getGoogleSolarData = async (lat, lon) => {
  try {
    const apiKey = apiKeyManager.getGoogleMapsKey();
    
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`
    );
    
    if (response.ok) {
      return response.json();
    }
    
    const errorData = await response.json().catch(() => null);
    throw ErrorHandler.handleExternalApiError(
      'Google Solar API', 
      new Error(errorData?.error?.message || `API failed with status ${response.status}`),
      response.status
    );
  } catch (error) {
    if (error.message.includes('not configured')) {
      throw ErrorHandler.handleApiKeyError('Google Maps API', error);
    }
    throw error;
  }
};

const generateFallbackSolarData = (lat, lon, radiusMeters = 100) => {
  const sunlightHours = calculateSunlightHours(lat);
  const solarIrradiance = calculateSolarIrradiance(lat);
  const roofArea = estimateRoofArea(radiusMeters);
  const annualSolarPotential = Math.round(roofArea * solarIrradiance * sunlightHours * 365 * 0.15);
  const monthlyAverageEnergyBill = Math.round((annualSolarPotential * 0.12) / 12);

  return {
    name: `Building at ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    center: { latitude: lat, longitude: lon },
    solarPotential: {
      maxArrayPanelsCount: Math.floor(roofArea / 17.5),
      maxArrayAreaMeters2: roofArea * 0.7,
      maxSunshineHoursPerYear: sunlightHours * 365,
      carbonOffsetFactorKgPerMwh: 400,
      wholeRoofStats: {
        areaMeters2: roofArea,
        sunshineQuantiles: Array.from({ length: 11 }, (_, i) => Math.round(sunlightHours * (0.5 + i * 0.05) * 365)),
      },
      roofSegmentStats: [
        {
          pitchDegrees: 30,
          azimuthDegrees: 180,
          stats: {
            areaMeters2: roofArea,
            sunshineQuantiles: Array.from({ length: 11 }, (_, i) => Math.round(sunlightHours * (0.6 + i * 0.04) * 365)),
          },
        },
      ],
      solarPanels: generatePanelConfigurations(roofArea, lat, lon),
      financialAnalyses: generateFinancialAnalysis(annualSolarPotential, monthlyAverageEnergyBill),
    },
  };
};

const calculateSunlightHours = (lat) => {
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 6.5;
  if (absLat < 35) return 6.0;
  if (absLat < 45) return 5.5;
  if (absLat < 60) return 4.5;
  return 3.5;
};

const calculateSolarIrradiance = (lat) => {
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 5.5;
  if (absLat < 35) return 5.0;
  if (absLat < 45) return 4.5;
  if (absLat < 60) return 3.5;
  return 2.5;
};

const estimateRoofArea = (radiusMeters) => {
  const searchArea = Math.PI * radiusMeters * radiusMeters;
  const buildingCoverage = 0.3;
  const roofUsablePercent = 0.7;
  return searchArea * buildingCoverage * roofUsablePercent * 10.764;
};

const generatePanelConfigurations = (roofArea, lat, lon) => {
  const panelArea = 17.5;
  const maxPanels = Math.floor(roofArea / panelArea);
  return [
    {
      panelsCount: maxPanels,
      yearlyEnergyDcKwh: (maxPanels * 350 * calculateSunlightHours(lat) * 365) / 1000,
      segmentIndex: 0,
    },
  ];
};

const generateFinancialAnalysis = (annualSolarPotential, monthlyBill) => {
  const systemSizeKw = annualSolarPotential / (calculateSunlightHours(35) * 365);
  const installationCost = systemSizeKw * 3000;
  const annualSavings = annualSolarPotential * 0.12;
  const paybackYears = installationCost / annualSavings;

  return [
    {
      monthlyBill: { currencyCode: 'USD', units: monthlyBill.toString() },
      defaultBill: true,
      averageKwhPerMonth: Math.round(annualSolarPotential / 12),
      panelConfigIndex: 0,
      financialDetails: {
        initialAcKwhPerYear: annualSolarPotential,
        federalIncentive: { currencyCode: 'USD', units: Math.round(installationCost * 0.3).toString() },
        costOfElectricityWithoutSolar: { currencyCode: 'USD', units: Math.round(annualSavings * 25).toString() },
      },
      cashPurchaseSavings: {
        outOfPocketCost: { currencyCode: 'USD', units: Math.round(installationCost * 0.7).toString() },
        upfrontCost: { currencyCode: 'USD', units: installationCost.toString() },
        paybackYears: Math.round(paybackYears * 10) / 10,
      },
    },
  ];
};

export const solarService = {
  getGoogleSolarData,
  generateFallbackSolarData,
};
