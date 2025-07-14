/**
 * Wire Collision Detection and Automatic Re-routing System
 * 
 * Provides intelligent collision detection and automatic re-routing for electrical wires
 * when components are moved or new obstacles are introduced to the diagram.
 */

import { WireRoutingEngine, type Point, type Rectangle, type ComponentBounds, type RoutedWire } from './wireRouting';

export interface CollisionResult {
  hasCollision: boolean;
  collisionPoints: Point[];
  affectedWires: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ReRouteResult {
  success: boolean;
  newRoute: RoutedWire | null;
  oldRoute: RoutedWire;
  improvement: number; // Quality improvement (-1 to 1)
  rerouteReason: string;
}

export interface WireIntersection {
  wireId1: string;
  wireId2: string;
  intersectionPoint: Point;
  type: 'crossing' | 'overlap' | 'junction';
  severity: number; // 0-1, where 1 is most severe
}

export class WireCollisionDetector {
  private routingEngine: WireRoutingEngine;
  private collisionBuffer: number = 5; // Minimum clearance between wires
  private componentBuffer: number = 10; // Minimum clearance from components

  constructor(routingEngine: WireRoutingEngine) {
    this.routingEngine = routingEngine;
  }

  /**
   * Detect all collisions in the current wire layout
   */
  detectAllCollisions(
    wires: RoutedWire[],
    components: ComponentBounds[]
  ): CollisionResult[] {
    const collisions: CollisionResult[] = [];

    // Check wire-to-component collisions
    for (const wire of wires) {
      const componentCollisions = this.detectWireComponentCollisions(wire, components);
      if (componentCollisions.length > 0) {
        collisions.push({
          hasCollision: true,
          collisionPoints: componentCollisions,
          affectedWires: [wire.id],
          severity: 'high',
          description: `Wire ${wire.id} intersects with components`
        });
      }
    }

    // Check wire-to-wire collisions
    const wireIntersections = this.detectWireIntersections(wires);
    for (const intersection of wireIntersections) {
      collisions.push({
        hasCollision: true,
        collisionPoints: [intersection.intersectionPoint],
        affectedWires: [intersection.wireId1, intersection.wireId2],
        severity: intersection.severity > 0.7 ? 'high' : intersection.severity > 0.3 ? 'medium' : 'low',
        description: `Wires ${intersection.wireId1} and ${intersection.wireId2} intersect at ${intersection.type}`
      });
    }

    return collisions;
  }

  /**
   * Detect collisions between a wire and components
   */
  private detectWireComponentCollisions(
    wire: RoutedWire,
    components: ComponentBounds[]
  ): Point[] {
    const collisionPoints: Point[] = [];

    for (const segment of wire.segments) {
      for (const component of components) {
        // Skip if this is the wire's source or destination component
        if (this.isWireEndpoint(wire, component)) continue;

        const intersections = this.getLineRectangleIntersections(
          segment.start,
          segment.end,
          this.expandRectangle(component.bounds, this.componentBuffer)
        );

        collisionPoints.push(...intersections);
      }
    }

    return collisionPoints;
  }

  /**
   * Detect intersections between wires
   */
  private detectWireIntersections(wires: RoutedWire[]): WireIntersection[] {
    const intersections: WireIntersection[] = [];

    for (let i = 0; i < wires.length; i++) {
      for (let j = i + 1; j < wires.length; j++) {
        const wire1 = wires[i];
        const wire2 = wires[j];

        // Check if wires share endpoints (valid junctions)
        if (this.wiresShareEndpoint(wire1, wire2)) {
          const sharedPoint = this.getSharedEndpoint(wire1, wire2);
          if (sharedPoint) {
            intersections.push({
              wireId1: wire1.id,
              wireId2: wire2.id,
              intersectionPoint: sharedPoint,
              type: 'junction',
              severity: 0.1 // Low severity for intentional junctions
            });
          }
          continue;
        }

        // Check for segment intersections
        for (const segment1 of wire1.segments) {
          for (const segment2 of wire2.segments) {
            const intersection = this.getLineIntersection(
              segment1.start,
              segment1.end,
              segment2.start,
              segment2.end
            );

            if (intersection) {
              const distanceThreshold = this.collisionBuffer;
              const distance = this.getPointDistance(intersection, intersection); // Self-distance is 0

              // Determine intersection type and severity
              let type: 'crossing' | 'overlap' | 'junction' = 'crossing';
              let severity = 0.8; // High severity for unexpected crossings

              // Check if segments overlap
              if (this.segmentsOverlap(segment1, segment2)) {
                type = 'overlap';
                severity = 1.0; // Maximum severity for overlaps
              }

              intersections.push({
                wireId1: wire1.id,
                wireId2: wire2.id,
                intersectionPoint: intersection,
                type,
                severity
              });
            }
          }
        }
      }
    }

    return intersections;
  }

  /**
   * Automatically re-route wires to avoid collisions
   */
  async rerouteCollidingWires(
    wires: RoutedWire[],
    components: ComponentBounds[],
    canvasBounds: Rectangle
  ): Promise<ReRouteResult[]> {
    const results: ReRouteResult[] = [];
    const collisions = this.detectAllCollisions(wires, components);

    // Update routing engine with current obstacles
    this.routingEngine.setObstacles(components, canvasBounds);

    for (const collision of collisions) {
      if (collision.severity === 'high') {
        for (const wireId of collision.affectedWires) {
          const wire = wires.find(w => w.id === wireId);
          if (!wire) continue;

          const rerouteResult = await this.rerouteSingleWire(wire, components, canvasBounds);
          results.push(rerouteResult);
        }
      }
    }

    return results;
  }

  /**
   * Re-route a single wire
   */
  private async rerouteSingleWire(
    wire: RoutedWire,
    components: ComponentBounds[],
    canvasBounds: Rectangle
  ): Promise<ReRouteResult> {
    try {
      // Create temporary routing engine for this wire
      const tempEngine = new WireRoutingEngine({
        gridSize: 20,
        bendPenalty: 30,
        lengthWeight: 1,
        obstacleBuffer: this.componentBuffer,
        routingStrategy: 'balanced'
      });

      // Set obstacles excluding this wire
      const obstacles = [...components];
      tempEngine.setObstacles(obstacles, canvasBounds);

      // Attempt to route with different strategies
      const strategies = ['minimal_bends', 'shortest', 'balanced'];
      let bestRoute: RoutedWire | null = null;
      let bestQuality = -1;

      for (const strategy of strategies) {
        tempEngine.clearExistingWires();
        
        const newRoute = tempEngine.routeWire(
          wire.start,
          wire.end,
          wire.id + '_reroute'
        );

        if (newRoute && newRoute.quality > bestQuality) {
          bestRoute = newRoute;
          bestQuality = newRoute.quality;
        }
      }

      if (bestRoute) {
        const improvement = bestRoute.quality - wire.quality;
        return {
          success: true,
          newRoute: bestRoute,
          oldRoute: wire,
          improvement,
          rerouteReason: `Collision avoidance with ${improvement > 0 ? 'improved' : 'maintained'} quality`
        };
      } else {
        return {
          success: false,
          newRoute: null,
          oldRoute: wire,
          improvement: -1,
          rerouteReason: 'No valid alternative route found'
        };
      }
    } catch (error) {
      return {
        success: false,
        newRoute: null,
        oldRoute: wire,
        improvement: -1,
        rerouteReason: `Re-routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Optimize wire layout by minimizing total length and bends
   */
  optimizeWireLayout(
    wires: RoutedWire[],
    components: ComponentBounds[],
    canvasBounds: Rectangle
  ): Promise<RoutedWire[]> {
    return new Promise((resolve) => {
      // Sort wires by length (shortest first for better optimization)
      const sortedWires = [...wires].sort((a, b) => a.totalLength - b.totalLength);
      const optimizedWires: RoutedWire[] = [];

      this.routingEngine.setObstacles(components, canvasBounds);
      this.routingEngine.clearExistingWires();

      for (const wire of sortedWires) {
        const optimizedWire = this.routingEngine.routeWire(
          wire.start,
          wire.end,
          wire.id
        );
        optimizedWires.push(optimizedWire);
      }

      resolve(optimizedWires);
    });
  }

  /**
   * Check if two line segments intersect
   */
  private getLineIntersection(
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point
  ): Point | null {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    
    if (Math.abs(denom) < 1e-10) {
      return null; // Lines are parallel
    }

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
    }

    return null;
  }

  /**
   * Get intersections between a line and a rectangle
   */
  private getLineRectangleIntersections(
    lineStart: Point,
    lineEnd: Point,
    rect: Rectangle
  ): Point[] {
    const intersections: Point[] = [];

    // Check intersection with each side of the rectangle
    const corners = [
      { x: rect.x, y: rect.y }, // Top-left
      { x: rect.x + rect.width, y: rect.y }, // Top-right
      { x: rect.x + rect.width, y: rect.y + rect.height }, // Bottom-right
      { x: rect.x, y: rect.y + rect.height } // Bottom-left
    ];

    for (let i = 0; i < corners.length; i++) {
      const corner1 = corners[i];
      const corner2 = corners[(i + 1) % corners.length];

      const intersection = this.getLineIntersection(
        lineStart,
        lineEnd,
        corner1,
        corner2
      );

      if (intersection) {
        intersections.push(intersection);
      }
    }

    return intersections;
  }

  /**
   * Check if two wire segments overlap
   */
  private segmentsOverlap(segment1: any, segment2: any): boolean {
    // Check if segments are parallel and overlapping
    if (segment1.direction !== segment2.direction) {
      return false;
    }

    if (segment1.direction === 'horizontal') {
      // Check if y-coordinates match and x-ranges overlap
      if (Math.abs(segment1.start.y - segment2.start.y) < this.collisionBuffer) {
        const x1Min = Math.min(segment1.start.x, segment1.end.x);
        const x1Max = Math.max(segment1.start.x, segment1.end.x);
        const x2Min = Math.min(segment2.start.x, segment2.end.x);
        const x2Max = Math.max(segment2.start.x, segment2.end.x);

        return x1Min < x2Max && x2Min < x1Max;
      }
    } else {
      // Check if x-coordinates match and y-ranges overlap
      if (Math.abs(segment1.start.x - segment2.start.x) < this.collisionBuffer) {
        const y1Min = Math.min(segment1.start.y, segment1.end.y);
        const y1Max = Math.max(segment1.start.y, segment1.end.y);
        const y2Min = Math.min(segment2.start.y, segment2.end.y);
        const y2Max = Math.max(segment2.start.y, segment2.end.y);

        return y1Min < y2Max && y2Min < y1Max;
      }
    }

    return false;
  }

  /**
   * Check if wires share an endpoint
   */
  private wiresShareEndpoint(wire1: RoutedWire, wire2: RoutedWire): boolean {
    const threshold = 5; // Pixel threshold for considering points the same

    return (
      this.getPointDistance(wire1.start, wire2.start) < threshold ||
      this.getPointDistance(wire1.start, wire2.end) < threshold ||
      this.getPointDistance(wire1.end, wire2.start) < threshold ||
      this.getPointDistance(wire1.end, wire2.end) < threshold
    );
  }

  /**
   * Get shared endpoint between two wires
   */
  private getSharedEndpoint(wire1: RoutedWire, wire2: RoutedWire): Point | null {
    const threshold = 5;

    if (this.getPointDistance(wire1.start, wire2.start) < threshold) return wire1.start;
    if (this.getPointDistance(wire1.start, wire2.end) < threshold) return wire1.start;
    if (this.getPointDistance(wire1.end, wire2.start) < threshold) return wire1.end;
    if (this.getPointDistance(wire1.end, wire2.end) < threshold) return wire1.end;

    return null;
  }

  /**
   * Check if a component is a wire endpoint
   */
  private isWireEndpoint(wire: RoutedWire, component: ComponentBounds): boolean {
    const threshold = 20;

    const componentCenter = {
      x: component.bounds.x + component.bounds.width / 2,
      y: component.bounds.y + component.bounds.height / 2
    };

    return (
      this.getPointDistance(wire.start, componentCenter) < threshold ||
      this.getPointDistance(wire.end, componentCenter) < threshold
    );
  }

  /**
   * Expand rectangle by buffer amount
   */
  private expandRectangle(rect: Rectangle, buffer: number): Rectangle {
    return {
      x: rect.x - buffer,
      y: rect.y - buffer,
      width: rect.width + buffer * 2,
      height: rect.height + buffer * 2
    };
  }

  /**
   * Calculate distance between two points
   */
  private getPointDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Set collision detection parameters
   */
  setCollisionParameters(wireBuffer: number, componentBuffer: number): void {
    this.collisionBuffer = wireBuffer;
    this.componentBuffer = componentBuffer;
  }

  /**
   * Get collision statistics
   */
  getCollisionStats(
    wires: RoutedWire[],
    components: ComponentBounds[]
  ): {
    totalCollisions: number;
    wireWireCollisions: number;
    wireComponentCollisions: number;
    averageSeverity: number;
    criticalCollisions: number;
  } {
    const collisions = this.detectAllCollisions(wires, components);
    
    const wireWireCollisions = collisions.filter(c => c.affectedWires.length > 1).length;
    const wireComponentCollisions = collisions.filter(c => c.affectedWires.length === 1).length;
    const criticalCollisions = collisions.filter(c => c.severity === 'high').length;
    
    const totalSeverity = collisions.reduce((sum, c) => {
      return sum + (c.severity === 'high' ? 1 : c.severity === 'medium' ? 0.5 : 0.2);
    }, 0);

    return {
      totalCollisions: collisions.length,
      wireWireCollisions,
      wireComponentCollisions,
      averageSeverity: collisions.length > 0 ? totalSeverity / collisions.length : 0,
      criticalCollisions
    };
  }
}

export default WireCollisionDetector;