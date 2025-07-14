/**
 * AI Analysis Hook
 * 
 * Manages AI-powered roof analysis state and operations
 */

import { useState, useCallback } from 'react';
import AIRoofAnalysisService, { 
  AIRoofAnalysisResult,
  AIAnalysisOptions
} from '../services/aiRoofAnalysisService';
import TensorFlowDetectionService, {
  RoofDetectionResult
} from '../services/tensorflowDetectionService';
import AIPanelPlacementService, {
  PlacementSolution,
  PlacementConstraints,
  OptimizationOptions
} from '../services/aiPanelPlacementService';
import { createComponentLogger } from '../services/loggingService';

interface AnalysisProgress {
  step: string;
  progress: number;
  message: string;
  complete: boolean;
}

type AnalysisMode = 'basic' | 'ai_enhanced' | 'professional';

export const useAIAnalysis = () => {
  const logger = createComponentLogger('AIAnalysis');
  
  // Analysis state
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('ai_enhanced');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIRoofAnalysisResult | null>(null);
  const [detectionResult, setDetectionResult] = useState<RoofDetectionResult | null>(null);
  const [placementSolutions, setPlacementSolutions] = useState<PlacementSolution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<number>(0);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis options
  const [analysisOptions, setAnalysisOptions] = useState<AIAnalysisOptions>({
    enableRoofPlaneDetection: true,
    enableObstacleDetection: true,
    enableShadingAnalysis: true,
    enableTreeDetection: true,
    enableSetbackCalculation: true,
    roofSegmentationAccuracy: 'high',
    shadingAnalysisDetail: 'detailed',
    optimizationObjective: 'max_power',
    constraintMode: 'strict'
  });

  const [placementConstraints, setPlacementConstraints] = useState<PlacementConstraints>({
    minSetback: 3,
    maxTilt: 30,
    minSpacing: 2,
    avoidShading: true,
    respectObstacles: true,
    enforceFireSetbacks: true,
    minimumArraySize: 5
  });

  const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
    objective: 'power',
    panelType: 'standard',
    orientation: 'auto',
    includeMicroinverters: true,
    includeOptimizers: false,
    respectAesthetics: true,
    maximizeStrings: false
  });

  // Progress tracking
  const updateProgress = useCallback((step: string, progress: number, message: string, complete = false) => {
    setAnalysisProgress(prev => {
      const existingIndex = prev.findIndex(p => p.step === step);
      const newProgress = { step, progress, message, complete };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newProgress;
        return updated;
      } else {
        return [...prev, newProgress];
      }
    });
  }, []);

  // Run comprehensive AI analysis
  const runAIAnalysis = useCallback(async (imageUrl: string, address: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress([]);
    
    try {
      logger.info('Starting AI analysis', { address });
      
      // Step 1: Roof Analysis
      updateProgress('roof_analysis', 0, 'Starting roof analysis...');
      const roofResult = await AIRoofAnalysisService.analyzeRoof(
        imageUrl, 
        address, 
        analysisOptions
      );
      setAiAnalysisResult(roofResult);
      updateProgress('roof_analysis', 100, 'Roof analysis complete', true);

      // Step 2: Object Detection
      updateProgress('object_detection', 0, 'Detecting roof features...');
      const detection = await TensorFlowDetectionService.detectRoofFeatures(
        imageUrl,
        {
          confidenceThreshold: 0.7,
          enableChimneyDetection: true,
          enableVentDetection: true,
          enableSkylineDetection: true,
          enableObstacleDetection: true
        }
      );
      setDetectionResult(detection);
      updateProgress('object_detection', 100, 'Feature detection complete', true);

      // Step 3: Panel Placement Optimization
      updateProgress('panel_placement', 0, 'Optimizing panel placement...');
      const solutions = await AIPanelPlacementService.generatePlacementSolutions(
        roofResult,
        detection,
        placementConstraints,
        optimizationOptions
      );
      setPlacementSolutions(solutions);
      setSelectedSolution(0);
      updateProgress('panel_placement', 100, 'Placement optimization complete', true);

      logger.info('AI analysis completed successfully', {
        roofPlanesDetected: roofResult.roofPlanes.length,
        obstaclesDetected: detection.detectedObjects.length,
        solutionsGenerated: solutions.length
      });

    } catch (error) {
      logger.error('AI analysis failed', error as Error);
      updateProgress('error', 100, `Analysis failed: ${(error as Error).message}`, true);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analysisOptions, placementConstraints, optimizationOptions, updateProgress, logger]);

  // Clear analysis results
  const clearAnalysis = useCallback(() => {
    setAiAnalysisResult(null);
    setDetectionResult(null);
    setPlacementSolutions([]);
    setSelectedSolution(0);
    setAnalysisProgress([]);
  }, []);

  // Update analysis options
  const updateAnalysisOptions = useCallback((updates: Partial<AIAnalysisOptions>) => {
    setAnalysisOptions(prev => ({ ...prev, ...updates }));
  }, []);

  // Update placement constraints
  const updatePlacementConstraints = useCallback((updates: Partial<PlacementConstraints>) => {
    setPlacementConstraints(prev => ({ ...prev, ...updates }));
  }, []);

  // Update optimization options
  const updateOptimizationOptions = useCallback((updates: Partial<OptimizationOptions>) => {
    setOptimizationOptions(prev => ({ ...prev, ...updates }));
  }, []);

  // Select solution
  const selectSolution = useCallback((index: number) => {
    if (index >= 0 && index < placementSolutions.length) {
      setSelectedSolution(index);
      logger.info('Solution selected', { solutionIndex: index });
    }
  }, [placementSolutions.length, logger]);

  return {
    // State
    analysisMode,
    aiAnalysisResult,
    detectionResult,
    placementSolutions,
    selectedSolution,
    analysisProgress,
    isAnalyzing,
    
    // Options
    analysisOptions,
    placementConstraints,
    optimizationOptions,
    
    // Actions
    setAnalysisMode,
    runAIAnalysis,
    clearAnalysis,
    updateAnalysisOptions,
    updatePlacementConstraints,
    updateOptimizationOptions,
    selectSolution,
    
    // Computed values
    hasAnalysisResults: aiAnalysisResult !== null,
    hasPlacementSolutions: placementSolutions.length > 0,
    currentSolution: placementSolutions[selectedSolution] || null,
    analysisComplete: analysisProgress.length > 0 && analysisProgress.every(p => p.complete)
  };
};