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
  EyeOff,
  Layers
} from 'lucide-react';
import { useSLDData } from '../../context/SLDDataContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { EnhancedComponentLibrary } from './EnhancedComponentLibrary';
import { IEEESymbolRenderer } from './IEEESymbolsSimple';
import { LayerManager, DEFAULT_LAYERS, type DrawingLayer } from './LayerManager';
import { CanvasTools, type CanvasTool } from './CanvasTools';
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

  // Layer management state
  const [layers, setLayers] = useState<DrawingLayer[]>(() => 
    DEFAULT_LAYERS.map((layer, index) => ({
      ...layer,
      id: `layer-${index}`,
      componentIds: []
    }))
  );
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0]?.id || '');

  // Canvas tools state
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Layer management functions
  const handleLayerUpdate = useCallback((layerId: string, updates: Partial<DrawingLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  const handleLayerAdd = useCallback((newLayer: Omit<DrawingLayer, 'id'>) => {
    const id = `layer-${Date.now()}`;
    setLayers(prev => [...prev, { ...newLayer, id }]);
  }, []);

  const handleLayerDelete = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (activeLayerId === layerId) {
      setActiveLayerId(layers[0]?.id || '');
    }
  }, [activeLayerId, layers]);

  const handleLayerReorder = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const newLayers = [...prev];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return newLayers;
    });
  }, []);

  // Canvas tool handlers
  const handleZoomChange = useCallback((zoom: number) => {
    updateCanvasState({ zoom });
  }, [updateCanvasState]);

  const handleZoomFit = useCallback(() => {
    // Calculate bounds of all components
    if (!state.diagram?.components.length) return;
    
    const components = state.diagram.components;
    const minX = Math.min(...components.map(c => c.position.x));
    const maxX = Math.max(...components.map(c => c.position.x + c.width));
    const minY = Math.min(...components.map(c => c.position.y));
    const maxY = Math.max(...components.map(c => c.position.y + c.height));
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;
    const zoomX = (canvasRect.width - 100) / diagramWidth;
    const zoomY = (canvasRect.height - 100) / diagramHeight;
    const newZoom = Math.min(zoomX, zoomY, 3);
    
    updateCanvasState({ zoom: newZoom });
  }, [state.diagram, updateCanvasState]);

  const handleZoomReset = useCallback(() => {
    updateCanvasState({ zoom: 1 });
  }, [updateCanvasState]);

  const handleDeleteSelected = useCallback(() => {
    selectedComponents.forEach(componentId => {
      removeComponent(componentId);
    });
    setSelectedComponents([]);
  }, [selectedComponents, removeComponent]);

  const handleCopySelected = useCallback(() => {
    if (!state.diagram) return;
    
    const componentsToCopy = state.diagram.components.filter(c => 
      selectedComponents.includes(c.id)
    );
    
    componentsToCopy.forEach(component => {
      const id = `${component.type}-copy-${Date.now()}`;
      addComponent({
        ...component,
        id,
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20
        }
      });
    });
  }, [selectedComponents, state.diagram, addComponent]);

  const handleRotateSelected = useCallback(() => {
    selectedComponents.forEach(componentId => {
      const component = state.diagram?.components.find(c => c.id === componentId);
      if (component) {
        // Simple 90-degree rotation by swapping width/height
        updateComponent(componentId, {
          width: component.height,
          height: component.width
        });
      }
    });
  }, [selectedComponents, state.diagram, updateComponent]);

  const handleGridToggle = useCallback(() => {
    updateCanvasState({ gridEnabled: !state.canvasState.gridEnabled });
  }, [state.canvasState.gridEnabled, updateCanvasState]);

  const handleSnapToggle = useCallback(() => {
    setSnapToGrid(prev => !prev);
  }, []);

  // Handle canvas click for deselecting
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setSelectedComponents([]);
    }
  }, []);

  // Assign new components to active layer
  const assignComponentToLayer = useCallback((componentId: string) => {
    if (activeLayerId) {
      setLayers(prev => prev.map(layer => {
        if (layer.id === activeLayerId) {
          return {
            ...layer,
            componentIds: [...layer.componentIds, componentId]
          };
        }
        return layer;
      }));
    }
  }, [activeLayerId]);

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

  // Handle component selection and interaction
  const handleComponentClick = useCallback((componentId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (activeTool === 'select') {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        setSelectedComponents(prev => 
          prev.includes(componentId) 
            ? prev.filter(id => id !== componentId)
            : [...prev, componentId]
        );
      } else {
        // Single select
        setSelectedComponents([componentId]);
      }
    }
  }, [activeTool]);

  // Handle component drag
  const handleMouseDown = useCallback((componentId: string, event: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const component = state.diagram?.components.find(c => c.id === componentId);
    if (!component) return;

    // Check if component's layer is locked
    const componentLayer = layers.find(layer => layer.componentIds.includes(componentId));
    if (componentLayer?.locked) return;

    const startPosition = {
      x: (event.clientX - rect.left) / state.canvasState.zoom,
      y: (event.clientY - rect.top) / state.canvasState.zoom
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

    // Select component if not already selected
    if (!selectedComponents.includes(componentId)) {
      setSelectedComponents([componentId]);
    }
  }, [activeTool, state.diagram, state.canvasState.zoom, layers, selectedComponents]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedComponent) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let newPosition = {
      x: (event.clientX - rect.left) / state.canvasState.zoom - dragState.offset.x,
      y: (event.clientY - rect.top) / state.canvasState.zoom - dragState.offset.y
    };

    // Snap to grid if enabled
    if (snapToGrid) {
      const gridSize = state.canvasState.gridSize;
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
    }

    updateComponent(dragState.draggedComponent, { position: newPosition });
  }, [dragState, updateComponent, state.canvasState.zoom, state.canvasState.gridSize, snapToGrid]);

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

    // Assign to active layer
    assignComponentToLayer(id);
  }, [addComponent, assignComponentToLayer]);

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
        {/* Layer Manager */}
        <LayerManager
          layers={layers}
          onLayerUpdate={handleLayerUpdate}
          onLayerAdd={handleLayerAdd}
          onLayerDelete={handleLayerDelete}
          onLayerReorder={handleLayerReorder}
          activeLayerId={activeLayerId}
          onActiveLayerChange={setActiveLayerId}
        />

        {/* Enhanced Component Library */}
        <EnhancedComponentLibrary />

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas Tools */}
          <div className="absolute top-4 right-4 z-10">
            <CanvasTools
              activeTool={activeTool}
              onToolChange={setActiveTool}
              zoom={state.canvasState.zoom}
              onZoomChange={handleZoomChange}
              onZoomFit={handleZoomFit}
              onZoomReset={handleZoomReset}
              selectedComponents={selectedComponents}
              onDeleteSelected={handleDeleteSelected}
              onCopySelected={handleCopySelected}
              onRotateSelected={handleRotateSelected}
              gridEnabled={state.canvasState.gridEnabled}
              onGridToggle={handleGridToggle}
              snapToGrid={snapToGrid}
              onSnapToggle={handleSnapToggle}
            />
          </div>
          <div
            ref={canvasRef}
            className={`w-full h-full ${
              activeTool === 'pan' ? 'cursor-grab' : 
              activeTool === 'zoom_in' ? 'cursor-zoom-in' :
              activeTool === 'zoom_out' ? 'cursor-zoom-out' :
              'cursor-default'
            }`}
            style={{
              transform: `scale(${state.canvasState.zoom})`,
              transformOrigin: 'top left'
            }}
            onClick={handleCanvasClick}
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
                className={`absolute border-2 bg-white select-none shadow-sm hover:shadow-md transition-all ${
                  selectedComponents.includes(component.id) 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-400'
                } ${
                  activeTool === 'select' ? 'cursor-move' : 'cursor-pointer'
                }`}
                style={{
                  left: component.position.x,
                  top: component.position.y,
                  width: component.width,
                  height: component.height,
                  opacity: layers.find(l => l.componentIds.includes(component.id))?.opacity || 1
                }}
                onClick={(e) => handleComponentClick(component.id, e)}
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
                    // Remove from all layers
                    setLayers(prev => prev.map(layer => ({
                      ...layer,
                      componentIds: layer.componentIds.filter(id => id !== component.id)
                    })));
                    // Remove from selection
                    setSelectedComponents(prev => prev.filter(id => id !== component.id));
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center"
                  title="Delete Component"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};