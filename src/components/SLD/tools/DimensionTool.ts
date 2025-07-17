/**
 * Dimension Tool - Adding measurements with real-world units
 */

import { BaseTool, Point } from './DrawingToolSystem';

export interface DimensionStyle {
  color: string;
  lineWidth: number;
  arrowSize: number;
  textSize: number;
  textColor: string;
  textBackground?: string;
  precision: number;
  units: 'px' | 'in' | 'ft' | 'mm' | 'cm' | 'm';
}

export interface DimensionObject {
  id: string;
  type: 'linear' | 'angular' | 'radial';
  startPoint: Point;
  endPoint: Point;
  offsetDistance: number;
  value: number;
  displayValue: string;
  style: DimensionStyle;
  locked: boolean;
}

export class DimensionTool extends BaseTool {
  public id = 'dimension';
  public name = 'Dimension';
  public icon = '📏';
  public cursor = 'crosshair';
  public category = 'measurement' as const;
  public shortcut = 'd';

  private defaultStyle: DimensionStyle = {
    color: '#666666',
    lineWidth: 1,
    arrowSize: 8,
    textSize: 10,
    textColor: '#333333',
    precision: 2,
    units: 'px'
  };

  private currentDimension: {
    startPoint: Point | null;
    endPoint: Point | null;
    offsetPoint: Point | null;
    isDrawing: boolean;
    type: 'linear' | 'angular' | 'radial';
  } = {
    startPoint: null,
    endPoint: null,
    offsetPoint: null,
    isDrawing: false,
    type: 'linear'
  };

  private pixelsPerUnit = {
    px: 1,
    in: 96,      // 96 pixels per inch (standard screen DPI)
    ft: 96 * 12, // 12 inches per foot
    mm: 96 / 25.4, // 25.4 mm per inch
    cm: 96 / 2.54,  // 2.54 cm per inch
    m: 96 / 0.0254  // 0.0254 m per inch
  };

  protected onActivate(): void {
    document.body.style.cursor = 'crosshair';
  }

  protected onDeactivate(): void {
    document.body.style.cursor = '';
    this.cancelCurrentDimension();
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.currentDimension.isDrawing) {
      // Start new dimension
      this.startDimension(point);
    } else if (!this.currentDimension.endPoint) {
      // Set end point
      this.setEndPoint(point);
    } else {
      // Set offset and finish dimension
      this.finishDimension(point);
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.currentDimension.isDrawing) {
      if (!this.currentDimension.endPoint) {
        // Preview end point
        this.currentDimension.endPoint = point;
      } else {
        // Preview offset
        this.currentDimension.offsetPoint = point;
      }
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Dimension tool uses mouse down for state changes
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.cancelCurrentDimension();
        break;
      
      case 'Enter':
        if (this.currentDimension.isDrawing && this.currentDimension.endPoint) {
          event.preventDefault();
          this.finishDimension(this.currentDimension.offsetPoint || this.currentDimension.endPoint);
        }
        break;
      
      case 'l':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.currentDimension.type = 'linear';
        }
        break;
      
      case 'a':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.currentDimension.type = 'angular';
        }
        break;
      
      case 'r':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.currentDimension.type = 'radial';
        }
        break;
    }
  }

  private startDimension(point: Point): void {
    this.currentDimension = {
      startPoint: point,
      endPoint: null,
      offsetPoint: null,
      isDrawing: true,
      type: 'linear'
    };

    this.state.startPoint = point;
    this.state.isDragging = true;
  }

  private setEndPoint(point: Point): void {
    this.currentDimension.endPoint = point;
  }

  private finishDimension(offsetPoint: Point): void {
    if (!this.currentDimension.startPoint || !this.currentDimension.endPoint) return;

    const dimension = this.createDimensionObject(
      this.currentDimension.startPoint,
      this.currentDimension.endPoint,
      offsetPoint
    );

    this.toolSystem?.createGeometry(dimension);
    this.resetDimensionState();
  }

  private cancelCurrentDimension(): void {
    this.resetDimensionState();
  }

  private resetDimensionState(): void {
    this.currentDimension = {
      startPoint: null,
      endPoint: null,
      offsetPoint: null,
      isDrawing: false,
      type: 'linear'
    };

    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  private createDimensionObject(startPoint: Point, endPoint: Point, offsetPoint: Point): DimensionObject {
    const distance = this.calculateDistance(startPoint, endPoint);
    const offsetDistance = this.calculateOffsetDistance(startPoint, endPoint, offsetPoint);
    
    const realWorldValue = this.convertToRealWorld(distance);
    const displayValue = this.formatDimensionValue(realWorldValue);

    return {
      id: this.generateDimensionId(),
      type: this.currentDimension.type,
      startPoint,
      endPoint,
      offsetDistance,
      value: realWorldValue,
      displayValue,
      style: { ...this.defaultStyle },
      locked: false
    };
  }

  private calculateDistance(start: Point, end: Point): number {
    return Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
  }

  private calculateOffsetDistance(start: Point, end: Point, offset: Point): number {
    // Calculate perpendicular distance from line to offset point
    const lineLength = this.calculateDistance(start, end);
    if (lineLength === 0) return 0;

    const t = ((offset.x - start.x) * (end.x - start.x) + (offset.y - start.y) * (end.y - start.y)) / (lineLength * lineLength);
    const projection = {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y)
    };

    return this.calculateDistance(projection, offset);
  }

  private convertToRealWorld(pixelValue: number): number {
    const scale = this.getDrawingScale();
    const unitsPerPixel = 1 / (this.pixelsPerUnit[this.defaultStyle.units] * scale);
    return pixelValue * unitsPerPixel;
  }

  private getDrawingScale(): number {
    // This would integrate with the viewport system to get current zoom level
    // For now, assume 1:1 scale
    return 1.0;
  }

  private formatDimensionValue(value: number): string {
    const rounded = Number(value.toFixed(this.defaultStyle.precision));
    
    switch (this.defaultStyle.units) {
      case 'ft':
        // Convert to feet and inches
        const feet = Math.floor(rounded);
        const inches = (rounded - feet) * 12;
        if (feet > 0 && inches > 0) {
          return `${feet}'-${inches.toFixed(this.defaultStyle.precision)}"`;
        } else if (feet > 0) {
          return `${feet}'`;
        } else {
          return `${inches.toFixed(this.defaultStyle.precision)}"`;
        }
      
      case 'in':
        return `${rounded}"`;
      
      case 'mm':
        return `${rounded}mm`;
      
      case 'cm':
        return `${rounded}cm`;
      
      case 'm':
        return `${rounded}m`;
      
      default:
        return `${rounded}px`;
    }
  }

  private generateDimensionId(): string {
    return `dimension_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public setDimensionStyle(style: Partial<DimensionStyle>): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
  }

  public getDimensionStyle(): DimensionStyle {
    return { ...this.defaultStyle };
  }

  public setUnits(units: DimensionStyle['units']): void {
    this.defaultStyle.units = units;
  }

  public setPrecision(precision: number): void {
    this.defaultStyle.precision = Math.max(0, Math.min(6, precision));
  }

  public getPreviewGeometry(): any {
    if (!this.currentDimension.isDrawing || !this.currentDimension.startPoint) {
      return null;
    }

    const preview: any = {
      type: 'dimension-preview',
      dimensionType: this.currentDimension.type,
      startPoint: this.currentDimension.startPoint,
      style: {
        ...this.defaultStyle,
        color: '#2563eb',
        opacity: 0.7
      }
    };

    if (this.currentDimension.endPoint) {
      preview.endPoint = this.currentDimension.endPoint;
      
      const distance = this.calculateDistance(
        this.currentDimension.startPoint,
        this.currentDimension.endPoint
      );
      
      const realWorldValue = this.convertToRealWorld(distance);
      preview.displayValue = this.formatDimensionValue(realWorldValue);
    }

    if (this.currentDimension.offsetPoint) {
      preview.offsetPoint = this.currentDimension.offsetPoint;
      preview.offsetDistance = this.calculateOffsetDistance(
        this.currentDimension.startPoint,
        this.currentDimension.endPoint!,
        this.currentDimension.offsetPoint
      );
    }

    return preview;
  }
}