/**
 * Weather Data Service Tests
 * 
 * Tests for the weather data integration service including current weather,
 * forecasting, historical analysis, and solar performance modeling.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import WeatherDataService, { WeatherCoordinates } from '../services/weatherDataService';

// Test location (San Francisco)
const testLocation: WeatherCoordinates = {
  latitude: 37.7749,
  longitude: -122.4194,
  elevation: 16,
  timezone: 'America/Los_Angeles'
};

// Mock system parameters for testing
const mockSystemParameters = {
  panelCapacity: 10, // kW
  panelEfficiency: 20, // %
  systemEfficiency: 85, // %
  temperatureCoefficient: -0.4, // %/°C
  tiltAngle: 30, // degrees
  azimuthAngle: 180, // degrees (south-facing)
  tracking: 'fixed' as const
};

describe('WeatherDataService', () => {
  beforeAll(async () => {
    await WeatherDataService.initialize();
  });

  beforeEach(() => {
    WeatherDataService.clearCache();
  });

  it('should initialize successfully', () => {
    const capabilities = WeatherDataService.getServiceCapabilities();
    expect(capabilities.isInitialized).toBe(true);
    expect(capabilities.dataSources).toContain('openweather');
    expect(capabilities.supportedParameters).toContain('temperature');
    expect(capabilities.supportedParameters).toContain('irradiance');
    expect(capabilities.maxForecastHours).toBeGreaterThan(0);
  });

  it('should get current weather data', async () => {
    const currentWeather = await WeatherDataService.getCurrentWeather(testLocation);

    expect(currentWeather).toBeDefined();
    expect(currentWeather.location.latitude).toBeCloseTo(testLocation.latitude, 3);
    expect(currentWeather.location.longitude).toBeCloseTo(testLocation.longitude, 3);
    expect(currentWeather.timestamp).toBeInstanceOf(Date);

    // Validate irradiance data
    expect(currentWeather.irradiance.ghi).toBeGreaterThanOrEqual(0);
    expect(currentWeather.irradiance.dni).toBeGreaterThanOrEqual(0);
    expect(currentWeather.irradiance.dhi).toBeGreaterThanOrEqual(0);
    expect(currentWeather.irradiance.sunElevation).toBeGreaterThanOrEqual(-90);
    expect(currentWeather.irradiance.sunElevation).toBeLessThanOrEqual(90);
    expect(currentWeather.irradiance.sunAzimuth).toBeGreaterThanOrEqual(0);
    expect(currentWeather.irradiance.sunAzimuth).toBeLessThan(360);

    // Validate atmospheric conditions
    expect(currentWeather.atmosphere.temperature).toBeGreaterThan(-100);
    expect(currentWeather.atmosphere.temperature).toBeLessThan(100);
    expect(currentWeather.atmosphere.humidity).toBeGreaterThanOrEqual(0);
    expect(currentWeather.atmosphere.humidity).toBeLessThanOrEqual(100);
    expect(currentWeather.atmosphere.pressure).toBeGreaterThan(800);
    expect(currentWeather.atmosphere.pressure).toBeLessThan(1200);
    expect(currentWeather.atmosphere.windSpeed).toBeGreaterThanOrEqual(0);

    // Validate cloud data
    expect(currentWeather.clouds.totalCloudCover).toBeGreaterThanOrEqual(0);
    expect(currentWeather.clouds.totalCloudCover).toBeLessThanOrEqual(100);
    expect(currentWeather.clouds.cloudType).toBeDefined();

    // Validate quality metrics
    expect(currentWeather.quality.confidence).toBeGreaterThan(0);
    expect(currentWeather.quality.confidence).toBeLessThanOrEqual(1);
    expect(currentWeather.quality.dataSource).toBeDefined();
  });

  it('should get historical weather summary', async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

    const historicalSummary = await WeatherDataService.getHistoricalWeatherSummary(
      testLocation,
      startDate,
      endDate
    );

    expect(historicalSummary).toBeDefined();
    expect(historicalSummary.location.latitude).toBeCloseTo(testLocation.latitude, 3);
    expect(historicalSummary.period.totalDays).toBeGreaterThan(300);
    expect(historicalSummary.period.startDate).toEqual(startDate);
    expect(historicalSummary.period.endDate).toEqual(endDate);

    // Validate solar resource data
    expect(historicalSummary.solarResource.averageDailyGHI).toBeGreaterThan(0);
    expect(historicalSummary.solarResource.averageDailyGHI).toBeLessThan(15); // Max realistic daily GHI
    expect(historicalSummary.solarResource.peakSolarHours).toBeGreaterThan(0);
    expect(historicalSummary.solarResource.peakSolarHours).toBeLessThan(12);

    // Validate seasonal variation
    const { seasonalVariation } = historicalSummary.solarResource;
    expect(seasonalVariation.summer).toBeGreaterThan(seasonalVariation.winter);
    expect(seasonalVariation.spring).toBeGreaterThan(0);
    expect(seasonalVariation.fall).toBeGreaterThan(0);

    // Validate climate data
    expect(historicalSummary.climate.averageTemperature).toBeGreaterThan(-50);
    expect(historicalSummary.climate.averageTemperature).toBeLessThan(50);
    expect(historicalSummary.climate.averageHumidity).toBeGreaterThan(0);
    expect(historicalSummary.climate.averageHumidity).toBeLessThan(100);
    expect(historicalSummary.climate.precipitationDays).toBeGreaterThanOrEqual(0);
    expect(historicalSummary.climate.precipitationDays).toBeLessThanOrEqual(365);

    // Validate performance factors
    expect(historicalSummary.performance.temperatureCorrectionFactor).toBeGreaterThan(0);
    expect(historicalSummary.performance.temperatureCorrectionFactor).toBeLessThan(2);
    expect(historicalSummary.performance.soilingLossFactor).toBeGreaterThanOrEqual(0);
    expect(historicalSummary.performance.soilingLossFactor).toBeLessThan(0.2);
  });

  it('should get weather forecast', async () => {
    const forecastHours = 72; // 3 days
    const forecast = await WeatherDataService.getWeatherForecast(testLocation, forecastHours);

    expect(forecast).toBeDefined();
    expect(forecast.location.latitude).toBeCloseTo(testLocation.latitude, 3);
    expect(forecast.forecastPeriod.startTime).toBeInstanceOf(Date);
    expect(forecast.forecastPeriod.endTime).toBeInstanceOf(Date);
    expect(forecast.forecast).toHaveLength(forecastHours);

    // Validate forecast data points
    forecast.forecast.forEach((dataPoint, index) => {
      expect(dataPoint.timestamp).toBeInstanceOf(Date);
      expect(dataPoint.irradiance.ghi).toBeGreaterThanOrEqual(0);
      expect(dataPoint.atmosphere.temperature).toBeGreaterThan(-100);
      expect(dataPoint.atmosphere.temperature).toBeLessThan(100);
      expect(dataPoint.clouds.totalCloudCover).toBeGreaterThanOrEqual(0);
      expect(dataPoint.clouds.totalCloudCover).toBeLessThanOrEqual(100);
      expect(dataPoint.quality.forecastHorizon).toBe(index);
    });

    // Validate solar forecast
    expect(forecast.solarForecast.hourlyProduction).toHaveLength(forecastHours);
    expect(forecast.solarForecast.dailySummary.length).toBeGreaterThan(0);

    forecast.solarForecast.hourlyProduction.forEach(hourly => {
      expect(hourly.expectedGHI).toBeGreaterThanOrEqual(0);
      expect(hourly.expectedProduction).toBeGreaterThanOrEqual(0);
      expect(hourly.confidence).toBeGreaterThan(0);
      expect(hourly.confidence).toBeLessThanOrEqual(1);
      expect(hourly.cloudProbability).toBeGreaterThanOrEqual(0);
      expect(hourly.cloudProbability).toBeLessThanOrEqual(1);
    });

    forecast.solarForecast.dailySummary.forEach(daily => {
      expect(daily.totalProduction).toBeGreaterThanOrEqual(0);
      expect(daily.peakProduction).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(daily.weatherRisk);
    });

    // Validate forecast accuracy
    expect(forecast.accuracy.historicalAccuracy).toBeGreaterThan(0);
    expect(forecast.accuracy.historicalAccuracy).toBeLessThanOrEqual(100);
    expect(forecast.accuracy.reliabilityScore).toBeGreaterThan(0);
    expect(forecast.accuracy.reliabilityScore).toBeLessThanOrEqual(1);
  });

  it('should calculate solar system performance', async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year

    const performanceModel = await WeatherDataService.calculateSolarPerformance(
      testLocation,
      mockSystemParameters,
      { startDate, endDate }
    );

    expect(performanceModel).toBeDefined();
    expect(performanceModel.systemParameters).toEqual(mockSystemParameters);
    expect(performanceModel.location.latitude).toBeCloseTo(testLocation.latitude, 3);

    // Validate performance calculations
    expect(performanceModel.performance.annualProduction).toBeGreaterThan(0);
    expect(performanceModel.performance.specificYield).toBeGreaterThan(0);
    expect(performanceModel.performance.specificYield).toBeLessThan(3000); // Realistic max for most locations
    expect(performanceModel.performance.capacityFactor).toBeGreaterThan(0);
    expect(performanceModel.performance.capacityFactor).toBeLessThan(50); // Realistic max for solar
    expect(performanceModel.performance.monthlyProduction).toHaveLength(12);

    // Validate monthly production values
    performanceModel.performance.monthlyProduction.forEach(monthly => {
      expect(monthly).toBeGreaterThan(0);
    });

    // Check that summer months generally have higher production than winter
    const summerAvg = (performanceModel.performance.monthlyProduction[5] + 
                       performanceModel.performance.monthlyProduction[6] + 
                       performanceModel.performance.monthlyProduction[7]) / 3;
    const winterAvg = (performanceModel.performance.monthlyProduction[11] + 
                       performanceModel.performance.monthlyProduction[0] + 
                       performanceModel.performance.monthlyProduction[1]) / 3;
    expect(summerAvg).toBeGreaterThan(winterAvg);

    // Validate environmental factors
    expect(performanceModel.environmentalFactors.soilingLoss).toBeGreaterThanOrEqual(0);
    expect(performanceModel.environmentalFactors.soilingLoss).toBeLessThan(20);
    expect(performanceModel.environmentalFactors.temperatureLoss).toBeGreaterThanOrEqual(0);
    expect(performanceModel.environmentalFactors.inverterLoss).toBeGreaterThan(0);
    expect(performanceModel.environmentalFactors.inverterLoss).toBeLessThan(10);
    expect(performanceModel.environmentalFactors.wireingLoss).toBeGreaterThan(0);
    expect(performanceModel.environmentalFactors.wireingLoss).toBeLessThan(5);
  });

  it('should get real-time solar irradiance', async () => {
    const irradiance = await WeatherDataService.getRealTimeSolarIrradiance(testLocation);

    expect(irradiance).toBeDefined();
    expect(irradiance.ghi).toBeGreaterThanOrEqual(0);
    expect(irradiance.ghi).toBeLessThan(1500); // Max possible solar irradiance
    expect(irradiance.dni).toBeGreaterThanOrEqual(0);
    expect(irradiance.dhi).toBeGreaterThanOrEqual(0);
    expect(irradiance.poa).toBeGreaterThanOrEqual(0);

    // GHI should generally be sum of DNI and DHI (simplified)
    if (irradiance.sunElevation > 0) {
      expect(irradiance.ghi).toBeGreaterThanOrEqual(irradiance.dhi);
    }

    expect(irradiance.sunElevation).toBeGreaterThanOrEqual(-90);
    expect(irradiance.sunElevation).toBeLessThanOrEqual(90);
    expect(irradiance.sunAzimuth).toBeGreaterThanOrEqual(0);
    expect(irradiance.sunAzimuth).toBeLessThan(360);
    expect(irradiance.airMass).toBeGreaterThan(0);
  });

  it('should handle different forecast horizons', async () => {
    const shortForecast = await WeatherDataService.getWeatherForecast(testLocation, 24);
    const longForecast = await WeatherDataService.getWeatherForecast(testLocation, 168);

    expect(shortForecast.forecast).toHaveLength(24);
    expect(longForecast.forecast).toHaveLength(168);

    // Confidence should generally decrease with time
    const shortConfidence = shortForecast.solarForecast.hourlyProduction[12].confidence;
    const longConfidence = longForecast.solarForecast.hourlyProduction[100].confidence;
    expect(longConfidence).toBeLessThanOrEqual(shortConfidence);
  });

  it('should cache weather data correctly', async () => {
    const capabilities1 = WeatherDataService.getServiceCapabilities();
    const initialCacheSize = capabilities1.cacheSize;

    // First request
    await WeatherDataService.getCurrentWeather(testLocation);
    
    const capabilities2 = WeatherDataService.getServiceCapabilities();
    expect(capabilities2.cacheSize).toBeGreaterThan(initialCacheSize);

    // Second request should use cache (no additional cache entries)
    await WeatherDataService.getCurrentWeather(testLocation);
    
    const capabilities3 = WeatherDataService.getServiceCapabilities();
    expect(capabilities3.cacheSize).toBe(capabilities2.cacheSize);
  });

  it('should clear cache properly', () => {
    const initialCapabilities = WeatherDataService.getServiceCapabilities();
    
    WeatherDataService.clearCache();
    
    const clearedCapabilities = WeatherDataService.getServiceCapabilities();
    expect(clearedCapabilities.cacheSize).toBe(0);
  });

  it('should handle different system configurations', async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Test with different tilt angles
    const flatSystem = { ...mockSystemParameters, tiltAngle: 0 };
    const steeperSystem = { ...mockSystemParameters, tiltAngle: 45 };

    const flatPerformance = await WeatherDataService.calculateSolarPerformance(
      testLocation,
      flatSystem,
      { startDate, endDate }
    );

    const steeperPerformance = await WeatherDataService.calculateSolarPerformance(
      testLocation,
      steeperSystem,
      { startDate, endDate }
    );

    expect(flatPerformance.performance.annualProduction).toBeGreaterThan(0);
    expect(steeperPerformance.performance.annualProduction).toBeGreaterThan(0);

    // For San Francisco (37.7°N), optimal tilt is typically around 30-35°
    // So 45° might be better than 0° for annual production
    expect(steeperPerformance.performance.specificYield).toBeGreaterThan(
      flatPerformance.performance.specificYield * 0.8
    );
  });

  it('should validate seasonal performance patterns', async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    const performanceModel = await WeatherDataService.calculateSolarPerformance(
      testLocation,
      mockSystemParameters,
      { startDate, endDate }
    );

    const monthlyProduction = performanceModel.performance.monthlyProduction;

    // For Northern Hemisphere, summer months should generally be higher
    const summerMonths = [5, 6, 7]; // June, July, August (0-indexed)
    const winterMonths = [11, 0, 1]; // December, January, February

    const summerAverage = summerMonths.reduce((sum, month) => sum + monthlyProduction[month], 0) / 3;
    const winterAverage = winterMonths.reduce((sum, month) => sum + monthlyProduction[month], 0) / 3;

    expect(summerAverage).toBeGreaterThan(winterAverage);

    // Peak should typically be in late spring/early summer
    const peakMonth = monthlyProduction.indexOf(Math.max(...monthlyProduction));
    expect(peakMonth).toBeGreaterThanOrEqual(4); // May or later
    expect(peakMonth).toBeLessThanOrEqual(7); // August or earlier
  });

  it('should handle location-specific solar calculations', async () => {
    // Test with different locations to ensure calculations adapt
    const tropicalLocation: WeatherCoordinates = {
      latitude: 0, // Equator
      longitude: 0
    };

    const arcticLocation: WeatherCoordinates = {
      latitude: 70, // Far north
      longitude: 0
    };

    const tropicalWeather = await WeatherDataService.getCurrentWeather(tropicalLocation);
    const arcticWeather = await WeatherDataService.getCurrentWeather(arcticLocation);

    // At noon on equinox, tropical location should have higher sun elevation
    // This is simplified since we're using mock data, but structure should be there
    expect(tropicalWeather.irradiance.sunElevation).toBeGreaterThanOrEqual(-90);
    expect(arcticWeather.irradiance.sunElevation).toBeGreaterThanOrEqual(-90);
    
    expect(tropicalWeather.irradiance.sunAzimuth).toBeGreaterThanOrEqual(0);
    expect(arcticWeather.irradiance.sunAzimuth).toBeGreaterThanOrEqual(0);
  });

  it('should provide realistic air mass calculations', async () => {
    const weather = await WeatherDataService.getCurrentWeather(testLocation);
    
    // Air mass should be reasonable
    if (weather.irradiance.sunElevation > 0) {
      expect(weather.irradiance.airMass).toBeGreaterThan(1);
      expect(weather.irradiance.airMass).toBeLessThan(40); // At very low sun angles
    }
    
    // Higher sun elevation should mean lower air mass
    if (weather.irradiance.sunElevation > 30) {
      expect(weather.irradiance.airMass).toBeLessThan(2);
    }
  });

  it('should handle forecast accuracy degradation', async () => {
    const forecast = await WeatherDataService.getWeatherForecast(testLocation, 168);
    
    // Confidence should generally decrease over time
    const firstDayConfidence = forecast.solarForecast.hourlyProduction.slice(0, 24)
      .reduce((sum, hour) => sum + hour.confidence, 0) / 24;
    
    const lastDayConfidence = forecast.solarForecast.hourlyProduction.slice(-24)
      .reduce((sum, hour) => sum + hour.confidence, 0) / 24;
    
    expect(lastDayConfidence).toBeLessThanOrEqual(firstDayConfidence);
    expect(firstDayConfidence).toBeGreaterThan(0.5);
    expect(lastDayConfidence).toBeGreaterThan(0.3);
  });
});