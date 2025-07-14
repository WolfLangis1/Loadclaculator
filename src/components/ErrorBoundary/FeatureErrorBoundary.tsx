import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface FeatureErrorBoundaryProps {
  children: React.ReactNode;
  featureName: string;
  onRetry?: () => void;
}

/**
 * Specialized error boundary for feature-specific errors
 * Provides more targeted error handling and recovery options
 */
export const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({
  children,
  featureName,
  onRetry,
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const fallbackUI = (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            {featureName} Error
          </h3>
          <p className="text-sm text-red-600">
            This feature encountered an error and cannot be displayed.
          </p>
        </div>
      </div>
      
      <button
        onClick={handleRetry}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Retry {featureName}
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallbackUI}>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Specific error boundaries for major application features
 */

export const LoadCalculatorErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary featureName="Load Calculator">
    {children}
  </FeatureErrorBoundary>
);

export const SLDErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary featureName="Single Line Diagram">
    {children}
  </FeatureErrorBoundary>
);

export const AerialViewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary featureName="Aerial View">
    {children}
  </FeatureErrorBoundary>
);

export const ReportErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary featureName="Report Generation">
    {children}
  </FeatureErrorBoundary>
);

/**
 * Async component error boundary for lazy-loaded components
 */
export const AsyncComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName: string;
}> = ({ children, componentName }) => {
  const fallbackUI = (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">
          Failed to load {componentName}
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
      >
        Refresh page to try again
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallbackUI}>
      {children}
    </ErrorBoundary>
  );
};