/**
 * Dynamic Wire Renderer Component
 * 
 * Renders professional wire connections with dynamic routing and collision detection
 * Supports multiple wire types, voltage classes, and professional styling
 */

import React, { useMemo } from 'react';
import type { SLDConnection, SLDComponent } from '../../types/sld';
import { 
  generateAllWireRoutes, 
  optimizeWireRoutes,
  type WireRoute,
  type RoutingConstraints 
} from '../../services/wireRoutingEngine';

export interface DynamicWireRendererProps {
  connections: SLDConnection[];
  components: SLDComponent[];
  constraints?: Partial<RoutingConstraints>;
  showWireLabels?: boolean;
  showCollisionHighlight?: boolean;
  interactive?: boolean;
  onWireClick?: (route: WireRoute) => void;
  onWireHover?: (route: WireRoute | null) => void;
  selectedWires?: string[];
  highlightedWires?: string[];
}

export const DynamicWireRenderer: React.FC<DynamicWireRendererProps> = ({
  connections,
  components,
  constraints = {},
  showWireLabels = true,
  showCollisionHighlight = true,
  interactive = false,
  onWireClick,
  onWireHover,
  selectedWires = [],
  highlightedWires = []
}) => {
  // Generate optimized wire routes
  const wireRoutes = useMemo(() => {
    if (!connections.length || !components.length) return [];
    
    const defaultConstraints = {
      minBendRadius: 10,
      maxBends: 4,
      preferredDirection: 'auto' as const,
      avoidanceMargin: 20,
      gridSnap: true,
      gridSize: 20,
      wireSpacing: 15,
      bundleWires: true,
      routingMethod: 'manhattan' as const,
      ...constraints
    };
    
    const routes = generateAllWireRoutes(connections, components, defaultConstraints);
    return optimizeWireRoutes(routes);
  }, [connections, components, constraints]);

  /**
   * Render wire path as SVG path element
   */
  const renderWirePath = (route: WireRoute) => {
    if (route.points.length < 2) return null;

    const isSelected = selectedWires.includes(route.connectionId);
    const isHighlighted = highlightedWires.includes(route.connectionId);
    const hasCollision = route.collision && showCollisionHighlight;

    // Generate SVG path string
    const pathData = generateSVGPath(route.points);
    
    // Determine stroke properties based on wire style and state
    const baseStyle = route.style;
    let strokeColor = baseStyle.strokeColor;
    let strokeWidth = baseStyle.strokeWidth;
    
    if (hasCollision) {
      strokeColor = '#dc2626'; // Red for collisions
      strokeWidth = Math.max(strokeWidth, 3);
    } else if (isSelected) {
      strokeColor = '#2563eb'; // Blue for selected
      strokeWidth = strokeWidth + 1;
    } else if (isHighlighted) {
      strokeColor = '#16a34a'; // Green for highlighted
    }

    return (
      <g key={route.id} className="wire-route">
        {/* Wire shadow/background for better visibility */}
        <path
          d={pathData}
          stroke="white"
          strokeWidth={strokeWidth + 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
        
        {/* Main wire path */}
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={baseStyle.strokeDasharray}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`wire-connection ${interactive ? 'cursor-pointer' : ''}`}
          onClick={interactive ? () => onWireClick?.(route) : undefined}
          onMouseEnter={interactive ? () => onWireHover?.(route) : undefined}
          onMouseLeave={interactive ? () => onWireHover?.(null) : undefined}
          style={{
            transition: interactive ? 'stroke-width 0.2s ease' : undefined
          }}
        />
        
        {/* Wire direction indicators for DC circuits */}
        {baseStyle.wireType === 'dc' && renderDirectionIndicators(route)}
        
        {/* Wire junction points */}
        {route.points
          .filter(point => point.type === 'junction' || point.type === 'corner')
          .map(point => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={3}
              fill={strokeColor}
              stroke="white"
              strokeWidth={1}
            />
          ))}
        
        {/* Collision warning indicators */}
        {hasCollision && (
          <g className="collision-indicators">
            {route.segments
              .filter(segment => segment.length > 20)
              .map((segment, index) => {
                const midX = (segment.start.x + segment.end.x) / 2;
                const midY = (segment.start.y + segment.end.y) / 2;
                return (
                  <circle
                    key={`collision-${index}`}
                    cx={midX}
                    cy={midY}
                    r={8}
                    fill="#fef3c7"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    opacity={0.9}
                  />
                );
              })}
          </g>
        )}
        
        {/* Wire labels */}
        {showWireLabels && renderWireLabels(route)}
      </g>
    );
  };

  /**
   * Generate SVG path string from routing points
   */
  const generateSVGPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      path += ` L ${point.x} ${point.y}`;
    }
    
    return path;
  };

  /**
   * Render direction indicators for DC circuits
   */
  const renderDirectionIndicators = (route: WireRoute) => {
    const indicators: JSX.Element[] = [];
    
    route.segments.forEach((segment, index) => {
      if (segment.length < 30) return; // Skip short segments
      
      const dx = segment.end.x - segment.start.x;
      const dy = segment.end.y - segment.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length < 1) return;
      
      // Normalize direction vector
      const dirX = dx / length;
      const dirY = dy / length;
      
      // Position indicator at 1/3 of segment length
      const indicatorX = segment.start.x + dirX * length * 0.33;
      const indicatorY = segment.start.y + dirY * length * 0.33;
      
      // Create arrow marker
      const arrowSize = 6;
      const arrowPoints = [
        [indicatorX + dirX * arrowSize, indicatorY + dirY * arrowSize],
        [indicatorX - dirX * arrowSize - dirY * arrowSize * 0.5, indicatorY - dirY * arrowSize + dirX * arrowSize * 0.5],
        [indicatorX - dirX * arrowSize + dirY * arrowSize * 0.5, indicatorY - dirY * arrowSize - dirX * arrowSize * 0.5]
      ];
      
      indicators.push(
        <polygon
          key={`arrow-${route.id}-${index}`}
          points={arrowPoints.map(p => `${p[0]},${p[1]}`).join(' ')}
          fill={route.style.strokeColor}
          stroke="white"
          strokeWidth={0.5}
        />
      );
    });
    
    return indicators;
  };

  /**
   * Render wire labels with specifications
   */
  const renderWireLabels = (route: WireRoute) => {
    if (route.segments.length === 0) return null;
    
    // Find the longest segment for label placement
    const longestSegment = route.segments.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
    
    if (longestSegment.length < 40) return null; // Don't label short wires
    
    const midX = (longestSegment.start.x + longestSegment.end.x) / 2;
    const midY = (longestSegment.start.y + longestSegment.end.y) / 2;
    
    // Get connection specifications
    const connection = connections.find(c => c.id === route.connectionId);
    const specifications = connection?.specifications;
    
    let labelText = '';
    if (specifications?.wireSize) {
      labelText = `${specifications.wireSize} AWG`;
    } else if (route.style.voltage) {
      labelText = `${route.style.voltage}V`;
    } else {
      labelText = route.style.wireType.toUpperCase();
    }
    
    // Add circuit number if available
    if (specifications?.circuitNumber) {
      labelText += ` (${specifications.circuitNumber})`;
    }
    
    return (
      <g className="wire-label">
        {/* Label background */}
        <rect
          x={midX - 20}
          y={midY - 8}
          width={40}
          height={16}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth={1}
          rx={2}
          opacity={0.9}
        />
        
        {/* Label text */}
        <text
          x={midX}
          y={midY + 3}
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fill="#374151"
          fontWeight="600"
        >
          {labelText}
        </text>
        
        {/* NEC compliance indicator */}
        {specifications?.necCompliant && (
          <circle
            cx={midX + 25}
            cy={midY}
            r={4}
            fill="#16a34a"
            stroke="white"
            strokeWidth={1}
          />
        )}
      </g>
    );
  };

  if (!wireRoutes.length) {
    return null;
  }

  return (
    <svg
      className="dynamic-wire-renderer absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* Define markers for wire terminations */}
      <defs>
        <marker
          id="wire-start"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <circle cx="4" cy="4" r="3" fill="#374151" stroke="white" strokeWidth="1" />
        </marker>
        
        <marker
          id="wire-end"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <polygon points="1,1 7,4 1,7" fill="#374151" stroke="white" strokeWidth="1" />
        </marker>
        
        <marker
          id="wire-junction"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <circle cx="3" cy="3" r="2" fill="#374151" />
        </marker>
      </defs>
      
      {/* Render all wire routes */}
      {wireRoutes.map(renderWirePath)}
      
      {/* Wire statistics overlay */}
      {showCollisionHighlight && (
        <g className="wire-statistics">
          <text
            x="10"
            y="20"
            fontSize="12"
            fill="#6b7280"
            fontFamily="monospace"
          >
            Wires: {wireRoutes.length} | Collisions: {wireRoutes.filter(r => r.collision).length}
          </text>
        </g>
      )}
    </svg>
  );
};

/**
 * Wire Route Preview Component for design validation
 */
export const WireRoutePreview: React.FC<{
  route: WireRoute;
  showDetails?: boolean;
}> = ({ route, showDetails = true }) => {
  return (
    <div className="wire-route-preview p-3 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">Route {route.id}</span>
        <div className="flex items-center gap-2">
          {route.collision && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
              Collision
            </span>
          )}
          <span 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: route.style.strokeColor }}
          />
        </div>
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>Length: {route.totalLength.toFixed(1)}px</div>
          <div>Bends: {route.bendCount}</div>
          <div>Type: {route.style.wireType}</div>
          {route.style.voltage && <div>Voltage: {route.style.voltage}V</div>}
          <div>Points: {route.points.length}</div>
        </div>
      )}
    </div>
  );
};

export default DynamicWireRenderer;