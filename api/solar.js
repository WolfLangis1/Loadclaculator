// Vercel serverless function for Google Solar API
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get parameters from query
  const { lat, lon, radiusMeters = 100 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    // Get API key from environment variables (server-side only)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    // Try Google Solar API first, but provide intelligent fallback
    let solarData = null;
    let usingFallback = false;
    let errorDetails = null;

    try {
      const response = await fetch(
        `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`
      );

      if (response.ok) {
        solarData = await response.json();
      } else {
        // Log error but don't fail - use fallback instead
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.warn('Google Solar API unavailable, using fallback:', {
          status: response.status,
          statusText: response.statusText,
          location: { lat: parseFloat(lat), lon: parseFloat(lon) }
        });

        errorDetails = {
          googleApiStatus: response.status,
          googleApiMessage: response.statusText,
          reason: response.status === 403 ? 'API access not enabled' :
                  response.status === 404 ? 'No data for location' :
                  response.status === 400 ? 'Invalid request' : 'API error'
        };
        
        usingFallback = true;
      }
    } catch (fetchError) {
      console.warn('Google Solar API fetch failed, using fallback:', fetchError.message);
      usingFallback = true;
      errorDetails = {
        googleApiStatus: 'network_error',
        googleApiMessage: fetchError.message,
        reason: 'Network or API unavailable'
      };
    }

    // If Google Solar API failed, provide intelligent fallback data
    if (usingFallback || !solarData) {
      solarData = generateFallbackSolarData(parseFloat(lat), parseFloat(lon), radiusMeters);
    }

    // Always return success with either real or fallback data
    return res.status(200).json({
      ...solarData,
      dataSource: usingFallback ? 'fallback_calculation' : 'google_solar_api',
      fallbackUsed: usingFallback,
      ...(errorDetails && { googleApiError: errorDetails }),
      metadata: {
        timestamp: new Date().toISOString(),
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        apiVersion: usingFallback ? 'fallback_v1' : 'google_solar_v1'
      }
    });
  } catch (error) {
    console.error('Solar API error:', error);
    // Even on error, try to provide fallback data
    try {
      const fallbackData = generateFallbackSolarData(parseFloat(lat), parseFloat(lon), radiusMeters);
      return res.status(200).json({
        ...fallbackData,
        dataSource: 'fallback_calculation',
        fallbackUsed: true,
        error: 'Primary API failed, using calculated estimates',
        metadata: {
          timestamp: new Date().toISOString(),
          location: { lat: parseFloat(lat), lon: parseFloat(lon) },
          apiVersion: 'fallback_v1'
        }
      });
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Failed to get solar data' });
    }
  }
}

// Intelligent fallback solar data generation
function generateFallbackSolarData(lat, lon, radiusMeters = 100) {
  // Calculate realistic solar potential based on location
  const sunlightHours = calculateSunlightHours(lat);
  const solarIrradiance = calculateSolarIrradiance(lat);
  const roofArea = estimateRoofArea(radiusMeters);
  
  // Generate realistic building insights
  const buildingInsights = {
    name: `Building at ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    center: {
      latitude: lat,
      longitude: lon
    },
    boundingBox: {
      sw: { latitude: lat - 0.0001, longitude: lon - 0.0001 },
      ne: { latitude: lat + 0.0001, longitude: lon + 0.0001 }
    },
    imageryDate: {
      year: 2023,
      month: 6,
      day: 15
    },
    postalCode: "Unknown",
    administrativeArea: "Unknown",
    statisticalArea: "Unknown",
    regionCode: getRegionCode(lat, lon)
  };

  // Calculate solar potential
  const annualSolarPotential = Math.round(roofArea * solarIrradiance * sunlightHours * 365 * 0.15); // 15% panel efficiency
  const monthlyAverageEnergyBill = Math.round(annualSolarPotential * 0.12 / 12); // $0.12/kWh average
  
  const solarPotential = {
    maxArrayPanelsCount: Math.floor(roofArea / 17.5), // Assume 350W panels, ~17.5 sq ft each
    maxArrayAreaMeters2: roofArea * 0.7, // 70% of roof usable
    maxSunshineHoursPerYear: sunlightHours * 365,
    carbonOffsetFactorKgPerMwh: 400, // Average grid carbon intensity
    wholeRoofStats: {
      areaMeters2: roofArea,
      sunshineQuantiles: Array.from({length: 11}, (_, i) => Math.round(sunlightHours * (0.5 + i * 0.05) * 365)),
      groundAreaCoveredMeters2: roofArea * 0.8
    },
    roofSegmentStats: [{
      pitchDegrees: 30,
      azimuthDegrees: 180, // South-facing
      stats: {
        areaMeters2: roofArea,
        sunshineQuantiles: Array.from({length: 11}, (_, i) => Math.round(sunlightHours * (0.6 + i * 0.04) * 365)),
        groundAreaCoveredMeters2: roofArea * 0.8
      },
      center: { latitude: lat, longitude: lon },
      boundingBox: {
        sw: { latitude: lat - 0.00005, longitude: lon - 0.00005 },
        ne: { latitude: lat + 0.00005, longitude: lon + 0.00005 }
      },
      planeHeightAtCenterMeters: 8
    }],
    solarPanels: generatePanelConfigurations(roofArea, lat, lon),
    financialAnalyses: generateFinancialAnalysis(annualSolarPotential, monthlyAverageEnergyBill)
  };

  return {
    name: buildingInsights.name,
    center: buildingInsights.center,
    boundingBox: buildingInsights.boundingBox,
    imageryDate: buildingInsights.imageryDate,
    postalCode: buildingInsights.postalCode,
    administrativeArea: buildingInsights.administrativeArea,
    statisticalArea: buildingInsights.statisticalArea,
    regionCode: buildingInsights.regionCode,
    solarPotential,
    imageryProcessedDate: buildingInsights.imageryDate
  };
}

function calculateSunlightHours(lat) {
  // Approximate annual average daily sunlight hours based on latitude
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 6.5; // Tropical regions
  if (absLat < 35) return 6.0;   // Subtropical regions  
  if (absLat < 45) return 5.5;   // Temperate regions
  if (absLat < 60) return 4.5;   // Northern temperate
  return 3.5; // Arctic regions
}

function calculateSolarIrradiance(lat) {
  // Solar irradiance in kWh/m²/day based on latitude
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 5.5; // High irradiance near equator
  if (absLat < 35) return 5.0;   // Good irradiance in subtropics
  if (absLat < 45) return 4.5;   // Moderate irradiance in temperate zones
  if (absLat < 60) return 3.5;   // Lower irradiance in northern regions
  return 2.5; // Very low irradiance in arctic
}

function estimateRoofArea(radiusMeters) {
  // Estimate roof area based on search radius (rough approximation)
  const searchArea = Math.PI * radiusMeters * radiusMeters;
  const buildingCoverage = 0.3; // Assume 30% building coverage
  const roofUsablePercent = 0.7; // 70% of roof typically usable for solar
  return searchArea * buildingCoverage * roofUsablePercent * 10.764; // Convert m² to sq ft
}

function getRegionCode(lat, lon) {
  // Simple region code assignment based on coordinates
  if (lat >= 24.4 && lat <= 49.4 && lon >= -125 && lon <= -66.9) return 'US';
  if (lat >= 41.7 && lat <= 83.1 && lon >= -141 && lon <= -52.6) return 'CA';
  if (lat >= 35.8 && lat <= 71.2 && lon >= -10.5 && lon <= 31.6) return 'EU';
  return 'XX'; // Unknown region
}

function generatePanelConfigurations(roofArea, lat, lon) {
  const panelArea = 17.5; // sq ft per panel
  const maxPanels = Math.floor(roofArea / panelArea);
  
  return [{
    panelsCount: maxPanels,
    yearlyEnergyDcKwh: maxPanels * 350 * calculateSunlightHours(lat) * 365 / 1000, // 350W panels
    segmentIndex: 0
  }];
}

function generateFinancialAnalysis(annualSolarPotential, monthlyBill) {
  const systemSizeKw = annualSolarPotential / (calculateSunlightHours(35) * 365); // Approximate system size
  const installationCost = systemSizeKw * 3000; // $3/W average
  const annualSavings = annualSolarPotential * 0.12; // $0.12/kWh
  const paybackYears = installationCost / annualSavings;

  return [{
    monthlyBill: {
      currencyCode: 'USD',
      units: monthlyBill.toString()
    },
    defaultBill: true,
    averageKwhPerMonth: Math.round(annualSolarPotential / 12),
    panelConfigIndex: 0,
    financialDetails: {
      initialAcKwhPerYear: annualSolarPotential,
      remainingLifetimeUtilityBill: {
        currencyCode: 'USD',
        units: Math.round(installationCost * 0.3).toString()
      },
      federalIncentive: {
        currencyCode: 'USD', 
        units: Math.round(installationCost * 0.30).toString() // 30% federal tax credit
      },
      stateIncentive: {
        currencyCode: 'USD',
        units: '0'
      },
      utilityIncentive: {
        currencyCode: 'USD',
        units: '0'
      },
      lifetimeSrecTotal: {
        currencyCode: 'USD',
        units: '0'
      },
      costOfElectricityWithoutSolar: {
        currencyCode: 'USD',
        units: Math.round(annualSavings * 25).toString() // 25-year savings
      },
      netMeteringAllowed: true,
      solarPercentage: Math.min(100, Math.round((annualSolarPotential / (monthlyBill * 12 / 0.12)) * 100)),
      percentageExportedToGrid: 10
    },
    leasingSavings: {
      leasesAllowed: true,
      leasesSupported: true,
      annualLeasingCost: {
        currencyCode: 'USD',
        units: Math.round(installationCost * 0.08).toString() // 8% annual lease cost
      }
    },
    cashPurchaseSavings: {
      outOfPocketCost: {
        currencyCode: 'USD',
        units: Math.round(installationCost * 0.7).toString() // After incentives
      },
      upfrontCost: {
        currencyCode: 'USD',
        units: installationCost.toString()
      },
      rebateValue: {
        currencyCode: 'USD',
        units: Math.round(installationCost * 0.30).toString()
      },
      paybackYears: Math.round(paybackYears * 10) / 10,
      savings: {
        savingsYear1: {
          currencyCode: 'USD',
          units: Math.round(annualSavings).toString()
        },
        savingsYear20: {
          currencyCode: 'USD',
          units: Math.round(annualSavings * 20 * 0.8).toString() // Account for degradation
        },
        presentValueOfSavingsYear20: {
          currencyCode: 'USD',
          units: Math.round(annualSavings * 15).toString() // NPV approximation
        },
        savingsLifetime: {
          currencyCode: 'USD',
          units: Math.round(annualSavings * 25 * 0.75).toString()
        },
        presentValueOfSavingsLifetime: {
          currencyCode: 'USD',
          units: Math.round(annualSavings * 18).toString()
        }
      }
    },
    financedPurchaseSavings: {
      annualLoanPayment: {
        currencyCode: 'USD',
        units: Math.round(installationCost * 0.08).toString() // 8% annual payment approximation
      },
      rebateValue: {
        currencyCode: 'USD',
        units: Math.round(installationCost * 0.30).toString()
      },
      loanInterestRate: 0.06 // 6% interest rate
    }
  }];
} 