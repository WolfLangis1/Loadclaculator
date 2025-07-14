/**
 * Advanced Measurement Tools Panel
 * 
 * Professional measurement interface for aerial imagery with GPS coordinate
 * integration, precision measurement tools, and comprehensive export capabilities.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Ruler,
  Square,
  MapPin,
  Target,
  Settings,
  Download,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Edit3,
  Plus,
  Minus,
  RotateCcw,
  Grid,
  Crosshair,
  Navigation,
  Mountain,
  Calculator,
  FileText,
  Share2,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  Move
} from 'lucide-react';

import AdvancedMeasurementService, {
  MeasurementPoint,
  LinearMeasurement,
  AreaMeasurement,
  GPSCoordinate,
  MeasurementProject,
  MeasurementConfig
} from '../../services/advancedMeasurementService';

interface MeasurementToolsPanelProps {
  imageMetadata?: {
    bounds: { north: number; south: number; east: number; west: number };
    width: number;
    height: number;
  };
  onMeasurementCreated?: (measurement: LinearMeasurement | AreaMeasurement) => void;
  onPointSelected?: (point: MeasurementPoint) => void;
  className?: string;
}

interface ActiveMeasurement {
  type: 'distance' | 'area' | 'setback' | 'elevation';
  points: MeasurementPoint[];
  isComplete: boolean;
}

type MeasurementMode = 'none' | 'distance' | 'area' | 'setback' | 'elevation' | 'point';

export const MeasurementToolsPanel: React.FC<MeasurementToolsPanelProps> = ({
  imageMetadata,
  onMeasurementCreated,
  onPointSelected,
  className = ''
}) => {
  // Core state
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentProject, setCurrentProject] = useState<MeasurementProject | null>(null);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none');
  const [activeMeasurement, setActiveMeasurement] = useState<ActiveMeasurement | null>(null);
  const [measurements, setMeasurements] = useState<{
    linear: LinearMeasurement[];
    area: AreaMeasurement[];
  }>({ linear: [], area: [] });

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [precision, setPrecision] = useState(2);
  const [units, setUnits] = useState<'meters' | 'feet'>('meters');

  // Mouse tracking
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [realTimeDistance, setRealTimeDistance] = useState<number | null>(null);

  // Configuration
  const [config, setConfig] = useState<Partial<MeasurementConfig>>({
    precision: {
      coordinatePrecision: 6,
      distancePrecision: 2,
      areaPrecision: 2,
      elevationPrecision: 1
    },
    behavior: {
      autoSnap: true,
      snapTolerance: 10,
      showRealTimeDistance: true,
      showBearing: true,
      showElevation: false,
      magneticDeclination: 0
    },
    display: {
      defaultLineColor: '#3B82F6',
      defaultAreaColor: '#3B82F660',
      highlightColor: '#EF4444',
      labelSize: 12,
      showGrid: false,
      gridSpacing: 10
    }
  });

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await AdvancedMeasurementService.initialize(config);
        setIsInitialized(true);
        
        // Create default project
        if (imageMetadata) {
          const centerLat = (imageMetadata.bounds.north + imageMetadata.bounds.south) / 2;
          const centerLon = (imageMetadata.bounds.east + imageMetadata.bounds.west) / 2;
          
          const project = AdvancedMeasurementService.createProject(
            'Site Measurements',
            { latitude: centerLat, longitude: centerLon },
            'Aerial view measurements for electrical project'
          );
          
          setCurrentProject(project);
        }
        
        console.log('📐 Measurement Tools Panel initialized');
      } catch (error) {
        console.error('❌ Failed to initialize measurement tools:', error);
      }
    };

    initializeService();
  }, [imageMetadata, config]);

  // Handle canvas clicks for measurement
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!isInitialized || !imageMetadata || measurementMode === 'none') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    // Convert pixel to GPS coordinates
    const gpsCoord = AdvancedMeasurementService.pixelToGPS(pixelX, pixelY, imageMetadata);
    
    const point: MeasurementPoint = {
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      coordinates: gpsCoord,
      pixelPosition: { x: pixelX, y: pixelY },
      type: measurementMode === 'setback' ? 'setback' : 'waypoint'
    };

    if (measurementMode === 'point') {
      // Just add a reference point
      onPointSelected?.(point);
      return;
    }

    // Handle active measurement
    if (!activeMeasurement) {
      // Start new measurement
      setActiveMeasurement({
        type: measurementMode as any,
        points: [point],
        isComplete: false
      });
    } else {
      // Add point to current measurement
      const updatedMeasurement = {
        ...activeMeasurement,
        points: [...activeMeasurement.points, point]
      };

      if (measurementMode === 'distance' && updatedMeasurement.points.length >= 2) {
        // Complete distance measurement
        completeMeasurement(updatedMeasurement);
      } else if (measurementMode === 'area' && updatedMeasurement.points.length >= 3) {
        // Area measurement - continue adding points until double-click or explicit completion
        setActiveMeasurement(updatedMeasurement);
      } else {
        setActiveMeasurement(updatedMeasurement);
      }
    }
  }, [isInitialized, imageMetadata, measurementMode, activeMeasurement, onPointSelected]);

  // Complete current measurement
  const completeMeasurement = useCallback((measurement: ActiveMeasurement) => {
    if (!isInitialized || measurement.points.length < 2) return;

    try {
      if (measurement.type === 'distance' || measurement.type === 'setback') {
        const linearMeasurement = AdvancedMeasurementService.createLinearMeasurement(
          measurement.points,
          measurement.type
        );
        
        setMeasurements(prev => ({
          ...prev,
          linear: [...prev.linear, linearMeasurement]
        }));
        
        onMeasurementCreated?.(linearMeasurement);
        
      } else if (measurement.type === 'area' && measurement.points.length >= 3) {
        const areaMeasurement = AdvancedMeasurementService.createAreaMeasurement(
          measurement.points,
          'installation_area'
        );
        
        setMeasurements(prev => ({
          ...prev,
          area: [...prev.area, areaMeasurement]
        }));
        
        onMeasurementCreated?.(areaMeasurement);
      }

      // Reset active measurement
      setActiveMeasurement(null);
      setMeasurementMode('none');
      
    } catch (error) {
      console.error('Failed to complete measurement:', error);
    }
  }, [isInitialized, onMeasurementCreated]);

  // Cancel current measurement
  const cancelMeasurement = useCallback(() => {
    setActiveMeasurement(null);
    setMeasurementMode('none');
  }, []);

  // Handle mouse move for real-time distance
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!imageMetadata) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    setMousePosition({ x: pixelX, y: pixelY });

    // Calculate real-time distance if in measurement mode
    if (activeMeasurement && activeMeasurement.points.length > 0 && config.behavior?.showRealTimeDistance) {
      const mouseGPS = AdvancedMeasurementService.pixelToGPS(pixelX, pixelY, imageMetadata);
      const lastPoint = activeMeasurement.points[activeMeasurement.points.length - 1];
      const distance = AdvancedMeasurementService.calculateDistance(
        lastPoint.coordinates,
        mouseGPS
      );
      setRealTimeDistance(distance.meters);
    } else {
      setRealTimeDistance(null);
    }
  }, [imageMetadata, activeMeasurement, config.behavior?.showRealTimeDistance]);

  // Export measurements
  const exportMeasurements = useCallback(async (format: 'json' | 'csv' | 'kml' | 'geojson') => {
    if (!currentProject) return;

    try {
      const exported = await AdvancedMeasurementService.exportProject(currentProject.id, format);
      
      // Create download
      const blob = new Blob([exported], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `measurements.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log(`📁 Exported measurements as ${format}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [currentProject]);

  // Format coordinate display
  const formatCoordinate = (coord: GPSCoordinate) => {
    return `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
  };

  // Format distance display
  const formatDistance = (meters: number) => {
    if (units === 'feet') {
      return `${(meters * 3.28084).toFixed(precision)} ft`;
    }
    return `${meters.toFixed(precision)} m`;
  };

  // Format area display
  const formatArea = (squareMeters: number) => {
    if (units === 'feet') {
      return `${(squareMeters * 10.7639).toFixed(precision)} ft²`;
    }
    return `${squareMeters.toFixed(precision)} m²`;
  };

  if (!isInitialized) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Ruler className="h-5 w-5 animate-pulse" />
          <span>Initializing measurement tools...</span>
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
            <Ruler className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Measurement Tools</h3>
            {measurementMode !== 'none' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {measurementMode} mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle grid"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units
                </label>
                <select
                  value={units}
                  onChange={(e) => setUnits(e.target.value as 'meters' | 'feet')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="meters">Meters</option>
                  <option value="feet">Feet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precision
                </label>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 decimal place</option>
                  <option value={2}>2 decimal places</option>
                  <option value={3}>3 decimal places</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Snap to grid</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCoordinates}
                  onChange={(e) => setShowCoordinates(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Show coordinates</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tool Selection */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMeasurementMode(measurementMode === 'distance' ? 'none' : 'distance')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              measurementMode === 'distance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Ruler className="h-4 w-4" />
            Distance
          </button>
          <button
            onClick={() => setMeasurementMode(measurementMode === 'area' ? 'none' : 'area')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              measurementMode === 'area'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Square className="h-4 w-4" />
            Area
          </button>
          <button
            onClick={() => setMeasurementMode(measurementMode === 'setback' ? 'none' : 'setback')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              measurementMode === 'setback'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Target className="h-4 w-4" />
            Setback
          </button>
          <button
            onClick={() => setMeasurementMode(measurementMode === 'point' ? 'none' : 'point')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              measurementMode === 'point'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="h-4 w-4" />
            Point
          </button>
        </div>

        {/* Active measurement controls */}
        {activeMeasurement && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                <div className="font-medium">
                  {activeMeasurement.type} measurement in progress
                </div>
                <div>
                  {activeMeasurement.points.length} point(s) added
                  {realTimeDistance && ` • ${formatDistance(realTimeDistance)}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeMeasurement.type === 'area' && activeMeasurement.points.length >= 3 && (
                  <button
                    onClick={() => completeMeasurement(activeMeasurement)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={cancelMeasurement}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Panel */}
      {showResults && (measurements.linear.length > 0 || measurements.area.length > 0) && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Measurements</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportMeasurements('csv')}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Export as CSV"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowResults(false)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Hide results"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {/* Linear measurements */}
            {measurements.linear.map((measurement) => (
              <div key={measurement.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 capitalize">
                        {measurement.type}
                      </span>
                      {measurement.compliance.necSetbackCompliance === false && (
                        <AlertTriangle className="h-4 w-4 text-red-600" title="NEC compliance issue" />
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      <div>Distance: {formatDistance(measurement.results.distanceMeters)}</div>
                      <div>Bearing: {measurement.results.bearing.toFixed(1)}°</div>
                      {showCoordinates && measurement.points.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Start: {formatCoordinate(measurement.points[0].coordinates)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Remove measurement logic would go here
                      console.log('Remove measurement:', measurement.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Area measurements */}
            {measurements.area.map((measurement) => (
              <div key={measurement.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-900 capitalize">
                        {measurement.type.replace('_', ' ')}
                      </span>
                      {measurement.compliance.necCompliant && (
                        <CheckCircle className="h-4 w-4 text-green-600" title="NEC compliant" />
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      <div>Area: {formatArea(measurement.results.areaSquareMeters)}</div>
                      <div>Perimeter: {formatDistance(measurement.results.perimeterMeters)}</div>
                      {measurement.solar && (
                        <div className="text-xs text-gray-600 mt-1">
                          Solar: {measurement.solar.maxPanelCount} panels, {measurement.solar.estimatedCapacity} kW
                        </div>
                      )}
                      {showCoordinates && (
                        <div className="text-xs text-gray-500 mt-1">
                          Center: {formatCoordinate(measurement.results.centroid)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Remove measurement logic would go here
                      console.log('Remove measurement:', measurement.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {measurementMode !== 'none' && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Instructions:</div>
            {measurementMode === 'distance' && (
              <div>Click two points to measure distance</div>
            )}
            {measurementMode === 'area' && (
              <div>Click points to define area boundary, then click "Complete"</div>
            )}
            {measurementMode === 'setback' && (
              <div>Click two points to measure setback distance (NEC compliance checked)</div>
            )}
            {measurementMode === 'point' && (
              <div>Click to add reference points with GPS coordinates</div>
            )}
          </div>
        </div>
      )}

      {/* Export Options */}
      {currentProject && (measurements.linear.length > 0 || measurements.area.length > 0) && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Export Measurements</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportMeasurements('json')}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                JSON
              </button>
              <button
                onClick={() => exportMeasurements('csv')}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => exportMeasurements('kml')}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                KML
              </button>
              <button
                onClick={() => exportMeasurements('geojson')}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                GeoJSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mouse position display */}
      {mousePosition && imageMetadata && showCoordinates && (
        <div className="p-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Pixel: {mousePosition.x}, {mousePosition.y}
            </span>
            <span>
              GPS: {formatCoordinate(
                AdvancedMeasurementService.pixelToGPS(
                  mousePosition.x,
                  mousePosition.y,
                  imageMetadata
                )
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementToolsPanel;