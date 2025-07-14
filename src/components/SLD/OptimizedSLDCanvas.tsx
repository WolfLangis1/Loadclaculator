/**
 * Optimized SLD Canvas Component
 * 
 * High-performance canvas with virtualization, WebGL rendering, and LOD optimization
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useCanvasVirtualization } from '../../hooks/useCanvasVirtualization';
import { PerformanceMonitor } from './PerformanceMonitor';
import { createComponentLogger } from '../../services/loggingService';
import type { SLDDiagram, SLDComponent, SLDConnection } from '../../types/sld';

interface OptimizedSLDCanvasProps {
  diagram: SLDDiagram;
  onComponentSelect?: (component: SLDComponent) => void;
  onComponentMove?: (componentId: string, position: { x: number; y: number }) => void;
  onConnectionCreate?: (connection: Omit<SLDConnection, 'id'>) => void;
  className?: string;
  enablePerformanceMonitor?: boolean;
  enableWebGL?: boolean;
  maxVisibleComponents?: number;
  chunkSize?: number;
}

interface CanvasInteraction {
  mode: 'pan' | 'select' | 'move' | 'connect';
  selectedComponent?: SLDComponent;
  dragStart?: { x: number; y: number };
  dragOffset?: { x: number; y: number };
  connectionStart?: SLDComponent;
}

const logger = createComponentLogger('OptimizedSLDCanvas');

export const OptimizedSLDCanvas: React.FC<OptimizedSLDCanvasProps> = ({
  diagram,
  onComponentSelect,
  onComponentMove,
  onConnectionCreate,
  className = '',
  enablePerformanceMonitor = process.env.NODE_ENV === 'development',
  enableWebGL = true,
  maxVisibleComponents = 500,
  chunkSize = 1000
}) => {
  const [interaction, setInteraction] = useState<CanvasInteraction>({ mode: 'pan' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Canvas virtualization configuration
  const virtualizationConfig = useMemo(() => ({
    chunkSize,
    maxVisibleComponents,
    enableLOD: true,
    enableWebGL,
    preloadRadius: 1
  }), [chunkSize, maxVisibleComponents, enableWebGL]);

  // Initialize virtualization system
  const {
    canvasRef,
    viewport,
    metrics,
    updateViewport,
    screenToWorld,
    worldToScreen,
    isVisible,
    getVisibleComponents,
    focusOnComponent,
    fitToComponents,
    startRenderLoop,
    stopRenderLoop
  } = useCanvasVirtualization(
    diagram.components, 
    diagram.connections, 
    virtualizationConfig
  );

  /**
   * Initialize canvas and performance monitoring
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Set up canvas context
      const context = canvas.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
      }

      // Try WebGL if enabled
      if (enableWebGL) {
        const glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (glContext) {
          logger.info('WebGL context initialized for optimized rendering');
        }
      }

      setIsInitialized(true);
      logger.info('Optimized SLD Canvas initialized', { 
        components: diagram.components.length,
        connections: diagram.connections.length,
        webgl: enableWebGL
      });
    } catch (error) {
      logger.error('Failed to initialize canvas', { error });
    }
  }, [diagram.components.length, diagram.connections.length, enableWebGL]);

  /**
   * Auto-fit to components on initial load
   */
  useEffect(() => {
    if (isInitialized && diagram.components.length > 0) {
      setTimeout(() => {
        fitToComponents();
      }, 100); // Small delay to ensure canvas is ready
    }
  }, [isInitialized, diagram.components.length, fitToComponents]);

  /**
   * Handle mouse down events
   */
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    // Find component at mouse position
    const clickedComponent = diagram.components.find(component => {
      const distance = Math.sqrt(
        Math.pow(component.position.x - worldPos.x, 2) + 
        Math.pow(component.position.y - worldPos.y, 2)
      );
      return distance < 30; // 30px click tolerance
    });

    if (clickedComponent) {
      // Component interaction
      if (interaction.mode === 'select' || interaction.mode === 'move') {
        setInteraction({
          mode: 'move',
          selectedComponent: clickedComponent,
          dragStart: worldPos,
          dragOffset: {
            x: worldPos.x - clickedComponent.position.x,
            y: worldPos.y - clickedComponent.position.y
          }
        });
        onComponentSelect?.(clickedComponent);
      } else if (interaction.mode === 'connect') {
        if (interaction.connectionStart) {
          // Complete connection
          if (interaction.connectionStart.id !== clickedComponent.id) {
            const newConnection: Omit<SLDConnection, 'id'> = {
              fromComponentId: interaction.connectionStart.id,
              toComponentId: clickedComponent.id,
              startPoint: interaction.connectionStart.position,
              endPoint: clickedComponent.position,
              label: `${interaction.connectionStart.label} → ${clickedComponent.label}`,
              wireGauge: '12 AWG',
              conduitSize: '1/2\"'
            };
            onConnectionCreate?.(newConnection);
          }
          setInteraction({ mode: 'select' });
        } else {
          // Start connection
          setInteraction({
            mode: 'connect',
            connectionStart: clickedComponent
          });
        }
      }
    } else {
      // Canvas pan
      setInteraction({
        mode: 'pan',
        dragStart: worldPos
      });
    }
  }, [diagram.components, interaction, screenToWorld, onComponentSelect, onConnectionCreate]);

  /**
   * Handle mouse move events
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    if (interaction.mode === 'move' && interaction.selectedComponent && interaction.dragStart && interaction.dragOffset) {
      // Move component
      const newPosition = {
        x: worldPos.x - interaction.dragOffset.x,
        y: worldPos.y - interaction.dragOffset.y
      };
      
      onComponentMove?.(interaction.selectedComponent.id, newPosition);
    } else if (interaction.mode === 'pan' && interaction.dragStart && event.buttons === 1) {
      // Pan viewport
      const deltaX = worldPos.x - interaction.dragStart.x;
      const deltaY = worldPos.y - interaction.dragStart.y;
      
      updateViewport(
        viewport.x - deltaX,
        viewport.y - deltaY,
        viewport.width,
        viewport.height,
        viewport.scale
      );
    }
  }, [interaction, screenToWorld, onComponentMove, updateViewport, viewport]);

  /**
   * Handle mouse up events
   */
  const handleMouseUp = useCallback(() => {
    if (interaction.mode === 'move') {
      setInteraction({ mode: 'select' });
    } else if (interaction.mode === 'pan') {
      setInteraction({ mode: 'pan' });
    }
  }, [interaction.mode]);

  /**
   * Handle zoom with mouse wheel
   */
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5.0, viewport.scale * scaleFactor));
    
    // Zoom to mouse position
    const worldPos = screenToWorld(mouseX, mouseY);
    const newX = worldPos.x - mouseX / newScale;
    const newY = worldPos.y - mouseY / newScale;

    updateViewport(newX, newY, viewport.width, viewport.height, newScale);
  }, [viewport, screenToWorld, updateViewport]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          fitToComponents();
        }
        break;
      case 'r':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Reset viewport
          updateViewport(0, 0, viewport.width, viewport.height, 1.0);
        }
        break;
      case 'Escape':
        setInteraction({ mode: 'pan' });
        break;
      case 's':
        setInteraction({ mode: 'select' });
        break;
      case 'c':
        setInteraction({ mode: 'connect' });
        break;
    }
  }, [fitToComponents, updateViewport, viewport]);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Get cursor style based on interaction mode
   */
  const getCursorStyle = () => {
    switch (interaction.mode) {
      case 'pan': return 'grab';
      case 'select': return 'pointer';
      case 'move': return 'move';
      case 'connect': return 'crosshair';
      default: return 'default';
    }
  };

  /**
   * Render mode indicator
   */
  const ModeIndicator: React.FC = () => (
    <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-mono">
      Mode: {interaction.mode.toUpperCase()}
      {interaction.connectionStart && (
        <span className="ml-2 text-yellow-400">
          → Connect from {interaction.connectionStart.label}
        </span>
      )}
    </div>
  );

  /**
   * Render viewport info
   */
  const ViewportInfo: React.FC = () => (
    <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-xs font-mono">
      <div>Zoom: {(viewport.scale * 100).toFixed(0)}%</div>
      <div>Position: ({viewport.x.toFixed(0)}, {viewport.y.toFixed(0)})</div>
      <div>Visible: {metrics.visibleComponents}/{metrics.totalComponents}</div>
    </div>
  );

  /**
   * Render keyboard shortcuts help
   */
  const KeyboardHelp: React.FC = () => (
    <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-xs">
      <div>Shortcuts:</div>
      <div>Ctrl+F: Fit all • Ctrl+R: Reset view</div>
      <div>S: Select • C: Connect • Esc: Pan</div>
    </div>
  );

  return (
    <div className={`relative w-full h-full bg-gray-50 ${className}`}>
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Performance Monitor (Development) */}
      {enablePerformanceMonitor && (
        <PerformanceMonitor 
          position="top-right" 
          detailed={true}
        />
      )}

      {/* Mode Indicator */}
      <ModeIndicator />

      {/* Viewport Info */}
      <ViewportInfo />

      {/* Keyboard Help */}
      <KeyboardHelp />

      {/* Loading State */}
      {!isInitialized && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Initializing high-performance renderer...</div>
          </div>
        </div>
      )}

      {/* Debug Info (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 px-3 py-1 rounded text-xs">
          <strong>DEV MODE:</strong> Performance optimizations active
          {enableWebGL && <span className="ml-2 text-green-600">WebGL ✓</span>}
        </div>
      )}
    </div>
  );
};

export default OptimizedSLDCanvas;