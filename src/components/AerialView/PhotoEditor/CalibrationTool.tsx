import React, { useState, useCallback } from 'react';
import { Ruler, Check, X } from 'lucide-react';
import { usePhotoEditor } from '../../../context/PhotoEditorContext';
import { PhotoEditorService } from '../../../services/photoEditorService';

export const CalibrationTool: React.FC = () => {
  const { state, setScale } = usePhotoEditor();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Array<{x: number, y: number}>>([]);
  const [knownDistance, setKnownDistance] = useState<string>('');

  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    setCalibrationPoints([]);
    setKnownDistance('');
  }, []);

  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false);
    setCalibrationPoints([]);
    setKnownDistance('');
  }, []);

  const finishCalibration = useCallback(() => {
    if (calibrationPoints.length === 2 && knownDistance) {
      const pixelDistance = PhotoEditorService.calculateDistance(
        calibrationPoints[0],
        calibrationPoints[1]
      );
      
      const realDistance = parseFloat(knownDistance);
      if (realDistance > 0) {
        const newScale = PhotoEditorService.calibrateScale(pixelDistance, realDistance, state.unit);
        setScale(newScale);
        setIsCalibrating(false);
        setCalibrationPoints([]);
        setKnownDistance('');
      }
    }
  }, [calibrationPoints, knownDistance, state.unit, setScale]);

  // Handle clicks on the canvas for calibration
  React.useEffect(() => {
    if (!isCalibrating) return;

    const handleCanvasClick = (e: MouseEvent) => {
      const canvas = document.querySelector('canvas');
      if (!canvas || calibrationPoints.length >= 2) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      // Adjust for zoom and pan
      const adjustedPoint = {
        x: (x / state.zoom) - state.panOffset.x,
        y: (y / state.zoom) - state.panOffset.y
      };

      setCalibrationPoints(prev => [...prev, adjustedPoint]);
    };

    document.addEventListener('click', handleCanvasClick, true);
    return () => document.removeEventListener('click', handleCanvasClick, true);
  }, [isCalibrating, calibrationPoints.length, state.zoom, state.panOffset]);

  const currentScale = state.imageMetadata?.scale || 1;
  const estimatedCoverage = state.imageMetadata ? 
    Math.round(state.imageMetadata.width / currentScale) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Ruler className="h-4 w-4 text-blue-600" />
        Scale Calibration
      </h4>

      {!isCalibrating ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-600">
            <div>Current scale: {currentScale.toFixed(2)} pixels/{state.unit}</div>
            <div>Estimated coverage: ~{estimatedCoverage} {state.unit} wide</div>
          </div>
          
          <button
            onClick={startCalibration}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Calibrate Scale
          </button>
          
          <div className="text-xs text-gray-500">
            Calibrate by measuring a known distance in the image
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-blue-900 bg-blue-50 p-2 rounded">
            <div className="font-medium">Step {calibrationPoints.length + 1} of 3:</div>
            {calibrationPoints.length === 0 && "Click the first point of a known distance"}
            {calibrationPoints.length === 1 && "Click the second point of the distance"}
            {calibrationPoints.length === 2 && "Enter the real-world distance"}
          </div>

          {calibrationPoints.length === 2 && (
            <div className="space-y-2">
              <label className="block text-xs text-gray-700">
                Known distance ({state.unit}):
              </label>
              <input
                type="number"
                value={knownDistance}
                onChange={(e) => setKnownDistance(e.target.value)}
                placeholder={`Enter distance in ${state.unit}`}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                step="0.1"
                min="0"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={finishCalibration}
              disabled={calibrationPoints.length < 2 || !knownDistance}
              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-1"
            >
              <Check className="h-3 w-3" />
              Apply
            </button>
            <button
              onClick={cancelCalibration}
              className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-1"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>

          {calibrationPoints.length > 0 && (
            <div className="text-xs text-gray-600">
              Points selected: {calibrationPoints.length}/2
              {calibrationPoints.length === 2 && (
                <div>
                  Pixel distance: {PhotoEditorService.calculateDistance(
                    calibrationPoints[0], 
                    calibrationPoints[1]
                  ).toFixed(1)} px
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};