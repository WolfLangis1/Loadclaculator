import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { 
  SLDDiagram, 
  SLDComponent, 
  SLDConnection,
  SLDPosition,
  SLDSize
} from '../../types/sld';
import { RealisticComponentRenderer } from './RealisticComponentRenderer';

// Professional canvas configuration
const CANVAS_CONFIG = {
  // Infinite canvas bounds (in logical units)
  bounds: {
    minX: -50000,
    minY: -50000,
    maxX: 50000,
    maxY: 50000
  },
  // Grid configuration
  grid: {
    majorSpacing: 100,
    minorSpacing: 20,
    majorColor: '#e2e8f0',
    minorColor: '#f1f5f9',
    majorWidth: 1,
    minorWidth: 0.5
  },
  // Zoom configuration
  zoom: {
    min: 0.1,
    max: 10,
    step: 0.1,
    wheelSensitivity: 0.001
  },
  // Selection configuration
  selection: {
    strokeColor: '#3b82f6',
    strokeWidth: 2,
    fillColor: 'rgba(59, 130, 246, 0.1)',
    handleSize: 8
  }
};

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProfessionalSLDCanvasProps {
  diagram: SLDDiagram;
  onDiagramChange: (diagram: SLDDiagram) => void;
  readonly?: boolean;
  activeTool?: 'select' | 'draw_cable' | 'add_text' | 'pan' | 'zoom';
  accessibilityMode?: boolean;
  performanceMode?: 'high' | 'medium' | 'low';
  onComponentSelect?: (componentIds: string[]) => void;
  onConnectionSelect?: (connectionIds: string[]) => void;
}

interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}

export const ProfessionalSLDCanvas: React.FC<ProfessionalSLDCanvasProps> = ({
  diagram,
  onDiagramChange,
  readonly = false,
  activeTool = 'select',
  accessibilityMode = false,
  performanceMode = 'high',
  onComponentSelect,
  onConnectionSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas state
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, zoom: 1 });
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<SLDPosition | null>(null);
  const [isRubberBanding, setIsRubberBanding] = useState(false);
  const [rubberBandStart, setRubberBandStart] = useState<SLDPosition | null>(null);
  const [rubberBandEnd, setRubberBandEnd] = useState<SLDPosition | null>(null);
  
  // Calculate viewBox for SVG
  const viewBox = useMemo((): ViewBox => {
    if (!containerRef.current) {
      return { x: 0, y: 0, width: 1200, height: 800 };
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width / transform.zoom;
    const height = rect.height / transform.zoom;
    
    return {
      x: -transform.x / transform.zoom,
      y: -transform.y / transform.zoom,
      width,
      height
    };
  }, [transform]);

  // Convert screen coordinates to logical coordinates
  const screenToLogical = useCallback((screenX: number, screenY: number): SLDPosition => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const x = ((screenX - rect.left) / transform.zoom) - transform.x / transform.zoom;
    const y = ((screenY - rect.top) / transform.zoom) - transform.y / transform.zoom;
    
    return { x, y };
  }, [transform]);

  // Convert logical coordinates to screen coordinates
  const logicalToScreen = useCallback((logicalX: number, logicalY: number): SLDPosition => {
    const x = (logicalX + transform.x / transform.zoom) * transform.zoom;
    const y = (logicalY + transform.y / transform.zoom) * transform.zoom;
    
    return { x, y };
  }, [transform]);

  // Snap to grid function
  const snapToGrid = useCallback((position: SLDPosition, gridSize: number = CANVAS_CONFIG.grid.minorSpacing): SLDPosition => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, []);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      const deltaZoom = -event.deltaY * CANVAS_CONFIG.zoom.wheelSensitivity;
      const newZoom = Math.max(
        CANVAS_CONFIG.zoom.min,
        Math.min(CANVAS_CONFIG.zoom.max, transform.zoom + deltaZoom)
      );
      
      // Zoom towards mouse position
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const zoomFactor = newZoom / transform.zoom;
        const newX = transform.x + (mouseX - transform.x) * (1 - zoomFactor);
        const newY = transform.y + (mouseY - transform.y) * (1 - zoomFactor);
        
        setTransform({ x: newX, y: newY, zoom: newZoom });
      }
    }
  }, [transform]);

  // Handle mouse down for panning and selection
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (readonly) return;
    
    const logicalPos = screenToLogical(event.clientX, event.clientY);
    
    switch (activeTool) {
      case 'pan':
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
        break;
        
      case 'select':
        if (!event.shiftKey) {
          setSelectedElements([]);
        }
        setIsRubberBanding(true);
        setRubberBandStart(logicalPos);
        setRubberBandEnd(logicalPos);
        break;
    }
  }, [readonly, activeTool, screenToLogical]);

  // Handle mouse move for panning and rubber band selection
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const logicalPos = screenToLogical(event.clientX, event.clientY);
    
    if (isDragging && dragStart && activeTool === 'pan') {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      
      setTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setDragStart({ x: event.clientX, y: event.clientY });
    }
    
    if (isRubberBanding && rubberBandStart) {
      setRubberBandEnd(logicalPos);
      
      // Calculate selection rectangle
      const minX = Math.min(rubberBandStart.x, logicalPos.x);
      const maxX = Math.max(rubberBandStart.x, logicalPos.x);
      const minY = Math.min(rubberBandStart.y, logicalPos.y);
      const maxY = Math.max(rubberBandStart.y, logicalPos.y);
      
      // Find components within selection
      const selectedIds = diagram.components
        ?.filter(component => {
          const pos = component.position;
          const size = component.size;
          if (!pos || !size) return false;
          
          return pos.x >= minX && pos.x + size.width <= maxX &&
                 pos.y >= minY && pos.y + size.height <= maxY;
        })
        .map(c => c.id) || [];
      
      setSelectedElements(selectedIds);
    }
  }, [isDragging, dragStart, activeTool, isRubberBanding, rubberBandStart, screenToLogical, diagram.components]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setIsRubberBanding(false);
    setRubberBandStart(null);
    setRubberBandEnd(null);
  }, []);

  // Handle component click
  const handleComponentClick = useCallback((componentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.shiftKey) {
      setSelectedElements(prev => 
        prev.includes(componentId) 
          ? prev.filter(id => id !== componentId)
          : [...prev, componentId]
      );
    } else {
      setSelectedElements([componentId]);
    }
    
    onComponentSelect?.([componentId]);
  }, [onComponentSelect]);

  // Generate grid pattern
  const gridPattern = useMemo(() => {
    const { majorSpacing, minorSpacing, majorColor, minorColor, majorWidth, minorWidth } = CANVAS_CONFIG.grid;
    
    return (
      <defs>
        <pattern
          id="minor-grid"
          width={minorSpacing}
          height={minorSpacing}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${minorSpacing} 0 L 0 0 0 ${minorSpacing}`}
            fill="none"
            stroke={minorColor}
            strokeWidth={minorWidth}
          />
        </pattern>
        <pattern
          id="major-grid"
          width={majorSpacing}
          height={majorSpacing}
          patternUnits="userSpaceOnUse"
        >
          <rect width={majorSpacing} height={majorSpacing} fill="url(#minor-grid)" />
          <path
            d={`M ${majorSpacing} 0 L 0 0 0 ${majorSpacing}`}
            fill="none"
            stroke={majorColor}
            strokeWidth={majorWidth}
          />
        </pattern>
      </defs>
    );
  }, []);

  // Render component with enhanced features
  const renderComponent = useCallback((component: SLDComponent) => {
    const isSelected = selectedElements.includes(component.id);
    const isHovered = hoveredElement === component.id;
    
    return (
      <g
        key={component.id}
        transform={`translate(${component.position?.x || 0}, ${component.position?.y || 0})`}
        onClick={(e) => handleComponentClick(component.id, e)}
        onMouseEnter={() => setHoveredElement(component.id)}
        onMouseLeave={() => setHoveredElement(null)}
        className="cursor-pointer"
      >
        <RealisticComponentRenderer
          component={component}
          size={component.size || { width: 60, height: 40 }}
          isSelected={isSelected}
          isHovered={isHovered}
          accessibilityMode={accessibilityMode}
        />
        
        {/* Selection indicator */}
        {isSelected && (
          <g>
            <rect
              x={-4}
              y={-4}
              width={(component.size?.width || 60) + 8}
              height={(component.size?.height || 40) + 8}
              fill="none"
              stroke={CANVAS_CONFIG.selection.strokeColor}
              strokeWidth={CANVAS_CONFIG.selection.strokeWidth}
              strokeDasharray="5,5"
            />
            
            {/* Selection handles */}
            <rect
              x={-CANVAS_CONFIG.selection.handleSize/2}
              y={-CANVAS_CONFIG.selection.handleSize/2}
              width={CANVAS_CONFIG.selection.handleSize}
              height={CANVAS_CONFIG.selection.handleSize}
              fill={CANVAS_CONFIG.selection.strokeColor}
              className="cursor-nw-resize"
            />
            <rect
              x={(component.size?.width || 60) - CANVAS_CONFIG.selection.handleSize/2}
              y={-CANVAS_CONFIG.selection.handleSize/2}
              width={CANVAS_CONFIG.selection.handleSize}
              height={CANVAS_CONFIG.selection.handleSize}
              fill={CANVAS_CONFIG.selection.strokeColor}
              className="cursor-ne-resize"
            />
            <rect
              x={-CANVAS_CONFIG.selection.handleSize/2}
              y={(component.size?.height || 40) - CANVAS_CONFIG.selection.handleSize/2}
              width={CANVAS_CONFIG.selection.handleSize}
              height={CANVAS_CONFIG.selection.handleSize}
              fill={CANVAS_CONFIG.selection.strokeColor}
              className="cursor-sw-resize"
            />
            <rect
              x={(component.size?.width || 60) - CANVAS_CONFIG.selection.handleSize/2}
              y={(component.size?.height || 40) - CANVAS_CONFIG.selection.handleSize/2}
              width={CANVAS_CONFIG.selection.handleSize}
              height={CANVAS_CONFIG.selection.handleSize}
              fill={CANVAS_CONFIG.selection.strokeColor}
              className="cursor-se-resize"
            />
          </g>
        )}
      </g>
    );
  }, [selectedElements, hoveredElement, handleComponentClick, accessibilityMode]);

  // Render connection with enhanced styling
  const renderConnection = useCallback((connection: SLDConnection) => {
    const fromComponent = diagram.components?.find(c => c.id === connection.fromComponentId);
    const toComponent = diagram.components?.find(c => c.id === connection.toComponentId);
    
    if (!fromComponent || !toComponent) return null;

    const x1 = (fromComponent.position?.x || 0) + (fromComponent.size?.width || 0) / 2;
    const y1 = (fromComponent.position?.y || 0) + (fromComponent.size?.height || 0) / 2;
    const x2 = (toComponent.position?.x || 0) + (toComponent.size?.width || 0) / 2;
    const y2 = (toComponent.position?.y || 0) + (toComponent.size?.height || 0) / 2;

    const isSelected = selectedElements.includes(connection.id);
    const isHovered = hoveredElement === connection.id;

    // Enhanced wire styling
    const getWireStyle = () => {
      switch (connection.wireType) {
        case 'dc':
          return { stroke: '#dc2626', strokeWidth: 3, strokeDasharray: '8,4' };
        case 'ac':
          return { stroke: '#2563eb', strokeWidth: 2 };
        case 'ground':
          return { stroke: '#059669', strokeWidth: 2, strokeDasharray: '12,6' };
        default:
          return { stroke: '#374151', strokeWidth: 2 };
      }
    };

    const style = getWireStyle();

    return (
      <g
        key={connection.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElements([connection.id]);
          onConnectionSelect?.([connection.id]);
        }}
        onMouseEnter={() => setHoveredElement(connection.id)}
        onMouseLeave={() => setHoveredElement(null)}
        className="cursor-pointer"
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          {...style}
          opacity={isHovered ? 0.8 : 1}
          strokeWidth={isSelected ? style.strokeWidth + 2 : style.strokeWidth}
        />
        
        {connection.label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 8}
            textAnchor="middle"
            fontSize="10"
            fill={style.stroke}
            className="select-none font-medium"
          >
            {connection.label}
          </text>
        )}
      </g>
    );
  }, [diagram.components, selectedElements, hoveredElement, onConnectionSelect]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ minHeight: '600px' }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`
          ${activeTool === 'pan' ? 'cursor-grab' : ''}
          ${activeTool === 'draw_cable' ? 'cursor-crosshair' : ''}
          ${activeTool === 'add_text' ? 'cursor-text' : ''}
          ${isDragging && activeTool === 'pan' ? 'cursor-grabbing' : ''}
        `}
      >
        {gridPattern}
        
        {/* Grid background */}
        <rect
          x={CANVAS_CONFIG.bounds.minX}
          y={CANVAS_CONFIG.bounds.minY}
          width={CANVAS_CONFIG.bounds.maxX - CANVAS_CONFIG.bounds.minX}
          height={CANVAS_CONFIG.bounds.maxY - CANVAS_CONFIG.bounds.minY}
          fill="url(#major-grid)"
        />

        {/* Canvas boundary */}
        <rect
          x={0}
          y={0}
          width={diagram.canvasSize?.width || 1200}
          height={diagram.canvasSize?.height || 800}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="10,5"
        />

        {/* Render connections first (behind components) */}
        {diagram.connections?.map(renderConnection)}

        {/* Render components */}
        {diagram.components?.map(renderComponent)}

        {/* Rubber band selection */}
        {isRubberBanding && rubberBandStart && rubberBandEnd && (
          <rect
            x={Math.min(rubberBandStart.x, rubberBandEnd.x)}
            y={Math.min(rubberBandStart.y, rubberBandEnd.y)}
            width={Math.abs(rubberBandEnd.x - rubberBandStart.x)}
            height={Math.abs(rubberBandEnd.y - rubberBandStart.y)}
            fill={CANVAS_CONFIG.selection.fillColor}
            stroke={CANVAS_CONFIG.selection.strokeColor}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}
      </svg>

      {/* Canvas controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg border p-2">
        <div className="text-xs text-gray-600">
          Zoom: {Math.round(transform.zoom * 100)}%
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTransform(prev => ({ ...prev, zoom: Math.max(CANVAS_CONFIG.zoom.min, prev.zoom - 0.1) }))}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            disabled={transform.zoom <= CANVAS_CONFIG.zoom.min}
          >
            -
          </button>
          <button
            onClick={() => setTransform({ x: 0, y: 0, zoom: 1 })}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Reset
          </button>
          <button
            onClick={() => setTransform(prev => ({ ...prev, zoom: Math.min(CANVAS_CONFIG.zoom.max, prev.zoom + 0.1) }))}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            disabled={transform.zoom >= CANVAS_CONFIG.zoom.max}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSLDCanvas;