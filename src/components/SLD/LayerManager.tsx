/**
 * Layer Manager Component - Professional CAD-style layer management
 * 
 * Provides layer visibility, locking, and organization for electrical drawings
 * Based on professional CAD software patterns
 */

import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Move, 
  Palette,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export interface DrawingLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  lineWeight: number;
  lineType: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  componentIds: string[];
  category: 'electrical' | 'structural' | 'architectural' | 'annotations' | 'dimensions' | 'grids';
}

interface LayerManagerProps {
  layers: DrawingLayer[];
  onLayerUpdate: (layerId: string, updates: Partial<DrawingLayer>) => void;
  onLayerAdd: (layer: Omit<DrawingLayer, 'id'>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
  activeLayerId?: string;
  onActiveLayerChange: (layerId: string) => void;
}

const DEFAULT_LAYERS: Omit<DrawingLayer, 'id' | 'componentIds'>[] = [
  {
    name: 'Power Distribution',
    color: '#DC2626',
    visible: true,
    locked: false,
    lineWeight: 2,
    lineType: 'solid',
    opacity: 1,
    category: 'electrical'
  },
  {
    name: 'Control Circuits',
    color: '#2563EB',
    visible: true,
    locked: false,
    lineWeight: 1,
    lineType: 'dashed',
    opacity: 1,
    category: 'electrical'
  },
  {
    name: 'Grounding',
    color: '#059669',
    visible: true,
    locked: false,
    lineWeight: 2,
    lineType: 'solid',
    opacity: 1,
    category: 'electrical'
  },
  {
    name: 'Equipment',
    color: '#7C3AED',
    visible: true,
    locked: false,
    lineWeight: 2,
    lineType: 'solid',
    opacity: 1,
    category: 'electrical'
  },
  {
    name: 'Annotations',
    color: '#374151',
    visible: true,
    locked: false,
    lineWeight: 1,
    lineType: 'solid',
    opacity: 1,
    category: 'annotations'
  },
  {
    name: 'Grid',
    color: '#D1D5DB',
    visible: true,
    locked: true,
    lineWeight: 0.5,
    lineType: 'dotted',
    opacity: 0.3,
    category: 'grids'
  }
];

const LAYER_COLORS = [
  '#DC2626', '#2563EB', '#059669', '#7C3AED', '#EA580C', '#0891B2',
  '#9333EA', '#C2410C', '#15803D', '#1D4ED8', '#BE185D', '#374151'
];

const LINE_WEIGHTS = [0.5, 1, 1.5, 2, 2.5, 3];

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  onLayerUpdate,
  onLayerAdd,
  onLayerDelete,
  onLayerReorder,
  activeLayerId,
  onActiveLayerChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddLayer, setShowAddLayer] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState(LAYER_COLORS[0]);

  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      onLayerUpdate(layerId, { visible: !layer.visible });
    }
  };

  const toggleLayerLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      onLayerUpdate(layerId, { locked: !layer.locked });
    }
  };

  const addNewLayer = () => {
    if (newLayerName.trim()) {
      const newLayer: Omit<DrawingLayer, 'id'> = {
        name: newLayerName.trim(),
        color: newLayerColor,
        visible: true,
        locked: false,
        lineWeight: 1,
        lineType: 'solid',
        opacity: 1,
        componentIds: [],
        category: 'electrical'
      };
      onLayerAdd(newLayer);
      setNewLayerName('');
      setShowAddLayer(false);
    }
  };

  const groupedLayers = layers.reduce((acc, layer) => {
    if (!acc[layer.category]) {
      acc[layer.category] = [];
    }
    acc[layer.category].push(layer);
    return acc;
  }, {} as Record<string, DrawingLayer[]>);

  if (!isExpanded) {
    return (
      <div className="w-8 bg-white border-r border-gray-200 p-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-1 text-gray-500 hover:text-gray-700"
          title="Show Layer Manager"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Move className="h-4 w-4" />
            Layers
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddLayer(!showAddLayer)}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add Layer"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Hide Layer Manager"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Add New Layer */}
        {showAddLayer && (
          <div className="mt-3 p-2 bg-gray-50 rounded border">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Layer name"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                onKeyPress={(e) => e.key === 'Enter' && addNewLayer()}
              />
              <div className="flex items-center gap-2">
                <select
                  value={newLayerColor}
                  onChange={(e) => setNewLayerColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  {LAYER_COLORS.map(color => (
                    <option key={color} value={color} style={{ backgroundColor: color }}>
                      {color}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addNewLayer}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedLayers).map(([category, categoryLayers]) => (
          <div key={category} className="border-b border-gray-100">
            <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wider">
              {category.replace('_', ' ')} ({categoryLayers.length})
            </div>
            
            {categoryLayers.map((layer) => (
              <div
                key={layer.id}
                className={`px-3 py-2 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                  activeLayerId === layer.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onActiveLayerChange(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Color Indicator */}
                    <div
                      className="w-3 h-3 rounded border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    
                    {/* Layer Name */}
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {layer.name}
                    </div>
                    
                    {/* Component Count */}
                    {layer.componentIds.length > 0 && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                        {layer.componentIds.length}
                      </div>
                    )}
                  </div>

                  {/* Layer Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className={`p-1 rounded ${
                        layer.visible ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400'
                      }`}
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer.id);
                      }}
                      className={`p-1 rounded ${
                        layer.locked ? 'text-red-600 hover:text-red-800' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>

                    {layer.category !== 'grids' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerDelete(layer.id);
                        }}
                        className="p-1 rounded text-gray-400 hover:text-red-600"
                        title="Delete Layer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Layer Properties */}
                {activeLayerId === layer.id && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-gray-600 mb-1">Color</label>
                        <input
                          type="color"
                          value={layer.color}
                          onChange={(e) => onLayerUpdate(layer.id, { color: e.target.value })}
                          className="w-full h-6 rounded border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Weight</label>
                        <select
                          value={layer.lineWeight}
                          onChange={(e) => onLayerUpdate(layer.id, { lineWeight: parseFloat(e.target.value) })}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                        >
                          {LINE_WEIGHTS.map(weight => (
                            <option key={weight} value={weight}>{weight}px</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-gray-600 mb-1">Line Type</label>
                        <select
                          value={layer.lineType}
                          onChange={(e) => onLayerUpdate(layer.id, { lineType: e.target.value as any })}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Opacity</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={layer.opacity}
                          onChange={(e) => onLayerUpdate(layer.id, { opacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-medium">Professional Layers</div>
          <div>CAD-style organization</div>
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_LAYERS };
export default LayerManager;