import React, { useState } from 'react';
import { AerialViewService } from '../services/aerialViewService';
import { GoogleSolarService, type SolarInsights } from '../services/googleSolarService';

type ViewType = 'satellite' | 'solar' | 'streetview';

export const TestAerialView: React.FC = () => {
  const [address, setAddress] = useState('');
  const [viewType, setViewType] = useState<ViewType>('satellite');
  const [imageUrl, setImageUrl] = useState('');
  const [streetViewImages, setStreetViewImages] = useState<{heading: number; imageUrl: string; label: string}[]>([]);
  const [solarData, setSolarData] = useState<SolarInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(20);

  const handleTest = async () => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');
    setImageUrl('');
    setStreetViewImages([]);
    setSolarData(null);
    
    try {
      console.log('🧪 Testing API with address:', address, 'view type:', viewType);
      
      // Test geocoding
      const geocodeResult = await AerialViewService.geocodeAddress(address);
      console.log('✅ Geocoding result:', geocodeResult);
      
      if (viewType === 'satellite') {
        // Test satellite imagery
        const satelliteUrl = await AerialViewService.getSatelliteImage(
          geocodeResult.latitude,
          geocodeResult.longitude,
          { width: 600, height: 400, zoom: zoom }
        );
        console.log('✅ Satellite image URL:', satelliteUrl);
        setImageUrl(satelliteUrl);
        
      } else if (viewType === 'streetview') {
        // Test Street View - Multiple angles
        console.log('🚶 Testing Street View for multiple angles...');
        const streetViews = await AerialViewService.getMultiAngleStreetView(
          geocodeResult.latitude,
          geocodeResult.longitude,
          { width: 400, height: 300 }
        );
        console.log('✅ Street View images:', streetViews);
        setStreetViewImages(streetViews);
        
      } else if (viewType === 'solar') {
        // Test Solar API
        console.log('☀️ Testing Solar API...');
        const solarInsights = await GoogleSolarService.getSolarInsights(
          geocodeResult.latitude,
          geocodeResult.longitude
        );
        console.log('✅ Solar insights:', solarInsights);
        setSolarData(solarInsights);
        
        // Also get a satellite image for solar overlay
        const satelliteUrl = await AerialViewService.getSatelliteImage(
          geocodeResult.latitude,
          geocodeResult.longitude,
          { width: 600, height: 400, zoom: zoom }
        );
        setImageUrl(satelliteUrl);
      }
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const configStatus = AerialViewService.getConfigurationStatus();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">🧪 Aerial View API Test</h2>
      
      {/* Status */}
      <div className={`p-3 rounded mb-4 ${
        configStatus.isReal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        <strong>Status:</strong> {configStatus.message}
        {configStatus.setupInstructions && (
          <div className="text-sm mt-1">{configStatus.setupInstructions}</div>
        )}
      </div>

      {/* Test Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test Address:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter an address (e.g., 1600 Pennsylvania Ave Washington DC)"
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">View Type:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('satellite')}
              className={`px-3 py-2 rounded text-sm ${
                viewType === 'satellite' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setViewType('streetview')}
              className={`px-3 py-2 rounded text-sm ${
                viewType === 'streetview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🚶 Street View
            </button>
            <button
              onClick={() => setViewType('solar')}
              className={`px-3 py-2 rounded text-sm ${
                viewType === 'solar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ☀️ Solar Analysis
            </button>
          </div>
        </div>
        
        {(viewType === 'satellite' || viewType === 'solar') && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Zoom Level: {zoom} {zoom === 20 && '(Maximum Detail)'}
            </label>
            <input
              type="range"
              min="10"
              max="20"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10 (Street)</span>
              <span>15 (Building)</span>
              <span>20 (Max Detail)</span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : `Test ${viewType === 'satellite' ? 'Satellite' : viewType === 'streetview' ? 'Street View' : 'Solar'} API`}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {viewType === 'satellite' && imageUrl && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">🛰️ Satellite View Result:</h3>
          <img 
            src={imageUrl} 
            alt="Satellite view" 
            className="border border-gray-300 rounded max-w-full"
            onError={() => setError('Failed to load satellite image')}
          />
          <div className="text-sm text-gray-600 mt-2">
            Image URL: <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {imageUrl.substring(0, 100)}...
            </a>
          </div>
        </div>
      )}
      
      {viewType === 'streetview' && streetViewImages.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">🚶 Street View Results (Multi-Angle):</h3>
          <div className="grid grid-cols-2 gap-4">
            {streetViewImages.map((streetView, index) => (
              <div key={index} className="border border-gray-300 rounded p-2">
                <h4 className="text-sm font-medium mb-2">{streetView.label}</h4>
                <img 
                  src={streetView.imageUrl} 
                  alt={streetView.label}
                  className="w-full rounded"
                  onError={() => setError(`Failed to load ${streetView.label}`)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Heading: {streetView.heading}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {viewType === 'solar' && (solarData || imageUrl) && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">☀️ Solar Analysis Results:</h3>
          
          {imageUrl && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">📍 Site Location:</h4>
              <img 
                src={imageUrl} 
                alt="Solar site view" 
                className="border border-gray-300 rounded max-w-full"
                onError={() => setError('Failed to load solar site image')}
              />
            </div>
          )}
          
          {solarData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="text-sm font-medium mb-2">☀️ Solar Potential Summary:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Max Panels:</strong> {solarData.solarPotential.maxArrayPanelsCount}
                </div>
                <div>
                  <strong>Max Array Area:</strong> {solarData.solarPotential.maxArrayAreaMeters2}m²
                </div>
                <div>
                  <strong>Annual Sunshine:</strong> {solarData.solarPotential.maxSunshineHoursPerYear} hours
                </div>
                <div>
                  <strong>Roof Segments:</strong> {solarData.roofSegmentStats?.length || 0}
                </div>
              </div>
              
              {solarData.roofSegmentStats && solarData.roofSegmentStats.length > 0 && (
                <div className="mt-3">
                  <strong className="text-sm">Best Roof Segment:</strong>
                  <div className="text-xs text-gray-600 mt-1">
                    {solarData.roofSegmentStats[0].panelsCount} panels • 
                    {solarData.roofSegmentStats[0].yearlyEnergyDcKwh.toLocaleString()} kWh/year • 
                    {solarData.roofSegmentStats[0].azimuthDegrees}° azimuth
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};