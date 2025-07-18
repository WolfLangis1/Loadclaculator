/**
 * Advanced Hit Testing System for Professional SLD Canvas
 * 
 * Precise hit testing for complex component shapes with multi-select support
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Polygon {
  points: Point[];
}

export interface HitTestObject {
  id: string;
  type: 'component' | 'connection' | 'label' | 'handle';
  bounds: Rectangle;
  shape?: 'rectangle' | 'circle' | 'polygon' | 'path';
  shapeData?: Circle | Polygon | Point[];
  zIndex: number;
  selectable: boolean;
  locked: boolean;
  visible: boolean;
  tolerance?: number; // Hit test tolerance in pixels
}

export interface HitTestResult {
  object: HitTestObject;
  distance: number;
  point: Point;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class HitTestSystem {
  private objects: Map<string, HitTestObject> = new Map();
  private spatialIndex: Map<string, Set<string>> = new Map(); // Simple spatial indexing
  private gridSize: number = 100; // Grid size for spatial indexing

  public addObject(object: HitTestObject): void {
    this.objects.set(object.id, object);
    this.updateSpatialIndex(object);
  }

  public removeObject(id: string): void {
    const object = this.objects.get(id);
    if (object) {
      this.removeFromSpatialIndex(object);
      this.objects.delete(id);
    }
  }

  public updateObject(id: string, updates: Partial<HitTestObject>): void {
    const existing = this.objects.get(id);
    if (existing) {
      this.removeFromSpatialIndex(existing);
      const updated = { ...existing, ...updates };
      this.objects.set(id, updated);
      this.updateSpatialIndex(updated);
    }
  }

  public getObject(id: string): HitTestObject | undefined {
    return this.objects.get(id);
  }

  public clearObjects(): void {
    this.objects.clear();
    this.spatialIndex.clear();
  }

  private updateSpatialIndex(object: HitTestObject): void {
    const gridKeys = this.getGridKeys(object.bounds);
    gridKeys.forEach(key => {
      if (!this.spatialIndex.has(key)) {
        this.spatialIndex.set(key, new Set());
      }
      this.spatialIndex.get(key)!.add(object.id);
    });
  }

  private removeFromSpatialIndex(object: HitTestObject): void {
    const gridKeys = this.getGridKeys(object.bounds);
    gridKeys.forEach(key => {
      const cell = this.spatialIndex.get(key);
      if (cell) {
        cell.delete(object.id);
        if (cell.size === 0) {
          this.spatialIndex.delete(key);
        }
      }
    });
  }

  private getGridKeys(bounds: Rectangle): string[] {
    const keys: string[] = [];
    const startX = Math.floor(bounds.x / this.gridSize);
    const endX = Math.floor((bounds.x + bounds.width) / this.gridSize);
    const startY = Math.floor(bounds.y / this.gridSize);
    const endY = Math.floor((bounds.y + bounds.height) / this.gridSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        keys.push(`${x},${y}`);
      }
    }

    return keys;
  }

  private getCandidateObjects(point: Point): HitTestObject[] {
    const gridKey = `${Math.floor(point.x / this.gridSize)},${Math.floor(point.y / this.gridSize)}`;
    const candidateIds = this.spatialIndex.get(gridKey) || new Set();
    
    return Array.from(candidateIds)
      .map(id => this.objects.get(id))
      .filter((obj): obj is HitTestObject => obj !== undefined && obj.visible && obj.selectable);
  }

  public hitTest(point: Point): HitTestResult[] {
    const candidates = this.getCandidateObjects(point);
    const results: HitTestResult[] = [];

    for (const object of candidates) {
      const result = this.testObjectHit(object, point);
      if (result) {
        results.push(result);
      }
    }

    // Sort by z-index (highest first) and then by distance
    results.sort((a, b) => {
      if (a.object.zIndex !== b.object.zIndex) {
        return b.object.zIndex - a.object.zIndex;
      }
      return a.distance - b.distance;
    });

    return results;
  }

  public hitTestFirst(point: Point): HitTestResult | null {
    const results = this.hitTest(point);
    return results.length > 0 ? results[0] : null;
  }

  private testObjectHit(object: HitTestObject, point: Point): HitTestResult | null {
    if (object.locked || !object.visible || !object.selectable) {
      return null;
    }

    const tolerance = object.tolerance || 0;
    let hit = false;
    let distance = 0;

    switch (object.shape || 'rectangle') {
      case 'rectangle':
        hit = this.pointInRectangle(point, object.bounds, tolerance);
        distance = hit ? 0 : this.distanceToRectangle(point, object.bounds);
        break;

      case 'circle':
        if (object.shapeData && 'radius' in object.shapeData) {
          hit = this.pointInCircle(point, object.shapeData, tolerance);
          distance = hit ? 0 : this.distanceToCircle(point, object.shapeData);
        }
        break;

      case 'polygon':
        if (object.shapeData && 'points' in object.shapeData) {
          hit = this.pointInPolygon(point, object.shapeData.points);
          distance = hit ? 0 : this.distanceToPolygon(point, object.shapeData.points);
        }
        break;

      case 'path':
        if (object.shapeData && Array.isArray(object.shapeData)) {
          hit = this.pointNearPath(point, object.shapeData, tolerance || 5);
          distance = hit ? 0 : this.distanceToPath(point, object.shapeData);
        }
        break;
    }

    if (hit || distance <= tolerance) {
      return {
        object,
        distance,
        point
      };
    }

    return null;
  }

  private pointInRectangle(point: Point, rect: Rectangle, tolerance: number = 0): boolean {
    return point.x >= rect.x - tolerance &&
           point.x <= rect.x + rect.width + tolerance &&
           point.y >= rect.y - tolerance &&
           point.y <= rect.y + rect.height + tolerance;
  }

  private distanceToRectangle(point: Point, rect: Rectangle): number {
    const dx = Math.max(0, Math.max(rect.x - point.x, point.x - (rect.x + rect.width)));
    const dy = Math.max(0, Math.max(rect.y - point.y, point.y - (rect.y + rect.height)));
    return Math.sqrt(dx * dx + dy * dy);
  }

  private pointInCircle(point: Point, circle: Circle, tolerance: number = 0): boolean {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= circle.radius + tolerance;
  }

  private distanceToCircle(point: Point, circle: Circle): number {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, distance - circle.radius);
  }

  private pointInPolygon(point: Point, vertices: Point[]): boolean {
    let inside = false;
    const x = point.x;
    const y = point.y;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  private distanceToPolygon(point: Point, vertices: Point[]): number {
    let minDistance = Infinity;

    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const distance = this.distanceToLineSegment(point, vertices[i], vertices[j]);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private pointNearPath(point: Point, path: Point[], tolerance: number): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const distance = this.distanceToLineSegment(point, path[i], path[i + 1]);
      if (distance <= tolerance) {
        return true;
      }
    }
    return false;
  }

  private distanceToPath(point: Point, path: Point[]): number {
    let minDistance = Infinity;

    for (let i = 0; i < path.length - 1; i++) {
      const distance = this.distanceToLineSegment(point, path[i], path[i + 1]);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      // Line segment is a point
      const px = point.x - lineStart.x;
      const py = point.y - lineStart.y;
      return Math.sqrt(px * px + py * py);
    }

    // Calculate the parameter t for the closest point on the line
    const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)));

    // Find the closest point on the line segment
    const closestX = lineStart.x + t * dx;
    const closestY = lineStart.y + t * dy;

    // Calculate distance to the closest point
    const distX = point.x - closestX;
    const distY = point.y - closestY;
    return Math.sqrt(distX * distX + distY * distY);
  }

  public rectangleSelect(selectionBounds: SelectionBounds): HitTestResult[] {
    const results: HitTestResult[] = [];

    for (const object of this.objects.values()) {
      if (!object.visible || !object.selectable || object.locked) {
        continue;
      }

      if (this.rectangleIntersectsObject(selectionBounds, object)) {
        results.push({
          object,
          distance: 0,
          point: { x: object.bounds.x, y: object.bounds.y }
        });
      }
    }

    // Sort by z-index
    results.sort((a, b) => b.object.zIndex - a.object.zIndex);

    return results;
  }

  private rectangleIntersectsObject(selectionBounds: SelectionBounds, object: HitTestObject): boolean {
    switch (object.shape || 'rectangle') {
      case 'rectangle':
        return this.rectanglesIntersect(selectionBounds, object.bounds);

      case 'circle':
        if (object.shapeData && 'radius' in object.shapeData) {
          return this.rectangleIntersectsCircle(selectionBounds, object.shapeData);
        }
        break;

      case 'polygon':
        if (object.shapeData && 'points' in object.shapeData) {
          return this.rectangleIntersectsPolygon(selectionBounds, object.shapeData.points);
        }
        break;

      case 'path':
        if (object.shapeData && Array.isArray(object.shapeData)) {
          return this.rectangleIntersectsPath(selectionBounds, object.shapeData);
        }
        break;
    }

    return false;
  }

  private rectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }

  private rectangleIntersectsCircle(rect: Rectangle, circle: Circle): boolean {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    
    return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
  }

  private rectangleIntersectsPolygon(rect: Rectangle, vertices: Point[]): boolean {
    // Check if any vertex is inside the rectangle
    for (const vertex of vertices) {
      if (this.pointInRectangle(vertex, rect)) {
        return true;
      }
    }

    // Check if any edge intersects the rectangle
    const rectCorners = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];

    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      for (let k = 0; k < rectCorners.length; k++) {
        const l = (k + 1) % rectCorners.length;
        if (this.lineSegmentsIntersect(vertices[i], vertices[j], rectCorners[k], rectCorners[l])) {
          return true;
        }
      }
    }

    return false;
  }

  private rectangleIntersectsPath(rect: Rectangle, path: Point[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      if (this.rectangleIntersectsLineSegment(rect, path[i], path[i + 1])) {
        return true;
      }
    }
    return false;
  }

  private rectangleIntersectsLineSegment(rect: Rectangle, lineStart: Point, lineEnd: Point): boolean {
    // Check if either endpoint is inside the rectangle
    if (this.pointInRectangle(lineStart, rect) || this.pointInRectangle(lineEnd, rect)) {
      return true;
    }

    // Check if the line segment intersects any edge of the rectangle
    const rectEdges = [
      [{ x: rect.x, y: rect.y }, { x: rect.x + rect.width, y: rect.y }],
      [{ x: rect.x + rect.width, y: rect.y }, { x: rect.x + rect.width, y: rect.y + rect.height }],
      [{ x: rect.x + rect.width, y: rect.y + rect.height }, { x: rect.x, y: rect.y + rect.height }],
      [{ x: rect.x, y: rect.y + rect.height }, { x: rect.x, y: rect.y }]
    ];

    for (const [edgeStart, edgeEnd] of rectEdges) {
      if (this.lineSegmentsIntersect(lineStart, lineEnd, edgeStart, edgeEnd)) {
        return true;
      }
    }

    return false;
  }

  private lineSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    
    if (denominator === 0) {
      return false; // Lines are parallel
    }

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  public getObjectsInBounds(bounds: Rectangle): HitTestObject[] {
    const results: HitTestObject[] = [];

    for (const object of this.objects.values()) {
      if (this.rectanglesIntersect(bounds, object.bounds)) {
        results.push(object);
      }
    }

    return results;
  }

  public getStats(): {
    totalObjects: number;
    spatialCells: number;
    averageObjectsPerCell: number;
  } {
    const totalObjects = this.objects.size;
    const spatialCells = this.spatialIndex.size;
    const totalObjectsInCells = Array.from(this.spatialIndex.values())
      .reduce((sum, cell) => sum + cell.size, 0);
    
    return {
      totalObjects,
      spatialCells,
      averageObjectsPerCell: spatialCells > 0 ? totalObjectsInCells / spatialCells : 0
    };
  }

  public dispose(): void {
    this.objects.clear();
    this.spatialIndex.clear();
  }
}