/**
 * Weather Data Overlay Panel
 * 
 * Interactive weather data visualization and analysis component that provides
 * real-time and historical weather information for enhanced solar analysis
 * and energy production modeling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  Sun,
  Thermometer,
  Wind,
  Droplets,
  Eye,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Target,
  Gauge,
  Layers,
  Timer
} from 'lucide-react';

import WeatherDataService, {
  WeatherDataPoint,
  WeatherForecast,
  HistoricalWeatherSummary,
  SolarPerformanceModel,
  WeatherCoordinates
} from '../../services/weatherDataService';

interface WeatherOverlayPanelProps {
  location?: WeatherCoordinates;
  systemParameters?: SolarPerformanceModel['systemParameters'];
  onWeatherUpdate?: (weather: WeatherDataPoint) => void;
  onPerformanceUpdate?: (performance: SolarPerformanceModel) => void;
  className?: string;
}

interface WeatherDisplayMode {
  current: boolean;
  forecast: boolean;
  historical: boolean;
  performance: boolean;
}

export const WeatherOverlayPanel: React.FC<WeatherOverlayPanelProps> = ({
  location,
  systemParameters,
  onWeatherUpdate,
  onPerformanceUpdate,
  className = ''
}) => {
  // Core state
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<WeatherDataPoint | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [historicalSummary, setHistoricalSummary] = useState<HistoricalWeatherSummary | null>(null);
  const [performanceModel, setPerformanceModel] = useState<SolarPerformanceModel | null>(null);

  // UI state
  const [displayMode, setDisplayMode] = useState<WeatherDisplayMode>({
    current: true,
    forecast: false,
    historical: false,
    performance: false
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time range state
  const [forecastHours, setForecastHours] = useState(72); // 3 days
  const [historicalDays, setHistoricalDays] = useState(365); // 1 year

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await WeatherDataService.initialize({
          dataSources: {
            primary: 'openweather',
            fallback: ['nrel', 'weather_gov'],
            apiKeys: {},
            updateInterval: 60,
            cacheTimeout: 24
          }
        });
        setIsInitialized(true);
        console.log('🌤️ Weather Overlay Panel initialized');
      } catch (error) {
        console.error('❌ Failed to initialize weather service:', error);
        setError('Failed to initialize weather service');
      }
    };

    initializeService();
  }, []);

  // Load initial weather data when location is available
  useEffect(() => {
    if (isInitialized && location) {
      loadAllWeatherData();
    }
  }, [isInitialized, location]);

  // Auto-refresh current weather data
  useEffect(() => {
    if (!autoRefresh || !isInitialized || !location) return;

    const interval = setInterval(() => {
      if (displayMode.current) {
        loadCurrentWeather();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, isInitialized, location, displayMode.current]);

  // Load all weather data
  const loadAllWeatherData = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      // Load data in parallel
      const promises = [];

      if (displayMode.current) {
        promises.push(loadCurrentWeather());
      }

      if (displayMode.forecast) {
        promises.push(loadForecast());
      }

      if (displayMode.historical) {
        promises.push(loadHistoricalData());
      }

      if (displayMode.performance && systemParameters) {
        promises.push(loadPerformanceModel());
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('❌ Failed to load weather data:', error);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, [location, displayMode, systemParameters, forecastHours, historicalDays]);

  // Load current weather
  const loadCurrentWeather = useCallback(async () => {
    if (!location) return;

    try {
      const weather = await WeatherDataService.getCurrentWeather(location);
      setCurrentWeather(weather);
      onWeatherUpdate?.(weather);
    } catch (error) {
      console.error('Failed to load current weather:', error);
      throw error;
    }
  }, [location, onWeatherUpdate]);

  // Load weather forecast
  const loadForecast = useCallback(async () => {
    if (!location) return;

    try {
      const forecastData = await WeatherDataService.getWeatherForecast(location, forecastHours);
      setForecast(forecastData);
    } catch (error) {
      console.error('Failed to load forecast:', error);
      throw error;
    }
  }, [location, forecastHours]);

  // Load historical weather data
  const loadHistoricalData = useCallback(async () => {
    if (!location) return;

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - historicalDays * 24 * 60 * 60 * 1000);
      const historical = await WeatherDataService.getHistoricalWeatherSummary(location, startDate, endDate);
      setHistoricalSummary(historical);
    } catch (error) {
      console.error('Failed to load historical data:', error);
      throw error;
    }
  }, [location, historicalDays]);

  // Load solar performance model
  const loadPerformanceModel = useCallback(async () => {
    if (!location || !systemParameters) return;

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
      const performance = await WeatherDataService.calculateSolarPerformance(
        location,
        systemParameters,
        { startDate, endDate }
      );
      setPerformanceModel(performance);
      onPerformanceUpdate?.(performance);
    } catch (error) {
      console.error('Failed to load performance model:', error);
      throw error;
    }
  }, [location, systemParameters, onPerformanceUpdate]);

  // Update display mode
  const updateDisplayMode = useCallback((mode: keyof WeatherDisplayMode, enabled: boolean) => {
    setDisplayMode(prev => ({ ...prev, [mode]: enabled }));
  }, []);

  // Format weather values
  const formatTemperature = (temp: number): string => `${temp.toFixed(1)}°C`;
  const formatIrradiance = (irr: number): string => `${irr.toFixed(0)} W/m²`;
  const formatWindSpeed = (speed: number): string => `${speed.toFixed(1)} m/s`;
  const formatHumidity = (humidity: number): string => `${humidity.toFixed(0)}%`;
  const formatPressure = (pressure: number): string => `${pressure.toFixed(0)} hPa`;

  if (!isInitialized) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Cloud className="h-5 w-5 animate-pulse" />
          <span>Initializing weather service...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Weather Data Overlay</h3>
            {location && (
              <span className="text-sm text-gray-600">
                {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Auto refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={loadAllWeatherData}
              disabled={loading || !location}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Display Mode Toggles */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[
            { key: 'current' as const, label: 'Current', icon: Clock },
            { key: 'forecast' as const, label: 'Forecast', icon: TrendingUp },
            { key: 'historical' as const, label: 'Historical', icon: Calendar },
            { key: 'performance' as const, label: 'Performance', icon: Zap, disabled: !systemParameters }
          ].map(({ key, label, icon: Icon, disabled }) => (
            <button
              key={key}
              onClick={() => updateDisplayMode(key, !displayMode[key])}
              disabled={disabled}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                displayMode[key]
                  ? 'bg-blue-100 text-blue-700'
                  : disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-2 text-blue-800">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading weather data...</span>
          </div>
        </div>
      )}

      {/* Current Weather */}
      {displayMode.current && currentWeather && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Current Conditions
            <span className="text-xs text-gray-500">
              {currentWeather.timestamp.toLocaleTimeString()}
            </span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Solar Irradiance */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Solar Irradiance</span>
              </div>
              <div className="text-lg font-bold text-yellow-900">
                {formatIrradiance(currentWeather.irradiance.ghi)}
              </div>
              <div className="text-xs text-yellow-700">
                DNI: {formatIrradiance(currentWeather.irradiance.dni)}
              </div>
            </div>

            {/* Temperature */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Temperature</span>
              </div>
              <div className="text-lg font-bold text-red-900">
                {formatTemperature(currentWeather.atmosphere.temperature)}
              </div>
              <div className="text-xs text-red-700">
                Humidity: {formatHumidity(currentWeather.atmosphere.humidity)}
              </div>
            </div>

            {/* Wind */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Wind</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatWindSpeed(currentWeather.atmosphere.windSpeed)}
              </div>
              <div className="text-xs text-blue-700">
                {currentWeather.atmosphere.windDirection}° from N
              </div>
            </div>

            {/* Cloud Cover */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Clouds</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {currentWeather.clouds.totalCloudCover.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-700">
                {currentWeather.clouds.cloudType}
              </div>
            </div>
          </div>

          {/* Solar Position */}
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Solar Position</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-orange-700">Elevation:</span>
                <span className="ml-2 font-medium">{currentWeather.irradiance.sunElevation.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-orange-700">Azimuth:</span>
                <span className="ml-2 font-medium">{currentWeather.irradiance.sunAzimuth.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-orange-700">Air Mass:</span>
                <span className="ml-2 font-medium">{currentWeather.irradiance.airMass.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      {displayMode.forecast && forecast && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Weather Forecast
            </h4>
            <select
              value={forecastHours}
              onChange={(e) => setForecastHours(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>7 days</option>
            </select>
          </div>

          {/* Solar Production Forecast */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Solar Production Forecast</h5>
            <div className="space-y-2">
              {forecast.solarForecast.dailySummary.slice(0, 3).map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-green-700">
                    {day.date.toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {day.totalProduction.toFixed(1)} kWh/kW
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      day.weatherRisk === 'low' ? 'bg-green-100 text-green-800' :
                      day.weatherRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {day.weatherRisk} risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Next 24 Hours</h5>
              {forecast.forecast.slice(0, 8).map((hour, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {hour.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formatTemperature(hour.atmosphere.temperature)}</span>
                    <span className="text-gray-500">|</span>
                    <span>{formatIrradiance(hour.irradiance.ghi)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Forecast Accuracy</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Model:</span>
                  <span className="font-medium">{forecast.accuracy.modelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Accuracy:</span>
                  <span className="font-medium">{forecast.accuracy.historicalAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Updates:</span>
                  <span className="font-medium">Every {forecast.accuracy.updateFrequency}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Summary */}
      {displayMode.historical && historicalSummary && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Historical Climate Data
            </h4>
            <select
              value={historicalDays}
              onChange={(e) => setHistoricalDays(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={90}>3 months</option>
              <option value={365}>1 year</option>
              <option value={1095}>3 years</option>
            </select>
          </div>

          {/* Solar Resource Summary */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Solar Resource</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">Daily Average GHI:</span>
                <span className="ml-2 font-bold">{historicalSummary.solarResource.averageDailyGHI.toFixed(1)} kWh/m²</span>
              </div>
              <div>
                <span className="text-yellow-700">Peak Sun Hours:</span>
                <span className="ml-2 font-bold">{historicalSummary.solarResource.peakSolarHours.toFixed(1)} h</span>
              </div>
            </div>
            
            <div className="mt-3">
              <h6 className="text-xs font-medium text-yellow-800 mb-1">Seasonal Variation</h6>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-yellow-700">Summer</div>
                  <div className="font-medium">{historicalSummary.solarResource.seasonalVariation.summer.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-700">Fall</div>
                  <div className="font-medium">{historicalSummary.solarResource.seasonalVariation.fall.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-700">Winter</div>
                  <div className="font-medium">{historicalSummary.solarResource.seasonalVariation.winter.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-700">Spring</div>
                  <div className="font-medium">{historicalSummary.solarResource.seasonalVariation.spring.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Climate Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Climate Averages</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Temperature:</span>
                  <span className="font-medium">{formatTemperature(historicalSummary.climate.averageTemperature)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Humidity:</span>
                  <span className="font-medium">{formatHumidity(historicalSummary.climate.averageHumidity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Wind Speed:</span>
                  <span className="font-medium">{formatWindSpeed(historicalSummary.climate.averageWindSpeed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Precipitation Days:</span>
                  <span className="font-medium">{historicalSummary.climate.precipitationDays}/year</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h5 className="font-medium text-orange-900 mb-2">Performance Factors</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Temperature Effect:</span>
                  <span className="font-medium">{(historicalSummary.performance.temperatureCorrectionFactor * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Soiling Loss:</span>
                  <span className="font-medium">{(historicalSummary.performance.soilingLossFactor * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Atmospheric Loss:</span>
                  <span className="font-medium">{(historicalSummary.performance.atmosphericLossFactor * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Seasonal Variation:</span>
                  <span className="font-medium">±{(historicalSummary.performance.seasonalPerformanceVariation * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solar Performance Model */}
      {displayMode.performance && performanceModel && (
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600" />
            Solar System Performance
          </h4>

          {/* System Overview */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">System Summary</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700">Capacity:</span>
                <span className="ml-2 font-bold">{performanceModel.systemParameters.panelCapacity} kW</span>
              </div>
              <div>
                <span className="text-green-700">Annual Production:</span>
                <span className="ml-2 font-bold">{performanceModel.performance.annualProduction.toLocaleString()} kWh</span>
              </div>
              <div>
                <span className="text-green-700">Capacity Factor:</span>
                <span className="ml-2 font-bold">{performanceModel.performance.capacityFactor.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-green-700">Specific Yield:</span>
                <span className="ml-2 font-bold">{performanceModel.performance.specificYield.toFixed(0)} kWh/kW</span>
              </div>
            </div>
          </div>

          {/* Monthly Production */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Monthly Production Estimate</h5>
            <div className="grid grid-cols-6 gap-2 text-xs">
              {performanceModel.performance.monthlyProduction.map((production, index) => (
                <div key={index} className="text-center">
                  <div className="text-blue-700">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}</div>
                  <div className="font-bold">{(production / 1000).toFixed(1)}k</div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h5 className="font-medium text-red-900 mb-2">System Losses</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-700">Temperature:</span>
                  <span className="font-medium">{performanceModel.environmentalFactors.temperatureLoss.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Soiling:</span>
                  <span className="font-medium">{performanceModel.environmentalFactors.soilingLoss.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Inverter:</span>
                  <span className="font-medium">{performanceModel.environmentalFactors.inverterLoss.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Wiring:</span>
                  <span className="font-medium">{performanceModel.environmentalFactors.wireingLoss.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-2">System Configuration</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Tilt Angle:</span>
                  <span className="font-medium">{performanceModel.systemParameters.tiltAngle}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Azimuth:</span>
                  <span className="font-medium">{performanceModel.systemParameters.azimuthAngle}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Module Efficiency:</span>
                  <span className="font-medium">{performanceModel.systemParameters.panelEfficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">System Efficiency:</span>
                  <span className="font-medium">{performanceModel.systemParameters.systemEfficiency}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Location Warning */}
      {!location && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Info className="h-4 w-4" />
            <span className="text-sm">Please provide location coordinates to load weather data</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherOverlayPanel;