import React, { useState } from 'react';
import { MapPin, Camera, Sun, Navigation, Plus, Check, X, FileImage, Download, Search, Ruler } from 'lucide-react';
import { SecureAerialViewService } from '../../services/secureAerialViewService';
import { GoogleSolarService } from '../../services/googleSolarService';
import { AttachmentService } from '../../services/attachmentService';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';
import { ChangeDetectionPanel } from './ChangeDetectionPanel';
import { MeasurementToolsPanel } from './MeasurementToolsPanel';
import { ThreeDModelPanel } from './ThreeDModelPanel';
import { WeatherOverlayPanel } from './WeatherOverlayPanel';
import type { DetectedChange } from '../../services/changeDetectionService';
import type { LinearMeasurement, AreaMeasurement, MeasurementPoint } from '../../services/advancedMeasurementService';
import type { ThreeDModel } from '../../services/threeDModelService';
import type { WeatherDataPoint, SolarPerformanceModel } from '../../services/weatherDataService';
// import type { ProjectAttachment } from '../../types';

type ViewMode = 'satellite' | 'streetview' | 'solar' | 'changes' | 'measurements' | '3d' | 'weather';

export const AerialViewMain: React.FC = () => {
  const { 
    state, 
    addAttachment, 
    markAttachmentForExport, 
    unmarkAttachmentForExport, 
    deleteAttachment 
  } = useLoadCalculator();
  const [address, setAddress] = useState(state.projectInfo.propertyAddress || '');
  
  // Auto-sync address when project info changes
  React.useEffect(() => {
    if (state.projectInfo.propertyAddress && state.projectInfo.propertyAddress !== address) {
      setAddress(state.projectInfo.propertyAddress);
    }
  }, [state.projectInfo.propertyAddress]);
  const [viewMode, setViewMode] = useState<ViewMode>('satellite');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(20);
  
  // Results state
  const [satelliteUrl, setSatelliteUrl] = useState('');
  const [streetViewImages, setStreetViewImages] = useState<{heading: number; imageUrl: string; label: string}[]>([]);
  const [solarData, setSolarData] = useState<SolarInsights | null>(null);
  const [coordinates, setCoordinates] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedChange, setSelectedChange] = useState<DetectedChange | null>(null);
  const [measurements, setMeasurements] = useState<{
    linear: LinearMeasurement[];
    area: AreaMeasurement[];
  }>({ linear: [], area: [] });
  const [selectedMeasurement, setSelectedMeasurement] = useState<LinearMeasurement | AreaMeasurement | null>(null);
  const [threeDModels, setThreeDModels] = useState<ThreeDModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ThreeDModel | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherDataPoint | null>(null);
  const [solarPerformance, setSolarPerformance] = useState<SolarPerformanceModel | null>(null);

  const handleCapture = async () => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');
    
    // Clear previous results
    setSatelliteUrl('');
    setStreetViewImages([]);
    setSolarData(null);
    
    try {
      console.log('🏠 Capturing aerial view for:', address);
      
      // Geocode the address using secure service
      const geocodeResult = await SecureAerialViewService.geocodeAddress(address);
      if (!geocodeResult) {
        throw new Error('Failed to geocode address');
      }
      
      setCoordinates({ 
        latitude: geocodeResult.coordinates.latitude, 
        longitude: geocodeResult.coordinates.longitude 
      });
      
      if (viewMode === 'satellite') {
        const imageUrl = await SecureAerialViewService.getSatelliteImage(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude,
          { width: 800, height: 600, zoom: zoom }
        );
        setSatelliteUrl(imageUrl);
        
      } else if (viewMode === 'streetview') {
        const streetViews = await SecureAerialViewService.getMultiAngleStreetView(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude,
          { width: 500, height: 400 }
        );
        setStreetViewImages(streetViews);
        
      } else if (viewMode === 'solar') {
        // Get both satellite and solar data
        const imageUrl = await SecureAerialViewService.getSatelliteImage(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude,
          { width: 800, height: 600, zoom: zoom }
        );
        setSatelliteUrl(imageUrl);
        setSolarData(null);
        
      } else if (viewMode === 'changes') {
        // Initialize change detection - the panel will handle the actual analysis
        console.log('🔍 Change detection mode - coordinates set for analysis');
        // The ChangeDetectionPanel will automatically start analysis when coordinates are available
        setSelectedChange(null); // Clear any previous selection
        
      } else if (viewMode === 'measurements') {
        // Initialize measurement tools - the panel will handle the actual measurements
        console.log('📐 Measurement mode - coordinates set for measurement tools');
        // The MeasurementToolsPanel will use coordinates for GPS-based measurements
        setSelectedMeasurement(null); // Clear any previous selection
      }
    } catch (err) {
      console.error('❌ Aerial view capture failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture aerial view');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProject = async (imageUrl: string, type: 'satellite' | 'streetview' | 'solar', metadata: any = {}) => {
    try {
      const attachment = await AttachmentService.createAttachmentFromCapture(
        'current_project', // Will be replaced by actual project ID in context
        type === 'satellite' ? 'satellite_image' : type === 'streetview' ? 'street_view' : 'solar_analysis',
        type === 'satellite' || type === 'solar' ? 'google_maps' : 'google_streetview',
        imageUrl,
        {
          address: address,
          coordinates: coordinates,
          zoom: type !== 'streetview' ? zoom : undefined,
          ...metadata
        }
      );
      
      addAttachment(attachment);
      console.log('✅ Image saved to project:', attachment.name);
    } catch (error) {
      console.error('❌ Failed to save image:', error);
      setError('Failed to save image to project');
    }
  };

  const handleSaveStreetViewToProject = async (streetView: {heading: number; imageUrl: string; label: string}) => {
    await handleSaveToProject(streetView.imageUrl, 'streetview', {
      heading: streetView.heading,
      description: streetView.label
    });
  };

  const handleToggleExport = (attachmentId: string, currentlyMarked: boolean) => {
    if (currentlyMarked) {
      unmarkAttachmentForExport(attachmentId);
    } else {
      markAttachmentForExport(attachmentId, {
        pdfSection: viewMode === 'satellite' ? 'aerial_views' : viewMode === 'streetview' ? 'site_overview' : viewMode === 'solar' ? 'solar_analysis' : viewMode === 'changes' ? 'change_analysis' : viewMode === 'measurements' ? 'measurements' : viewMode === '3d' ? '3d_modeling' : 'weather_analysis'
      });
    }
  };

  const configStatus = SecureAerialViewService.getConfigurationStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Aerial View & Site Analysis
              </h1>
              <p className="text-blue-100">Professional site documentation for electrical permits</p>
            </div>
          </div>
          
          {/* Configuration Status */}
          <div className={`p-3 rounded-lg ${
            configStatus.isReal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${configStatus.isReal ? 'bg-green-600' : 'bg-yellow-600'}`} />
              <span className="font-medium">{configStatus.message}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Address Input with Autocomplete */}
            <div>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onPlaceSelect={(place) => {
                  console.log('🏠 Place selected:', place);
                  setAddress(place.address);
                  // Store coordinates for immediate use
                  if (place.coordinates) {
                    setCoordinates(place.coordinates);
                  }
                }}
                label={
                  <div className="flex items-center">
                    Project Address
                    {state.projectInfo.propertyAddress && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        ✓ Auto-synced from project info
                      </span>
                    )}
                  </div>
                }
                placeholder={
                  state.projectInfo.propertyAddress 
                    ? "Address auto-populated from project info"
                    : "Start typing address for suggestions..."
                }
                className={`${
                  state.projectInfo.propertyAddress 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300'
                }`}
                helperText={
                  state.projectInfo.propertyAddress && address !== state.projectInfo.propertyAddress
                    ? "⚠️ Address differs from project info. Will use this address for site analysis."
                    : undefined
                }
              />
            </div>

            {/* View Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Type
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
                <button
                  onClick={() => setViewMode('satellite')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'satellite'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Satellite
                </button>
                <button
                  onClick={() => setViewMode('streetview')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'streetview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Navigation className="h-4 w-4" />
                  Street View
                </button>
                <button
                  onClick={() => setViewMode('solar')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'solar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Solar
                </button>
                <button
                  onClick={() => setViewMode('changes')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'changes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Changes
                </button>
                <button
                  onClick={() => setViewMode('measurements')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'measurements'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Ruler className="h-4 w-4" />
                  Measure
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === '3d'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileImage className="h-4 w-4" />
                  3D Model
                </button>
                <button
                  onClick={() => setViewMode('weather')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'weather'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Weather
                </button>
              </div>
            </div>
          </div>

          {/* Zoom Control for Satellite/Solar */}
          {(viewMode === 'satellite' || viewMode === 'solar') && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoom Level: {zoom} {zoom === 20 && '(Maximum Detail)'}
              </label>
              <input
                type="range"
                min="10"
                max="20"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10 (Street Level)</span>
                <span>15 (Building Detail)</span>
                <span>20 (Maximum Detail)</span>
              </div>
            </div>
          )}

          {/* Capture Button */}
          <div className="mt-6">
            <button
              onClick={handleCapture}
              disabled={loading || !address}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Capturing {viewMode === 'satellite' ? 'Satellite' : viewMode === 'streetview' ? 'Street View' : viewMode === 'solar' ? 'Solar' : viewMode === 'changes' ? 'Change' : viewMode === 'measurements' ? 'Measurement' : viewMode === '3d' ? '3D Model' : 'Weather'} Data...
                </div>
              ) : (
                `Capture ${viewMode === 'satellite' ? 'Satellite View' : viewMode === 'streetview' ? 'Street Views' : viewMode === 'solar' ? 'Solar Analysis' : viewMode === 'changes' ? 'Change Analysis' : viewMode === 'measurements' ? 'Measurement Data' : viewMode === '3d' ? '3D Site Model' : 'Weather Data'}`
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {/* Satellite View Results */}
          {viewMode === 'satellite' && satelliteUrl && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Satellite View
                </h2>
                <button
                  onClick={() => handleSaveToProject(satelliteUrl, 'satellite')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Save to Project
                </button>
              </div>
              <div className="relative">
                <img
                  src={satelliteUrl}
                  alt="Satellite view of project site"
                  className="w-full rounded-lg border border-gray-200"
                  onError={() => setError('Failed to load satellite image')}
                />
                {coordinates && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                    📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Street View Results */}
          {viewMode === 'streetview' && streetViewImages.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-600" />
                Street View Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {streetViewImages.map((streetView, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{streetView.label}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {streetView.heading}° heading
                        </span>
                        <button
                          onClick={() => handleSaveStreetViewToProject(streetView)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Save
                        </button>
                      </div>
                    </div>
                    <img
                      src={streetView.imageUrl}
                      alt={streetView.label}
                      className="w-full rounded-lg border border-gray-200"
                      onError={() => setError(`Failed to load ${streetView.label}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solar Analysis Results */}
          {viewMode === 'solar' && (solarData || satelliteUrl) && (
            <div className="space-y-6">
              {/* Site Image */}
              {satelliteUrl && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-600" />
                    Solar Site Analysis
                  </h2>
                  <div className="relative">
                    <img
                      src={satelliteUrl}
                      alt="Solar analysis site view"
                      className="w-full rounded-lg border border-gray-200"
                      onError={() => setError('Failed to load solar site image')}
                    />
                    {coordinates && (
                      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                        📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Solar Data */}
              {solarData && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border border-yellow-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">☀️ Solar Potential Summary</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {solarData.solarPotential.maxArrayPanelsCount}
                      </div>
                      <div className="text-sm text-gray-600">Max Panels</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {solarData.solarPotential.maxArrayAreaMeters2}m²
                      </div>
                      <div className="text-sm text-gray-600">Array Area</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {solarData.solarPotential.maxSunshineHoursPerYear.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Sun Hours/Year</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {solarData.roofSegmentStats?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Roof Segments</div>
                    </div>
                  </div>

                  {solarData.roofSegmentStats && solarData.roofSegmentStats.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Best Roof Segment Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Panel Capacity:</span>
                          <div className="text-blue-600">{solarData.roofSegmentStats[0].panelsCount} panels</div>
                        </div>
                        <div>
                          <span className="font-medium">Annual Production:</span>
                          <div className="text-green-600">{solarData.roofSegmentStats[0].yearlyEnergyDcKwh.toLocaleString()} kWh</div>
                        </div>
                        <div>
                          <span className="font-medium">Orientation:</span>
                          <div className="text-purple-600">{solarData.roofSegmentStats[0].azimuthDegrees}° azimuth</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Change Detection Results */}
          {viewMode === 'changes' && coordinates && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Search className="h-5 w-5 text-purple-600" />
                  Historical Change Analysis
                </h2>
                <div className="text-sm text-gray-600">
                  📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </div>
              </div>
              
              <ChangeDetectionPanel
                location={coordinates}
                onChangeSelected={(change) => {
                  setSelectedChange(change);
                  console.log('🔍 Change selected:', change);
                }}
                className="mt-4"
              />
              
              {selectedChange && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Selected Change Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {selectedChange.changeType}</div>
                    <div><strong>Confidence:</strong> {Math.round(selectedChange.characteristics.confidence * 100)}%</div>
                    <div><strong>Area:</strong> {selectedChange.region.area.toLocaleString()} m²</div>
                    <div><strong>Time Period:</strong> {selectedChange.detectedBetween.beforeDate.toLocaleDateString()} → {selectedChange.detectedBetween.afterDate.toLocaleDateString()}</div>
                    <div><strong>Impact:</strong> {selectedChange.context.impactAssessment}</div>
                    {selectedChange.context.necRelevance && (
                      <div><strong>NEC Relevance:</strong> {selectedChange.context.necRelevance}</div>
                    )}
                    {selectedChange.context.solarRelevance && (
                      <div><strong>Solar Impact:</strong> {selectedChange.context.solarRelevance}</div>
                    )}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => {
                          // Log change analysis save (attachment creation would be implemented here)
                          console.log('💾 Change analysis would be saved to project:', {
                            changeType: selectedChange.changeType,
                            confidence: selectedChange.characteristics.confidence,
                            area: selectedChange.region.area,
                            coordinates: coordinates,
                            timeRange: selectedChange.detectedBetween,
                            description: selectedChange.context.description
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Save Analysis to Project
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Measurement Tools Results */}
          {viewMode === 'measurements' && coordinates && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-green-600" />
                  Precision Measurement Tools
                </h2>
                <div className="text-sm text-gray-600">
                  📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </div>
              </div>
              
              <MeasurementToolsPanel
                imageMetadata={satelliteUrl ? {
                  bounds: {
                    north: coordinates.latitude + 0.001,
                    south: coordinates.latitude - 0.001,
                    east: coordinates.longitude + 0.001,
                    west: coordinates.longitude - 0.001
                  },
                  width: 800,
                  height: 600
                } : undefined}
                onMeasurementCreated={(measurement) => {
                  setSelectedMeasurement(measurement);
                  if ('distanceMeters' in measurement.results) {
                    // Linear measurement
                    setMeasurements(prev => ({
                      ...prev,
                      linear: [...prev.linear, measurement as LinearMeasurement]
                    }));
                  } else {
                    // Area measurement
                    setMeasurements(prev => ({
                      ...prev,
                      area: [...prev.area, measurement as AreaMeasurement]
                    }));
                  }
                  console.log('📐 Measurement created:', measurement);
                }}
                onPointSelected={(point) => {
                  console.log('📍 Point selected:', point);
                }}
                className="mt-4"
              />
              
              {selectedMeasurement && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Selected Measurement Details</h3>
                  <div className="space-y-2 text-sm">
                    {'distanceMeters' in selectedMeasurement.results ? (
                      <>
                        <div><strong>Type:</strong> {selectedMeasurement.type}</div>
                        <div><strong>Distance:</strong> {selectedMeasurement.results.distanceMeters.toFixed(2)} m ({selectedMeasurement.results.distanceFeet.toFixed(2)} ft)</div>
                        <div><strong>Bearing:</strong> {selectedMeasurement.results.bearing.toFixed(1)}°</div>
                        {selectedMeasurement.results.elevationChange && (
                          <div><strong>Elevation Change:</strong> {selectedMeasurement.results.elevationChange.toFixed(1)} m</div>
                        )}
                        {selectedMeasurement.compliance.necSetbackCompliance !== undefined && (
                          <div><strong>NEC Compliance:</strong> {selectedMeasurement.compliance.necSetbackCompliance ? '✅ Compliant' : '❌ Non-compliant'}</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div><strong>Type:</strong> {selectedMeasurement.type}</div>
                        <div><strong>Area:</strong> {selectedMeasurement.results.areaSquareMeters.toFixed(2)} m² ({selectedMeasurement.results.areaSquareFeet.toFixed(2)} ft²)</div>
                        <div><strong>Perimeter:</strong> {selectedMeasurement.results.perimeterMeters.toFixed(2)} m ({selectedMeasurement.results.perimeterFeet.toFixed(2)} ft)</div>
                        {selectedMeasurement.solar && (
                          <>
                            <div><strong>Solar Potential:</strong> {selectedMeasurement.solar.maxPanelCount} panels, {selectedMeasurement.solar.estimatedCapacity} kW</div>
                            <div><strong>Usable Area:</strong> {selectedMeasurement.solar.usableArea} m² (after setbacks)</div>
                          </>
                        )}
                        <div><strong>NEC Compliance:</strong> {selectedMeasurement.compliance.necCompliant ? '✅ Compliant' : '❌ Non-compliant'}</div>
                      </>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-xs text-green-700">
                        <div><strong>Measurement Precision:</strong> {selectedMeasurement.precision.horizontalAccuracy.toFixed(1)}m horizontal accuracy</div>
                        <div><strong>Method:</strong> {selectedMeasurement.precision.measurementMethod} with {Math.round(selectedMeasurement.precision.confidenceLevel * 100)}% confidence</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <button
                        onClick={() => {
                          // Log measurement save (attachment creation would be implemented here)
                          console.log('💾 Measurement would be saved to project:', {
                            type: selectedMeasurement.type,
                            results: selectedMeasurement.results,
                            precision: selectedMeasurement.precision,
                            compliance: selectedMeasurement.compliance
                          });
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Save Measurement to Project
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3D Model Results */}
          {viewMode === '3d' && coordinates && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-purple-600" />
                  3D Site Modeling
                </h2>
                <div className="text-sm text-gray-600">
                  📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </div>
              </div>
              
              <ThreeDModelPanel
                location={coordinates}
                imageMetadata={satelliteUrl ? {
                  bounds: {
                    north: coordinates.latitude + 0.001,
                    south: coordinates.latitude - 0.001,
                    east: coordinates.longitude + 0.001,
                    west: coordinates.longitude - 0.001
                  },
                  width: 800,
                  height: 600
                } : undefined}
                onModelGenerated={(model) => {
                  setSelectedModel(model);
                  setThreeDModels(prev => [...prev, model]);
                  console.log('🏗️ 3D model generated:', model);
                }}
                className="mt-4"
              />
              
              {selectedModel && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Generated Model Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Model ID:</strong> {selectedModel.id.slice(-8)}</div>
                    <div><strong>Point Cloud:</strong> {selectedModel.pointCloud.length.toLocaleString()} points</div>
                    <div><strong>Surface Meshes:</strong> {selectedModel.meshes.length} surfaces</div>
                    <div><strong>Quality:</strong> {selectedModel.quality.completeness}% complete, {selectedModel.quality.averageAccuracy}m accuracy</div>
                    <div><strong>Point Density:</strong> {selectedModel.quality.pointDensity.toFixed(1)} pts/m²</div>
                    
                    {selectedModel.solar.roofPlanes.length > 0 && (
                      <>
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <div><strong>Solar Analysis:</strong></div>
                          <div>• Roof Planes: {selectedModel.solar.roofPlanes.length}</div>
                          <div>• Total Area: {selectedModel.solar.roofPlanes.reduce((sum, plane) => sum + plane.area, 0).toFixed(0)} m²</div>
                          <div>• Usable Area: {selectedModel.solar.roofPlanes.reduce((sum, plane) => sum + plane.usableArea, 0).toFixed(0)} m²</div>
                          <div>• Panel Capacity: {selectedModel.solar.roofPlanes.reduce((sum, plane) => sum + plane.panelCapacity, 0).toFixed(1)} kW</div>
                          <div>• Annual Generation: {selectedModel.solar.shadingAnalysis.annualSolarPotential.toLocaleString()} kWh/year</div>
                        </div>
                      </>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="text-xs text-purple-700">
                        <div><strong>Processing:</strong> {selectedModel.processing.algorithm} in {selectedModel.processing.processingTime}s</div>
                        <div><strong>Source Images:</strong> {selectedModel.processing.sourceImages.length} aerial views</div>
                        <div><strong>Created:</strong> {selectedModel.processing.createdAt.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <button
                        onClick={() => {
                          // Log model save (attachment creation would be implemented here)
                          console.log('💾 3D model would be saved to project:', {
                            id: selectedModel.id,
                            meshes: selectedModel.meshes.length,
                            points: selectedModel.pointCloud.length,
                            solar: selectedModel.solar
                          });
                        }}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                      >
                        Save Model to Project
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weather Data Overlay */}
          {viewMode === 'weather' && coordinates && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Weather Data & Solar Analysis
                </h2>
                <div className="text-sm text-gray-600">
                  📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </div>
              </div>
              
              <WeatherOverlayPanel
                location={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  elevation: 0 // TODO: Get elevation from 3D model or elevation service
                }}
                systemParameters={solarData ? {
                  panelCapacity: (solarData.solarPotential?.maxArrayAreaMeters2 || 100) * 0.2, // Estimate 200W/m²
                  panelEfficiency: 20,
                  systemEfficiency: 85,
                  temperatureCoefficient: -0.4,
                  tiltAngle: solarData.solarPotential?.roofSegmentSummaries[0]?.tiltDegrees || 30,
                  azimuthAngle: solarData.solarPotential?.roofSegmentSummaries[0]?.azimuthDegrees || 180,
                  tracking: 'fixed'
                } : undefined}
                onWeatherUpdate={(weather) => {
                  setCurrentWeather(weather);
                  console.log('🌤️ Weather data updated:', weather);
                }}
                onPerformanceUpdate={(performance) => {
                  setSolarPerformance(performance);
                  console.log('⚡ Solar performance updated:', performance);
                }}
                className="mt-4"
              />
              
              {currentWeather && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Current Weather Impact</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Solar Irradiance:</strong> {currentWeather.irradiance.ghi.toFixed(0)} W/m² (affects current production)</div>
                    <div><strong>Temperature:</strong> {currentWeather.atmosphere.temperature.toFixed(1)}°C (affects panel efficiency)</div>
                    <div><strong>Cloud Cover:</strong> {currentWeather.clouds.totalCloudCover.toFixed(0)}% (reduces solar output)</div>
                    <div><strong>Production Factor:</strong> {(currentWeather.irradiance.ghi / 1000 * (1 - currentWeather.clouds.totalCloudCover / 100 * 0.8)).toFixed(2)} (0-1 scale)</div>
                    
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs text-blue-700">
                        <div><strong>Data Quality:</strong> {Math.round(currentWeather.quality.confidence * 100)}% confidence</div>
                        <div><strong>Source:</strong> {currentWeather.quality.dataSource}</div>
                        <div><strong>Last Updated:</strong> {currentWeather.quality.lastUpdated.toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => {
                          // Log weather save (attachment creation would be implemented here)
                          console.log('💾 Weather data would be saved to project:', {
                            irradiance: currentWeather.irradiance,
                            conditions: currentWeather.conditions,
                            timestamp: currentWeather.timestamp
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Save Weather Data to Project
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {solarPerformance && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Solar Performance Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Annual Production:</strong> {solarPerformance.performance.annualProduction.toLocaleString()} kWh/year</div>
                    <div><strong>Capacity Factor:</strong> {solarPerformance.performance.capacityFactor.toFixed(1)}%</div>
                    <div><strong>Specific Yield:</strong> {solarPerformance.performance.specificYield.toFixed(0)} kWh/kW/year</div>
                    <div><strong>Performance Ratio:</strong> {(solarPerformance.performance.performanceRatio * 100).toFixed(1)}%</div>
                    
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div><strong>Environmental Factors:</strong></div>
                      <div>• Temperature losses: {solarPerformance.environmentalFactors.temperatureLoss.toFixed(1)}%</div>
                      <div>• Soiling losses: {solarPerformance.environmentalFactors.soilingLoss.toFixed(1)}%</div>
                      <div>• System losses: {(solarPerformance.environmentalFactors.inverterLoss + solarPerformance.environmentalFactors.wireingLoss).toFixed(1)}%</div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <button
                        onClick={() => {
                          // Log performance save (attachment creation would be implemented here)
                          console.log('💾 Solar performance would be saved to project:', {
                            annualProduction: solarPerformance.performance.annualProduction,
                            capacityFactor: solarPerformance.performance.capacityFactor,
                            environmentalFactors: solarPerformance.environmentalFactors
                          });
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Save Performance Analysis to Project
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Attachments Panel */}
          {state.attachments.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-purple-600" />
                  Project Attachments ({state.attachments.length})
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-600" />
                    {state.attachmentStats.markedForExport} marked for PDF export
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {state.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`relative border rounded-lg p-4 transition-all flex flex-col h-full ${
                      attachment.markedForExport 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {attachment.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {attachment.type.replace('_', ' ')} • {attachment.source.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleExport(attachment.id, attachment.markedForExport)}
                          className={`p-1.5 rounded transition-colors ${
                            attachment.markedForExport
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={attachment.markedForExport ? 'Remove from PDF export' : 'Add to PDF export'}
                        >
                          {attachment.markedForExport ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteAttachment(attachment.id)}
                          className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Delete attachment"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative mb-3">
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-32 object-cover rounded border"
                        onError={() => setError('Failed to load attachment image')}
                      />
                      {attachment.markedForExport && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                          PDF Export
                        </div>
                      )}
                    </div>
                    
                    {attachment.metadata.coordinates && (
                      <div className="text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
                        📍 {attachment.metadata.coordinates.latitude.toFixed(4)}, {attachment.metadata.coordinates.longitude.toFixed(4)}
                        {attachment.metadata.zoom && ` • Zoom ${attachment.metadata.zoom}`}
                        {attachment.metadata.heading !== undefined && ` • ${attachment.metadata.heading}°`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {state.attachmentStats.markedForExport > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">
                      {state.attachmentStats.markedForExport} image(s) will be included in PDF export
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    These images will automatically be embedded in your permit application PDF.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};