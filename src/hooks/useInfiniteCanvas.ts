import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CanvasTransforms, Easing } from '../utils/canvasTransforms';
import type { Transform, Point, Bounds, ViewPort, InfiniteCanvasOptions, InertiaState, TouchState } from '../types/canvas';

/**
 * Professional infinite canvas hook with advanced interaction features
 * Supports smooth animations, inertial scrolling, touch gestures, and performance optimization
 */
export const useInfiniteCanvas = (options: InfiniteCanvasOptions = {}) => {
  const {
    initialTransform = { x: 0, y: 0, zoom: 1 },
    minZoom = 0.01,
    maxZoom = 100,
    zoomSensitivity = 0.002,
    panSensitivity = 1,
    bounds,
    animationDuration = 300,
    enableInertia = true,
    inertiaDecay = 0.95,
    wheelZoomEnabled = true,
    touchZoomEnabled = true,
    constrainBounds = false
  } = options;

  // Core state
  const [transform, setTransform] = useState<Transform>(initialTransform);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Interaction state
  const dragStateRef = useRef<{
    start: Point;
    last: Point;
    velocity: Point;
    startTime: number;
    lastTime: number;
  } | null>(null);
  
  const inertiaRef = useRef<InertiaState | null>(null);
  const touchStateRef = useRef<TouchState | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    frameTime: 16.67,
    lastFrameTime: performance.now()
  });

  // Constrain transform to bounds and zoom limits
  const constrainTransform = useCallback((newTransform: Transform): Transform => {
    let constrainedTransform = {
      x: newTransform.x,
      y: newTransform.y,
      zoom: Math.max(minZoom, Math.min(maxZoom, newTransform.zoom))
    };

    // Apply bounds constraint if enabled
    if (constrainBounds && bounds && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewport = CanvasTransforms.calculateViewBox(constrainedTransform, {
        width: containerRect.width,
        height: containerRect.height
      });

      // Calculate the logical bounds that should be visible
      const minVisibleX = bounds.minX;
      const maxVisibleX = bounds.maxX - viewport.width;
      const minVisibleY = bounds.minY;
      const maxVisibleY = bounds.maxY - viewport.height;

      // Constrain the viewport to stay within bounds
      if (viewport.x < minVisibleX) {
        constrainedTransform.x += (minVisibleX - viewport.x) * constrainedTransform.zoom;
      }
      if (viewport.x > maxVisibleX) {
        constrainedTransform.x += (maxVisibleX - viewport.x) * constrainedTransform.zoom;
      }
      if (viewport.y < minVisibleY) {
        constrainedTransform.y += (minVisibleY - viewport.y) * constrainedTransform.zoom;
      }
      if (viewport.y > maxVisibleY) {
        constrainedTransform.y += (maxVisibleY - viewport.y) * constrainedTransform.zoom;
      }
    }

    return constrainedTransform;
  }, [minZoom, maxZoom, bounds, constrainBounds]);

  // Set transform with constraints and validation
  const setConstrainedTransform = useCallback((newTransform: Transform) => {
    const constrained = constrainTransform(newTransform);
    setTransform(constrained);
  }, [constrainTransform]);

  // Smooth animation system
  const animateToTransform = useCallback((
    targetTransform: Transform,
    duration: number = animationDuration,
    easing: (t: number) => number = Easing.easeOutCubic
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startTransform = transform;
      const startTime = performance.now();
      setIsAnimating(true);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        const currentTransform = CanvasTransforms.interpolateTransform(
          startTransform,
          targetTransform,
          easedProgress
        );

        setConstrainedTransform(currentTransform);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          animationFrameRef.current = null;
          resolve();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    });
  }, [transform, animationDuration, setConstrainedTransform]);

  // Inertial scrolling
  const startInertia = useCallback((velocity: Point) => {
    if (!enableInertia || (Math.abs(velocity.x) < 1 && Math.abs(velocity.y) < 1)) {
      return;
    }

    if (inertiaRef.current?.animationId) {
      cancelAnimationFrame(inertiaRef.current.animationId);
    }

    inertiaRef.current = {
      velocity,
      lastTime: performance.now(),
      animationId: null
    };

    const inertiaStep = (currentTime: number) => {
      if (!inertiaRef.current) return;

      const deltaTime = currentTime - inertiaRef.current.lastTime;
      const deltaX = inertiaRef.current.velocity.x * deltaTime * 0.001;
      const deltaY = inertiaRef.current.velocity.y * deltaTime * 0.001;

      const newTransform = CanvasTransforms.panByDelta(transform, deltaX, deltaY);
      setConstrainedTransform(newTransform);

      // Apply decay
      inertiaRef.current.velocity.x *= inertiaDecay;
      inertiaRef.current.velocity.y *= inertiaDecay;
      inertiaRef.current.lastTime = currentTime;

      // Continue if velocity is significant
      if (Math.abs(inertiaRef.current.velocity.x) > 0.1 || Math.abs(inertiaRef.current.velocity.y) > 0.1) {
        inertiaRef.current.animationId = requestAnimationFrame(inertiaStep);
      } else {
        inertiaRef.current = null;
      }
    };

    inertiaRef.current.animationId = requestAnimationFrame(inertiaStep);
  }, [enableInertia, inertiaDecay, transform, setConstrainedTransform]);

  // Mouse wheel handling with momentum and precision
  const handleWheel = useCallback((event: WheelEvent) => {
    if (!wheelZoomEnabled) return;

    event.preventDefault();

    // Stop any ongoing inertia
    if (inertiaRef.current?.animationId) {
      cancelAnimationFrame(inertiaRef.current.animationId);
      inertiaRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mousePos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Determine zoom or pan based on modifiers
    if (event.ctrlKey || event.metaKey) {
      // Zoom towards mouse
      const zoomDelta = -event.deltaY * zoomSensitivity;
      const newZoom = transform.zoom * (1 + zoomDelta);
      const targetTransform = CanvasTransforms.zoomToPoint(transform, mousePos, newZoom, rect);
      setConstrainedTransform(targetTransform);
    } else {
      // Pan with wheel
      const panDelta = {
        x: -event.deltaX * panSensitivity,
        y: -event.deltaY * panSensitivity
      };
      const newTransform = CanvasTransforms.panByDelta(transform, panDelta.x, panDelta.y);
      setConstrainedTransform(newTransform);
    }
  }, [wheelZoomEnabled, zoomSensitivity, panSensitivity, transform, setConstrainedTransform]);

  // Mouse interaction handlers
  const handleMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault();

    // Stop any ongoing animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      setIsAnimating(false);
    }
    if (inertiaRef.current?.animationId) {
      cancelAnimationFrame(inertiaRef.current.animationId);
      inertiaRef.current = null;
    }

    const startPos = { x: event.clientX, y: event.clientY };
    dragStateRef.current = {
      start: startPos,
      last: startPos,
      velocity: { x: 0, y: 0 },
      startTime: performance.now(),
      lastTime: performance.now()
    };

    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !dragStateRef.current) return;

    const currentPos = { x: event.clientX, y: event.clientY };
    const currentTime = performance.now();
    
    const deltaX = currentPos.x - dragStateRef.current.last.x;
    const deltaY = currentPos.y - dragStateRef.current.last.y;
    const deltaTime = currentTime - dragStateRef.current.lastTime;

    // Update velocity for inertia
    if (deltaTime > 0) {
      dragStateRef.current.velocity = {
        x: deltaX / deltaTime * 1000, // pixels per second
        y: deltaY / deltaTime * 1000
      };
    }

    // Apply pan
    const newTransform = CanvasTransforms.panByDelta(transform, deltaX, deltaY);
    setConstrainedTransform(newTransform);

    // Update drag state
    dragStateRef.current.last = currentPos;
    dragStateRef.current.lastTime = currentTime;
  }, [isDragging, transform, setConstrainedTransform]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStateRef.current) return;

    setIsDragging(false);

    // Start inertia if there's significant velocity
    if (enableInertia && dragStateRef.current.velocity) {
      startInertia(dragStateRef.current.velocity);
    }

    dragStateRef.current = null;
  }, [isDragging, enableInertia, startInertia]);

  // Touch handling for mobile devices
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!touchZoomEnabled) return;

    const touches = Array.from(event.touches);
    
    if (touches.length === 2) {
      // Pinch zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };

      touchStateRef.current = {
        touches,
        lastDistance: distance,
        lastCenter: center
      };
    }
  }, [touchZoomEnabled]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStateRef.current || event.touches.length !== 2) return;

    event.preventDefault();

    const touches = Array.from(event.touches);
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };

    // Calculate zoom
    const zoomFactor = distance / touchStateRef.current.lastDistance;
    const newZoom = transform.zoom * zoomFactor;

    // Calculate pan
    const panDelta = {
      x: center.x - touchStateRef.current.lastCenter.x,
      y: center.y - touchStateRef.current.lastCenter.y
    };

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const adjustedCenter = {
        x: center.x - rect.left,
        y: center.y - rect.top
      };
      
      let targetTransform = CanvasTransforms.zoomToPoint(transform, adjustedCenter, newZoom, rect);
      targetTransform = CanvasTransforms.panByDelta(targetTransform, panDelta.x, panDelta.y);
      
      setConstrainedTransform(targetTransform);
    }

    touchStateRef.current.lastDistance = distance;
    touchStateRef.current.lastCenter = center;
  }, [transform, setConstrainedTransform]);

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current = null;
  }, []);

  // Convenience methods
  const zoomTo = useCallback((zoom: number, center?: Point) => {
    const container = containerRef.current;
    if (!container) return Promise.resolve();

    const rect = container.getBoundingClientRect();
    const targetTransform = center 
      ? CanvasTransforms.zoomToPoint(transform, center, zoom, rect)
      : { ...transform, zoom };

    return animateToTransform(targetTransform);
  }, [transform, animateToTransform]);

  const zoomBy = useCallback((delta: number, center?: Point) => {
    return zoomTo(transform.zoom + delta, center);
  }, [transform.zoom, zoomTo]);

  const panTo = useCallback((x: number, y: number) => {
    return animateToTransform({ ...transform, x, y });
  }, [transform, animateToTransform]);

  const fitToViewport = useCallback((bounds: Bounds, padding: number = 50) => {
    const container = containerRef.current;
    if (!container) return Promise.resolve();

    const rect = container.getBoundingClientRect();
    const targetTransform = CanvasTransforms.fitBoundsToViewport(bounds, {
      width: rect.width,
      height: rect.height
    }, padding);

    return animateToTransform(targetTransform);
  }, [animateToTransform]);

  const reset = useCallback(() => {
    return animateToTransform(initialTransform);
  }, [initialTransform, animateToTransform]);

  // Utility functions
  const getViewBox = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0, width: 1200, height: 800 };

    const rect = container.getBoundingClientRect();
    return CanvasTransforms.calculateViewBox(transform, {
      width: rect.width,
      height: rect.height
    });
  }, [transform]);

  const screenToLogical = useCallback((screenPoint: Point) => {
    const container = containerRef.current;
    if (!container) return screenPoint;

    const rect = container.getBoundingClientRect();
    return CanvasTransforms.screenToLogical(screenPoint, transform, rect);
  }, [transform]);

  const logicalToScreen = useCallback((logicalPoint: Point) => {
    return CanvasTransforms.logicalToScreen(logicalPoint, transform);
  }, [transform]);

  // Event listener setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add event listeners
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

      // Clean up animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (inertiaRef.current?.animationId) {
        cancelAnimationFrame(inertiaRef.current.animationId);
      }
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, 
      handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    // State
    transform,
    isDragging,
    isAnimating,
    performanceMetrics,

    // Methods
    setTransform: setConstrainedTransform,
    zoomTo,
    zoomBy,
    panTo,
    fitToViewport,
    reset,
    animateToTransform,

    // Utilities
    getViewBox,
    screenToLogical,
    logicalToScreen,
    constrainTransform,

    // Refs
    containerRef
  };
};

export default useInfiniteCanvas;