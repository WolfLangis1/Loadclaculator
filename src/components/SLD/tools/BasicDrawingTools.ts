/**
 * Basic Drawing Tools - Rectangle, Circle, Line
 */

import { BaseTool, Point } from './DrawingToolSystem';

// Rectangle Tool
export class RectangleTool extends BaseTool {
  public id = 'rectangle';
  public name = 'Rectangle';
  public icon = '⬜';
  public cursor = 'crosshair';
  public category = 'drawing' as const;
  public shortcut = 'r';

  public onMouseDown(point: Point, event: MouseEvent): void {
    this.state.startPoint = point;
    this.state.isDragging = true;
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    if (this.state.startPoint && this.state.isDragging) {
      this.createRectangle(this.state.startPoint, point);
    }
    
    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  private createRectangle(start: Point, end: Point): void {
    const bounds = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };

    if (bounds.width < 5 || bounds.height < 5) return;

    const rectangle = {
      id: `rectangle_${Date.now()}`,
      type: 'rectangle',
      bounds,
      style: {
        fill: 'transparent',
        stroke: '#2563eb',
        strokeWidth: 2
      }
    };

    this.toolSystem?.createGeometry(rectangle);
  }

  public getPreviewGeometry(): any {
    if (this.state.isDragging && this.state.startPoint && this.state.currentPoint) {
      return {
        type: 'rectangle-preview',
        bounds: {
          x: Math.min(this.state.startPoint.x, this.state.currentPoint.x),
          y: Math.min(this.state.startPoint.y, this.state.currentPoint.y),
          width: Math.abs(this.state.currentPoint.x - this.state.startPoint.x),
          height: Math.abs(this.state.currentPoint.y - this.state.startPoint.y)
        },
        style: {
          fill: 'transparent',
          stroke: '#2563eb',
          strokeWidth: 1,
          strokeDasharray: [5, 5],
          opacity: 0.7
        }
      };
    }
    return null;
  }
}

// Circle Tool
export class CircleTool extends BaseTool {
  public id = 'circle';
  public name = 'Circle';
  public icon = '⭕';
  public cursor = 'crosshair';
  public category = 'drawing' as const;
  public shortcut = 'c';

  public onMouseDown(point: Point, event: MouseEvent): void {
    this.state.startPoint = point;
    this.state.isDragging = true;
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    if (this.state.startPoint && this.state.isDragging) {
      this.createCircle(this.state.startPoint, point);
    }
    
    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  private createCircle(center: Point, edge: Point): void {
    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );

    if (radius < 5) return;

    const circle = {
      id: `circle_${Date.now()}`,
      type: 'circle',
      center,
      radius,
      style: {
        fill: 'transparent',
        stroke: '#2563eb',
        strokeWidth: 2
      }
    };

    this.toolSystem?.createGeometry(circle);
  }

  public getPreviewGeometry(): any {
    if (this.state.isDragging && this.state.startPoint && this.state.currentPoint) {
      const radius = Math.sqrt(
        Math.pow(this.state.currentPoint.x - this.state.startPoint.x, 2) +
        Math.pow(this.state.currentPoint.y - this.state.startPoint.y, 2)
      );

      return {
        type: 'circle-preview',
        center: this.state.startPoint,
        radius,
        style: {
          fill: 'transparent',
          stroke: '#2563eb',
          strokeWidth: 1,
          strokeDasharray: [5, 5],
          opacity: 0.7
        }
      };
    }
    return null;
  }
}

// Line Tool
export class LineTool extends BaseTool {
  public id = 'line';
  public name = 'Line';
  public icon = '📏';
  public cursor = 'crosshair';
  public category = 'drawing' as const;
  public shortcut = 'l';

  public onMouseDown(point: Point, event: MouseEvent): void {
    this.state.startPoint = point;
    this.state.isDragging = true;
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    if (this.state.startPoint && this.state.isDragging) {
      this.createLine(this.state.startPoint, point);
    }
    
    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  private createLine(start: Point, end: Point): void {
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    if (distance < 5) return;

    const line = {
      id: `line_${Date.now()}`,
      type: 'line',
      start,
      end,
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      }
    };

    this.toolSystem?.createGeometry(line);
  }

  public getPreviewGeometry(): any {
    if (this.state.isDragging && this.state.startPoint && this.state.currentPoint) {
      return {
        type: 'line-preview',
        start: this.state.startPoint,
        end: this.state.currentPoint,
        style: {
          stroke: '#2563eb',
          strokeWidth: 1,
          strokeDasharray: [5, 5],
          opacity: 0.7
        }
      };
    }
    return null;
  }
}

// Callout Tool
export class CalloutTool extends BaseTool {
  public id = 'callout';
  public name = 'Callout';
  public icon = '💬';
  public cursor = 'crosshair';
  public category = 'annotation' as const;
  public shortcut = 'o';

  private calloutState: {
    textPoint: Point | null;
    leaderPoint: Point | null;
    isSettingLeader: boolean;
  } = {
    textPoint: null,
    leaderPoint: null,
    isSettingLeader: false
  };

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.calloutState.textPoint) {
      // Set text position
      this.calloutState.textPoint = point;
      this.calloutState.isSettingLeader = true;
      this.state.startPoint = point;
    } else {
      // Set leader point and finish
      this.calloutState.leaderPoint = point;
      this.createCallout();
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
    
    if (this.calloutState.isSettingLeader) {
      this.calloutState.leaderPoint = point;
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Callout creation is handled in onMouseDown
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.resetCalloutState();
    }
  }

  private createCallout(): void {
    if (!this.calloutState.textPoint || !this.calloutState.leaderPoint) return;

    const callout = {
      id: `callout_${Date.now()}`,
      type: 'callout',
      textPoint: this.calloutState.textPoint,
      leaderPoint: this.calloutState.leaderPoint,
      text: 'Callout text',
      style: {
        textSize: 12,
        textColor: '#333333',
        backgroundColor: '#ffffff',
        borderColor: '#666666',
        leaderColor: '#666666',
        leaderWidth: 1
      }
    };

    this.toolSystem?.createGeometry(callout);
    this.resetCalloutState();
  }

  private resetCalloutState(): void {
    this.calloutState = {
      textPoint: null,
      leaderPoint: null,
      isSettingLeader: false
    };
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  public getPreviewGeometry(): any {
    if (this.calloutState.textPoint) {
      return {
        type: 'callout-preview',
        textPoint: this.calloutState.textPoint,
        leaderPoint: this.calloutState.leaderPoint || this.state.currentPoint,
        style: {
          textSize: 12,
          textColor: '#2563eb',
          backgroundColor: '#ffffff',
          borderColor: '#2563eb',
          leaderColor: '#2563eb',
          leaderWidth: 1,
          opacity: 0.7
        }
      };
    }
    return null;
  }
}