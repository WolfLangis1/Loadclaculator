// Professional Canvas Transform Utilities
// Provides mathematical functions for SVG transformations, coordinate conversions, and viewport management

export interface Transform {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ViewPort {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Canvas Transform Utilities for Professional SLD
 */
export class CanvasTransforms {
  /**
   * Convert screen coordinates to logical canvas coordinates
   */
  static screenToLogical(
    screenPoint: Point,
    transform: Transform,
    containerBounds: DOMRect
  ): Point {
    const x = (screenPoint.x - containerBounds.left - transform.x) / transform.zoom;
    const y = (screenPoint.y - containerBounds.top - transform.y) / transform.zoom;
    return { x, y };
  }

  /**
   * Convert logical canvas coordinates to screen coordinates
   */
  static logicalToScreen(
    logicalPoint: Point,
    transform: Transform
  ): Point {
    const x = logicalPoint.x * transform.zoom + transform.x;
    const y = logicalPoint.y * transform.zoom + transform.y;
    return { x, y };
  }

  /**
   * Calculate SVG viewBox for given transform and container
   */
  static calculateViewBox(
    transform: Transform,
    containerSize: { width: number; height: number }
  ): ViewPort {
    const width = containerSize.width / transform.zoom;
    const height = containerSize.height / transform.zoom;
    const x = -transform.x / transform.zoom;
    const y = -transform.y / transform.zoom;
    
    return { x, y, width, height };
  }

  /**
   * Zoom towards a specific point (mouse position)
   */
  static zoomToPoint(
    currentTransform: Transform,
    zoomCenter: Point,
    newZoom: number,
    containerBounds: DOMRect
  ): Transform {
    const zoomFactor = newZoom / currentTransform.zoom;
    
    // Convert zoom center to logical coordinates
    const logicalCenter = this.screenToLogical(zoomCenter, currentTransform, containerBounds);
    
    // Calculate new pan to keep the zoom center point stationary
    const newX = zoomCenter.x - logicalCenter.x * newZoom;
    const newY = zoomCenter.y - logicalCenter.y * newZoom;
    
    return {
      x: newX,
      y: newY,
      zoom: newZoom
    };
  }

  /**
   * Pan the canvas by a delta in screen coordinates
   */
  static panByDelta(
    currentTransform: Transform,
    deltaX: number,
    deltaY: number
  ): Transform {
    return {
      ...currentTransform,
      x: currentTransform.x + deltaX,
      y: currentTransform.y + deltaY
    };
  }

  /**
   * Fit bounds to viewport with optional padding
   */
  static fitBoundsToViewport(
    bounds: Bounds,
    containerSize: { width: number; height: number },
    padding: number = 50
  ): Transform {
    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;
    
    const scaleX = (containerSize.width - padding * 2) / boundsWidth;
    const scaleY = (containerSize.height - padding * 2) / boundsHeight;
    const zoom = Math.min(scaleX, scaleY);
    
    const x = (containerSize.width - boundsWidth * zoom) / 2 - bounds.minX * zoom;
    const y = (containerSize.height - boundsHeight * zoom) / 2 - bounds.minY * zoom;
    
    return { x, y, zoom };
  }

  /**
   * Constrain transform to prevent infinite zoom out and maintain bounds
   */
  static constrainTransform(
    transform: Transform,
    constraints: {
      minZoom: number;
      maxZoom: number;
      bounds?: Bounds;
    }
  ): Transform {
    const constrainedZoom = Math.max(
      constraints.minZoom,
      Math.min(constraints.maxZoom, transform.zoom)
    );
    
    let constrainedX = transform.x;
    let constrainedY = transform.y;
    
    // Optional bounds constraint
    if (constraints.bounds) {
      const maxX = constraints.bounds.maxX * constrainedZoom;
      const maxY = constraints.bounds.maxY * constrainedZoom;
      const minX = constraints.bounds.minX * constrainedZoom;
      const minY = constraints.bounds.minY * constrainedZoom;
      
      constrainedX = Math.max(minX, Math.min(maxX, constrainedX));
      constrainedY = Math.max(minY, Math.min(maxY, constrainedY));
    }
    
    return {
      x: constrainedX,
      y: constrainedY,
      zoom: constrainedZoom
    };
  }

  /**
   * Calculate visible bounds for given transform and viewport
   */
  static getVisibleBounds(
    transform: Transform,
    containerSize: { width: number; height: number }
  ): Bounds {
    const topLeft = this.screenToLogical(
      { x: 0, y: 0 },
      transform,
      new DOMRect(0, 0, containerSize.width, containerSize.height)
    );
    
    const bottomRight = this.screenToLogical(
      { x: containerSize.width, y: containerSize.height },
      transform,
      new DOMRect(0, 0, containerSize.width, containerSize.height)
    );
    
    return {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y
    };
  }

  /**
   * Snap point to grid
   */
  static snapToGrid(
    point: Point,
    gridSize: number,
    enabled: boolean = true
  ): Point {
    if (!enabled) return point;
    
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  /**
   * Calculate distance between two points
   */
  static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if point is within bounds
   */
  static isPointInBounds(point: Point, bounds: Bounds): boolean {
    return point.x >= bounds.minX && 
           point.x <= bounds.maxX && 
           point.y >= bounds.minY && 
           point.y <= bounds.maxY;
  }

  /**
   * Check if two bounds intersect
   */
  static boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(bounds1.maxX < bounds2.minX || 
             bounds1.minX > bounds2.maxX || 
             bounds1.maxY < bounds2.minY || 
             bounds1.minY > bounds2.maxY);
  }

  /**
   * Create transform matrix string for CSS
   */
  static toMatrixString(transform: Transform): string {
    return `matrix(${transform.zoom}, 0, 0, ${transform.zoom}, ${transform.x}, ${transform.y})`;
  }

  /**
   * Create SVG viewBox string
   */
  static toViewBoxString(viewport: ViewPort): string {
    return `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`;
  }

  /**
   * Animate transform between two states
   */
  static interpolateTransform(
    from: Transform,
    to: Transform,
    progress: number
  ): Transform {
    const t = Math.max(0, Math.min(1, progress));
    
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      zoom: from.zoom + (to.zoom - from.zoom) * t
    };
  }

  /**
   * Calculate bounds for a set of components
   */
  static calculateComponentsBounds(
    components: Array<{ position: Point; size: { width: number; height: number } }>
  ): Bounds {
    if (components.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    components.forEach(component => {
      const { position, size } = component;
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + size.width);
      maxY = Math.max(maxY, position.y + size.height);
    });
    
    // Add some padding
    const padding = 50;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    };
  }
}

// Easing functions for smooth animations
export const Easing = {
  linear: (t: number): number => t,
  
  easeInQuad: (t: number): number => t * t,
  
  easeOutQuad: (t: number): number => t * (2 - t),
  
  easeInOutQuad: (t: number): number => 
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number): number => t * t * t,
  
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};

export default CanvasTransforms;