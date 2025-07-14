import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move, Square, Circle, Type, Trash2 } from 'lucide-react';
import type { AerialView as AerialViewType, AerialAnnotation, SLDPosition } from '../../types/sld';

interface AerialViewProps {
  aerialView: AerialViewType;
  onAerialViewChange: (aerialView: AerialViewType) => void;
  readonly?: boolean;
}

type AnnotationTool = 'select' | 'pv_array' | 'meter' | 'panel' | 'obstacle' | 'note';

export const AerialView: React.FC<AerialViewProps> = ({
  aerialView,
  onAerialViewChange,
  readonly = false
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<SLDPosition | null>(null);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle annotation selection
  const handleAnnotationClick = useCallback((annotationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readonly && activeTool === 'select') {
      setSelectedAnnotation(annotationId);
    }
  }, [readonly, activeTool]);

  // Handle mouse down for drawing
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (readonly || activeTool === 'select') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = {
      x: (event.clientX - rect.left) / zoom - pan.x,
      y: (event.clientY - rect.top) / zoom - pan.y
    };

    setDrawStart(position);
    setIsDrawing(true);
  }, [readonly, activeTool, zoom, pan]);

  // Handle mouse up for completing annotation
  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isDrawing || !drawStart || readonly) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const endPosition = {
      x: (event.clientX - rect.left) / zoom - pan.x,
      y: (event.clientY - rect.top) / zoom - pan.y
    };

    // Create new annotation
    const newAnnotation: Omit<AerialAnnotation, 'id'> = {
      type: activeTool as any,
      position: drawStart,
      size: {
        width: Math.abs(endPosition.x - drawStart.x),
        height: Math.abs(endPosition.y - drawStart.y)
      },
      label: getDefaultLabel(activeTool),
      color: getDefaultColor(activeTool),
      notes: ''
    };

    // Add annotation to aerial view
    const updatedAerialView = {
      ...aerialView,
      annotations: [
        ...aerialView.annotations,
        {
          id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...newAnnotation
        }
      ]
    };

    onAerialViewChange(updatedAerialView);

    setIsDrawing(false);
    setDrawStart(null);
    setActiveTool('select');
  }, [isDrawing, drawStart, zoom, pan, activeTool, aerialView, onAerialViewChange, readonly]);

  // Handle annotation deletion
  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    const updatedAerialView = {
      ...aerialView,
      annotations: aerialView.annotations.filter(a => a.id !== annotationId)
    };
    onAerialViewChange(updatedAerialView);
    setSelectedAnnotation(null);
  }, [aerialView, onAerialViewChange]);

  // Get default label for annotation type
  const getDefaultLabel = (type: AnnotationTool): string => {
    switch (type) {
      case 'pv_array': return 'PV Array';
      case 'meter': return 'Electric Meter';
      case 'panel': return 'Main Panel';
      case 'obstacle': return 'Obstacle';
      case 'note': return 'Note';
      default: return 'Annotation';
    }
  };

  // Get default color for annotation type
  const getDefaultColor = (type: AnnotationTool): string => {
    switch (type) {
      case 'pv_array': return '#FFD700';
      case 'meter': return '#FF0000';
      case 'panel': return '#0000FF';
      case 'obstacle': return '#FF69B4';
      case 'note': return '#32CD32';
      default: return '#666666';
    }
  };

  // Render annotation
  const renderAnnotation = (annotation: AerialAnnotation) => {
    const isSelected = selectedAnnotation === annotation.id;
    
    return (
      <div
        key={annotation.id}
        className={`absolute border-2 cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-100 bg-opacity-50' : 'border-white bg-opacity-30'
        }`}
        style={{
          left: annotation.position.x,
          top: annotation.position.y,
          width: annotation.size?.width || 60,
          height: annotation.size?.height || 40,
          backgroundColor: annotation.color,
          zIndex: isSelected ? 10 : 5
        }}
        onClick={(e) => handleAnnotationClick(annotation.id, e)}
      >
        {/* Annotation Label */}
        <div className="absolute -top-6 left-0 text-xs font-bold text-white bg-black bg-opacity-70 px-1 rounded">
          {annotation.label}
        </div>

        {/* Delete button for selected annotation */}
        {isSelected && !readonly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAnnotation(annotation.id);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      {!readonly && (
        <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
          {/* View Controls */}
          <button
            onClick={handleZoomIn}
            className="p-2 rounded hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleZoomOut}
            className="p-2 rounded hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleResetView}
            className="px-3 py-2 text-sm rounded hover:bg-gray-100"
            title="Reset View"
          >
            Fit
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Annotation Tools */}
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded ${activeTool === 'select' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            title="Select"
          >
            <Move className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool('pv_array')}
            className={`p-2 rounded ${activeTool === 'pv_array' ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
            title="PV Array"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool('meter')}
            className={`p-2 rounded ${activeTool === 'meter' ? 'bg-red-100' : 'hover:bg-gray-100'}`}
            title="Meter"
          >
            <Circle className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool('panel')}
            className={`p-2 rounded ${activeTool === 'panel' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            title="Panel"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTool('note')}
            className={`p-2 rounded ${activeTool === 'note' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
            title="Note"
          >
            <Type className="h-4 w-4" />
          </button>

          <div className="ml-auto text-sm text-gray-600">
            Zoom: {Math.round(zoom * 100)}% | 
            Resolution: {aerialView.resolution}m/px |
            Tool: {activeTool}
          </div>
        </div>
      )}

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gray-100 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Satellite Image */}
        <div
          className="relative"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          <img
            ref={imageRef}
            src={aerialView.imageUrl}
            alt="Aerial view"
            className="block max-w-none"
            draggable={false}
          />

          {/* Annotations */}
          {aerialView.annotations.map(renderAnnotation)}

          {/* Drawing preview */}
          {isDrawing && drawStart && (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
              style={{
                left: drawStart.x,
                top: drawStart.y,
                width: 100, // Fixed size for preview
                height: 60
              }}
            />
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Address:</strong> {aerialView.address}
          </div>
          <div>
            <strong>Coordinates:</strong> {aerialView.coordinates.latitude.toFixed(4)}, {aerialView.coordinates.longitude.toFixed(4)}
          </div>
          <div>
            <strong>Capture Date:</strong> {aerialView.captureDate.toLocaleDateString()}
          </div>
          <div>
            <strong>Annotations:</strong> {aerialView.annotations.length}
          </div>
        </div>

        {selectedAnnotation && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm">
              <strong>Selected:</strong> {aerialView.annotations.find(a => a.id === selectedAnnotation)?.label}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Type: {aerialView.annotations.find(a => a.id === selectedAnnotation)?.type} |
              Position: {Math.round(aerialView.annotations.find(a => a.id === selectedAnnotation)?.position.x || 0)}, {Math.round(aerialView.annotations.find(a => a.id === selectedAnnotation)?.position.y || 0)}
            </div>
            {aerialView.annotations.find(a => a.id === selectedAnnotation)?.notes && (
              <div className="text-xs text-gray-600 mt-1">
                Notes: {aerialView.annotations.find(a => a.id === selectedAnnotation)?.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};