import React, { useState, useCallback } from 'react';
import { 
  ZoomIn,
  ZoomOut,
  Satellite,
  Download,
  Sun,
  Zap
} from 'lucide-react';
import { useAerialView } from '../../context/AerialViewContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { AerialMeasurementService } from '../../services/aerialMeasurementService';

import { AddressSearchControls } from './AddressSearchControls';
import { MeasurementTools } from './MeasurementTools';
import { SolarAnalysisResults } from './SolarAnalysisResults';
import { StreetViewGallery } from './StreetViewGallery';
import { AnnotationOverlay, type Annotation, type AnnotationStyle } from './AnnotationOverlay';
import { AnnotationTools } from './AnnotationTools';

import { SecureAerialViewService } from '../../services/secureAerialViewService';
import { AttachmentService } from '../../services/attachmentService';
import { GoogleSolarService } from '../../services/googleSolarService';
import { AIRoofAnalysisService, type RoofAnalysisResult } from '../../services/aiRoofAnalysisService';

export const SimpleAerialViewMain: React.FC = () => {
  const {
    state,
    setZoom,
    setSatelliteImage,
    addLinearMeasurement,
    addAreaMeasurement,
    addPolylineMeasurement
  } = useAerialView();
  
  const { settings } = useProjectSettings();
  
  const [measurementPoints, setMeasurementPoints] = useState<Array<{x: number, y: number}>>([]);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [solarAnalysis, setSolarAnalysis] = useState<any>(null);
  const [solarAnalysisLoading, setSolarAnalysisLoading] = useState(false);
  const [aiRoofAnalysis, setAiRoofAnalysis] = useState<RoofAnalysisResult | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [currentTool, setCurrentTool] = useState<'select' | 'line' | 'circle' | 'square' | 'polyline' | 'delete'>('select');
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [currentStyle, setCurrentStyle] = useState<AnnotationStyle>({
    stroke: '#ff0000',
    strokeWidth: 2,
    opacity: 1,
    fill: 'none'
  });

  // Helper function to calculate meters per pixel based on zoom and latitude
  const calculateMetersPerPixel = (zoom: number, latitude: number) => {
    // Earth's circumference at equator in meters
    const earthCircumference = 40075000;
    // Calculate meters per pixel at given latitude and zoom
    // Formula: (Earth circumference * cos(latitude)) / (2^(zoom + 8))
    const metersPerPixel = (earthCircumference * Math.cos(latitude * Math.PI / 180)) / Math.pow(2, zoom + 8);
    
    // Apply Google Maps specific correction factor for satellite imagery
    // Google's satellite tiles have slightly different scaling than street maps
    const correctionFactor = 0.85; // Empirically determined for better accuracy
    
    return metersPerPixel * correctionFactor;
  };

  // Add annotation to history for undo/redo
  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    const newHistory = annotationHistory.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setAnnotationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [annotationHistory, historyIndex]);

  // Annotation click handler for drawing new annotations
  const handleAnnotationDrawing = useCallback((point: {x: number, y: number}, e: React.MouseEvent) => {
    const newPoints = [...measurementPoints, point];
    setMeasurementPoints(newPoints);

    if (currentTool === 'line' && newPoints.length === 2) {
      // Complete line annotation
      const annotation: Annotation = {
        id: Date.now().toString(),
        type: 'line',
        points: newPoints,
        style: { ...currentStyle },
        completed: true
      };
      
      addToHistory([...annotations, annotation]);
      setAnnotations(prev => [...prev, annotation]);
      setMeasurementPoints([]);
      setCurrentAnnotation(null);
    } else if (currentTool === 'circle' && newPoints.length === 2) {
      // Complete circle annotation
      const annotation: Annotation = {
        id: Date.now().toString(),
        type: 'circle',
        points: newPoints,
        style: { ...currentStyle },
        completed: true
      };
      
      addToHistory([...annotations, annotation]);
      setAnnotations(prev => [...prev, annotation]);
      setMeasurementPoints([]);
      setCurrentAnnotation(null);
    } else if (currentTool === 'square' && newPoints.length === 2) {
      // Complete square annotation
      const annotation: Annotation = {
        id: Date.now().toString(),
        type: 'square',
        points: newPoints,
        style: { ...currentStyle },
        completed: true
      };
      
      addToHistory([...annotations, annotation]);
      setAnnotations(prev => [...prev, annotation]);
      setMeasurementPoints([]);
      setCurrentAnnotation(null);
    } else if (currentTool === 'polyline') {
      // Handle multi-point line (double-click to complete)
      if (e.detail === 2 && newPoints.length >= 2) { // Double-click
        const annotation: Annotation = {
          id: Date.now().toString(),
          type: 'polyline',
          points: newPoints,
          style: { ...currentStyle },
          completed: true
        };
        
        addToHistory([...annotations, annotation]);
        setAnnotations(prev => [...prev, annotation]);
        setMeasurementPoints([]);
        setCurrentAnnotation(null);
      } else {
        // Update current annotation preview
        setCurrentAnnotation({
          id: 'preview',
          type: 'polyline',
          points: newPoints,
          style: { ...currentStyle },
          completed: false
        });
      }
    }
  }, [measurementPoints, currentTool, currentStyle, annotations, addToHistory]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (state.zoom < 25) {
      setZoom(state.zoom + 1);
      // Refresh satellite image with new zoom level
      if (state.coordinates) {
        refreshSatelliteImage();
      }
    }
  }, [state.zoom, state.coordinates, setZoom]);

  const handleZoomOut = useCallback(() => {
    if (state.zoom > 1) {
      setZoom(state.zoom - 1);
      // Refresh satellite image with new zoom level
      if (state.coordinates) {
        refreshSatelliteImage();
      }
    }
  }, [state.zoom, state.coordinates, setZoom]);

  const refreshSatelliteImage = useCallback(async () => {
    if (!state.coordinates) return;
    
    try {
      const satelliteResult = await SecureAerialViewService.getSatelliteImagery(
        state.coordinates.latitude,
        state.coordinates.longitude,
        { width: 800, height: 600, zoom: state.zoom }
      );
      
      if (satelliteResult.success) {
        setSatelliteImage(satelliteResult.data.imageUrl);
      }
    } catch (error) {
      console.error('Failed to refresh satellite image:', error);
    }
  }, [state.coordinates, state.zoom, setSatelliteImage]);

  // Solar analysis
  const handleSolarAnalysis = useCallback(async () => {
    if (!state.coordinates) return;
    
    setSolarAnalysisLoading(true);
    try {
      const result = await GoogleSolarService.getSolarPotential(
        state.coordinates.latitude,
        state.coordinates.longitude
      );
      setSolarAnalysis(result);
    } catch (error) {
      console.error('Solar analysis failed:', error);
    } finally {
      setSolarAnalysisLoading(false);
    }
  }, [state.coordinates]);

  // Image click handler for measurements and annotations
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoint = { x, y };

    // Handle measurement mode
    if (state.ui.measurementMode !== 'off') {
      const newPoints = [...measurementPoints, newPoint];
      setMeasurementPoints(newPoints);

      if (state.ui.measurementMode === 'linear' && newPoints.length === 2) {
        // Use improved measurement service
        const result = AerialMeasurementService.calculateLinearDistance(
          newPoints[0],
          newPoints[1],
          state.zoom,
          state.coordinates?.latitude || 0,
          'meters'
        );
        
        // Add measurement to context
        const measurement = {
          id: Date.now().toString(),
          startPoint: newPoints[0],
          endPoint: newPoints[1],
          distance: result.distance,
          unit: result.unit,
          label: result.label
        };
        addLinearMeasurement(measurement);
        
        setMeasurementPoints([]);
      } else if (state.ui.measurementMode === 'polyline') {
        // Handle multi-point polyline measurement
        if (e.detail === 2 && newPoints.length >= 2) { // Double-click to finish
          const result = AerialMeasurementService.calculatePolylineDistance(
            newPoints,
            state.zoom,
            state.coordinates?.latitude || 0,
            'meters'
          );
          
          const measurement = {
            id: Date.now().toString(),
            points: newPoints,
            totalDistance: result.totalDistance,
            segmentDistances: result.segmentDistances,
            unit: result.unit,
            label: result.label
          };
          addPolylineMeasurement(measurement);
          
          setMeasurementPoints([]);
        }
        // Continue adding points if not double-clicked
      } else if (state.ui.measurementMode === 'area') {
        // For area measurement, need at least 3 points and double-click to finish
        if (e.detail === 2 && newPoints.length >= 3) { // Double-click to finish
          const result = AerialMeasurementService.calculatePolygonArea(
            newPoints,
            state.zoom,
            state.coordinates?.latitude || 0,
            'sqm'
          );
          
          // Add measurement to context
          const measurement = {
            id: Date.now().toString(),
            points: newPoints,
            area: result.area,
            unit: result.unit,
            label: result.label
          };
          addAreaMeasurement(measurement);
          
          setMeasurementPoints([]);
        }
        // Continue adding points if not double-clicked
      }
      return;
    }

    // Handle annotation mode
    if (currentTool !== 'select' && currentTool !== 'delete') {
      handleAnnotationDrawing(newPoint, e);
    }
  }, [state.ui.measurementMode, state.zoom, state.coordinates, measurementPoints, currentTool, handleAnnotationDrawing]);


  // Annotation tool handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = annotationHistory[historyIndex - 1];
      setAnnotations(previousState);
      setHistoryIndex(historyIndex - 1);
    }
  }, [annotationHistory, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < annotationHistory.length - 1) {
      const nextState = annotationHistory[historyIndex + 1];
      setAnnotations(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  }, [annotationHistory, historyIndex]);

  const handleClearAnnotations = useCallback(() => {
    addToHistory([]);
    setAnnotations([]);
    setCurrentAnnotation(null);
    setMeasurementPoints([]);
  }, [addToHistory]);

  const handleSaveAnnotations = useCallback(async () => {
    if (!state.satelliteImage || annotations.length === 0) return;
    
    try {
      // Create a canvas to combine the image and annotations
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the satellite image
        ctx.drawImage(img, 0, 0);
        
        // Draw annotations
        annotations.forEach(annotation => {
          ctx.strokeStyle = annotation.style.stroke;
          ctx.lineWidth = annotation.style.strokeWidth;
          ctx.globalAlpha = annotation.style.opacity;
          
          if (annotation.style.dashArray) {
            const dashArray = annotation.style.dashArray.split(',').map(Number);
            ctx.setLineDash(dashArray);
          } else {
            ctx.setLineDash([]);
          }
          
          ctx.beginPath();
          
          switch (annotation.type) {
            case 'line':
              if (annotation.points.length >= 2) {
                ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
                ctx.lineTo(annotation.points[1].x, annotation.points[1].y);
              }
              break;
              
            case 'polyline':
              if (annotation.points.length >= 2) {
                ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
                for (let i = 1; i < annotation.points.length; i++) {
                  ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
                }
              }
              break;
              
            case 'circle':
              if (annotation.points.length >= 2) {
                const center = annotation.points[0];
                const edge = annotation.points[1];
                const radius = Math.sqrt(
                  Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
                );
                ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
              }
              break;
              
            case 'square':
              if (annotation.points.length >= 2) {
                const start = annotation.points[0];
                const end = annotation.points[1];
                const width = end.x - start.x;
                const height = end.y - start.y;
                ctx.rect(start.x, start.y, width, height);
              }
              break;
          }
          
          ctx.stroke();
          if (annotation.style.fill && annotation.style.fill !== 'none') {
            ctx.fillStyle = annotation.style.fill;
            ctx.fill();
          }
        });
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          // Create filename with customer info
          const customerName = settings.projectInfo.customerName || 'Unknown';
          const address = settings.projectInfo.propertyAddress || 'No-Address';
          const safeCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
          const safeAddress = address.replace(/[^a-zA-Z0-9]/g, '_');
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `${safeCustomerName}_${safeAddress}_annotated_${timestamp}.jpg`;
          
          // Download file
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          // Save to project assets
          await AttachmentService.saveProjectAsset(
            'current',
            filename,
            blob,
            'annotated_image',
            {
              customerName: settings.projectInfo.customerName,
              address: settings.projectInfo.propertyAddress,
              annotationCount: annotations.length,
              timestamp: new Date().toISOString()
            }
          );
        }, 'image/jpeg', 0.9);
      };
      
      img.src = state.satelliteImage;
    } catch (error) {
      console.error('Failed to save annotated image:', error);
    }
  }, [state.satelliteImage, annotations, settings]);

  const handleStyleChange = useCallback((styleUpdate: Partial<AnnotationStyle>) => {
    setCurrentStyle(prev => ({ ...prev, ...styleUpdate }));
  }, []);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    if (currentTool === 'delete') {
      const updatedAnnotations = annotations.filter(a => a.id !== annotation.id);
      addToHistory(updatedAnnotations);
      setAnnotations(updatedAnnotations);
    }
  }, [currentTool, annotations, addToHistory]);

  // AI roof analysis
  const handleAIRoofAnalysis = useCallback(async () => {
    if (!state.satelliteImage || !state.coordinates) return;
    
    setAiAnalysisLoading(true);
    try {
      const result = await AIRoofAnalysisService.analyzeRoof(
        state.satelliteImage,
        state.coordinates.latitude,
        state.coordinates.longitude
      );
      setAiRoofAnalysis(result);
    } catch (error) {
      console.error('AI roof analysis failed:', error);
    } finally {
      setAiAnalysisLoading(false);
    }
  }, [state.satelliteImage, state.coordinates]);

  // Save satellite image
  const handleSaveImage = useCallback(async () => {
    if (!state.satelliteImage) return;
    
    try {
      const response = await fetch(state.satelliteImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satellite-view-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Save to project assets
      await AttachmentService.saveProjectAsset(
        'current',
        `satellite-view-${Date.now()}.jpg`,
        blob,
        'satellite_image',
        'satellite'
      );
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  }, [state.satelliteImage]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Site Analysis</h2>
        <div className="text-sm text-gray-600">
          {settings.projectInfo.propertyAddress ? (
            <div className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              <span>Secure backend configured and ready</span>
            </div>
          ) : (
            <span>Enter property address to get started</span>
          )}
        </div>
      </div>

      {/* Address Search Controls */}
      <AddressSearchControls />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Satellite Image and Controls */}
        <div className="space-y-4">
          {/* Satellite Image Display */}
          {state.satelliteImage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Satellite className="h-5 w-5 text-blue-600" />
                  Satellite View
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={state.zoom <= 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">Zoom: {state.zoom}</span>
                  <button
                    onClick={handleZoomIn}
                    disabled={state.zoom >= 25}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <img
                  ref={setImageRef}
                  src={state.satelliteImage}
                  alt="Satellite view"
                  className={`w-full h-auto rounded-lg border border-gray-200 ${
                    state.ui.measurementMode !== 'off' 
                      ? 'cursor-crosshair' 
                      : 'cursor-default'
                  }`}
                  onClick={handleImageClick}
                />
                {annotationsVisible && imageRef && (
                  <div className="absolute inset-0 z-30">
                    <AnnotationOverlay
                      annotations={annotations}
                      currentAnnotation={currentAnnotation}
                      measurementPoints={measurementPoints}
                      imageWidth={imageRef.clientWidth}
                      imageHeight={imageRef.clientHeight}
                      onAnnotationClick={handleAnnotationClick}
                    />
                  </div>
                )}
                
                {/* Measurement overlay for active measurements */}
                {(state.ui.measurementMode !== 'off' || measurementPoints.length > 0 || state.measurements.linear.length > 0 || state.measurements.area.length > 0 || state.measurements.polyline.length > 0) && imageRef && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <svg
                      width={imageRef.clientWidth}
                      height={imageRef.clientHeight}
                      className="absolute inset-0 z-20"
                      style={{ pointerEvents: 'none' }}
                    >
                      {/* Render measurement points */}
                      {measurementPoints.map((point, index) => (
                        <circle
                          key={`measurement-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={4}
                          fill="blue"
                          stroke="white"
                          strokeWidth={2}
                          opacity={0.8}
                        />
                      ))}
                      
                      {/* Render measurement lines for linear mode */}
                      {state.ui.measurementMode === 'linear' && measurementPoints.length >= 2 && (
                        <line
                          x1={measurementPoints[0].x}
                          y1={measurementPoints[0].y}
                          x2={measurementPoints[measurementPoints.length - 1].x}
                          y2={measurementPoints[measurementPoints.length - 1].y}
                          stroke="blue"
                          strokeWidth={2}
                          strokeDasharray="5,5"
                          opacity={0.8}
                        />
                      )}
                      
                      {/* Render measurement lines for polyline mode */}
                      {state.ui.measurementMode === 'polyline' && measurementPoints.length >= 2 && (
                        <polyline
                          points={measurementPoints.map(p => `${p.x},${p.y}`).join(' ')}
                          stroke="blue"
                          strokeWidth={2}
                          strokeDasharray="5,5"
                          fill="none"
                          opacity={0.8}
                        />
                      )}
                      
                      {/* Render measurement polygon for area mode */}
                      {state.ui.measurementMode === 'area' && measurementPoints.length >= 3 && (
                        <polygon
                          points={measurementPoints.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="rgba(0, 100, 255, 0.2)"
                          stroke="blue"
                          strokeWidth={2}
                          strokeDasharray="5,5"
                          opacity={0.8}
                        />
                      )}
                      
                      {/* Render completed linear measurements */}
                      {state.measurements.linear.map((measurement) => (
                        <g key={`linear-${measurement.id}`}>
                          <line
                            x1={measurement.startPoint.x}
                            y1={measurement.startPoint.y}
                            x2={measurement.endPoint.x}
                            y2={measurement.endPoint.y}
                            stroke="green"
                            strokeWidth={2}
                            opacity={0.7}
                          />
                          <circle cx={measurement.startPoint.x} cy={measurement.startPoint.y} r={3} fill="green" />
                          <circle cx={measurement.endPoint.x} cy={measurement.endPoint.y} r={3} fill="green" />
                          <text
                            x={(measurement.startPoint.x + measurement.endPoint.x) / 2}
                            y={(measurement.startPoint.y + measurement.endPoint.y) / 2 - 5}
                            fill="green"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {measurement.label}
                          </text>
                        </g>
                      ))}
                      
                      {/* Render completed area measurements */}
                      {state.measurements.area.map((measurement) => {
                        const centroid = measurement.points.reduce(
                          (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
                          { x: 0, y: 0 }
                        );
                        centroid.x /= measurement.points.length;
                        centroid.y /= measurement.points.length;
                        
                        return (
                          <g key={`area-${measurement.id}`}>
                            <polygon
                              points={measurement.points.map(p => `${p.x},${p.y}`).join(' ')}
                              fill="rgba(255, 100, 0, 0.2)"
                              stroke="orange"
                              strokeWidth={2}
                              opacity={0.7}
                            />
                            {measurement.points.map((point, pointIndex) => (
                              <circle key={pointIndex} cx={point.x} cy={point.y} r={3} fill="orange" />
                            ))}
                            <text
                              x={centroid.x}
                              y={centroid.y}
                              fill="orange"
                              fontSize="12"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="pointer-events-none"
                            >
                              {measurement.label}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Render completed polyline measurements */}
                      {state.measurements.polyline.map((measurement) => {
                        const midPoint = measurement.points[Math.floor(measurement.points.length / 2)];
                        
                        return (
                          <g key={`polyline-${measurement.id}`}>
                            <polyline
                              points={measurement.points.map(p => `${p.x},${p.y}`).join(' ')}
                              stroke="purple"
                              strokeWidth={3}
                              fill="none"
                              opacity={0.8}
                            />
                            {measurement.points.map((point, pointIndex) => (
                              <circle key={pointIndex} cx={point.x} cy={point.y} r={4} fill="purple" />
                            ))}
                            <text
                              x={midPoint.x}
                              y={midPoint.y - 15}
                              fill="purple"
                              fontSize="12"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="pointer-events-none"
                            >
                              {measurement.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                  © Google
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveImage}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Save Image
                </button>
                
                <button
                  onClick={handleSolarAnalysis}
                  disabled={solarAnalysisLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  <Sun className="h-4 w-4" />
                  {solarAnalysisLoading ? 'Analyzing...' : 'Solar Analysis'}
                </button>
                
                <button
                  onClick={handleAIRoofAnalysis}
                  disabled={aiAnalysisLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  {aiAnalysisLoading ? 'Processing...' : 'AI Roof Analysis'}
                </button>
              </div>
            </div>
          )}

          {/* Measurement Tools - Always visible */}
          <MeasurementTools 
            measurementPoints={measurementPoints}
            setMeasurementPoints={setMeasurementPoints}
          />
          
          {/* Annotation Tools */}
          <AnnotationTools
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClearAnnotations}
            onSave={handleSaveAnnotations}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < annotationHistory.length - 1}
            annotationsVisible={annotationsVisible}
            onToggleVisibility={() => setAnnotationsVisible(!annotationsVisible)}
            currentStyle={currentStyle}
            onStyleChange={handleStyleChange}
          />
        </div>

        {/* Right Column - Analysis Results and Street View */}
        <div className="space-y-4">
          {/* Solar Analysis Results */}
          <SolarAnalysisResults 
            solarAnalysis={solarAnalysis}
            aiRoofAnalysis={aiRoofAnalysis}
            loading={solarAnalysisLoading}
            aiLoading={aiAnalysisLoading}
            onRefresh={handleSolarAnalysis}
          />

          {/* Street View Gallery */}
          <StreetViewGallery />
        </div>
      </div>
    </div>
  );
};