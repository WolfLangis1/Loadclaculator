import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Save, Undo, Redo, Grid, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import type { SLDDiagram, SLDComponent, SLDConnection, SLDPosition } from '../../types/sld';

interface SLDCanvasProps {
  diagram: SLDDiagram;
  onDiagramChange: (diagram: SLDDiagram) => void;
  readonly?: boolean;
}

interface DragState {
  isDragging: boolean;
  draggedComponent: string | null;
  startPosition: SLDPosition;
  offset: SLDPosition;
}

interface CanvasBounds {
  width: number;
  height: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const SLDCanvas: React.FC<SLDCanvasProps> = ({
  diagram,
  onDiagramChange,
  readonly = false
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  // Canvas dimensions and boundaries
  const CANVAS_PADDING = 50;
  const DEFAULT_CANVAS_SIZE = { width: 1200, height: 800 };

  // Calculate canvas bounds based on components
  const calculateCanvasBounds = useCallback((): CanvasBounds => {
    if (diagram.components.length === 0) {
      return {
        width: DEFAULT_CANVAS_SIZE.width,
        height: DEFAULT_CANVAS_SIZE.height,
        minX: 0,
        minY: 0,
        maxX: DEFAULT_CANVAS_SIZE.width,
        maxY: DEFAULT_CANVAS_SIZE.height
      };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    diagram.components.forEach(component => {
      const left = component.position.x;
      const top = component.position.y;
      const right = left + component.size.width;
      const bottom = top + component.size.height;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // Add padding around components
    const boundsWidth = Math.max(maxX - minX + (CANVAS_PADDING * 2), DEFAULT_CANVAS_SIZE.width);
    const boundsHeight = Math.max(maxY - minY + (CANVAS_PADDING * 2), DEFAULT_CANVAS_SIZE.height);

    return {
      width: boundsWidth,
      height: boundsHeight,
      minX: Math.min(minX - CANVAS_PADDING, 0),
      minY: Math.min(minY - CANVAS_PADDING, 0),
      maxX: Math.max(maxX + CANVAS_PADDING, DEFAULT_CANVAS_SIZE.width),
      maxY: Math.max(maxY + CANVAS_PADDING, DEFAULT_CANVAS_SIZE.height)
    };
  }, [diagram.components]);

  // Constrain position within canvas bounds
  const constrainPosition = useCallback((position: SLDPosition, componentSize: { width: number; height: number }): SLDPosition => {
    const bounds = calculateCanvasBounds();
    
    return {
      x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX - componentSize.width)),
      y: Math.max(bounds.minY, Math.min(position.y, bounds.maxY - componentSize.height))
    };
  }, [calculateCanvasBounds]);

  // Handle component selection
  const handleComponentClick = useCallback((componentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readonly) {
      setSelectedComponent(componentId);
    }
  }, [readonly]);

  // Handle component drag start
  const handleMouseDown = useCallback((componentId: string, event: React.MouseEvent) => {
    if (readonly) return;
    
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startPosition = {
      x: (event.clientX - rect.left) / zoom - pan.x,
      y: (event.clientY - rect.top) / zoom - pan.y
    };

    const component = diagram.components.find(c => c.id === componentId);
    if (!component) return;

    setDragState({
      isDragging: true,
      draggedComponent: componentId,
      startPosition,
      offset: {
        x: startPosition.x - component.position.x,
        y: startPosition.y - component.position.y
      }
    });
  }, [diagram.components, zoom, pan, readonly]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedComponent || readonly) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPosition = {
      x: (event.clientX - rect.left) / zoom - pan.x,
      y: (event.clientY - rect.top) / zoom - pan.y
    };

    let newPosition = {
      x: currentPosition.x - dragState.offset.x,
      y: currentPosition.y - dragState.offset.y
    };

    // Find the component being dragged to get its size
    const draggedComponent = diagram.components.find(c => c.id === dragState.draggedComponent);
    if (!draggedComponent) return;

    // Constrain position within canvas bounds
    newPosition = constrainPosition(newPosition, draggedComponent.size);

    // Snap to grid if enabled
    if (diagram.snapToGrid) {
      const gridSize = 20;
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
      
      // Re-constrain after snapping to ensure we're still within bounds
      newPosition = constrainPosition(newPosition, draggedComponent.size);
    }

    // Update component position
    const updatedDiagram = {
      ...diagram,
      components: diagram.components.map(component =>
        component.id === dragState.draggedComponent
          ? { ...component, position: newPosition }
          : component
      )
    };

    onDiagramChange(updatedDiagram);
  }, [dragState, zoom, pan, diagram, onDiagramChange, readonly, constrainPosition]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedComponent: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
  }, []);

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  // Fit canvas to screen
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current || diagram.components.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const bounds = calculateCanvasBounds();
    
    // Calculate zoom to fit all components with some padding
    const viewPadding = 50;
    const scaleX = (canvasRect.width - viewPadding * 2) / bounds.width;
    const scaleY = (canvasRect.height - viewPadding * 2) / bounds.height;
    const optimalZoom = Math.min(scaleX, scaleY, 2); // Cap at 200% zoom
    
    // Center the view on the components
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const canvasCenterX = canvasRect.width / 2 / optimalZoom;
    const canvasCenterY = canvasRect.height / 2 / optimalZoom;
    
    setZoom(optimalZoom);
    setPan({
      x: canvasCenterX - centerX,
      y: canvasCenterY - centerY
    });
  }, [diagram.components, calculateCanvasBounds]);

  // Reset view to origin
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom to fit selection or all components
  const handleZoomToFit = useCallback(() => {
    if (selectedComponent) {
      // Zoom to selected component
      const component = diagram.components.find(c => c.id === selectedComponent);
      if (!component || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const componentCenterX = component.position.x + component.size.width / 2;
      const componentCenterY = component.position.y + component.size.height / 2;
      
      const targetZoom = Math.min(
        canvasRect.width / (component.size.width + 200),
        canvasRect.height / (component.size.height + 200),
        2
      );
      
      setZoom(targetZoom);
      setPan({
        x: canvasRect.width / 2 / targetZoom - componentCenterX,
        y: canvasRect.height / 2 / targetZoom - componentCenterY
      });
    } else {
      // Fit all components
      handleFitToScreen();
    }
  }, [selectedComponent, diagram.components, handleFitToScreen]);

  // Auto-fit when components change significantly
  useEffect(() => {
    if (diagram.components.length > 0) {
      // Debounce the auto-fit to avoid excessive updates
      const timeoutId = setTimeout(() => {
        const bounds = calculateCanvasBounds();
        const isSignificantChange = 
          bounds.width !== DEFAULT_CANVAS_SIZE.width || 
          bounds.height !== DEFAULT_CANVAS_SIZE.height;
          
        if (isSignificantChange && canvasRef.current) {
          handleFitToScreen();
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [diagram.components.length, calculateCanvasBounds, handleFitToScreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (readonly) return;

      // Only handle shortcuts when canvas is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      if (isInputFocused) return;

      switch (event.key) {
        case 'f':
        case 'F':
          event.preventDefault();
          handleFitToScreen();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          handleResetView();
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleFitToScreen();
          }
          break;
        case '=':
        case '+':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomOut();
          }
          break;
        case 'Escape':
          event.preventDefault();
          setSelectedComponent(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [readonly, handleFitToScreen, handleResetView, handleZoomIn, handleZoomOut]);

  // Export diagram as SVG
  const handleExport = useCallback(() => {
    // This would export the diagram as SVG for high-quality printing
    console.log('Exporting diagram...');
  }, []);

  // Render electrical component
  const renderComponent = (component: SLDComponent) => {
    const isSelected = selectedComponent === component.id;
    const isDragged = dragState.draggedComponent === component.id;

    return (
      <div
        key={component.id}
        className={`absolute border-2 rounded cursor-move transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-white'
        } ${isDragged ? 'opacity-70' : ''}`}
        style={{
          left: component.position.x,
          top: component.position.y,
          width: component.size.width,
          height: component.size.height,
          transform: `rotate(${component.rotation}deg)`,
          zIndex: isSelected ? 10 : 1
        }}
        onClick={(e) => handleComponentClick(component.id, e)}
        onMouseDown={(e) => handleMouseDown(component.id, e)}
      >
        {renderComponentContent(component)}
        
        {/* Component labels */}
        {component.necLabels.map((label, index) => (
          <div
            key={index}
            className="absolute text-xs font-bold text-red-600 whitespace-nowrap"
            style={{
              top: -20 - (index * 12),
              left: 0,
              fontSize: '10px'
            }}
          >
            {label}
          </div>
        ))}
      </div>
    );
  };

  // Render component content based on type
  const renderComponentContent = (component: SLDComponent) => {
    const commonClasses = "w-full h-full flex items-center justify-center text-xs font-medium";
    
    switch (component.type) {
      case 'pv_array':
        return (
          <div className={`${commonClasses} bg-yellow-200 border border-yellow-400`}>
            <div className="text-center">
              <div>PV Array</div>
              <div className="text-xs">{(component as any).numStrings}S × {(component as any).modulesPerString}M</div>
            </div>
          </div>
        );
        
      case 'inverter':
        return (
          <div className={`${commonClasses} bg-blue-200 border border-blue-400 rounded-full`}>
            <div className="text-center">
              <div>INV</div>
              <div className="text-xs">{(component as any).acOutputKW}kW</div>
            </div>
          </div>
        );
        
      case 'dc_disconnect':
      case 'ac_disconnect':
        return (
          <div className={`${commonClasses} bg-red-200 border border-red-400`}>
            <div className="text-center">
              <div>DISC</div>
              <div className="text-xs">{(component as any).rating}</div>
            </div>
          </div>
        );
        
      case 'main_panel':
        return (
          <div className={`${commonClasses} bg-gray-200 border border-gray-400`}>
            <div className="text-center">
              <div>Main Panel</div>
              <div className="text-xs">{(component as any).rating}A</div>
            </div>
          </div>
        );
        
      case 'battery':
        return (
          <div className={`${commonClasses} bg-green-200 border border-green-400`}>
            <div className="text-center">
              <div>Battery</div>
              <div className="text-xs">{(component as any).capacityKWh}kWh</div>
            </div>
          </div>
        );
        
      case 'evse_charger':
        return (
          <div className={`${commonClasses} bg-purple-200 border border-purple-400`}>
            <div className="text-center">
              <div>EVSE</div>
              <div className="text-xs">{(component as any).powerKW}kW</div>
            </div>
          </div>
        );
        
      case 'grid':
        return (
          <div className={`${commonClasses} bg-orange-200 border border-orange-400`}>
            <div className="text-center">
              <div>GRID</div>
              <div className="text-xs">{(component as any).serviceVoltage}V</div>
            </div>
          </div>
        );
        
      case 'grounding_electrode':
        return (
          <div className={`${commonClasses} bg-brown-200 border border-brown-400 rounded-full`}>
            <div className="text-center">
              <div>⏚</div>
              <div className="text-xs">GND</div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className={`${commonClasses} bg-gray-100 border border-gray-300`}>
            <div className="text-center">
              <div>{component.type}</div>
              <div className="text-xs">{component.name}</div>
            </div>
          </div>
        );
    }
  };

  // Render connection line
  const renderConnection = (connection: SLDConnection) => {
    const fromComponent = diagram.components.find(c => c.id === connection.fromComponentId);
    const toComponent = diagram.components.find(c => c.id === connection.toComponentId);
    
    if (!fromComponent || !toComponent) return null;

    const fromCenter = {
      x: fromComponent.position.x + fromComponent.size.width / 2,
      y: fromComponent.position.y + fromComponent.size.height / 2
    };
    
    const toCenter = {
      x: toComponent.position.x + toComponent.size.width / 2,
      y: toComponent.position.y + toComponent.size.height / 2
    };

    const strokeColor = connection.wireType === 'dc' ? '#FF0000' : 
                       connection.wireType === 'ac' ? '#0000FF' : '#008000';
    const strokeDasharray = connection.wireType === 'ground' ? '5,5' : 'none';

    return (
      <line
        key={connection.id}
        x1={fromCenter.x}
        y1={fromCenter.y}
        x2={toCenter.x}
        y2={toCenter.y}
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray={strokeDasharray}
        markerEnd="url(#arrowhead)"
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded hover:bg-gray-100"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleZoomOut}
          className="p-2 rounded hover:bg-gray-100"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleFitToScreen}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Fit to Screen"
        >
          <Maximize className="h-4 w-4 mr-1 inline" />
          Fit
        </button>
        
        <button
          onClick={handleZoomToFit}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title={selectedComponent ? "Zoom to Selected" : "Zoom to Fit All"}
        >
          🎯
        </button>
        
        <button
          onClick={handleResetView}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Reset View (1:1)"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <button
          onClick={() => onDiagramChange({...diagram, gridEnabled: !diagram.gridEnabled})}
          className={`p-2 rounded hover:bg-gray-100 ${diagram.gridEnabled ? 'bg-blue-100' : ''}`}
          title="Toggle Grid"
        >
          <Grid className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Export"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Zoom: {Math.round(zoom * 100)}%
          </div>
          
          <div className="text-xs text-gray-500" title="Keyboard Shortcuts: F=Fit, R=Reset, Ctrl+0=Fit, Ctrl+±=Zoom, Esc=Deselect">
            💡 Shortcuts
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-white cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundImage: diagram.gridEnabled 
            ? `radial-gradient(circle, #ccc 1px, transparent 1px)`
            : 'none',
          backgroundSize: diagram.gridEnabled 
            ? `${20 * zoom}px ${20 * zoom}px`
            : 'auto',
          backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Canvas boundaries visualization */}
          {(() => {
            const bounds = calculateCanvasBounds();
            return (
              <div
                className="absolute border-2 border-dashed border-blue-300 bg-blue-50 bg-opacity-10 pointer-events-none"
                style={{
                  left: bounds.minX,
                  top: bounds.minY,
                  width: bounds.width,
                  height: bounds.height,
                  zIndex: -1
                }}
              >
                <div className="absolute top-2 left-2 text-xs text-blue-600 font-medium bg-white px-2 py-1 rounded">
                  Canvas: {bounds.width} × {bounds.height}
                </div>
              </div>
            );
          })()}

          {/* Connection lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#666"
                />
              </marker>
            </defs>
            {diagram.connections.map(renderConnection)}
          </svg>

          {/* Components */}
          {diagram.components.map(renderComponent)}

          {/* Labels */}
          {diagram.labels.map(label => (
            <div
              key={label.id}
              className="absolute pointer-events-none"
              style={{
                left: label.position.x,
                top: label.position.y,
                fontSize: label.fontSize,
                fontWeight: label.fontWeight,
                color: label.color,
                zIndex: 5
              }}
            >
              {label.text}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        <div>
          Components: {diagram.components.length} | 
          Connections: {diagram.connections.length} |
          NEC Compliant: {diagram.necCompliant ? '✓' : '✗'} |
          Canvas: {(() => {
            const bounds = calculateCanvasBounds();
            return `${bounds.width} × ${bounds.height}`;
          })()}
        </div>
        <div className="flex items-center gap-4">
          <div>
            Pan: ({Math.round(pan.x)}, {Math.round(pan.y)}) | 
            Zoom: {Math.round(zoom * 100)}%
          </div>
          <div>
            {selectedComponent && (
              <>Selected: {diagram.components.find(c => c.id === selectedComponent)?.name}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};