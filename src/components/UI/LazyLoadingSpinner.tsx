import React from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadingSpinnerProps {
  componentName?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LazyLoadingSpinner: React.FC<LazyLoadingSpinnerProps> = ({
  componentName = 'Component',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            Loading {componentName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please wait while we prepare the interface...
          </p>
        </div>
      </div>
    </div>
  );
};

export const FullScreenLoader: React.FC<{ componentName?: string }> = ({ componentName }) => (
  <LazyLoadingSpinner componentName={componentName} size="lg" fullScreen />
);

export const InlineLoader: React.FC<{ componentName?: string }> = ({ componentName }) => (
  <LazyLoadingSpinner componentName={componentName} size="sm" />
);