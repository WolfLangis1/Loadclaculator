/**
 * Results Display Component
 * 
 * Displays AI analysis results including roof planes, obstacles, and panel layouts
 */

import React, { useState } from 'react';
import { 
  Sun, 
  Zap, 
  DollarSign, 
  Ruler, 
  Shield, 
  TreePine,
  Info,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import type { 
  AIRoofAnalysisResult, 
  PlacementSolution,
  RoofPlane,
  RoofFeature 
} from '../../services/aiRoofAnalysisService';
import type { RoofDetectionResult } from '../../services/tensorflowDetectionService';

interface ResultsDisplayProps {
  analysisResult: AIRoofAnalysisResult | null;
  detectionResult: RoofDetectionResult | null;
  placementSolutions: PlacementSolution[];
  selectedSolution: number;
  onSolutionSelect: (index: number) => void;
  visibleLayers: Record<string, boolean>;
  onLayerToggle: (layer: string) => void;
  className?: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  analysisResult,
  detectionResult,
  placementSolutions,
  selectedSolution,
  onSolutionSelect,
  visibleLayers,
  onLayerToggle,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    roofPlanes: false,
    obstacles: false,
    solutions: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!analysisResult && !detectionResult) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <Sun className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
        <p className="text-gray-600">Run an AI analysis to see roof insights and panel layouts</p>
      </div>
    );
  }

  const currentSolution = placementSolutions[selectedSolution];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sun className="h-5 w-5 text-orange-500" />
            Analysis Results
          </h3>
          
          <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* Overview Section */}
        {analysisResult && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('overview')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">Overview</span>
              {expandedSections.overview ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.overview && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Ruler className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Total Roof Area</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-900">
                      {Math.round(analysisResult.totalRoofArea).toLocaleString()} sq ft
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Sun className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Usable Area</span>
                    </div>
                    <div className="text-lg font-semibold text-green-900">
                      {Math.round(analysisResult.usableArea).toLocaleString()} sq ft
                    </div>
                  </div>
                </div>

                {currentSolution && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {currentSolution.panelCount}
                      </div>
                      <div className="text-xs text-gray-600">Panels</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(currentSolution.systemSize / 1000).toFixed(1)}kW
                      </div>
                      <div className="text-xs text-gray-600">System Size</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(currentSolution.annualProduction / 1000).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">kWh/year</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Roof Planes Section */}
        {analysisResult && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('roofPlanes')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Roof Planes</span>
                <span className="text-sm text-gray-500">
                  ({analysisResult.roofPlanes.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerToggle('roofPlanes');
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {visibleLayers.roofPlanes ? (
                    <Eye className="h-4 w-4 text-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.roofPlanes ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>
            
            {expandedSections.roofPlanes && (
              <div className="px-4 pb-4 space-y-2">
                {analysisResult.roofPlanes.map((plane, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Plane {index + 1}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        plane.suitability === 'excellent' ? 'bg-green-100 text-green-800' :
                        plane.suitability === 'good' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plane.suitability}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <div className="font-medium">{Math.round(plane.area)} sq ft</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Tilt:</span>
                        <div className="font-medium">{Math.round(plane.tilt)}°</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Azimuth:</span>
                        <div className="font-medium">{Math.round(plane.azimuth)}°</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Obstacles Section */}
        {detectionResult && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('obstacles')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Obstacles</span>
                <span className="text-sm text-gray-500">
                  ({detectionResult.detectedObjects.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerToggle('obstacles');
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {visibleLayers.obstacles ? (
                    <Eye className="h-4 w-4 text-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.obstacles ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>
            
            {expandedSections.obstacles && (
              <div className="px-4 pb-4 space-y-2">
                {detectionResult.detectedObjects.map((obstacle, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {obstacle.type === 'tree' && <TreePine className="h-4 w-4 text-green-600" />}
                        {obstacle.type === 'chimney' && <Shield className="h-4 w-4 text-gray-600" />}
                        <span className="font-medium text-sm capitalize">{obstacle.type}</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {Math.round(obstacle.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placement Solutions Section */}
        {placementSolutions.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('solutions')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Panel Solutions</span>
                <span className="text-sm text-gray-500">
                  ({placementSolutions.length})
                </span>
              </div>
              {expandedSections.solutions ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.solutions && (
              <div className="px-4 pb-4 space-y-3">
                {placementSolutions.map((solution, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      index === selectedSolution
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => onSolutionSelect(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        Solution {index + 1}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        solution.score > 90 ? 'bg-green-100 text-green-800' :
                        solution.score > 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(solution.score)}/100
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Panels:</span>
                        <div className="font-medium">{solution.panelCount}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">System:</span>
                        <div className="font-medium">
                          {(solution.systemSize / 1000).toFixed(1)}kW
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Annual:</span>
                        <div className="font-medium">
                          {Math.round(solution.annualProduction / 1000)}k kWh
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};