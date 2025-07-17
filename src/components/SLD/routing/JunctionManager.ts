/**
 * Junction Point Management System
 * 
 * Manages wire intersections, junctions, and connection points
 */

export interface Point {
  x: number;
  y: number;
}

export interface Junction {
  id: string;
  position: Point;
  connectedWires: string[];
  junctionType: 'T' | 'cross' | 'corner' | 'terminal';
  style: JunctionStyle;
  locked: boolean;
}

export interface JunctionStyle {
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'diamond';
  showLabel: boolean;
  labelText?: string;
}

export interface WireIntersection {
  point: Point;
  wire1Id: string;
  wire2Id: string;
  needsJunction: boolean;
  junctionId?: string;
}

export class JunctionManager {
  private junctions: Map<string, Junction> = new Map();
  private wireSegments: Map<string, { start: Point; end: Point; wireId: string }[]> = new Map();
  private intersectionTolerance: number = 2;
  
  // Event callbacks
  private onJunctionCreate?: (junction: Junction) => void;
  private onJunctionUpdate?: (junction: Junction) => void;
  private onJunctionDelete?: (junctionId: string) => void;

  constructor(tolerance: number = 2) {
    this.intersectionTolerance = tolerance;
  }

  public setJunctionCreateCallback(callback: (junction: Junction) => void): void {
    this.onJunctionCreate = callback;
  }

  public setJunctionUpdateCallback(callback: (junction: Junction) => void): void {
    this.onJunctionUpdate = callback;
  }

  public setJunctionDeleteCallback(callback: (junctionId: string) => void): void {
    this.onJunctionDelete = callback;
  }

  public addWire(wireId: string, segments: { start: Point; end: Point }[]): void {
    const wireSegments = segments.map(seg => ({
      ...seg,
      wireId
    }));
    
    this.wireSegments.set(wireId, wireSegments);
    this.updateIntersections();
  }

  public removeWire(wireId: string): void {
    this.wireSegments.delete(wireId);
    
    // Remove junctions that only connected to this wire
    const junctionsToRemove: string[] = [];
    
    for (const [junctionId, junction] of this.junctions) {
      junction.connectedWires = junction.connectedWires.filter(id => id !== wireId);
      
      if (junction.connectedWires.length < 2) {
        junctionsToRemove.push(junctionId);
      } else {
        this.onJunctionUpdate?.(junction);
      }
    }
    
    junctionsToRemove.forEach(id => this.removeJunction(id));
    this.updateIntersections();
  }

  public updateWire(wireId: string, segments: { start: Point; end: Point }[]): void {
    this.removeWire(wireId);
    this.addWire(wireId, segments);
  }

  public createJunction(position: Point, connectedWires: string[], type?: Junction['junctionType']): string {
    const junctionId = this.generateJunctionId();
    
    const junction: Junction = {
      id: junctionId,
      position,
      connectedWires: [...connectedWires],
      junctionType: type || this.determineJunctionType(connectedWires.length),
      style: this.getDefaultJunctionStyle(),
      locked: false
    };

    this.junctions.set(junctionId, junction);
    this.onJunctionCreate?.(junction);
    
    return junctionId;
  }

  public removeJunction(junctionId: string): void {
    if (this.junctions.has(junctionId)) {
      this.junctions.delete(junctionId);
      this.onJunctionDelete?.(junctionId);
    }
  }

  public moveJunction(junctionId: string, newPosition: Point): void {
    const junction = this.junctions.get(junctionId);
    if (junction && !junction.locked) {
      junction.position = newPosition;
      this.onJunctionUpdate?.(junction);
    }
  }

  public getJunction(junctionId: string): Junction | undefined {
    return this.junctions.get(junctionId);
  }

  public getAllJunctions(): Junction[] {
    return Array.from(this.junctions.values());
  }

  public getJunctionsForWire(wireId: string): Junction[] {
    return Array.from(this.junctions.values())
      .filter(junction => junction.connectedWires.includes(wireId));
  }

  public findIntersections(): WireIntersection[] {
    const intersections: WireIntersection[] = [];
    const wireIds = Array.from(this.wireSegments.keys());

    for (let i = 0; i < wireIds.length; i++) {
      for (let j = i + 1; j < wireIds.length; j++) {
        const wire1Id = wireIds[i];
        const wire2Id = wireIds[j];
        const wire1Segments = this.wireSegments.get(wire1Id) || [];
        const wire2Segments = this.wireSegments.get(wire2Id) || [];

        for (const seg1 of wire1Segments) {
          for (const seg2 of wire2Segments) {
            const intersection = this.findSegmentIntersection(seg1, seg2);
            if (intersection) {
              const existingJunction = this.findJunctionAtPoint(intersection);
              
              intersections.push({
                point: intersection,
                wire1Id,
                wire2Id,
                needsJunction: !existingJunction,
                junctionId: existingJunction?.id
              });
            }
          }
        }
      }
    }

    return intersections;
  }

  private findSegmentIntersection(
    seg1: { start: Point; end: Point },
    seg2: { start: Point; end: Point }
  ): Point | null {
    // Check if segments are orthogonal (one horizontal, one vertical)
    const seg1IsHorizontal = Math.abs(seg1.start.y - seg1.end.y) < this.intersectionTolerance;
    const seg1IsVertical = Math.abs(seg1.start.x - seg1.end.x) < this.intersectionTolerance;
    const seg2IsHorizontal = Math.abs(seg2.start.y - seg2.end.y) < this.intersectionTolerance;
    const seg2IsVertical = Math.abs(seg2.start.x - seg2.end.x) < this.intersectionTolerance;

    if (seg1IsHorizontal && seg2IsVertical) {
      return this.findOrthogonalIntersection(seg1, seg2, 'horizontal', 'vertical');
    } else if (seg1IsVertical && seg2IsHorizontal) {
      return this.findOrthogonalIntersection(seg2, seg1, 'horizontal', 'vertical');
    }

    // For non-orthogonal intersections, use general line intersection
    return this.findGeneralIntersection(seg1, seg2);
  }

  private findOrthogonalIntersection(
    horizontalSeg: { start: Point; end: Point },
    verticalSeg: { start: Point; end: Point },
    type1: string,
    type2: string
  ): Point | null {
    const hY = horizontalSeg.start.y;
    const hMinX = Math.min(horizontalSeg.start.x, horizontalSeg.end.x);
    const hMaxX = Math.max(horizontalSeg.start.x, horizontalSeg.end.x);
    
    const vX = verticalSeg.start.x;
    const vMinY = Math.min(verticalSeg.start.y, verticalSeg.end.y);
    const vMaxY = Math.max(verticalSeg.start.y, verticalSeg.end.y);

    // Check if intersection point is within both segments
    if (vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY) {
      return { x: vX, y: hY };
    }

    return null;
  }

  private findGeneralIntersection(
    seg1: { start: Point; end: Point },
    seg2: { start: Point; end: Point }
  ): Point | null {
    const x1 = seg1.start.x, y1 = seg1.start.y;
    const x2 = seg1.end.x, y2 = seg1.end.y;
    const x3 = seg2.start.x, y3 = seg2.start.y;
    const x4 = seg2.end.x, y4 = seg2.end.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    if (Math.abs(denominator) < 1e-10) {
      return null; // Lines are parallel
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }

    return null;
  }

  private findJunctionAtPoint(point: Point): Junction | undefined {
    for (const junction of this.junctions.values()) {
      const distance = Math.sqrt(
        Math.pow(junction.position.x - point.x, 2) +
        Math.pow(junction.position.y - point.y, 2)
      );
      
      if (distance <= this.intersectionTolerance) {
        return junction;
      }
    }
    
    return undefined;
  }

  private updateIntersections(): void {
    const intersections = this.findIntersections();
    
    // Create junctions for new intersections
    for (const intersection of intersections) {
      if (intersection.needsJunction) {
        this.createJunction(
          intersection.point,
          [intersection.wire1Id, intersection.wire2Id],
          'cross'
        );
      }
    }
  }

  private determineJunctionType(wireCount: number): Junction['junctionType'] {
    switch (wireCount) {
      case 2:
        return 'corner';
      case 3:
        return 'T';
      case 4:
        return 'cross';
      default:
        return 'terminal';
    }
  }

  private getDefaultJunctionStyle(): JunctionStyle {
    return {
      size: 6,
      color: '#2563eb',
      shape: 'circle',
      showLabel: false
    };
  }

  private generateJunctionId(): string {
    return `junction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public setJunctionStyle(junctionId: string, style: Partial<JunctionStyle>): void {
    const junction = this.junctions.get(junctionId);
    if (junction) {
      junction.style = { ...junction.style, ...style };
      this.onJunctionUpdate?.(junction);
    }
  }

  public lockJunction(junctionId: string, locked: boolean = true): void {
    const junction = this.junctions.get(junctionId);
    if (junction) {
      junction.locked = locked;
      this.onJunctionUpdate?.(junction);
    }
  }

  public optimizeJunctions(): void {
    // Remove unnecessary junctions (junctions with only 2 wires in a straight line)
    const junctionsToRemove: string[] = [];
    
    for (const [junctionId, junction] of this.junctions) {
      if (junction.connectedWires.length === 2 && !junction.locked) {
        if (this.isJunctionRedundant(junction)) {
          junctionsToRemove.push(junctionId);
        }
      }
    }
    
    junctionsToRemove.forEach(id => this.removeJunction(id));
  }

  private isJunctionRedundant(junction: Junction): boolean {
    // Check if the junction is just connecting two segments in a straight line
    if (junction.connectedWires.length !== 2) return false;
    
    const wire1Segments = this.wireSegments.get(junction.connectedWires[0]) || [];
    const wire2Segments = this.wireSegments.get(junction.connectedWires[1]) || [];
    
    // Find segments that connect to this junction
    const connectingSegments = [...wire1Segments, ...wire2Segments].filter(seg => 
      this.pointsEqual(seg.start, junction.position) || 
      this.pointsEqual(seg.end, junction.position)
    );
    
    if (connectingSegments.length === 2) {
      // Check if segments are collinear
      const seg1 = connectingSegments[0];
      const seg2 = connectingSegments[1];
      
      return this.areSegmentsCollinear(seg1, seg2, junction.position);
    }
    
    return false;
  }

  private pointsEqual(p1: Point, p2: Point): boolean {
    return Math.abs(p1.x - p2.x) < this.intersectionTolerance &&
           Math.abs(p1.y - p2.y) < this.intersectionTolerance;
  }

  private areSegmentsCollinear(
    seg1: { start: Point; end: Point },
    seg2: { start: Point; end: Point },
    junction: Point
  ): boolean {
    // Get the other endpoints (not the junction)
    const p1 = this.pointsEqual(seg1.start, junction) ? seg1.end : seg1.start;
    const p2 = this.pointsEqual(seg2.start, junction) ? seg2.end : seg2.start;
    
    // Check if all three points are collinear
    const area = Math.abs(
      (p1.x - junction.x) * (p2.y - junction.y) - 
      (p2.x - junction.x) * (p1.y - junction.y)
    );
    
    return area < this.intersectionTolerance;
  }

  public dispose(): void {
    this.junctions.clear();
    this.wireSegments.clear();
  }
}