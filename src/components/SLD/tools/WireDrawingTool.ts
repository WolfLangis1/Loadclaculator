/**
 * Wire Drawing Tool - Orthogonal wire routing with intelligent path finding
 */

import { BaseTool, Point } from './DrawingToolSystem';

export interface WireSegment {
  start: Point;
  end: Point;
  type: 'horizontal' | 'vertical';
}

export interface WireConnection {
  componentId: string;
  terminalId: string;
  point: Point;
}

export class WireDrawingTool extends BaseTool {
  public id = 'wire';
  public name = 'Wire';
  public icon = '⚡';
  public cursor = 'crosshair';
  public category = 'drawing' as const;
  public shortcut = 'w';

  private currentWire: {
    segments: WireSegment[];
    currentPoint: Point | null;
    startConnection: WireConnection | null;
    endConnection: WireConnection | null;
    isDrawing: boolean;
  } = {
    segments: [],
    currentPoint: null,
    startConnection: null,
    endConnection: null,
    isDrawing: false
  };

  private wireStyle = {
    color: '#2563eb',
    width: 2,
    dashPattern: null as number[] | null
  };

  protected onActivate(): void {
    document.body.style.cursor = 'crosshair';
  }

  protected onDeactivate(): void {
    document.body.style.cursor = '';
    this.cancelCurrentWire();
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.currentWire.isDrawing) {
      // Start new wire
      this.startWire(point);
    } else {
      // Add segment to current wire
      this.addWireSegment(point);
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.currentWire.isDrawing) {
      this.currentWire.currentPoint = point;
      this.updateWirePreview(point);
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Wire drawing is handled in onMouseDown for better control
  }

  public onDoubleClick(point: Point, event: MouseEvent): void {
    if (this.currentWire.isDrawing) {
      // Finish wire drawing
      this.finishWire(point);
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.cancelCurrentWire();
        break;
      
      case 'Enter':
        if (this.currentWire.isDrawing && this.currentWire.currentPoint) {
          event.preventDefault();
          this.finishWire(this.currentWire.currentPoint);
        }
        break;
      
      case 'Backspace':
        if (this.currentWire.isDrawing) {
          event.preventDefault();
          this.removeLastSegment();
        }
        break;
    }
  }

  private startWire(point: Point): void {
    // Check if starting from a component terminal
    const connection = this.findConnectionAtPoint(point);
    
    this.currentWire = {
      segments: [],
      currentPoint: point,
      startConnection: connection,
      endConnection: null,
      isDrawing: true
    };

    this.state.startPoint = point;
    this.state.isDragging = true;
  }

  private addWireSegment(point: Point): void {
    if (!this.currentWire.isDrawing || !this.state.startPoint) return;

    const lastPoint = this.getLastWirePoint();
    if (!lastPoint) return;

    // Create orthogonal segments
    const segments = this.createOrthogonalSegments(lastPoint, point);
    this.currentWire.segments.push(...segments);

    // Update start point for next segment
    this.state.startPoint = point;
  }

  private finishWire(point: Point): void {
    if (!this.currentWire.isDrawing) return;

    // Add final segment if needed
    const lastPoint = this.getLastWirePoint();
    if (lastPoint && (lastPoint.x !== point.x || lastPoint.y !== point.y)) {
      const segments = this.createOrthogonalSegments(lastPoint, point);
      this.currentWire.segments.push(...segments);
    }

    // Check if ending at a component terminal
    const endConnection = this.findConnectionAtPoint(point);
    this.currentWire.endConnection = endConnection;

    // Create the wire object
    this.createWireObject();

    // Reset for next wire
    this.resetWireState();
  }

  private cancelCurrentWire(): void {
    this.resetWireState();
  }

  private removeLastSegment(): void {
    if (this.currentWire.segments.length > 0) {
      this.currentWire.segments.pop();
      
      // Update start point
      const lastPoint = this.getLastWirePoint();
      if (lastPoint) {
        this.state.startPoint = lastPoint;
      }
    }
  }

  private resetWireState(): void {
    this.currentWire = {
      segments: [],
      currentPoint: null,
      startConnection: null,
      endConnection: null,
      isDrawing: false
    };
    
    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  private getLastWirePoint(): Point | null {
    if (this.currentWire.segments.length > 0) {
      const lastSegment = this.currentWire.segments[this.currentWire.segments.length - 1];
      return lastSegment.end;
    }
    return this.state.startPoint;
  }

  private createOrthogonalSegments(start: Point, end: Point): WireSegment[] {
    const segments: WireSegment[] = [];
    
    // Simple L-shaped routing (horizontal then vertical)
    if (start.x !== end.x && start.y !== end.y) {
      // First segment: horizontal
      const midPoint = { x: end.x, y: start.y };
      segments.push({
        start,
        end: midPoint,
        type: 'horizontal'
      });
      
      // Second segment: vertical
      segments.push({
        start: midPoint,
        end,
        type: 'vertical'
      });
    } else if (start.x !== end.x) {
      // Horizontal only
      segments.push({
        start,
        end,
        type: 'horizontal'
      });
    } else if (start.y !== end.y) {
      // Vertical only
      segments.push({
        start,
        end,
        type: 'vertical'
      });
    }
    
    return segments;
  }

  private updateWirePreview(currentPoint: Point): void {
    // This would trigger a re-render with the current wire preview
    // The preview would show the segments plus a preview of the next segment
  }

  private findConnectionAtPoint(point: Point): WireConnection | null {
    // This would integrate with the HitTestSystem to find component terminals
    // For now, return null as a placeholder
    return null;
  }

  private createWireObject(): void {
    if (this.currentWire.segments.length === 0) return;

    const wireObject = {
      id: this.generateWireId(),
      type: 'connection',
      segments: [...this.currentWire.segments],
      startConnection: this.currentWire.startConnection,
      endConnection: this.currentWire.endConnection,
      style: { ...this.wireStyle },
      properties: {
        wireType: 'single',
        voltage: 120,
        current: 20,
        wireSize: '12 AWG',
        conduitType: 'EMT'
      }
    };

    // Create the wire in the diagram
    this.toolSystem?.createGeometry(wireObject);
  }

  private generateWireId(): string {
    return `wire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getPreviewGeometry(): any {
    if (!this.currentWire.isDrawing) return null;

    const previewSegments = [...this.currentWire.segments];
    
    // Add preview segment to current mouse position
    if (this.currentWire.currentPoint) {
      const lastPoint = this.getLastWirePoint();
      if (lastPoint) {
        const previewSegs = this.createOrthogonalSegments(lastPoint, this.currentWire.currentPoint);
        previewSegments.push(...previewSegs);
      }
    }

    return {
      type: 'wire-preview',
      segments: previewSegments,
      style: {
        ...this.wireStyle,
        dashPattern: [5, 5], // Dashed preview
        opacity: 0.7
      }
    };
  }

  // Wire routing intelligence methods
  private findOptimalPath(start: Point, end: Point, obstacles: any[]): WireSegment[] {
    // Advanced pathfinding algorithm would go here
    // For now, use simple orthogonal routing
    return this.createOrthogonalSegments(start, end);
  }

  private avoidObstacles(segments: WireSegment[], obstacles: any[]): WireSegment[] {
    // Obstacle avoidance algorithm would go here
    return segments;
  }

  private optimizeWirePath(segments: WireSegment[]): WireSegment[] {
    // Path optimization (remove redundant segments, minimize bends)
    const optimized: WireSegment[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      
      // Skip redundant segments
      if (next && current.type === next.type) {
        // Merge segments of the same type
        const merged: WireSegment = {
          start: current.start,
          end: next.end,
          type: current.type
        };
        optimized.push(merged);
        i++; // Skip next segment as it's merged
      } else {
        optimized.push(current);
      }
    }
    
    return optimized;
  }
}