import React, { useState } from 'react';
import { 
  MousePointer, 
  Ruler, 
  Square, 
  RotateCcw, 
  Type, 
  ArrowRight, 
  Circle, 
  Minus, 
  Edit,
  Palette,
  Settings,
  Target,
  Info
} from 'lucide-react';
import { usePhotoEditor } from '../../../context/PhotoEditorContext';
import { MeasurementCalibrationService } from '../../../services/measurementCalibrationService';

interface EditorToolbarProps {
  showSettings: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ showSettings }) => {
  const {
    state,
    setTool,
    setUnit,
    setScale,
    setStrokeColor,
    setStrokeWidth,
    setFillColor,
    setFontSize,
    setFontFamily,
    removeMeasurement,
    removeAnnotation
  } = usePhotoEditor();

  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<'idle' | 'reference' | 'distance'>('idle');
  const [referenceObject, setReferenceObject] = useState('');
  const [referenceDistance, setReferenceDistance] = useState('');

  const tools = [
    { id: 'select', label: 'Select', icon: MousePointer },
    { id: 'linear', label: 'Linear Measurement', icon: Ruler },
    { id: 'area', label: 'Area Measurement', icon: Square },
    { id: 'angle', label: 'Angle Measurement', icon: RotateCcw },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'line', label: 'Line', icon: Minus },
    { id: 'freehand', label: 'Freehand', icon: Edit }
  ];

  const colorPresets = [
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ffa500', // Orange
    '#800080', // Purple
    '#000000', // Black
    '#ffffff'  // White
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tools Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setTool(tool.id as any)}
                className={`
                  flex items-center gap-2 p-2 rounded text-sm
                  ${state.tool === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title={tool.label}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Style Settings */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Style</h3>
        
        {/* Color Picker */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Stroke Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded"
              />
              <div className="flex flex-wrap gap-1">
                {colorPresets.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className="w-6 h-6 border border-gray-300 rounded"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Fill Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.fillColor.replace(/rgba?\([^)]+\)/, state.strokeColor)}
                onChange={(e) => setFillColor(`${e.target.value}33`)}
                className="w-8 h-8 border border-gray-300 rounded"
              />
              <span className="text-xs text-gray-500">Opacity: 20%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Stroke Width</label>
            <input
              type="range"
              min="1"
              max="10"
              value={state.strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500">{state.strokeWidth}px</div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Font Size</label>
            <input
              type="range"
              min="8"
              max="32"
              value={state.fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500">{state.fontSize}px</div>
          </div>
        </div>
      </div>

      {/* Measurement Settings */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Measurement</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Unit</label>
            <select
              value={state.unit}
              onChange={(e) => setUnit(e.target.value as 'ft' | 'm')}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
            </select>
          </div>

          {showSettings && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Scale (pixels per {state.unit})
              </label>
              <input
                type="number"
                value={state.imageMetadata?.scale || 1}
                onChange={(e) => setScale(Number(e.target.value) || 1)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Enter scale..."
                step="0.1"
                min="0.1"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {(state.imageMetadata?.scale || 1).toFixed(2)} px/{state.unit}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calibration Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Calibration</h3>
          <button
            onClick={() => setShowCalibration(!showCalibration)}
            className="p-1 text-gray-600 hover:text-gray-900 rounded"
            title="Show calibration tools"
          >
            <Target className="h-4 w-4" />
          </button>
        </div>

        {showCalibration && (
          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              Calibrate measurements using a known reference object
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Reference Object</label>
              <select
                value={referenceObject}
                onChange={(e) => setReferenceObject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Select reference...</option>
                {MeasurementCalibrationService.getCommonReferences().map((ref) => (
                  <option key={ref.name} value={`${ref.name}:${ref.size[state.unit]}`}>
                    {ref.name} ({ref.size[state.unit]} {state.unit})
                  </option>
                ))}
                <option value="custom">Custom...</option>
              </select>
            </div>

            {referenceObject === 'custom' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Custom Distance ({state.unit})
                </label>
                <input
                  type="number"
                  value={referenceDistance}
                  onChange={(e) => setReferenceDistance(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder={`Enter distance in ${state.unit}...`}
                  step="0.1"
                  min="0.1"
                />
              </div>
            )}

            <button
              onClick={() => {
                if (referenceObject) {
                  setCalibrationStep('reference');
                  setTool('linear');
                }
              }}
              disabled={!referenceObject || (referenceObject === 'custom' && !referenceDistance)}
              className="w-full p-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Start Calibration
            </button>

            {calibrationStep === 'reference' && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="flex items-center gap-1 text-blue-800 font-medium">
                  <Info className="h-3 w-3" />
                  Calibration Mode
                </div>
                <div className="text-blue-700 mt-1">
                  Draw a line along the reference object to set the scale
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Measurements List */}
      <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Measurements</h3>
        
        <div className="space-y-2">
          {state.measurements.map((measurement) => (
            <div key={measurement.id} className="bg-gray-50 p-2 rounded text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{measurement.type}</span>
                <button
                  onClick={() => removeMeasurement(measurement.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Remove"
                >
                  ×
                </button>
              </div>
              
              {measurement.distance !== undefined && (
                <div className="text-gray-600">
                  {measurement.distance.toFixed(2)} {measurement.unit}
                </div>
              )}
              
              {measurement.area !== undefined && (
                <div className="text-gray-600">
                  {measurement.area.toFixed(2)} {measurement.unit}²
                </div>
              )}
              
              {measurement.angle !== undefined && (
                <div className="text-gray-600">
                  {measurement.angle.toFixed(1)}°
                </div>
              )}

              {measurement.label && (
                <div className="text-gray-600 italic">
                  {measurement.label}
                </div>
              )}
            </div>
          ))}
          
          {state.measurements.length === 0 && (
            <div className="text-gray-500 text-sm italic">
              No measurements yet
            </div>
          )}
        </div>
      </div>

      {/* Annotations List */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Annotations</h3>
        
        <div className="space-y-2">
          {state.annotations.map((annotation) => (
            <div key={annotation.id} className="bg-gray-50 p-2 rounded text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{annotation.type}</span>
                <button
                  onClick={() => removeAnnotation(annotation.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Remove"
                >
                  ×
                </button>
              </div>
              
              {annotation.text && (
                <div className="text-gray-600">
                  "{annotation.text}"
                </div>
              )}
              
              <div className="text-gray-500 text-xs">
                {annotation.points.length} point{annotation.points.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
          
          {state.annotations.length === 0 && (
            <div className="text-gray-500 text-sm italic">
              No annotations yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};