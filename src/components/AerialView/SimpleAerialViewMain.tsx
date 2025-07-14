import React, { useState, useCallback } from 'react';
import { 
  MapPin, 
  Camera, 
  Search, 
  Download, 
  Ruler, 
  Square,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Satellite,
  Map
} from 'lucide-react';
import { useAerialView } from '../../context/AerialViewContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';

// Mock Google Maps service for development
const mockGoogleMapsService = {
  async searchAddress(address: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock coordinates for common addresses
    const mockCoordinates = {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.1
    };
    
    return {
      address,
      coordinates: mockCoordinates,
      formattedAddress: address
    };
  },
  
  async getSatelliteImage(coordinates: any, options: any) {
    // Return a placeholder satellite image URL
    const { latitude, longitude } = coordinates;
    const { width, height, zoom } = options;
    
    // Using a placeholder service that generates satellite-like images
    return `https://picsum.photos/${width}/${height}?random=${latitude}${longitude}${zoom}`;
  },
  
  async getStreetViewImages(coordinates: any) {
    // Return mock street view images
    return [
      {
        heading: 0,
        imageUrl: `https://picsum.photos/400/300?random=street1`,
        label: 'North View'
      },
      {
        heading: 90,
        imageUrl: `https://picsum.photos/400/300?random=street2`,
        label: 'East View'
      },
      {
        heading: 180,
        imageUrl: `https://picsum.photos/400/300?random=street3`,
        label: 'South View'
      },
      {
        heading: 270,
        imageUrl: `https://picsum.photos/400/300?random=street4`,
        label: 'West View'
      }
    ];
  }
};

export const SimpleAerialViewMain: React.FC = () => {
  const {
    state,
    setAddress,
    setCoordinates,
    setZoom,
    setSatelliteImage,
    setStreetViewImages,
    updateUIState,
    setLoading,
    setError,
    addLinearMeasurement,
    addAreaMeasurement,
    clearMeasurements
  } = useAerialView();
  
  const { settings, updateProjectInfo } = useProjectSettings();
  
  const [measurementPoints, setMeasurementPoints] = useState<Array<{x: number, y: number}>>([]);

  // Handle address search
  const handleAddressSearch = useCallback(async () => {
    if (!state.address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await mockGoogleMapsService.searchAddress(state.address);
      
      setCoordinates(result.coordinates);
      
      // Update project info with new address
      updateProjectInfo({ propertyAddress: result.formattedAddress });
      
      // Get satellite image
      const satelliteImageUrl = await mockGoogleMapsService.getSatelliteImage(
        result.coordinates,
        { width: 800, height: 600, zoom: state.zoom }
      );
      setSatelliteImage(satelliteImageUrl);
      
      // Get street view images
      const streetViewImages = await mockGoogleMapsService.getStreetViewImages(result.coordinates);
      setStreetViewImages(streetViewImages);
      
    } catch (error) {
      console.error('Address search failed:', error);
      setError('Failed to search address. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [state.address, state.zoom, setCoordinates, setSatelliteImage, setStreetViewImages, setLoading, setError, updateProjectInfo]);

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback((placeData: any) => {
    if (placeData.coordinates) {
      setCoordinates(placeData.coordinates);
      updateProjectInfo({ propertyAddress: placeData.address });
    }
  }, [setCoordinates, updateProjectInfo]);

  // Handle image click for measurements
  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (state.ui.measurementMode === 'none') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newPoint = { x, y };
    setMeasurementPoints(prev => [...prev, newPoint]);

    // Auto-complete measurement when we have enough points
    if (state.ui.measurementMode === 'linear' && measurementPoints.length === 1) {
      // Complete linear measurement with 2 points
      const distance = Math.sqrt(
        Math.pow(newPoint.x - measurementPoints[0].x, 2) + 
        Math.pow(newPoint.y - measurementPoints[0].y, 2)
      );
      
      // Convert pixels to approximate feet (rough estimate)
      const distanceInFeet = (distance * 0.5); // Placeholder conversion
      
      addLinearMeasurement({
        id: `linear-${Date.now()}`,
        points: [measurementPoints[0], newPoint],
        distance: distanceInFeet,
        unit: 'feet',
        label: `${distanceInFeet.toFixed(1)} ft`
      });
      
      setMeasurementPoints([]);
      updateUIState({ measurementMode: 'none' });
    } else if (state.ui.measurementMode === 'area' && measurementPoints.length >= 2) {
      // Complete area measurement with 3+ points
      const allPoints = [...measurementPoints, newPoint];
      
      // Simple area calculation (triangle/polygon approximation)
      let area = 0;
      for (let i = 0; i < allPoints.length; i++) {
        const j = (i + 1) % allPoints.length;
        area += allPoints[i].x * allPoints[j].y;
        area -= allPoints[j].x * allPoints[i].y;
      }
      area = Math.abs(area) / 2;
      
      // Convert to approximate square feet
      const areaInSqFt = area * 0.25; // Placeholder conversion
      
      addAreaMeasurement({
        id: `area-${Date.now()}`,
        points: allPoints,
        area: areaInSqFt,
        unit: 'sqft',
        label: `${areaInSqFt.toFixed(1)} sq ft`
      });
      
      setMeasurementPoints([]);
      updateUIState({ measurementMode: 'none' });
    }
  }, [state.ui.measurementMode, measurementPoints, addLinearMeasurement, addAreaMeasurement, updateUIState]);

  // Cancel measurement
  const cancelMeasurement = useCallback(() => {
    setMeasurementPoints([]);
    updateUIState({ measurementMode: 'none' });
  }, [updateUIState]);

  // Download current view
  const downloadImage = useCallback(() => {
    if (!state.satelliteImage) return;
    
    const link = document.createElement('a');
    link.href = state.satelliteImage;
    link.download = `aerial-view-${state.address.replace(/\s+/g, '-')}.jpg`;
    link.click();
  }, [state.satelliteImage, state.address]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Aerial View & Site Analysis
          </h2>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200">
              <button
                onClick={() => updateUIState({ viewMode: 'satellite' })}
                className={`px-3 py-2 text-sm rounded-l-lg ${
                  state.ui.viewMode === 'satellite'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Satellite className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateUIState({ viewMode: 'streetview' })}
                className={`px-3 py-2 text-sm border-l border-gray-200 ${
                  state.ui.viewMode === 'streetview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateUIState({ viewMode: 'measurements' })}
                className={`px-3 py-2 text-sm rounded-r-lg border-l border-gray-200 ${
                  state.ui.viewMode === 'measurements'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Ruler className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Address Search */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <AddressAutocomplete
              value={state.address}
              onChange={setAddress}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Enter property address..."
              label="Property Address"
            />
          </div>
          <button
            onClick={handleAddressSearch}
            disabled={state.ui.loading || !state.address.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {state.ui.loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error Display */}
        {state.ui.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{state.ui.error}</p>
          </div>
        )}
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          {/* Zoom Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Zoom Level</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(state.zoom - 1, 10))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-12 text-center">
                {state.zoom}
              </span>
              <button
                onClick={() => setZoom(Math.min(state.zoom + 1, 22))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Measurement Tools */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Measurement Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateUIState({ 
                  measurementMode: state.ui.measurementMode === 'linear' ? 'none' : 'linear' 
                })}
                className={`w-full p-2 text-left rounded-md flex items-center gap-2 ${
                  state.ui.measurementMode === 'linear'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Ruler className="h-4 w-4" />
                Linear Distance
              </button>
              
              <button
                onClick={() => updateUIState({ 
                  measurementMode: state.ui.measurementMode === 'area' ? 'none' : 'area' 
                })}
                className={`w-full p-2 text-left rounded-md flex items-center gap-2 ${
                  state.ui.measurementMode === 'area'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Square className="h-4 w-4" />
                Area Measurement
              </button>
              
              {state.ui.measurementMode !== 'none' && (
                <button
                  onClick={cancelMeasurement}
                  className="w-full p-2 text-left rounded-md flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Cancel Measurement
                </button>
              )}
              
              <button
                onClick={clearMeasurements}
                className="w-full p-2 text-left rounded-md flex items-center gap-2 text-gray-600 hover:bg-gray-100"
              >
                <RotateCcw className="h-4 w-4" />
                Clear All Measurements
              </button>
            </div>
          </div>

          {/* Measurements List */}
          {(state.measurements.linear.length > 0 || state.measurements.area.length > 0) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Measurements</h3>
              <div className="space-y-2">
                {state.measurements.linear.map(measurement => (
                  <div key={measurement.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">Distance: {measurement.label}</div>
                  </div>
                ))}
                {state.measurements.area.map(measurement => (
                  <div key={measurement.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">Area: {measurement.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordinates Display */}
          {state.coordinates && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Coordinates</h3>
              <div className="text-sm text-gray-600 font-mono">
                <div>Lat: {state.coordinates.latitude.toFixed(6)}</div>
                <div>Lng: {state.coordinates.longitude.toFixed(6)}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={downloadImage}
              disabled={!state.satelliteImage}
              className="w-full p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Image
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {state.ui.loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading aerial imagery...</p>
              </div>
            </div>
          )}

          {!state.ui.loading && !state.satelliteImage && !state.ui.error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Location Selected
                </h3>
                <p className="text-gray-500">
                  Enter an address above to view aerial imagery and perform site analysis.
                </p>
              </div>
            </div>
          )}

          {/* Satellite View */}
          {state.ui.viewMode === 'satellite' && state.satelliteImage && (
            <div className="relative">
              <img
                src={state.satelliteImage}
                alt="Satellite view"
                className="w-full h-auto border border-gray-200 rounded-lg cursor-crosshair"
                onClick={handleImageClick}
              />
              
              {/* Measurement overlay */}
              {measurementPoints.map((point, index) => (
                <div
                  key={index}
                  className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: point.x, top: point.y }}
                />
              ))}
              
              {/* Measurement mode indicator */}
              {state.ui.measurementMode !== 'none' && (
                <div className="absolute top-4 left-4 px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-md text-sm">
                  Click to {state.ui.measurementMode === 'linear' ? 'measure distance' : 'define area'}
                  {measurementPoints.length > 0 && (
                    <span className="ml-2">({measurementPoints.length} point{measurementPoints.length !== 1 ? 's' : ''})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Street View */}
          {state.ui.viewMode === 'streetview' && state.streetViewImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {state.streetViewImages.map((image, index) => (
                <div key={index} className="text-center">
                  <img
                    src={image.imageUrl}
                    alt={image.label}
                    className="w-full h-auto border border-gray-200 rounded-lg"
                  />
                  <p className="mt-2 text-sm text-gray-600">{image.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Measurements View */}
          {state.ui.viewMode === 'measurements' && (
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Site Measurements
              </h3>
              {state.measurements.linear.length === 0 && state.measurements.area.length === 0 ? (
                <p className="text-gray-500">
                  Switch to satellite view and use measurement tools to analyze the property.
                </p>
              ) : (
                <div className="space-y-4">
                  {state.measurements.linear.map(measurement => (
                    <div key={measurement.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium">Linear Measurement</h4>
                      <p className="text-lg text-blue-600">{measurement.label}</p>
                    </div>
                  ))}
                  {state.measurements.area.map(measurement => (
                    <div key={measurement.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium">Area Measurement</h4>
                      <p className="text-lg text-green-600">{measurement.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};