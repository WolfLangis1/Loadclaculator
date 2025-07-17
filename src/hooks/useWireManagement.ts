import { useState, useCallback, useRef, useEffect } from 'react';
import { WireRoutingEngine, type RoutedWire, type ComponentBounds, type Point } from '../utils/wireRouting';
import { WireCollisionDetector, type CollisionResult, type ReRouteResult } from '../utils/wireCollisionDetection';
import type { SLDComponent, SLDConnection, SLDDiagram } from '../types/sld';
import type { WireManagementOptions, WireManagementState } from '../types/wire';

/**
 * Professional wire management hook with intelligent routing and collision detection
 */
export const useWireManagement = (
  diagram: SLDDiagram,
  options: Partial<WireManagementOptions> = {}
) => {
  const opts: WireManagementOptions = {
    autoReroute: true,
    collisionDetection: true,
    optimizeOnMove: false,
    realTimeValidation: true,
    gridSize: 20,
    routingStrategy: 'balanced',
    ...options
  };

  const [state, setState] = useState<WireManagementState>({
    wires: new Map(),
    collisions: [],
    isRouting: false,
    isOptimizing: false,
    routingStats: {
      totalLength: 0,
      averageQuality: 0,
      collisionCount: 0
    }
  });

  const routingEngineRef = useRef<WireRoutingEngine>(
    new WireRoutingEngine({
      gridSize: opts.gridSize,
      routingStrategy: opts.routingStrategy,
      bendPenalty: 30,
      lengthWeight: 1,
      obstacleBuffer: 15
    })
  );

  const collisionDetectorRef = useRef<WireCollisionDetector>(
    new WireCollisionDetector(routingEngineRef.current)
  );

  // Convert SLD components to ComponentBounds for routing
  const getComponentBounds = useCallback((): ComponentBounds[] => {
    if (!diagram.components) return [];

    return diagram.components.map(component => ({
      id: component.id,
      bounds: {
        x: component.position?.x || 0,
        y: component.position?.y || 0,
        width: component.size?.width || 60,
        height: component.size?.height || 40
      },
      connectionPoints: [
        {
          x: (component.position?.x || 0) + (component.size?.width || 60) / 2,
          y: (component.position?.y || 0) + (component.size?.height || 40) / 2
        }
      ],
      type: 'component'
    }));
  }, [diagram.components]);

  // Get canvas bounds
  const getCanvasBounds = useCallback(() => ({
    x: 0,
    y: 0,
    width: diagram.canvasSize?.width || 1200,
    height: diagram.canvasSize?.height || 800
  }), [diagram.canvasSize]);

  // Route a single connection
  const routeConnection = useCallback(async (
    connection: SLDConnection,
    fromComponent: SLDComponent,
    toComponent: SLDComponent
  ): Promise<RoutedWire | null> => {
    if (!fromComponent.position || !toComponent.position) return null;

    setState(prev => ({ ...prev, isRouting: true }));

    try {
      const componentBounds = getComponentBounds();
      const canvasBounds = getCanvasBounds();

      // Update routing engine with current obstacles
      routingEngineRef.current.setObstacles(componentBounds, canvasBounds);

      const startPoint: Point = {
        x: fromComponent.position.x + (fromComponent.size?.width || 60) / 2,
        y: fromComponent.position.y + (fromComponent.size?.height || 40) / 2
      };

      const endPoint: Point = {
        x: toComponent.position.x + (toComponent.size?.width || 60) / 2,
        y: toComponent.position.y + (toComponent.size?.height || 40) / 2
      };

      const routedWire = routingEngineRef.current.routeWire(
        startPoint,
        endPoint,
        connection.id,
        connection.wireType
      );

      if (routedWire) {
        setState(prev => ({
          ...prev,
          wires: new Map(prev.wires).set(connection.id, routedWire),
          isRouting: false
        }));

        // Update statistics
        updateStats();

        return routedWire;
      }

      return null;
    } catch (error) {
      console.error('Error routing connection:', error);
      return null;
    } finally {
      setState(prev => ({ ...prev, isRouting: false }));
    }
  }, [getComponentBounds, getCanvasBounds]);

  // Route all connections in the diagram
  const routeAllConnections = useCallback(async (): Promise<void> => {
    if (!diagram.connections || !diagram.components) return;

    setState(prev => ({ ...prev, isRouting: true }));

    try {
      const componentBounds = getComponentBounds();
      const canvasBounds = getCanvasBounds();
      
      routingEngineRef.current.setObstacles(componentBounds, canvasBounds);
      routingEngineRef.current.clearExistingWires();

      const newWires = new Map<string, RoutedWire>();

      // Route connections in order of priority (shorter connections first)
      const sortedConnections = [...diagram.connections].sort((a, b) => {
        const fromA = diagram.components.find(c => c.id === a.fromComponentId);
        const toA = diagram.components.find(c => c.id === a.toComponentId);
        const fromB = diagram.components.find(c => c.id === b.fromComponentId);
        const toB = diagram.components.find(c => c.id === b.toComponentId);

        if (!fromA || !toA || !fromB || !toB) return 0;

        const distA = Math.abs(fromA.position!.x - toA.position!.x) + 
                     Math.abs(fromA.position!.y - toA.position!.y);
        const distB = Math.abs(fromB.position!.x - toB.position!.x) + 
                     Math.abs(fromB.position!.y - toB.position!.y);

        return distA - distB;
      });

      for (const connection of sortedConnections) {
        const fromComponent = diagram.components.find(c => c.id === connection.fromComponentId);
        const toComponent = diagram.components.find(c => c.id === connection.toComponentId);

        if (fromComponent && toComponent) {
          const routedWire = await routeConnection(connection, fromComponent, toComponent);
          if (routedWire) {
            newWires.set(connection.id, routedWire);
          }
        }
      }

      setState(prev => ({
        ...prev,
        wires: newWires,
        isRouting: false
      }));

      // Update collision detection
      if (opts.collisionDetection) {
        await detectCollisions();
      }

    } catch (error) {
      console.error('Error routing all connections:', error);
    } finally {
      setState(prev => ({ ...prev, isRouting: false }));
    }
  }, [diagram.connections, diagram.components, routeConnection, opts.collisionDetection]);

  // Detect collisions in current wire layout
  const detectCollisions = useCallback(async (): Promise<CollisionResult[]> => {
    const wires = Array.from(state.wires.values());
    const componentBounds = getComponentBounds();

    const collisions = collisionDetectorRef.current.detectAllCollisions(wires, componentBounds);

    setState(prev => ({
      ...prev,
      collisions
    }));

    return collisions;
  }, [state.wires, getComponentBounds]);

  // Automatically re-route wires with collisions
  const autoRerouteCollisions = useCallback(async (): Promise<ReRouteResult[]> => {
    if (!opts.autoReroute) return [];

    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      const wires = Array.from(state.wires.values());
      const componentBounds = getComponentBounds();
      const canvasBounds = getCanvasBounds();

      const rerouteResults = await collisionDetectorRef.current.rerouteCollidingWires(
        wires,
        componentBounds,
        canvasBounds
      );

      // Update wires with successful re-routes
      const updatedWires = new Map(state.wires);
      for (const result of rerouteResults) {
        if (result.success && result.newRoute) {
          updatedWires.set(result.oldRoute.id, result.newRoute);
        }
      }

      setState(prev => ({
        ...prev,
        wires: updatedWires,
        isOptimizing: false
      }));

      // Re-detect collisions after re-routing
      await detectCollisions();

      return rerouteResults;
    } catch (error) {
      console.error('Error auto-rerouting collisions:', error);
      return [];
    } finally {
      setState(prev => ({ ...prev, isOptimizing: false }));
    }
  }, [opts.autoReroute, state.wires, getComponentBounds, getCanvasBounds, detectCollisions]);

  // Optimize entire wire layout
  const optimizeWireLayout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      const wires = Array.from(state.wires.values());
      const componentBounds = getComponentBounds();
      const canvasBounds = getCanvasBounds();

      const optimizedWires = await collisionDetectorRef.current.optimizeWireLayout(
        wires,
        componentBounds,
        canvasBounds
      );

      const optimizedWireMap = new Map<string, RoutedWire>();
      optimizedWires.forEach(wire => {
        optimizedWireMap.set(wire.id, wire);
      });

      setState(prev => ({
        ...prev,
        wires: optimizedWireMap,
        isOptimizing: false
      }));

      updateStats();
    } catch (error) {
      console.error('Error optimizing wire layout:', error);
    } finally {
      setState(prev => ({ ...prev, isOptimizing: false }));
    }
  }, [getComponentBounds, getCanvasBounds]);

  // Handle component movement (re-route affected wires)
  const handleComponentMove = useCallback(async (
    componentId: string,
    oldPosition: Point,
    newPosition: Point
  ): Promise<void> => {
    if (!diagram.connections) return;

    // Find connections affected by this component
    const affectedConnections = diagram.connections.filter(
      conn => conn.fromComponentId === componentId || conn.toComponentId === componentId
    );

    if (affectedConnections.length === 0) return;

    // Re-route affected connections
    const componentBounds = getComponentBounds();
    const canvasBounds = getCanvasBounds();
    
    routingEngineRef.current.setObstacles(componentBounds, canvasBounds);

    const updatedWires = new Map(state.wires);

    for (const connection of affectedConnections) {
      const fromComponent = diagram.components?.find(c => c.id === connection.fromComponentId);
      const toComponent = diagram.components?.find(c => c.id === connection.toComponentId);

      if (fromComponent && toComponent) {
        const routedWire = await routeConnection(connection, fromComponent, toComponent);
        if (routedWire) {
          updatedWires.set(connection.id, routedWire);
        }
      }
    }

    setState(prev => ({ ...prev, wires: updatedWires }));

    // Optimize layout if enabled
    if (opts.optimizeOnMove) {
      await optimizeWireLayout();
    }

    // Check for new collisions
    if (opts.collisionDetection) {
      await detectCollisions();
    }
  }, [diagram.connections, diagram.components, routeConnection, opts.optimizeOnMove, opts.collisionDetection]);

  // Update routing statistics
  const updateStats = useCallback(() => {
    const wires = Array.from(state.wires.values());
    const stats = routingEngineRef.current.getRoutingStats();
    const collisionStats = collisionDetectorRef.current.getCollisionStats(
      wires,
      getComponentBounds()
    );

    setState(prev => ({
      ...prev,
      routingStats: {
        totalLength: stats.totalLength,
        averageQuality: stats.averageQuality,
        collisionCount: collisionStats.totalCollisions
      }
    }));
  }, [state.wires, getComponentBounds]);

  // Get wire path for rendering
  const getWirePath = useCallback((connectionId: string): Point[] | null => {
    const wire = state.wires.get(connectionId);
    return wire ? wire.path : null;
  }, [state.wires]);

  // Get wire style based on type and state
  const getWireStyle = useCallback((connectionId: string) => {
    const wire = state.wires.get(connectionId);
    if (!wire) return null;

    const hasCollision = state.collisions.some(
      collision => collision.affectedWires.includes(connectionId)
    );

    const connection = diagram.connections?.find(c => c.id === connectionId);
    const wireType = connection?.wireType || 'ac';

    // Base styles by wire type
    const baseStyles = {
      ac: { stroke: '#2563eb', strokeWidth: 2 },
      dc: { stroke: '#dc2626', strokeWidth: 3, strokeDasharray: '8,4' },
      ground: { stroke: '#059669', strokeWidth: 2, strokeDasharray: '12,6' }
    };

    const style = baseStyles[wireType] || baseStyles.ac;

    // Modify style for collisions
    if (hasCollision) {
      style.stroke = '#ef4444';
      style.strokeWidth += 1;
    }

    // Modify style for quality
    if (wire.quality < 0.5) {
      style.stroke = '#f59e0b';
    }

    return style;
  }, [state.wires, state.collisions, diagram.connections]);

  // Clear all wires
  const clearAllWires = useCallback(() => {
    setState(prev => ({
      ...prev,
      wires: new Map(),
      collisions: []
    }));
    routingEngineRef.current.clearExistingWires();
  }, []);

  // Update routing options
  const updateRoutingOptions = useCallback((newOptions: Partial<WireManagementOptions>) => {
    Object.assign(opts, newOptions);
    
    // Update routing engine if grid size or strategy changed
    if (newOptions.gridSize || newOptions.routingStrategy) {
      routingEngineRef.current = new WireRoutingEngine({
        gridSize: opts.gridSize,
        routingStrategy: opts.routingStrategy,
        bendPenalty: 30,
        lengthWeight: 1,
        obstacleBuffer: 15
      });
      
      collisionDetectorRef.current = new WireCollisionDetector(routingEngineRef.current);
    }
  }, []);

  // Effect to handle real-time validation
  useEffect(() => {
    if (opts.realTimeValidation && state.wires.size > 0) {
      const timer = setTimeout(() => {
        detectCollisions();
      }, 500); // Debounce collision detection

      return () => clearTimeout(timer);
    }
  }, [opts.realTimeValidation, state.wires, detectCollisions]);

  // Auto-route when diagram changes
  useEffect(() => {
    if (diagram.connections && diagram.connections.length > 0) {
      routeAllConnections();
    }
  }, [diagram.connections, routeAllConnections]);

  return {
    // State
    wires: state.wires,
    collisions: state.collisions,
    isRouting: state.isRouting,
    isOptimizing: state.isOptimizing,
    routingStats: state.routingStats,

    // Actions
    routeConnection,
    routeAllConnections,
    detectCollisions,
    autoRerouteCollisions,
    optimizeWireLayout,
    handleComponentMove,
    clearAllWires,
    updateRoutingOptions,

    // Utilities
    getWirePath,
    getWireStyle
  };
};

export default useWireManagement;