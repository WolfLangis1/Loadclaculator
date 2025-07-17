/**
 * Grid Renderer Component for Professional SLD Canvas
 * 
 * Renders precision grid with visual feedback and alignment guides
 */

import React, { useMemo } from 'react';
import { GridSystem, AlignmentGuide } from './engine/GridSystem';

interface GridRendererProps {
  gridSystem: GridSystem;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  alignmentGuides?: AlignmentGuide[];
  showSnapFeedback?: boolean;
  snapPoint?: { x: number; y: number } | null;
}

export const GridRenderer: React.FC<GridRendererProps> = ({
  gridSystem,
  viewport,
  alignmentGuides = [],
  showSnapFeedback = false,
  snapPoint = null
}) => {
  const settings = gridSystem.getSettings();
  
  // Calculate grid lines within viewport
  const gridLines = useMemo(() => {
    return gridSystem.getGridLines(viewport);
  }, [gridSystem, viewport]);

  // Transform world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => ({
    x: (worldX - viewport.x) * viewport.zoom,
    y: (worldY - viewport.y) * viewport.zoom
  });

  // Render major grid lines
  const renderMajorGrid = () => {
    if (!settings.showMajorGrid) return null;

    return (
      <g className="major-grid">
        {gridLines.majorLines.map((line, index) => {
          if (line.type === 'vertical') {
            const screenPos = worldToScreen(line.position, 0);
            return (
              <line
                key={`major-v-${index}`}
                x1={screenPos.x}
                y1={0}
                x2={screenPos.x}
                y2={viewport.height}
                stroke={settings.majorGridColor}
                strokeWidth={1}
                opacity={settings.majorGridOpacity}
              />
            );
          } else {
            const screenPos = worldToScreen(0, line.position);
            return (
              <line
                key={`major-h-${index}`}
                x1={0}
                y1={screenPos.y}
                x2={viewport.width}
                y2={screenPos.y}
                stroke={settings.majorGridColor}
                strokeWidth={1}
                opacity={settings.majorGridOpacity}
              />
            );
          }
        })}
      </g>
    );
  };

  // Render minor grid lines
  const renderMinorGrid = () => {
    if (!settings.showMinorGrid || viewport.zoom < 0.5) return null;

    return (
      <g className="minor-grid">
        {gridLines.minorLines.map((line, index) => {
          if (line.type === 'vertical') {
            const screenPos = worldToScreen(line.position, 0);
            return (
              <line
                key={`minor-v-${index}`}
                x1={screenPos.x}
                y1={0}
                x2={screenPos.x}
                y2={viewport.height}
                stroke={settings.minorGridColor}
                strokeWidth={0.5}
                opacity={settings.minorGridOpacity}
              />
            );
          } else {
            const screenPos = worldToScreen(0, line.position);
            return (
              <line
                key={`minor-h-${index}`}
                x1={0}
                y1={screenPos.y}
                x2={viewport.width}
                y2={screenPos.y}
                stroke={settings.minorGridColor}
                strokeWidth={0.5}
                opacity={settings.minorGridOpacity}
              />
            );
          }
        })}
      </g>
    );
  };

  // Render alignment guides
  const renderAlignmentGuides = () => {
    if (alignmentGuides.length === 0) return null;

    return (
      <g className="alignment-guides">
        {alignmentGuides.map((guide) => {
          if (guide.type === 'horizontal') {
            const screenY = worldToScreen(0, guide.position).y;
            const startX = worldToScreen(guide.start, 0).x;
            const endX = worldToScreen(guide.end, 0).x;
            
            return (
              <g key={guide.id}>
                <line
                  x1={startX}
                  y1={screenY}
                  x2={endX}
                  y2={screenY}
                  stroke={guide.color}
                  strokeWidth={2}
                  opacity={guide.opacity}
                  strokeDasharray="5,5"
                />
                {/* Guide arrows */}
                <polygon
                  points={`${startX},${screenY-4} ${startX+8},${screenY} ${startX},${screenY+4}`}
                  fill={guide.color}
                  opacity={guide.opacity}
                />
                <polygon
                  points={`${endX},${screenY-4} ${endX-8},${screenY} ${endX},${screenY+4}`}
                  fill={guide.color}
                  opacity={guide.opacity}
                />
              </g>
            );
          } else {
            const screenX = worldToScreen(guide.position, 0).x;
            const startY = worldToScreen(0, guide.start).y;
            const endY = worldToScreen(0, guide.end).y;
            
            return (
              <g key={guide.id}>
                <line
                  x1={screenX}
                  y1={startY}
                  x2={screenX}
                  y2={endY}
                  stroke={guide.color}
                  strokeWidth={2}
                  opacity={guide.opacity}
                  strokeDasharray="5,5"
                />
                {/* Guide arrows */}
                <polygon
                  points={`${screenX-4},${startY} ${screenX},${startY+8} ${screenX+4},${startY}`}
                  fill={guide.color}
                  opacity={guide.opacity}
                />
                <polygon
                  points={`${screenX-4},${endY} ${screenX},${endY-8} ${screenX+4},${endY}`}
                  fill={guide.color}
                  opacity={guide.opacity}
                />
              </g>
            );
          }
        })}
      </g>
    );
  };

  // Render snap feedback
  const renderSnapFeedback = () => {
    if (!showSnapFeedback || !snapPoint) return null;

    const screenPos = worldToScreen(snapPoint.x, snapPoint.y);
    
    return (
      <g className="snap-feedback">
        {/* Snap indicator circle */}
        <circle
          cx={screenPos.x}
          cy={screenPos.y}
          r={8}
          fill="none"
          stroke="#ff6b6b"
          strokeWidth={2}
          opacity={0.8}
        />
        {/* Crosshair */}
        <line
          x1={screenPos.x - 12}
          y1={screenPos.y}
          x2={screenPos.x + 12}
          y2={screenPos.y}
          stroke="#ff6b6b"
          strokeWidth={1}
          opacity={0.8}
        />
        <line
          x1={screenPos.x}
          y1={screenPos.y - 12}
          x2={screenPos.x}
          y2={screenPos.y + 12}
          stroke="#ff6b6b"
          strokeWidth={1}
          opacity={0.8}
        />
      </g>
    );
  };

  // Render grid origin indicator
  const renderOrigin = () => {
    const origin = worldToScreen(0, 0);
    
    // Only show if origin is visible
    if (origin.x < -20 || origin.x > viewport.width + 20 || 
        origin.y < -20 || origin.y > viewport.height + 20) {
      return null;
    }

    return (
      <g className="grid-origin">
        <circle
          cx={origin.x}
          cy={origin.y}
          r={4}
          fill="#666"
          opacity={0.6}
        />
        <line
          x1={origin.x - 10}
          y1={origin.y}
          x2={origin.x + 10}
          y2={origin.y}
          stroke="#666"
          strokeWidth={1}
          opacity={0.6}
        />
        <line
          x1={origin.x}
          y1={origin.y - 10}
          x2={origin.x}
          y2={origin.y + 10}
          stroke="#666"
          strokeWidth={1}
          opacity={0.6}
        />
      </g>
    );
  };

  if (!settings.enabled) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {renderMinorGrid()}
      {renderMajorGrid()}
      {renderAlignmentGuides()}
      {renderSnapFeedback()}
      {renderOrigin()}
    </svg>
  );
};