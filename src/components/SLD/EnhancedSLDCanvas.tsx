/**
 * Enhanced SLD Canvas with Drag & Drop and Rubberband Selection
 * 
 * Professional SLD canvas with full drag and drop support, rubberband selection,
 * and component property editing
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Zap, 
  RefreshCw, 
  Settings, 
  Download, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Move,
  Square,
  MousePointer
} from 'lucide-react';
import { useSLDData } from '../../context/SLDDataContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { DraggableComponent } from './DraggableComponent';
import { RubberbandSelection } from './RubberbandSelection';
import { ComponentPropertiesEditor } from './ComponentPropertiesEditor';
import { CompanyLogoUploader } from './CompanyLogoUploader';
import { DraggableTitleBlock } from './DraggableTitleBlock';
import { EnhancedComponentLibrary } from './EnhancedComponentLibrary';
import type { SLDComponent, SLDPosition } from '../../types/sld';

type CanvasTool = 'select' | 'pan' | 'zoom' | 'component';

interface DragState {
  isDragging: boolean;
  draggedComponentIds: string[];
  startPosition: { x: number; y: number };
  lastPosition: { x: number; y: number };
  offset: { x: number; y: number };
}

interface RubberbandState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

export const EnhancedSLDCanvas: React.FC = () => {
  const { state: sldState, updateComponent, selectComponents, updateCanvasState } = useSLDData();
  const { loads } = useLoadData();
  const { settings } = useProjectSettings();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedComponentIds: [],
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });
  const [rubberbandState, setRubberbandState] = useState<RubberbandState>({
    isActive: false,
    startPoint: null,
    currentPoint: null
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showPropertiesEditor, setShowPropertiesEditor] = useState(false);
  const [showTitleBlock, setShowTitleBlock] = useState(true);
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);
  const [titleBlockPosition, setTitleBlockPosition] = useState({ x: 50, y: 50 });
  const [logoPosition, setLogoPosition] = useState({ x: 500, y: 60 });

  // Get canvas bounds for constraint calculations
  const getCanvasBounds = useCallback(() => {
    if (!canvasRef.current) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      minX: 0,
      minY: 0,
      maxX: rect.width - 100, // Account for component width
      maxY: rect.height - 100  // Account for component height
    };
  }, []);

  // Constrain position to canvas bounds
  const constrainPosition = useCallback((position: SLDPosition, componentSize: { width: number; height: number }): SLDPosition => {
    const bounds = getCanvasBounds();
    return {
      x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX - componentSize.width)),
      y: Math.max(bounds.minY, Math.min(position.y, bounds.maxY - componentSize.height))
    };
  }, [getCanvasBounds]);

  // Check if point is inside rectangle
  const isPointInRect = useCallback((point: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }) => {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width && 
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }, []);

  // Get components within selection rectangle
  const getComponentsInSelection = useCallback((startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
    const left = Math.min(startPoint.x, endPoint.x);
    const top = Math.min(startPoint.y, endPoint.y);
    const right = Math.max(startPoint.x, endPoint.x);
    const bottom = Math.max(startPoint.y, endPoint.y);

    return sldState.diagram?.components.filter(component => {
      const componentBounds = {
        x: component.position.x,
        y: component.position.y,
        width: component.width,
        height: component.height
      };

      // Check if component overlaps with selection rectangle
      return !(componentBounds.x > right || 
               componentBounds.x + componentBounds.width < left ||
               componentBounds.y > bottom ||
               componentBounds.y + componentBounds.height < top);
    }) || [];
  }, [sldState.diagram?.components]);

  // Handle mouse down on canvas
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (activeTool !== 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Check if clicking on a component
    const clickedComponent = sldState.diagram?.components.find(component =>
      isPointInRect(canvasPoint, {
        x: component.position.x,
        y: component.position.y,
        width: component.width,
        height: component.height
      })
    );

    if (clickedComponent) {
      // Component clicked - start dragging
      const isMultiSelect = event.ctrlKey || event.metaKey;
      const wasSelected = sldState.selectedComponents.includes(clickedComponent.id);
      
      let newSelection: string[];
      if (isMultiSelect) {
        if (wasSelected) {
          newSelection = sldState.selectedComponents.filter(id => id !== clickedComponent.id);
        } else {
          newSelection = [...sldState.selectedComponents, clickedComponent.id];
        }
      } else {
        newSelection = wasSelected && sldState.selectedComponents.length === 1 ? 
          sldState.selectedComponents : [clickedComponent.id];
      }

      selectComponents(newSelection);

      // Start dragging selected components
      setDragState({
        isDragging: true,
        draggedComponentIds: newSelection,
        startPosition: canvasPoint,
        lastPosition: canvasPoint,
        offset: {
          x: canvasPoint.x - clickedComponent.position.x,
          y: canvasPoint.y - clickedComponent.position.y
        }
      });
    } else {
      // Empty area clicked - start rubberband selection
      if (!(event.ctrlKey || event.metaKey)) {
        selectComponents([]);
      }

      setRubberbandState({
        isActive: true,
        startPoint: canvasPoint,
        currentPoint: canvasPoint
      });
    }

    event.preventDefault();
  }, [activeTool, sldState.diagram?.components, sldState.selectedComponents, selectComponents, isPointInRect]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    if (dragState.isDragging) {
      // Update component positions
      const deltaX = canvasPoint.x - dragState.lastPosition.x;
      const deltaY = canvasPoint.y - dragState.lastPosition.y;

      dragState.draggedComponentIds.forEach(componentId => {
        const component = sldState.diagram?.components.find(c => c.id === componentId);
        if (component) {
          const newPosition = constrainPosition(
            {
              x: component.position.x + deltaX,
              y: component.position.y + deltaY
            },
            { width: component.width, height: component.height }
          );

          updateComponent(componentId, { position: newPosition });
        }
      });

      setDragState(prev => ({
        ...prev,
        lastPosition: canvasPoint
      }));
    } else if (rubberbandState.isActive) {
      // Update rubberband selection
      setRubberbandState(prev => ({
        ...prev,
        currentPoint: canvasPoint
      }));

      // Update selection based on rubberband
      if (rubberbandState.startPoint) {
        const selectedComponents = getComponentsInSelection(rubberbandState.startPoint, canvasPoint);
        const selectedIds = selectedComponents.map(c => c.id);
        
        if (event.ctrlKey || event.metaKey) {
          // Add to existing selection
          const combinedSelection = [...new Set([...sldState.selectedComponents, ...selectedIds])];
          selectComponents(combinedSelection);
        } else {
          selectComponents(selectedIds);
        }
      }
    }
  }, [dragState, rubberbandState, constrainPosition, updateComponent, getComponentsInSelection, sldState.diagram?.components, sldState.selectedComponents, selectComponents]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedComponentIds: [],
      startPosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });

    setRubberbandState({
      isActive: false,
      startPoint: null,
      currentPoint: null
    });
  }, []);

  // Setup global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging || rubberbandState.isActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, rubberbandState.isActive, handleMouseMove, handleMouseUp]);

  // Handle component double click
  const handleComponentDoubleClick = useCallback((componentId: string) => {
    setSelectedComponentId(componentId);
    setShowPropertiesEditor(true);
  }, []);

  // Handle component single click
  const handleComponentClick = useCallback((componentId: string, event: React.MouseEvent) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    const wasSelected = sldState.selectedComponents.includes(componentId);
    
    let newSelection: string[];
    if (isMultiSelect) {
      if (wasSelected) {
        newSelection = sldState.selectedComponents.filter(id => id !== componentId);
      } else {
        newSelection = [...sldState.selectedComponents, componentId];
      }
    } else {
      newSelection = [componentId];
    }

    selectComponents(newSelection);
  }, [sldState.selectedComponents, selectComponents]);

  // Handle component drag start
  const handleComponentDragStart = useCallback((componentId: string, event: React.MouseEvent) => {
    // This is handled by canvas mouse down, so we just prevent default here
    event.preventDefault();
  }, []);

  // Get selected component for properties editor
  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    return sldState.diagram?.components.find(c => c.id === selectedComponentId) || null;
  }, [selectedComponentId, sldState.diagram?.components]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with Tools */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Enhanced SLD Canvas
            </h2>

            {/* Tool Selection */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setActiveTool('select')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                  activeTool === 'select'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title="Select Tool (V)"
              >
                <MousePointer className="h-4 w-4" />
                Select
              </button>
              <button
                onClick={() => setActiveTool('pan')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-2 border-l ${
                  activeTool === 'pan'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title="Pan Tool (H)"
              >
                <Move className="h-4 w-4" />
                Pan
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTitleBlock(!showTitleBlock)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showTitleBlock 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Title Block"
            >
              <FileText className="h-4 w-4" />
              Title Block
            </button>
            
            <button
              onClick={() => setShowCompanyLogo(!showCompanyLogo)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showCompanyLogo 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Company Logo"
            >
              <FileText className="h-4 w-4" />
              Logo
            </button>
          </div>
        </div>

        {/* Selection Info */}
        {sldState.selectedComponents.length > 0 && (
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span>
              {sldState.selectedComponents.length} component{sldState.selectedComponents.length !== 1 ? 's' : ''} selected
            </span>
            {sldState.selectedComponents.length === 1 && (
              <button
                onClick={() => {
                  setSelectedComponentId(sldState.selectedComponents[0]);
                  setShowPropertiesEditor(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit Properties
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-1">
        {/* Enhanced Component Library */}
        <EnhancedComponentLibrary />
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative w-full h-full cursor-crosshair"
            style={{
              cursor: activeTool === 'select' ? 'default' : 
                     activeTool === 'pan' ? 'grab' : 'crosshair'
            }}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Grid */}
            {sldState.canvasState.gridEnabled && (
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${sldState.canvasState.gridSize}px ${sldState.canvasState.gridSize}px`
                }}
              />
            )}

            {/* Title Block */}
            {showTitleBlock && (
              <DraggableTitleBlock
                data={{
                  projectName: settings.projectName || 'Electrical Load Calculation',
                  drawingNumber: '001',
                  revision: 'A',
                  date: new Date().toLocaleDateString(),
                  drawnBy: 'Load Calculator',
                  checkedBy: '',
                  approvedBy: '',
                  scale: 'NTS',
                  sheet: '1 of 1'
                }}
                position={titleBlockPosition}
                onPositionChange={setTitleBlockPosition}
                onDataChange={() => {}}
                template="professional"
                editable={true}
                autoFillFromProject={true}
                projectData={{
                  projectName: settings.projectName,
                  propertyAddress: settings.propertyAddress,
                  serviceSize: settings.mainBreaker?.toString()
                }}
              />
            )}

            {/* Company Logo */}
            {showCompanyLogo && (
              <CompanyLogoUploader
                position={logoPosition}
                onPositionChange={setLogoPosition}
                isVisible={showCompanyLogo}
                titleBlockPosition={titleBlockPosition}
              />
            )}

            {/* SLD Components */}
            {sldState.diagram?.components.map(component => (
              <DraggableComponent
                key={component.id}
                component={component}
                isSelected={sldState.selectedComponents.includes(component.id)}
                isDragging={dragState.draggedComponentIds.includes(component.id)}
                onDragStart={handleComponentDragStart}
                onDragEnd={() => {}}
                onClick={handleComponentClick}
                onDoubleClick={handleComponentDoubleClick}
                gridSize={sldState.canvasState.gridSize}
                snapToGrid={sldState.canvasState.snapToGrid}
              />
            ))}

            {/* Rubberband Selection */}
            <RubberbandSelection
              startPoint={rubberbandState.startPoint}
              currentPoint={rubberbandState.currentPoint}
              isActive={rubberbandState.isActive}
            />

            {/* Empty State */}
            {!sldState.diagram?.components.length && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Enhanced SLD Canvas
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Drag components from the library to build your electrical system.
                    Use the select tool to move and edit components.
                  </p>
                  <div className="text-sm text-gray-400">
                    <div>• Drag to select multiple components</div>
                    <div>• Hold Ctrl/Cmd to add to selection</div>
                    <div>• Double-click to edit properties</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Component Properties Editor */}
      <ComponentPropertiesEditor
        component={selectedComponent}
        isOpen={showPropertiesEditor}
        onClose={() => {
          setShowPropertiesEditor(false);
          setSelectedComponentId(null);
        }}
      />
    </div>
  );
};

export default EnhancedSLDCanvas;