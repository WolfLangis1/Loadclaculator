import React from 'react';
import { usePhotoEditor } from '../../../context/PhotoEditorContext';

export const MeasurementCanvas: React.FC = () => {
  const { state } = usePhotoEditor();

  const totalMeasurements = state.measurements.length;
  const totalAnnotations = state.annotations.length;
  
  const linearMeasurements = state.measurements.filter(m => m.type === 'linear');
  const areaMeasurements = state.measurements.filter(m => m.type === 'area');
  const angleMeasurements = state.measurements.filter(m => m.type === 'angle');

  const totalDistance = linearMeasurements.reduce((sum, m) => sum + (m.distance || 0), 0);
  const totalArea = areaMeasurements.reduce((sum, m) => sum + (m.area || 0), 0);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        
        {/* Summary Stats */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-800 font-medium">Total Items</div>
          <div className="text-blue-600">
            {totalMeasurements + totalAnnotations} items
          </div>
          <div className="text-xs text-blue-500">
            {totalMeasurements} measurements, {totalAnnotations} annotations
          </div>
        </div>

        {/* Distance Summary */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-green-800 font-medium">Total Distance</div>
          <div className="text-green-600">
            {totalDistance.toFixed(2)} {state.unit}
          </div>
          <div className="text-xs text-green-500">
            {linearMeasurements.length} linear measurements
          </div>
        </div>

        {/* Area Summary */}
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-yellow-800 font-medium">Total Area</div>
          <div className="text-yellow-600">
            {totalArea.toFixed(2)} {state.unit}²
          </div>
          <div className="text-xs text-yellow-500">
            {areaMeasurements.length} area measurements
          </div>
        </div>

        {/* Scale Info */}
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-purple-800 font-medium">Scale</div>
          <div className="text-purple-600">
            {state.imageMetadata?.scale ? 
              `${state.imageMetadata.scale.toFixed(2)} px/${state.unit}` : 
              'Not calibrated'
            }
          </div>
          <div className="text-xs text-purple-500">
            {state.imageType === 'satellite' ? 'Satellite' : 'Street View'}
          </div>
        </div>
      </div>

      {/* Current Tool Info */}
      {state.tool !== 'select' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="font-medium">Active Tool:</span>
            <span className="capitalize">{state.tool}</span>
            {state.isDrawing && (
              <span className="text-blue-600">(Drawing...)</span>
            )}
          </div>
          
          {/* Tool Instructions */}
          <div className="mt-2 text-xs text-gray-600">
            {state.tool === 'linear' && "Click two points to measure distance"}
            {state.tool === 'area' && "Click multiple points to create a polygon, then click the first point to close"}
            {state.tool === 'angle' && "Click three points: first point, vertex, second point"}
            {state.tool === 'text' && "Click where you want to place text"}
            {state.tool === 'arrow' && "Click and drag to draw an arrow"}
            {state.tool === 'rectangle' && "Click and drag to draw a rectangle"}
            {state.tool === 'circle' && "Click center then click edge to draw a circle"}
            {state.tool === 'line' && "Click and drag to draw a line"}
            {state.tool === 'freehand' && "Click and drag to draw freehand"}
          </div>
        </div>
      )}

      {/* Scale Calibration Helper */}
      {!state.imageMetadata?.scale && state.imageType === 'streetview' && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-orange-800 font-medium text-sm">Scale Calibration Needed</div>
          <div className="text-orange-700 text-xs mt-1">
            For accurate measurements on street view images, please:
            <br />
            1. Measure a known distance (like a car length ≈ 15 ft)
            <br />
            2. Calculate: pixels ÷ known distance = scale
            <br />
            3. Enter the scale in Settings
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="mt-4 text-xs text-gray-500">
        <strong>Shortcuts:</strong> 
        <span className="ml-2">S = Select</span>
        <span className="ml-2">L = Linear</span>
        <span className="ml-2">A = Area</span>
        <span className="ml-2">T = Text</span>
        <span className="ml-2">Del = Delete selected</span>
        <span className="ml-2">Ctrl+Z = Undo</span>
      </div>
    </div>
  );
};