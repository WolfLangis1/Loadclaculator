/**
 * Refactored Aerial View Main Component
 * 
 * Clean, focused aerial view component with extracted hooks and components
 */

import React, { useState } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';
import { AnalysisControls } from './AnalysisControls';
import { ProgressTracker } from './ProgressTracker';
import { ResultsDisplay } from './ResultsDisplay';
import { createComponentLogger } from '../../services/loggingService';

type ViewMode = 'satellite' | 'streetview' | 'solar' | 'ai_analysis' | 'panel_placement';

export const RefactoredAerialViewMain: React.FC = () => {
  const logger = createComponentLogger('AerialViewMain');
  const { state } = useLoadCalculator();
  
  // Local state
  const [address, setAddress] = useState(state.projectInfo.propertyAddress || '');
  const [viewMode, setViewMode] = useState<ViewMode>('ai_analysis');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    roofPlanes: true,
    obstacles: true,
    panels: true,
    setbacks: true,
    shading: false,
    measurements: false
  });

  // Mock analysis results for development
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisProgress, setAnalysisProgress] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Start AI analysis
  const handleStartAnalysis = async () => {
    if (!address) {
      setError('Please enter a property address');
      return;
    }

    setLoading(true);
    setError('');
    setIsAnalyzing(true);

    try {
      logger.info('Starting aerial view analysis', { address, viewMode });
      
      // Simulate analysis progress
      const steps = [
        { step: 'loading', progress: 20, message: 'Loading satellite imagery...' },
        { step: 'detection', progress: 50, message: 'Detecting roof features...' },
        { step: 'analysis', progress: 80, message: 'Analyzing solar potential...' },
        { step: 'complete', progress: 100, message: 'Analysis complete!' }
      ];

      for (const step of steps) {
        setAnalysisProgress(prev => [...prev, step]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Mock analysis results
      setAnalysisResults({
        roofArea: 2500,
        solarPotential: 85,
        obstacles: 3,
        recommendedPanels: 24
      });
      
      logger.info('Analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      logger.error('Analysis failed', err as Error);
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  // Toggle layer visibility
  const handleLayerToggle = (layer: string) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
    logger.info('Layer toggled', { layer, visible: !visibleLayers[layer as keyof typeof visibleLayers] });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                AI-Powered Aerial View Analysis
              </h1>
              <p className="text-sm text-gray-600">
                Advanced roof analysis with machine learning
              </p>
            </div>
          </div>
        </div>

        {/* Address Input */}
        <div className="mt-4">
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Enter property address..."
            className="w-full"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls and Results */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Analysis Controls */}
            <div className="space-y-4">
              <button
                onClick={handleStartAnalysis}
                disabled={!address || isAnalyzing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </button>

              {analysisProgress.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Progress</h3>
                  {analysisProgress.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">{step.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {analysisResults && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Analysis Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Roof Area:</span>
                      <span className="text-sm font-medium">{analysisResults.roofArea} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Solar Potential:</span>
                      <span className="text-sm font-medium">{analysisResults.solarPotential}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Obstacles:</span>
                      <span className="text-sm font-medium">{analysisResults.obstacles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Recommended Panels:</span>
                      <span className="text-sm font-medium">{analysisResults.recommendedPanels}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Map/Image Display */}
        <div className="flex-1 bg-gray-100">
          {address ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Aerial View Canvas</h3>
                <p className="text-sm mb-4">
                  Interactive satellite imagery and analysis overlay would appear here
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Address: {address}</p>
                  <p>View Mode: {viewMode}</p>
                  {analysisResults && (
                    <>
                      <p>Status: Analysis Complete</p>
                      <p>Solar Score: {analysisResults.solarPotential}%</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Enter Address</h3>
                <p className="text-sm">
                  Please enter a property address to begin aerial analysis
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefactoredAerialViewMain;