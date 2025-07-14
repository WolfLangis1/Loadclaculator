// Google Solar API Service
// Provides detailed solar analysis including roof segments, solar potential, and financial analysis

export interface SolarPotential {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
}

export interface RoofSegment {
  segmentIndex: number;
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  areaMeters2: number;
  planeHeightAtCenterMeters: number;
}

export interface SolarConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: RoofSegment[];
}

export interface FinancialAnalysis {
  monthlyBill: {
    currencyCode: string;
    units: string;
  };
  defaultBill: boolean;
  averageKwhPerMonth: number;
  placeholderFillOrder: string[];
  panelConfigIndex: number;
}

export interface SolarInsights {
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: SolarPotential;
  roofSegmentStats: RoofSegment[];
  solarPanelConfigs: SolarConfig[];
  financialAnalyses: FinancialAnalysis[];
}

export interface SolarApiOptions {
  requiredQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  pixelSizeMeters: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  panelLifetimeYears: number;
  dcToAcDerate: number;
  energyCostPerKwh: number;
}

export class GoogleSolarService {
  private static readonly SOLAR_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
  private static readonly USE_REAL_DATA = import.meta.env.VITE_USE_REAL_AERIAL_DATA === 'true';

  /**
   * Get solar insights for a specific location
   */
  static async getSolarInsights(
    latitude: number,
    longitude: number,
    options: Partial<SolarApiOptions> = {}
  ): Promise<SolarInsights> {
    const defaultOptions: SolarApiOptions = {
      requiredQuality: 'HIGH',
      pixelSizeMeters: 0.5,
      panelCapacityWatts: 400,
      panelHeightMeters: 2.0,
      panelWidthMeters: 1.0,
      panelLifetimeYears: 25,
      dcToAcDerate: 0.85,
      energyCostPerKwh: 0.12
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (!this.USE_REAL_DATA || this.SOLAR_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.log('🔧 Using mock solar data');
      return this.getMockSolarInsights(latitude, longitude, finalOptions);
    }

    console.log('☀️ Using real Google Solar API');
    return await this.getRealSolarInsights(latitude, longitude, finalOptions);
  }

  /**
   * Real Google Solar API call
   */
  private static async getRealSolarInsights(
    latitude: number,
    longitude: number,
    options: SolarApiOptions
  ): Promise<SolarInsights> {
    const baseUrl = 'https://solar.googleapis.com/v1/buildingInsights:findClosest';
    
    const params = new URLSearchParams({
      'location.latitude': latitude.toString(),
      'location.longitude': longitude.toString(),
      'requiredQuality': options.requiredQuality,
      'key': this.SOLAR_API_KEY
    });

    console.log('🌐 Making Solar API request');
    console.log('📍 Coordinates:', latitude, longitude);
    console.log('⚙️ Options:', options);

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Solar API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Solar API response:', data);

    if (!data.solarPotential) {
      throw new Error('No solar data available for this location');
    }

    return data as SolarInsights;
  }

  /**
   * Mock solar data for development
   */
  private static getMockSolarInsights(
    latitude: number,
    longitude: number,
    options: SolarApiOptions
  ): SolarInsights {
    console.log('🔧 Generating mock solar data for coordinates:', latitude, longitude);
    
    // Generate realistic mock data based on location (Arizona gets good sun!)
    const isArizona = latitude > 31 && latitude < 37 && longitude > -115 && longitude < -109;
    const sunMultiplier = isArizona ? 1.3 : 1.0; // Arizona gets 30% more sun
    
    return {
      name: `Solar Analysis for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      center: { latitude, longitude },
      imageryDate: { year: 2023, month: 8, day: 15 },
      imageryProcessedDate: { year: 2023, month: 9, day: 1 },
      postalCode: isArizona ? '85308' : '12345',
      administrativeArea: isArizona ? 'Arizona' : 'Demo State',
      statisticalArea: isArizona ? 'Phoenix-Mesa-Scottsdale' : 'Demo Area',
      regionCode: 'US',
      solarPotential: {
        maxArrayPanelsCount: Math.floor(25 * sunMultiplier),
        maxArrayAreaMeters2: Math.floor(50 * sunMultiplier),
        maxSunshineHoursPerYear: Math.floor(2800 * sunMultiplier),
        carbonOffsetFactorKgPerMwh: 400,
        wholeRoofStats: {
          areaMeters2: 150,
          sunshineQuantiles: [1200, 1400, 1600, 1800, 2000].map(h => h * sunMultiplier),
          groundAreaMeters2: 200
        }
      },
      roofSegmentStats: [
        {
          segmentIndex: 0,
          pitchDegrees: 30,
          azimuthDegrees: 180, // South-facing (ideal)
          panelsCount: Math.floor(15 * sunMultiplier),
          yearlyEnergyDcKwh: Math.floor(8000 * sunMultiplier),
          areaMeters2: 30,
          planeHeightAtCenterMeters: 6.0
        },
        {
          segmentIndex: 1,
          pitchDegrees: 30,
          azimuthDegrees: 270, // West-facing
          panelsCount: Math.floor(10 * sunMultiplier),
          yearlyEnergyDcKwh: Math.floor(5500 * sunMultiplier),
          areaMeters2: 20,
          planeHeightAtCenterMeters: 6.0
        }
      ],
      solarPanelConfigs: [
        {
          panelsCount: Math.floor(20 * sunMultiplier),
          yearlyEnergyDcKwh: Math.floor(12000 * sunMultiplier),
          roofSegmentSummaries: []
        }
      ],
      financialAnalyses: [
        {
          monthlyBill: { currencyCode: 'USD', units: '150.00' },
          defaultBill: true,
          averageKwhPerMonth: 1200,
          placeholderFillOrder: ['yearly_energy_dc_kwh'],
          panelConfigIndex: 0
        }
      ]
    };
  }

  /**
   * Calculate solar system size recommendation
   */
  static calculateSystemRecommendation(
    insights: SolarInsights,
    monthlyKwhUsage: number = 1000
  ): {
    recommendedPanels: number;
    recommendedKW: number;
    estimatedProduction: number;
    roofCoverage: number;
    paybackYears: number;
    co2OffsetKgPerYear: number;
  } {
    const annualUsage = monthlyKwhUsage * 12;
    const maxProduction = insights.solarPotential.maxSunshineHoursPerYear * 
                         insights.solarPotential.maxArrayPanelsCount * 0.4; // 400W panels
    
    // Size system to cover 90% of usage (accounting for inefficiencies)
    const targetProduction = annualUsage * 0.9;
    const productionPerPanel = maxProduction / insights.solarPotential.maxArrayPanelsCount;
    const recommendedPanels = Math.min(
      Math.ceil(targetProduction / productionPerPanel),
      insights.solarPotential.maxArrayPanelsCount
    );
    
    const recommendedKW = recommendedPanels * 0.4; // 400W panels
    const estimatedProduction = recommendedPanels * productionPerPanel;
    const roofCoverage = (recommendedPanels / insights.solarPotential.maxArrayPanelsCount) * 100;
    
    // Simple payback calculation (system cost / annual savings)
    const systemCost = recommendedKW * 3000; // $3/watt installed
    const annualSavings = estimatedProduction * 0.12; // $0.12/kWh
    const paybackYears = systemCost / annualSavings;
    
    const co2OffsetKgPerYear = (estimatedProduction / 1000) * insights.solarPotential.carbonOffsetFactorKgPerMwh;

    return {
      recommendedPanels,
      recommendedKW: Math.round(recommendedKW * 10) / 10,
      estimatedProduction: Math.round(estimatedProduction),
      roofCoverage: Math.round(roofCoverage),
      paybackYears: Math.round(paybackYears * 10) / 10,
      co2OffsetKgPerYear: Math.round(co2OffsetKgPerYear)
    };
  }

  /**
   * Get roof segment analysis for solar placement
   */
  static analyzeRoofSegments(insights: SolarInsights): {
    bestSegments: RoofSegment[];
    totalUsableArea: number;
    averageAzimuth: number;
    averagePitch: number;
  } {
    const segments = insights.roofSegmentStats;
    
    // Sort by energy production potential
    const bestSegments = [...segments]
      .sort((a, b) => b.yearlyEnergyDcKwh - a.yearlyEnergyDcKwh)
      .slice(0, 3); // Top 3 segments
    
    const totalUsableArea = segments.reduce((sum, seg) => sum + seg.areaMeters2, 0);
    const averageAzimuth = segments.reduce((sum, seg) => sum + seg.azimuthDegrees, 0) / segments.length;
    const averagePitch = segments.reduce((sum, seg) => sum + seg.pitchDegrees, 0) / segments.length;

    return {
      bestSegments,
      totalUsableArea: Math.round(totalUsableArea),
      averageAzimuth: Math.round(averageAzimuth),
      averagePitch: Math.round(averagePitch)
    };
  }

  /**
   * Check if Solar API is available
   */
  static checkSolarApiAvailability(): {
    available: boolean;
    message: string;
  } {
    if (!this.USE_REAL_DATA) {
      return {
        available: false,
        message: 'Solar API disabled - using mock data for development'
      };
    }

    if (this.SOLAR_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      return {
        available: false,
        message: 'Solar API key not configured'
      };
    }

    return {
      available: true,
      message: 'Google Solar API ready'
    };
  }
}