/**
 * Viewport Management System for Professional SLD Canvas
 * 
 * Handles smooth zoom, pan, and viewport transformations with 60fps performance
 */

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface ViewportConstraints {
  minZoom: number;
  maxZoom: number;
  bounds?: ViewportBounds;
  smoothTransitions: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export class ViewportManager {
  private viewport: ViewportState;
  private constraints: ViewportConstraints;
  private targetViewport: ViewportState;
  private isAnimating: boolean = false;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private animationDuration: number = 300; // ms
  private devicePixelRatio: number;
  
  // Event callbacks
  private onViewportChange?: (viewport: ViewportState) => void;
  private onAnimationComplete?: () => void;
  
  // Interaction state
  private isPanning: boolean = false;
  private lastPanPoint: Point = { x: 0, y: 0 };
  private panVelocity: Point = { x: 0, y: 0 };
  private panInertia: boolean = true;
  private inertiaDecay: number = 0.95;

  constructor(
    initialViewport: ViewportState,
    constraints: Partial<ViewportConstraints> = {}
  ) {
    this.viewport = { ...initialViewport };
    this.targetViewport = { ...initialViewport };
    this.devicePixelRatio = window.devicePixelRatio || 1;
    
    this.constraints = {
      minZoom: 0.1,
      maxZoom: 5.0,
      smoothTransitions: true,
      ...constraints
    };
  }

  public setViewportChangeCallback(callback: (viewport: ViewportState) => void): void {
    this.onViewportChange = callback;
  }

  public setAnimationCompleteCallback(callback: () => void): void {
    this.onAnimationComplete = callback;
  }

  public getViewport(): ViewportState {
    return { ...this.viewport };
  }

  public setViewport(newViewport: Partial<ViewportState>, animate: boolean = true): void {
    const constrainedViewport = this.constrainViewport({
      ...this.viewport,
      ...newViewport
    });

    if (animate && this.constraints.smoothTransitions) {
      this.animateToViewport(constrainedViewport);
    } else {
      this.viewport = constrainedViewport;
      this.targetViewport = constrainedViewport;
      this.notifyViewportChange();
    }
  }

  private constrainViewport(viewport: ViewportState): ViewportState {
    const constrained = { ...viewport };
    
    // Constrain zoom
    constrained.zoom = Math.max(
      this.constraints.minZoom,
      Math.min(this.constraints.maxZoom, constrained.zoom)
    );
    
    // Constrain position if bounds are set
    if (this.constraints.bounds) {
      const bounds = this.constraints.bounds;
      const viewWidth = constrained.width / constrained.zoom;
      const viewHeight = constrained.height / constrained.zoom;
      
      // Ensure we don't pan beyond bounds
      constrained.x = Math.max(
        bounds.minX,
        Math.min(bounds.maxX - viewWidth, constrained.x)
      );
      
      constrained.y = Math.max(
        bounds.minY,
        Math.min(bounds.maxY - viewHeight, constrained.y)
      );
    }
    
    return constrained;
  }

  private animateToViewport(targetViewport: ViewportState): void {
    this.targetViewport = targetViewport;
    
    if (this.isAnimating) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      
      // Use easing function for smooth animation
      const easedProgress = this.easeInOutCubic(progress);
      
      // Interpolate viewport values
      this.viewport = {
        x: this.lerp(this.viewport.x, this.targetViewport.x, easedProgress),
        y: this.lerp(this.viewport.y, this.targetViewport.y, easedProgress),
        zoom: this.lerp(this.viewport.zoom, this.targetViewport.zoom, easedProgress),
        width: this.viewport.width,
        height: this.viewport.height
      };
      
      this.notifyViewportChange();
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.onAnimationComplete?.();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  public zoom(factor: number, center?: Point): void {
    const currentZoom = this.viewport.zoom;
    const newZoom = currentZoom * factor;
    
    if (center) {
      // Zoom towards a specific point
      const zoomCenter = this.screenToWorld(center);
      
      // Calculate new viewport position to keep zoom center fixed
      const newX = zoomCenter.x - (center.x / newZoom);
      const newY = zoomCenter.y - (center.y / newZoom);
      
      this.setViewport({
        zoom: newZoom,
        x: newX,
        y: newY
      });
    } else {
      // Zoom towards viewport center
      const centerX = this.viewport.width / 2;
      const centerY = this.viewport.height / 2;
      this.zoom(factor, { x: centerX, y: centerY });
    }
  }

  public zoomIn(center?: Point): void {
    this.zoom(1.2, center);
  }

  public zoomOut(center?: Point): void {
    this.zoom(1 / 1.2, center);
  }

  public zoomToFit(bounds: ViewportBounds, padding: number = 50): void {
    const paddedBounds = {
      ...bounds,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2
    };
    
    const scaleX = this.viewport.width / paddedBounds.width;
    const scaleY = this.viewport.height / paddedBounds.height;
    const scale = Math.min(scaleX, scaleY);
    
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    
    this.setViewport({
      zoom: scale,
      x: centerX - this.viewport.width / (2 * scale),
      y: centerY - this.viewport.height / (2 * scale)
    });
  }

  public zoomToPoint(point: Point, zoom: number): void {
    const worldPoint = this.screenToWorld(point);
    
    this.setViewport({
      zoom,
      x: worldPoint.x - point.x / zoom,
      y: worldPoint.y - point.y / zoom
    });
  }

  public pan(deltaX: number, deltaY: number): void {
    this.setViewport({
      x: this.viewport.x - deltaX / this.viewport.zoom,
      y: this.viewport.y - deltaY / this.viewport.zoom
    }, false);
  }

  public startPan(point: Point): void {
    this.isPanning = true;
    this.lastPanPoint = point;
    this.panVelocity = { x: 0, y: 0 };
  }

  public updatePan(point: Point): void {
    if (!this.isPanning) return;
    
    const deltaX = point.x - this.lastPanPoint.x;
    const deltaY = point.y - this.lastPanPoint.y;
    
    // Update velocity for inertia
    this.panVelocity.x = deltaX;
    this.panVelocity.y = deltaY;
    
    this.pan(deltaX, deltaY);
    this.lastPanPoint = point;
  }

  public endPan(): void {
    this.isPanning = false;
    
    if (this.panInertia && (Math.abs(this.panVelocity.x) > 1 || Math.abs(this.panVelocity.y) > 1)) {
      this.startInertialPan();
    }
  }

  private startInertialPan(): void {
    const animate = () => {
      if (Math.abs(this.panVelocity.x) < 0.1 && Math.abs(this.panVelocity.y) < 0.1) {
        return; // Stop animation when velocity is negligible
      }
      
      this.pan(this.panVelocity.x, this.panVelocity.y);
      
      // Apply decay
      this.panVelocity.x *= this.inertiaDecay;
      this.panVelocity.y *= this.inertiaDecay;
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }

  public reset(): void {
    this.setViewport({
      x: 0,
      y: 0,
      zoom: 1
    });
  }

  public screenToWorld(screenPoint: Point): Point {
    return {
      x: this.viewport.x + screenPoint.x / this.viewport.zoom,
      y: this.viewport.y + screenPoint.y / this.viewport.zoom
    };
  }

  public worldToScreen(worldPoint: Point): Point {
    return {
      x: (worldPoint.x - this.viewport.x) * this.viewport.zoom,
      y: (worldPoint.y - this.viewport.y) * this.viewport.zoom
    };
  }

  public isPointVisible(worldPoint: Point, margin: number = 0): boolean {
    const screenPoint = this.worldToScreen(worldPoint);
    return (
      screenPoint.x >= -margin &&
      screenPoint.x <= this.viewport.width + margin &&
      screenPoint.y >= -margin &&
      screenPoint.y <= this.viewport.height + margin
    );
  }

  public isRectVisible(worldRect: { x: number; y: number; width: number; height: number }): boolean {
    const topLeft = this.worldToScreen({ x: worldRect.x, y: worldRect.y });
    const bottomRight = this.worldToScreen({
      x: worldRect.x + worldRect.width,
      y: worldRect.y + worldRect.height
    });
    
    return !(
      bottomRight.x < 0 ||
      topLeft.x > this.viewport.width ||
      bottomRight.y < 0 ||
      topLeft.y > this.viewport.height
    );
  }

  public getVisibleWorldBounds(): ViewportBounds {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this.viewport.width,
      y: this.viewport.height
    });
    
    return {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  public setConstraints(constraints: Partial<ViewportConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
    
    // Re-constrain current viewport
    const constrainedViewport = this.constrainViewport(this.viewport);
    if (
      constrainedViewport.x !== this.viewport.x ||
      constrainedViewport.y !== this.viewport.y ||
      constrainedViewport.zoom !== this.viewport.zoom
    ) {
      this.setViewport(constrainedViewport);
    }
  }

  public updateSize(width: number, height: number): void {
    this.viewport.width = width;
    this.viewport.height = height;
    this.targetViewport.width = width;
    this.targetViewport.height = height;
    this.notifyViewportChange();
  }

  private notifyViewportChange(): void {
    this.onViewportChange?.(this.getViewport());
  }

  public dispose(): void {
    if (this.isAnimating) {
      cancelAnimationFrame(this.animationId);
      this.isAnimating = false;
    }
  }
}