import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  Eye,
  EyeOff
} from 'lucide-react';
import type { 
  SLDDiagram, 
  SLDComponent, 
  SLDConnection
  // SLDPosition,
  // SLDComponentBase 
} from '../../types/sld';
import { ComponentPropertiesEditor } from './ComponentPropertiesEditor';
import { RealisticComponentRenderer } from './RealisticComponentRenderer';

interface EnhancedSLDCanvasProps {
  diagram: SLDDiagram;
  onDiagramChange: (diagram: SLDDiagram) => void;
  readonly?: boolean;
  collaborationUsers?: Array<{ id: string; name: string; color: string; position?: { x: number; y: number } }>;
  accessibilityMode?: boolean;
  performanceMode?: 'high' | 'medium' | 'low';
  activeTool?: 'select' | 'draw_cable' | 'add_text' | 'pan';
}

interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  selectedElements: string[];
  isDragging: boolean;
  dragStart: { x: number; y: number };
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showLayers: boolean;
  showCollaborationCursors: boolean;
  showPerformanceMetrics: boolean;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: string[];
  color: string;
  opacity: number;
}

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  connectionCount: number;
  fps: number;
  memoryUsage: number;
}

export const EnhancedSLDCanvas: React.FC<EnhancedSLDCanvasProps> = ({
  diagram,
  onDiagramChange,
  readonly = false,
  collaborationUsers = [],
  accessibilityMode = false,
  performanceMode = 'high',
  activeTool = 'select'
}) => {
  // Early return if diagram is null or undefined
  if (!diagram) {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-lg font-medium mb-2">No Diagram Available</div>
          <div className="text-sm">Please create or load a diagram to continue.</div>
        </div>
      </div>
    );
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedElements: [],
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
    showLayers: false,
    showCollaborationCursors: true,
    showPerformanceMetrics: false
  });

  const [layers, setLayers] = useState<Layer[]>([
    { id: 'components', name: 'Components', visible: true, locked: false, elements: [], color: '#3b82f6', opacity: 1 },
    { id: 'connections', name: 'Connections', visible: true, locked: false, elements: [], color: '#374151', opacity: 1 },
    { id: 'labels', name: 'Labels', visible: true, locked: false, elements: [], color: '#059669', opacity: 1 },
    { id: 'annotations', name: 'Annotations', visible: true, locked: false, elements: [], color: '#dc2626', opacity: 1 }
  ]);

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    connectionCount: 0,
    fps: 60,
    memoryUsage: 0
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isDraggingComponent, setIsDraggingComponent] = useState(false);
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ componentId: string; port: string } | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    type: 'text' | 'dimension' | 'note';
    position: { x: number; y: number };
    text: string;
    fontSize: number;
    color: string;
  }>>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showPropertiesEditor, setShowPropertiesEditor] = useState(false);
  const [selectedComponentForEdit, setSelectedComponentForEdit] = useState<SLDComponent | null>(null);
  const [isRubberBandSelecting, setIsRubberBandSelecting] = useState(false);
  const [rubberBandStart, setRubberBandStart] = useState<{ x: number; y: number } | null>(null);
  const [rubberBandEnd, setRubberBandEnd] = useState<{ x: number; y: number } | null>(null);

  // Canvas boundaries (in canvas coordinates)
  const CANVAS_BOUNDS = useMemo(() => ({
    minX: 50,
    minY: 50,
    maxX: 2000,
    maxY: 1500
  }), []);

  // Function to constrain position within canvas bounds
  const constrainPosition = useCallback((x: number, y: number, componentSize: { width: number; height: number }) => {
    const constrainedX = Math.max(
      CANVAS_BOUNDS.minX, 
      Math.min(CANVAS_BOUNDS.maxX - componentSize.width, x)
    );
    const constrainedY = Math.max(
      CANVAS_BOUNDS.minY, 
      Math.min(CANVAS_BOUNDS.maxY - componentSize.height, y)
    );
    return { x: constrainedX, y: constrainedY };
  }, [CANVAS_BOUNDS]);

  // Function to rescue components that are outside bounds
  const rescueOutOfBoundsComponents = useCallback(() => {
    if (!diagram?.components || readonly) return;

    let hasOutOfBoundsComponents = false;
    const rescuedComponents = diagram.components.map(component => {
      const isOutOfBounds = 
        component.position.x < CANVAS_BOUNDS.minX ||
        component.position.y < CANVAS_BOUNDS.minY ||
        component.position.x + component.size.width > CANVAS_BOUNDS.maxX ||
        component.position.y + component.size.height > CANVAS_BOUNDS.maxY;

      if (isOutOfBounds) {
        hasOutOfBoundsComponents = true;
        const rescuedPosition = constrainPosition(component.position.x, component.position.y, component.size);
        return { ...component, position: rescuedPosition };
      }
      return component;
    });

    if (hasOutOfBoundsComponents && onDiagramChange) {
      onDiagramChange({
        ...diagram,
        components: rescuedComponents,
        lastModified: new Date()
      });
    }
  }, [diagram, readonly, CANVAS_BOUNDS, constrainPosition, onDiagramChange]);

  // Auto-rescue components on diagram load
  useEffect(() => {
    if (diagram?.components) {
      rescueOutOfBoundsComponents();
    }
  }, [diagram?.id]); // Only run when diagram changes, not on every render

  // Performance optimization
  const shouldRenderComponent = useCallback((component: SLDComponent) => {
    // First check if component has all required properties
    if (!component || !component.position || !component.size || 
        component.rotation === undefined || !component.type || !component.name) {
      return false;
    }

    if (performanceMode === 'low') {
      // Only render visible components
      const viewport = {
        x: -canvasState.pan.x / canvasState.zoom,
        y: -canvasState.pan.y / canvasState.zoom,
        width: (canvasRef.current?.clientWidth || 800) / canvasState.zoom,
        height: (canvasRef.current?.clientHeight || 600) / canvasState.zoom
      };
      
      const componentX = component.position.x;
      const componentY = component.position.y;
      const componentWidth = component.size.width;
      const componentHeight = component.size.height;
      
      return componentX + componentWidth >= viewport.x &&
             componentX <= viewport.x + viewport.width &&
             componentY + componentHeight >= viewport.y &&
             componentY <= viewport.y + viewport.height;
    }
    return true;
  }, [canvasState.pan, canvasState.zoom, performanceMode]);

  // Measure performance
  useEffect(() => {
    if (canvasState.showPerformanceMetrics) {
      const startTime = performance.now();
      
      const measurePerformance = () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        setPerformanceMetrics({
          renderTime: Math.round(renderTime),
          componentCount: diagram.components?.length || 0,
          connectionCount: diagram.connections?.length || 0,
          fps: Math.round(1000 / renderTime),
          memoryUsage: Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)
        });
      };
      
      requestAnimationFrame(measurePerformance);
    }
  }, [diagram.components?.length, diagram.connections?.length, canvasState.showPerformanceMetrics]);

  // Enhanced grid pattern with better styling
  const gridPattern = useMemo(() => {
    const patternId = 'enhanced-grid-pattern';
    const majorGridSize = canvasState.gridSize * 5;
    
    return (
      <defs>
        <pattern id={patternId} x="0" y="0" width={majorGridSize} height={majorGridSize} patternUnits="userSpaceOnUse">
          {/* Minor grid lines */}
          <path 
            d={`M ${canvasState.gridSize} 0 L 0 0 0 ${canvasState.gridSize}`} 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth="0.5" 
            opacity="0.3"
          />
          {/* Major grid lines */}
          <path 
            d={`M ${majorGridSize} 0 L 0 0 0 ${majorGridSize}`} 
            fill="none" 
            stroke="#d1d5db" 
            strokeWidth="1" 
            opacity="0.5"
          />
        </pattern>
      </defs>
    );
  }, [canvasState.gridSize]);

  // Enhanced component rendering with accessibility
  const createComponentElement = useCallback((component: SLDComponent) => {
    const { position, size, rotation, type, name } = component;
    
    // Safety check for required properties
    if (!position || !size || rotation === undefined || !type || !name) {
      console.warn('Component missing required properties:', {
        id: component.id,
        hasPosition: !!position,
        hasSize: !!size,
        hasRotation: rotation !== undefined,
        hasType: !!type,
        hasName: !!name,
        component
      });
      return null;
    }
    
    const transform = `translate(${position.x}, ${position.y}) rotate(${rotation})`;
    const isSelected = canvasState.selectedElements.includes(component.id);
    const isHovered = hoveredElement === component.id;
    
    // Accessibility attributes
    const accessibilityProps = accessibilityMode ? {
      role: 'button',
      tabIndex: 0,
      'aria-label': `${name} - ${type} component`,
      'aria-describedby': `component-${component.id}-desc`
    } : {};

    const baseProps = {
      transform,
      className: `cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isHovered ? 'ring-1 ring-gray-400' : ''} ${
        isDraggingComponent && draggedComponentId === component.id ? 'cursor-grabbing' : 'cursor-grab'
      }`,
      onClick: (e: React.MouseEvent) => handleComponentClick(component.id, e),
      onMouseDown: (e: React.MouseEvent) => handleComponentMouseDown(component.id, e),
      onMouseEnter: () => setHoveredElement(component.id),
      onMouseLeave: () => setHoveredElement(null),
      onDoubleClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        // Start connection drawing from this component if in cable drawing mode
        if (!readonly && activeTool === 'draw_cable') {
          if (!isDrawingConnection) {
            setIsDrawingConnection(true);
            setConnectionStart({ componentId: component.id, port: 'output' });
          } else if (connectionStart && connectionStart.componentId !== component.id) {
            // Complete the connection
            const newConnection = {
              id: `connection-${Date.now()}`,
              fromComponentId: connectionStart.componentId,
              toComponentId: component.id,
              fromPort: connectionStart.port,
              toPort: 'input',
              wireType: 'ac' as const,
              label: `${connectionStart.componentId} → ${component.id}`,
              voltage: 240,
              current: 50,
              conductorSize: '12 AWG',
              conduitType: 'EMT'
            };
            
            if (onDiagramChange) {
              const updatedDiagram = {
                ...diagram,
                connections: [...(diagram.connections || []), newConnection],
                lastModified: new Date()
              };
              onDiagramChange(updatedDiagram);
            }
            
            setIsDrawingConnection(false);
            setConnectionStart(null);
            setTempConnectionEnd(null);
          }
        } else if (!readonly && activeTool === 'select') {
          // Open properties editor on double-click in select mode
          setSelectedComponentForEdit(component);
          setShowPropertiesEditor(true);
        }
      },
      ...accessibilityProps
    };

    // Use realistic component renderer for enhanced visual representation
    return (
      <RealisticComponentRenderer
        key={component.id}
        component={component}
        size={size}
        isSelected={isSelected}
        isHovered={isHovered}
        baseProps={baseProps}
        accessibilityMode={accessibilityMode}
      />
    );
  }, [canvasState.selectedElements, hoveredElement, accessibilityMode]);

  // Enhanced connection rendering
  const createConnectionElement = useCallback((connection: SLDConnection) => {
    // Safety check for required properties
    if (!connection.fromComponentId || !connection.toComponentId || !connection.wireType) {
      console.warn('Connection missing required properties:', connection);
      return null;
    }
    
    const fromComponent = diagram.components?.find(c => c.id === connection.fromComponentId);
    const toComponent = diagram.components?.find(c => c.id === connection.toComponentId);
    
    if (!fromComponent || !toComponent) return null;

    const x1 = (fromComponent.position?.x || 0) + (fromComponent.size?.width || 0) / 2;
    const y1 = (fromComponent.position?.y || 0) + (fromComponent.size?.height || 0) / 2;
    const x2 = (toComponent.position?.x || 0) + (toComponent.size?.width || 0) / 2;
    const y2 = (toComponent.position?.y || 0) + (toComponent.size?.height || 0) / 2;

    const isSelected = canvasState.selectedElements.includes(connection.id);
    const isHovered = hoveredElement === connection.id;

    // Connection styling based on type
    const getConnectionStyle = () => {
      switch (connection.wireType) {
        case 'dc':
          return { stroke: '#dc2626', strokeWidth: 3, strokeDasharray: '5,5' };
        case 'ac':
          return { stroke: '#2563eb', strokeWidth: 2 };
        case 'ground':
          return { stroke: '#059669', strokeWidth: 2, strokeDasharray: '10,5' };
        default:
          return { stroke: '#374151', strokeWidth: 2 };
      }
    };

    const style = getConnectionStyle();

    return (
      <g
        key={connection.id}
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-1 ring-blue-500' : ''
        } ${isHovered ? 'ring-1 ring-gray-400' : ''}`}
        onClick={() => handleConnectionClick(connection.id)}
        onMouseEnter={() => setHoveredElement(connection.id)}
        onMouseLeave={() => setHoveredElement(null)}
        role={accessibilityMode ? 'button' : undefined}
        tabIndex={accessibilityMode ? 0 : undefined}
        aria-label={accessibilityMode ? `${connection.wireType.toUpperCase()} connection from ${fromComponent.name} to ${toComponent.name}` : undefined}
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          fill="none"
          {...style}
          opacity={isHovered ? 0.8 : 1}
        />
        {/* Connection label */}
        {connection.label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 5}
            textAnchor="middle"
            fontSize="8"
            fill={style.stroke}
            className="select-none"
          >
            {connection.label}
          </text>
        )}
      </g>
    );
  }, [diagram.components, canvasState.selectedElements, hoveredElement, accessibilityMode]);

  // Collaboration cursor rendering
  const renderCollaborationCursors = useCallback(() => {
    if (!canvasState.showCollaborationCursors || !collaborationUsers || collaborationUsers.length === 0) {
      return null;
    }

    return collaborationUsers.map((user) => {
      if (!user || !user.position || !user.id) return null;
      
      return (
        <g key={`cursor-${user.id}`} className="pointer-events-none">
          <circle
            cx={user.position.x || 0}
            cy={user.position.y || 0}
            r="8"
            fill={user.color || '#3b82f6'}
            opacity="0.7"
          />
          <text
            x={user.position.x || 0}
            y={(user.position.y || 0) - 15}
            textAnchor="middle"
            fontSize="10"
            fill={user.color || '#3b82f6'}
            fontWeight="bold"
            className="select-none"
          >
            {user.name || 'User'}
          </text>
        </g>
      );
    });
  }, [collaborationUsers, canvasState.showCollaborationCursors]);

  // Enhanced event handlers for professional SLD editing
  const handleComponentClick = useCallback((componentId: string, event?: React.MouseEvent) => {
    if (readonly) return;
    
    event?.stopPropagation();
    
    // Handle multi-selection with Ctrl/Cmd key
    const isMultiSelect = event?.ctrlKey || event?.metaKey;
    
    setCanvasState(prev => ({
      ...prev,
      selectedElements: isMultiSelect
        ? prev.selectedElements.includes(componentId)
          ? prev.selectedElements.filter(id => id !== componentId)
          : [...prev.selectedElements, componentId]
        : [componentId]
    }));
  }, [readonly]);

  const handleComponentMouseDown = useCallback((componentId: string, event: React.MouseEvent) => {
    if (readonly) return;
    
    event.stopPropagation();

    // Only allow dragging in select mode
    if (activeTool !== 'select') return;
    
    const component = diagram.components?.find(c => c.id === componentId);
    if (!component) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - (canvasState.pan?.x || 0)) / (canvasState.zoom || 1);
    const y = (event.clientY - rect.top - (canvasState.pan?.y || 0)) / (canvasState.zoom || 1);

    setIsDraggingComponent(true);
    setDraggedComponentId(componentId);
    setDragOffset({
      x: x - component.position.x,
      y: y - component.position.y
    });

    // Select component if not already selected
    if (!canvasState.selectedElements.includes(componentId)) {
      handleComponentClick(componentId, event);
    }
  }, [readonly, activeTool, diagram.components, canvasState.pan, canvasState.zoom, canvasState.selectedElements, handleComponentClick]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingComponent(false);
    setDraggedComponentId(null);
    setDragOffset({ x: 0, y: 0 });
    
    // Reset resize state
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartPos(null);
    setResizeStartSize(null);
    
    // Finish connection drawing
    if (isDrawingConnection && tempConnectionEnd && connectionStart) {
      // Find component at end position
      const endComponent = diagram.components?.find(c => 
        c.position.x <= tempConnectionEnd.x && 
        tempConnectionEnd.x <= c.position.x + c.size.width &&
        c.position.y <= tempConnectionEnd.y && 
        tempConnectionEnd.y <= c.position.y + c.size.height
      );
      
      if (endComponent && endComponent.id !== connectionStart.componentId && onDiagramChange) {
        // Create new connection
        const newConnection = {
          id: `connection-${Date.now()}`,
          fromComponentId: connectionStart.componentId,
          toComponentId: endComponent.id,
          fromPort: connectionStart.port,
          toPort: 'input',
          wireType: 'ac' as const,
          label: `${connectionStart.componentId} → ${endComponent.id}`
        };
        
        const updatedDiagram = {
          ...diagram,
          connections: [...(diagram.connections || []), newConnection],
          lastModified: new Date()
        };
        onDiagramChange(updatedDiagram);
      }
      
      setIsDrawingConnection(false);
      setConnectionStart(null);
      setTempConnectionEnd(null);
    }

    // Handle rubber band selection completion
    if (isRubberBandSelecting && rubberBandStart && rubberBandEnd) {
      const minX = Math.min(rubberBandStart.x, rubberBandEnd.x);
      const maxX = Math.max(rubberBandStart.x, rubberBandEnd.x);
      const minY = Math.min(rubberBandStart.y, rubberBandEnd.y);
      const maxY = Math.max(rubberBandStart.y, rubberBandEnd.y);

      // Find components within selection rectangle
      const selectedComponentIds = diagram.components?.filter(component => {
        const compLeft = component.position.x;
        const compRight = component.position.x + component.size.width;
        const compTop = component.position.y;
        const compBottom = component.position.y + component.size.height;

        // Check if component overlaps with selection rectangle
        return !(compRight < minX || compLeft > maxX || compBottom < minY || compTop > maxY);
      }).map(c => c.id) || [];

      // Find connections within selection rectangle
      const selectedConnectionIds = diagram.connections?.filter(connection => {
        const fromComponent = diagram.components?.find(c => c.id === connection.fromComponentId);
        const toComponent = diagram.components?.find(c => c.id === connection.toComponentId);
        
        if (!fromComponent || !toComponent) return false;

        const fromX = fromComponent.position.x + fromComponent.size.width / 2;
        const fromY = fromComponent.position.y + fromComponent.size.height / 2;
        const toX = toComponent.position.x + toComponent.size.width / 2;
        const toY = toComponent.position.y + toComponent.size.height / 2;

        // Check if connection line intersects with selection rectangle
        return (fromX >= minX && fromX <= maxX && fromY >= minY && fromY <= maxY) ||
               (toX >= minX && toX <= maxX && toY >= minY && toY <= maxY);
      }).map(c => c.id) || [];

      const newSelectedElements = [...selectedComponentIds, ...selectedConnectionIds];

      setCanvasState(prev => ({
        ...prev,
        selectedElements: [...prev.selectedElements, ...newSelectedElements]
      }));

      setIsRubberBandSelecting(false);
      setRubberBandStart(null);
      setRubberBandEnd(null);
    }
  }, [isDraggingComponent, isDrawingConnection, tempConnectionEnd, connectionStart, diagram, onDiagramChange, isRubberBandSelecting, rubberBandStart, rubberBandEnd]);

  const handleConnectionClick = useCallback((connectionId: string) => {
    if (readonly) return;
    
    setCanvasState(prev => ({
      ...prev,
      selectedElements: prev.selectedElements.includes(connectionId)
        ? prev.selectedElements.filter(id => id !== connectionId)
        : [...prev.selectedElements, connectionId]
    }));
  }, [readonly]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - (canvasState.pan?.x || 0)) / (canvasState.zoom || 1);
    const y = (event.clientY - rect.top - (canvasState.pan?.y || 0)) / (canvasState.zoom || 1);
    
    setMousePosition({ x, y });

    if (readonly) return;

    // Handle component resizing
    if (isResizing && draggedComponentId && resizeHandle && resizeStartPos && resizeStartSize && onDiagramChange) {
      const deltaX = x - resizeStartPos.x;
      const deltaY = y - resizeStartPos.y;
      
      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = 0;
      let newY = 0;

      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          newX = deltaX;
          break;
        case 'ne':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = deltaY;
          break;
        case 'nw':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newX = deltaX;
          newY = deltaY;
          break;
      }

      const updatedComponents = diagram.components?.map(component => {
        if (component.id === draggedComponentId) {
          const currentPos = component.position;
          return {
            ...component,
            size: { width: newWidth, height: newHeight },
            position: { 
              x: currentPos.x + newX, 
              y: currentPos.y + newY 
            }
          };
        }
        return component;
      }) || [];

      const updatedDiagram = {
        ...diagram,
        components: updatedComponents,
        lastModified: new Date()
      };
      onDiagramChange(updatedDiagram);
    }
    // Handle component dragging
    else if (isDraggingComponent && draggedComponentId && onDiagramChange) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      // Snap to grid if enabled
      const snapX = canvasState.snapToGrid 
        ? Math.round(newX / canvasState.gridSize) * canvasState.gridSize 
        : newX;
      const snapY = canvasState.snapToGrid 
        ? Math.round(newY / canvasState.gridSize) * canvasState.gridSize 
        : newY;

      // Update all selected components if multiple are selected
      const componentsToMove = canvasState.selectedElements.includes(draggedComponentId)
        ? canvasState.selectedElements
        : [draggedComponentId];

      const draggedComponent = diagram.components?.find(c => c.id === draggedComponentId);
      if (!draggedComponent) return;

      // Constrain the dragged component's position within bounds
      const constrainedPos = constrainPosition(snapX, snapY, draggedComponent.size);
      const deltaX = constrainedPos.x - draggedComponent.position.x;
      const deltaY = constrainedPos.y - draggedComponent.position.y;

      const updatedComponents = diagram.components?.map(component => {
        if (componentsToMove.includes(component.id)) {
          const newX = component.position.x + deltaX;
          const newY = component.position.y + deltaY;
          
          // Constrain each component's new position within bounds
          const constrainedComponentPos = constrainPosition(newX, newY, component.size);
          
          return {
            ...component,
            position: constrainedComponentPos
          };
        }
        return component;
      }) || [];

      const updatedDiagram = {
        ...diagram,
        components: updatedComponents,
        lastModified: new Date()
      };
      onDiagramChange(updatedDiagram);
    }

    // Handle connection drawing
    if (isDrawingConnection) {
      setTempConnectionEnd({ x, y });
    }

    // Handle rubber band selection
    if (isRubberBandSelecting && rubberBandStart) {
      setRubberBandEnd({ x, y });
    }
  }, [canvasState.pan, canvasState.zoom, readonly, isDraggingComponent, draggedComponentId, dragOffset, canvasState.snapToGrid, canvasState.gridSize, canvasState.selectedElements, diagram, onDiagramChange, isDrawingConnection]);

  // Handle canvas mouse down for rubber band selection and other tools
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (readonly) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - (canvasState.pan?.x || 0)) / (canvasState.zoom || 1);
    const y = (event.clientY - rect.top - (canvasState.pan?.y || 0)) / (canvasState.zoom || 1);

    if (activeTool === 'select') {
      // Start rubber band selection
      setIsRubberBandSelecting(true);
      setRubberBandStart({ x, y });
      setRubberBandEnd({ x, y });
      
      // Clear current selection unless Ctrl is held
      if (!event.ctrlKey && !event.metaKey) {
        setCanvasState(prev => ({ ...prev, selectedElements: [] }));
      }
    } else if (activeTool === 'add_text') {
      // Add new text annotation
      const newAnnotation = {
        id: `annotation-${Date.now()}`,
        type: 'text' as const,
        position: { x, y },
        text: 'New Text',
        fontSize: 12,
        color: '#000000'
      };

      setAnnotations(prev => [...prev, newAnnotation]);
      setIsEditingText(true);
      setEditingTextId(newAnnotation.id);
      setTextInput(newAnnotation.text);
    }
  }, [readonly, activeTool, canvasState.pan, canvasState.zoom]);

  // Handle canvas click for finishing actions
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // This is called after mouse up, used for finishing actions
  }, []);

  // Render annotations
  const renderAnnotations = useCallback(() => {
    return annotations.map(annotation => (
      <g key={annotation.id}>
        <text
          x={annotation.position.x}
          y={annotation.position.y}
          fontSize={annotation.fontSize}
          fill={annotation.color}
          className="select-none cursor-pointer"
          onDoubleClick={() => {
            setIsEditingText(true);
            setEditingTextId(annotation.id);
            setTextInput(annotation.text);
          }}
        >
          {annotation.text}
        </text>
        {/* Annotation selection indicator */}
        {canvasState.selectedElements.includes(annotation.id) && (
          <rect
            x={annotation.position.x - 2}
            y={annotation.position.y - annotation.fontSize - 2}
            width={annotation.text.length * annotation.fontSize * 0.6 + 4}
            height={annotation.fontSize + 4}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        )}
      </g>
    ));
  }, [annotations, canvasState.selectedElements]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (readonly) return;
    
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, (canvasState.zoom || 1) * delta));
    
    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom
    }));
  }, [canvasState.zoom, readonly]);

  // Drag and drop handlers
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (readonly) return;
    
    event.preventDefault();
    
    try {
      const templateData = JSON.parse(event.dataTransfer.getData('application/json'));
      const rect = svgRef.current?.getBoundingClientRect();
      
      if (!rect) return;
      
      const x = (event.clientX - rect.left - (canvasState.pan?.x || 0)) / (canvasState.zoom || 1);
      const y = (event.clientY - rect.top - (canvasState.pan?.y || 0)) / (canvasState.zoom || 1);
      
      // Constrain the drop position within canvas bounds
      const constrainedPos = constrainPosition(x, y, templateData.defaultSize);
      
      const newComponent = {
        id: `${templateData.type}-${Date.now()}`,
        type: templateData.type,
        name: templateData.name,
        position: constrainedPos,
        size: templateData.defaultSize,
        rotation: 0,
        labels: [],
        necLabels: [],
        specifications: templateData.specifications
      };
      
      // Add component to diagram
      if (onDiagramChange && diagram) {
        const updatedDiagram = {
          ...diagram,
          components: [...diagram.components, newComponent as any],
          lastModified: new Date()
        };
        onDiagramChange(updatedDiagram);
      }
    } catch (error) {
      console.error('Failed to drop component:', error);
    }
  }, [diagram, onDiagramChange, canvasState.pan, canvasState.zoom, readonly]);

  // Keyboard navigation for accessibility and editing
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (canvasState.selectedElements.length > 0 && !readonly) {
          event.preventDefault();
          // Delete selected components and connections
          if (onDiagramChange && diagram) {
            const updatedDiagram = {
              ...diagram,
              components: diagram.components.filter(c => !canvasState.selectedElements.includes(c.id)),
              connections: diagram.connections?.filter(conn => 
                !canvasState.selectedElements.includes(conn.id) &&
                !canvasState.selectedElements.includes(conn.fromComponentId) &&
                !canvasState.selectedElements.includes(conn.toComponentId)
              ) || [],
              lastModified: new Date()
            };
            onDiagramChange(updatedDiagram);
            // Clear selection after deletion
            setCanvasState(prev => ({ ...prev, selectedElements: [] }));
          }
        }
        break;
      case 'Escape':
        // Cancel current operations
        event.preventDefault();
        if (isDrawingConnection) {
          setIsDrawingConnection(false);
          setConnectionStart(null);
          setTempConnectionEnd(null);
        }
        if (isRubberBandSelecting) {
          setIsRubberBandSelecting(false);
          setRubberBandStart(null);
          setRubberBandEnd(null);
        }
        // Clear selection
        setCanvasState(prev => ({ ...prev, selectedElements: [] }));
        break;
      case 'a':
      case 'A':
        if ((event.ctrlKey || event.metaKey) && !readonly) {
          // Select all components and connections
          event.preventDefault();
          const allElementIds = [
            ...(diagram.components?.map(c => c.id) || []),
            ...(diagram.connections?.map(c => c.id) || [])
          ];
          setCanvasState(prev => ({ ...prev, selectedElements: allElementIds }));
        }
        break;
      case 'Tab':
        if (accessibilityMode) {
          // Navigate through components
          event.preventDefault();
          // Implementation for tab navigation
        }
        break;
      case 'Enter':
      case ' ':
        if (accessibilityMode) {
          // Activate selected component
          event.preventDefault();
          if (canvasState.selectedElements.length > 0) {
            // Handle component activation
          }
        }
        break;
    }
  }, [accessibilityMode, canvasState.selectedElements, readonly, onDiagramChange, diagram]);

  // Resize handle handlers
  const handleResizeHandleMouseDown = useCallback((componentId: string, handle: 'nw' | 'ne' | 'sw' | 'se', event: React.MouseEvent) => {
    if (readonly || activeTool !== 'select') return;
    
    event.stopPropagation();
    
    const component = diagram.components?.find(c => c.id === componentId);
    if (!component) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - (canvasState.pan?.x || 0)) / (canvasState.zoom || 1);
    const y = (event.clientY - rect.top - (canvasState.pan?.y || 0)) / (canvasState.zoom || 1);

    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStartPos({ x, y });
    setResizeStartSize({ width: component.size.width, height: component.size.height });
    setDraggedComponentId(componentId);
  }, [readonly, activeTool, diagram.components, canvasState.pan, canvasState.zoom]);

  // Render resize handles for selected components
  const renderResizeHandles = useCallback((component: SLDComponent) => {
    if (!canvasState.selectedElements.includes(component.id) || activeTool !== 'select') return null;

    const { position, size } = component;
    const handleSize = 8 / (canvasState.zoom || 1); // Scale handles based on zoom
    const handles = [
      { type: 'nw' as const, x: position.x - handleSize/2, y: position.y - handleSize/2, cursor: 'nw-resize' },
      { type: 'ne' as const, x: position.x + size.width - handleSize/2, y: position.y - handleSize/2, cursor: 'ne-resize' },
      { type: 'sw' as const, x: position.x - handleSize/2, y: position.y + size.height - handleSize/2, cursor: 'sw-resize' },
      { type: 'se' as const, x: position.x + size.width - handleSize/2, y: position.y + size.height - handleSize/2, cursor: 'se-resize' }
    ];

    return (
      <g key={`resize-handles-${component.id}`}>
        {handles.map(handle => (
          <rect
            key={`${component.id}-${handle.type}`}
            x={handle.x}
            y={handle.y}
            width={handleSize}
            height={handleSize}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={1}
            className={`cursor-${handle.cursor}`}
            onMouseDown={(e) => handleResizeHandleMouseDown(component.id, handle.type, e)}
            style={{ cursor: handle.cursor }}
          />
        ))}
      </g>
    );
  }, [canvasState.selectedElements, canvasState.zoom, activeTool, handleResizeHandleMouseDown]);

  // Filter components based on performance mode
  const visibleComponents = useMemo(() => {
    return diagram.components?.filter(shouldRenderComponent) || [];
  }, [diagram.components, shouldRenderComponent]);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full bg-white overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Single Line Diagram Canvas - Use arrow keys to navigate, Delete to remove selected components"
    >
      {/* Performance Metrics Overlay */}
      {canvasState.showPerformanceMetrics && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10">
          <div>FPS: {performanceMetrics.fps}</div>
          <div>Render: {performanceMetrics.renderTime}ms</div>
          <div>Memory: {performanceMetrics.memoryUsage}MB</div>
          <div>Components: {performanceMetrics.componentCount}</div>
        </div>
      )}

      {/* Mouse Position Indicator */}
      {accessibilityMode && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10">
          <div>X: {Math.round(mousePosition?.x || 0)}</div>
          <div>Y: {Math.round(mousePosition?.y || 0)}</div>
          <div>Zoom: {Math.round((canvasState.zoom || 1) * 100)}%</div>
        </div>
      )}

      {/* Enhanced SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        className={`${
          activeTool === 'draw_cable' || isDrawingConnection ? 'cursor-crosshair' : 
          activeTool === 'add_text' ? 'cursor-text' :
          activeTool === 'pan' ? 'cursor-move' :
          activeTool === 'select' && isRubberBandSelecting ? 'cursor-crosshair' :
          isDraggingComponent ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          transform: `translate(${canvasState.pan?.x || 0}px, ${canvasState.pan?.y || 0}px) scale(${canvasState.zoom || 1})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Canvas Boundary */}
        <rect
          x={CANVAS_BOUNDS.minX}
          y={CANVAS_BOUNDS.minY}
          width={CANVAS_BOUNDS.maxX - CANVAS_BOUNDS.minX}
          height={CANVAS_BOUNDS.maxY - CANVAS_BOUNDS.minY}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeDasharray="10,5"
          opacity="0.5"
        />
        
        {/* Grid Pattern */}
        {canvasState.gridEnabled && (
          <rect
            x={CANVAS_BOUNDS.minX}
            y={CANVAS_BOUNDS.minY}
            width={CANVAS_BOUNDS.maxX - CANVAS_BOUNDS.minX}
            height={CANVAS_BOUNDS.maxY - CANVAS_BOUNDS.minY}
            fill="url(#enhanced-grid-pattern)"
            opacity="0.5"
          />
        )}

        {/* Definitions */}
        {gridPattern}

        {/* Connections */}
        {diagram.connections?.map(createConnectionElement)}

        {/* Components */}
        {visibleComponents.map(createComponentElement)}

        {/* Resize Handles */}
        {visibleComponents.map(renderResizeHandles)}

        {/* Annotations */}
        {renderAnnotations()}

        {/* Collaboration Cursors */}
        {renderCollaborationCursors()}

        {/* Temporary Connection Line */}
        {isDrawingConnection && connectionStart && tempConnectionEnd && (
          (() => {
            const startComponent = diagram.components?.find(c => c.id === connectionStart.componentId);
            if (!startComponent) return null;
            
            const startX = startComponent.position.x + startComponent.size.width / 2;
            const startY = startComponent.position.y + startComponent.size.height / 2;
            
            return (
              <line
                x1={startX}
                y1={startY}
                x2={tempConnectionEnd.x}
                y2={tempConnectionEnd.y}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
                pointerEvents="none"
              />
            );
          })()
        )}

        {/* Rubber Band Selection Rectangle */}
        {isRubberBandSelecting && rubberBandStart && rubberBandEnd && (
          <rect
            x={Math.min(rubberBandStart.x, rubberBandEnd.x)}
            y={Math.min(rubberBandStart.y, rubberBandEnd.y)}
            width={Math.abs(rubberBandEnd.x - rubberBandStart.x)}
            height={Math.abs(rubberBandEnd.y - rubberBandStart.y)}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}
      </svg>

      {/* Layer Controls */}
      {canvasState.showLayers && (
        <div className="absolute top-2 left-2 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-10">
          <h3 className="text-sm font-medium mb-2">Layers</h3>
          {layers.map((layer) => (
            <label key={layer.id} className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={(e) => {
                  setLayers(prev => prev.map(l => 
                    l.id === layer.id ? { ...l, visible: e.target.checked } : l
                  ));
                }}
                className="rounded"
              />
              <span>{layer.name}</span>
            </label>
          ))}
        </div>
      )}

      {/* Text Editing Overlay */}
      {isEditingText && editingTextId && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Text</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Content
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter text..."
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Update annotation text
                    setAnnotations(prev => 
                      prev.map(ann => 
                        ann.id === editingTextId 
                          ? { ...ann, text: textInput }
                          : ann
                      )
                    );
                    setIsEditingText(false);
                    setEditingTextId(null);
                    setTextInput('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingText(false);
                    setEditingTextId(null);
                    setTextInput('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Delete annotation
                    setAnnotations(prev => prev.filter(ann => ann.id !== editingTextId));
                    setIsEditingText(false);
                    setEditingTextId(null);
                    setTextInput('');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Properties Editor */}
      <ComponentPropertiesEditor
        component={selectedComponentForEdit}
        isOpen={showPropertiesEditor}
        onClose={() => {
          setShowPropertiesEditor(false);
          setSelectedComponentForEdit(null);
        }}
        onSave={(updatedComponent) => {
          if (onDiagramChange && diagram) {
            const updatedDiagram = {
              ...diagram,
              components: diagram.components.map(c => 
                c.id === updatedComponent.id ? updatedComponent : c
              ),
              lastModified: new Date()
            };
            onDiagramChange(updatedDiagram);
          }
        }}
        readonly={readonly}
      />
    </div>
  );
}; 