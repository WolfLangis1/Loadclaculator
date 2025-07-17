/**
 * Measurement Tools - Distance, Area, Angle measurement, and Coordinate Display
 */

import { BaseTool, Point } from './DrawingToolSystem';

// Coordinate Display System
export interface CoordinateDisplayOptions {
  units: 'px' | 'in' | 'ft' | 'mm' | 'cm' | 'm';
  precision: number;
  showAbsolute: boolean;
  showRelative: boolean;
  referencePoint: Point | null;
  displayFormat: 'decimal' | 'fractional' | 'architectural';
}

export class CoordinateDisplaySystem {
  private options: CoordinateDisplayOptions = {
    units: 'px',
    precision: 2,
    showAbsolute: true,
    showRelative: false,
    referencePoint: null,
    displayFormat: 'decimal'
  };

  private pixelsPerUnit = {
    px: 1,
    in: 96,
    ft: 96 * 12,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    m: 96 / 0.0254
  };

  public setOptions(options: Partial<CoordinateDisplayOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public getOptions(): CoordinateDisplayOptions {
    return { ...this.options };
  }

  public setReferencePoint(point: Point | null): void {
    this.options.referencePoint = point;
  }

  public formatCoordinate(point: Point): { absolute: string; relative: string } {
    const absoluteX = this.convertToRealWorld(point.x);
    const absoluteY = this.convertToRealWorld(point.y);

    let relativeX = 0;
    let relativeY = 0;
    if (this.options.referencePoint) {
      relativeX = this.convertToRealWorld(point.x - this.options.referencePoint.x);
      relativeY = this.convertToRealWorld(point.y - this.options.referencePoint.y);
    }

    return {
      absolute: this.formatValue(absoluteX, absoluteY),
      relative: this.formatValue(relativeX, relativeY)
    };
  }

  private convertToRealWorld(pixelValue: number): number {
    return pixelValue / this.pixelsPerUnit[this.options.units];
  }

  private formatValue(x: number, y: number): string {
    const formatNumber = (value: number): string => {
      switch (this.options.displayFormat) {
        case 'fractional':
          return this.toFraction(value);
        case 'architectural':
          return this.toArchitectural(value);
        default:
          return value.toFixed(this.options.precision);
      }
    };

    const xStr = formatNumber(x);
    const yStr = formatNumber(y);
    const unit = this.options.units === 'px' ? '' : this.options.units;

    return `(${xStr}${unit}, ${yStr}${unit})`;
  }

  private toFraction(value: number): string {
    const tolerance = 1 / Math.pow(10, this.options.precision + 1);
    const whole = Math.floor(Math.abs(value));
    const decimal = Math.abs(value) - whole;

    if (decimal < tolerance) {
      return (value < 0 ? '-' : '') + whole.toString();
    }

    // Find closest fraction with denominators up to 64
    let bestNum = 1;
    let bestDen = 1;
    let bestError = Math.abs(decimal - bestNum / bestDen);

    for (let den = 2; den <= 64; den++) {
      const num = Math.round(decimal * den);
      const error = Math.abs(decimal - num / den);
      if (error < bestError) {
        bestNum = num;
        bestDen = den;
        bestError = error;
      }
    }

    // Simplify fraction
    const gcd = this.greatestCommonDivisor(bestNum, bestDen);
    bestNum /= gcd;
    bestDen /= gcd;

    const sign = value < 0 ? '-' : '';
    if (whole === 0) {
      return `${sign}${bestNum}/${bestDen}`;
    } else {
      return `${sign}${whole} ${bestNum}/${bestDen}`;
    }
  }

  private toArchitectural(value: number): string {
    if (this.options.units !== 'ft' && this.options.units !== 'in') {
      return value.toFixed(this.options.precision);
    }

    const totalInches = this.options.units === 'ft' ? value * 12 : value;
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;

    if (feet === 0) {
      return `${this.toFraction(inches)}"`;
    } else if (inches === 0) {
      return `${feet}'`;
    } else {
      return `${feet}'-${this.toFraction(inches)}"`;
    }
  }

  private greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
  }
}

// Measure Distance Tool
export class MeasureDistanceTool extends BaseTool {
  public id = 'measure-distance';
  public name = 'Measure Distance';
  public icon = '📐';
  public cursor = 'crosshair';
  public category = 'measurement' as const;
  public shortcut = 'm';

  private measurement: {
    startPoint: Point | null;
    endPoint: Point | null;
    isActive: boolean;
    distance: number;
    displayValue: string;
    deltaX: number;
    deltaY: number;
  } = {
    startPoint: null,
    endPoint: null,
    isActive: false,
    distance: 0,
    displayValue: '',
    deltaX: 0,
    deltaY: 0
  };

  private units: 'px' | 'in' | 'ft' | 'mm' | 'cm' | 'm' = 'ft';
  private precision = 2;
  private coordinateDisplay = new CoordinateDisplaySystem();

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.measurement.isActive) {
      // Start measurement
      this.measurement.startPoint = point;
      this.measurement.isActive = true;
      this.state.startPoint = point;
    } else {
      // Finish measurement
      this.measurement.endPoint = point;
      this.finalizeMeasurement();
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.measurement.isActive && this.measurement.startPoint) {
      this.measurement.endPoint = point;
      this.updateMeasurement();
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Distance measurement uses mouse down for state changes
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.resetMeasurement();
        break;
      
      case 'Enter':
        if (this.measurement.isActive && this.measurement.endPoint) {
          event.preventDefault();
          this.finalizeMeasurement();
        }
        break;
    }
  }

  private updateMeasurement(): void {
    if (!this.measurement.startPoint || !this.measurement.endPoint) return;

    this.measurement.distance = this.calculateDistance(
      this.measurement.startPoint,
      this.measurement.endPoint
    );

    this.measurement.deltaX = this.measurement.endPoint.x - this.measurement.startPoint.x;
    this.measurement.deltaY = this.measurement.endPoint.y - this.measurement.startPoint.y;

    this.measurement.displayValue = this.formatDistance(this.measurement.distance);
  }

  private calculateDistance(start: Point, end: Point): number {
    return Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
  }

  private formatDistance(pixelDistance: number): string {
    const realDistance = this.convertToRealWorld(pixelDistance);
    return `${realDistance.toFixed(this.precision)} ${this.units}`;
  }

  private convertToRealWorld(pixelValue: number): number {
    // This would integrate with the drawing scale system
    // For now, assume 1:1 scale
    const pixelsPerUnit = {
      px: 1,
      in: 96,
      ft: 96 * 12,
      mm: 96 / 25.4,
      cm: 96 / 2.54,
      m: 96 / 0.0254
    };

    return pixelValue / pixelsPerUnit[this.units];
  }

  private finalizeMeasurement(): void {
    if (this.measurement.startPoint && this.measurement.endPoint) {
      // Create a temporary measurement annotation
      const measurementAnnotation = {
        id: `measurement_${Date.now()}`,
        type: 'measurement',
        startPoint: this.measurement.startPoint,
        endPoint: this.measurement.endPoint,
        distance: this.measurement.distance,
        displayValue: this.measurement.displayValue,
        temporary: true
      };

      // This could be displayed as a temporary overlay
      console.log('Distance measured:', this.measurement.displayValue);
    }

    this.resetMeasurement();
  }

  private resetMeasurement(): void {
    this.measurement = {
      startPoint: null,
      endPoint: null,
      isActive: false,
      distance: 0,
      displayValue: '',
      deltaX: 0,
      deltaY: 0
    };
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  public getPreviewGeometry(): any {
    if (this.measurement.isActive && this.measurement.startPoint && this.measurement.endPoint) {
      return {
        type: 'distance-measurement',
        startPoint: this.measurement.startPoint,
        endPoint: this.measurement.endPoint,
        displayValue: this.measurement.displayValue,
        style: {
          lineColor: '#e11d48',
          lineWidth: 2,
          textColor: '#e11d48',
          textSize: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }
      };
    }
    return null;
  }
}

// Measure Area Tool
export class MeasureAreaTool extends BaseTool {
  public id = 'measure-area';
  public name = 'Measure Area';
  public icon = '📊';
  public cursor = 'crosshair';
  public category = 'measurement' as const;

  private polygon: {
    points: Point[];
    isActive: boolean;
    area: number;
    perimeter: number;
    displayValue: string;
    perimeterValue: string;
  } = {
    points: [],
    isActive: false,
    area: 0,
    perimeter: 0,
    displayValue: '',
    perimeterValue: ''
  };

  private units: 'px²' | 'in²' | 'ft²' | 'mm²' | 'cm²' | 'm²' = 'ft²';
  private precision = 2;
  private coordinateDisplay = new CoordinateDisplaySystem();

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.polygon.isActive) {
      // Start polygon
      this.polygon.points = [point];
      this.polygon.isActive = true;
    } else {
      // Add point to polygon
      this.polygon.points.push(point);
      this.updateArea();
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
  }

  public onDoubleClick(point: Point, event: MouseEvent): void {
    if (this.polygon.isActive && this.polygon.points.length >= 3) {
      // Finish polygon
      this.finalizeArea();
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.resetArea();
        break;
      
      case 'Enter':
        if (this.polygon.isActive && this.polygon.points.length >= 3) {
          event.preventDefault();
          this.finalizeArea();
        }
        break;
      
      case 'Backspace':
        if (this.polygon.isActive && this.polygon.points.length > 1) {
          event.preventDefault();
          this.polygon.points.pop();
          this.updateArea();
        }
        break;
    }
  }

  private updateArea(): void {
    if (this.polygon.points.length < 3) return;

    this.polygon.area = this.calculatePolygonArea(this.polygon.points);
    this.polygon.perimeter = this.calculatePolygonPerimeter(this.polygon.points);
    this.polygon.displayValue = this.formatArea(this.polygon.area);
    this.polygon.perimeterValue = this.formatPerimeter(this.polygon.perimeter);
  }

  private calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  private calculatePolygonPerimeter(points: Point[]): number {
    if (points.length < 2) return 0;

    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  }

  private formatPerimeter(pixelPerimeter: number): string {
    const realPerimeter = this.convertLinearToRealWorld(pixelPerimeter);
    const unit = this.units.replace('²', ''); // Convert area unit to linear unit
    return `${realPerimeter.toFixed(this.precision)} ${unit}`;
  }

  private convertLinearToRealWorld(pixelValue: number): number {
    const pixelsPerUnit = {
      'px²': 1,
      'in²': 96,
      'ft²': 96 * 12,
      'mm²': 96 / 25.4,
      'cm²': 96 / 2.54,
      'm²': 96 / 0.0254
    };

    const unitKey = this.units as keyof typeof pixelsPerUnit;
    return pixelValue / pixelsPerUnit[unitKey];
  }

  private formatArea(pixelArea: number): string {
    const realArea = this.convertAreaToRealWorld(pixelArea);
    return `${realArea.toFixed(this.precision)} ${this.units}`;
  }

  private convertAreaToRealWorld(pixelArea: number): number {
    // This would integrate with the drawing scale system
    const pixelsPerUnit = {
      'px²': 1,
      'in²': 96 * 96,
      'ft²': (96 * 12) * (96 * 12),
      'mm²': (96 / 25.4) * (96 / 25.4),
      'cm²': (96 / 2.54) * (96 / 2.54),
      'm²': (96 / 0.0254) * (96 / 0.0254)
    };

    return pixelArea / pixelsPerUnit[this.units];
  }

  private finalizeArea(): void {
    if (this.polygon.points.length >= 3) {
      console.log('Area measured:', this.polygon.displayValue);
    }
    this.resetArea();
  }

  private resetArea(): void {
    this.polygon = {
      points: [],
      isActive: false,
      area: 0,
      displayValue: ''
    };
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  public getPreviewGeometry(): any {
    if (this.polygon.isActive && this.polygon.points.length > 0) {
      const previewPoints = [...this.polygon.points];
      if (this.state.currentPoint) {
        previewPoints.push(this.state.currentPoint);
      }

      return {
        type: 'area-measurement',
        points: previewPoints,
        displayValue: this.polygon.displayValue,
        style: {
          fillColor: 'rgba(225, 29, 72, 0.1)',
          strokeColor: '#e11d48',
          strokeWidth: 2,
          textColor: '#e11d48',
          textSize: 12
        }
      };
    }
    return null;
  }
}

// Measure Angle Tool
export class MeasureAngleTool extends BaseTool {
  public id = 'measure-angle';
  public name = 'Measure Angle';
  public icon = '📐';
  public cursor = 'crosshair';
  public category = 'measurement' as const;

  private angle: {
    centerPoint: Point | null;
    firstPoint: Point | null;
    secondPoint: Point | null;
    isActive: boolean;
    step: 'center' | 'first' | 'second';
    angleValue: number;
    displayValue: string;
  } = {
    centerPoint: null,
    firstPoint: null,
    secondPoint: null,
    isActive: false,
    step: 'center',
    angleValue: 0,
    displayValue: ''
  };

  private units: 'degrees' | 'radians' = 'degrees';
  private precision = 1;

  public onMouseDown(point: Point, event: MouseEvent): void {
    switch (this.angle.step) {
      case 'center':
        this.angle.centerPoint = point;
        this.angle.step = 'first';
        this.angle.isActive = true;
        break;
      
      case 'first':
        this.angle.firstPoint = point;
        this.angle.step = 'second';
        break;
      
      case 'second':
        this.angle.secondPoint = point;
        this.finalizeAngle();
        break;
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.angle.isActive) {
      switch (this.angle.step) {
        case 'first':
          this.angle.firstPoint = point;
          break;
        
        case 'second':
          this.angle.secondPoint = point;
          this.updateAngle();
          break;
      }
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Angle measurement uses mouse down for state changes
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.resetAngle();
        break;
      
      case 'Backspace':
        if (this.angle.step === 'second') {
          this.angle.step = 'first';
          this.angle.firstPoint = null;
        } else if (this.angle.step === 'first') {
          this.resetAngle();
        }
        break;
    }
  }

  private updateAngle(): void {
    if (!this.angle.centerPoint || !this.angle.firstPoint || !this.angle.secondPoint) return;

    this.angle.angleValue = this.calculateAngle(
      this.angle.centerPoint,
      this.angle.firstPoint,
      this.angle.secondPoint
    );

    this.angle.displayValue = this.formatAngle(this.angle.angleValue);
  }

  private calculateAngle(center: Point, first: Point, second: Point): number {
    const vector1 = {
      x: first.x - center.x,
      y: first.y - center.y
    };

    const vector2 = {
      x: second.x - center.x,
      y: second.y - center.y
    };

    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cosAngle = dot / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return this.units === 'degrees' ? angleRad * (180 / Math.PI) : angleRad;
  }

  private formatAngle(angle: number): string {
    const symbol = this.units === 'degrees' ? '°' : ' rad';
    return `${angle.toFixed(this.precision)}${symbol}`;
  }

  private finalizeAngle(): void {
    if (this.angle.centerPoint && this.angle.firstPoint && this.angle.secondPoint) {
      console.log('Angle measured:', this.angle.displayValue);
    }
    this.resetAngle();
  }

  private resetAngle(): void {
    this.angle = {
      centerPoint: null,
      firstPoint: null,
      secondPoint: null,
      isActive: false,
      step: 'center',
      angleValue: 0,
      displayValue: ''
    };
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  public getPreviewGeometry(): any {
    if (this.angle.isActive) {
      return {
        type: 'angle-measurement',
        centerPoint: this.angle.centerPoint,
        firstPoint: this.angle.firstPoint,
        secondPoint: this.angle.secondPoint || this.state.currentPoint,
        displayValue: this.angle.displayValue,
        step: this.angle.step,
        style: {
          lineColor: '#e11d48',
          lineWidth: 2,
          arcColor: 'rgba(225, 29, 72, 0.3)',
          textColor: '#e11d48',
          textSize: 12
        }
      };
    }
    return null;
  }
}

// Coordinate Display Tool
export class CoordinateDisplayTool extends BaseTool {
  public id = 'coordinate-display';
  public name = 'Coordinate Display';
  public icon = '🎯';
  public cursor = 'crosshair';
  public category = 'measurement' as const;
  public shortcut = 'c';

  private coordinateDisplay = new CoordinateDisplaySystem();
  private isTracking = false;
  private currentCoordinates: { absolute: string; relative: string } | null = null;

  constructor() {
    super();
    // Set default options for architectural use
    this.coordinateDisplay.setOptions({
      units: 'ft',
      precision: 2,
      showAbsolute: true,
      showRelative: false,
      displayFormat: 'architectural'
    });
  }

  protected onActivate(): void {
    this.isTracking = true;
    document.body.style.cursor = 'crosshair';
  }

  protected onDeactivate(): void {
    this.isTracking = false;
    this.currentCoordinates = null;
    document.body.style.cursor = '';
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (event.shiftKey) {
      // Set reference point with Shift+Click
      this.coordinateDisplay.setReferencePoint(point);
      this.coordinateDisplay.setOptions({ showRelative: true });
    } else if (event.ctrlKey || event.metaKey) {
      // Clear reference point with Ctrl+Click
      this.coordinateDisplay.setReferencePoint(null);
      this.coordinateDisplay.setOptions({ showRelative: false });
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;
    
    if (this.isTracking) {
      this.currentCoordinates = this.coordinateDisplay.formatCoordinate(point);
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Coordinate display is passive, no action needed
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.coordinateDisplay.setReferencePoint(null);
        this.coordinateDisplay.setOptions({ showRelative: false });
        break;
      
      case 'r':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          // Toggle relative coordinate display
          const options = this.coordinateDisplay.getOptions();
          this.coordinateDisplay.setOptions({ showRelative: !options.showRelative });
        }
        break;
      
      case 'u':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.cycleUnits();
        }
        break;
      
      case 'f':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.cycleDisplayFormat();
        }
        break;
    }
  }

  private cycleUnits(): void {
    const units: Array<'px' | 'in' | 'ft' | 'mm' | 'cm' | 'm'> = ['ft', 'in', 'm', 'cm', 'mm', 'px'];
    const currentOptions = this.coordinateDisplay.getOptions();
    const currentIndex = units.indexOf(currentOptions.units);
    const nextIndex = (currentIndex + 1) % units.length;
    
    this.coordinateDisplay.setOptions({ units: units[nextIndex] });
  }

  private cycleDisplayFormat(): void {
    const formats: Array<'decimal' | 'fractional' | 'architectural'> = ['decimal', 'fractional', 'architectural'];
    const currentOptions = this.coordinateDisplay.getOptions();
    const currentIndex = formats.indexOf(currentOptions.displayFormat);
    const nextIndex = (currentIndex + 1) % formats.length;
    
    this.coordinateDisplay.setOptions({ displayFormat: formats[nextIndex] });
  }

  public setUnits(units: 'px' | 'in' | 'ft' | 'mm' | 'cm' | 'm'): void {
    this.coordinateDisplay.setOptions({ units });
  }

  public setPrecision(precision: number): void {
    this.coordinateDisplay.setOptions({ precision: Math.max(0, Math.min(6, precision)) });
  }

  public setDisplayFormat(format: 'decimal' | 'fractional' | 'architectural'): void {
    this.coordinateDisplay.setOptions({ displayFormat: format });
  }

  public getCurrentCoordinates(): { absolute: string; relative: string } | null {
    return this.currentCoordinates;
  }

  public getCoordinateDisplaySystem(): CoordinateDisplaySystem {
    return this.coordinateDisplay;
  }

  public getPreviewGeometry(): any {
    if (this.isTracking && this.state.currentPoint && this.currentCoordinates) {
      const options = this.coordinateDisplay.getOptions();
      
      return {
        type: 'coordinate-display',
        point: this.state.currentPoint,
        coordinates: this.currentCoordinates,
        referencePoint: options.referencePoint,
        showRelative: options.showRelative,
        style: {
          crosshairColor: '#2563eb',
          crosshairSize: 20,
          textColor: '#1f2937',
          textSize: 11,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#d1d5db',
          padding: 8
        }
      };
    }
    return null;
  }
}

// Enhanced Area Calculation Tool for Equipment Spacing
export class EquipmentSpacingTool extends BaseTool {
  public id = 'equipment-spacing';
  public name = 'Equipment Spacing';
  public icon = '📐';
  public cursor = 'crosshair';
  public category = 'measurement' as const;

  private spacing: {
    equipmentBounds: Rectangle[];
    isDefining: boolean;
    currentBounds: Rectangle | null;
    clearances: { [key: string]: number };
    violations: string[];
  } = {
    equipmentBounds: [],
    isDefining: false,
    currentBounds: null,
    clearances: {
      'working-space': 36, // 36 inches minimum working space (NEC 110.26)
      'equipment-separation': 6, // 6 inches between equipment
      'wall-clearance': 3 // 3 inches from wall
    },
    violations: []
  };

  private coordinateDisplay = new CoordinateDisplaySystem();

  constructor() {
    super();
    this.coordinateDisplay.setOptions({
      units: 'in',
      precision: 1,
      displayFormat: 'architectural'
    });
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.spacing.isDefining) {
      // Start defining equipment bounds
      this.spacing.currentBounds = {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0
      };
      this.spacing.isDefining = true;
      this.state.startPoint = point;
    } else {
      // Finish defining equipment bounds
      this.finalizeEquipmentBounds();
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.spacing.isDefining && this.spacing.currentBounds && this.state.startPoint) {
      // Update current bounds
      const startX = Math.min(this.state.startPoint.x, point.x);
      const startY = Math.min(this.state.startPoint.y, point.y);
      const width = Math.abs(point.x - this.state.startPoint.x);
      const height = Math.abs(point.y - this.state.startPoint.y);

      this.spacing.currentBounds = {
        x: startX,
        y: startY,
        width,
        height
      };
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    // Equipment spacing uses mouse down for state changes
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.resetSpacing();
        break;
      
      case 'Enter':
        if (this.spacing.isDefining) {
          event.preventDefault();
          this.finalizeEquipmentBounds();
        }
        break;
      
      case 'Backspace':
        if (this.spacing.equipmentBounds.length > 0) {
          event.preventDefault();
          this.spacing.equipmentBounds.pop();
          this.checkSpacingViolations();
        }
        break;
    }
  }

  private finalizeEquipmentBounds(): void {
    if (this.spacing.currentBounds && this.spacing.currentBounds.width > 0 && this.spacing.currentBounds.height > 0) {
      this.spacing.equipmentBounds.push({ ...this.spacing.currentBounds });
      this.checkSpacingViolations();
    }
    
    this.spacing.isDefining = false;
    this.spacing.currentBounds = null;
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  private checkSpacingViolations(): void {
    this.spacing.violations = [];
    
    for (let i = 0; i < this.spacing.equipmentBounds.length; i++) {
      for (let j = i + 1; j < this.spacing.equipmentBounds.length; j++) {
        const equipment1 = this.spacing.equipmentBounds[i];
        const equipment2 = this.spacing.equipmentBounds[j];
        
        const distance = this.calculateEquipmentDistance(equipment1, equipment2);
        const minDistance = this.convertToPixels(this.spacing.clearances['equipment-separation']);
        
        if (distance < minDistance) {
          this.spacing.violations.push(
            `Equipment ${i + 1} and ${j + 1} are too close: ${this.formatDistance(distance)} (min: ${this.spacing.clearances['equipment-separation']}in)`
          );
        }
      }
    }
  }

  private calculateEquipmentDistance(rect1: Rectangle, rect2: Rectangle): number {
    const center1 = {
      x: rect1.x + rect1.width / 2,
      y: rect1.y + rect1.height / 2
    };
    
    const center2 = {
      x: rect2.x + rect2.width / 2,
      y: rect2.y + rect2.height / 2
    };
    
    // Calculate edge-to-edge distance
    const dx = Math.max(0, Math.abs(center1.x - center2.x) - (rect1.width + rect2.width) / 2);
    const dy = Math.max(0, Math.abs(center1.y - center2.y) - (rect1.height + rect2.height) / 2);
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  private convertToPixels(inches: number): number {
    return inches * 96 / 12; // 96 pixels per inch, 12 inches per foot
  }

  private formatDistance(pixelDistance: number): string {
    const inches = pixelDistance * 12 / 96;
    return `${inches.toFixed(1)}"`;
  }

  private resetSpacing(): void {
    this.spacing = {
      equipmentBounds: [],
      isDefining: false,
      currentBounds: null,
      clearances: {
        'working-space': 36,
        'equipment-separation': 6,
        'wall-clearance': 3
      },
      violations: []
    };
    this.state.startPoint = null;
    this.state.currentPoint = null;
  }

  public setClearanceRequirement(type: string, inches: number): void {
    this.spacing.clearances[type] = inches;
    this.checkSpacingViolations();
  }

  public getSpacingViolations(): string[] {
    return [...this.spacing.violations];
  }

  public getPreviewGeometry(): any {
    const preview: any = {
      type: 'equipment-spacing',
      equipmentBounds: this.spacing.equipmentBounds,
      violations: this.spacing.violations,
      style: {
        equipmentColor: '#3b82f6',
        equipmentOpacity: 0.3,
        violationColor: '#ef4444',
        clearanceColor: '#10b981',
        strokeWidth: 2
      }
    };

    if (this.spacing.isDefining && this.spacing.currentBounds) {
      preview.currentBounds = this.spacing.currentBounds;
    }

    return preview;
  }
}