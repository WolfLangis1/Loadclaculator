import { useState, useCallback } from 'react';
import { runComprehensiveAIAnalysis } from '../services/aiAnalysisService';
import type {
  AIRoofAnalysisResult,
  AIAnalysisOptions,
  RoofDetectionResult,
  PlacementSolution,
  PlacementConstraints,
  OptimizationOptions
} from '../services/aiRoofAnalysisService'; // Re-export types from a single source
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
  
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('ai_enhanced');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIRoofAnalysisResult | null>(null);
  const [detectionResult, setDetectionResult] = useState<RoofDetectionResult | null>(null);
  const [placementSolutions, setPlacementSolutions] = useState<PlacementSolution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<number>(0);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const runAIAnalysis = useCallback(async (imageUrl: string, address: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress([]);
    
    try {
      logger.info('Starting AI analysis', { address });
      
      const { roofResult, detection, solutions } = await runComprehensiveAIAnalysis(
        imageUrl,
        address,
        analysisOptions,
        placementConstraints,
        optimizationOptions,
        updateProgress
      );

      setAiAnalysisResult(roofResult);
      setDetectionResult(detection);
      setPlacementSolutions(solutions);
      setSelectedSolution(0);

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

  const clearAnalysis = useCallback(() => {
    setAiAnalysisResult(null);
    setDetectionResult(null);
    setPlacementSolutions([]);
    setSelectedSolution(0);
    setAnalysisProgress([]);
  }, []);

  const updateAnalysisOptions = useCallback((updates: Partial<AIAnalysisOptions>) => {
    setAnalysisOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePlacementConstraints = useCallback((updates: Partial<PlacementConstraints>) => {
    setPlacementConstraints(prev => ({ ...prev, ...updates }));
  }, []);

  const updateOptimizationOptions = useCallback((updates: Partial<OptimizationOptions>) => {
    setOptimizationOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const selectSolution = useCallback((index: number) => {
    if (index >= 0 && index < placementSolutions.length) {
      setSelectedSolution(index);
      logger.info('Solution selected', { solutionIndex: index });
    }
  }, [placementSolutions.length, logger]);

  return {
    analysisMode,
    aiAnalysisResult,
    detectionResult,
    placementSolutions,
    selectedSolution,
    analysisProgress,
    isAnalyzing,
    
    analysisOptions,
    placementConstraints,
    optimizationOptions,
    
    setAnalysisMode,
    runAIAnalysis,
    clearAnalysis,
    updateAnalysisOptions,
    updatePlacementConstraints,
    updateOptimizationOptions,
    selectSolution,
    
    hasAnalysisResults: aiAnalysisResult !== null,
    hasPlacementSolutions: placementSolutions.length > 0,
    currentSolution: placementSolutions[selectedSolution] || null,
    analysisComplete: analysisProgress.length > 0 && analysisProgress.every(p => p.complete)
  };
};