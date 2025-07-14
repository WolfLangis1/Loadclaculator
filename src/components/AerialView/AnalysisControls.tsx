/**
 * Analysis Controls Component
 * 
 * Controls for configuring and starting AI-powered roof analysis
 */

import React from 'react';
import { Brain, Settings, Zap, Play, RotateCcw } from 'lucide-react';
import type { AIAnalysisOptions, PlacementConstraints, OptimizationOptions } from '../../services/aiRoofAnalysisService';

type AnalysisMode = 'basic' | 'ai_enhanced' | 'professional';

interface AnalysisControlsProps {
  analysisMode: AnalysisMode;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  analysisOptions: AIAnalysisOptions;
  onAnalysisOptionsChange: (updates: Partial<AIAnalysisOptions>) => void;
  placementConstraints: PlacementConstraints;
  onPlacementConstraintsChange: (updates: Partial<PlacementConstraints>) => void;
  optimizationOptions: OptimizationOptions;
  onOptimizationOptionsChange: (updates: Partial<OptimizationOptions>) => void;
  onStartAnalysis: () => void;
  onClearAnalysis: () => void;
  isAnalyzing: boolean;
  hasResults: boolean;
  showAdvancedOptions: boolean;
  onToggleAdvancedOptions: () => void;
  className?: string;
}

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  analysisMode,
  onAnalysisModeChange,
  analysisOptions,
  onAnalysisOptionsChange,
  placementConstraints,
  onPlacementConstraintsChange,
  optimizationOptions,
  onOptimizationOptionsChange,
  onStartAnalysis,
  onClearAnalysis,
  isAnalyzing,
  hasResults,
  showAdvancedOptions,
  onToggleAdvancedOptions,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Analysis Controls
        </h3>
        
        <button
          onClick={onToggleAdvancedOptions}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4" />
          {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Analysis Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analysis Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'basic', label: 'Basic', icon: Zap },
            { key: 'ai_enhanced', label: 'AI Enhanced', icon: Brain },
            { key: 'professional', label: 'Professional', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onAnalysisModeChange(key as AnalysisMode)}
              className={`flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg border transition-colors ${
                analysisMode === key
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Analysis Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Features</h4>
            <div className="space-y-2">
              {[
                { key: 'enableRoofPlaneDetection', label: 'Roof Plane Detection' },
                { key: 'enableObstacleDetection', label: 'Obstacle Detection' },
                { key: 'enableShadingAnalysis', label: 'Shading Analysis' },
                { key: 'enableTreeDetection', label: 'Tree Detection' },
                { key: 'enableSetbackCalculation', label: 'Setback Calculation' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={analysisOptions[key as keyof AIAnalysisOptions] as boolean}
                    onChange={(e) => onAnalysisOptionsChange({ [key]: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Placement Constraints */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Placement Constraints</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Setback (ft)</label>
                <input
                  type="number"
                  value={placementConstraints.minSetback}
                  onChange={(e) => onPlacementConstraintsChange({ 
                    minSetback: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  min="0"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Tilt (degrees)</label>
                <input
                  type="number"
                  value={placementConstraints.maxTilt}
                  onChange={(e) => onPlacementConstraintsChange({ 
                    maxTilt: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  min="0"
                  max="45"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Spacing (ft)</label>
                <input
                  type="number"
                  value={placementConstraints.minSpacing}
                  onChange={(e) => onPlacementConstraintsChange({ 
                    minSpacing: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  min="0"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Array Size</label>
                <input
                  type="number"
                  value={placementConstraints.minimumArraySize}
                  onChange={(e) => onPlacementConstraintsChange({ 
                    minimumArraySize: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Optimization Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Optimization</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Objective</label>
                <select
                  value={optimizationOptions.objective}
                  onChange={(e) => onOptimizationOptionsChange({ 
                    objective: e.target.value as any 
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option value="power">Max Power</option>
                  <option value="cost">Min Cost</option>
                  <option value="aesthetics">Best Aesthetics</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Panel Type</label>
                <select
                  value={optimizationOptions.panelType}
                  onChange={(e) => onOptimizationOptionsChange({ 
                    panelType: e.target.value as any 
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="high_efficiency">High Efficiency</option>
                  <option value="premium">Premium</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
            </div>
            
            <div className="mt-2 space-y-2">
              {[
                { key: 'includeMicroinverters', label: 'Include Microinverters' },
                { key: 'includeOptimizers', label: 'Include Optimizers' },
                { key: 'respectAesthetics', label: 'Respect Aesthetics' },
                { key: 'maximizeStrings', label: 'Maximize String Length' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationOptions[key as keyof OptimizationOptions] as boolean}
                    onChange={(e) => onOptimizationOptionsChange({ [key]: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onStartAnalysis}
          disabled={isAnalyzing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Analysis
            </>
          )}
        </button>
        
        {hasResults && (
          <button
            onClick={onClearAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};