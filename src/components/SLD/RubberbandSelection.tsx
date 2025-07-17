/**
 * Rubber Band Selection Component
 * 
 * Visual feedback for drag-to-select operations
 */

import React from 'react';

export interface RubberBandState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

interface RubberBandSelectionProps {
  rubberBandState: RubberBandState;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
}

export const RubberBandSelection: React.FC<RubberBandSelectionProps> = ({
  rubberBandState,
  viewport
}) => {
  if (!rubberBandState.isActive || !rubberBandState.startPoint || !rubberBandState.currentPoint) {
    return null;
  }

  // Convert world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => ({
    x: (worldX - viewport.x) * viewport.zoom,
    y: (worldY - viewport.y) * viewport.zoom
  });

  const startScreen = worldToScreen(rubberBandState.startPoint.x, rubberBandState.startPoint.y);
  const currentScreen = worldToScreen(rubberBandState.currentPoint.x, rubberBandState.currentPoint.y);

  // Calculate rectangle bounds
  const left = Math.min(startScreen.x, currentScreen.x);
  const top = Math.min(startScreen.y, currentScreen.y);
  const width = Math.abs(currentScreen.x - startScreen.x);
  const height = Math.abs(currentScreen.y - startScreen.y);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 50 }}
    >
      {/* Selection rectangle */}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        fill="rgba(37, 99, 235, 0.1)"
        stroke="#2563eb"
        strokeWidth={1}
        strokeDasharray="3,3"
        opacity={0.8}
      />
      
      {/* Corner indicators */}
      <circle
        cx={left}
        cy={top}
        r={2}
        fill="#2563eb"
        opacity={0.6}
      />
      <circle
        cx={left + width}
        cy={top}
        r={2}
        fill="#2563eb"
        opacity={0.6}
      />
      <circle
        cx={left}
        cy={top + height}
        r={2}
        fill="#2563eb"
        opacity={0.6}
      />
      <circle
        cx={left + width}
        cy={top + height}
        r={2}
        fill="#2563eb"
        opacity={0.6}
      />
      
      {/* Selection info */}
      {width > 50 && height > 20 && (
        <g className="selection-info">
          <rect
            x={left + 4}
            y={top + 4}
            width={Math.min(80, width - 8)}
            height={16}
            fill="rgba(37, 99, 235, 0.9)"
            rx={2}
          />
          <text
            x={left + 8}
            y={top + 14}
            fontSize="10"
            fill="white"
            fontFamily="system-ui, sans-serif"
            style={{ userSelect: 'none' }}
          >
            {Math.round(width / viewport.zoom)} × {Math.round(height / viewport.zoom)}
          </text>
        </g>
      )}
    </svg>
  );
};