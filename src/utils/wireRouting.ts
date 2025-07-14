/**
 * Intelligent Orthogonal Wire Routing System
 * 
 * Implements professional CAD-style wire routing with:
 * - Manhattan (orthogonal) routing
 * - Automatic obstacle avoidance
 * - Route optimization algorithms
 * - Multiple routing strategies
 * - Bend minimization
 * - Connection point management
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

export interface RoutingNode {
  point: Point;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost (g + h)
  parent: RoutingNode | null;
  direction?: 'horizontal' | 'vertical';
}

export interface WireSegment {
  start: Point;
  end: Point;
  direction: 'horizontal' | 'vertical';
  length: number;
}

export interface RoutedWire {
  id: string;
  segments: WireSegment[];
  totalLength: number;
  bendCount: number;
  start: Point;
  end: Point;
  path: Point[];
  collisions: string[];
  quality: number; // 0-1 routing quality score
}

export interface RoutingOptions {
  gridSize: number;
  bendPenalty: number;
  lengthWeight: number;
  obstacleBuffer: number;
  maxIterations: number;
  routingStrategy: 'shortest' | 'minimal_bends' | 'balanced' | 'grid_aligned';
  allowDiagonal: boolean;
  preferredDirections: ('horizontal' | 'vertical')[];
}

export interface ComponentBounds {
  id: string;
  bounds: Rectangle;
  connectionPoints: Point[];
  type: 'component' | 'wire' | 'text' | 'exclusion';
}

export class WireRoutingEngine {
  private obstacles: ComponentBounds[] = [];
  private existingWires: RoutedWire[] = [];
  private routingGrid: number[][];
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private options: RoutingOptions;

  constructor(options: Partial<RoutingOptions> = {}) {
    this.options = {
      gridSize: 20,
      bendPenalty: 50,
      lengthWeight: 1,
      obstacleBuffer: 10,
      maxIterations: 1000,
      routingStrategy: 'balanced',
      allowDiagonal: false,
      preferredDirections: ['horizontal', 'vertical'],
      ...options
    };
  }

  /**
   * Initialize routing grid with obstacles
   */
  setObstacles(obstacles: ComponentBounds[], canvasBounds: Rectangle): void {
    this.obstacles = obstacles;
    
    // Calculate grid dimensions
    this.gridWidth = Math.ceil(canvasBounds.width / this.options.gridSize);
    this.gridHeight = Math.ceil(canvasBounds.height / this.options.gridSize);
    
    // Initialize grid (0 = free, 1 = obstacle, 2 = wire)
    this.routingGrid = Array(this.gridHeight).fill(0).map(() => Array(this.gridWidth).fill(0));
    
    // Mark obstacles in grid
    obstacles.forEach(obstacle => {
      this.markRectangleInGrid(obstacle.bounds, 1);
    });
    
    // Mark existing wires in grid
    this.existingWires.forEach(wire => {
      this.markWireInGrid(wire, 2);
    });
  }

  /**
   * Route a wire between two points
   */
  routeWire(
    start: Point, 
    end: Point, 
    wireId: string,
    connectionType: 'ac' | 'dc' | 'ground' | 'data' = 'ac'
  ): RoutedWire {
    // Snap points to grid
    const gridStart = this.snapToGrid(start);
    const gridEnd = this.snapToGrid(end);
    
    // Try different routing strategies
    let bestRoute: RoutedWire | null = null;
    let bestScore = -1;
    
    const strategies = this.getRoutingStrategies();
    
    for (const strategy of strategies) {
      const route = this.routeWithStrategy(gridStart, gridEnd, wireId, strategy, connectionType);
      if (route && route.quality > bestScore) {
        bestRoute = route;
        bestScore = route.quality;
      }
    }
    
    if (!bestRoute) {
      // Fallback to direct routing if all strategies fail
      bestRoute = this.createDirectRoute(gridStart, gridEnd, wireId, connectionType);
    }
    
    // Add to existing wires for future collision detection
    this.existingWires.push(bestRoute);
    this.markWireInGrid(bestRoute, 2);
    
    return bestRoute;
  }

  /**
   * Get routing strategies based on options
   */
  private getRoutingStrategies(): string[] {
    switch (this.options.routingStrategy) {
      case 'shortest':
        return ['astar', 'dijkstra'];
      case 'minimal_bends':
        return ['minimal_bends', 'astar'];
      case 'balanced':
        return ['astar', 'minimal_bends', 'dijkstra'];
      case 'grid_aligned':
        return ['grid_aligned', 'astar'];
      default:
        return ['astar'];
    }
  }

  /**
   * Route using A* algorithm with orthogonal constraints
   */
  private routeWithStrategy(
    start: Point,
    end: Point,
    wireId: string,
    strategy: string,
    connectionType: string
  ): RoutedWire | null {
    switch (strategy) {
      case 'astar':
        return this.routeAStar(start, end, wireId, connectionType);
      case 'dijkstra':
        return this.routeDijkstra(start, end, wireId, connectionType);
      case 'minimal_bends':
        return this.routeMinimalBends(start, end, wireId, connectionType);
      case 'grid_aligned':
        return this.routeGridAligned(start, end, wireId, connectionType);
      default:
        return null;
    }
  }

  /**
   * A* pathfinding with orthogonal movement
   */
  private routeAStar(
    start: Point,
    end: Point,
    wireId: string,
    connectionType: string
  ): RoutedWire | null {
    const openSet: RoutingNode[] = [];
    const closedSet: Set<string> = new Set();
    
    const startNode: RoutingNode = {
      point: start,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    
    openSet.push(startNode);
    
    let iterations = 0;
    
    while (openSet.length > 0 && iterations < this.options.maxIterations) {
      iterations++;
      
      // Find node with lowest f cost
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      
      const currentKey = `${current.point.x},${current.point.y}`;
      closedSet.add(currentKey);
      
      // Check if we reached the goal
      if (this.pointsEqual(current.point, end)) {
        return this.reconstructPath(current, wireId, connectionType);
      }
      
      // Explore neighbors (orthogonal movement only)
      const neighbors = this.getOrthogonalNeighbors(current.point);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedSet.has(neighborKey)) continue;
        if (!this.isValidPosition(neighbor)) continue;
        
        const tentativeG = current.g + this.getMovementCost(current.point, neighbor, current.direction);
        
        const existingNode = openSet.find(n => this.pointsEqual(n.point, neighbor));
        
        if (!existingNode) {
          const newNode: RoutingNode = {
            point: neighbor,
            g: tentativeG,
            h: this.heuristic(neighbor, end),
            f: 0,
            parent: current,
            direction: this.getDirection(current.point, neighbor)
          };
          newNode.f = newNode.g + newNode.h;
          openSet.push(newNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
          existingNode.direction = this.getDirection(current.point, neighbor);
        }
      }
    }
    
    return null; // No path found
  }

  /**
   * Route with minimal bends strategy
   */
  private routeMinimalBends(
    start: Point,
    end: Point,
    wireId: string,
    connectionType: string
  ): RoutedWire | null {
    // Try L-shaped routes first (only 1 bend)
    const lRoutes = this.generateLShapedRoutes(start, end);
    
    for (const route of lRoutes) {
      if (this.isRouteValid(route)) {
        return this.createRoutedWireFromPath(route, wireId, connectionType);
      }
    }
    
    // Try Z-shaped routes (2 bends)
    const zRoutes = this.generateZShapedRoutes(start, end);
    
    for (const route of zRoutes) {
      if (this.isRouteValid(route)) {
        return this.createRoutedWireFromPath(route, wireId, connectionType);
      }
    }
    
    // Fall back to A* if simple routes don't work
    return this.routeAStar(start, end, wireId, connectionType);
  }

  /**
   * Route aligned to grid lines
   */
  private routeGridAligned(
    start: Point,
    end: Point,
    wireId: string,
    connectionType: string
  ): RoutedWire | null {
    // Ensure start and end are on grid lines
    const alignedStart = this.alignToGrid(start);
    const alignedEnd = this.alignToGrid(end);
    
    // Use A* with grid alignment preference
    return this.routeAStar(alignedStart, alignedEnd, wireId, connectionType);
  }

  /**
   * Dijkstra's algorithm for guaranteed shortest path
   */
  private routeDijkstra(
    start: Point,
    end: Point,
    wireId: string,
    connectionType: string
  ): RoutedWire | null {
    // Similar to A* but without heuristic
    const distances: Map<string, number> = new Map();
    const previous: Map<string, RoutingNode> = new Map();
    const unvisited: Set<string> = new Set();
    
    // Initialize distances
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.routingGrid[y][x] === 0) { // Only free cells
          const key = `${x * this.options.gridSize},${y * this.options.gridSize}`;
          distances.set(key, Infinity);
          unvisited.add(key);
        }
      }
    }
    
    const startKey = `${start.x},${start.y}`;
    distances.set(startKey, 0);
    
    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current: string | null = null;
      let minDistance = Infinity;
      
      for (const node of unvisited) {
        const dist = distances.get(node) || Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          current = node;
        }
      }
      
      if (!current || minDistance === Infinity) break;
      
      unvisited.delete(current);
      
      const [x, y] = current.split(',').map(Number);
      const currentPoint = { x, y };
      
      // Check if we reached the goal
      if (this.pointsEqual(currentPoint, end)) {
        // Reconstruct path
        const path: Point[] = [];
        let currentKey: string | undefined = current;
        
        while (currentKey) {
          const [px, py] = currentKey.split(',').map(Number);
          path.unshift({ x: px, y: py });
          const prev = previous.get(currentKey);
          currentKey = prev ? `${prev.point.x},${prev.point.y}` : undefined;
        }
        
        return this.createRoutedWireFromPath(path, wireId, connectionType);
      }
      
      // Update neighbors
      const neighbors = this.getOrthogonalNeighbors(currentPoint);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!unvisited.has(neighborKey)) continue;
        
        const alt = minDistance + this.getMovementCost(currentPoint, neighbor);
        if (alt < (distances.get(neighborKey) || Infinity)) {
          distances.set(neighborKey, alt);
          previous.set(neighborKey, {
            point: currentPoint,
            g: alt,
            h: 0,
            f: alt,
            parent: null
          });
        }
      }
    }
    
    return null; // No path found
  }

  /**
   * Generate L-shaped routes (horizontal then vertical, or vertical then horizontal)
   */
  private generateLShapedRoutes(start: Point, end: Point): Point[][] {
    const routes: Point[][] = [];
    
    // Horizontal first, then vertical
    const corner1 = { x: end.x, y: start.y };
    if (this.isValidPosition(corner1)) {
      routes.push([start, corner1, end]);
    }
    
    // Vertical first, then horizontal
    const corner2 = { x: start.x, y: end.y };
    if (this.isValidPosition(corner2)) {
      routes.push([start, corner2, end]);
    }
    
    return routes;
  }

  /**
   * Generate Z-shaped routes
   */
  private generateZShapedRoutes(start: Point, end: Point): Point[][] {
    const routes: Point[][] = [];
    const midX = start.x + (end.x - start.x) / 2;
    const midY = start.y + (end.y - start.y) / 2;
    
    // Horizontal-Vertical-Horizontal
    const hvh1 = { x: midX, y: start.y };
    const hvh2 = { x: midX, y: end.y };
    routes.push([start, hvh1, hvh2, end]);
    
    // Vertical-Horizontal-Vertical
    const vhv1 = { x: start.x, y: midY };
    const vhv2 = { x: end.x, y: midY };
    routes.push([start, vhv1, vhv2, end]);
    
    return routes;
  }

  /**
   * Check if a route path is valid (no obstacles)
   */
  private isRouteValid(path: Point[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      if (!this.isSegmentValid(path[i], path[i + 1])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a line segment is valid
   */
  private isSegmentValid(start: Point, end: Point): boolean {
    const steps = Math.max(
      Math.abs(end.x - start.x) / this.options.gridSize,
      Math.abs(end.y - start.y) / this.options.gridSize
    );
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const point = {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y)
      };
      
      if (!this.isValidPosition(point)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get orthogonal neighbors (4-directional)
   */
  private getOrthogonalNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];
    const gridSize = this.options.gridSize;
    
    // Up, Down, Left, Right
    const directions = [
      { x: 0, y: -gridSize },
      { x: 0, y: gridSize },
      { x: -gridSize, y: 0 },
      { x: gridSize, y: 0 }
    ];
    
    for (const dir of directions) {
      neighbors.push({
        x: point.x + dir.x,
        y: point.y + dir.y
      });
    }
    
    return neighbors;
  }

  /**
   * Calculate heuristic distance (Manhattan distance for orthogonal routing)
   */
  private heuristic(from: Point, to: Point): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  /**
   * Calculate movement cost with bend penalty
   */
  private getMovementCost(
    from: Point, 
    to: Point, 
    previousDirection?: 'horizontal' | 'vertical'
  ): number {
    const distance = this.heuristic(from, to) * this.options.lengthWeight;
    let bendPenalty = 0;
    
    if (previousDirection) {
      const currentDirection = this.getDirection(from, to);
      if (currentDirection !== previousDirection) {
        bendPenalty = this.options.bendPenalty;
      }
    }
    
    return distance + bendPenalty;
  }

  /**
   * Get direction of movement
   */
  private getDirection(from: Point, to: Point): 'horizontal' | 'vertical' {
    return Math.abs(to.x - from.x) > Math.abs(to.y - from.y) ? 'horizontal' : 'vertical';
  }

  /**
   * Check if position is valid (not blocked by obstacles)
   */
  private isValidPosition(point: Point): boolean {
    const gridX = Math.floor(point.x / this.options.gridSize);
    const gridY = Math.floor(point.y / this.options.gridSize);
    
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return false;
    }
    
    return this.routingGrid[gridY][gridX] === 0; // 0 = free space
  }

  /**
   * Snap point to routing grid
   */
  private snapToGrid(point: Point): Point {
    const gridSize = this.options.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  /**
   * Align point to grid lines (prefer grid intersections)
   */
  private alignToGrid(point: Point): Point {
    return this.snapToGrid(point);
  }

  /**
   * Check if two points are equal
   */
  private pointsEqual(a: Point, b: Point): boolean {
    return Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
  }

  /**
   * Mark rectangle area in grid
   */
  private markRectangleInGrid(rect: Rectangle, value: number): void {
    const startX = Math.floor(rect.x / this.options.gridSize);
    const endX = Math.ceil((rect.x + rect.width) / this.options.gridSize);
    const startY = Math.floor(rect.y / this.options.gridSize);
    const endY = Math.ceil((rect.y + rect.height) / this.options.gridSize);
    
    for (let y = Math.max(0, startY); y < Math.min(this.gridHeight, endY); y++) {
      for (let x = Math.max(0, startX); x < Math.min(this.gridWidth, endX); x++) {
        this.routingGrid[y][x] = value;
      }
    }
  }

  /**
   * Mark wire path in grid
   */
  private markWireInGrid(wire: RoutedWire, value: number): void {
    for (const segment of wire.segments) {
      this.markLineInGrid(segment.start, segment.end, value);
    }
  }

  /**
   * Mark line in grid
   */
  private markLineInGrid(start: Point, end: Point, value: number): void {
    const steps = Math.max(
      Math.abs(end.x - start.x) / this.options.gridSize,
      Math.abs(end.y - start.y) / this.options.gridSize
    );
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const point = {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y)
      };
      
      const gridX = Math.floor(point.x / this.options.gridSize);
      const gridY = Math.floor(point.y / this.options.gridSize);
      
      if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
        this.routingGrid[gridY][gridX] = value;
      }
    }
  }

  /**
   * Reconstruct path from A* result
   */
  private reconstructPath(
    node: RoutingNode,
    wireId: string,
    connectionType: string
  ): RoutedWire {
    const path: Point[] = [];
    let current: RoutingNode | null = node;
    
    while (current) {
      path.unshift(current.point);
      current = current.parent;
    }
    
    return this.createRoutedWireFromPath(path, wireId, connectionType);
  }

  /**
   * Create RoutedWire from path points
   */
  private createRoutedWireFromPath(
    path: Point[],
    wireId: string,
    connectionType: string
  ): RoutedWire {
    const segments: WireSegment[] = [];
    let totalLength = 0;
    let bendCount = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      const direction = Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? 'horizontal' : 'vertical';
      const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
      
      segments.push({
        start,
        end,
        direction,
        length
      });
      
      totalLength += length;
      
      // Count bends (direction changes)
      if (i > 0) {
        const prevDirection = segments[i - 1].direction;
        if (direction !== prevDirection) {
          bendCount++;
        }
      }
    }
    
    const quality = this.calculateRouteQuality(segments, totalLength, bendCount);
    
    return {
      id: wireId,
      segments,
      totalLength,
      bendCount,
      start: path[0],
      end: path[path.length - 1],
      path,
      collisions: [],
      quality
    };
  }

  /**
   * Create direct route as fallback
   */
  private createDirectRoute(
    start: Point,
    end: Point,
    wireId: string,
    connectionType: string
  ): RoutedWire {
    const segments: WireSegment[] = [{
      start,
      end,
      direction: Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? 'horizontal' : 'vertical',
      length: Math.abs(end.x - start.x) + Math.abs(end.y - start.y)
    }];
    
    return {
      id: wireId,
      segments,
      totalLength: segments[0].length,
      bendCount: 0,
      start,
      end,
      path: [start, end],
      collisions: [],
      quality: 0.1 // Low quality fallback
    };
  }

  /**
   * Calculate route quality score (0-1)
   */
  private calculateRouteQuality(
    segments: WireSegment[],
    totalLength: number,
    bendCount: number
  ): number {
    // Base quality on length efficiency and bend count
    const directDistance = Math.abs(segments[0].start.x - segments[segments.length - 1].end.x) +
                          Math.abs(segments[0].start.y - segments[segments.length - 1].end.y);
    
    const lengthEfficiency = directDistance / totalLength;
    const bendPenalty = Math.max(0, 1 - bendCount * 0.1);
    
    return Math.min(1, lengthEfficiency * bendPenalty);
  }

  /**
   * Clear existing wires for re-routing
   */
  clearExistingWires(): void {
    this.existingWires = [];
    // Reset wire markings in grid
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.routingGrid[y][x] === 2) {
          this.routingGrid[y][x] = 0;
        }
      }
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalWires: number;
    totalLength: number;
    averageBends: number;
    averageQuality: number;
  } {
    const totalWires = this.existingWires.length;
    const totalLength = this.existingWires.reduce((sum, wire) => sum + wire.totalLength, 0);
    const totalBends = this.existingWires.reduce((sum, wire) => sum + wire.bendCount, 0);
    const totalQuality = this.existingWires.reduce((sum, wire) => sum + wire.quality, 0);
    
    return {
      totalWires,
      totalLength,
      averageBends: totalWires > 0 ? totalBends / totalWires : 0,
      averageQuality: totalWires > 0 ? totalQuality / totalWires : 0
    };
  }
}

export default WireRoutingEngine;