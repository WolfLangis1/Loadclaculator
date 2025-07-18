import React, { useState } from 'react';
import { 
  Minus, 
  Circle, 
  Square, 
  Trash2, 
  Undo, 
  Redo,
  Palette,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import type { AnnotationStyle } from './AnnotationOverlay';

type AnnotationTool = 'select' | 'line' | 'circle' | 'square' | 'polyline' | 'delete';

interface AnnotationToolsProps {
  currentTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  annotationsVisible: boolean;
  onToggleVisibility: () => void;
  currentStyle: AnnotationStyle;
  onStyleChange: (style: Partial<AnnotationStyle>) => void;
}

export const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  canUndo,
  canRedo,
  annotationsVisible,
  onToggleVisibility,
  currentStyle,
  onStyleChange
}) => {
  const [showStylePanel, setShowStylePanel] = useState(false);

  const tools = [
    { id: 'line' as const, icon: Minus, label: 'Line', shortcut: 'L' },
    { id: 'polyline' as const, icon: Minus, label: 'Multi-Line', shortcut: 'M' },
    { id: 'circle' as const, icon: Circle, label: 'Circle', shortcut: 'C' },
    { id: 'square' as const, icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'delete' as const, icon: Trash2, label: 'Delete', shortcut: 'D' }
  ];

  const colors = [
    '#ff0000', // red
    '#00ff00', // green
    '#0000ff', // blue
    '#ffff00', // yellow
    '#ff00ff', // magenta
    '#00ffff', // cyan
    '#ffffff', // white
    '#000000'  // black
  ];


  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Palette className="h-5 w-5 text-blue-600" />
          Annotation Tools
        </h4>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleVisibility}
            className={`p-2 rounded-lg ${
              annotationsVisible 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600'
            } hover:bg-blue-200`}
            title="Toggle annotation visibility"
          >
            {annotationsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Drawing Tools */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg text-sm font-medium transition-colors ${
                currentTool === tool.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Style Controls */}
      <div className="border-t pt-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Style</span>
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showStylePanel ? 'Hide' : 'Show'}
          </button>
        </div>

        {showStylePanel && (
          <div className="space-y-3">
            {/* Color Selection */}
            <div>
              <label className="text-xs text-gray-600 block mb-1">Color</label>
              <div className="flex flex-wrap gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onStyleChange({ stroke: color })}
                    className={`w-6 h-6 rounded border-2 ${
                      currentStyle.stroke === color 
                        ? 'border-gray-900' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Width: {currentStyle.strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentStyle.strokeWidth}
                onChange={(e) => onStyleChange({ strokeWidth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Opacity */}
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Opacity: {Math.round(currentStyle.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={currentStyle.opacity}
                onChange={(e) => onStyleChange({ opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-3 w-3" />
          Undo
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-3 w-3" />
          Redo
        </button>
        
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          title="Clear all annotations"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
        
        <button
          onClick={onSave}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          title="Save annotations"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 border-t pt-2">
        {currentTool === 'line' && 'Click two points to draw a line'}
        {currentTool === 'polyline' && 'Click multiple points to draw a multi-line. Double-click to finish.'}
        {currentTool === 'circle' && 'Click center, then drag to set radius'}
        {currentTool === 'square' && 'Click and drag to draw a rectangle'}
        {currentTool === 'delete' && 'Click on annotations to delete them'}
        {currentTool === 'select' && 'Click to select and edit annotations'}
      </div>
    </div>
  );
};