/**
 * 3D Model Generation Panel
 * 
 * Advanced interface for generating and managing 3D site models from multiple
 * aerial imagery angles with real-time processing progress and model visualization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Camera,
  Play,
  Pause,
  Square,
  RotateCw,
  Eye,
  EyeOff,
  Download,
  Settings,
  Layers,
  Zap,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Maximize,
  Minimize,
  RefreshCw,
  Archive,
  FileText,
  Sun,
  Ruler,
  Target,
  Move3D,
  Scan,
  Gauge
} from 'lucide-react';

import ThreeDModelService, {
  AerialImagery,
  ThreeDModel,
  ProcessingProgress,
  PhotogrammetryConfig
} from '../../services/threeDModelService';

interface ThreeDModelPanelProps {
  location?: {
    latitude: number;
    longitude: number;
  };
  imageMetadata?: {
    bounds: { north: number; south: number; east: number; west: number };
    width: number;
    height: number;
  };
  onModelGenerated?: (model: ThreeDModel) => void;
  className?: string;
}

interface ModelingSession {
  id: string;
  images: AerialImagery[];
  processingId?: string;
  modelId?: string;
  status: 'setup' | 'processing' | 'complete' | 'error';
  progress?: ProcessingProgress;
  model?: ThreeDModel;
}

export const ThreeDModelPanel: React.FC<ThreeDModelPanelProps> = ({
  location,
  imageMetadata,
  onModelGenerated,
  className = ''
}) => {
  // Core state
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSession, setCurrentSession] = useState<ModelingSession | null>(null);
  const [models, setModels] = useState<ThreeDModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ThreeDModel | null>(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showProcessingDetails, setShowProcessingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'setup' | 'processing' | 'viewer' | 'analysis'>('setup');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Configuration
  const [config, setConfig] = useState<Partial<PhotogrammetryConfig>>({
    featureDetection: {
      algorithm: 'sift',
      maxFeatures: 10000,
      threshold: 0.04,
      enableGPU: true
    },
    qualityControl: {
      minOverlap: 30,
      maxReprojectionError: 2.0,
      minTriangulationAngle: 3.0,
      maxBaselineRatio: 0.6
    }
  });

  // Mock aerial imagery for demonstration
  const [availableImages, setAvailableImages] = useState<AerialImagery[]>([]);

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await ThreeDModelService.initialize(config);
        setIsInitialized(true);
        
        // Generate mock images for demonstration
        if (location) {
          generateMockImages(location);
        }
        
        console.log('🏗️ 3D Model Panel initialized');
      } catch (error) {
        console.error('❌ Failed to initialize 3D modeling service:', error);
      }
    };

    initializeService();
  }, [location, config]);

  // Auto-refresh processing progress
  useEffect(() => {
    if (!autoRefresh || !currentSession?.processingId) return;

    const interval = setInterval(() => {
      const progress = ThreeDModelService.getProcessingProgress(currentSession.processingId!);
      if (progress) {
        setCurrentSession(prev => prev ? { ...prev, progress } : null);
        
        if (progress.stage === 'complete') {
          // Check for completed model
          const model = ThreeDModelService.getModel(currentSession.modelId!);
          if (model) {
            setCurrentSession(prev => prev ? { ...prev, model, status: 'complete' } : null);
            setModels(prev => [...prev, model]);
            onModelGenerated?.(model);
            setViewMode('viewer');
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, currentSession?.processingId, currentSession?.modelId, onModelGenerated]);

  // Generate mock aerial imagery for demonstration
  const generateMockImages = useCallback((loc: { latitude: number; longitude: number }) => {
    const images: AerialImagery[] = [];
    
    // Generate 5 images from different angles
    const angles = [0, 45, 90, 135, 180];
    
    angles.forEach((azimuth, index) => {
      images.push({
        id: `aerial_${index}`,
        url: `https://example.com/aerial_${index}.jpg`,
        metadata: {
          coordinates: {
            latitude: loc.latitude + (Math.random() - 0.5) * 0.001,
            longitude: loc.longitude + (Math.random() - 0.5) * 0.001,
            altitude: 100 + Math.random() * 50
          },
          viewAngle: {
            azimuth,
            elevation: 45 + Math.random() * 20,
            roll: Math.random() * 10 - 5
          },
          camera: {
            focalLength: 24,
            sensorWidth: 36,
            sensorHeight: 24,
            imageWidth: 4000,
            imageHeight: 3000
          },
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          source: 'google',
          quality: 'high'
        },
        georeference: {
          bounds: {
            north: loc.latitude + 0.001,
            south: loc.latitude - 0.001,
            east: loc.longitude + 0.001,
            west: loc.longitude - 0.001
          },
          projection: 'EPSG:4326',
          datum: 'WGS84'
        }
      });
    });
    
    setAvailableImages(images);
  }, []);

  // Start 3D model generation
  const startModelGeneration = useCallback(async () => {
    if (!isInitialized || !location || availableImages.length < 3) return;

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { modelId, processingId } = await ThreeDModelService.generateModel(
        availableImages,
        sessionId,
        location,
        config
      );

      const session: ModelingSession = {
        id: sessionId,
        images: availableImages,
        processingId,
        modelId,
        status: 'processing'
      };

      setCurrentSession(session);
      setViewMode('processing');
      
      console.log('🏗️ Started 3D model generation:', { sessionId, modelId, processingId });
    } catch (error) {
      console.error('❌ Failed to start model generation:', error);
      setCurrentSession(prev => prev ? { ...prev, status: 'error' } : null);
    }
  }, [isInitialized, location, availableImages, config]);

  // Export model in specified format
  const exportModel = useCallback(async (model: ThreeDModel, format: string) => {
    try {
      const exported = await ThreeDModelService.exportModel(model.id, format as any);
      
      // Create download
      const blob = new Blob([exported], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `model_${model.id}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log(`📁 Exported 3D model as ${format}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  // Analyze solar potential
  const analyzeSolar = useCallback(async (model: ThreeDModel) => {
    try {
      const analysis = await ThreeDModelService.analyzeSolarPotential(model.id);
      console.log('☀️ Solar analysis complete:', analysis);
      
      // Update model with solar analysis
      setModels(prev => prev.map(m => 
        m.id === model.id 
          ? { ...m, solar: { ...m.solar, roofPlanes: analysis.roofPlanes } }
          : m
      ));
    } catch (error) {
      console.error('Solar analysis failed:', error);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Box className="h-5 w-5 animate-pulse" />
          <span>Initializing 3D modeling service...</span>
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
            <Box className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">3D Site Modeling</h3>
            {currentSession?.status && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                currentSession.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                currentSession.status === 'complete' ? 'bg-green-100 text-green-800' :
                currentSession.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentSession.status}
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

        {/* View Mode Tabs */}
        <div className="mt-3 flex items-center gap-1">
          {(['setup', 'processing', 'viewer', 'analysis'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                viewMode === mode
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Detection
                </label>
                <select
                  value={config.featureDetection?.algorithm}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    featureDetection: {
                      ...prev.featureDetection!,
                      algorithm: e.target.value as any
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="sift">SIFT</option>
                  <option value="surf">SURF</option>
                  <option value="orb">ORB</option>
                  <option value="akaze">AKAZE</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Overlap (%)
                </label>
                <input
                  type="number"
                  value={config.qualityControl?.minOverlap}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    qualityControl: {
                      ...prev.qualityControl!,
                      minOverlap: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  min="10"
                  max="80"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.featureDetection?.enableGPU}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    featureDetection: {
                      ...prev.featureDetection!,
                      enableGPU: e.target.checked
                    }
                  }))}
                />
                <span className="text-sm text-gray-700">Enable GPU acceleration</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'setup' && (
        <div className="p-4">
          <div className="space-y-4">
            {/* Image Collection Status */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">Available Images</div>
                <div className="text-sm text-blue-700">
                  {availableImages.length} images detected from multiple angles
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">{availableImages.length}</span>
              </div>
            </div>

            {/* Image Quality Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Coverage</span>
                </div>
                <div className="text-xs text-gray-600">
                  Estimated overlap: {Math.min(85, 30 + availableImages.length * 10)}%
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Quality</span>
                </div>
                <div className="text-xs text-gray-600">
                  {availableImages.length >= 5 ? 'Excellent' : 
                   availableImages.length >= 3 ? 'Good' : 'Insufficient'}
                </div>
              </div>
            </div>

            {/* Requirements Check */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className={`h-4 w-4 ${
                  availableImages.length >= 3 ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span>Minimum 3 images ({availableImages.length})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className={`h-4 w-4 ${
                  location ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span>GPS coordinates available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Processing engine ready</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={startModelGeneration}
              disabled={availableImages.length < 3 || !location}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="h-5 w-5" />
              Generate 3D Model
            </button>
          </div>
        </div>
      )}

      {viewMode === 'processing' && currentSession?.progress && (
        <div className="p-4">
          <div className="space-y-4">
            {/* Progress Overview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-blue-900">{currentSession.progress.currentTask}</div>
                <div className="text-sm text-blue-700">
                  {Math.round(currentSession.progress.estimatedTimeRemaining / 60)}m remaining
                </div>
              </div>
              
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentSession.progress.progress}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-2 text-sm text-blue-700">
                <span>Stage: {currentSession.progress.stage.replace('_', ' ')}</span>
                <span>{currentSession.progress.progress}%</span>
              </div>
            </div>

            {/* Processing Stages */}
            <div className="space-y-2">
              {[
                { stage: 'preprocessing', label: 'Image Preprocessing', icon: Scan },
                { stage: 'feature_detection', label: 'Feature Detection', icon: Target },
                { stage: 'matching', label: 'Feature Matching', icon: Move3D },
                { stage: 'bundle_adjustment', label: 'Bundle Adjustment', icon: Settings },
                { stage: 'dense_reconstruction', label: 'Dense Reconstruction', icon: Layers },
                { stage: 'mesh_generation', label: 'Mesh Generation', icon: Box },
                { stage: 'optimization', label: 'Solar Analysis', icon: Sun }
              ].map(({ stage, label, icon: Icon }) => (
                <div
                  key={stage}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    currentSession.progress!.stage === stage ? 'bg-blue-100' :
                    ['preprocessing', 'feature_detection', 'matching', 'bundle_adjustment', 'dense_reconstruction', 'mesh_generation', 'optimization'].indexOf(currentSession.progress!.stage) >
                    ['preprocessing', 'feature_detection', 'matching', 'bundle_adjustment', 'dense_reconstruction', 'mesh_generation', 'optimization'].indexOf(stage) ? 'bg-green-50' :
                    'bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${
                    currentSession.progress!.stage === stage ? 'text-blue-600' :
                    ['preprocessing', 'feature_detection', 'matching', 'bundle_adjustment', 'dense_reconstruction', 'mesh_generation', 'optimization'].indexOf(currentSession.progress!.stage) >
                    ['preprocessing', 'feature_detection', 'matching', 'bundle_adjustment', 'dense_reconstruction', 'mesh_generation', 'optimization'].indexOf(stage) ? 'text-green-600' :
                    'text-gray-400'
                  }`} />
                  <span className={`text-sm ${
                    currentSession.progress!.stage === stage ? 'font-medium text-blue-900' :
                    ['preprocessing', 'feature_detection', 'matching', 'bundle_adjustment', 'dense_reconstruction', 'mesh_generation', 'optimization'].indexOf(currentSession.progress!.stage) >
                    ['preprocessing', 'feature_detection', 'matching', 'bundle_adjustment', 'dense_reconstruction', 'mesh_generation', 'optimization'].indexOf(stage) ? 'text-green-700' :
                    'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Processing Logs */}
            {showProcessingDetails && (
              <div className="max-h-32 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="space-y-1">
                  {currentSession.progress.processingLogs.slice(-5).map((log, index) => (
                    <div key={index} className="text-xs">
                      <span className="text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={`ml-2 ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warning' ? 'text-yellow-600' :
                        'text-gray-700'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProcessingDetails(!showProcessingDetails)}
              className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showProcessingDetails ? 'Hide' : 'Show'} Processing Details
            </button>
          </div>
        </div>
      )}

      {viewMode === 'viewer' && (
        <div className="p-4">
          <div className="space-y-4">
            {/* Model List */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Generated Models</h4>
              {models.length === 0 ? (
                <div className="p-3 text-center text-gray-500 border border-gray-200 rounded-lg">
                  No 3D models generated yet
                </div>
              ) : (
                models.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedModel?.id === model.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          Model {model.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {model.meshes.length} surfaces • {model.pointCloud.length} points
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {model.quality.completeness}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Model Details */}
            {selectedModel && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">Quality</div>
                    <div className="text-gray-600">
                      {selectedModel.quality.averageAccuracy}m accuracy
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Coverage</div>
                    <div className="text-gray-600">
                      {selectedModel.quality.completeness}% complete
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Point Density</div>
                    <div className="text-gray-600">
                      {selectedModel.quality.pointDensity.toFixed(1)} pts/m²
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Processing</div>
                    <div className="text-gray-600">
                      {selectedModel.processing.processingTime}s
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            {selectedModel && (
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Export Model</h5>
                <div className="grid grid-cols-2 gap-2">
                  {['obj', 'ply', 'gltf', 'dxf'].map((format) => (
                    <button
                      key={format}
                      onClick={() => exportModel(selectedModel, format)}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'analysis' && selectedModel && (
        <div className="p-4">
          <div className="space-y-4">
            {/* Solar Analysis */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Solar Analysis</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-yellow-900">Roof Planes</div>
                  <div className="text-yellow-700">
                    {selectedModel.solar.roofPlanes.length} surfaces identified
                  </div>
                </div>
                <div>
                  <div className="font-medium text-yellow-900">Total Area</div>
                  <div className="text-yellow-700">
                    {selectedModel.solar.roofPlanes.reduce((sum, plane) => sum + plane.area, 0).toFixed(0)} m²
                  </div>
                </div>
                <div>
                  <div className="font-medium text-yellow-900">Usable Area</div>
                  <div className="text-yellow-700">
                    {selectedModel.solar.roofPlanes.reduce((sum, plane) => sum + plane.usableArea, 0).toFixed(0)} m²
                  </div>
                </div>
                <div>
                  <div className="font-medium text-yellow-900">Panel Capacity</div>
                  <div className="text-yellow-700">
                    {selectedModel.solar.roofPlanes.reduce((sum, plane) => sum + plane.panelCapacity, 0).toFixed(1)} kW
                  </div>
                </div>
              </div>

              <button
                onClick={() => analyzeSolar(selectedModel)}
                className="mt-3 w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                <Sun className="h-4 w-4 inline mr-2" />
                Refresh Solar Analysis
              </button>
            </div>

            {/* Roof Plane Details */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Roof Surfaces</h5>
              {selectedModel.solar.roofPlanes.map((plane, index) => (
                <div key={plane.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      Plane {index + 1}
                    </span>
                    <span className="text-sm text-gray-600">
                      {plane.area.toFixed(0)} m²
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>Azimuth: {plane.azimuth}°</div>
                    <div>Tilt: {plane.tilt}°</div>
                    <div>Capacity: {plane.panelCapacity.toFixed(1)} kW</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quality Metrics */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Model Quality</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Geometric Error:</span>
                  <span>{selectedModel.quality.geometricError}m RMS</span>
                </div>
                <div className="flex justify-between">
                  <span>Completeness:</span>
                  <span>{selectedModel.quality.completeness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Point Density:</span>
                  <span>{selectedModel.quality.pointDensity.toFixed(1)} pts/m²</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDModelPanel;