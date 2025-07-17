/**
 * Canvas Virtualization Hook
 * 
 * Manages large SLD diagrams with viewport culling and level-of-detail rendering
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { createComponentLogger } from '../services/loggingService';
import { SLDPerformanceService } from '../services/sldPerformanceService';
import type { SLDComponent, SLDConnection } from '../types/sld';
import type { ViewportState, VirtualizationConfig, VirtualizationMetrics } from '../types/virtualization';

const logger = createComponentLogger('useCanvasVirtualization');

const DEFAULT_CONFIG: VirtualizationConfig = {
  chunkSize: 1000,
  maxVisibleComponents: 500,
  enableLOD: true,
  enableWebGL: false,
  preloadRadius: 1
};

export function useCanvasVirtualization(
  components: SLDComponent[],
  connections: SLDConnection[],
  config: Partial<VirtualizationConfig> = {}
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const metricsRef = useRef<VirtualizationMetrics>({
    totalComponents: 0,
    visibleComponents: 0,
    totalChunks: 0,
    visibleChunks: 0,
    frameRate: 60,
    renderTime: 0,
    memoryUsage: 0
  });

  const virtualConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  const viewportRef = useRef<ViewportState>({
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    scale: 1.0
  });

  /**
   * Initialize virtualization system
   */
  const initializeVirtualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Initialize performance service
      SLDPerformanceService.initialize(canvas);
      
      // Set up initial viewport
      const rect = canvas.getBoundingClientRect();
      viewportRef.current = {
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
        scale: 1.0
      };

      SLDPerformanceService.updateViewport(viewportRef.current);
      
      logger.info('Canvas virtualization initialized', { 
        viewport: viewportRef.current,
        config: virtualConfig
      });
    } catch (error) {
      logger.error('Failed to initialize virtualization', { error });
    }
  }, [virtualConfig]);

  /**
   * Update viewport when pan/zoom changes
   */
  const updateViewport = useCallback((
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    scale: number
  ) => {
    viewportRef.current = { x, y, width, height, scale };
    SLDPerformanceService.updateViewport(viewportRef.current);
    
    logger.debug('Viewport updated', viewportRef.current);
  }, []);

  /**
   * Virtualize components into spatial chunks
   */
  const virtualizeComponents = useCallback(() => {
    SLDPerformanceService.virtualizeComponents(components, connections);
    
    metricsRef.current.totalComponents = components.length;
    metricsRef.current.totalChunks = SLDPerformanceService.getPerformanceMetrics().chunksTotal;
    
    logger.debug('Components virtualized', {
      components: components.length,
      connections: connections.length,
      chunks: metricsRef.current.totalChunks
    });
  }, [components, connections]);

  /**
   * Main render loop with virtualization
   */
  const renderFrame = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    try {
      // Render with LOD optimization
      SLDPerformanceService.renderOptimized(viewportRef.current.scale, deltaTime);
      
      // Update metrics
      const performanceMetrics = SLDPerformanceService.getPerformanceMetrics();
      metricsRef.current = {
        ...metricsRef.current,
        visibleComponents: performanceMetrics.visibleComponents,
        visibleChunks: performanceMetrics.chunksVisible,
        frameRate: performanceMetrics.frameRate,
        renderTime: performanceMetrics.renderTime,
        memoryUsage: performanceMetrics.memoryUsage
      };

    } catch (error) {
      logger.error('Render frame error', { error });
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, []);

  /**
   * Start render loop
   */
  const startRenderLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    lastFrameTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    
    logger.debug('Render loop started');
  }, [renderFrame]);

  /**
   * Stop render loop
   */
  const stopRenderLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    logger.debug('Render loop stopped');
  }, []);

  /**
   * Handle canvas resize
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Update canvas size for high DPI displays
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Update viewport
    updateViewport(
      viewportRef.current.x,
      viewportRef.current.y,
      rect.width,
      rect.height,
      viewportRef.current.scale
    );

    logger.debug('Canvas resized', { 
      width: rect.width, 
      height: rect.height, 
      dpr 
    });
  }, [updateViewport]);

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5.0, viewportRef.current.scale * scaleFactor));
    
    // Zoom to mouse position
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate new viewport position to zoom to mouse
    const worldX = viewportRef.current.x + mouseX / viewportRef.current.scale;
    const worldY = viewportRef.current.y + mouseY / viewportRef.current.scale;
    
    const newX = worldX - mouseX / newScale;
    const newY = worldY - mouseY / newScale;

    updateViewport(newX, newY, rect.width, rect.height, newScale);
  }, [updateViewport]);

  /**
   * Handle mouse dragging for panning
   */
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (event.buttons !== 1) return; // Only on left mouse button

    const movementX = event.movementX / viewportRef.current.scale;
    const movementY = event.movementY / viewportRef.current.scale;

    updateViewport(
      viewportRef.current.x - movementX,
      viewportRef.current.y - movementY,
      viewportRef.current.width,
      viewportRef.current.height,
      viewportRef.current.scale
    );
  }, [updateViewport]);

  /**
   * Convert screen coordinates to world coordinates
   */
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const viewport = viewportRef.current;
    return {
      x: viewport.x + screenX / viewport.scale,
      y: viewport.y + screenY / viewport.scale
    };
  }, []);

  /**
   * Convert world coordinates to screen coordinates
   */
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const viewport = viewportRef.current;
    return {
      x: (worldX - viewport.x) * viewport.scale,
      y: (worldY - viewport.y) * viewport.scale
    };
  }, []);

  /**
   * Check if world bounds are visible in viewport
   */
  const isVisible = useCallback((
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    const viewport = viewportRef.current;
    return !(
      bounds.x > viewport.x + viewport.width / viewport.scale ||
      bounds.x + bounds.width < viewport.x ||
      bounds.y > viewport.y + viewport.height / viewport.scale ||
      bounds.y + bounds.height < viewport.y
    );
  }, []);

  /**
   * Get currently visible components
   */
  const getVisibleComponents = useCallback(() => {
    return components.filter(component => {
      const bounds = {
        x: component.position.x - 50, // Component bounds estimate
        y: component.position.y - 50,
        width: 100,
        height: 100
      };
      return isVisible(bounds);
    });
  }, [components, isVisible]);

  /**
   * Focus viewport on specific component
   */
  const focusOnComponent = useCallback((componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    updateViewport(
      component.position.x - rect.width / (2 * viewportRef.current.scale),
      component.position.y - rect.height / (2 * viewportRef.current.scale),
      rect.width,
      rect.height,
      viewportRef.current.scale
    );

    logger.debug('Focused on component', { componentId, position: component.position });
  }, [components, updateViewport]);

  /**
   * Fit all components in viewport
   */
  const fitToComponents = useCallback(() => {
    if (components.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate bounding box of all components
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    components.forEach(component => {
      minX = Math.min(minX, component.position.x - 50);
      minY = Math.min(minY, component.position.y - 50);
      maxX = Math.max(maxX, component.position.x + 50);
      maxY = Math.max(maxY, component.position.y + 50);
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    const rect = canvas.getBoundingClientRect();

    // Calculate scale to fit with padding
    const scaleX = (rect.width * 0.9) / boundsWidth;
    const scaleY = (rect.height * 0.9) / boundsHeight;
    const scale = Math.min(scaleX, scaleY, 2.0); // Max scale of 2x

    // Center the bounds
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const viewX = centerX - rect.width / (2 * scale);
    const viewY = centerY - rect.height / (2 * scale);

    updateViewport(viewX, viewY, rect.width, rect.height, scale);

    logger.debug('Fit to components', { 
      bounds: { minX, minY, maxX, maxY },
      scale,
      center: { x: centerX, y: centerY }
    });
  }, [components, updateViewport]);

  // Initialize on mount
  useEffect(() => {
    initializeVirtualization();
    
    return () => {
      stopRenderLoop();
      SLDPerformanceService.cleanup();
    };
  }, [initializeVirtualization, stopRenderLoop]);

  // Virtualize components when they change
  useEffect(() => {
    virtualizeComponents();
  }, [virtualizeComponents]);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Initial resize
    handleResize();

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleWheel, handleMouseMove, handleResize]);

  // Auto-start render loop when components are available
  useEffect(() => {
    if (components.length > 0) {
      startRenderLoop();
    } else {
      stopRenderLoop();
    }
  }, [components.length, startRenderLoop, stopRenderLoop]);

  return {
    canvasRef,
    viewport: viewportRef.current,
    metrics: metricsRef.current,
    
    // Viewport controls
    updateViewport,
    screenToWorld,
    worldToScreen,
    isVisible,
    
    // Component utilities
    getVisibleComponents,
    focusOnComponent,
    fitToComponents,
    
    // Render controls
    startRenderLoop,
    stopRenderLoop,
    
    // Configuration
    config: virtualConfig
  };
}