import React, { useRef, useEffect, useCallback, useState } from 'react';
import { X, Download, Save, RotateCcw, ZoomIn, ZoomOut, Grid, Settings } from 'lucide-react';
import { usePhotoEditor } from '../../../context/PhotoEditorContext';
import { PhotoEditorService } from '../../../services/photoEditorService';
import { EditorToolbar } from './EditorToolbar';
import { MeasurementCanvas } from './MeasurementCanvas';
import { LayerPanel } from './LayerPanel';
import { CalibrationTool } from './CalibrationTool';
import type { EditorPoint } from '../../../context/PhotoEditorContext';

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
  initialImageType?: 'satellite' | 'streetview';
  imageMetadata?: {
    width: number;
    height: number;
    scale?: number;
    location?: string;
  };
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  isOpen,
  onClose,
  initialImage,
  initialImageType = 'satellite',
  imageMetadata
}) => {
  const {
    state,
    setImage,
    setTool,
    setDrawing,
    addMeasurement,
    addAnnotation,
    updateCurrentMeasurement,
    updateCurrentAnnotation,
    clearAll,
    setZoom,
    setPanOffset,
    setScale,
    toggleGrid,
    setSelectedElements,
    addSelectedElement,
    clearSelection
  } = usePhotoEditor();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<EditorPoint | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize image when component opens
  useEffect(() => {
    if (isOpen && initialImage && initialImageType) {
      setImage(initialImage, initialImageType, imageMetadata || null);
    }
  }, [isOpen, initialImage, initialImageType, imageMetadata, setImage]);

  // Load image and set up canvas
  useEffect(() => {
    if (!state.image || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Set initial metadata if not provided
      if (!state.imageMetadata) {
        const scale = state.imageType === 'satellite' ? 
          PhotoEditorService.getRecommendedScale(img.naturalWidth, img.naturalHeight, state.unit) :
          PhotoEditorService.getRecommendedScale(img.naturalWidth, img.naturalHeight, state.unit);
        
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          scale: scale,
          location: 'Unknown'
        };
        setImage(state.image, state.imageType, metadata);
      }
      
      redrawCanvas();
    };
    
    img.src = state.image;
  }, [state.image, state.imageType, state.imageMetadata, setImage]);

  // Redraw canvas when state changes
  useEffect(() => {
    redrawCanvas();
  }, [
    state.measurements,
    state.annotations,
    state.currentMeasurement,
    state.currentAnnotation,
    state.zoom,
    state.panOffset,
    state.showGrid
  ]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || !img || !img.complete) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Apply zoom and pan
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(state.panOffset.x, state.panOffset.y);
    
    // Draw image
    ctx.drawImage(img, 0, 0);
    
    // Draw grid if enabled
    if (state.showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }
    
    // Restore context for overlays
    ctx.restore();
    
    // Draw measurements (only from visible layers)
    state.measurements.forEach(measurement => {
      const layer = state.layers.find(l => l.id === measurement.layerId);
      if (layer && layer.visible) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        PhotoEditorService.drawMeasurement(ctx, measurement, state.zoom, state.panOffset);
        // Highlight if selected
        if (state.selectedElementIds.includes(measurement.id)) {
          PhotoEditorService.drawSelectionHighlight(ctx, measurement.points, state.zoom, state.panOffset);
        }
        ctx.restore();
      }
    });
    
    // Draw annotations (only from visible layers)
    state.annotations.forEach(annotation => {
      const layer = state.layers.find(l => l.id === annotation.layerId);
      if (layer && layer.visible) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        PhotoEditorService.drawAnnotation(ctx, annotation, state.zoom, state.panOffset);
        // Highlight if selected
        if (state.selectedElementIds.includes(annotation.id)) {
          PhotoEditorService.drawSelectionHighlight(ctx, annotation.points, state.zoom, state.panOffset);
        }
        ctx.restore();
      }
    });
    
    // Draw current measurement/annotation
    if (state.currentMeasurement) {
      PhotoEditorService.drawMeasurement(ctx, state.currentMeasurement, state.zoom, state.panOffset);
    }
    
    if (state.currentAnnotation) {
      PhotoEditorService.drawAnnotation(ctx, state.currentAnnotation, state.zoom, state.panOffset);
    }
  }, [state]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = state.gridSize;
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [state.gridSize]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): EditorPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Adjust for zoom and pan
    return {
      x: (x / state.zoom) - state.panOffset.x,
      y: (y / state.zoom) - state.panOffset.y
    };
  }, [state.zoom, state.panOffset]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    if (state.tool === 'select') {
      // Handle selection
      const element = PhotoEditorService.findElementAtPoint(
        point, 
        state.measurements.filter(m => {
          const layer = state.layers.find(l => l.id === m.layerId);
          return layer && layer.visible && !layer.locked;
        }),
        state.annotations.filter(a => {
          const layer = state.layers.find(l => l.id === a.layerId);
          return layer && layer.visible && !layer.locked;
        }),
        10 / state.zoom
      );
      
      if (element) {
        // Element found - select it
        if (e.ctrlKey || e.metaKey) {
          // Add to selection
          addSelectedElement(element.id);
        } else {
          // Replace selection
          setSelectedElements([element.id]);
        }
      } else {
        // No element found - clear selection and start panning
        if (!e.ctrlKey && !e.metaKey) {
          clearSelection();
        }
        setIsPanning(true);
        setLastPanPoint(point);
      }
    } else {
      // Start drawing
      setDrawing(true);
      
      if (['linear', 'area', 'angle'].includes(state.tool)) {
        handleMeasurementStart(point);
      } else if (['text', 'arrow', 'rectangle', 'circle', 'line', 'freehand'].includes(state.tool)) {
        handleAnnotationStart(point);
      }
    }
  }, [
    state.tool, 
    state.measurements, 
    state.annotations, 
    state.layers, 
    state.zoom,
    getCanvasPoint, 
    setDrawing, 
    setSelectedElements, 
    addSelectedElement, 
    clearSelection
  ]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    if (isPanning && lastPanPoint && state.tool === 'select') {
      // Update pan offset
      const deltaX = point.x - lastPanPoint.x;
      const deltaY = point.y - lastPanPoint.y;
      setPanOffset({
        x: state.panOffset.x + deltaX,
        y: state.panOffset.y + deltaY
      });
    } else if (state.isDrawing) {
      if (state.currentMeasurement) {
        handleMeasurementUpdate(point);
      } else if (state.currentAnnotation) {
        handleAnnotationUpdate(point);
      }
    }
  }, [
    isPanning,
    lastPanPoint,
    state.tool,
    state.isDrawing,
    state.currentMeasurement,
    state.currentAnnotation,
    state.panOffset,
    getCanvasPoint,
    setPanOffset
  ]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setLastPanPoint(null);
    
    if (state.isDrawing) {
      if (state.currentMeasurement) {
        finalizeMeasurement();
      } else if (state.currentAnnotation) {
        finalizeAnnotation();
      }
      setDrawing(false);
    }
  }, [state.isDrawing, state.currentMeasurement, state.currentAnnotation, setDrawing]);

  const handleMeasurementStart = useCallback((point: EditorPoint) => {
    const id = PhotoEditorService.generateId();
    const layerId = state.activeLayerId || 'measurement-layer';
    const measurement = {
      id,
      type: state.tool as 'linear' | 'area' | 'angle',
      points: [point],
      unit: state.unit,
      layerId,
      style: {
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
        fill: state.fillColor
      }
    };
    updateCurrentMeasurement(measurement);
  }, [state.tool, state.unit, state.activeLayerId, state.strokeColor, state.strokeWidth, state.fillColor, updateCurrentMeasurement]);

  const handleMeasurementUpdate = useCallback((point: EditorPoint) => {
    if (!state.currentMeasurement) return;
    
    const updatedMeasurement = { ...state.currentMeasurement };
    
    if (updatedMeasurement.type === 'linear' && updatedMeasurement.points.length === 1) {
      updatedMeasurement.points = [updatedMeasurement.points[0], point];
      updatedMeasurement.distance = PhotoEditorService.calculateDistance(
        updatedMeasurement.points[0],
        point,
        state.imageMetadata?.scale,
        state.unit
      );
    } else if (updatedMeasurement.type === 'area') {
      updatedMeasurement.points = [...updatedMeasurement.points.slice(0, -1), point];
      if (updatedMeasurement.points.length >= 3) {
        updatedMeasurement.area = PhotoEditorService.calculateArea(
          updatedMeasurement.points,
          state.imageMetadata?.scale,
          state.unit
        );
      }
    }
    
    updateCurrentMeasurement(updatedMeasurement);
  }, [state.currentMeasurement, state.imageMetadata, state.unit, updateCurrentMeasurement]);

  const finalizeMeasurement = useCallback(() => {
    if (state.currentMeasurement && state.currentMeasurement.points.length >= 2) {
      addMeasurement(state.currentMeasurement);
    }
    updateCurrentMeasurement(null);
  }, [state.currentMeasurement, addMeasurement, updateCurrentMeasurement]);

  const handleAnnotationStart = useCallback((point: EditorPoint) => {
    const id = PhotoEditorService.generateId();
    const layerId = state.activeLayerId || 'annotation-layer';
    const annotation = {
      id,
      type: state.tool as 'text' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'freehand',
      points: [point],
      layerId,
      style: {
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
        fill: state.fillColor,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily
      }
    };
    updateCurrentAnnotation(annotation);
  }, [state.tool, state.activeLayerId, state.strokeColor, state.strokeWidth, state.fillColor, state.fontSize, state.fontFamily, updateCurrentAnnotation]);

  const handleAnnotationUpdate = useCallback((point: EditorPoint) => {
    if (!state.currentAnnotation) return;
    
    const updatedAnnotation = { ...state.currentAnnotation };
    
    if (['arrow', 'rectangle', 'circle', 'line'].includes(updatedAnnotation.type)) {
      if (updatedAnnotation.points.length === 1) {
        updatedAnnotation.points = [updatedAnnotation.points[0], point];
      } else {
        updatedAnnotation.points[1] = point;
      }
    } else if (updatedAnnotation.type === 'freehand') {
      updatedAnnotation.points.push(point);
    }
    
    updateCurrentAnnotation(updatedAnnotation);
  }, [state.currentAnnotation, updateCurrentAnnotation]);

  const finalizeAnnotation = useCallback(() => {
    if (state.currentAnnotation && state.currentAnnotation.points.length >= 1) {
      if (state.currentAnnotation.type === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          state.currentAnnotation.text = text;
          addAnnotation(state.currentAnnotation);
        }
      } else {
        addAnnotation(state.currentAnnotation);
      }
    }
    updateCurrentAnnotation(null);
  }, [state.currentAnnotation, addAnnotation, updateCurrentAnnotation]);

  const handleZoomIn = useCallback(() => {
    setZoom(state.zoom * 1.2);
  }, [state.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(state.zoom / 1.2);
  }, [state.zoom, setZoom]);

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const blob = await PhotoEditorService.exportAsBlob(canvas, 'png', 0.9);
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-editor-export-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Photo Editor</h2>
            <div className="text-sm text-gray-600">
              {state.imageType === 'satellite' ? 'Satellite Image' : 'Street View'} | 
              Zoom: {(state.zoom * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            <button
              onClick={toggleGrid}
              className={`p-2 rounded ${state.showGrid ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              title="Toggle Grid"
            >
              <Grid className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            
            <button
              onClick={clearAll}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Clear All"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <EditorToolbar showSettings={showSettings} />
            <div className="p-4 border-t border-gray-200 space-y-4">
              <CalibrationTool />
              <LayerPanel />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
              <div className="relative inline-block">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 shadow-lg cursor-crosshair max-w-full max-h-full"
                  style={{ 
                    transform: `scale(${Math.min(1, 800 / (state.imageMetadata?.width || 800))})`,
                    transformOrigin: 'top left'
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                
                {/* Hidden image element for loading */}
                <img
                  ref={imageRef}
                  className="hidden"
                  alt="Editor source"
                />
              </div>
            </div>
            
            {/* Measurement Canvas Component */}
            <MeasurementCanvas />
          </div>
        </div>
      </div>
    </div>
  );
};