/**
 * Zoom Tool - Interactive zooming with click and drag
 */

import { BaseTool, Point } from './DrawingToolSystem';

export class ZoomTool extends BaseTool {
  public id = 'zoom';
  public name = 'Zoom';
  public icon = '🔍';
  public cursor = 'zoom-in';
  public category = 'selection' as const;
  public shortcut = 'z';

  private zoomBox: {
    start: Point;
    end: Point;
    active: boolean;
  } = {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    active: false
  };

  protected onActivate(): void {
    document.body.style.cursor = 'zoom-in';
  }

  protected onDeactivate(): void {
    document.body.style.cursor = '';
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    this.state.startPoint = point;
    this.state.isDragging = true;

    if (event.altKey) {
      // Zoom out mode
      this.cursor = 'zoom-out';
      document.body.style.cursor = 'zoom-out';
    } else {
      // Zoom in mode
      this.cursor = 'zoom-in';
      document.body.style.cursor = 'zoom-in';
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.state.isDragging && this.state.startPoint && !event.altKey) {
      // Check if we should start a zoom box
      const distance = Math.sqrt(
        Math.pow(point.x - this.state.startPoint.x, 2) +
        Math.pow(point.y - this.state.startPoint.y, 2)
      );
      
      if (distance > 5) {
        this.zoomBox = {
          start: this.state.startPoint,
          end: point,
          active: true
        };
      }
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    if (this.zoomBox.active) {
      // Zoom to the selected area
      this.zoomToBox();
    } else if (this.state.startPoint) {
      // Single click zoom
      if (event.altKey) {
        this.zoomOut(point);
      } else {
        this.zoomIn(point);
      }
    }

    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
    this.zoomBox.active = false;
    this.cursor = 'zoom-in';
    document.body.style.cursor = 'zoom-in';
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault();
        this.zoomInAtCenter();
        break;
      
      case '-':
        event.preventDefault();
        this.zoomOutAtCenter();
        break;
      
      case '0':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.zoomToFit();
        }
        break;
      
      case '1':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.zoomToActualSize();
        }
        break;
    }
  }

  private zoomIn(center: Point): void {
    const zoomFactor = 1.5;
    this.zoomAtPoint(center, zoomFactor);
  }

  private zoomOut(center: Point): void {
    const zoomFactor = 1 / 1.5;
    this.zoomAtPoint(center, zoomFactor);
  }

  private zoomInAtCenter(): void {
    const center = this.getViewportCenter();
    this.zoomIn(center);
  }

  private zoomOutAtCenter(): void {
    const center = this.getViewportCenter();
    this.zoomOut(center);
  }

  private zoomToBox(): void {
    if (!this.zoomBox.active) return;

    const bounds = {
      x: Math.min(this.zoomBox.start.x, this.zoomBox.end.x),
      y: Math.min(this.zoomBox.start.y, this.zoomBox.end.y),
      width: Math.abs(this.zoomBox.end.x - this.zoomBox.start.x),
      height: Math.abs(this.zoomBox.end.y - this.zoomBox.start.y)
    };

    // Ensure minimum zoom box size
    if (bounds.width < 10 || bounds.height < 10) {
      return;
    }

    this.zoomToBounds(bounds);
  }

  private zoomToFit(): void {
    // Zoom to fit all content in the viewport
    const contentBounds = this.getContentBounds();
    if (contentBounds) {
      this.zoomToBounds(contentBounds, 50); // 50px padding
    }
  }

  private zoomToActualSize(): void {
    // Zoom to 100% (1:1 scale)
    const center = this.getViewportCenter();
    this.setZoomLevel(1.0, center);
  }

  private zoomAtPoint(point: Point, factor: number): void {
    // This would integrate with the ViewportManager
    const currentZoom = this.getCurrentZoom();
    const newZoom = currentZoom * factor;
    this.setZoomLevel(newZoom, point);
  }

  private zoomToBounds(bounds: { x: number; y: number; width: number; height: number }, padding: number = 0): void {
    // This would integrate with the ViewportManager
    const viewport = this.getCurrentViewport();
    
    const paddedBounds = {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2
    };

    const scaleX = viewport.width / paddedBounds.width;
    const scaleY = viewport.height / paddedBounds.height;
    const scale = Math.min(scaleX, scaleY);

    const centerX = paddedBounds.x + paddedBounds.width / 2;
    const centerY = paddedBounds.y + paddedBounds.height / 2;

    this.setViewport({
      zoom: scale,
      x: centerX - viewport.width / (2 * scale),
      y: centerY - viewport.height / (2 * scale)
    });
  }

  private setZoomLevel(zoom: number, center: Point): void {
    // This would integrate with the ViewportManager
    // Convert screen point to world coordinates
    const worldCenter = this.screenToWorld(center);
    
    // Calculate new viewport position to keep the center point fixed
    const viewport = this.getCurrentViewport();
    const newX = worldCenter.x - center.x / zoom;
    const newY = worldCenter.y - center.y / zoom;

    this.setViewport({
      zoom,
      x: newX,
      y: newY
    });
  }

  private getCurrentZoom(): number {
    // This would integrate with the ViewportManager
    return 1.0;
  }

  private getCurrentViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    // This would integrate with the ViewportManager
    return { x: 0, y: 0, width: 800, height: 600, zoom: 1.0 };
  }

  private getViewportCenter(): Point {
    const viewport = this.getCurrentViewport();
    return {
      x: viewport.width / 2,
      y: viewport.height / 2
    };
  }

  private getContentBounds(): { x: number; y: number; width: number; height: number } | null {
    // This would integrate with the diagram system to get bounds of all content
    return null;
  }

  private screenToWorld(screenPoint: Point): Point {
    // This would integrate with the ViewportManager
    const viewport = this.getCurrentViewport();
    return {
      x: viewport.x + screenPoint.x / viewport.zoom,
      y: viewport.y + screenPoint.y / viewport.zoom
    };
  }

  private setViewport(updates: Partial<{ x: number; y: number; zoom: number }>): void {
    // This would integrate with the ViewportManager
  }

  public getPreviewGeometry(): any {
    if (this.zoomBox.active) {
      return {
        type: 'zoom-box',
        bounds: {
          x: Math.min(this.zoomBox.start.x, this.zoomBox.end.x),
          y: Math.min(this.zoomBox.start.y, this.zoomBox.end.y),
          width: Math.abs(this.zoomBox.end.x - this.zoomBox.start.x),
          height: Math.abs(this.zoomBox.end.y - this.zoomBox.start.y)
        }
      };
    }
    return null;
  }
}