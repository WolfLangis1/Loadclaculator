import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = React.memo(({
  isLoading,
  children,
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            <span className="text-sm text-gray-600" aria-live="polite">
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = React.memo(({ 
  className = '', 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
});

Skeleton.displayName = 'Skeleton';

export const TableRowSkeleton: React.FC<{ columns?: number }> = React.memo(({ 
  columns = 7 
}) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded"></div>
        </td>
      ))}
    </tr>
  );
});

TableRowSkeleton.displayName = 'TableRowSkeleton';

export const CardSkeleton: React.FC = React.memo(() => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 animate-pulse">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AsyncButton: React.FC<AsyncButtonProps> = React.memo(({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center ${className} ${
        isLoading ? 'cursor-not-allowed opacity-75' : ''
      }`}
      aria-busy={isLoading}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {isLoading ? loadingText : children}
    </button>
  );
});

AsyncButton.displayName = 'AsyncButton';

// Progressive loading hook
export const useProgressiveLoading = (dependencies: any[] = []) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingStage, setLoadingStage] = React.useState('');

  React.useEffect(() => {
    setIsLoading(true);
    setLoadingStage('Initializing...');

    const timer = setTimeout(() => {
      setLoadingStage('Loading calculations...');
      
      setTimeout(() => {
        setLoadingStage('Finalizing...');
        
        setTimeout(() => {
          setIsLoading(false);
          setLoadingStage('');
        }, 200);
      }, 300);
    }, 100);

    return () => clearTimeout(timer);
  }, dependencies);

  return { isLoading, loadingStage };
};