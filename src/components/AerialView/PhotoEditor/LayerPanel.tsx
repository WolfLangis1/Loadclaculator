import React, { useCallback } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { usePhotoEditor } from '../../../context/PhotoEditorContext';
import type { EditorLayer } from '../../../context/PhotoEditorContext';

export const LayerPanel: React.FC = () => {
  const {
    state,
    addLayer,
    removeLayer,
    updateLayer,
    setActiveLayer,
    reorderLayer
  } = usePhotoEditor();

  const handleAddLayer = useCallback(() => {
    const newLayer: EditorLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${state.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      type: 'overlay',
      zIndex: Math.max(...state.layers.map(l => l.zIndex), 0) + 1
    };
    addLayer(newLayer);
    setActiveLayer(newLayer.id);
  }, [state.layers, addLayer, setActiveLayer]);

  const handleToggleVisibility = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  }, [state.layers, updateLayer]);

  const handleToggleLock = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  }, [state.layers, updateLayer]);

  const handleRemoveLayer = useCallback((layerId: string) => {
    // Don't allow removing the photo layer
    if (layerId === 'photo-layer') return;
    removeLayer(layerId);
  }, [removeLayer]);

  const handleMoveLayerUp = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      const newZIndex = layer.zIndex + 1;
      // Check if another layer has this zIndex
      const conflictLayer = state.layers.find(l => l.zIndex === newZIndex);
      if (conflictLayer) {
        updateLayer(conflictLayer.id, { zIndex: layer.zIndex });
      }
      reorderLayer(layerId, newZIndex);
    }
  }, [state.layers, updateLayer, reorderLayer]);

  const handleMoveLayerDown = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer && layer.zIndex > 0) {
      const newZIndex = layer.zIndex - 1;
      // Check if another layer has this zIndex
      const conflictLayer = state.layers.find(l => l.zIndex === newZIndex);
      if (conflictLayer) {
        updateLayer(conflictLayer.id, { zIndex: layer.zIndex });
      }
      reorderLayer(layerId, newZIndex);
    }
  }, [state.layers, updateLayer, reorderLayer]);

  const getLayerIcon = (type: EditorLayer['type']) => {
    switch (type) {
      case 'photo': return '🖼️';
      case 'measurement': return '📏';
      case 'annotation': return '✏️';
      case 'overlay': return '📄';
      default: return '📄';
    }
  };

  // Sort layers by zIndex (highest first for display)
  const sortedLayers = [...state.layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Layers</h3>
          <button
            onClick={handleAddLayer}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Add Layer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            className={`group flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
              state.activeLayerId === layer.id ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            onClick={() => setActiveLayer(layer.id)}
          >
            {/* Layer icon and name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm">{getLayerIcon(layer.type)}</span>
              <span className={`text-sm truncate ${
                state.activeLayerId === layer.id ? 'font-medium text-blue-900' : 'text-gray-700'
              }`}>
                {layer.name}
              </span>
            </div>

            {/* Layer controls */}
            <div className="flex items-center gap-1">
              {/* Move up/down */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveLayerUp(layer.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                title="Move Up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveLayerDown(layer.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                title="Move Down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(layer.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLock(layer.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </button>

              {/* Delete layer (not for photo layer) */}
              {layer.id !== 'photo-layer' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveLayer(layer.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                  title="Delete Layer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selection info */}
      {state.selectedElementIds.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            Selected: {state.selectedElementIds.length} element{state.selectedElementIds.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};