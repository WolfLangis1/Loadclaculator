import React, { useMemo } from 'react';

interface GridConfig {
  majorSpacing: number;
  minorSpacing: number;
  majorColor: string;
  minorColor: string;
  majorWidth: number;
  minorWidth: number;
  opacity: number;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProfessionalGridProps {
  config: GridConfig;
  viewBox: ViewBox;
  zoom: number;
  enabled: boolean;
}

/**
 * Professional grid system with adaptive density based on zoom level
 * Implements CAD-style grid with major and minor divisions
 */
export const ProfessionalGrid: React.FC<ProfessionalGridProps> = ({
  config,
  viewBox,
  zoom,
  enabled
}) => {
  // Calculate grid density based on zoom level
  const gridDensity = useMemo(() => {
    const baseSize = config.minorSpacing;
    
    // Adjust grid density based on zoom level
    if (zoom < 0.25) {
      return {
        majorSpacing: config.majorSpacing * 4,
        minorSpacing: config.majorSpacing,
        showMinor: false
      };
    } else if (zoom < 0.5) {
      return {
        majorSpacing: config.majorSpacing * 2,
        minorSpacing: config.majorSpacing,
        showMinor: false
      };
    } else if (zoom < 1) {
      return {
        majorSpacing: config.majorSpacing,
        minorSpacing: config.majorSpacing / 2,
        showMinor: false
      };
    } else if (zoom < 2) {
      return {
        majorSpacing: config.majorSpacing,
        minorSpacing: config.minorSpacing * 2,
        showMinor: true
      };
    } else {
      return {
        majorSpacing: config.majorSpacing,
        minorSpacing: config.minorSpacing,
        showMinor: true
      };
    }
  }, [config, zoom]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!enabled) return null;

    const { majorSpacing, minorSpacing, showMinor } = gridDensity;
    
    // Calculate visible grid bounds with some padding
    const padding = Math.max(majorSpacing, minorSpacing) * 2;
    const startX = Math.floor((viewBox.x - padding) / majorSpacing) * majorSpacing;
    const endX = Math.ceil((viewBox.x + viewBox.width + padding) / majorSpacing) * majorSpacing;
    const startY = Math.floor((viewBox.y - padding) / majorSpacing) * majorSpacing;
    const endY = Math.ceil((viewBox.y + viewBox.height + padding) / majorSpacing) * majorSpacing;

    const majorLines: JSX.Element[] = [];
    const minorLines: JSX.Element[] = [];

    // Generate vertical lines
    for (let x = startX; x <= endX; x += majorSpacing) {
      // Major vertical line
      majorLines.push(
        <line
          key={`major-v-${x}`}
          x1={x}
          y1={viewBox.y - padding}
          x2={x}
          y2={viewBox.y + viewBox.height + padding}
          stroke={config.majorColor}
          strokeWidth={config.majorWidth / zoom}
          opacity={config.opacity}
        />
      );

      // Minor vertical lines
      if (showMinor && minorSpacing < majorSpacing) {
        const minorSteps = Math.floor(majorSpacing / minorSpacing);
        for (let i = 1; i < minorSteps; i++) {
          const minorX = x + i * minorSpacing;
          if (minorX <= endX) {
            minorLines.push(
              <line
                key={`minor-v-${minorX}`}
                x1={minorX}
                y1={viewBox.y - padding}
                x2={minorX}
                y2={viewBox.y + viewBox.height + padding}
                stroke={config.minorColor}
                strokeWidth={config.minorWidth / zoom}
                opacity={config.opacity * 0.6}
              />
            );
          }
        }
      }
    }

    // Generate horizontal lines
    for (let y = startY; y <= endY; y += majorSpacing) {
      // Major horizontal line
      majorLines.push(
        <line
          key={`major-h-${y}`}
          x1={viewBox.x - padding}
          y1={y}
          x2={viewBox.x + viewBox.width + padding}
          y2={y}
          stroke={config.majorColor}
          strokeWidth={config.majorWidth / zoom}
          opacity={config.opacity}
        />
      );

      // Minor horizontal lines
      if (showMinor && minorSpacing < majorSpacing) {
        const minorSteps = Math.floor(majorSpacing / minorSpacing);
        for (let i = 1; i < minorSteps; i++) {
          const minorY = y + i * minorSpacing;
          if (minorY <= endY) {
            minorLines.push(
              <line
                key={`minor-h-${minorY}`}
                x1={viewBox.x - padding}
                y1={minorY}
                x2={viewBox.x + viewBox.width + padding}
                y2={minorY}
                stroke={config.minorColor}
                strokeWidth={config.minorWidth / zoom}
                opacity={config.opacity * 0.6}
              />
            );
          }
        }
      }
    }

    return (
      <g className="grid">
        {/* Render minor lines first (behind major lines) */}
        {minorLines}
        {/* Render major lines on top */}
        {majorLines}
      </g>
    );
  }, [enabled, gridDensity, viewBox, config, zoom]);

  // Generate origin indicators
  const originIndicators = useMemo(() => {
    if (!enabled || zoom < 0.5) return null;

    const originSize = 20 / zoom;
    const strokeWidth = 2 / zoom;

    return (
      <g className="origin-indicators">
        {/* X-axis indicator */}
        <line
          x1={-originSize}
          y1={0}
          x2={originSize}
          y2={0}
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          opacity={0.8}
        />
        <text
          x={originSize + 5 / zoom}
          y={5 / zoom}
          fontSize={12 / zoom}
          fill="#ef4444"
          className="select-none"
        >
          X
        </text>

        {/* Y-axis indicator */}
        <line
          x1={0}
          y1={-originSize}
          x2={0}
          y2={originSize}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          opacity={0.8}
        />
        <text
          x={5 / zoom}
          y={-originSize - 5 / zoom}
          fontSize={12 / zoom}
          fill="#10b981"
          className="select-none"
        >
          Y
        </text>

        {/* Origin point */}
        <circle
          cx={0}
          cy={0}
          r={3 / zoom}
          fill="#6b7280"
          opacity={0.8}
        />
      </g>
    );
  }, [enabled, zoom]);

  // Generate measurement rulers (when zoomed in)
  const measurementRulers = useMemo(() => {
    if (!enabled || zoom < 1) return null;

    const rulerSpacing = gridDensity.majorSpacing;
    const tickSize = 5 / zoom;
    const fontSize = 10 / zoom;
    const strokeWidth = 1 / zoom;

    const rulers: JSX.Element[] = [];

    // Horizontal ruler (top)
    const startX = Math.floor(viewBox.x / rulerSpacing) * rulerSpacing;
    const endX = Math.ceil((viewBox.x + viewBox.width) / rulerSpacing) * rulerSpacing;
    
    for (let x = startX; x <= endX; x += rulerSpacing) {
      rulers.push(
        <g key={`ruler-h-${x}`}>
          <line
            x1={x}
            y1={viewBox.y}
            x2={x}
            y2={viewBox.y + tickSize}
            stroke="#9ca3af"
            strokeWidth={strokeWidth}
          />
          <text
            x={x}
            y={viewBox.y + tickSize + fontSize}
            textAnchor="middle"
            fontSize={fontSize}
            fill="#6b7280"
            className="select-none"
          >
            {x}
          </text>
        </g>
      );
    }

    // Vertical ruler (left)
    const startY = Math.floor(viewBox.y / rulerSpacing) * rulerSpacing;
    const endY = Math.ceil((viewBox.y + viewBox.height) / rulerSpacing) * rulerSpacing;
    
    for (let y = startY; y <= endY; y += rulerSpacing) {
      rulers.push(
        <g key={`ruler-v-${y}`}>
          <line
            x1={viewBox.x}
            y1={y}
            x2={viewBox.x + tickSize}
            y2={y}
            stroke="#9ca3af"
            strokeWidth={strokeWidth}
          />
          <text
            x={viewBox.x + tickSize + 2 / zoom}
            y={y + fontSize / 3}
            fontSize={fontSize}
            fill="#6b7280"
            className="select-none"
          >
            {y}
          </text>
        </g>
      );
    }

    return <g className="measurement-rulers">{rulers}</g>;
  }, [enabled, zoom, viewBox, gridDensity]);

  if (!enabled) return null;

  return (
    <>
      {gridLines}
      {originIndicators}
      {measurementRulers}
    </>
  );
};

// Default grid configurations for different drawing scales
export const GRID_PRESETS = {
  architectural: {
    majorSpacing: 120, // 10 feet at 1/8" scale
    minorSpacing: 12,  // 1 foot
    majorColor: '#e2e8f0',
    minorColor: '#f1f5f9',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.8
  },
  
  electrical: {
    majorSpacing: 100, // 1 meter or standard electrical spacing
    minorSpacing: 20,  // 20 cm
    majorColor: '#ddd6fe',
    minorColor: '#f3f4f6',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.7
  },
  
  mechanical: {
    majorSpacing: 50,  // 50mm
    minorSpacing: 10,  // 10mm
    majorColor: '#fecaca',
    minorColor: '#fef2f2',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.6
  },
  
  schematic: {
    majorSpacing: 80,  // Standard schematic grid
    minorSpacing: 20,
    majorColor: '#e0e7ff',
    minorColor: '#f0f4ff',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.5
  },

  // IEEE 315 Standard Electrical Drawing Grid
  ieee_315: {
    majorSpacing: 96,  // 1 inch at 96 DPI
    minorSpacing: 24,  // 1/4 inch
    majorColor: '#4f46e5',
    minorColor: '#e0e7ff',
    majorWidth: 1.5,
    minorWidth: 0.5,
    opacity: 0.6
  },

  // NEC Panel Layout Grid
  nec_panel: {
    majorSpacing: 144, // Standard panel spacing (1.5")
    minorSpacing: 18,  // Circuit breaker spacing
    majorColor: '#059669',
    minorColor: '#d1fae5',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.7
  },

  // Imperial (feet/inches)
  imperial: {
    majorSpacing: 96,  // 1 foot at 96 DPI
    minorSpacing: 8,   // 1 inch
    majorColor: '#dc2626',
    minorColor: '#fecaca',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.6
  },

  // Metric (meters/centimeters)
  metric: {
    majorSpacing: 100, // 1 meter at 100px/m
    minorSpacing: 10,  // 10 cm
    majorColor: '#7c3aed',
    minorColor: '#ede9fe',
    majorWidth: 1,
    minorWidth: 0.5,
    opacity: 0.6
  },

  // Dots grid for precision work
  dots: {
    majorSpacing: 50,
    minorSpacing: 10,
    majorColor: '#6b7280',
    minorColor: '#d1d5db',
    majorWidth: 2,   // Dot radius for major
    minorWidth: 1,   // Dot radius for minor
    opacity: 0.4
  }
};

export default ProfessionalGrid;