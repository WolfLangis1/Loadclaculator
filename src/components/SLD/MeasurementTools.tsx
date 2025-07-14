import React, { useState, useCallback, useRef } from 'react';
import { 
  Ruler, 
  Move3D, 
  Square, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Settings,
  Target,
  Grid3X3,
  Calculator
} from 'lucide-react';
import type { 
  SLDMeasurementService, 
  Measurement, 
  Point, 
  MeasurementSettings,
  MeasurementUnit
} from '../../services/sldMeasurementService';

interface MeasurementToolsProps {
  measurementService: SLDMeasurementService;
  onMeasurementChange?: () => void;
  canvasRef: React.RefObject<SVGSVGElement>;
  transform: { x: number; y: number; zoom: number };
  className?: string;
}

type MeasurementMode = 'none' | 'linear' | 'angular' | 'area' | 'coordinate';

interface MeasurementState {
  mode: MeasurementMode;
  isDrawing: boolean;
  currentPoints: Point[];
  tempMeasurement: string | null;
  selectedMeasurement: string | null;
}

export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  measurementService,
  onMeasurementChange,
  canvasRef,
  transform,
  className = ''
}) => {
  const [state, setState] = useState<MeasurementState>({
    mode: 'none',
    isDrawing: false,
    currentPoints: [],
    tempMeasurement: null,
    selectedMeasurement: null
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showMeasurementList, setShowMeasurementList] = useState(true);

  const measurements = measurementService.getAllMeasurements();
  const visibleMeasurements = measurementService.getVisibleMeasurements();
  const settings = measurementService.getSettings();
  const statistics = measurementService.getMeasurementStatistics();

  /**
   * Convert screen coordinates to logical coordinates
   */
  const screenToLogical = useCallback((screenPoint: Point): Point => {
    if (!canvasRef.current) return screenPoint;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenPoint.x - rect.left - transform.x) / transform.zoom,
      y: (screenPoint.y - rect.top - transform.y) / transform.zoom
    };
  }, [canvasRef, transform]);

  /**
   * Convert logical coordinates to screen coordinates
   */
  const logicalToScreen = useCallback((logicalPoint: Point): Point => {
    if (!canvasRef.current) return logicalPoint;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: logicalPoint.x * transform.zoom + transform.x + rect.left,
      y: logicalPoint.y * transform.zoom + transform.y + rect.top
    };
  }, [canvasRef, transform]);

  /**
   * Handle canvas click for measurement creation
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (state.mode === 'none') return;

    const screenPoint = { x: event.clientX, y: event.clientY };
    const logicalPoint = screenToLogical(screenPoint);

    setState(prev => {
      const newPoints = [...prev.currentPoints, logicalPoint];

      switch (prev.mode) {
        case 'linear':
          if (newPoints.length === 2) {
            const measurementId = measurementService.createLinearMeasurement(
              newPoints[0],
              newPoints[1]
            );
            onMeasurementChange?.();
            return {
              ...prev,
              isDrawing: false,
              currentPoints: [],
              tempMeasurement: null,
              mode: 'none'
            };
          }
          return { ...prev, currentPoints: newPoints, isDrawing: true };

        case 'angular':
          if (newPoints.length === 3) {
            const measurementId = measurementService.createAngularMeasurement(
              newPoints[1], // Center point is second click
              newPoints[0],
              newPoints[2]
            );
            onMeasurementChange?.();
            return {
              ...prev,
              isDrawing: false,
              currentPoints: [],
              tempMeasurement: null,
              mode: 'none'
            };
          }
          return { ...prev, currentPoints: newPoints, isDrawing: true };

        case 'coordinate':
          const measurementId = measurementService.createCoordinateMeasurement(logicalPoint);
          onMeasurementChange?.();
          return {
            ...prev,
            isDrawing: false,
            currentPoints: [],
            tempMeasurement: null,
            mode: 'none'
          };

        case 'area':
          return { ...prev, currentPoints: newPoints, isDrawing: true };

        default:
          return prev;
      }
    });
  }, [state.mode, screenToLogical, measurementService, onMeasurementChange]);

  /**
   * Handle area measurement completion (double-click or Enter)
   */
  const completeAreaMeasurement = useCallback(() => {
    if (state.mode === 'area' && state.currentPoints.length >= 3) {
      const measurementId = measurementService.createAreaMeasurement(state.currentPoints);
      onMeasurementChange?.();
      setState(prev => ({
        ...prev,
        isDrawing: false,
        currentPoints: [],
        tempMeasurement: null,
        mode: 'none'
      }));
    }
  }, [state.mode, state.currentPoints, measurementService, onMeasurementChange]);

  /**
   * Cancel current measurement
   */
  const cancelMeasurement = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawing: false,
      currentPoints: [],
      tempMeasurement: null,
      mode: 'none'
    }));
  }, []);

  /**
   * Set measurement mode
   */
  const setMeasurementMode = useCallback((mode: MeasurementMode) => {
    if (state.isDrawing) {
      cancelMeasurement();
    }
    setState(prev => ({ ...prev, mode }));
  }, [state.isDrawing, cancelMeasurement]);

  /**
   * Delete measurement
   */
  const deleteMeasurement = useCallback((id: string) => {
    if (measurementService.deleteMeasurement(id)) {
      onMeasurementChange?.();
    }
  }, [measurementService, onMeasurementChange]);

  /**
   * Toggle measurement visibility
   */
  const toggleMeasurementVisibility = useCallback((id: string) => {
    measurementService.toggleVisibility(id);
    onMeasurementChange?.();
  }, [measurementService, onMeasurementChange]);

  /**
   * Toggle measurement lock
   */
  const toggleMeasurementLock = useCallback((id: string) => {
    measurementService.toggleLock(id);
    onMeasurementChange?.();
  }, [measurementService, onMeasurementChange]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Measurements</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Measurement settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setShowMeasurementList(!showMeasurementList)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Toggle measurement list"
          >
            <Calculator size={16} />
          </button>
        </div>
      </div>

      {/* Measurement Tools */}
      <div className="p-3 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMeasurementMode('linear')}
            className={`
              flex items-center gap-2 p-2 rounded text-sm
              ${state.mode === 'linear' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
            `}
            title="Linear distance measurement"
          >
            <Ruler size={16} />
            Linear
          </button>

          <button
            onClick={() => setMeasurementMode('angular')}
            className={`
              flex items-center gap-2 p-2 rounded text-sm
              ${state.mode === 'angular' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
            `}
            title="Angular measurement"
          >
            <RotateCcw size={16} />
            Angular
          </button>

          <button
            onClick={() => setMeasurementMode('area')}
            className={`
              flex items-center gap-2 p-2 rounded text-sm
              ${state.mode === 'area' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
            `}
            title="Area and perimeter measurement"
          >
            <Square size={16} />
            Area
          </button>

          <button
            onClick={() => setMeasurementMode('coordinate')}
            className={`
              flex items-center gap-2 p-2 rounded text-sm
              ${state.mode === 'coordinate' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
            `}
            title="Coordinate measurement"
          >
            <Target size={16} />
            Coord
          </button>
        </div>

        {/* Active Mode Instructions */}
        {state.mode !== 'none' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
            {state.mode === 'linear' && 'Click two points to measure distance'}
            {state.mode === 'angular' && 'Click start point, center point, then end point'}
            {state.mode === 'area' && 'Click points to define area. Double-click to finish.'}
            {state.mode === 'coordinate' && 'Click to place coordinate marker'}
            <button
              onClick={cancelMeasurement}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Area completion button */}
        {state.mode === 'area' && state.currentPoints.length >= 3 && (
          <button
            onClick={completeAreaMeasurement}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Complete Area ({state.currentPoints.length} points)
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="p-3 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>Total: {statistics.totalMeasurements}</div>
            <div>Visible: {visibleMeasurements.length}</div>
            <div>Distance: {statistics.totalDistance.toFixed(2)}px</div>
            <div>Area: {statistics.totalArea.toFixed(2)}px²</div>
          </div>
        </div>
      </div>

      {/* Measurement List */}
      {showMeasurementList && (
        <div className="p-3 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {measurements.map(measurement => (
              <MeasurementItem
                key={measurement.id}
                measurement={measurement}
                isSelected={state.selectedMeasurement === measurement.id}
                onSelect={(id) => setState(prev => ({ ...prev, selectedMeasurement: id }))}
                onToggleVisibility={() => toggleMeasurementVisibility(measurement.id)}
                onToggleLock={() => toggleMeasurementLock(measurement.id)}
                onDelete={() => deleteMeasurement(measurement.id)}
              />
            ))}
            
            {measurements.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No measurements yet. Use the tools above to start measuring.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <MeasurementSettings
          settings={settings}
          measurementService={measurementService}
          onClose={() => setShowSettings(false)}
          onUpdate={onMeasurementChange}
        />
      )}

      {/* Canvas Event Handler */}
      {state.mode !== 'none' && canvasRef.current && (
        <div
          className="fixed inset-0 z-50"
          style={{ pointerEvents: 'auto' }}
          onClick={handleCanvasClick}
          onDoubleClick={state.mode === 'area' ? completeAreaMeasurement : undefined}
        />
      )}
    </div>
  );
};

interface MeasurementItemProps {
  measurement: Measurement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}

const MeasurementItem: React.FC<MeasurementItemProps> = ({
  measurement,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete
}) => {
  const getTypeIcon = () => {
    switch (measurement.type) {
      case 'linear': return <Ruler size={14} />;
      case 'angular': return <RotateCcw size={14} />;
      case 'area': return <Square size={14} />;
      case 'coordinate': return <Target size={14} />;
    }
  };

  const getDisplayValue = () => {
    switch (measurement.type) {
      case 'linear': return measurement.displayDistance;
      case 'angular': return measurement.displayAngle;
      case 'area': return `${measurement.displayArea} (${measurement.displayPerimeter})`;
      case 'coordinate': return `(${measurement.displayX}, ${measurement.displayY})`;
    }
  };

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded cursor-pointer text-sm
        ${isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}
        ${!measurement.visible ? 'opacity-50' : ''}
      `}
      onClick={() => onSelect(measurement.id)}
    >
      {/* Type Icon */}
      <div
        className="p-1 rounded"
        style={{ color: measurement.style.color }}
      >
        {getTypeIcon()}
      </div>

      {/* Measurement Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {measurement.label || `${measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}`}
        </div>
        <div className="text-xs text-gray-600 truncate">
          {getDisplayValue()}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-0.5 hover:bg-gray-200 rounded"
          title={measurement.visible ? 'Hide' : 'Show'}
        >
          {measurement.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-0.5 hover:bg-gray-200 rounded"
          title={measurement.locked ? 'Unlock' : 'Lock'}
        >
          {measurement.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this measurement?')) {
              onDelete();
            }
          }}
          className="p-0.5 hover:bg-red-100 rounded text-red-600"
          title="Delete measurement"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

interface MeasurementSettingsProps {
  settings: MeasurementSettings;
  measurementService: SLDMeasurementService;
  onClose: () => void;
  onUpdate?: () => void;
}

const MeasurementSettings: React.FC<MeasurementSettingsProps> = ({
  settings,
  measurementService,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState(settings);
  const lengthUnits = measurementService.getUnitsByCategory('length');

  const handleSave = () => {
    measurementService.updateSettings(formData);
    onUpdate?.();
    onClose();
  };

  return (
    <div className="border-t border-gray-200 p-3 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-3">Measurement Settings</h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Unit
          </label>
          <select
            value={formData.defaultUnit}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultUnit: e.target.value }))}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          >
            {lengthUnits.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precision (decimal places)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={formData.precision}
            onChange={(e) => setFormData(prev => ({ ...prev, precision: parseInt(e.target.value) }))}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.snapToGrid}
              onChange={(e) => setFormData(prev => ({ ...prev, snapToGrid: e.target.checked }))}
              className="rounded"
            />
            <Grid3X3 size={14} />
            Snap to grid
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.showCoordinates}
              onChange={(e) => setFormData(prev => ({ ...prev, showCoordinates: e.target.checked }))}
              className="rounded"
            />
            <Target size={14} />
            Show coordinates
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.realTimeUpdate}
              onChange={(e) => setFormData(prev => ({ ...prev, realTimeUpdate: e.target.checked }))}
              className="rounded"
            />
            Real-time updates
          </label>
        </div>

        {formData.snapToGrid && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grid Size (pixels)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.gridSize}
              onChange={(e) => setFormData(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default MeasurementTools;