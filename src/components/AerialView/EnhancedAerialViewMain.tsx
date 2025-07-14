import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, 
  Camera, 
  Sun, 
  Navigation, 
  Plus, 
  Check, 
  X, 
  FileImage, 
  Download,
  Brain,
  Zap,
  Settings,
  Layers,
  Ruler,
  Shield,
  Clock,
  AlertTriangle,
  RotateCcw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

import { AerialViewService } from '../../services/aerialViewService';
import { GoogleSolarService, type SolarInsights } from '../../services/googleSolarService';
import { AttachmentService } from '../../services/attachmentService';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';

// Import our new AI services
import AIRoofAnalysisService, { 
  AIRoofAnalysisResult,
  AIAnalysisOptions,
  RoofPlane,
  RoofFeature,
  OptimizedPanelLayout
} from '../../services/aiRoofAnalysisService';

import { BuildingCharacteristics } from '../../services/necSetbackComplianceService';

import TensorFlowDetectionService, {
  DetectedObject,
  RoofDetectionResult
} from '../../services/tensorflowDetectionService';

import AIPanelPlacementService, {
  PlacementSolution,
  PlacementConstraints,
  OptimizationOptions
} from '../../services/aiPanelPlacementService';

type ViewMode = 'satellite' | 'streetview' | 'solar' | 'ai_analysis' | 'panel_placement';
type AnalysisMode = 'basic' | 'ai_enhanced' | 'professional';

interface AnalysisProgress {
  step: string;
  progress: number;
  message: string;
  complete: boolean;
}

export const EnhancedAerialViewMain: React.FC = () => {
  const { 
    state, 
    addAttachment, 
    markAttachmentForExport, 
    unmarkAttachmentForExport, 
    deleteAttachment 
  } = useLoadCalculator();

  // Basic state
  const [address, setAddress] = useState(state.projectInfo.propertyAddress || '');
  const [viewMode, setViewMode] = useState<ViewMode>('ai_analysis');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('ai_enhanced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(20);

  // AI Analysis state
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIRoofAnalysisResult | null>(null);
  const [detectionResult, setDetectionResult] = useState<RoofDetectionResult | null>(null);
  const [placementSolutions, setPlacementSolutions] = useState<PlacementSolution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<number>(0);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress[]>([]);

  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showLayerControls, setShowLayerControls] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    roofPlanes: true,
    obstacles: true,
    panels: true,
    setbacks: true,
    shading: false,
    measurements: false
  });

  // Analysis options
  const [analysisOptions, setAnalysisOptions] = useState<Partial<AIAnalysisOptions>>({
    modelConfidence: 0.7,
    featureDetection: true,
    roofPlaneDetection: true,
    includeShading: true,
    enableRealTimeShading: true,
    realTimeShadingOptions: {
      analysisTimeSpan: 'single_day',
      timeInterval: 60,
      shadowResolution: 'medium',
      includeWeatherData: true
    },
    enableEnhancedNECAnalysis: true,
    buildingCharacteristics: {
      type: 'residential',
      stories: 1,
      roofType: 'pitched',
      roofMaterial: 'asphalt_shingle',
      jurisdictionCode: 'ifc'
    },
    necVersion: '2023',
    jurisdiction: 'National',
    generateLayouts: 3,
    optimizeFor: 'production'
  });

  const [placementConstraints, setPlacementConstraints] = useState<Partial<PlacementConstraints>>({
    necCompliance: {
      fireSetback: 3.0,
      pathwayWidth: 3.0,
      smokeVentClearance: 3.0,
      hipRidgeClearance: 1.5
    },
    uniformOrientation: true,
    symmetricalLayout: true,
    optimizeForProduction: true
  });

  // Results state
  const [satelliteUrl, setSatelliteUrl] = useState('');
  const [coordinates, setCoordinates] = useState<{latitude: number; longitude: number} | null>(null);
  const [processingStats, setProcessingStats] = useState<{
    totalTime: number;
    confidence: number;
    objectsDetected: number;
    layoutsGenerated: number;
  } | null>(null);

  // Canvas and visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Auto-sync address when project info changes
  useEffect(() => {
    if (state.projectInfo.propertyAddress && state.projectInfo.propertyAddress !== address) {
      setAddress(state.projectInfo.propertyAddress);
    }
  }, [state.projectInfo.propertyAddress]);

  // Initialize AI services
  useEffect(() => {
    const initializeAI = async () => {
      try {
        console.log('🤖 Initializing AI services...');
        await TensorFlowDetectionService.initialize();
        console.log('✅ AI services ready');
      } catch (error) {
        console.warn('⚠️ AI initialization failed, falling back to basic analysis:', error);
      }
    };

    initializeAI();
  }, []);

  const updateProgress = useCallback((step: string, progress: number, message: string, complete: boolean = false) => {
    setAnalysisProgress(prev => {
      const existing = prev.find(p => p.step === step);
      if (existing) {
        return prev.map(p => p.step === step ? { ...p, progress, message, complete } : p);
      }
      return [...prev, { step, progress, message, complete }];
    });
  }, []);

  const handleAIAnalysis = async () => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisProgress([]);
    
    try {
      console.log('🏠 Starting AI-powered roof analysis for:', address);
      
      // Step 1: Geocode the address
      updateProgress('geocoding', 20, 'Geocoding address...');
      const geocodeResult = await AerialViewService.geocodeAddress(address);
      setCoordinates({ latitude: geocodeResult.latitude, longitude: geocodeResult.longitude });
      
      // Step 2: Get satellite imagery
      updateProgress('geocoding', 100, 'Address geocoded successfully', true);
      updateProgress('imagery', 30, 'Capturing high-resolution satellite imagery...');
      
      const imageUrl = await AerialViewService.getSatelliteImage(
        geocodeResult.latitude,
        geocodeResult.longitude,
        { width: 1024, height: 1024, zoom: zoom, scale: 2 }
      );
      setSatelliteUrl(imageUrl);
      
      updateProgress('imagery', 100, 'Satellite imagery captured', true);

      if (analysisMode === 'ai_enhanced' || analysisMode === 'professional') {
        // Step 3: AI Roof Analysis
        updateProgress('ai_analysis', 40, 'Running AI roof analysis...');
        
        const aiResult = await AIRoofAnalysisService.analyzeRoof(
          geocodeResult.latitude,
          geocodeResult.longitude,
          analysisOptions
        );
        setAiAnalysisResult(aiResult);
        
        updateProgress('ai_analysis', 100, `AI analysis complete (${aiResult.confidence * 100}% confidence)`, true);

        if (analysisMode === 'professional') {
          // Step 4: Advanced Panel Placement
          updateProgress('optimization', 60, 'Optimizing panel placement...');
          
          const solutions = await AIPanelPlacementService.generateOptimalPlacements(
            aiResult.roofPlanes,
            aiResult.features,
            aiResult.solarPotential,
            placementConstraints,
            { populationSize: 30, generations: 50 } as Partial<OptimizationOptions>
          );
          setPlacementSolutions(solutions);
          
          updateProgress('optimization', 100, `Generated ${solutions.length} optimized layouts`, true);
        }

        // Step 5: Real-Time Shading Analysis (if enabled and included in AI result)
        if (aiResult.realTimeShadingReport) {
          updateProgress('shading_analysis', 80, 'Real-time shading analysis completed');
          updateProgress('shading_analysis', 100, 
            `Analyzed ${aiResult.realTimeShadingReport.intervals.length} time points`, true);
        }

        // Step 6: Enhanced NEC Compliance Analysis (if enabled and included in AI result)
        if (aiResult.necComplianceAnalysis) {
          updateProgress('nec_compliance', 90, 'Enhanced NEC compliance analysis completed');
          updateProgress('nec_compliance', 100, 
            `Compliance score: ${aiResult.necComplianceAnalysis.complianceScore}% (${aiResult.necComplianceAnalysis.violations.length} violations)`, true);
        }
      }

      // Update processing stats
      const totalTime = Date.now();
      setProcessingStats({
        totalTime: Math.round(totalTime / 100), // Simplified
        confidence: aiAnalysisResult?.confidence || 0.85,
        objectsDetected: aiAnalysisResult?.features.length || 0,
        layoutsGenerated: placementSolutions.length
      });

      updateProgress('complete', 100, 'Analysis complete!', true);

    } catch (err) {
      console.error('❌ AI analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform AI analysis');
      updateProgress('error', 0, 'Analysis failed', false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProject = async (type: string, data: any) => {
    try {
      const attachment = await AttachmentService.createAttachmentFromCapture(
        'current_project',
        type as any,
        'ai_analysis',
        satelliteUrl,
        {
          address: address,
          coordinates: coordinates,
          analysisResult: data,
          timestamp: new Date().toISOString()
        }
      );
      
      addAttachment(attachment);
      console.log('✅ AI analysis saved to project:', attachment.name);
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      setError('Failed to save analysis to project');
    }
  };

  const renderProgressBar = () => {
    if (!loading && analysisProgress.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Analysis Progress
        </h3>
        
        <div className="space-y-3">
          {analysisProgress.map((step, index) => (
            <div key={step.step} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {step.complete ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : loading ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">
                    {step.step.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{step.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step.complete ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
                
                <p className="text-xs text-gray-600 mt-1">{step.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAIAnalysisResults = () => {
    if (!aiAnalysisResult) return null;

    return (
      <div className="space-y-6">
        {/* AI Analysis Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              AI Roof Analysis Results
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-purple-700 bg-purple-100 px-2 py-1 rounded">
                {Math.round(aiAnalysisResult.confidence * 100)}% Confidence
              </span>
              <button
                onClick={() => handleSaveToProject('ai_roof_analysis', aiAnalysisResult)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Analysis
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {aiAnalysisResult.roofPlanes.length}
              </div>
              <div className="text-sm text-gray-600">Roof Planes</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {aiAnalysisResult.features.length}
              </div>
              <div className="text-sm text-gray-600">Obstacles Detected</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {aiAnalysisResult.solarPotential.solarPotential.maxArrayPanelsCount}
              </div>
              <div className="text-sm text-gray-600">Max Panels</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(aiAnalysisResult.processingTime / 1000)}s
              </div>
              <div className="text-sm text-gray-600">Processing Time</div>
            </div>
          </div>

          {/* Satellite Image with Overlays */}
          <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
            <img
              src={satelliteUrl}
              alt="AI-analyzed satellite view"
              className="w-full h-auto"
              onLoad={() => {
                // Initialize canvas overlay when image loads
                if (canvasRef.current && aiAnalysisResult) {
                  drawAnalysisOverlay();
                }
              }}
            />
            
            {/* Canvas overlay for AI annotations */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'multiply' }}
            />

            {/* Layer controls */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowLayerControls(!showLayerControls)}
                className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-opacity-100 transition-all"
              >
                <Layers className="h-5 w-5 text-gray-700" />
              </button>
              
              {showLayerControls && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl p-4 min-w-48">
                  <h4 className="font-medium mb-3">Layer Visibility</h4>
                  <div className="space-y-2">
                    {Object.entries(visibleLayers).map(([layer, visible]) => (
                      <label key={layer} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={(e) => setVisibleLayers(prev => ({
                            ...prev,
                            [layer]: e.target.checked
                          }))}
                          className="rounded"
                        />
                        <span className="capitalize">{layer.replace(/([A-Z])/g, ' $1').trim()}</span>
                        {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {coordinates && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Panel Placement Solutions */}
        {placementSolutions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Optimized Panel Layouts ({placementSolutions.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Solution:</span>
                <select
                  value={selectedSolution}
                  onChange={(e) => setSelectedSolution(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  {placementSolutions.map((solution, index) => (
                    <option key={index} value={index}>
                      #{index + 1} - Score: {solution.score.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {placementSolutions[selectedSolution] && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {placementSolutions[selectedSolution].metrics.totalPanels}
                  </div>
                  <div className="text-xs text-blue-700">Panels</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">
                    {(placementSolutions[selectedSolution].metrics.totalWattage / 1000).toFixed(1)}kW
                  </div>
                  <div className="text-xs text-green-700">System Size</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-yellow-600">
                    {(placementSolutions[selectedSolution].metrics.estimatedProduction / 1000).toFixed(1)}MWh
                  </div>
                  <div className="text-xs text-yellow-700">Annual Production</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {placementSolutions[selectedSolution].score.toFixed(1)}
                  </div>
                  <div className="text-xs text-purple-700">Optimization Score</div>
                </div>
              </div>
            )}

            {/* Violations and Recommendations */}
            {placementSolutions[selectedSolution]?.violations.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Code Violations & Recommendations
                </h4>
                <div className="space-y-2">
                  {placementSolutions[selectedSolution].violations.map((violation, index) => (
                    <div key={index} className="text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        violation.severity === 'error' ? 'bg-red-500' :
                        violation.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <span className="font-medium">{violation.type.toUpperCase()}:</span>
                      <span className="ml-2">{violation.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-Time Shading Analysis */}
        {aiAnalysisResult.realTimeShadingReport && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Real-Time Shading Analysis
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {aiAnalysisResult.realTimeShadingReport.summary.averageDailyShading.toFixed(1)}%
                </div>
                <div className="text-sm text-amber-700">Average Daily Shading</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-red-600">
                  {aiAnalysisResult.realTimeShadingReport.summary.peakShadingHours.length}
                </div>
                <div className="text-sm text-red-700">Peak Shading Hours</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-green-600">
                  {aiAnalysisResult.realTimeShadingReport.summary.minimumShadingHours.length}
                </div>
                <div className="text-sm text-green-700">Optimal Hours</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-blue-600">
                  {aiAnalysisResult.realTimeShadingReport.intervals.length}
                </div>
                <div className="text-sm text-blue-700">Analysis Points</div>
              </div>
            </div>

            {/* Seasonal Variation */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Seasonal Shading Variation</h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(aiAnalysisResult.realTimeShadingReport.summary.seasonalVariation).map(([season, value]) => (
                  <div key={season} className="bg-gray-50 rounded p-3 text-center">
                    <div className="text-lg font-semibold text-gray-800">{value.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600 capitalize">{season}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Events */}
            {aiAnalysisResult.realTimeShadingReport.summary.criticalShadingEvents.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical Shading Events ({aiAnalysisResult.realTimeShadingReport.summary.criticalShadingEvents.length})
                </h4>
                <div className="space-y-2">
                  {aiAnalysisResult.realTimeShadingReport.summary.criticalShadingEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{event.time.toLocaleTimeString()}:</span>
                      <span className="ml-2">{event.description}</span>
                      <div className="text-xs text-yellow-700 mt-1">
                        💡 {event.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Peak and Optimal Hours */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-red-50 rounded-lg p-3">
                <h5 className="font-medium text-red-900 mb-2">Peak Shading Hours</h5>
                <div className="text-sm text-red-700">
                  {aiAnalysisResult.realTimeShadingReport.summary.peakShadingHours.join(', ')}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <h5 className="font-medium text-green-900 mb-2">Optimal Hours</h5>
                <div className="text-sm text-green-700">
                  {aiAnalysisResult.realTimeShadingReport.summary.minimumShadingHours.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced NEC Compliance Analysis */}
        {aiAnalysisResult.necComplianceAnalysis && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Enhanced NEC 690.12 Compliance Analysis
            </h3>
            
            {/* Compliance Overview */}
            <div className={`p-4 rounded-lg border mb-6 ${
              aiAnalysisResult.necComplianceAnalysis.overallCompliant 
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {aiAnalysisResult.necComplianceAnalysis.overallCompliant ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-red-600" />
                  )}
                  <span className="font-bold text-lg">
                    {aiAnalysisResult.necComplianceAnalysis.overallCompliant 
                      ? 'NEC Compliant' 
                      : 'Compliance Issues Found'
                    }
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {aiAnalysisResult.necComplianceAnalysis.complianceScore}%
                  </div>
                  <div className="text-sm text-gray-600">Compliance Score</div>
                </div>
              </div>

              <div className="text-sm text-gray-700 mb-3">
                {aiAnalysisResult.necComplianceAnalysis.reportData.complianceStatement}
              </div>

              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                aiAnalysisResult.necComplianceAnalysis.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                aiAnalysisResult.necComplianceAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                aiAnalysisResult.necComplianceAnalysis.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                Risk Level: {aiAnalysisResult.necComplianceAnalysis.riskLevel.toUpperCase()}
              </div>
            </div>

            {/* Compliance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {aiAnalysisResult.necComplianceAnalysis.summary.criticalIssues}
                </div>
                <div className="text-sm text-red-700">Critical Issues</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {aiAnalysisResult.necComplianceAnalysis.summary.majorIssues}
                </div>
                <div className="text-sm text-orange-700">Major Issues</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {aiAnalysisResult.necComplianceAnalysis.summary.minorIssues}
                </div>
                <div className="text-sm text-yellow-700">Minor Issues</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${
                  aiAnalysisResult.necComplianceAnalysis.summary.permitReady ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {aiAnalysisResult.necComplianceAnalysis.summary.permitReady ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-700">Permit Ready</div>
              </div>
            </div>

            {/* Violations */}
            {aiAnalysisResult.necComplianceAnalysis.violations.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Code Violations ({aiAnalysisResult.necComplianceAnalysis.violations.length})
                </h4>
                <div className="space-y-3">
                  {aiAnalysisResult.necComplianceAnalysis.violations.slice(0, 5).map((violation, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      violation.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      violation.severity === 'major' ? 'border-orange-500 bg-orange-50' :
                      violation.severity === 'minor' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              violation.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                              violation.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {violation.severity.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {violation.necCode}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{violation.description}</p>
                          <p className="text-xs text-gray-600">
                            💡 {violation.recommendation}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {violation.shortfall.toFixed(1)}' shortfall
                        </div>
                      </div>
                    </div>
                  ))}
                  {aiAnalysisResult.necComplianceAnalysis.violations.length > 5 && (
                    <div className="text-sm text-gray-500 text-center">
                      + {aiAnalysisResult.necComplianceAnalysis.violations.length - 5} more violations
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rapid Shutdown Analysis */}
            {aiAnalysisResult.necComplianceAnalysis.rapidShutdown && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Rapid Shutdown Analysis</h4>
                <div className={`p-3 rounded-lg ${
                  aiAnalysisResult.necComplianceAnalysis.rapidShutdown.compliant 
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {aiAnalysisResult.necComplianceAnalysis.rapidShutdown.required 
                        ? 'Rapid Shutdown Required' 
                        : 'Rapid Shutdown Not Required'
                      }
                    </span>
                    <span className="text-sm">
                      {aiAnalysisResult.necComplianceAnalysis.rapidShutdown.coverage.toFixed(1)}% Coverage
                    </span>
                  </div>
                  {aiAnalysisResult.necComplianceAnalysis.rapidShutdown.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {aiAnalysisResult.necComplianceAnalysis.actionItems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Action Items ({aiAnalysisResult.necComplianceAnalysis.actionItems.length})
                </h4>
                <div className="space-y-2">
                  {aiAnalysisResult.necComplianceAnalysis.actionItems.slice(0, 3).map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        action.priority === 'immediate' ? 'bg-red-500' :
                        action.priority === 'high' ? 'bg-orange-500' :
                        action.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {action.description}
                        </div>
                        <div className="text-xs text-gray-600">
                          {action.necReference} • {action.estimatedEffort}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legacy NEC Setback Compliance (for backward compatibility) */}
        {!aiAnalysisResult.necComplianceAnalysis && aiAnalysisResult.necSetbacks && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              NEC Setback Compliance Analysis
            </h3>
            
            <div className={`p-4 rounded-lg border ${
              aiAnalysisResult.necSetbacks.compliant 
                ? 'bg-green-50 border-green-200 text-green-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {aiAnalysisResult.necSetbacks.compliant ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {aiAnalysisResult.necSetbacks.compliant 
                    ? 'NEC 690.12 Compliant' 
                    : `${aiAnalysisResult.necSetbacks.violations.length} Setback Violations Found`
                  }
                </span>
              </div>
              
              {aiAnalysisResult.necSetbacks.violations.map((violation, index) => (
                <div key={index} className="text-sm mt-2">
                  <strong>{violation.code}:</strong> {violation.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const drawAnalysisOverlay = useCallback(() => {
    if (!canvasRef.current || !aiAnalysisResult) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    const img = canvas.previousElementSibling as HTMLImageElement;
    if (img) {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw roof planes
    if (visibleLayers.roofPlanes) {
      aiAnalysisResult.roofPlanes.forEach((plane, index) => {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        plane.vertices.forEach((vertex, i) => {
          if (i === 0) {
            ctx.moveTo(vertex.x, vertex.y);
          } else {
            ctx.lineTo(vertex.x, vertex.y);
          }
        });
        ctx.closePath();
        ctx.stroke();

        // Label plane
        const centerX = plane.vertices.reduce((sum, v) => sum + v.x, 0) / plane.vertices.length;
        const centerY = plane.vertices.reduce((sum, v) => sum + v.y, 0) / plane.vertices.length;
        
        ctx.fillStyle = '#3b82f6';
        ctx.font = '12px Arial';
        ctx.fillText(`Plane ${index + 1}`, centerX - 30, centerY);
      });
    }

    // Draw detected obstacles
    if (visibleLayers.obstacles) {
      aiAnalysisResult.features.forEach((feature) => {
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.fillRect(
          feature.position.x - feature.size.width / 2,
          feature.position.y - feature.size.height / 2,
          feature.size.width,
          feature.size.height
        );
        
        ctx.strokeRect(
          feature.position.x - feature.size.width / 2,
          feature.position.y - feature.size.height / 2,
          feature.size.width,
          feature.size.height
        );

        // Label obstacle
        ctx.fillStyle = '#dc2626';
        ctx.font = '10px Arial';
        ctx.fillText(
          feature.type.replace('_', ' ').toUpperCase(),
          feature.position.x - 20,
          feature.position.y - feature.size.height / 2 - 5
        );
      });
    }

    // Draw panel placements
    if (visibleLayers.panels && placementSolutions[selectedSolution]) {
      placementSolutions[selectedSolution].panels.forEach((panel) => {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        ctx.fillRect(
          panel.position.x - panel.size.width / 2,
          panel.position.y - panel.size.height / 2,
          panel.size.width,
          panel.size.height
        );
        
        ctx.strokeRect(
          panel.position.x - panel.size.width / 2,
          panel.position.y - panel.size.height / 2,
          panel.size.width,
          panel.size.height
        );
      });
    }

    // Draw setback zones
    if (visibleLayers.setbacks && aiAnalysisResult.necSetbacks) {
      aiAnalysisResult.necSetbacks.setbackZones.forEach((zone) => {
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        
        ctx.beginPath();
        zone.path.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }

  }, [aiAnalysisResult, visibleLayers, placementSolutions, selectedSolution]);

  // Redraw overlay when visibility changes
  useEffect(() => {
    drawAnalysisOverlay();
  }, [drawAnalysisOverlay, visibleLayers]);

  const configStatus = AerialViewService.getConfigurationStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                AI-Powered Site Analysis
              </h1>
              <p className="text-purple-100">Advanced roof analysis with artificial intelligence and solar optimization</p>
            </div>
          </div>
          
          {/* Configuration Status */}
          <div className={`p-3 rounded-lg ${
            configStatus.isReal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${configStatus.isReal ? 'bg-green-600' : 'bg-yellow-600'}`} />
              <span className="font-medium">{configStatus.message}</span>
              {!configStatus.isReal && (
                <span className="text-xs ml-2">(Using AI simulation for development)</span>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Address Input */}
            <div className="lg:col-span-2">
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onPlaceSelect={(place) => {
                  setAddress(place.address);
                  if (place.coordinates) {
                    setCoordinates(place.coordinates);
                  }
                }}
                label="Project Address"
                placeholder="Enter address for AI analysis..."
                className="border-purple-300"
              />
            </div>

            {/* Analysis Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Mode
              </label>
              <select
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value as AnalysisMode)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="basic">Basic Satellite View</option>
                <option value="ai_enhanced">AI-Enhanced Analysis</option>
                <option value="professional">Professional (Full AI)</option>
              </select>
            </div>
          </div>

          {/* Advanced Options */}
          {analysisMode !== 'basic' && (
            <div className="mt-6">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
              >
                <Settings className="h-4 w-4" />
                Advanced AI Options
                {showAdvancedOptions ? '▼' : '▶'}
              </button>

              {showAdvancedOptions && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI Confidence Threshold
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="0.9"
                      step="0.1"
                      value={analysisOptions.modelConfidence || 0.7}
                      onChange={(e) => setAnalysisOptions(prev => ({
                        ...prev,
                        modelConfidence: parseFloat(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round((analysisOptions.modelConfidence || 0.7) * 100)}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Optimization Goal
                    </label>
                    <select
                      value={analysisOptions.optimizeFor || 'production'}
                      onChange={(e) => setAnalysisOptions(prev => ({
                        ...prev,
                        optimizeFor: e.target.value as any
                      }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="production">Max Production</option>
                      <option value="cost">Min Cost</option>
                      <option value="aesthetics">Best Aesthetics</option>
                      <option value="maintenance">Easy Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Layout Alternatives
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={analysisOptions.generateLayouts || 3}
                      onChange={(e) => setAnalysisOptions(prev => ({
                        ...prev,
                        generateLayouts: parseInt(e.target.value)
                      }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>

                  {/* Real-Time Shading Toggle */}
                  <div className="col-span-full">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={analysisOptions.enableRealTimeShading || false}
                        onChange={(e) => setAnalysisOptions(prev => ({
                          ...prev,
                          enableRealTimeShading: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Enable Real-Time Shading Analysis
                      </span>
                    </label>
                  </div>

                  {/* Real-Time Shading Options */}
                  {analysisOptions.enableRealTimeShading && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Interval (minutes)
                        </label>
                        <select
                          value={analysisOptions.realTimeShadingOptions?.timeInterval || 60}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            realTimeShadingOptions: {
                              ...prev.realTimeShadingOptions,
                              timeInterval: parseInt(e.target.value)
                            }
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shadow Resolution
                        </label>
                        <select
                          value={analysisOptions.realTimeShadingOptions?.shadowResolution || 'medium'}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            realTimeShadingOptions: {
                              ...prev.realTimeShadingOptions,
                              shadowResolution: e.target.value as any
                            }
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="low">Low (Fast)</option>
                          <option value="medium">Medium</option>
                          <option value="high">High (Detailed)</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={analysisOptions.realTimeShadingOptions?.includeWeatherData || false}
                            onChange={(e) => setAnalysisOptions(prev => ({
                              ...prev,
                              realTimeShadingOptions: {
                                ...prev.realTimeShadingOptions,
                                includeWeatherData: e.target.checked
                              }
                            }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Include Weather Data
                          </span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* Enhanced NEC Compliance Toggle */}
                  <div className="col-span-full border-t pt-4 mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={analysisOptions.enableEnhancedNECAnalysis || false}
                        onChange={(e) => setAnalysisOptions(prev => ({
                          ...prev,
                          enableEnhancedNECAnalysis: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Enable Enhanced NEC 690.12 Compliance Analysis
                      </span>
                    </label>
                  </div>

                  {/* Enhanced NEC Compliance Options */}
                  {analysisOptions.enableEnhancedNECAnalysis && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Building Type
                        </label>
                        <select
                          value={analysisOptions.buildingCharacteristics?.type || 'residential'}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            buildingCharacteristics: {
                              ...prev.buildingCharacteristics,
                              type: e.target.value as any
                            }
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="residential">Residential</option>
                          <option value="commercial">Commercial</option>
                          <option value="industrial">Industrial</option>
                          <option value="agricultural">Agricultural</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Stories
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={analysisOptions.buildingCharacteristics?.stories || 1}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            buildingCharacteristics: {
                              ...prev.buildingCharacteristics,
                              stories: parseInt(e.target.value)
                            }
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Roof Type
                        </label>
                        <select
                          value={analysisOptions.buildingCharacteristics?.roofType || 'pitched'}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            buildingCharacteristics: {
                              ...prev.buildingCharacteristics,
                              roofType: e.target.value as any
                            }
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="pitched">Pitched</option>
                          <option value="flat">Flat</option>
                          <option value="hip">Hip</option>
                          <option value="gable">Gable</option>
                          <option value="shed">Shed</option>
                          <option value="mansard">Mansard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NEC Version
                        </label>
                        <select
                          value={analysisOptions.necVersion || '2023'}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            necVersion: e.target.value as any
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="2023">NEC 2023</option>
                          <option value="2020">NEC 2020</option>
                          <option value="2017">NEC 2017</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jurisdiction
                        </label>
                        <input
                          type="text"
                          value={analysisOptions.jurisdiction || 'National'}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            jurisdiction: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Enter jurisdiction (e.g., California, New York)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Roof Material
                        </label>
                        <select
                          value={analysisOptions.buildingCharacteristics?.roofMaterial || 'asphalt_shingle'}
                          onChange={(e) => setAnalysisOptions(prev => ({
                            ...prev,
                            buildingCharacteristics: {
                              ...prev.buildingCharacteristics,
                              roofMaterial: e.target.value as any
                            }
                          }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="asphalt_shingle">Asphalt Shingle</option>
                          <option value="metal">Metal</option>
                          <option value="tile">Tile</option>
                          <option value="membrane">Membrane</option>
                          <option value="concrete">Concrete</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analysis Button */}
          <div className="mt-6">
            <button
              onClick={handleAIAnalysis}
              disabled={loading || !address}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running AI Analysis...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Brain className="h-5 w-5" />
                  {analysisMode === 'basic' ? 'Capture Satellite View' : 
                   analysisMode === 'ai_enhanced' ? 'Run AI Analysis' :
                   'Full Professional Analysis'}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {renderAIAnalysisResults()}

        {/* Basic satellite view for non-AI mode */}
        {analysisMode === 'basic' && satelliteUrl && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Satellite View
            </h2>
            <img
              src={satelliteUrl}
              alt="Satellite view of project site"
              className="w-full rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAerialViewMain;