import React, { useState, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Save, 
  Download, 
  Trash2, 
  Move,
  RotateCw,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSLDData } from '../../context/SLDDataContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import type { SLDComponent, SLDPosition } from '../../types/sld';

// Basic electrical component templates
const COMPONENT_TEMPLATES: Record<string, Omit<SLDComponent, 'id' | 'position'>> = {
  main_panel: {
    type: 'main_panel',
    name: 'Main Panel',
    symbol: '▦',
    width: 80,
    height: 120,
    properties: {
      rating: '200A',
      volts: 240,
      phase: 1,
      necReference: 'NEC 408.3'
    }
  },
  breaker: {
    type: 'breaker',
    name: 'Circuit Breaker',
    symbol: '⚡',
    width: 40,
    height: 20,
    properties: {
      rating: '20A',
      volts: 240,
      necReference: 'NEC 240.6'
    }
  },
  disconnect: {
    type: 'disconnect',
    name: 'Disconnect Switch',
    symbol: '⚹',
    width: 60,
    height: 40,
    properties: {
      rating: '30A',
      volts: 240,
      necReference: 'NEC 690.13'
    }
  },
  meter: {
    type: 'meter',
    name: 'Electric Meter',
    symbol: '◉',
    width: 60,
    height: 60,
    properties: {
      rating: '200A',
      volts: 240,
      necReference: 'NEC 230.66'
    }
  },
  inverter: {
    type: 'inverter',
    name: 'Solar Inverter',
    symbol: '〜',
    width: 80,
    height: 60,
    properties: {
      rating: '30A',
      volts: 240,
      necReference: 'NEC 690.8'
    }
  },
  evse: {
    type: 'evse',
    name: 'EVSE Charger',
    symbol: '🔌',
    width: 60,
    height: 80,
    properties: {
      rating: '50A',
      volts: 240,
      necReference: 'NEC 625.17'
    }
  }
};

export const SimpleSLDMain: React.FC = () => {
  const { state, addComponent, updateComponent, removeComponent, updateCanvasState, updateUIState } = useSLDData();
  const { loads } = useLoadData();
  const { settings } = useProjectSettings();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedComponent: string | null;
    startPosition: SLDPosition;
    offset: SLDPosition;
  }>({
    isDragging: false,
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  // Auto-generate basic diagram from load calculator data
  const generateDiagramFromLoads = useCallback(() => {
    if (!state.diagram) return;
    
    // Clear existing components
    state.diagram.components.forEach(comp => removeComponent(comp.id));
    
    let yPosition = 100;
    const xPosition = 200;
    
    // Add main panel
    const mainPanelId = `main-panel-${Date.now()}`;
    addComponent({
      ...COMPONENT_TEMPLATES.main_panel,
      id: mainPanelId,
      position: { x: xPosition, y: yPosition },
      properties: {
        ...COMPONENT_TEMPLATES.main_panel.properties,
        rating: `${settings.mainBreaker}A`
      }
    });
    yPosition += 150;
    
    // Add meter
    const meterId = `meter-${Date.now()}`;
    addComponent({
      ...COMPONENT_TEMPLATES.meter,
      id: meterId,
      position: { x: xPosition, y: yPosition },
      properties: {
        ...COMPONENT_TEMPLATES.meter.properties,
        rating: `${settings.mainBreaker}A`
      }
    });
    yPosition += 100;
    
    // Add EVSE components
    loads.evseLoads.forEach((evse, index) => {
      if (evse.quantity > 0) {
        addComponent({
          ...COMPONENT_TEMPLATES.evse,
          id: `evse-${evse.id}-${index}`,
          position: { x: xPosition + 150, y: yPosition },
          name: evse.name || 'EVSE Charger',
          properties: {
            ...COMPONENT_TEMPLATES.evse.properties,
            rating: `${evse.breaker}A`
          }
        });
        yPosition += 100;
      }
    });
    
    // Add solar inverters
    loads.solarBatteryLoads.forEach((solar, index) => {
      if (solar.kw > 0) {
        addComponent({
          ...COMPONENT_TEMPLATES.inverter,
          id: `solar-${solar.id}-${index}`,
          position: { x: xPosition - 150, y: yPosition },
          name: solar.name || 'Solar Inverter',
          properties: {
            ...COMPONENT_TEMPLATES.inverter.properties,
            rating: `${solar.breaker}A`,
            capacity: `${solar.kw}kW`
          }
        });
        yPosition += 100;
      }
    });
  }, [state.diagram, loads, settings, addComponent, removeComponent]);

  // Handle component drag
  const handleMouseDown = useCallback((componentId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const component = state.diagram?.components.find(c => c.id === componentId);
    if (!component) return;

    const startPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    setDragState({
      isDragging: true,
      draggedComponent: componentId,
      startPosition,
      offset: {
        x: startPosition.x - component.position.x,
        y: startPosition.y - component.position.y
      }
    });
  }, [state.diagram]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedComponent) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newPosition = {
      x: event.clientX - rect.left - dragState.offset.x,
      y: event.clientY - rect.top - dragState.offset.y
    };

    updateComponent(dragState.draggedComponent, { position: newPosition });
  }, [dragState, updateComponent]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedComponent: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
  }, []);

  // Add component from library
  const addComponentToCanvas = useCallback((type: keyof typeof COMPONENT_TEMPLATES) => {
    const template = COMPONENT_TEMPLATES[type];
    if (!template) return;

    const id = `${type}-${Date.now()}`;
    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };

    addComponent({
      ...template,
      id,
      position
    });
  }, [addComponent]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    updateCanvasState({ zoom: Math.min(state.canvasState.zoom * 1.2, 3) });
  }, [state.canvasState.zoom, updateCanvasState]);

  const handleZoomOut = useCallback(() => {
    updateCanvasState({ zoom: Math.max(state.canvasState.zoom / 1.2, 0.3) });
  }, [state.canvasState.zoom, updateCanvasState]);

  // Export diagram as image
  const exportDiagram = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !state.diagram) return;

    canvas.width = 800;
    canvas.height = 600;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid if enabled
    if (state.canvasState.gridEnabled) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      const gridSize = state.canvasState.gridSize;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    
    // Draw components
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';
    
    state.diagram.components.forEach(component => {
      const { x, y } = component.position;
      const { width, height } = component;
      
      // Draw component rectangle
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(x, y, width, height);
      
      // Draw symbol
      ctx.fillStyle = '#1f2937';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(component.symbol, x + width/2, y + height/2 + 8);
      
      // Draw name
      ctx.font = '12px Arial';
      ctx.fillText(component.name, x + width/2, y + height + 15);
      
      // Draw rating if available
      if (component.properties?.rating) {
        ctx.font = '10px Arial';
        ctx.fillText(component.properties.rating, x + width/2, y - 5);
      }
    });
    
    // Download the image
    const link = document.createElement('a');
    link.download = `${state.diagram.name || 'sld-diagram'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [state]);

  if (!state.diagram) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No SLD Diagram Available
          </h3>
          <p className="text-gray-500">
            Create a new diagram to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Single Line Diagram
            </h2>
            <button
              onClick={generateDiagramFromLoads}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Generate from Loads
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-12 text-center">
              {Math.round(state.canvasState.zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            {/* Grid Toggle */}
            <button
              onClick={() => updateCanvasState({ gridEnabled: !state.canvasState.gridEnabled })}
              className={`p-2 rounded-md ${
                state.canvasState.gridEnabled 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Grid"
            >
              <Grid className="h-4 w-4" />
            </button>
            
            {/* Export */}
            <button
              onClick={exportDiagram}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              title="Export Diagram"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Component Library */}
        {state.ui.showComponentLibrary && (
          <div className="w-64 bg-white border-r border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Component Library
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(COMPONENT_TEMPLATES).map(([type, template]) => (
                <button
                  key={type}
                  onClick={() => addComponentToCanvas(type as keyof typeof COMPONENT_TEMPLATES)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
                  title={template.name}
                >
                  <div className="text-2xl mb-1">{template.symbol}</div>
                  <div className="text-xs text-gray-600">{template.name}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => updateUIState({ showComponentLibrary: false })}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <EyeOff className="h-4 w-4" />
                Hide Library
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full cursor-move"
            style={{
              transform: `scale(${state.canvasState.zoom})`,
              transformOrigin: 'top left'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid */}
            {state.canvasState.gridEnabled && (
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${state.canvasState.gridSize}px ${state.canvasState.gridSize}px`
                }}
              />
            )}

            {/* Components */}
            {state.diagram.components.map(component => (
              <div
                key={component.id}
                className="absolute border-2 border-gray-400 bg-white cursor-move select-none shadow-sm hover:shadow-md transition-shadow"
                style={{
                  left: component.position.x,
                  top: component.position.y,
                  width: component.width,
                  height: component.height
                }}
                onMouseDown={(e) => handleMouseDown(component.id, e)}
              >
                {/* Component Symbol */}
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-2xl mb-1">{component.symbol}</div>
                  <div className="text-xs text-gray-600 text-center px-1">
                    {component.name}
                  </div>
                  {component.properties?.rating && (
                    <div className="text-xs font-mono text-blue-600">
                      {component.properties.rating}
                    </div>
                  )}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeComponent(component.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center"
                  title="Delete Component"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Show Component Library Toggle */}
          {!state.ui.showComponentLibrary && (
            <button
              onClick={() => updateUIState({ showComponentLibrary: true })}
              className="absolute top-4 left-4 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50"
              title="Show Component Library"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};