import { AIRoofAnalysisService, type RoofAnalysisResult, type RoofSegment, type PanelPlacement } from './aiRoofAnalysisService';

// Define simplified types for compatibility
export interface AIAnalysisOptions {
  analysisType: 'comprehensive' | 'basic';
  includeShading: boolean;
  includePanelPlacement: boolean;
}

export interface PlacementConstraints {
  minPanelSize: number;
  maxPanelSize: number;
  minSpacing: number;
  roofEdgeBuffer: number;
}

export interface OptimizationOptions {
  prioritizeProduction: boolean;
  prioritizeAesthetics: boolean;
  allowPartialPanels: boolean;
}

export interface RoofDetectionResult {
  segments: RoofSegment[];
  confidence: number;
  processingTime: number;
}

export interface PlacementSolution {
  panels: PanelPlacement[];
  totalProduction: number;
  efficiency: number;
  cost: number;
}

export const runComprehensiveAIAnalysis = async (
  imageUrl: string,
  address: string,
  analysisOptions: AIAnalysisOptions,
  placementConstraints: PlacementConstraints,
  optimizationOptions: OptimizationOptions,
  updateProgress: (step: string, progress: number, message: string, complete?: boolean) => void
): Promise<{
  roofResult: RoofAnalysisResult;
  detection: RoofDetectionResult;
  solutions: PlacementSolution[];
}> => {
  // Step 1: Roof Analysis
  updateProgress('roof_analysis', 0, 'Starting roof analysis...');
  
  // Extract coordinates from address or use defaults
  const coords = parseAddressToCoords(address);
  
  const roofResult = await AIRoofAnalysisService.analyzeRoof(
    imageUrl,
    coords.latitude,
    coords.longitude
  );
  updateProgress('roof_analysis', 100, 'Roof analysis complete', true);

  // Step 2: Object Detection (simplified - use roof analysis results)
  updateProgress('object_detection', 0, 'Processing roof features...');
  const detection: RoofDetectionResult = {
    segments: roofResult.roofSegments,
    confidence: roofResult.confidence,
    processingTime: roofResult.processingTime
  };
  updateProgress('object_detection', 100, 'Feature detection complete', true);

  // Step 3: Panel Placement Solutions (simplified - use existing panel placement)
  updateProgress('placement_optimization', 0, 'Optimizing panel placement...');
  const solutions: PlacementSolution[] = [{
    panels: roofResult.panelPlacement,
    totalProduction: roofResult.panelPlacement.reduce((sum, panel) => sum + panel.annualProduction, 0),
    efficiency: roofResult.confidence,
    cost: roofResult.panelPlacement.length * 1000 // Simplified cost calculation
  }];
  updateProgress('placement_optimization', 100, 'Optimization complete', true);

  return {
    roofResult,
    detection,
    solutions
  };
};

// Helper function to parse address to coordinates (simplified)
function parseAddressToCoords(address: string): { latitude: number; longitude: number } {
  // In a real implementation, this would use geocoding
  // For now, return default coordinates (San Francisco)
  return {
    latitude: 37.7749,
    longitude: -122.4194
  };
}