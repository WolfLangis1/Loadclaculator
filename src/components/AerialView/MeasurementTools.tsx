import React, { useCallback } from 'react';
import { Ruler, Square, RotateCcw, Save } from 'lucide-react';
import { useAerialView } from '../../context/AerialViewContext';
import { AttachmentService } from '../../services/attachmentService';

interface MeasurementToolsProps {
  measurementPoints: Array<{x: number, y: number}>;
  setMeasurementPoints: (points: Array<{x: number, y: number}>) => void;
}

export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  measurementPoints,
  setMeasurementPoints
}) => {
  const {
    state,
    updateUIState,
    clearMeasurements
  } = useAerialView();


  const saveMeasurements = useCallback(async () => {
    if (!state.measurements.linear.length && !state.measurements.area.length) return;

    const measurementData = {
      linear: state.measurements.linear,
      area: state.measurements.area,
      timestamp: new Date().toISOString(),
      address: state.address
    };

    try {
      const blob = new Blob([JSON.stringify(measurementData, null, 2)], { 
        type: 'application/json' 
      });
      
      await AttachmentService.saveProjectAsset(
        'current', // project ID
        'measurement_data.json',
        blob,
        'measurement_data',
        'measurements'
      );
    } catch (error) {
      console.error('Failed to save measurements:', error);
    }
  }, [state.measurements, state.address]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Ruler className="h-5 w-5 text-green-600" />
        Measurement Tools
      </h4>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => updateUIState({ 
            measurementMode: state.ui.measurementMode === 'linear' ? 'off' : 'linear' 
          })}
          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
            state.ui.measurementMode === 'linear'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Ruler className="h-4 w-4" />
          Linear
        </button>
        
        <button
          onClick={() => updateUIState({ 
            measurementMode: state.ui.measurementMode === 'area' ? 'off' : 'area' 
          })}
          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
            state.ui.measurementMode === 'area'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Square className="h-4 w-4" />
          Area
        </button>
        
        <button
          onClick={clearMeasurements}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
        
        <button
          onClick={saveMeasurements}
          disabled={!state.measurements.linear.length && !state.measurements.area.length}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
      
      {/* Current Measurement Display */}
      {state.ui.measurementMode !== 'off' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-blue-800">
            {state.ui.measurementMode === 'linear' && 'Click two points to measure distance'}
            {state.ui.measurementMode === 'area' && 'Click multiple points to measure area (double-click to finish)'}
          </div>
          {measurementPoints.length > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              Points selected: {measurementPoints.length}
            </div>
          )}
        </div>
      )}

      {/* Measurement Results */}
      {(state.measurements.linear.length > 0 || state.measurements.area.length > 0) && (
        <div className="border-t pt-4">
          <h5 className="font-medium text-gray-900 mb-2">Measurement Results</h5>
          
          {state.measurements.linear.map((measurement, index) => (
            <div key={measurement.id} className="bg-gray-50 rounded p-2 text-sm mb-2 border-l-4 border-green-500">
              <div className="font-medium text-gray-900">Linear {index + 1}</div>
              <div className="text-gray-600">{measurement.label}</div>
              <div className="text-xs text-gray-500">Distance: {measurement.distance.toFixed(2)} {measurement.unit}</div>
              <div className="text-xs text-green-600">✓ Shown in green on image</div>
            </div>
          ))}
          
          {state.measurements.area.map((measurement, index) => (
            <div key={measurement.id} className="bg-gray-50 rounded p-2 text-sm mb-2 border-l-4 border-orange-500">
              <div className="font-medium text-gray-900">Area {index + 1}</div>
              <div className="text-gray-600">{measurement.label}</div>
              <div className="text-xs text-gray-500">Area: {measurement.area.toFixed(2)} {measurement.unit}</div>
              <div className="text-xs text-orange-600">✓ Shown in orange on image</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};