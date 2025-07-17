/**
 * Real-time Distance and Area Measurement Tools
 * 
 * Provides professional CAD-style measurement capabilities including:
 * - Linear distance measurements
 * - Angular measurements
 * - Area and perimeter calculations
 * - Running dimension chains
 * - Coordinate display
 * - Unit conversion and precision control
 * - GPS coordinate integration
 * 
 * Consolidated from: advancedMeasurementService.ts
 * for better organization and reduced duplication
 */

export interface Point {
  x: number;
  y: number;
}

export interface MeasurementUnit {
  id: string;
  name: string;
  symbol: string;
  scaleFactor: number; // Conversion factor to base unit (pixels)
  precision: number; // Decimal places
  category: 'length' | 'area' | 'angle';
}

export interface LinearMeasurement {
  id: string;
  type: 'linear';
  startPoint: Point;
  endPoint: Point;
  distance: number;
  displayDistance: string;
  unit: MeasurementUnit;
  label?: string;
  style: MeasurementStyle;
  visible: boolean;
  locked: boolean;
}

export interface AngularMeasurement {
  id: string;
  type: 'angular';
  centerPoint: Point;
  startPoint: Point;
  endPoint: Point;
  angle: number; // In radians
  displayAngle: string;
  unit: MeasurementUnit;
  label?: string;
  style: MeasurementStyle;
  visible: boolean;
  locked: boolean;
}

export interface AreaMeasurement {
  id: string;
  type: 'area';
  points: Point[];
  area: number;
  perimeter: number;
  displayArea: string;
  displayPerimeter: string;
  areaUnit: MeasurementUnit;
  lengthUnit: MeasurementUnit;
  label?: string;
  style: MeasurementStyle;
  visible: boolean;
  locked: boolean;
}

export interface CoordinateMeasurement {
  id: string;
  type: 'coordinate';
  point: Point;
  displayX: string;
  displayY: string;
  unit: MeasurementUnit;
  label?: string;
  style: MeasurementStyle;
  visible: boolean;
  locked: boolean;
}

export type Measurement = LinearMeasurement | AngularMeasurement | AreaMeasurement | CoordinateMeasurement;

export interface MeasurementStyle {
  color: string;
  lineWidth: number;
  textSize: number;
  textColor: string;
  arrowStyle: 'none' | 'arrow' | 'dot' | 'tick';
  arrowSize: number;
  extensionLength: number;
  textOffset: number;
  showLabel: boolean;
  showValue: boolean;
  showUnit: boolean;
}

export interface MeasurementSettings {
  defaultUnit: string;
  precision: number;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapTolerance: number;
  realTimeUpdate: boolean;
  showCoordinates: boolean;
  coordinateOrigin: Point;
}

export class SLDMeasurementService {
  private measurements: Map<string, Measurement> = new Map();
  private units: Map<string, MeasurementUnit> = new Map();
  private settings: MeasurementSettings;
  private defaultStyle: MeasurementStyle;

  constructor() {
    this.settings = {
      defaultUnit: 'feet',
      precision: 2,
      showGrid: false,
      gridSize: 12, // 1 foot in pixels
      snapToGrid: false,
      snapTolerance: 5,
      realTimeUpdate: true,
      showCoordinates: false,
      coordinateOrigin: { x: 0, y: 0 }
    };

    this.defaultStyle = {
      color: '#2563eb',
      lineWidth: 1,
      textSize: 10,
      textColor: '#1f2937',
      arrowStyle: 'arrow',
      arrowSize: 8,
      extensionLength: 10,
      textOffset: 15,
      showLabel: true,
      showValue: true,
      showUnit: true
    };

    this.initializeUnits();
  }

  /**
   * Initialize standard measurement units
   */
  private initializeUnits(): void {
    const standardUnits: MeasurementUnit[] = [
      // Length units (base: pixels, 1 foot = 12 pixels default)
      {
        id: 'pixels',
        name: 'Pixels',
        symbol: 'px',
        scaleFactor: 1,
        precision: 0,
        category: 'length'
      },
      {
        id: 'inches',
        name: 'Inches',
        symbol: '"',
        scaleFactor: 1, // 1 pixel = 1 inch for electrical drawings
        precision: 2,
        category: 'length'
      },
      {
        id: 'feet',
        name: 'Feet',
        symbol: "'",
        scaleFactor: 12, // 12 pixels = 1 foot
        precision: 2,
        category: 'length'
      },
      {
        id: 'meters',
        name: 'Meters',
        symbol: 'm',
        scaleFactor: 39.37, // Approximate pixels per meter
        precision: 3,
        category: 'length'
      },
      {
        id: 'millimeters',
        name: 'Millimeters',
        symbol: 'mm',
        scaleFactor: 0.03937, // Approximate pixels per mm
        precision: 1,
        category: 'length'
      },
      
      // Area units
      {
        id: 'square_inches',
        name: 'Square Inches',
        symbol: 'in²',
        scaleFactor: 1,
        precision: 2,
        category: 'area'
      },
      {
        id: 'square_feet',
        name: 'Square Feet',
        symbol: 'ft²',
        scaleFactor: 144, // 144 square pixels = 1 square foot
        precision: 2,
        category: 'area'
      },
      {
        id: 'square_meters',
        name: 'Square Meters',
        symbol: 'm²',
        scaleFactor: 1550, // Approximate
        precision: 3,
        category: 'area'
      },
      
      // Angular units
      {
        id: 'degrees',
        name: 'Degrees',
        symbol: '°',
        scaleFactor: 180 / Math.PI,
        precision: 1,
        category: 'angle'
      },
      {
        id: 'radians',
        name: 'Radians',
        symbol: 'rad',
        scaleFactor: 1,
        precision: 3,
        category: 'angle'
      }
    ];

    standardUnits.forEach(unit => {
      this.units.set(unit.id, unit);
    });
  }

  /**
   * Create linear distance measurement
   */
  createLinearMeasurement(
    startPoint: Point,
    endPoint: Point,
    options: {
      unit?: string;
      label?: string;
      style?: Partial<MeasurementStyle>;
    } = {}
  ): string {
    const id = `linear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const unit = this.units.get(options.unit || this.settings.defaultUnit) || this.units.get('feet')!;
    const style = { ...this.defaultStyle, ...options.style };

    const distance = this.calculateDistance(startPoint, endPoint);
    const displayDistance = this.formatDistance(distance, unit);

    const measurement: LinearMeasurement = {
      id,
      type: 'linear',
      startPoint: this.snapPoint(startPoint),
      endPoint: this.snapPoint(endPoint),
      distance,
      displayDistance,
      unit,
      label: options.label,
      style,
      visible: true,
      locked: false
    };

    this.measurements.set(id, measurement);
    return id;
  }

  /**
   * Create angular measurement
   */
  createAngularMeasurement(
    centerPoint: Point,
    startPoint: Point,
    endPoint: Point,
    options: {
      unit?: string;
      label?: string;
      style?: Partial<MeasurementStyle>;
    } = {}
  ): string {
    const id = `angular_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const unit = this.units.get(options.unit || 'degrees') || this.units.get('degrees')!;
    const style = { ...this.defaultStyle, ...options.style };

    const angle = this.calculateAngle(centerPoint, startPoint, endPoint);
    const displayAngle = this.formatAngle(angle, unit);

    const measurement: AngularMeasurement = {
      id,
      type: 'angular',
      centerPoint: this.snapPoint(centerPoint),
      startPoint: this.snapPoint(startPoint),
      endPoint: this.snapPoint(endPoint),
      angle,
      displayAngle,
      unit,
      label: options.label,
      style,
      visible: true,
      locked: false
    };

    this.measurements.set(id, measurement);
    return id;
  }

  /**
   * Create area measurement
   */
  createAreaMeasurement(
    points: Point[],
    options: {
      lengthUnit?: string;
      areaUnit?: string;
      label?: string;
      style?: Partial<MeasurementStyle>;
    } = {}
  ): string {
    const id = `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lengthUnit = this.units.get(options.lengthUnit || this.settings.defaultUnit) || this.units.get('feet')!;
    const areaUnit = this.units.get(options.areaUnit || 'square_feet') || this.units.get('square_feet')!;
    const style = { ...this.defaultStyle, ...options.style };

    const snappedPoints = points.map(p => this.snapPoint(p));
    const area = this.calculateArea(snappedPoints);
    const perimeter = this.calculatePerimeter(snappedPoints);

    const displayArea = this.formatArea(area, areaUnit);
    const displayPerimeter = this.formatDistance(perimeter, lengthUnit);

    const measurement: AreaMeasurement = {
      id,
      type: 'area',
      points: snappedPoints,
      area,
      perimeter,
      displayArea,
      displayPerimeter,
      areaUnit,
      lengthUnit,
      label: options.label,
      style,
      visible: true,
      locked: false
    };

    this.measurements.set(id, measurement);
    return id;
  }

  /**
   * Create coordinate measurement
   */
  createCoordinateMeasurement(
    point: Point,
    options: {
      unit?: string;
      label?: string;
      style?: Partial<MeasurementStyle>;
    } = {}
  ): string {
    const id = `coordinate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const unit = this.units.get(options.unit || this.settings.defaultUnit) || this.units.get('feet')!;
    const style = { ...this.defaultStyle, ...options.style };

    const snappedPoint = this.snapPoint(point);
    const relativePoint = {
      x: snappedPoint.x - this.settings.coordinateOrigin.x,
      y: snappedPoint.y - this.settings.coordinateOrigin.y
    };

    const displayX = this.formatDistance(Math.abs(relativePoint.x), unit);
    const displayY = this.formatDistance(Math.abs(relativePoint.y), unit);

    const measurement: CoordinateMeasurement = {
      id,
      type: 'coordinate',
      point: snappedPoint,
      displayX,
      displayY,
      unit,
      label: options.label,
      style,
      visible: true,
      locked: false
    };

    this.measurements.set(id, measurement);
    return id;
  }

  /**
   * Update existing measurement
   */
  updateMeasurement(id: string, updates: Partial<Measurement>): boolean {
    const measurement = this.measurements.get(id);
    if (!measurement || measurement.locked) return false;

    const updatedMeasurement = { ...measurement, ...updates };

    // Recalculate values based on type
    switch (updatedMeasurement.type) {
      case 'linear':
        const linearMeas = updatedMeasurement as LinearMeasurement;
        if (updates.startPoint || updates.endPoint) {
          linearMeas.distance = this.calculateDistance(linearMeas.startPoint, linearMeas.endPoint);
          linearMeas.displayDistance = this.formatDistance(linearMeas.distance, linearMeas.unit);
        }
        break;

      case 'angular':
        const angularMeas = updatedMeasurement as AngularMeasurement;
        if (updates.centerPoint || updates.startPoint || updates.endPoint) {
          angularMeas.angle = this.calculateAngle(
            angularMeas.centerPoint,
            angularMeas.startPoint,
            angularMeas.endPoint
          );
          angularMeas.displayAngle = this.formatAngle(angularMeas.angle, angularMeas.unit);
        }
        break;

      case 'area':
        const areaMeas = updatedMeasurement as AreaMeasurement;
        if (updates.points) {
          areaMeas.area = this.calculateArea(areaMeas.points);
          areaMeas.perimeter = this.calculatePerimeter(areaMeas.points);
          areaMeas.displayArea = this.formatArea(areaMeas.area, areaMeas.areaUnit);
          areaMeas.displayPerimeter = this.formatDistance(areaMeas.perimeter, areaMeas.lengthUnit);
        }
        break;

      case 'coordinate':
        const coordMeas = updatedMeasurement as CoordinateMeasurement;
        if (updates.point) {
          const relativePoint = {
            x: coordMeas.point.x - this.settings.coordinateOrigin.x,
            y: coordMeas.point.y - this.settings.coordinateOrigin.y
          };
          coordMeas.displayX = this.formatDistance(Math.abs(relativePoint.x), coordMeas.unit);
          coordMeas.displayY = this.formatDistance(Math.abs(relativePoint.y), coordMeas.unit);
        }
        break;
    }

    this.measurements.set(id, updatedMeasurement);
    return true;
  }

  /**
   * Delete measurement
   */
  deleteMeasurement(id: string): boolean {
    const measurement = this.measurements.get(id);
    if (!measurement || measurement.locked) return false;

    return this.measurements.delete(id);
  }

  /**
   * Get measurement by ID
   */
  getMeasurement(id: string): Measurement | null {
    return this.measurements.get(id) || null;
  }

  /**
   * Get all measurements
   */
  getAllMeasurements(): Measurement[] {
    return Array.from(this.measurements.values());
  }

  /**
   * Get measurements by type
   */
  getMeasurementsByType<T extends Measurement['type']>(type: T): Array<Extract<Measurement, { type: T }>> {
    return Array.from(this.measurements.values()).filter(
      m => m.type === type
    ) as Array<Extract<Measurement, { type: T }>>;
  }

  /**
   * Get visible measurements
   */
  getVisibleMeasurements(): Measurement[] {
    return Array.from(this.measurements.values()).filter(m => m.visible);
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngle(center: Point, start: Point, end: Point): number {
    const startVector = { x: start.x - center.x, y: start.y - center.y };
    const endVector = { x: end.x - center.x, y: end.y - center.y };

    const startAngle = Math.atan2(startVector.y, startVector.x);
    const endAngle = Math.atan2(endVector.y, endVector.x);

    let angle = endAngle - startAngle;
    
    // Normalize to 0-2π range
    if (angle < 0) angle += 2 * Math.PI;
    if (angle > 2 * Math.PI) angle -= 2 * Math.PI;

    return angle;
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private calculateArea(points: Point[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Calculate polygon perimeter
   */
  private calculatePerimeter(points: Point[]): number {
    if (points.length < 2) return 0;

    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += this.calculateDistance(points[i], points[j]);
    }
    return perimeter;
  }

  /**
   * Format distance for display
   */
  private formatDistance(distance: number, unit: MeasurementUnit): string {
    const convertedDistance = distance / unit.scaleFactor;
    return `${convertedDistance.toFixed(unit.precision)}${unit.symbol}`;
  }

  /**
   * Format angle for display
   */
  private formatAngle(angle: number, unit: MeasurementUnit): string {
    const convertedAngle = angle * unit.scaleFactor;
    return `${convertedAngle.toFixed(unit.precision)}${unit.symbol}`;
  }

  /**
   * Format area for display
   */
  private formatArea(area: number, unit: MeasurementUnit): string {
    const convertedArea = area / unit.scaleFactor;
    return `${convertedArea.toFixed(unit.precision)}${unit.symbol}`;
  }

  /**
   * Snap point to grid if enabled
   */
  private snapPoint(point: Point): Point {
    if (!this.settings.snapToGrid) return point;

    const gridSize = this.settings.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  /**
   * Find nearest snap point
   */
  findNearestSnapPoint(point: Point, candidates: Point[]): Point | null {
    if (!this.settings.snapToGrid) return null;

    let nearest: Point | null = null;
    let minDistance = this.settings.snapTolerance;

    for (const candidate of candidates) {
      const distance = this.calculateDistance(point, candidate);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = candidate;
      }
    }

    return nearest;
  }

  /**
   * Toggle measurement visibility
   */
  toggleVisibility(id: string): boolean {
    const measurement = this.measurements.get(id);
    if (!measurement) return false;

    measurement.visible = !measurement.visible;
    return measurement.visible;
  }

  /**
   * Lock/unlock measurement
   */
  toggleLock(id: string): boolean {
    const measurement = this.measurements.get(id);
    if (!measurement) return false;

    measurement.locked = !measurement.locked;
    return measurement.locked;
  }

  /**
   * Clear all measurements
   */
  clearAllMeasurements(): void {
    this.measurements.clear();
  }

  /**
   * Get available units by category
   */
  getUnitsByCategory(category: MeasurementUnit['category']): MeasurementUnit[] {
    return Array.from(this.units.values()).filter(unit => unit.category === category);
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<MeasurementSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Update coordinate origin for existing coordinate measurements
    if (newSettings.coordinateOrigin) {
      this.getMeasurementsByType('coordinate').forEach(measurement => {
        this.updateMeasurement(measurement.id, {});
      });
    }
  }

  /**
   * Get current settings
   */
  getSettings(): MeasurementSettings {
    return { ...this.settings };
  }

  /**
   * Export measurements
   */
  exportMeasurements(): {
    measurements: Measurement[];
    settings: MeasurementSettings;
    units: MeasurementUnit[];
  } {
    return {
      measurements: this.getAllMeasurements(),
      settings: this.getSettings(),
      units: Array.from(this.units.values())
    };
  }

  /**
   * Import measurements
   */
  importMeasurements(data: {
    measurements?: Measurement[];
    settings?: Partial<MeasurementSettings>;
    units?: MeasurementUnit[];
  }): void {
    if (data.measurements) {
      this.measurements.clear();
      data.measurements.forEach(measurement => {
        this.measurements.set(measurement.id, measurement);
      });
    }

    if (data.settings) {
      this.updateSettings(data.settings);
    }

    if (data.units) {
      data.units.forEach(unit => {
        this.units.set(unit.id, unit);
      });
    }
  }

  /**
   * Get measurement statistics
   */
  getMeasurementStatistics(): {
    totalMeasurements: number;
    byType: Record<string, number>;
    totalDistance: number;
    totalArea: number;
    averageDistance: number;
  } {
    const measurements = this.getAllMeasurements();
    const byType: Record<string, number> = {};
    let totalDistance = 0;
    let totalArea = 0;
    let distanceCount = 0;

    measurements.forEach(measurement => {
      byType[measurement.type] = (byType[measurement.type] || 0) + 1;

      if (measurement.type === 'linear') {
        totalDistance += measurement.distance;
        distanceCount++;
      } else if (measurement.type === 'area') {
        totalArea += measurement.area;
        totalDistance += measurement.perimeter;
        distanceCount++;
      }
    });

    return {
      totalMeasurements: measurements.length,
      byType,
      totalDistance,
      totalArea,
      averageDistance: distanceCount > 0 ? totalDistance / distanceCount : 0
    };
  }
}

export default SLDMeasurementService;