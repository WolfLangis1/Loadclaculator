/**
 * Professional SLD Canvas with Drawing Tools Integration
 * 
 * Enhanced canvas with professional drawing tools, precision controls, and workflow integration
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EnhancedSLDCanvas } from './EnhancedSLDCanvas';
import { DrawingToolPalette } from './DrawingToolPalette';
import { DrawingToolSystem, DrawingTool } from './tools/DrawingToolSystem';
import { createDrawingToolSystem } from './tools/ToolFactory';
import type { SLDDiagram } from '../../types/sld';

interface ProfessionalSLDCanvasProps {
  diagram: SLDDiagram;
  onDiagramChange: (diagram: SLDDiagram) => void;
  readonly?: boolean;
  showToolPalette?: boolean;
  toolPalettePosition?: 'left' | 'right' | 'top' | 'bottom';
  onSelectionChange?: (selectedIds: string[]) => void;
  onGeometryCreate?: (geometry: any) => void;
  onGeometryUpdate?: (id: string, updates: any) => void;
}

interface CanvasInteractionState {
  isDrawing: boolean;
  currentTool: DrawingTool | null;
  previewGeometry: any;
  cursor: string;
}

export const ProfessionalSLDCanvas: React.FC<ProfessionalSLDCanvasProps> = ({
  diagram,
  onDiagramChange,
  readonly = false,
  showToolPalette = true,
  toolPalettePosition = 'left',
  onSelectionChange,
  onGeometryCreate,
  onGeometryUpdate
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const toolSystemRef = useRef<DrawingToolSystem | null>(null);
  
  const [interactionState, setInteractionState] = useState<CanvasInteractionState>({
    isDrawing: false,
    currentTool: null,
    previewGeometry: null,
    cursor: 'default'
  });

  // Initialize drawing tool system
  useEffect(() => {
    if (!readonly) {
      const toolSystem = createDrawingToolSystem();
      toolSystemRef.current = toolSystem;

      // Set up tool system callbacks
      toolSystem.setToolChangeCallback((tool) => {
        setInteractionState(prev => ({
          ...prev,
          currentTool: tool,
          cursor: tool?.cursor || 'default'
        }));
      });

      toolSystem.setGeometryCreateCallback((geometry) => {
        onGeometryCreate?.(geometry);
        // Add geometry to diagram
        const updatedDiagram = addGeometryToDiagram(diagram, geometry);
        onDiagramChange(updatedDiagram);
      });

      toolSystem.setGeometryUpdateCallback((id, updates) => {
        onGeometryUpdate?.(id, updates);
        // Update geometry in diagram
        const updatedDiagram = updateGeometryInDiagram(diagram, id, updates);
        onDiagramChange(updatedDiagram);
      });

      toolSystem.setSelectionChangeCallback((selectedIds) => {
        onSelectionChange?.(selectedIds);
      });

      return () => {
        toolSystem.dispose();
      };
    }
  }, [readonly, diagram, onDiagramChange, onGeometryCreate, onGeometryUpdate, onSelectionChange]);

  // Handle mouse events for drawing tools
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!toolSystemRef.current || readonly) return;

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    toolSystemRef.current.handleMouseDown(point, event.nativeEvent);
    
    setInteractionState(prev => ({
      ...prev,
      isDrawing: true
    }));
  }, [readonly]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!toolSystemRef.current || readonly) return;

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    toolSystemRef.current.handleMouseMove(point, event.nativeEvent);
    
    // Update preview geometry
    const activeTool = toolSystemRef.current.getActiveTool();
    if (activeTool?.getPreviewGeometry) {
      const preview = activeTool.getPreviewGeometry();
      setInteractionState(prev => ({
        ...prev,
        previewGeometry: preview
      }));
    }
  }, [readonly]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!toolSystemRef.current || readonly) return;

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    toolSystemRef.current.handleMouseUp(point, event.nativeEvent);
    
    setInteractionState(prev => ({
      ...prev,
      isDrawing: false,
      previewGeometry: null
    }));
  }, [readonly]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!toolSystemRef.current || readonly) return;

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    toolSystemRef.current.handleDoubleClick(point, event.nativeEvent);
  }, [readonly]);

  // Handle keyboard events for drawing tools
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!toolSystemRef.current || readonly) return;
      
      // Only handle shortcuts when canvas area is focused
      const activeElement = document.activeElement;
      if (activeElement && !canvasContainerRef.current?.contains(activeElement)) return;

      toolSystemRef.current.handleKeyDown(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!toolSystemRef.current || readonly) return;
      toolSystemRef.current.handleKeyUp(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [readonly]);

  // Helper functions for diagram manipulation
  const addGeometryToDiagram = (currentDiagram: SLDDiagram, geometry: any): SLDDiagram => {
    const updatedDiagram = { ...currentDiagram };

    switch (geometry.type) {
      case 'connection':
      case 'wire':
        updatedDiagram.connections = [...(updatedDiagram.connections || []), {
          id: geometry.id,
          fromComponentId: geometry.startConnection?.componentId || '',
          toComponentId: geometry.endConnection?.componentId || '',
          fromTerminal: geometry.startConnection?.terminalId || '',
          toTerminal: geometry.endConnection?.terminalId || '',
          path: geometry.segments?.map((seg: any) => [seg.start, seg.end]).flat() || [],
          wireSize: geometry.properties?.wireSize || '12 AWG',
          wireType: geometry.properties?.wireType || 'THWN',
          conduitType: geometry.properties?.conduitType || 'EMT',
          voltage: geometry.properties?.voltage || 120,
          current: geometry.properties?.current || 20
        }];
        break;

      case 'text':
        updatedDiagram.labels = [...(updatedDiagram.labels || []), {
          id: geometry.id,
          text: geometry.text,
          position: geometry.position,
          style: geometry.style
        }];
        break;

      case 'dimension':
        updatedDiagram.annotations = [...(updatedDiagram.annotations || []), {
          id: geometry.id,
          type: 'dimension',
          startPoint: geometry.startPoint,
          endPoint: geometry.endPoint,
          value: geometry.displayValue,
          style: geometry.style
        }];
        break;

      default:
        // Handle other geometry types as annotations
        updatedDiagram.annotations = [...(updatedDiagram.annotations || []), geometry];
        break;
    }

    return updatedDiagram;
  };

  const updateGeometryInDiagram = (currentDiagram: SLDDiagram, id: string, updates: any): SLDDiagram => {
    const updatedDiagram = { ...currentDiagram };

    // Update components
    if (updatedDiagram.components) {
      const componentIndex = updatedDiagram.components.findIndex(c => c.id === id);
      if (componentIndex >= 0) {
        updatedDiagram.components[componentIndex] = {
          ...updatedDiagram.components[componentIndex],
          ...updates
        };
        return updatedDiagram;
      }
    }

    // Update connections
    if (updatedDiagram.connections) {
      const connectionIndex = updatedDiagram.connections.findIndex(c => c.id === id);
      if (connectionIndex >= 0) {
        updatedDiagram.connections[connectionIndex] = {
          ...updatedDiagram.connections[connectionIndex],
          ...updates
        };
        return updatedDiagram;
      }
    }

    // Update labels
    if (updatedDiagram.labels) {
      const labelIndex = updatedDiagram.labels.findIndex(l => l.id === id);
      if (labelIndex >= 0) {
        updatedDiagram.labels[labelIndex] = {
          ...updatedDiagram.labels[labelIndex],
          ...updates
        };
        return updatedDiagram;
      }
    }

    // Update annotations
    if (updatedDiagram.annotations) {
      const annotationIndex = updatedDiagram.annotations.findIndex(a => a.id === id);
      if (annotationIndex >= 0) {
        updatedDiagram.annotations[annotationIndex] = {
          ...updatedDiagram.annotations[annotationIndex],
          ...updates
        };
        return updatedDiagram;
      }
    }

    return updatedDiagram;
  };

  const renderToolPalette = () => {
    if (!showToolPalette || !toolSystemRef.current || readonly) return null;

    return (
      <div className={`
        ${toolPalettePosition === 'left' ? 'order-first' : ''}
        ${toolPalettePosition === 'right' ? 'order-last' : ''}
        ${toolPalettePosition === 'top' ? 'order-first w-full' : ''}
        ${toolPalettePosition === 'bottom' ? 'order-last w-full' : ''}
      `}>
        <DrawingToolPalette
          toolSystem={toolSystemRef.current}
          compact={toolPalettePosition === 'top' || toolPalettePosition === 'bottom'}
          orientation={toolPalettePosition === 'top' || toolPalettePosition === 'bottom' ? 'horizontal' : 'vertical'}
        />
      </div>
    );
  };

  return (
    <div className={`
      flex h-full
      ${toolPalettePosition === 'top' || toolPalettePosition === 'bottom' ? 'flex-col' : 'flex-row'}
      ${toolPalettePosition === 'left' ? 'gap-4' : ''}
      ${toolPalettePosition === 'right' ? 'gap-4' : ''}
      ${toolPalettePosition === 'top' || toolPalettePosition === 'bottom' ? 'gap-2' : ''}
    `}>
      {renderToolPalette()}
      
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative"
        style={{ cursor: interactionState.cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        tabIndex={0}
      >
        <EnhancedSLDCanvas
          diagram={diagram}
          onDiagramChange={onDiagramChange}
          readonly={readonly}
          showGrid={toolSystemRef.current?.getOptions().snapToGrid}
          gridSize={toolSystemRef.current?.getOptions().gridSize}
          onSelectionChange={onSelectionChange}
        />
        
        {/* Preview Overlay */}
        {interactionState.previewGeometry && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              {/* Render preview geometry based on type */}
              {renderPreviewGeometry(interactionState.previewGeometry)}
            </svg>
          </div>
        )}
        
        {/* Tool Status */}
        {interactionState.currentTool && !readonly && (
          <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded px-3 py-2 shadow-sm">
            <div className="text-sm font-medium text-gray-800">
              {interactionState.currentTool.name}
            </div>
            {interactionState.currentTool.shortcut && (
              <div className="text-xs text-gray-500">
                Press {interactionState.currentTool.shortcut.toUpperCase()} or ESC
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to render preview geometry
function renderPreviewGeometry(geometry: any): React.ReactNode {
  if (!geometry) return null;

  switch (geometry.type) {
    case 'selection-box':
      return (
        <rect
          x={geometry.bounds.x}
          y={geometry.bounds.y}
          width={geometry.bounds.width}
          height={geometry.bounds.height}
          fill="rgba(37, 99, 235, 0.1)"
          stroke="#2563eb"
          strokeWidth={1}
          strokeDasharray="5,5"
        />
      );

    case 'wire-preview':
      return (
        <g>
          {geometry.segments.map((segment: any, index: number) => (
            <line
              key={index}
              x1={segment.start.x}
              y1={segment.start.y}
              x2={segment.end.x}
              y2={segment.end.y}
              stroke={geometry.style.color}
              strokeWidth={geometry.style.width}
              strokeDasharray={geometry.style.dashPattern?.join(',')}
              opacity={geometry.style.opacity}
            />
          ))}
        </g>
      );

    case 'rectangle-preview':
      return (
        <rect
          x={geometry.bounds.x}
          y={geometry.bounds.y}
          width={geometry.bounds.width}
          height={geometry.bounds.height}
          fill={geometry.style.fill}
          stroke={geometry.style.stroke}
          strokeWidth={geometry.style.strokeWidth}
          strokeDasharray={geometry.style.strokeDasharray?.join(',')}
          opacity={geometry.style.opacity}
        />
      );

    case 'circle-preview':
      return (
        <circle
          cx={geometry.center.x}
          cy={geometry.center.y}
          r={geometry.radius}
          fill={geometry.style.fill}
          stroke={geometry.style.stroke}
          strokeWidth={geometry.style.strokeWidth}
          strokeDasharray={geometry.style.strokeDasharray?.join(',')}
          opacity={geometry.style.opacity}
        />
      );

    case 'line-preview':
      return (
        <line
          x1={geometry.start.x}
          y1={geometry.start.y}
          x2={geometry.end.x}
          y2={geometry.end.y}
          stroke={geometry.style.stroke}
          strokeWidth={geometry.style.strokeWidth}
          strokeDasharray={geometry.style.strokeDasharray?.join(',')}
          opacity={geometry.style.opacity}
        />
      );

    default:
      return null;
  }
}