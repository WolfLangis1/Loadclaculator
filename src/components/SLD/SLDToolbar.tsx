/**
 * SLD Drawing Toolbar Component
 * 
 * Provides selection, drawing, and editing tools for the SLD canvas
 */

import React from 'react';
import { 
  MousePointer, 
  Move,
  RotateCw,
  Copy,
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Hand,
  Square,
  Circle,
  Minus,
  Type,
  Grid,
  Layers,
  Save,
  Download
} from 'lucide-react';

export type ToolType = 
  | 'select' 
  | 'pan' 
  | 'move'
  | 'rotate'
  | 'copy'
  | 'delete'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'rubber-band';

interface SLDToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  onExport: () => void;
  onToggleGrid: () => void;
  onToggleLayers: () => void;
  canUndo: boolean;
  canRedo: boolean;
  gridVisible: boolean;
  layersVisible: boolean;
  className?: string;
}

const toolGroups = [
  {
    name: 'Selection Tools',
    tools: [
      { id: 'select' as ToolType, icon: MousePointer, label: 'Select', shortcut: 'V' },
      { id: 'rubber-band' as ToolType, icon: Square, label: 'Rubber Band Select', shortcut: 'R' },
      { id: 'pan' as ToolType, icon: Hand, label: 'Pan', shortcut: 'H' },
    ]
  },
  {
    name: 'Edit Tools',
    tools: [
      { id: 'move' as ToolType, icon: Move, label: 'Move', shortcut: 'M' },
      { id: 'rotate' as ToolType, icon: RotateCw, label: 'Rotate', shortcut: 'R' },
      { id: 'copy' as ToolType, icon: Copy, label: 'Copy', shortcut: 'C' },
      { id: 'delete' as ToolType, icon: Trash2, label: 'Delete', shortcut: 'Del' },
    ]
  },
  {
    name: 'Drawing Tools',
    tools: [
      { id: 'line' as ToolType, icon: Minus, label: 'Line/Wire', shortcut: 'L' },
      { id: 'rectangle' as ToolType, icon: Square, label: 'Rectangle', shortcut: 'U' },
      { id: 'circle' as ToolType, icon: Circle, label: 'Circle', shortcut: 'O' },
      { id: 'text' as ToolType, icon: Type, label: 'Text', shortcut: 'T' },
    ]
  }
];

const actionButtons = [
  { id: 'undo', icon: Undo, label: 'Undo', shortcut: 'Ctrl+Z' },
  { id: 'redo', icon: Redo, label: 'Redo', shortcut: 'Ctrl+Y' },
];

const viewButtons = [
  { id: 'zoom-in', icon: ZoomIn, label: 'Zoom In', shortcut: '+' },
  { id: 'zoom-out', icon: ZoomOut, label: 'Zoom Out', shortcut: '-' },
  { id: 'grid', icon: Grid, label: 'Toggle Grid', shortcut: 'G' },
  { id: 'layers', icon: Layers, label: 'Toggle Layers', shortcut: 'L' },
];

const fileButtons = [
  { id: 'save', icon: Save, label: 'Save Diagram', shortcut: 'Ctrl+S' },
  { id: 'export', icon: Download, label: 'Export', shortcut: 'Ctrl+E' },
];

export const SLDToolbar: React.FC<SLDToolbarProps> = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onSave,
  onExport,
  onToggleGrid,
  onToggleLayers,
  canUndo,
  canRedo,
  gridVisible,
  layersVisible,
  className = ''
}) => {
  const getButtonClass = (isActive: boolean, disabled: boolean = false) => {
    if (disabled) {
      return 'p-2 rounded text-gray-400 cursor-not-allowed';
    }
    if (isActive) {
      return 'p-2 rounded bg-blue-500 text-white shadow-md';
    }
    return 'p-2 rounded text-gray-700 hover:bg-gray-100 transition-colors';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-2">
        {toolGroups.map((group, groupIndex) => (
          <React.Fragment key={group.name}>
            {groupIndex > 0 && <div className="w-px h-8 bg-gray-300 mx-1" />}
            <div className="flex items-center gap-1">
              {group.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onToolChange(tool.id)}
                    className={getButtonClass(activeTool === tool.id)}
                    title={`${tool.label} (${tool.shortcut})`}
                    aria-label={tool.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}

        <div className="w-px h-8 bg-gray-300 mx-1" />
        <div className="flex items-center gap-1">
          {actionButtons.map((button) => {
            const Icon = button.icon;
            return (
              <button
                key={button.id}
                onClick={button.id === 'undo' ? onUndo : onRedo}
                disabled={button.id === 'undo' ? !canUndo : !canRedo}
                className={getButtonClass(false, button.id === 'undo' ? !canUndo : !canRedo)}
                title={`${button.label} (${button.shortcut})`}
                aria-label={button.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1" />
        <div className="flex items-center gap-1">
          {viewButtons.map((button) => {
            const Icon = button.icon;
            return (
              <button
                key={button.id}
                onClick={button.id === 'zoom-in' ? onZoomIn : button.id === 'zoom-out' ? onZoomOut : button.id === 'grid' ? onToggleGrid : onToggleLayers}
                className={getButtonClass(button.id === 'grid' ? gridVisible : button.id === 'layers' ? layersVisible : false)}
                title={`${button.label} (${button.shortcut})`}
                aria-label={button.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1" />
        <div className="flex items-center gap-1">
          {fileButtons.map((button) => {
            const Icon = button.icon;
            return (
              <button
                key={button.id}
                onClick={button.id === 'save' ? onSave : onExport}
                className={getButtonClass(false)}
                title={`${button.label} (${button.shortcut})`}
                aria-label={button.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        Active Tool: <span className="font-medium capitalize">{activeTool.replace('-', ' ')}</span>
        {activeTool === 'select' && ' - Click to select components, drag to move'}
        {activeTool === 'rubber-band' && ' - Drag to select multiple components'}
        {activeTool === 'pan' && ' - Drag to pan the canvas'}
        {activeTool === 'line' && ' - Click and drag to draw wires'}
        {activeTool === 'delete' && ' - Click components to delete them'}
      </div>
    </div>
  );
};

export default SLDToolbar;