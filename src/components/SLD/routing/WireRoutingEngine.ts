/**
 * Intelligent Wire Routing Engine
 * 
 * Advanced pathfinding with obstacle avoidance and optimization
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

export interface WireSegment {
  start: Point;
  end: Point;
  type: 'horizontal' | 'vertical';
  length: number;
}

export interface RoutingObstacle {
  id: string;
  bounds: Rectangle;
  type: 'component' | 'wire' | 'keepout';
  priority: number;
}

export interface RoutingConstraints {
  minWireSpacing: number;
  preferredWireSpacing: number;
  maxBendCount: number;
  preferredBendRadius: number;
  avoidanceMargin: number;
}

export interface RoutingResult {
  segments: WireSegment[];
  totalLength: number;
  bendCount: number;
  quality: number; // 0-1 score
  obstacles: RoutingObstacle[];
}

export class WireRoutingEngine {
  private constraints: RoutingConstraints;
  private obstacles: Map<string, RoutingObstacle> = new Map();
  private gridSize: number = 10;
  private pathfindingGrid: number[][] = [];
  private gridWidth: number = 0;
  private gridHeight: number = 0;

  constructor(constraints: Partial<RoutingConstraints> = {}) {
    this.constraints = {
      minWireSpacing: 10,
      preferredWireSpacing: 20,
      maxBendCount: 6,
      preferredBendRadius: 5,
      avoidanceMargin: 5,
      ...constraints
    };
  }

  public addObstacle(obstacle: RoutingObstacle): void {
    this.obstacles.set(obstacle.id, obstacle);
    this.invalidateGrid();
  }

  public removeObstacle(id: string): void {
    this.obstacles.delete(id);
    this.invalidateGrid();
  }

  public updateObstacle(id: string, updates: Partial<RoutingObstacle>): void {
    const existing = this.obstacles.get(id);
    if (existing) {
      this.obstacles.set(id, { ...existing, ...updates });
      this.invalidateGrid();
    }
  }

  public clearObstacles(): void {
    this.obstacles.clear();
    this.invalidateGrid();
  }

  public routeWire(start: Point, end: Point, options: {
    routingStyle?: 'orthogonal' | 'diagonal' | 'manhattan';
    avoidObstacles?: boolean;
    optimize?: boolean;
  } = {}): RoutingResult {
    const {
      routingStyle = 'orthogonal',
      avoidObstacles = true,
      optimize = true
    } = options;

    let segments: WireSegment[];

    if (avoidObstacles && this.obstacles.size > 0) {
      // Use A* pathfinding with obstacle avoidance
      segments = this.routeWithPathfinding(start, end, routingStyle);
    } else {
      // Use simple orthogonal routing
      segments = this.routeOrthogonal(start, end);
    }

    if (optimize) {
      segments = this.optimizePath(segments);
    }

    return this.createRoutingResult(segments, start, end);
  }

  private routeOrthogonal(start: Point, end: Point): WireSegment[] {
    const segments: WireSegment[] = [];
    
    // Simple L-shaped routing
    if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) {
      // Horizontal first, then vertical
      if (start.x !== end.x) {
        segments.push({
          start,
          end: { x: end.x, y: start.y },
          type: 'horizontal',
          length: Math.abs(end.x - start.x)
        });
      }
      
      if (start.y !== end.y) {
        segments.push({
          start: { x: end.x, y: start.y },
          end,
          type: 'vertical',
          length: Math.abs(end.y - start.y)
        });
      }
    } else {
      // Vertical first, then horizontal
      if (start.y !== end.y) {
        segments.push({
          start,
          end: { x: start.x, y: end.y },
          type: 'vertical',
          length: Math.abs(end.y - start.y)
        });
      }
      
      if (start.x !== end.x) {
        segments.push({
          start: { x: start.x, y: end.y },
          end,
          type: 'horizontal',
          length: Math.abs(end.x - start.x)
        });
      }
    }

    return segments;
  }

  private routeWithPathfinding(start: Point, end: Point, style: string): WireSegment[] {
    this.ensureGridInitialized(start, end);
    
    const path = this.findPath(start, end);
    if (!path || path.length < 2) {
      // Fallback to simple routing
      return this.routeOrthogonal(start, end);
    }

    return this.pathToSegments(path);
  }

  private ensureGridInitialized(start: Point, end: Point): void {
    if (this.pathfindingGrid.length === 0) {
      this.initializePathfindingGrid(start, end);
    }
  }

  private initializePathfindingGrid(start: Point, end: Point): void {
    // Calculate grid bounds
    const minX = Math.min(start.x, end.x) - 100;
    const maxX = Math.max(start.x, end.x) + 100;
    const minY = Math.min(start.y, end.y) - 100;
    const maxY = Math.max(start.y, end.y) + 100;

    this.gridWidth = Math.ceil((maxX - minX) / this.gridSize);
    this.gridHeight = Math.ceil((maxY - minY) / this.gridSize);

    // Initialize grid (0 = free, 1 = obstacle)
    this.pathfindingGrid = Array(this.gridHeight).fill(null)
      .map(() => Array(this.gridWidth).fill(0));

    // Mark obstacles in grid
    for (const obstacle of this.obstacles.values()) {
      this.markObstacleInGrid(obstacle, minX, minY);
    }
  }

  private markObstacleInGrid(obstacle: RoutingObstacle, gridOffsetX: number, gridOffsetY: number): void {
    const margin = this.constraints.avoidanceMargin;
    const bounds = {
      x: obstacle.bounds.x - margin,
      y: obstacle.bounds.y - margin,
      width: obstacle.bounds.width + margin * 2,
      height: obstacle.bounds.height + margin * 2
    };

    const startGridX = Math.max(0, Math.floor((bounds.x - gridOffsetX) / this.gridSize));
    const endGridX = Math.min(this.gridWidth - 1, Math.floor((bounds.x + bounds.width - gridOffsetX) / this.gridSize));
    const startGridY = Math.max(0, Math.floor((bounds.y - gridOffsetY) / this.gridSize));
    const endGridY = Math.min(this.gridHeight - 1, Math.floor((bounds.y + bounds.height - gridOffsetY) / this.gridSize));

    for (let y = startGridY; y <= endGridY; y++) {
      for (let x = startGridX; x <= endGridX; x++) {
        this.pathfindingGrid[y][x] = 1;
      }
    }
  }

  private findPath(start: Point, end: Point): Point[] | null {
    // A* pathfinding implementation
    interface Node {
      x: number;
      y: number;
      g: number; // Cost from start
      h: number; // Heuristic cost to end
      f: number; // Total cost
      parent: Node | null;
    }

    const gridOffsetX = Math.min(start.x, end.x) - 100;
    const gridOffsetY = Math.min(start.y, end.y) - 100;

    const startNode: Node = {
      x: Math.floor((start.x - gridOffsetX) / this.gridSize),
      y: Math.floor((start.y - gridOffsetY) / this.gridSize),
      g: 0,
      h: 0,
      f: 0,
      parent: null
    };

    const endNode: Node = {
      x: Math.floor((end.x - gridOffsetX) / this.gridSize),
      y: Math.floor((end.y - gridOffsetY) / this.gridSize),
      g: 0,
      h: 0,
      f: 0,
      parent: null
    };

    startNode.h = this.heuristic(startNode, endNode);
    startNode.f = startNode.g + startNode.h;

    const openList: Node[] = [startNode];
    const closedList: Set<string> = new Set();

    while (openList.length > 0) {
      // Find node with lowest f cost
      let currentNode = openList[0];
      let currentIndex = 0;

      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
          currentIndex = i;
        }
      }

      // Move current node from open to closed list
      openList.splice(currentIndex, 1);
      closedList.add(`${currentNode.x},${currentNode.y}`);

      // Check if we reached the end
      if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
        return this.reconstructPath(currentNode, gridOffsetX, gridOffsetY);
      }

      // Check neighbors (4-directional for orthogonal routing)
      const neighbors = [
        { x: currentNode.x - 1, y: currentNode.y },
        { x: currentNode.x + 1, y: currentNode.y },
        { x: currentNode.x, y: currentNode.y - 1 },
        { x: currentNode.x, y: currentNode.y + 1 }
      ];

      for (const neighborPos of neighbors) {
        // Check bounds
        if (neighborPos.x < 0 || neighborPos.x >= this.gridWidth ||
            neighborPos.y < 0 || neighborPos.y >= this.gridHeight) {
          continue;
        }

        // Check if obstacle
        if (this.pathfindingGrid[neighborPos.y][neighborPos.x] === 1) {
          continue;
        }

        // Check if already in closed list
        if (closedList.has(`${neighborPos.x},${neighborPos.y}`)) {
          continue;
        }

        const neighbor: Node = {
          x: neighborPos.x,
          y: neighborPos.y,
          g: currentNode.g + 1,
          h: this.heuristic(neighborPos, endNode),
          f: 0,
          parent: currentNode
        };

        neighbor.f = neighbor.g + neighbor.h;

        // Check if this path to neighbor is better
        const existingIndex = openList.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
        if (existingIndex >= 0) {
          if (neighbor.g < openList[existingIndex].g) {
            openList[existingIndex] = neighbor;
          }
        } else {
          openList.push(neighbor);
        }
      }
    }

    return null; // No path found
  }

  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
    // Manhattan distance for orthogonal routing
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private reconstructPath(endNode: any, gridOffsetX: number, gridOffsetY: number): Point[] {
    const path: Point[] = [];
    let current = endNode;

    while (current) {
      path.unshift({
        x: current.x * this.gridSize + gridOffsetX,
        y: current.y * this.gridSize + gridOffsetY
      });
      current = current.parent;
    }

    return path;
  }

  private pathToSegments(path: Point[]): WireSegment[] {
    if (path.length < 2) return [];

    const segments: WireSegment[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      
      const segment: WireSegment = {
        start,
        end,
        type: start.x === end.x ? 'vertical' : 'horizontal',
        length: Math.abs(start.x === end.x ? end.y - start.y : end.x - start.x)
      };

      segments.push(segment);
    }

    return segments;
  }

  private optimizePath(segments: WireSegment[]): WireSegment[] {
    if (segments.length <= 1) return segments;

    const optimized: WireSegment[] = [];
    let current = segments[0];

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i];

      // Merge consecutive segments of the same type
      if (current.type === next.type) {
        current = {
          start: current.start,
          end: next.end,
          type: current.type,
          length: current.length + next.length
        };
      } else {
        optimized.push(current);
        current = next;
      }
    }

    optimized.push(current);

    // Remove zero-length segments
    return optimized.filter(seg => seg.length > 0);
  }

  private createRoutingResult(segments: WireSegment[], start: Point, end: Point): RoutingResult {
    const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
    const bendCount = Math.max(0, segments.length - 1);
    
    // Calculate quality score (0-1)
    let quality = 1.0;
    
    // Penalize excessive bends
    if (bendCount > 2) {
      quality -= (bendCount - 2) * 0.1;
    }
    
    // Penalize long routes
    const directDistance = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
    if (totalLength > directDistance * 1.5) {
      quality -= 0.2;
    }
    
    quality = Math.max(0, Math.min(1, quality));

    return {
      segments,
      totalLength,
      bendCount,
      quality,
      obstacles: Array.from(this.obstacles.values())
    };
  }

  private invalidateGrid(): void {
    this.pathfindingGrid = [];
  }

  public setConstraints(constraints: Partial<RoutingConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
    this.invalidateGrid();
  }

  public getConstraints(): RoutingConstraints {
    return { ...this.constraints };
  }
}