import { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasTransforms, Easing } from '../utils/canvasTransforms';
import type { Transform, Point, Bounds } from '../utils/canvasTransforms';

interface UseCanvasTransformOptions {
  initialTransform?: Transform;
  minZoom?: number;
  maxZoom?: number;
  zoomSensitivity?: number;
  bounds?: Bounds;
  animationDuration?: number;
}

interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  startTransform: Transform;
  targetTransform: Transform;
  duration: number;
  easing: (t: number) => number;
}

/**
 * Professional canvas transform hook with smooth animations and constraints
 */
export const useCanvasTransform = (options: UseCanvasTransformOptions = {}) => {
  const {
    initialTransform = { x: 0, y: 0, zoom: 1 },
    minZoom = 0.1,
    maxZoom = 10,
    zoomSensitivity = 0.001,
    bounds,
    animationDuration = 300
  } = options;

  const [transform, setTransform] = useState<Transform>(initialTransform);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  const animationRef = useRef<AnimationState | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!animationRef.current) return;

    const { startTime, startTransform, targetTransform, duration, easing } = animationRef.current;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const currentTransform = CanvasTransforms.interpolateTransform(
      startTransform,
      targetTransform,
      easedProgress
    );

    setTransform(currentTransform);

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
      animationFrameRef.current = null;
    }
  }, []);

  // Start animation to target transform
  const animateToTransform = useCallback((
    targetTransform: Transform,
    duration: number = animationDuration,
    easing: (t: number) => number = Easing.easeOutCubic
  ) => {
    // Cancel existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Constrain target transform
    const constrainedTarget = CanvasTransforms.constrainTransform(targetTransform, {
      minZoom,
      maxZoom,
      bounds
    });

    animationRef.current = {
      isAnimating: true,
      startTime: performance.now(),
      startTransform: transform,
      targetTransform: constrainedTarget,
      duration,
      easing
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [transform, minZoom, maxZoom, bounds, animationDuration, animate]);

  // Set transform with constraints
  const setConstrainedTransform = useCallback((newTransform: Transform) => {
    const constrainedTransform = CanvasTransforms.constrainTransform(newTransform, {
      minZoom,
      maxZoom,
      bounds
    });
    setTransform(constrainedTransform);
  }, [minZoom, maxZoom, bounds]);

  // Zoom to specific level
  const zoomTo = useCallback((zoom: number, center?: Point, containerBounds?: DOMRect) => {
    let targetTransform: Transform;

    if (center && containerBounds) {
      targetTransform = CanvasTransforms.zoomToPoint(transform, center, zoom, containerBounds);
    } else {
      targetTransform = { ...transform, zoom };
    }

    animateToTransform(targetTransform);
  }, [transform, animateToTransform]);

  // Zoom by delta
  const zoomBy = useCallback((delta: number, center?: Point, containerBounds?: DOMRect) => {
    const newZoom = transform.zoom + delta;
    zoomTo(newZoom, center, containerBounds);
  }, [transform.zoom, zoomTo]);

  // Pan to specific position
  const panTo = useCallback((x: number, y: number) => {
    const targetTransform = { ...transform, x, y };
    animateToTransform(targetTransform);
  }, [transform, animateToTransform]);

  // Pan by delta
  const panBy = useCallback((deltaX: number, deltaY: number) => {
    const targetTransform = CanvasTransforms.panByDelta(transform, deltaX, deltaY);
    animateToTransform(targetTransform, 100, Easing.linear); // Fast pan animation
  }, [transform, animateToTransform]);

  // Fit bounds to viewport
  const fitToViewport = useCallback((
    targetBounds: Bounds,
    containerSize: { width: number; height: number },
    padding: number = 50
  ) => {
    const targetTransform = CanvasTransforms.fitBoundsToViewport(
      targetBounds,
      containerSize,
      padding
    );
    animateToTransform(targetTransform, 500, Easing.easeInOutCubic);
  }, [animateToTransform]);

  // Reset to initial transform
  const reset = useCallback(() => {
    animateToTransform(initialTransform);
  }, [initialTransform, animateToTransform]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((
    event: React.WheelEvent,
    containerBounds: DOMRect
  ) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      const delta = -event.deltaY * zoomSensitivity;
      const center = { x: event.clientX, y: event.clientY };
      
      zoomBy(delta, center, containerBounds);
    }
  }, [zoomBy, zoomSensitivity]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 1 || (event.button === 0 && event.altKey)) { // Middle mouse or Alt+click
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, []);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      
      const newTransform = CanvasTransforms.panByDelta(transform, deltaX, deltaY);
      setConstrainedTransform(newTransform);
      
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, [isDragging, dragStart, transform, setConstrainedTransform]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Get visible bounds
  const getVisibleBounds = useCallback((containerSize: { width: number; height: number }) => {
    return CanvasTransforms.getVisibleBounds(transform, containerSize);
  }, [transform]);

  // Convert coordinates
  const screenToLogical = useCallback((
    screenPoint: Point,
    containerBounds: DOMRect
  ) => {
    return CanvasTransforms.screenToLogical(screenPoint, transform, containerBounds);
  }, [transform]);

  const logicalToScreen = useCallback((logicalPoint: Point) => {
    return CanvasTransforms.logicalToScreen(logicalPoint, transform);
  }, [transform]);

  // Calculate viewBox
  const getViewBox = useCallback((containerSize: { width: number; height: number }) => {
    return CanvasTransforms.calculateViewBox(transform, containerSize);
  }, [transform]);

  // Snap to grid
  const snapToGrid = useCallback((point: Point, gridSize: number, enabled: boolean = true) => {
    return CanvasTransforms.snapToGrid(point, gridSize, enabled);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // Current state
    transform,
    isDragging,
    isAnimating: !!animationRef.current,

    // Transform controls
    setTransform: setConstrainedTransform,
    zoomTo,
    zoomBy,
    panTo,
    panBy,
    fitToViewport,
    reset,

    // Event handlers
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    // Utility functions
    getVisibleBounds,
    screenToLogical,
    logicalToScreen,
    getViewBox,
    snapToGrid,

    // Advanced controls
    animateToTransform
  };
};

export default useCanvasTransform;