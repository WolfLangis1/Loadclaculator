/**
 * Selection Renderer Component
 * 
 * Renders selection bounds, handles, and visual feedback
 */

import React from 'react';
import { SelectionBounds, SelectionHandle } from './engine/SelectionSystem';

interface SelectionRendererProps {
  selectionBounds: SelectionBounds | null;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  showHandles?: boolean;
  activeHandle?: SelectionHandle | null;
  isDragging?: boolean;
}

export const SelectionRenderer: React.FC<SelectionRendererProps> = ({
  selectionBounds,
  viewport,
  showHandles = true,
  activeHandle = null,
  isDragging = false
}) => {
  if (!selectionBounds) return null;

  // Transform world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => ({
    x: (worldX - viewport.x) * viewport.zoom,
    y: (worldY - viewport.y) * viewport.zoom
  });

  const screenBounds = {
    x: (selectionBounds.x - viewport.x) * viewport.zoom,
    y: (selectionBounds.y - viewport.y) * viewport.zoom,
    width: selectionBounds.width * viewport.zoom,
    height: selectionBounds.height * viewport.zoom
  };

  // Render selection outline
  const renderSelectionOutline = () => (
    <rect
      x={screenBounds.x}
      y={screenBounds.y}
      width={screenBounds.width}
      height={screenBounds.height}
      fill="none"
      stroke="#2563eb"
      strokeWidth={2}
      strokeDasharray="5,5"
      opacity={0.8}
    />
  );

  // Render selection handles
  const renderSelectionHandles = () => {
    if (!showHandles || viewport.zoom < 0.5) return null;

    return (
      <g className="selection-handles">
        {selectionBounds.handles.map((handle) => {
          if (!handle.visible) return null;

          const screenPos = worldToScreen(
            handle.position.x + handle.size / 2,
            handle.position.y + handle.size / 2
          );
          
          const handleSize = handle.size * Math.max(0.8, Math.min(1.2, viewport.zoom));
          const isActive = activeHandle?.id === handle.id;
          const isRotateHandle = handle.type === 'rotate';

          return (
            <g key={handle.id}>
              {/* Handle background */}
              <rect
                x={screenPos.x - handleSize / 2}
                y={screenPos.y - handleSize / 2}
                width={handleSize}
                height={handleSize}
                fill="white"
                stroke="#2563eb"
                strokeWidth={2}
                rx={isRotateHandle ? handleSize / 2 : 2}
                opacity={isActive ? 1 : 0.9}
                style={{
                  cursor: handle.cursor,
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                }}
              />
              
              {/* Handle icon for rotate handle */}
              {isRotateHandle && (
                <circle
                  cx={screenPos.x}
                  cy={screenPos.y}
                  r={handleSize / 4}
                  fill="#2563eb"
                  opacity={0.7}
                />
              )}
              
              {/* Active handle highlight */}
              {isActive && (
                <rect
                  x={screenPos.x - handleSize / 2 - 2}
                  y={screenPos.y - handleSize / 2 - 2}
                  width={handleSize + 4}
                  height={handleSize + 4}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  rx={isRotateHandle ? (handleSize + 4) / 2 : 3}
                  opacity={0.6}
                />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Render rotation guide line (for rotate handle)
  const renderRotationGuide = () => {
    if (!activeHandle || activeHandle.type !== 'rotate' || !isDragging) return null;

    const centerX = screenBounds.x + screenBounds.width / 2;
    const centerY = screenBounds.y + screenBounds.height / 2;
    const handlePos = worldToScreen(
      activeHandle.position.x + activeHandle.size / 2,
      activeHandle.position.y + activeHandle.size / 2
    );

    return (
      <g className="rotation-guide">
        <line
          x1={centerX}
          y1={centerY}
          x2={handlePos.x}
          y2={handlePos.y}
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.6}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill="#3b82f6"
          opacity={0.6}
        />
      </g>
    );
  };

  // Render dimension labels
  const renderDimensions = () => {
    if (viewport.zoom < 0.8) return null;

    const width = selectionBounds.width;
    const height = selectionBounds.height;
    
    // Format dimensions
    const formatDimension = (value: number) => {
      if (value < 1) return `${(value * 1000).toFixed(0)}mm`;
      return `${value.toFixed(1)}px`;
    };

    const widthLabel = formatDimension(width);
    const heightLabel = formatDimension(height);

    return (
      <g className="dimension-labels">
        {/* Width label */}
        <text
          x={screenBounds.x + screenBounds.width / 2}
          y={screenBounds.y - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#374151"
          fontFamily="system-ui, sans-serif"
          style={{ userSelect: 'none' }}
        >
          {widthLabel}
        </text>
        
        {/* Height label */}
        <text
          x={screenBounds.x - 8}
          y={screenBounds.y + screenBounds.height / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#374151"
          fontFamily="system-ui, sans-serif"
          transform={`rotate(-90, ${screenBounds.x - 8}, ${screenBounds.y + screenBounds.height / 2})`}
          style={{ userSelect: 'none' }}
        >
          {heightLabel}
        </text>
      </g>
    );
  };

  // Render selection info tooltip
  const renderSelectionInfo = () => {
    if (viewport.zoom < 0.6) return null;

    const objectCount = 1; // This would come from selection system
    const infoText = objectCount === 1 ? '1 object' : `${objectCount} objects`;

    return (
      <g className="selection-info">
        <rect
          x={screenBounds.x}
          y={screenBounds.y + screenBounds.height + 8}
          width={60}
          height={20}
          fill="rgba(37, 99, 235, 0.9)"
          rx={4}
        />
        <text
          x={screenBounds.x + 30}
          y={screenBounds.y + screenBounds.height + 20}
          textAnchor="middle"
          fontSize="10"
          fill="white"
          fontFamily="system-ui, sans-serif"
          style={{ userSelect: 'none' }}
        >
          {infoText}
        </text>
      </g>
    );
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 100 }}
    >
      {renderSelectionOutline()}
      {renderSelectionHandles()}
      {renderRotationGuide()}
      {renderDimensions()}
      {renderSelectionInfo()}
    </svg>
  );
};