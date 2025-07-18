import type { 
  EditorPoint, 
  EditorMeasurement, 
  EditorAnnotation, 
  EditorState 
} from '../context/PhotoEditorContext';

export class PhotoEditorService {
  
  /**
   * Calculate distance between two points
   */
  static calculateDistance(p1: EditorPoint, p2: EditorPoint, scale?: number, unit: 'ft' | 'm' = 'ft'): number {
    const pixelDistance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    
    if (!scale || scale <= 0) {
      return pixelDistance; // Return pixel distance if no scale
    }
    
    // Convert pixel distance to real-world units
    // scale is pixels per unit, so divide pixels by scale to get real units
    const realDistance = pixelDistance / scale;
    
    // Round to reasonable precision
    return Math.round(realDistance * 100) / 100;
  }

  /**
   * Calculate area of a polygon
   */
  static calculateArea(points: EditorPoint[], scale?: number, unit: 'ft' | 'm' = 'ft'): number {
    if (points.length < 3) return 0;
    
    // Shoelace formula for polygon area
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    const pixelArea = Math.abs(area) / 2;
    
    if (!scale || scale <= 0) {
      return pixelArea; // Return pixel area if no scale
    }
    
    // Convert pixel area to real-world units
    // scale is pixels per unit, so area conversion is pixels^2 / (scale^2) = real_units^2
    const realArea = pixelArea / (scale * scale);
    
    // Round to reasonable precision
    return Math.round(realArea * 100) / 100;
  }

  /**
   * Calculate angle between three points
   */
  static calculateAngle(p1: EditorPoint, vertex: EditorPoint, p2: EditorPoint): number {
    const a = Math.sqrt(Math.pow(vertex.x - p1.x, 2) + Math.pow(vertex.y - p1.y, 2));
    const b = Math.sqrt(Math.pow(vertex.x - p2.x, 2) + Math.pow(vertex.y - p2.y, 2));
    const c = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    
    // Law of cosines
    const angleRad = Math.acos((a * a + b * b - c * c) / (2 * a * b));
    return (angleRad * 180) / Math.PI;
  }

  /**
   * Draw measurement on canvas
   */
  static drawMeasurement(
    ctx: CanvasRenderingContext2D, 
    measurement: EditorMeasurement, 
    zoom: number = 1,
    panOffset: EditorPoint = { x: 0, y: 0 }
  ): void {
    if (measurement.points.length === 0) return;

    ctx.save();
    
    // Apply zoom and pan
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);
    
    // Set style
    ctx.strokeStyle = measurement.style.stroke;
    ctx.lineWidth = measurement.style.strokeWidth / zoom;
    ctx.fillStyle = measurement.style.fill || 'rgba(255, 0, 0, 0.2)';

    switch (measurement.type) {
      case 'linear':
        this.drawLinearMeasurement(ctx, measurement);
        break;
      case 'area':
        this.drawAreaMeasurement(ctx, measurement);
        break;
      case 'angle':
        this.drawAngleMeasurement(ctx, measurement);
        break;
    }

    ctx.restore();
  }

  /**
   * Draw linear measurement
   */
  private static drawLinearMeasurement(ctx: CanvasRenderingContext2D, measurement: EditorMeasurement): void {
    if (measurement.points.length < 2) return;

    const [start, end] = measurement.points;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw end points
    this.drawPoint(ctx, start, 4);
    this.drawPoint(ctx, end, 4);

    // Draw distance label
    if (measurement.distance !== undefined) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      this.drawLabel(ctx, `${measurement.distance.toFixed(2)} ${measurement.unit}`, { x: midX, y: midY - 20 });
    }
  }

  /**
   * Draw area measurement
   */
  private static drawAreaMeasurement(ctx: CanvasRenderingContext2D, measurement: EditorMeasurement): void {
    if (measurement.points.length < 3) return;

    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(measurement.points[0].x, measurement.points[0].y);
    
    for (let i = 1; i < measurement.points.length; i++) {
      ctx.lineTo(measurement.points[i].x, measurement.points[i].y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw points
    measurement.points.forEach(point => {
      this.drawPoint(ctx, point, 4);
    });

    // Draw area label
    if (measurement.area !== undefined) {
      const centerX = measurement.points.reduce((sum, p) => sum + p.x, 0) / measurement.points.length;
      const centerY = measurement.points.reduce((sum, p) => sum + p.y, 0) / measurement.points.length;
      this.drawLabel(ctx, `${measurement.area.toFixed(2)} ${measurement.unit}²`, { x: centerX, y: centerY });
    }
  }

  /**
   * Draw angle measurement
   */
  private static drawAngleMeasurement(ctx: CanvasRenderingContext2D, measurement: EditorMeasurement): void {
    if (measurement.points.length < 3) return;

    const [p1, vertex, p2] = measurement.points;

    // Draw lines
    ctx.beginPath();
    ctx.moveTo(vertex.x, vertex.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.moveTo(vertex.x, vertex.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Draw arc
    const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
    const radius = 30;

    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, radius, angle1, angle2);
    ctx.stroke();

    // Draw points
    this.drawPoint(ctx, p1, 4);
    this.drawPoint(ctx, vertex, 6);
    this.drawPoint(ctx, p2, 4);

    // Draw angle label
    if (measurement.angle !== undefined) {
      const labelAngle = (angle1 + angle2) / 2;
      const labelX = vertex.x + Math.cos(labelAngle) * (radius + 15);
      const labelY = vertex.y + Math.sin(labelAngle) * (radius + 15);
      this.drawLabel(ctx, `${measurement.angle.toFixed(1)}°`, { x: labelX, y: labelY });
    }
  }

  /**
   * Draw annotation on canvas
   */
  static drawAnnotation(
    ctx: CanvasRenderingContext2D, 
    annotation: EditorAnnotation, 
    zoom: number = 1,
    panOffset: EditorPoint = { x: 0, y: 0 }
  ): void {
    if (annotation.points.length === 0) return;

    ctx.save();
    
    // Apply zoom and pan
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);
    
    // Set style
    ctx.strokeStyle = annotation.style.stroke;
    ctx.lineWidth = annotation.style.strokeWidth / zoom;
    ctx.fillStyle = annotation.style.fill || 'rgba(0, 0, 255, 0.2)';

    switch (annotation.type) {
      case 'text':
        this.drawTextAnnotation(ctx, annotation);
        break;
      case 'arrow':
        this.drawArrowAnnotation(ctx, annotation);
        break;
      case 'rectangle':
        this.drawRectangleAnnotation(ctx, annotation);
        break;
      case 'circle':
        this.drawCircleAnnotation(ctx, annotation);
        break;
      case 'line':
        this.drawLineAnnotation(ctx, annotation);
        break;
      case 'freehand':
        this.drawFreehandAnnotation(ctx, annotation);
        break;
    }

    ctx.restore();
  }

  /**
   * Draw text annotation
   */
  private static drawTextAnnotation(ctx: CanvasRenderingContext2D, annotation: EditorAnnotation): void {
    if (annotation.points.length === 0 || !annotation.text) return;

    const point = annotation.points[0];
    ctx.font = `${annotation.style.fontSize || 14}px ${annotation.style.fontFamily || 'Arial'}`;
    ctx.fillStyle = annotation.style.stroke;
    ctx.fillText(annotation.text, point.x, point.y);
  }

  /**
   * Draw arrow annotation
   */
  private static drawArrowAnnotation(ctx: CanvasRenderingContext2D, annotation: EditorAnnotation): void {
    if (annotation.points.length < 2) return;

    const [start, end] = annotation.points;
    const headLength = 15;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  /**
   * Draw rectangle annotation
   */
  private static drawRectangleAnnotation(ctx: CanvasRenderingContext2D, annotation: EditorAnnotation): void {
    if (annotation.points.length < 2) return;

    const [start, end] = annotation.points;
    const width = end.x - start.x;
    const height = end.y - start.y;

    ctx.fillRect(start.x, start.y, width, height);
    ctx.strokeRect(start.x, start.y, width, height);
  }

  /**
   * Draw circle annotation
   */
  private static drawCircleAnnotation(ctx: CanvasRenderingContext2D, annotation: EditorAnnotation): void {
    if (annotation.points.length < 2) return;

    const [center, edge] = annotation.points;
    const radius = this.calculateDistance(center, edge);

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Draw line annotation
   */
  private static drawLineAnnotation(ctx: CanvasRenderingContext2D, annotation: EditorAnnotation): void {
    if (annotation.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
    for (let i = 1; i < annotation.points.length; i++) {
      ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
    }
    ctx.stroke();
  }

  /**
   * Draw freehand annotation
   */
  private static drawFreehandAnnotation(ctx: CanvasRenderingContext2D, annotation: EditorAnnotation): void {
    if (annotation.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
    
    for (let i = 1; i < annotation.points.length; i++) {
      const prevPoint = annotation.points[i - 1];
      const currentPoint = annotation.points[i];
      const cpx = (prevPoint.x + currentPoint.x) / 2;
      const cpy = (prevPoint.y + currentPoint.y) / 2;
      
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, cpy);
    }
    
    ctx.stroke();
  }

  /**
   * Draw a point marker
   */
  private static drawPoint(ctx: CanvasRenderingContext2D, point: EditorPoint, radius: number): void {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  /**
   * Draw a text label
   */
  private static drawLabel(ctx: CanvasRenderingContext2D, text: string, point: EditorPoint): void {
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    
    const metrics = ctx.measureText(text);
    const padding = 4;
    
    // Draw background
    ctx.fillRect(
      point.x - metrics.width / 2 - padding,
      point.y - 12 - padding,
      metrics.width + 2 * padding,
      16 + 2 * padding
    );
    
    // Draw border
    ctx.strokeRect(
      point.x - metrics.width / 2 - padding,
      point.y - 12 - padding,
      metrics.width + 2 * padding,
      16 + 2 * padding
    );
    
    // Draw text
    ctx.fillStyle = 'black';
    ctx.fillText(text, point.x - metrics.width / 2, point.y);
  }

  /**
   * Export canvas as image
   */
  static exportAsImage(
    canvas: HTMLCanvasElement, 
    format: 'png' | 'jpeg' = 'png', 
    quality: number = 0.9
  ): string {
    return canvas.toDataURL(`image/${format}`, quality);
  }

  /**
   * Export canvas as blob
   */
  static exportAsBlob(
    canvas: HTMLCanvasElement, 
    format: 'png' | 'jpeg' = 'png', 
    quality: number = 0.9
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, `image/${format}`, quality);
    });
  }

  /**
   * Calculate optimal scale from Google Maps satellite image
   * This uses typical Google Maps zoom levels to estimate scale
   */
  static estimateScaleFromGoogleMaps(zoom: number, latitude: number, unit: 'ft' | 'm' = 'ft'): number {
    // Google Maps scale approximation
    // At zoom level z, the resolution is approximately 156543.03392 * cos(latitude) / (2^z) meters per pixel
    const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom);
    
    if (unit === 'ft') {
      // Convert meters to feet, then calculate pixels per foot
      const feetPerPixel = metersPerPixel * 3.28084;
      return 1 / feetPerPixel; // Pixels per foot
    } else {
      return 1 / metersPerPixel; // Pixels per meter
    }
  }

  /**
   * Get scale estimation for common image sizes and zoom levels
   */
  static getRecommendedScale(imageWidth: number, imageHeight: number, unit: 'ft' | 'm' = 'ft'): number {
    // For typical satellite images, assume reasonable defaults
    // This can be overridden by user calibration
    const assumedCoverageWidth = unit === 'ft' ? 500 : 150; // feet or meters
    return imageWidth / assumedCoverageWidth;
  }

  /**
   * Calibrate scale based on known measurement
   */
  static calibrateScale(
    pixelDistance: number, 
    realDistance: number, 
    unit: 'ft' | 'm' = 'ft'
  ): number {
    if (realDistance <= 0 || pixelDistance <= 0) return 1;
    return pixelDistance / realDistance;
  }

  /**
   * Validate and sanitize coordinates
   */
  static validatePoint(point: EditorPoint, canvasWidth: number, canvasHeight: number): EditorPoint {
    return {
      x: Math.max(0, Math.min(canvasWidth, point.x)),
      y: Math.max(0, Math.min(canvasHeight, point.y))
    };
  }

  /**
   * Generate unique ID for measurements/annotations
   */
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Draw selection highlight around points
   */
  static drawSelectionHighlight(
    ctx: CanvasRenderingContext2D,
    points: EditorPoint[],
    zoom: number = 1,
    panOffset: EditorPoint = { x: 0, y: 0 }
  ): void {
    if (points.length === 0) return;

    ctx.save();
    
    // Apply zoom and pan
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);
    
    // Draw selection outline
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    
    // Draw bounding box for multiple points
    if (points.length > 1) {
      const minX = Math.min(...points.map(p => p.x));
      const maxX = Math.max(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      const maxY = Math.max(...points.map(p => p.y));
      
      const padding = 10 / zoom;
      ctx.strokeRect(
        minX - padding,
        minY - padding,
        maxX - minX + 2 * padding,
        maxY - minY + 2 * padding
      );
    }
    
    // Draw selection handles on each point
    ctx.setLineDash([]);
    ctx.fillStyle = '#007bff';
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4 / zoom, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Check if a point is near any element
   */
  static findElementAtPoint(
    point: EditorPoint,
    measurements: EditorMeasurement[],
    annotations: EditorAnnotation[],
    tolerance: number = 10
  ): { type: 'measurement' | 'annotation'; id: string } | null {
    // Check measurements
    for (const measurement of measurements) {
      if (this.isPointNearElement(point, measurement.points, tolerance)) {
        return { type: 'measurement', id: measurement.id };
      }
    }
    
    // Check annotations
    for (const annotation of annotations) {
      if (this.isPointNearElement(point, annotation.points, tolerance)) {
        return { type: 'annotation', id: annotation.id };
      }
    }
    
    return null;
  }

  /**
   * Check if a point is near any of the element points
   */
  private static isPointNearElement(point: EditorPoint, elementPoints: EditorPoint[], tolerance: number): boolean {
    for (const elementPoint of elementPoints) {
      const distance = this.calculateDistance(point, elementPoint);
      if (distance <= tolerance) {
        return true;
      }
    }
    
    // For multi-point elements, also check if point is near any line segment
    if (elementPoints.length > 1) {
      for (let i = 0; i < elementPoints.length - 1; i++) {
        if (this.isPointNearLineSegment(point, elementPoints[i], elementPoints[i + 1], tolerance)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a point is near a line segment
   */
  private static isPointNearLineSegment(
    point: EditorPoint,
    lineStart: EditorPoint,
    lineEnd: EditorPoint,
    tolerance: number
  ): boolean {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return this.calculateDistance(point, lineStart) <= tolerance;
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));
    
    const closest = {
      x: lineStart.x + param * C,
      y: lineStart.y + param * D
    };
    
    return this.calculateDistance(point, closest) <= tolerance;
  }
}