/**
 * Progress Tracker Component
 * 
 * Displays real-time progress of AI analysis operations
 */

import React from 'react';
import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface AnalysisProgress {
  step: string;
  progress: number;
  message: string;
  complete: boolean;
}

interface ProgressTrackerProps {
  progress: AnalysisProgress[];
  isAnalyzing: boolean;
  className?: string;
}

const stepLabels: Record<string, string> = {
  roof_analysis: 'Roof Analysis',
  object_detection: 'Feature Detection',
  panel_placement: 'Panel Placement',
  shading_analysis: 'Shading Analysis',
  optimization: 'Optimization',
  error: 'Error'
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  isAnalyzing,
  className = ''
}) => {
  if (progress.length === 0 && !isAnalyzing) {
    return null;
  }

  const overallProgress = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
    : 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Analysis Progress
        </h3>
        
        <div className="text-sm font-medium text-gray-600">
          {overallProgress}% Complete
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Step-by-step Progress */}
      <div className="space-y-3">
        {progress.map((step, index) => (
          <div key={step.step} className="flex items-center gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {step.step === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : step.complete ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : step.progress > 0 ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {stepLabels[step.step] || step.step}
                </h4>
                <span className="text-xs text-gray-500">
                  {step.progress}%
                </span>
              </div>
              
              <p className="text-xs text-gray-600 truncate">
                {step.message}
              </p>
              
              {/* Individual Progress Bar */}
              {step.step !== 'error' && (
                <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      step.complete 
                        ? 'bg-green-500' 
                        : step.progress > 0 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300'
                    }`}
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Message */}
      {isAnalyzing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              Analysis in progress...
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            This may take 1-2 minutes depending on image complexity
          </p>
        </div>
      )}
    </div>
  );
};