/**
 * Rubberband Selection Component
 * 
 * Provides drag-to-select functionality for multiple components
 */

import React from 'react';

interface RubberbandSelectionProps {
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  isActive: boolean;
}

export const RubberbandSelection: React.FC<RubberbandSelectionProps> = ({
  startPoint,
  currentPoint,
  isActive
}) => {
  if (!isActive || !startPoint || !currentPoint) {
    return null;
  }

  const left = Math.min(startPoint.x, currentPoint.x);
  const top = Math.min(startPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);

  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{
        left,
        top,
        width,
        height,
        border: '2px dashed #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '4px'
      }}
    >
      {/* Selection info overlay */}
      <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        {width.toFixed(0)} × {height.toFixed(0)}
      </div>
    </div>
  );
};

export default RubberbandSelection;