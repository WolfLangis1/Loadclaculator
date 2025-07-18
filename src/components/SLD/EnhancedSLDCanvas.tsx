/**
 * Enhanced SLD Canvas with WebGL Rendering
 * 
 * Professional-grade canvas with WebGL rendering, viewport management, and layer system
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { WebGLRenderer, RenderObject, RenderStats } from './engine/WebGLRenderer';
import { ViewportManager, ViewportState, ViewportBounds } from './engine/ViewportManager';
import { LayerSystem, Layer, LayerObject } from './engine/LayerSystem';
import type { SLDDiagram, SLDComponent, SLDConnection } from '../../types/sld';

interface EnhancedSLDCanvasProps {
  diagram: SLDDiagram;
  onDiagramChange: (diagram: SLDDiagram) => void;
  readonly?: boolean;
  showGrid?: boolean;
  gridSize?: number;
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface CanvasState {
  isInitialized: boolean;
  isRendering: boolean;
  renderStats: RenderStats;
  viewport: ViewportState;
  layers: Layer[];
  activeLayerId: string | null;
}

export const EnhancedSLDCanvas: React.FC<EnhancedSLDCanvasProps> = ({
  diagram,
  onDiagramChange,
  readonly = false,
  showGrid = true,
  gridSize = 20,
  onSelectionChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Engine instances
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const viewportManagerRef = useRef<ViewportManager | null>(null);
  const layerSystemRef = useRef<LayerSystem | null>(null);
  
  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    isInitialized: false,
    isRendering: false,
    renderStats: {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0,
      renderTime: 0,
      fps: 60
    },
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
      width: 800,
      height: 600
    },
    layers: [],
    activeLayerId: null
  });

  // Initialize canvas engines
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Set canvas size
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Initialize WebGL renderer
      const renderer = new WebGLRenderer(canvas);
      rendererRef.current = renderer;

      // Initialize viewport manager
      const viewportManager = new ViewportManager({
        x: 0,
        y: 0,
        zoom: 1,
        width: rect.width,
        height: rect.height
      });
      viewportManagerRef.current = viewportManager;

      // Initialize layer system
      const layerSystem = new LayerSystem();
      layerSystemRef.current = layerSystem;

      // Set up event callbacks
      viewportManager.setViewportChangeCallback((viewport) => {
        renderer.setViewport(viewport);
        setCanvasState(prev => ({ ...prev, viewport }));
      });

      layerSystem.setLayerChangeCallback((layers) => {
        setCanvasState(prev => ({ ...prev, layers }));
      });

      layerSystem.setActiveLayerChangeCallback((activeLayerId) => {
        setCanvasState(prev => ({ ...prev, activeLayerId }));
      });

      // Start render loop
      renderer.startRenderLoop();

      setCanvasState(prev => ({ ...prev, isInitialized: true }));

    } catch (error) {
      console.error('Failed to initialize enhanced canvas:', error);
    }
  }, []);

  // Convert diagram data to render objects
  const updateRenderObjects = useCallback(() => {
    const renderer = rendererRef.current;
    const layerSystem = layerSystemRef.current;
    
    if (!renderer || !layerSystem) return;

    // Clear existing render objects
    renderer.clearRenderObjects();

    // Add grid if enabled
    if (showGrid) {
      const gridObject: RenderObject = {
        id: 'grid',
        type: 'grid',
        bounds: { x: -1000, y: -1000, width: 2000, height: 2000 },
        visible: true,
        zIndex: 0,
        data: { size: gridSize }
      };
      renderer.addRenderObject(gridObject);
      
      const gridLayerObject: LayerObject = {
        id: 'grid',
        layerId: 'grid',
        type: 'grid',
        data: { size: gridSize }
      };
      layerSystem.addObject(gridLayerObject);
    }

    // Add components
    diagram.components.forEach(component => {
      const renderObject: RenderObject = {
        id: component.id,
        type: 'component',
        bounds: {
          x: component.position.x,
          y: component.position.y,
          width: component.size?.width || 100,
          height: component.size?.height || 60
        },
        visible: true,
        zIndex: 20,
        data: component
      };
      renderer.addRenderObject(renderObject);

      const layerObject: LayerObject = {
        id: component.id,
        layerId: 'components',
        type: 'component',
        data: component
      };
      layerSystem.addObject(layerObject);
    });

    // Add connections
    diagram.connections.forEach(connection => {
      const fromComponent = diagram.components.find(c => c.id === connection.fromComponentId);
      const toComponent = diagram.components.find(c => c.id === connection.toComponentId);
      
      if (fromComponent && toComponent) {
        const bounds = {
          x: Math.min(fromComponent.position.x, toComponent.position.x),
          y: Math.min(fromComponent.position.y, toComponent.position.y),
          width: Math.abs(toComponent.position.x - fromComponent.position.x) + 100,
          height: Math.abs(toComponent.position.y - fromComponent.position.y) + 60
        };

        const renderObject: RenderObject = {
          id: connection.id,
          type: 'connection',
          bounds,
          visible: true,
          zIndex: 10,
          data: connection
        };
        renderer.addRenderObject(renderObject);

        const layerObject: LayerObject = {
          id: connection.id,
          layerId: 'connections',
          type: 'connection',
          data: connection
        };
        layerSystem.addObject(layerObject);
      }
    });

    // Add labels
    diagram.labels?.forEach(label => {
      const renderObject: RenderObject = {
        id: label.id,
        type: 'label',
        bounds: {
          x: label.position.x,
          y: label.position.y,
          width: 100, // Estimated width
          height: 20  // Estimated height
        },
        visible: true,
        zIndex: 30,
        data: label
      };
      renderer.addRenderObject(renderObject);

      const layerObject: LayerObject = {
        id: label.id,
        layerId: 'labels',
        type: 'label',
        data: label
      };
      layerSystem.addObject(layerObject);
    });

  }, [diagram, showGrid, gridSize]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || !viewportManagerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    viewportManagerRef.current.updateSize(rect.width, rect.height);
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!viewportManagerRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      // Middle mouse or Alt+Left mouse for panning
      viewportManagerRef.current.startPan(point);
      event.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!viewportManagerRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    viewportManagerRef.current.updatePan(point);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!viewportManagerRef.current) return;
    viewportManagerRef.current.endPan();
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!viewportManagerRef.current) return;

    event.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    viewportManagerRef.current.zoom(zoomFactor, point);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!viewportManagerRef.current) return;

    // Only handle shortcuts when canvas is focused
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== canvasRef.current) return;

    switch (event.key) {
      case 'f':
      case 'F':
        event.preventDefault();
        // Fit to diagram bounds
        if (diagram.components.length > 0) {
          const bounds = calculateDiagramBounds();
          viewportManagerRef.current.zoomToFit(bounds, 50);
        }
        break;
      
      case 'r':
      case 'R':
        event.preventDefault();
        viewportManagerRef.current.reset();
        break;
      
      case '0':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (diagram.components.length > 0) {
            const bounds = calculateDiagramBounds();
            viewportManagerRef.current.zoomToFit(bounds, 50);
          }
        }
        break;
      
      case '=':
      case '+':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          viewportManagerRef.current.zoomIn();
        }
        break;
      
      case '-':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          viewportManagerRef.current.zoomOut();
        }
        break;
    }
  }, [diagram.components]);

  // Calculate diagram bounds
  const calculateDiagramBounds = useCallback((): ViewportBounds => {
    if (diagram.components.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    diagram.components.forEach(component => {
      const left = component.position.x;
      const top = component.position.y;
      const right = left + (component.size?.width || 100);
      const bottom = top + (component.size?.height || 60);

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [diagram.components]);

  // Update render stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (rendererRef.current) {
        const stats = rendererRef.current.getStats();
        setCanvasState(prev => ({ ...prev, renderStats: stats }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize canvas on mount
  useEffect(() => {
    initializeCanvas();

    return () => {
      // Cleanup
      rendererRef.current?.dispose();
      viewportManagerRef.current?.dispose();
      layerSystemRef.current?.dispose();
    };
  }, [initializeCanvas]);

  // Update render objects when diagram changes
  useEffect(() => {
    if (canvasState.isInitialized) {
      updateRenderObjects();
    }
  }, [diagram, canvasState.isInitialized, updateRenderObjects]);

  // Set up resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [handleResize]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Toolbar controls
  const handleZoomIn = useCallback(() => {
    viewportManagerRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    viewportManagerRef.current?.zoomOut();
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (diagram.components.length > 0) {
      const bounds = calculateDiagramBounds();
      viewportManagerRef.current?.zoomToFit(bounds, 50);
    }
  }, [diagram.components, calculateDiagramBounds]);

  const handleResetView = useCallback(() => {
    viewportManagerRef.current?.reset();
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
        <button
          onClick={handleZoomIn}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Zoom In (Ctrl/Cmd + +)"
        >
          🔍+
        </button>
        
        <button
          onClick={handleZoomOut}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Zoom Out (Ctrl/Cmd + -)"
        >
          🔍-
        </button>
        
        <button
          onClick={handleFitToScreen}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Fit to Screen (F or Ctrl/Cmd + 0)"
        >
          📐 Fit
        </button>
        
        <button
          onClick={handleResetView}
          className="px-3 py-2 text-sm rounded hover:bg-gray-100"
          title="Reset View (R)"
        >
          🔄 Reset
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <div className="text-sm text-gray-600">
          Zoom: {Math.round(canvasState.viewport.zoom * 100)}%
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="text-xs text-gray-500">
            FPS: {Math.round(canvasState.renderStats.fps)}
          </div>
          <div className="text-xs text-gray-500">
            Objects: {canvasState.renderStats.visibleObjects}/{canvasState.renderStats.totalObjects}
          </div>
          <div className="text-xs text-gray-500" title="Render time in milliseconds">
            Render: {canvasState.renderStats.renderTime.toFixed(1)}ms
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-white"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          tabIndex={0}
        />
        
        {/* Loading overlay */}
        {!canvasState.isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Initializing WebGL Canvas...</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Components: {diagram.components.length}</span>
          <span>Connections: {diagram.connections.length}</span>
          <span>Layers: {canvasState.layers.length}</span>
          {canvasState.activeLayerId && (
            <span>Active: {canvasState.layers.find(l => l.id === canvasState.activeLayerId)?.name}</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span>
            Viewport: ({Math.round(canvasState.viewport.x)}, {Math.round(canvasState.viewport.y)})
          </span>
          <span>WebGL Enabled</span>
          <span className="text-green-600">●</span>
        </div>
      </div>
    </div>
  );
};