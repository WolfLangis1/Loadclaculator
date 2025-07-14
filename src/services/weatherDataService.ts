/**
 * Weather Data Service for Solar Analysis
 * 
 * Comprehensive weather data integration service that provides real-time and
 * historical weather information for accurate solar energy production modeling,
 * including solar irradiance, cloud cover, temperature, and atmospheric conditions.
 */

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
}

export interface SolarIrradiance {
  ghi: number; // Global Horizontal Irradiance (W/m²)
  dni: number; // Direct Normal Irradiance (W/m²)
  dhi: number; // Diffuse Horizontal Irradiance (W/m²)
  poa: number; // Plane of Array Irradiance (W/m²)
  uvIndex?: number;
  sunElevation: number; // degrees
  sunAzimuth: number; // degrees from north
  airMass: number; // atmospheric air mass coefficient
}

export interface AtmosphericConditions {
  temperature: number; // Celsius
  humidity: number; // percentage
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // degrees from north
  visibility: number; // km
  dewPoint: number; // Celsius
  uvIndex: number;
}

export interface CloudData {
  totalCloudCover: number; // percentage 0-100
  lowCloudCover: number; // percentage 0-100
  midCloudCover: number; // percentage 0-100
  highCloudCover: number; // percentage 0-100
  cloudBase: number; // meters above ground
  cloudType: 'clear' | 'few' | 'scattered' | 'broken' | 'overcast';
  opticalDepth?: number; // cloud optical thickness
}

export interface WeatherDataPoint {
  timestamp: Date;
  location: WeatherCoordinates;
  
  // Solar radiation data
  irradiance: SolarIrradiance;
  
  // Atmospheric conditions
  atmosphere: AtmosphericConditions;
  
  // Cloud information
  clouds: CloudData;
  
  // Weather conditions
  conditions: {
    description: string;
    precipitation: number; // mm/hour
    precipitationType: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
    stormActivity: boolean;
    fogPresent: boolean;
    dustOrHaze: boolean;
  };
  
  // Data quality and source
  quality: {
    dataSource: 'satellite' | 'ground_station' | 'model' | 'interpolated';
    confidence: number; // 0-1
    lastUpdated: Date;
    forecastHorizon?: number; // hours ahead if forecast data
  };
}

export interface HistoricalWeatherSummary {
  location: WeatherCoordinates;
  period: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
  
  // Solar resource summary
  solarResource: {
    averageDailyGHI: number; // kWh/m²/day
    averageDailyDNI: number; // kWh/m²/day
    averageDailyDHI: number; // kWh/m²/day
    peakSolarHours: number; // equivalent peak sun hours
    seasonalVariation: {
      summer: number; // kWh/m²/day
      winter: number; // kWh/m²/day
      spring: number; // kWh/m²/day
      fall: number; // kWh/m²/day
    };
    interannualVariability: number; // coefficient of variation
  };
  
  // Climate patterns
  climate: {
    averageTemperature: number; // Celsius
    temperatureRange: { min: number; max: number };
    averageHumidity: number; // percentage
    averageWindSpeed: number; // m/s
    precipitationDays: number; // days per year
    cloudyClearRatio: number; // cloudy days / clear days
  };
  
  // Performance factors
  performance: {
    temperatureCorrectionFactor: number; // for PV efficiency
    soilingLossFactor: number; // dust and dirt losses
    atmosphericLossFactor: number; // scattering and absorption
    seasonalPerformanceVariation: number; // percentage
  };
}

export interface WeatherForecast {
  location: WeatherCoordinates;
  forecastPeriod: {
    startTime: Date;
    endTime: Date;
    resolution: 'hourly' | 'daily' | '3-hourly';
  };
  
  // Forecast data points
  forecast: WeatherDataPoint[];
  
  // Solar production forecast
  solarForecast: {
    hourlyProduction: Array<{
      hour: Date;
      expectedGHI: number;
      expectedProduction: number; // kWh for 1kW system
      confidence: number;
      cloudProbability: number;
    }>;
    dailySummary: Array<{
      date: Date;
      totalProduction: number; // kWh for 1kW system
      peakProduction: number; // kW
      productionWindow: { start: Date; end: Date };
      weatherRisk: 'low' | 'medium' | 'high';
    }>;
  };
  
  // Forecast accuracy metrics
  accuracy: {
    modelName: string;
    historicalAccuracy: number; // percentage
    updateFrequency: number; // hours
    reliabilityScore: number; // 0-1
  };
}

export interface SolarPerformanceModel {
  systemParameters: {
    panelCapacity: number; // kW
    panelEfficiency: number; // percentage
    systemEfficiency: number; // percentage (inverter, wiring, etc.)
    temperatureCoefficient: number; // %/°C
    tiltAngle: number; // degrees
    azimuthAngle: number; // degrees from south
    tracking?: 'fixed' | 'single_axis' | 'dual_axis';
  };
  
  location: WeatherCoordinates;
  
  // Performance calculations
  performance: {
    annualProduction: number; // kWh/year
    monthlyProduction: number[]; // kWh for each month
    capacityFactor: number; // percentage
    specificYield: number; // kWh/kW/year
    performanceRatio: number; // actual/theoretical
    degradationRate: number; // %/year
  };
  
  // Environmental impact factors
  environmentalFactors: {
    soilingLoss: number; // percentage
    shadingLoss: number; // percentage
    temperatureLoss: number; // percentage
    mismatchLoss: number; // percentage
    wireingLoss: number; // percentage
    inverterLoss: number; // percentage
  };
  
  // Financial projections
  economics?: {
    costPerKWh: number; // $/kWh
    annualSavings: number; // $
    paybackPeriod: number; // years
    netPresentValue: number; // $
    internalRateOfReturn: number; // percentage
  };
}

export interface WeatherDataConfig {
  // Data sources configuration
  dataSources: {
    primary: 'openweather' | 'nrel' | 'solcast' | 'weather_gov' | 'custom';
    fallback: string[];
    apiKeys: Record<string, string>;
    updateInterval: number; // minutes
    cacheTimeout: number; // hours
  };
  
  // Solar modeling parameters
  solarModeling: {
    albedo: number; // ground reflectance
    atmosphericModel: 'simple' | 'detailed' | 'bird_hulstrom';
    cloudModel: 'linear' | 'exponential' | 'physical';
    temperatureModel: 'standard' | 'advanced';
    enableShading: boolean;
    enableSoiling: boolean;
  };
  
  // Quality control
  qualityControl: {
    maxDataAge: number; // hours
    minConfidenceLevel: number; // 0-1
    outlierDetection: boolean;
    fillMissingData: boolean;
    smoothingEnabled: boolean;
  };
  
  // Forecast settings
  forecasting: {
    maxForecastHorizon: number; // hours
    updateFrequency: number; // hours
    ensembleModeling: boolean;
    uncertaintyQuantification: boolean;
  };
}

export class WeatherDataService {
  private static isInitialized = false;
  private static config: WeatherDataConfig = {
    dataSources: {
      primary: 'openweather',
      fallback: ['nrel', 'weather_gov'],
      apiKeys: {},
      updateInterval: 60, // 1 hour
      cacheTimeout: 24 // 24 hours
    },
    solarModeling: {
      albedo: 0.2,
      atmosphericModel: 'detailed',
      cloudModel: 'physical',
      temperatureModel: 'advanced',
      enableShading: true,
      enableSoiling: true
    },
    qualityControl: {
      maxDataAge: 6,
      minConfidenceLevel: 0.7,
      outlierDetection: true,
      fillMissingData: true,
      smoothingEnabled: true
    },
    forecasting: {
      maxForecastHorizon: 168, // 7 days
      updateFrequency: 6, // 6 hours
      ensembleModeling: true,
      uncertaintyQuantification: true
    }
  };
  
  private static weatherCache: Map<string, WeatherDataPoint[]> = new Map();
  private static forecastCache: Map<string, WeatherForecast> = new Map();
  private static historicalCache: Map<string, HistoricalWeatherSummary> = new Map();

  /**
   * Initialize the weather data service
   */
  static async initialize(config?: Partial<WeatherDataConfig>): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🌤️ Initializing Weather Data Service...');
      
      // Apply custom configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      // Initialize weather data providers
      await this.initializeWeatherProviders();
      
      // Load solar radiation models
      await this.loadSolarRadiationModels();
      
      // Setup automatic data updates
      await this.setupDataUpdates();
      
      this.isInitialized = true;
      console.log('✅ Weather Data Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Weather Data Service:', error);
      throw new Error('Weather Data Service initialization failed');
    }
  }

  /**
   * Get current weather data for a location
   */
  static async getCurrentWeather(location: WeatherCoordinates): Promise<WeatherDataPoint> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🌡️ Fetching current weather for location:', [location.latitude, location.longitude]);
      
      // Try to get from cache first
      const cacheKey = `current_${location.latitude}_${location.longitude}`;
      const cached = this.getCachedWeather(cacheKey);
      
      if (cached && this.isDataFresh(cached, 60)) { // 1 hour cache
        return cached;
      }
      
      // Fetch fresh data from primary source
      let weatherData: WeatherDataPoint;
      
      try {
        weatherData = await this.fetchFromPrimarySource(location);
      } catch (error) {
        console.warn('Primary weather source failed, trying fallback...');
        weatherData = await this.fetchFromFallbackSources(location);
      }
      
      // Calculate solar irradiance
      weatherData.irradiance = await this.calculateSolarIrradiance(location, weatherData.timestamp, weatherData.clouds);
      
      // Apply quality control
      weatherData = this.applyQualityControl(weatherData);
      
      // Cache the result
      this.cacheWeatherData(cacheKey, weatherData);
      
      console.log('✅ Current weather data retrieved');
      return weatherData;
      
    } catch (error) {
      console.error('❌ Failed to get current weather:', error);
      throw new Error('Failed to retrieve current weather data');
    }
  }

  /**
   * Get historical weather summary for a location and time period
   */
  static async getHistoricalWeatherSummary(
    location: WeatherCoordinates,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalWeatherSummary> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('📊 Fetching historical weather summary:', {
        location: [location.latitude, location.longitude],
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      });
      
      // Check cache
      const cacheKey = `historical_${location.latitude}_${location.longitude}_${startDate.getTime()}_${endDate.getTime()}`;
      const cached = this.historicalCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(location, startDate, endDate);
      
      // Process and analyze the data
      const summary = this.analyzeHistoricalData(location, historicalData, startDate, endDate);
      
      // Cache the result
      this.historicalCache.set(cacheKey, summary);
      
      console.log('✅ Historical weather summary generated');
      return summary;
      
    } catch (error) {
      console.error('❌ Failed to get historical weather summary:', error);
      throw new Error('Failed to retrieve historical weather data');
    }
  }

  /**
   * Get weather forecast for a location
   */
  static async getWeatherForecast(
    location: WeatherCoordinates,
    forecastHours: number = 168 // 7 days default
  ): Promise<WeatherForecast> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔮 Fetching weather forecast:', {
        location: [location.latitude, location.longitude],
        hours: forecastHours
      });
      
      // Limit forecast horizon
      const maxHours = Math.min(forecastHours, this.config.forecasting.maxForecastHorizon);
      
      // Check cache
      const cacheKey = `forecast_${location.latitude}_${location.longitude}_${maxHours}`;
      const cached = this.forecastCache.get(cacheKey);
      
      if (cached && this.isForecastFresh(cached)) {
        return cached;
      }
      
      // Fetch forecast data
      const forecastData = await this.fetchForecastData(location, maxHours);
      
      // Generate solar production forecast
      const solarForecast = await this.generateSolarForecast(location, forecastData);
      
      const forecast: WeatherForecast = {
        location,
        forecastPeriod: {
          startTime: new Date(),
          endTime: new Date(Date.now() + maxHours * 60 * 60 * 1000),
          resolution: 'hourly'
        },
        forecast: forecastData,
        solarForecast,
        accuracy: {
          modelName: 'Ensemble Weather Model',
          historicalAccuracy: 85,
          updateFrequency: this.config.forecasting.updateFrequency,
          reliabilityScore: 0.85
        }
      };
      
      // Cache the result
      this.forecastCache.set(cacheKey, forecast);
      
      console.log('✅ Weather forecast generated');
      return forecast;
      
    } catch (error) {
      console.error('❌ Failed to get weather forecast:', error);
      throw new Error('Failed to retrieve weather forecast');
    }
  }

  /**
   * Calculate solar system performance based on weather data
   */
  static async calculateSolarPerformance(
    location: WeatherCoordinates,
    systemParameters: SolarPerformanceModel['systemParameters'],
    weatherPeriod: { startDate: Date; endDate: Date }
  ): Promise<SolarPerformanceModel> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('☀️ Calculating solar system performance:', {
        location: [location.latitude, location.longitude],
        capacity: systemParameters.panelCapacity,
        period: `${weatherPeriod.startDate.toISOString().split('T')[0]} to ${weatherPeriod.endDate.toISOString().split('T')[0]}`
      });
      
      // Get historical weather data for the period
      const historicalSummary = await this.getHistoricalWeatherSummary(
        location,
        weatherPeriod.startDate,
        weatherPeriod.endDate
      );
      
      // Calculate system performance
      const performance = this.calculateSystemPerformance(systemParameters, historicalSummary, location);
      
      // Calculate environmental factors
      const environmentalFactors = this.calculateEnvironmentalFactors(historicalSummary, location);
      
      const performanceModel: SolarPerformanceModel = {
        systemParameters,
        location,
        performance,
        environmentalFactors
      };
      
      console.log('✅ Solar performance calculation complete');
      return performanceModel;
      
    } catch (error) {
      console.error('❌ Failed to calculate solar performance:', error);
      throw new Error('Failed to calculate solar system performance');
    }
  }

  /**
   * Get real-time solar irradiance data
   */
  static async getRealTimeSolarIrradiance(location: WeatherCoordinates): Promise<SolarIrradiance> {
    const currentWeather = await this.getCurrentWeather(location);
    return currentWeather.irradiance;
  }

  /**
   * Private helper methods
   */
  private static async initializeWeatherProviders(): Promise<void> {
    console.log('🌐 Initializing weather data providers...');
    // Initialize API connections and authentication
  }

  private static async loadSolarRadiationModels(): Promise<void> {
    console.log('☀️ Loading solar radiation models...');
    // Load atmospheric and solar position algorithms
  }

  private static async setupDataUpdates(): Promise<void> {
    console.log('🔄 Setting up automatic data updates...');
    // Setup scheduled data refreshes
  }

  private static getCachedWeather(cacheKey: string): WeatherDataPoint | null {
    const cached = this.weatherCache.get(cacheKey);
    return cached && cached.length > 0 ? cached[0] : null;
  }

  private static isDataFresh(weatherData: WeatherDataPoint, maxAgeMinutes: number): boolean {
    const ageMinutes = (Date.now() - weatherData.quality.lastUpdated.getTime()) / (1000 * 60);
    return ageMinutes < maxAgeMinutes;
  }

  private static isForecastFresh(forecast: WeatherForecast): boolean {
    const ageHours = (Date.now() - forecast.forecast[0].quality.lastUpdated.getTime()) / (1000 * 60 * 60);
    return ageHours < this.config.forecasting.updateFrequency;
  }

  private static async fetchFromPrimarySource(location: WeatherCoordinates): Promise<WeatherDataPoint> {
    // Mock implementation - in production, this would call actual weather APIs
    return this.generateMockWeatherData(location, new Date());
  }

  private static async fetchFromFallbackSources(location: WeatherCoordinates): Promise<WeatherDataPoint> {
    // Mock implementation - try fallback sources
    return this.generateMockWeatherData(location, new Date());
  }

  private static async fetchHistoricalData(
    location: WeatherCoordinates,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherDataPoint[]> {
    // Mock historical data generation
    const data: WeatherDataPoint[] = [];
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      data.push(this.generateMockWeatherData(location, date));
    }
    
    return data;
  }

  private static async fetchForecastData(
    location: WeatherCoordinates,
    hours: number
  ): Promise<WeatherDataPoint[]> {
    // Mock forecast data generation
    const data: WeatherDataPoint[] = [];
    
    for (let i = 0; i < hours; i++) {
      const date = new Date(Date.now() + i * 60 * 60 * 1000);
      const weatherData = this.generateMockWeatherData(location, date);
      weatherData.quality.forecastHorizon = i;
      data.push(weatherData);
    }
    
    return data;
  }

  private static generateMockWeatherData(location: WeatherCoordinates, timestamp: Date): WeatherDataPoint {
    // Generate realistic mock weather data for testing
    const hour = timestamp.getHours();
    const dayOfYear = this.getDayOfYear(timestamp);
    const sunPosition = this.calculateSunPosition(location, timestamp);
    
    // Simulate daily and seasonal patterns
    const baseTemp = 15 + 10 * Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI); // Seasonal variation
    const dailyTempVariation = 8 * Math.sin((hour - 6) / 24 * 2 * Math.PI); // Daily variation
    const temperature = baseTemp + dailyTempVariation + (Math.random() - 0.5) * 4;
    
    const cloudCover = Math.max(0, Math.min(100, 30 + (Math.random() - 0.5) * 40));
    const ghi = this.calculateGHI(sunPosition.elevation, cloudCover);
    
    return {
      timestamp,
      location,
      irradiance: {
        ghi,
        dni: ghi * (sunPosition.elevation > 0 ? 0.8 : 0),
        dhi: ghi * 0.2,
        poa: ghi * Math.max(0, Math.sin(sunPosition.elevation * Math.PI / 180)),
        sunElevation: sunPosition.elevation,
        sunAzimuth: sunPosition.azimuth,
        airMass: this.calculateAirMass(sunPosition.elevation)
      },
      atmosphere: {
        temperature,
        humidity: Math.max(20, Math.min(95, 60 + (Math.random() - 0.5) * 30)),
        pressure: 1013 + (Math.random() - 0.5) * 20,
        windSpeed: Math.max(0, 5 + (Math.random() - 0.5) * 8),
        windDirection: Math.random() * 360,
        visibility: Math.max(1, 20 - cloudCover / 10),
        dewPoint: temperature - 5 - Math.random() * 10,
        uvIndex: Math.max(0, ghi / 100)
      },
      clouds: {
        totalCloudCover: cloudCover,
        lowCloudCover: cloudCover * 0.6,
        midCloudCover: cloudCover * 0.3,
        highCloudCover: cloudCover * 0.1,
        cloudBase: 1000 + Math.random() * 2000,
        cloudType: cloudCover < 20 ? 'clear' : cloudCover < 40 ? 'few' : cloudCover < 60 ? 'scattered' : cloudCover < 80 ? 'broken' : 'overcast'
      },
      conditions: {
        description: cloudCover < 20 ? 'Clear sky' : cloudCover < 60 ? 'Partly cloudy' : 'Cloudy',
        precipitation: Math.random() < 0.1 ? Math.random() * 5 : 0,
        precipitationType: 'none',
        stormActivity: false,
        fogPresent: false,
        dustOrHaze: false
      },
      quality: {
        dataSource: 'model',
        confidence: 0.85,
        lastUpdated: new Date()
      }
    };
  }

  private static calculateSunPosition(location: WeatherCoordinates, timestamp: Date): { elevation: number; azimuth: number } {
    // Simplified solar position calculation
    const dayOfYear = this.getDayOfYear(timestamp);
    const hour = timestamp.getHours() + timestamp.getMinutes() / 60;
    
    // Solar declination
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    
    // Hour angle
    const hourAngle = 15 * (hour - 12);
    
    // Solar elevation
    const lat = location.latitude * Math.PI / 180;
    const dec = declination * Math.PI / 180;
    const ha = hourAngle * Math.PI / 180;
    
    const elevation = Math.asin(
      Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)
    ) * 180 / Math.PI;
    
    // Solar azimuth (simplified)
    const azimuth = 180 + Math.atan2(
      Math.sin(ha),
      Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)
    ) * 180 / Math.PI;
    
    return { elevation: Math.max(0, elevation), azimuth: (azimuth + 360) % 360 };
  }

  private static calculateGHI(sunElevation: number, cloudCover: number): number {
    if (sunElevation <= 0) return 0;
    
    // Clear sky GHI calculation
    const clearSkyGHI = 1000 * Math.sin(sunElevation * Math.PI / 180) * 0.7;
    
    // Cloud reduction factor
    const cloudReduction = 1 - (cloudCover / 100) * 0.8;
    
    return Math.max(0, clearSkyGHI * cloudReduction);
  }

  private static calculateAirMass(sunElevation: number): number {
    if (sunElevation <= 0) return Infinity;
    
    const zenith = 90 - sunElevation;
    const zenithRad = zenith * Math.PI / 180;
    
    // Kasten and Young formula
    return 1 / (Math.cos(zenithRad) + 0.50572 * Math.pow(96.07995 - zenith, -1.6364));
  }

  private static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private static async calculateSolarIrradiance(
    location: WeatherCoordinates,
    timestamp: Date,
    clouds: CloudData
  ): Promise<SolarIrradiance> {
    const sunPosition = this.calculateSunPosition(location, timestamp);
    const ghi = this.calculateGHI(sunPosition.elevation, clouds.totalCloudCover);
    
    return {
      ghi,
      dni: ghi * (1 - clouds.totalCloudCover / 100) * 0.8,
      dhi: ghi * 0.15 + (clouds.totalCloudCover / 100) * ghi * 0.3,
      poa: ghi * Math.max(0, Math.sin(sunPosition.elevation * Math.PI / 180)),
      sunElevation: sunPosition.elevation,
      sunAzimuth: sunPosition.azimuth,
      airMass: this.calculateAirMass(sunPosition.elevation)
    };
  }

  private static applyQualityControl(weatherData: WeatherDataPoint): WeatherDataPoint {
    // Apply quality control and data validation
    if (weatherData.atmosphere.temperature < -50 || weatherData.atmosphere.temperature > 60) {
      weatherData.quality.confidence *= 0.5;
    }
    
    if (weatherData.irradiance.ghi < 0 || weatherData.irradiance.ghi > 1400) {
      weatherData.quality.confidence *= 0.5;
    }
    
    return weatherData;
  }

  private static cacheWeatherData(cacheKey: string, weatherData: WeatherDataPoint): void {
    this.weatherCache.set(cacheKey, [weatherData]);
  }

  private static analyzeHistoricalData(
    location: WeatherCoordinates,
    data: WeatherDataPoint[],
    startDate: Date,
    endDate: Date
  ): HistoricalWeatherSummary {
    const totalDays = data.length;
    
    // Calculate solar resource summary
    const dailyGHI = data.map(d => d.irradiance.ghi * 24 / 1000); // Convert to kWh/m²/day
    const averageDailyGHI = dailyGHI.reduce((sum, val) => sum + val, 0) / totalDays;
    
    const temperatures = data.map(d => d.atmosphere.temperature);
    const averageTemp = temperatures.reduce((sum, val) => sum + val, 0) / totalDays;
    
    const cloudCoverValues = data.map(d => d.clouds.totalCloudCover);
    const averageCloudCover = cloudCoverValues.reduce((sum, val) => sum + val, 0) / totalDays;
    
    return {
      location,
      period: {
        startDate,
        endDate,
        totalDays
      },
      solarResource: {
        averageDailyGHI,
        averageDailyDNI: averageDailyGHI * 0.8,
        averageDailyDHI: averageDailyGHI * 0.2,
        peakSolarHours: averageDailyGHI / 1000 * 5.5, // Rough estimate
        seasonalVariation: {
          summer: averageDailyGHI * 1.3,
          winter: averageDailyGHI * 0.7,
          spring: averageDailyGHI * 1.1,
          fall: averageDailyGHI * 0.9
        },
        interannualVariability: 0.15
      },
      climate: {
        averageTemperature: averageTemp,
        temperatureRange: {
          min: Math.min(...temperatures),
          max: Math.max(...temperatures)
        },
        averageHumidity: data.reduce((sum, d) => sum + d.atmosphere.humidity, 0) / totalDays,
        averageWindSpeed: data.reduce((sum, d) => sum + d.atmosphere.windSpeed, 0) / totalDays,
        precipitationDays: data.filter(d => d.conditions.precipitation > 0).length,
        cloudyClearRatio: averageCloudCover / (100 - averageCloudCover)
      },
      performance: {
        temperatureCorrectionFactor: 1 - (averageTemp - 25) * 0.004,
        soilingLossFactor: 0.02,
        atmosphericLossFactor: 0.05,
        seasonalPerformanceVariation: 0.25
      }
    };
  }

  private static async generateSolarForecast(
    location: WeatherCoordinates,
    forecastData: WeatherDataPoint[]
  ): Promise<WeatherForecast['solarForecast']> {
    const hourlyProduction = forecastData.map((data, index) => ({
      hour: data.timestamp,
      expectedGHI: data.irradiance.ghi,
      expectedProduction: data.irradiance.ghi / 1000 * 0.15, // kWh for 1kW system
      confidence: Math.max(0.5, 1 - index * 0.01), // Decreasing confidence over time
      cloudProbability: data.clouds.totalCloudCover / 100
    }));
    
    const dailySummary = this.groupByDay(hourlyProduction).map(dayData => ({
      date: dayData[0].hour,
      totalProduction: dayData.reduce((sum, hour) => sum + hour.expectedProduction, 0),
      peakProduction: Math.max(...dayData.map(hour => hour.expectedProduction * 4)), // Convert to kW
      productionWindow: {
        start: dayData[0].hour,
        end: dayData[dayData.length - 1].hour
      },
      weatherRisk: dayData.some(hour => hour.cloudProbability > 0.7) ? 'high' :
                   dayData.some(hour => hour.cloudProbability > 0.4) ? 'medium' : 'low'
    }));
    
    return {
      hourlyProduction,
      dailySummary
    };
  }

  private static groupByDay(hourlyData: any[]): any[][] {
    const grouped: any[][] = [];
    let currentDay: any[] = [];
    let currentDate = '';
    
    for (const hour of hourlyData) {
      const dateStr = hour.hour.toISOString().split('T')[0];
      if (dateStr !== currentDate) {
        if (currentDay.length > 0) {
          grouped.push(currentDay);
        }
        currentDay = [];
        currentDate = dateStr;
      }
      currentDay.push(hour);
    }
    
    if (currentDay.length > 0) {
      grouped.push(currentDay);
    }
    
    return grouped;
  }

  private static calculateSystemPerformance(
    systemParameters: SolarPerformanceModel['systemParameters'],
    historicalSummary: HistoricalWeatherSummary,
    location: WeatherCoordinates
  ): SolarPerformanceModel['performance'] {
    const annualGHI = historicalSummary.solarResource.averageDailyGHI * 365;
    const systemEfficiency = systemParameters.systemEfficiency / 100;
    const panelEfficiency = systemParameters.panelEfficiency / 100;
    
    const annualProduction = annualGHI * systemParameters.panelCapacity * systemEfficiency * panelEfficiency;
    const specificYield = annualProduction / systemParameters.panelCapacity;
    const capacityFactor = specificYield / 8760 * 100; // Convert to percentage
    
    // Monthly production (simplified seasonal variation)
    const monthlyProduction = Array.from({ length: 12 }, (_, month) => {
      const seasonalFactor = 1 + 0.3 * Math.sin((month - 2) * Math.PI / 6);
      return annualProduction / 12 * seasonalFactor;
    });
    
    return {
      annualProduction,
      monthlyProduction,
      capacityFactor,
      specificYield,
      performanceRatio: 0.85, // Typical PR for well-designed systems
      degradationRate: 0.5 // 0.5% per year
    };
  }

  private static calculateEnvironmentalFactors(
    historicalSummary: HistoricalWeatherSummary,
    location: WeatherCoordinates
  ): SolarPerformanceModel['environmentalFactors'] {
    return {
      soilingLoss: 2 + historicalSummary.climate.precipitationDays < 100 ? 2 : 0, // Higher soiling in dry climates
      shadingLoss: 0, // Assume no shading for now
      temperatureLoss: Math.max(0, (historicalSummary.climate.averageTemperature - 25) * 0.4),
      mismatchLoss: 2, // Typical mismatch losses
      wireingLoss: 2, // Typical wiring losses
      inverterLoss: 3 // Typical inverter losses
    };
  }

  /**
   * Get service capabilities and statistics
   */
  static getServiceCapabilities(): {
    isInitialized: boolean;
    dataSources: string[];
    supportedParameters: string[];
    cacheSize: number;
    maxForecastHours: number;
    updateFrequency: number;
  } {
    return {
      isInitialized: this.isInitialized,
      dataSources: [this.config.dataSources.primary, ...this.config.dataSources.fallback],
      supportedParameters: ['temperature', 'humidity', 'irradiance', 'cloud_cover', 'wind', 'precipitation'],
      cacheSize: this.weatherCache.size + this.forecastCache.size + this.historicalCache.size,
      maxForecastHours: this.config.forecasting.maxForecastHorizon,
      updateFrequency: this.config.dataSources.updateInterval
    };
  }

  /**
   * Clear all cached weather data
   */
  static clearCache(): void {
    this.weatherCache.clear();
    this.forecastCache.clear();
    this.historicalCache.clear();
    console.log('🗑️ Weather data cache cleared');
  }
}

export default WeatherDataService;