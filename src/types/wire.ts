import type { RoutedWire, ComponentBounds, Point } from '../utils/wireRouting';
import type { CollisionResult, ReRouteResult } from '../utils/wireCollisionDetection';

export interface WireManagementOptions {
  autoReroute: boolean;
  collisionDetection: boolean;
  optimizeOnMove: boolean;
  realTimeValidation: boolean;
  gridSize: number;
  routingStrategy: 'shortest' | 'minimal_bends' | 'balanced' | 'grid_aligned';
}

export interface WireManagementState {
  wires: Map<string, RoutedWire>;
  collisions: CollisionResult[];
  isRouting: boolean;
  isOptimizing: boolean;
  routingStats: {
    totalLength: number;
    averageQuality: number;
    collisionCount: number;
  };
}
