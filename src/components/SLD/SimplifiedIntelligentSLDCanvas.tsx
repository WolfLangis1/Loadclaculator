/**
 * Simplified Intelligent SLD Canvas - Vercel Compatible
 * 
 * Basic SLD canvas with essential features for Vercel deployment
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Zap, 
  RefreshCw, 
  Settings, 
  Download, 
  FileText,
  MousePointer,
  Move
} from 'lucide-react';
import { useSLDData } from '../../context/SLDDataContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { EnhancedComponentLibrary } from './EnhancedComponentLibrary';
import { DraggableTitleBlock } from './DraggableTitleBlock';

type CanvasTool = 'select' | 'pan';

export const SimplifiedIntelligentSLDCanvas: React.FC = () => {
  const { state: sldState, updateComponent, selectComponents } = useSLDData();
  const { loads } = useLoadData();
  const { settings } = useProjectSettings();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [showTitleBlock, setShowTitleBlock] = useState(true);
  const [titleBlockPosition, setTitleBlockPosition] = useState({ x: 50, y: 50 });

  // Simple drag handling
  const [dragState, setDragState] = useState({
    isDragging: false,
    componentId: '',
    offset: { x: 0, y: 0 }
  });

  const handleMouseDown = useCallback((componentId: string, event: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    const component = sldState.diagram?.components.find(c => c.id === componentId);
    if (!component) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      componentId,
      offset: {
        x: event.clientX - rect.left - component.position.x,
        y: event.clientY - rect.top - component.position.y
      }
    });

    selectComponents([componentId]);
    event.preventDefault();
  }, [activeTool, sldState.diagram?.components, selectComponents]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.componentId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newPosition = {
      x: event.clientX - rect.left - dragState.offset.x,
      y: event.clientY - rect.top - dragState.offset.y
    };

    updateComponent(dragState.componentId, { position: newPosition });
  }, [dragState, updateComponent]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      componentId: '',
      offset: { x: 0, y: 0 }
    });
  }, []);

  // Setup global mouse listeners
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              SLD Canvas
            </h2>

            {/* Tool Selection */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setActiveTool('select')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                  activeTool === 'select'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MousePointer className="h-4 w-4" />
                Select
              </button>
              <button
                onClick={() => setActiveTool('pan')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-2 border-l ${
                  activeTool === 'pan'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
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
            >
              <FileText className="h-4 w-4" />
              Title Block
            </button>
          </div>
        </div>

        {/* Selection Info */}
        {sldState.selectedComponents.length > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            {sldState.selectedComponents.length} component{sldState.selectedComponents.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>
      
      <div className="flex flex-1">
        {/* Component Library */}
        <EnhancedComponentLibrary />
        
        {/* Main Canvas */}
        <div className="flex-1 relative overflow-auto bg-gray-100">
          <div
            ref={canvasRef}
            className="relative w-full h-full min-h-[800px]"
            style={{
              cursor: activeTool === 'select' ? 'default' : 'grab'
            }}
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

            {/* SLD Components */}
            {sldState.diagram?.components.map(component => (
              <div
                key={component.id}
                className={`absolute cursor-pointer select-none shadow-sm hover:shadow-md transition-all border-2 bg-white rounded ${
                  sldState.selectedComponents.includes(component.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{
                  left: component.position.x,
                  top: component.position.y,
                  width: component.width,
                  height: component.height,
                  zIndex: dragState.componentId === component.id ? 50 : 10
                }}
                onMouseDown={(e) => handleMouseDown(component.id, e)}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className="text-lg mb-1">{component.symbol}</div>
                  <div className="text-xs text-gray-600 text-center font-medium truncate w-full">
                    {component.name}
                  </div>
                  {component.properties?.rating && (
                    <div className="text-xs font-mono text-blue-600">
                      {component.properties.rating}
                    </div>
                  )}
                  {component.properties?.circuitNumber && (
                    <div className="text-xs font-mono text-green-600">
                      Ckt: {component.properties.circuitNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!sldState.diagram?.components.length && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    SLD Canvas
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Drag components from the library to build your electrical system.
                  </p>
                  <div className="text-sm text-gray-400">
                    <div>• Use the select tool to move components</div>
                    <div>• Add components from the library on the left</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedIntelligentSLDCanvas;