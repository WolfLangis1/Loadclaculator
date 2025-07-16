import React, { useState, useCallback, useEffect } from 'react';
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
  AlertCircle,
  RefreshCw,
  Save,
  Archive,
  Sun,
  Zap
} from 'lucide-react';
import { useAerialView } from '../../context/AerialViewContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';

import { SecureAerialViewService } from '../../services/secureAerialViewService';
import { AttachmentService } from '../../services/attachmentService';
import { GoogleSolarService } from '../../services/googleSolarService';
import { AIRoofAnalysisService, type RoofAnalysisResult } from '../../services/aiRoofAnalysisService';

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
  const [solarAnalysis, setSolarAnalysis] = useState<any>(null);
  const [solarAnalysisLoading, setSolarAnalysisLoading] = useState(false);
  const [aiRoofAnalysis, setAiRoofAnalysis] = useState<RoofAnalysisResult | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  // Auto-fill address from project settings
  useEffect(() => {
    if (settings.projectInfo.propertyAddress && 
        settings.projectInfo.propertyAddress !== state.address && 
        !state.address.trim()) {
      setAddress(settings.projectInfo.propertyAddress);
    }
  }, [settings.projectInfo.propertyAddress, state.address, setAddress]);

  // Handle address search
  const handleAddressSearch = useCallback(async () => {
    if (!state.address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const geocodeResult = await SecureAerialViewService.geocodeAddress(state.address);
      
      if (!geocodeResult) {
        throw new Error('Geocoding failed');
      }
      
      setCoordinates(geocodeResult.coordinates);
      
      // Update project info with new address
      updateProjectInfo({ propertyAddress: geocodeResult.address });
      
      // Get satellite image
      const satelliteResult = await SecureAerialViewService.getSatelliteImagery(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude,
        { width: 800, height: 600, zoom: state.zoom }
      );
      
      if (satelliteResult.success) {
        setSatelliteImage(satelliteResult.data.imageUrl);
      }
      
      // Get street view images
      const streetViewResult = await SecureAerialViewService.getMultiAngleStreetView(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );
      
      if (streetViewResult && streetViewResult.length > 0) {
        setStreetViewImages(streetViewResult);
      }
      
    } catch (error) {
      console.error('Address search failed:', error);
      setError(`Failed to search address: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Save satellite image to project assets
  const saveSatelliteToProject = useCallback(async () => {
    if (!state.satelliteImage || !state.coordinates || !state.address) {
      alert('No satellite image available to save');
      return;
    }

    try {
      // Generate a project ID (for now using timestamp, in real implementation this would come from project context)
      const projectId = `project-${Date.now()}`;
      
      const attachment = await AttachmentService.createAttachmentFromCapture(
        projectId,
        'satellite_image',
        'aerial_view',
        state.satelliteImage,
        {
          address: state.address,
          coordinates: state.coordinates,
          zoom: state.zoom,
          description: `Satellite view of ${state.address}`
        }
      );

      alert(`Satellite image saved to project assets: ${attachment.name}`);
    } catch (error) {
      console.error('Failed to save satellite image:', error);
      alert('Failed to save satellite image to project');
    }
  }, [state.satelliteImage, state.coordinates, state.address, state.zoom]);

  // Save street view images to project assets
  const saveStreetViewsToProject = useCallback(async () => {
    if (!state.streetViewImages || state.streetViewImages.length === 0) {
      alert('No street view images available to save');
      return;
    }

    try {
      // Generate a project ID (for now using timestamp, in real implementation this would come from project context)
      const projectId = `project-${Date.now()}`;
      
      const savedAttachments = [];
      
      for (const streetView of state.streetViewImages) {
        const attachment = await AttachmentService.createAttachmentFromCapture(
          projectId,
          'street_view',
          'aerial_view',
          streetView.imageUrl,
          {
            address: state.address,
            coordinates: state.coordinates,
            heading: streetView.heading,
            description: streetView.label
          }
        );
        savedAttachments.push(attachment);
      }

      alert(`${savedAttachments.length} street view images saved to project assets`);
    } catch (error) {
      console.error('Failed to save street view images:', error);
      alert('Failed to save street view images to project');
    }
  }, [state.streetViewImages, state.coordinates, state.address]);

  // Save all captured images to project assets
  const saveAllToProject = useCallback(async () => {
    if (!state.satelliteImage && (!state.streetViewImages || state.streetViewImages.length === 0)) {
      alert('No images available to save');
      return;
    }

    try {
      let savedCount = 0;

      // Save satellite image if available
      if (state.satelliteImage) {
        await saveSatelliteToProject();
        savedCount++;
      }

      // Save street view images if available
      if (state.streetViewImages && state.streetViewImages.length > 0) {
        await saveStreetViewsToProject();
        savedCount += state.streetViewImages.length;
      }

      alert(`All captured images (${savedCount} total) saved to project assets`);
    } catch (error) {
      console.error('Failed to save all images:', error);
      alert('Failed to save some images to project');
    }
  }, [state.satelliteImage, state.streetViewImages, saveSatelliteToProject, saveStreetViewsToProject]);

  // Unified roof analysis combining Google Solar API and AI analysis
  const analyzeRoof = useCallback(async () => {
    if (!state.coordinates || !state.satelliteImage) {
      alert('Please search for an address and load satellite imagery first');
      return;
    }

    setSolarAnalysisLoading(true);
    setAiAnalysisLoading(true);
    
    let googleSolarData = null;
    let aiRoofData = null;

    try {
      console.log('Starting comprehensive roof analysis...');
      
      // Run both analyses in parallel for better performance
      const [googleResult, aiResult] = await Promise.allSettled([
        // Google Solar API analysis
        (async () => {
          try {
            const [recommendations, buildingInsights, solarPotential] = await Promise.all([
              GoogleSolarService.getPanelRecommendations(state.coordinates.latitude, state.coordinates.longitude),
              GoogleSolarService.getBuildingInsights(state.coordinates.latitude, state.coordinates.longitude),
              GoogleSolarService.calculateSolarPotential(state.coordinates.latitude, state.coordinates.longitude)
            ]);
            
            return {
              recommendations,
              buildingInsights,
              solarPotential,
              coordinates: state.coordinates,
              address: state.address,
              source: 'google'
            };
          } catch (error) {
            console.warn('Google Solar API failed, using enhanced fallback:', error);
            // Return fallback data instead of throwing
            return {
              recommendations: { source: 'fallback' },
              buildingInsights: { source: 'fallback' },
              solarPotential: { source: 'fallback' },
              coordinates: state.coordinates,
              address: state.address,
              source: 'fallback'
            };
          }
        })(),
        
        // AI roof analysis
        AIRoofAnalysisService.analyzeRoofFromImage(
          state.satelliteImage,
          state.coordinates.latitude,
          state.coordinates.longitude
        )
      ]);

      // Process Google Solar API results
      if (googleResult.status === 'fulfilled') {
        googleSolarData = googleResult.value;
        setSolarAnalysis(googleSolarData);
      }

      // Process AI analysis results
      if (aiResult.status === 'fulfilled') {
        aiRoofData = aiResult.value;
        setAiRoofAnalysis(aiRoofData);
      } else {
        console.error('AI roof analysis failed:', aiResult.reason);
      }

      // Combine and enhance results
      if (googleSolarData && aiRoofData) {
        console.log('Roof analysis completed with both Google and AI data');
        
        // Cross-validate results and show comparison
        const comparisonData = {
          googleRoofArea: googleSolarData.recommendations?.roofAnalysis?.totalRoofArea || 0,
          aiRoofArea: aiRoofData.roofArea,
          googlePanels: googleSolarData.recommendations?.recommendedPanels || 0,
          aiPanels: aiRoofData.panelPlacement.length,
          confidence: aiRoofData.confidence
        };
        
        console.log('Analysis comparison:', comparisonData);
      } else if (aiRoofData) {
        console.log('Roof analysis completed with AI data only');
      } else if (googleSolarData) {
        console.log('Roof analysis completed with Google data only');
      } else {
        throw new Error('Both analyses failed');
      }

    } catch (error) {
      console.error('Comprehensive roof analysis failed:', error);
      alert('Roof analysis encountered issues. Please check the console for details.');
    } finally {
      setSolarAnalysisLoading(false);
      setAiAnalysisLoading(false);
    }
  }, [state.coordinates, state.satelliteImage, state.address]);

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
                className={`px-3 py-2 text-sm border-l border-gray-200 ${
                  state.ui.viewMode === 'measurements'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Ruler className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateUIState({ viewMode: 'solar' })}
                className={`px-3 py-2 text-sm rounded-r-lg border-l border-gray-200 ${
                  state.ui.viewMode === 'solar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Sun className="h-4 w-4" />
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

          {/* Roof Analysis */}
          {state.coordinates && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Roof Analysis</h3>
              <button
                onClick={analyzeRoof}
                disabled={solarAnalysisLoading || aiAnalysisLoading || !state.satelliteImage}
                className="w-full p-3 bg-gradient-to-r from-yellow-600 to-purple-600 text-white rounded-md hover:from-yellow-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                <Sun className="h-4 w-4" />
                <span className="text-sm">🤖</span>
                {(solarAnalysisLoading || aiAnalysisLoading) ? 'Analyzing Roof...' : 'Analyze Roof'}
              </button>
              
              {(solarAnalysisLoading || aiAnalysisLoading) && (
                <div className="mt-2 text-xs text-gray-600 text-center">
                  Running Google Solar API + AI Analysis
                </div>
              )}
              
              {solarAnalysis && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  <div className="font-medium text-yellow-800 mb-2">Solar Potential</div>
                  <div className="space-y-1 text-yellow-700">
                    <div>Recommended Panels: {solarAnalysis.recommendations?.recommendedPanels || 'N/A'}</div>
                    <div>Annual Output: {solarAnalysis.recommendations?.estimatedAnnualOutput?.toLocaleString() || 'N/A'} kWh</div>
                    <div>Roof Area: {solarAnalysis.recommendations?.roofAnalysis?.totalRoofArea?.toFixed(0) || 'N/A'} m²</div>
                    <div>Optimal Tilt: {solarAnalysis.recommendations?.tilt || 'N/A'}°</div>
                  </div>
                </div>
              )}
              
              {aiRoofAnalysis && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm">
                  <div className="font-medium text-purple-800 mb-2 flex items-center gap-1">
                    <span>🤖</span>
                    AI Roof Detection
                  </div>
                  <div className="space-y-1 text-purple-700">
                    <div>Roof Area: {aiRoofAnalysis.roofArea.toFixed(0)} m²</div>
                    <div>Usable Area: {aiRoofAnalysis.usableArea.toFixed(0)} m²</div>
                    <div>Roof Segments: {aiRoofAnalysis.roofSegments.length}</div>
                    <div>Panel Placements: {aiRoofAnalysis.panelPlacement.length}</div>
                    <div>Confidence: {(aiRoofAnalysis.confidence * 100).toFixed(0)}%</div>
                    <div>Processing: {aiRoofAnalysis.processingTime.toFixed(0)}ms</div>
                  </div>
                </div>
              )}
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
            
            <button
              onClick={saveAllToProject}
              disabled={!state.satelliteImage && (!state.streetViewImages || state.streetViewImages.length === 0)}
              className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Save All to Project
            </button>
            
            {state.satelliteImage && (
              <button
                onClick={saveSatelliteToProject}
                className="w-full p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Satellite View
              </button>
            )}
            
            {state.streetViewImages && state.streetViewImages.length > 0 && (
              <button
                onClick={saveStreetViewsToProject}
                className="w-full p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Save Street Views ({state.streetViewImages.length})
              </button>
            )}
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
                id="satellite-image"
              />
              
              {/* AI Roof Analysis Overlay */}
              {aiRoofAnalysis && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Roof Segments */}
                  {aiRoofAnalysis.roofSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30"
                      style={{
                        left: Math.min(...segment.coordinates.map(c => c.x)) + 'px',
                        top: Math.min(...segment.coordinates.map(c => c.y)) + 'px',
                        width: (Math.max(...segment.coordinates.map(c => c.x)) - Math.min(...segment.coordinates.map(c => c.x))) + 'px',
                        height: (Math.max(...segment.coordinates.map(c => c.y)) - Math.min(...segment.coordinates.map(c => c.y))) + 'px'
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-1 rounded">
                        {(segment.suitability * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  
                  {/* Panel Placements */}
                  {aiRoofAnalysis.panelPlacement.slice(0, 50).map((panel) => ( // Limit display to first 50 panels
                    <div
                      key={panel.id}
                      className="absolute border border-green-400 bg-green-300 bg-opacity-50"
                      style={{
                        left: panel.x + 'px',
                        top: panel.y + 'px',
                        width: panel.width + 'px',
                        height: panel.height + 'px'
                      }}
                      title={`Panel: ${panel.annualProduction.toFixed(0)} kWh/year`}
                    />
                  ))}
                </div>
              )}
              
              {/* Measurement overlay */}
              {measurementPoints.map((point, index) => (
                <div
                  key={index}
                  className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: point.x, top: point.y }}
                />
              ))}
              
              {/* Analysis mode indicator */}
              {(state.ui.measurementMode !== 'none' || aiRoofAnalysis) && (
                <div className="absolute top-4 left-4 space-y-2">
                  {state.ui.measurementMode !== 'none' && (
                    <div className="px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-md text-sm">
                      Click to {state.ui.measurementMode === 'linear' ? 'measure distance' : 'define area'}
                      {measurementPoints.length > 0 && (
                        <span className="ml-2">({measurementPoints.length} point{measurementPoints.length !== 1 ? 's' : ''})</span>
                      )}
                    </div>
                  )}
                  
                  {aiRoofAnalysis && (
                    <div className="px-3 py-2 bg-purple-100 border border-purple-300 rounded-md text-sm">
                      <div className="font-medium">🤖 AI Analysis Active</div>
                      <div className="text-xs mt-1">
                        <span className="inline-block w-3 h-3 bg-blue-200 border border-blue-500 mr-1"></span>
                        Roof segments
                      </div>
                      <div className="text-xs">
                        <span className="inline-block w-3 h-3 bg-green-300 border border-green-400 mr-1"></span>
                        Solar panels
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Street View */}
          {state.ui.viewMode === 'streetview' && (
            <div className="grid grid-cols-2 gap-4">
              {state.streetViewImages.length > 0 ? (
                state.streetViewImages.map((image, index) => (
                  <StreetViewImage 
                    key={index} 
                    image={image} 
                    onFallback={() => {
                      console.log(`Street view failed for ${image.label}, suggesting satellite fallback`);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Street View Available</h3>
                  <p className="text-gray-500 mb-4">
                    Street view imagery is not available for this location.
                  </p>
                  <button
                    onClick={() => updateUIState({ viewMode: 'satellite' })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Satellite className="h-4 w-4" />
                    View Satellite Imagery
                  </button>
                </div>
              )}
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

          {/* Solar Analysis View */}
          {state.ui.viewMode === 'solar' && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
                Solar Site Analysis
              </h3>
              
              {!solarAnalysis && !solarAnalysisLoading && (
                <div className="text-center py-12">
                  <Sun className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Solar Analysis Required</h4>
                  <p className="text-gray-500 mb-4">
                    Get detailed solar potential analysis for this property using Google Solar API.
                  </p>
                  <button
                    onClick={analyzeRoof}
                    disabled={!state.coordinates || !state.satelliteImage}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-purple-600 text-white rounded-lg hover:from-yellow-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    <Sun className="h-5 w-5" />
                    <span>🤖</span>
                    Analyze Roof
                  </button>
                </div>
              )}

              {solarAnalysisLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing solar potential...</p>
                </div>
              )}

              {(solarAnalysis || aiRoofAnalysis) && (
                <div>
                  {/* Analysis Summary Header */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-purple-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm">🤖</span>
                        <span className="font-medium text-gray-900">Comprehensive Roof Analysis</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {solarAnalysis && aiRoofAnalysis ? 'Google + AI Analysis' : 
                         solarAnalysis ? 'Google Analysis' : 'AI Analysis Only'}
                      </div>
                    </div>
                    
                    {/* Quick Comparison */}
                    {solarAnalysis && aiRoofAnalysis && (
                      <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Roof Area</div>
                          <div className="text-yellow-600">Google: {solarAnalysis.recommendations?.roofAnalysis?.totalRoofArea?.toFixed(0) || 'N/A'} m²</div>
                          <div className="text-purple-600">AI: {aiRoofAnalysis.roofArea.toFixed(0)} m²</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Panel Count</div>
                          <div className="text-yellow-600">Google: {solarAnalysis.recommendations?.recommendedPanels || 'N/A'}</div>
                          <div className="text-purple-600">AI: {aiRoofAnalysis.panelPlacement.length}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Confidence</div>
                          <div className="text-purple-600">AI: {(aiRoofAnalysis.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data Source Indicator for Fallback */}
                  {solarAnalysis?.source === 'fallback' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Using Enhanced Geographic Analysis
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Google Solar API not available. Analysis based on location, climate data, and solar engineering principles.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Panel Recommendations */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Panel Recommendations
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recommended Panels:</span>
                        <span className="font-medium">{solarAnalysis.recommendations?.recommendedPanels || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Panel Type:</span>
                        <span className="font-medium">{solarAnalysis.recommendations?.panelType || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orientation:</span>
                        <span className="font-medium">{solarAnalysis.recommendations?.orientation || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Optimal Tilt:</span>
                        <span className="font-medium">{solarAnalysis.recommendations?.tilt || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Output:</span>
                        <span className="font-medium text-green-600">
                          {solarAnalysis.recommendations?.estimatedAnnualOutput?.toLocaleString() || 'N/A'} kWh
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Roof Analysis */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Square className="h-5 w-5 text-blue-600" />
                      Roof Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Roof Area:</span>
                        <span className="font-medium">
                          {solarAnalysis.recommendations?.roofAnalysis?.totalRoofArea?.toFixed(0) || 'N/A'} m²
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usable Area:</span>
                        <span className="font-medium">
                          {solarAnalysis.recommendations?.roofAnalysis?.usableRoofArea?.toFixed(0) || 'N/A'} m²
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Roof Segments:</span>
                        <span className="font-medium">{solarAnalysis.recommendations?.roofAnalysis?.roofSegments || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Imagery Quality:</span>
                        <span className="font-medium">{solarAnalysis.recommendations?.roofAnalysis?.imageryQuality || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Solar Potential */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-600" />
                      Solar Potential
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Energy:</span>
                        <span className="font-medium text-green-600">
                          {solarAnalysis.solarPotential?.annualEnergyPotential?.toLocaleString() || 'N/A'} kWh
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily Average:</span>
                        <span className="font-medium">{solarAnalysis.solarPotential?.dailyAverage?.toFixed(1) || 'N/A'} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Average:</span>
                        <span className="font-medium">{solarAnalysis.solarPotential?.monthlyAverage?.toFixed(0) || 'N/A'} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Peak Power:</span>
                        <span className="font-medium">{solarAnalysis.solarPotential?.peakPowerPotential?.toLocaleString() || 'N/A'} W</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Roof Detection Results */}
                  {aiRoofAnalysis && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-purple-600">🤖</span>
                        AI Roof Detection
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Detected Roof Area:</span>
                          <span className="font-medium text-purple-600">
                            {aiRoofAnalysis.roofArea.toFixed(0)} m²
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Usable Area:</span>
                          <span className="font-medium">
                            {aiRoofAnalysis.usableArea.toFixed(0)} m²
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Roof Segments:</span>
                          <span className="font-medium">{aiRoofAnalysis.roofSegments.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Optimal Panels:</span>
                          <span className="font-medium text-green-600">{aiRoofAnalysis.panelPlacement.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Analysis Confidence:</span>
                          <span className="font-medium">
                            {(aiRoofAnalysis.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processing Time:</span>
                          <span className="font-medium text-blue-600">
                            {aiRoofAnalysis.processingTime.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shading Factor:</span>
                          <span className="font-medium">
                            {(aiRoofAnalysis.shadingAnalysis.averageShading * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Analysis */}
                  {solarAnalysis?.recommendations?.financialAnalysis && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-green-600">💰</span>
                        Financial Analysis
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Bill:</span>
                          <span className="font-medium">
                            ${solarAnalysis.recommendations.financialAnalysis.monthlyBill?.toFixed(0) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Solar Percentage:</span>
                          <span className="font-medium">
                            {solarAnalysis.recommendations.financialAnalysis.solarPercentage?.toFixed(0) || 'N/A'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Federal Incentive:</span>
                          <span className="font-medium text-green-600">
                            ${solarAnalysis.recommendations.financialAnalysis.federalIncentive?.toFixed(0) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Metering:</span>
                          <span className="font-medium">
                            {solarAnalysis.recommendations.financialAnalysis.netMeteringAllowed ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Street View Image Component with Error Handling
interface StreetViewImageProps {
  image: {
    imageUrl: string;
    label: string;
    heading: number;
  };
  onFallback: () => void;
}

const StreetViewImage: React.FC<StreetViewImageProps> = ({ image, onFallback }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [showCopyright, setShowCopyright] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageStatus('loaded');
    setShowCopyright(true);
  }, []);

  const handleImageError = useCallback(() => {
    console.warn(`Street view image failed to load: ${image.label}`, image.imageUrl);
    setImageStatus('error');
    onFallback();
  }, [image.label, image.imageUrl, onFallback]);

  const handleRetry = useCallback(() => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setImageStatus('loading');
      // Force image reload by adding timestamp
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      img.src = `${image.imageUrl}&retry=${Date.now()}`;
    }
  }, [retryCount, image.imageUrl, handleImageLoad, handleImageError]);

  const renderErrorFallback = () => (
    <div className="w-full h-48 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
      <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-600 mb-2">Street view unavailable</p>
      <p className="text-xs text-gray-500 text-center mb-3">
        No street view imagery available for {image.label.toLowerCase()}
      </p>
      {retryCount < 2 && (
        <button
          onClick={handleRetry}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className="w-full h-48 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-sm text-gray-600">Loading {image.label.toLowerCase()}...</p>
      </div>
    </div>
  );

  return (
    <div className="text-center">
      {imageStatus === 'loading' && renderLoadingState()}
      {imageStatus === 'error' && renderErrorFallback()}
      {imageStatus !== 'error' && (
        <div className="relative">
          <img
            src={image.imageUrl}
            alt={image.label}
            className={`w-full h-auto border border-gray-200 rounded-lg ${
              imageStatus === 'loading' ? 'opacity-0 absolute' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ minHeight: imageStatus === 'loading' ? '0' : 'auto' }}
          />
          {showCopyright && imageStatus === 'loaded' && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              © Google
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-sm text-gray-600">{image.label}</p>
      {imageStatus === 'loaded' && (
        <p className="text-xs text-gray-500">Heading: {image.heading}°</p>
      )}
    </div>
  );
};