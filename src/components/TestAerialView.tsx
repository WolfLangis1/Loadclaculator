import React, { useState } from 'react';
import { SecureAerialViewService, type AerialView } from '../services/secureAerialViewService';
import { GoogleSolarService, type SolarInsights } from '../services/googleSolarService';

const TestAerialView: React.FC = () => {
  const [address, setAddress] = useState('123 Main St, New York, NY');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testAerialView = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Testing secure aerial view service...');

      // Test geocoding
      console.log('1. Testing geocoding...');
      const geocodeResult = await SecureAerialViewService.geocodeAddress(address);
      console.log('Geocode result:', geocodeResult);

      if (!geocodeResult) {
        throw new Error('Failed to geocode address');
      }

      // Test satellite imagery
      console.log('2. Testing satellite imagery...');
      const satelliteUrl = await SecureAerialViewService.getSatelliteImage(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude,
        { zoom: 18, width: 800, height: 600 }
      );
      console.log('Satellite URL:', satelliteUrl);

      // Test street view
      console.log('3. Testing street view...');
      const streetViews = await SecureAerialViewService.getMultiAngleStreetView(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );
      console.log('Street views:', streetViews);

      // Test weather data
      console.log('4. Testing weather data...');
      const weatherData = await SecureAerialViewService.getWeatherData(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );
      console.log('Weather data:', weatherData);

      // Test solar insights (still using direct service for now)
      console.log('5. Testing solar insights...');
      const solarInsights = await GoogleSolarService.getSolarInsights(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );
      console.log('Solar insights:', solarInsights);

      // Test creating full aerial view
      console.log('6. Testing full aerial view creation...');
      const aerialView = await SecureAerialViewService.createAerialView(address);
      console.log('Aerial view:', aerialView);

      // Test satellite image with different provider
      console.log('7. Testing satellite with Mapbox...');
      const mapboxSatelliteUrl = await SecureAerialViewService.getSatelliteImage(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude,
        { zoom: 18, width: 800, height: 600, provider: 'mapbox' }
      );
      console.log('Mapbox satellite URL:', mapboxSatelliteUrl);

      setResults({
        geocodeResult,
        satelliteUrl,
        streetViews,
        weatherData,
        solarInsights,
        aerialView,
        mapboxSatelliteUrl
      });

    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testApiHealth = async () => {
    try {
      const isHealthy = await SecureAerialViewService.checkApiHealth();
      console.log('API Health Check:', isHealthy ? 'Healthy' : 'Unhealthy');
      alert(`API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
    } catch (error) {
      console.error('Health check failed:', error);
      alert('Health check failed');
    }
  };

  const getConfigStatus = () => {
    const status = SecureAerialViewService.getConfigurationStatus();
    console.log('Configuration Status:', status);
    alert(`Config Status: ${status.status}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Secure Aerial View Service Test</h1>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address to Test:
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address..."
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={testAerialView}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Aerial View'}
          </button>

          <button
            onClick={testApiHealth}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Test API Health
          </button>

          <button
            onClick={getConfigStatus}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Get Config Status
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Test Results</h2>

          {/* Geocoding Results */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Geocoding Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results.geocodeResult, null, 2)}
            </pre>
          </div>

          {/* Satellite Image */}
          {results.satelliteUrl && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Satellite Image (Google):</h3>
              <img 
                src={results.satelliteUrl} 
                alt="Satellite" 
                className="max-w-full h-auto border rounded-md"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x600/ffcccc/cc0000?text=Image+Load+Error';
                }}
              />
            </div>
          )}

          {/* Mapbox Satellite Image */}
          {results.mapboxSatelliteUrl && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Satellite Image (Mapbox):</h3>
              <img 
                src={results.mapboxSatelliteUrl} 
                alt="Satellite Mapbox" 
                className="max-w-full h-auto border rounded-md"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x600/ffcccc/cc0000?text=Mapbox+Image+Load+Error';
                }}
              />
            </div>
          )}

          {/* Street Views */}
          {results.streetViews && results.streetViews.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Street Views:</h3>
              <div className="grid grid-cols-2 gap-4">
                {results.streetViews.map((url: string, index: number) => (
                  <div key={index}>
                    <p className="text-sm text-gray-600 mb-1">Angle {index * 90}°</p>
                    <img 
                      src={url} 
                      alt={`Street View ${index * 90}°`} 
                      className="w-full h-auto border rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300/ffcccc/cc0000?text=Street+View+Error';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather Data */}
          {results.weatherData && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Weather Data:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results.weatherData, null, 2)}
              </pre>
            </div>
          )}

          {/* Solar Insights */}
          {results.solarInsights && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Solar Insights:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results.solarInsights, null, 2)}
              </pre>
            </div>
          )}

          {/* Full Aerial View */}
          {results.aerialView && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Complete Aerial View:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results.aerialView, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestAerialView;