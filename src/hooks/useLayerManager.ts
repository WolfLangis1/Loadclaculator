import { useState, useCallback, useRef, useEffect } from 'react';
import { SLDLayerService } from '../services/sldLayerService';
import type { SLDComponent, SLDDiagram } from '../types/sld';
import type { LayerDefinition, LayerAssignment, LayerManagerOptions, LayerManagerState } from '../types/layer';

/**
 * Professional layer management hook for SLD drawings
 */
export const useLayerManager = (
  diagram: SLDDiagram,
  options: Partial<LayerManagerOptions> = {}
) => {
  const opts: LayerManagerOptions = {
    autoAssignment: true,
    colorByLayer: true,
    showLayerNames: false,
    layerNameSize: 8,
    ...options
  };

  const layerServiceRef = useRef<SLDLayerService>(new SLDLayerService());
  const layerService = layerServiceRef.current;

  const [state, setState] = useState<LayerManagerState>({
    isInitialized: false,
    activeLayerId: 'power_main',
    selectedLayers: new Set(),
    layerVisibility: new Map(),
    componentAssignments: new Map()
  });

  // Initialize layer manager
  useEffect(() => {
    if (!state.isInitialized) {
      // Set up initial layer visibility
      const visibilityMap = new Map<string, boolean>();
      layerService.getAllLayers().forEach(layer => {
        visibilityMap.set(layer.id, layer.visible);
      });

      // Auto-assign existing components if enabled
      if (opts.autoAssignment && diagram.components) {
        const assignmentMap = new Map<string, string>();
        diagram.components.forEach(component => {
          const layerId = layerService.autoAssignComponent(component.id, component.type);
          assignmentMap.set(component.id, layerId);
        });

        setState(prev => ({
          ...prev,
          isInitialized: true,
          layerVisibility: visibilityMap,
          componentAssignments: assignmentMap
        }));
      } else {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          layerVisibility: visibilityMap
        }));
      }
    }
  }, [diagram.components, opts.autoAssignment, state.isInitialized]);

  // Create new layer
  const createLayer = useCallback((layerData: Omit<LayerDefinition, 'id' | 'order'>) => {
    const layerId = `custom_${Date.now()}`;
    const success = layerService.createLayer({
      id: layerId,
      ...layerData
    });

    if (success) {
      setState(prev => ({
        ...prev,
        layerVisibility: new Map(prev.layerVisibility).set(layerId, layerData.visible ?? true)
      }));
      return layerId;
    }
    return null;
  }, []);

  // Update existing layer
  const updateLayer = useCallback((layerId: string, updates: Partial<LayerDefinition>) => {
    const success = layerService.updateLayer(layerId, updates);
    
    if (success && updates.visible !== undefined) {
      setState(prev => ({
        ...prev,
        layerVisibility: new Map(prev.layerVisibility).set(layerId, updates.visible!)
      }));
    }
    
    return success;
  }, []);

  // Delete layer
  const deleteLayer = useCallback((layerId: string) => {
    try {
      const success = layerService.deleteLayer(layerId);
      
      if (success) {
        // Update component assignments that were moved to default layer
        const defaultLayerId = layerService.getActiveLayer()?.id || 'power_main';
        const updatedAssignments = new Map(state.componentAssignments);
        
        for (const [componentId, assignedLayerId] of updatedAssignments.entries()) {
          if (assignedLayerId === layerId) {
            updatedAssignments.set(componentId, defaultLayerId);
          }
        }

        setState(prev => {
          const newVisibility = new Map(prev.layerVisibility);
          newVisibility.delete(layerId);
          
          return {
            ...prev,
            layerVisibility: newVisibility,
            componentAssignments: updatedAssignments
          };
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting layer:', error);
      return false;
    }
  }, [state.componentAssignments]);

  // Set active layer
  const setActiveLayer = useCallback((layerId: string) => {
    const success = layerService.setActiveLayer(layerId);
    
    if (success) {
      setState(prev => ({
        ...prev,
        activeLayerId: layerId
      }));
    }
    
    return success;
  }, []);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    const newVisibility = layerService.toggleLayerVisibility(layerId);
    
    setState(prev => ({
      ...prev,
      layerVisibility: new Map(prev.layerVisibility).set(layerId, newVisibility)
    }));
    
    return newVisibility;
  }, []);

  // Toggle layer lock
  const toggleLayerLock = useCallback((layerId: string) => {
    return layerService.toggleLayerLock(layerId);
  }, []);

  // Assign component to layer
  const assignComponentToLayer = useCallback((componentId: string, layerId: string) => {
    const success = layerService.assignComponentToLayer(componentId, layerId);
    
    if (success) {
      setState(prev => ({
        ...prev,
        componentAssignments: new Map(prev.componentAssignments).set(componentId, layerId)
      }));
    }
    
    return success;
  }, []);

  // Auto-assign component to appropriate layer
  const autoAssignComponent = useCallback((componentId: string, componentType: string) => {
    const layerId = layerService.autoAssignComponent(componentId, componentType);
    
    setState(prev => ({
      ...prev,
      componentAssignments: new Map(prev.componentAssignments).set(componentId, layerId)
    }));
    
    return layerId;
  }, []);

  // Get component layer
  const getComponentLayer = useCallback((componentId: string): LayerDefinition | null => {
    return layerService.getComponentLayer(componentId);
  }, []);

  // Get component effective style
  const getComponentStyle = useCallback((componentId: string) => {
    const style = layerService.getComponentStyle(componentId);
    
    if (!style) return null;

    // Apply layer visibility
    const layerId = state.componentAssignments.get(componentId);
    const isLayerVisible = layerId ? state.layerVisibility.get(layerId) : true;
    
    return {
      ...style,
      visible: style.visible && isLayerVisible
    };
  }, [state.componentAssignments, state.layerVisibility]);

  // Get layer by ID
  const getLayer = useCallback((layerId: string): LayerDefinition | null => {
    return layerService.getAllLayers().find(layer => layer.id === layerId) || null;
  }, []);

  // Get all layers
  const getAllLayers = useCallback((): LayerDefinition[] => {
    return layerService.getAllLayers();
  }, []);

  // Get visible layers
  const getVisibleLayers = useCallback((): LayerDefinition[] => {
    return layerService.getAllLayers().filter(layer => 
      state.layerVisibility.get(layer.id) !== false
    );
  }, [state.layerVisibility]);

  // Get layers by category
  const getLayersByCategory = useCallback((category: LayerDefinition['category']): LayerDefinition[] => {
    return layerService.getLayersByCategory(category);
  }, []);

  // Get layer groups
  const getLayerGroups = useCallback(() => {
    return layerService.getAllLayerGroups();
  }, []);

  // Toggle layer group visibility
  const toggleLayerGroupVisibility = useCallback((groupId: string) => {
    const newVisibility = layerService.toggleLayerGroupVisibility(groupId);
    
    // Update individual layer visibility state
    const group = layerService.getAllLayerGroups().find(g => g.id === groupId);
    if (group) {
      setState(prev => {
        const updatedVisibility = new Map(prev.layerVisibility);
        group.layerIds.forEach(layerId => {
          updatedVisibility.set(layerId, newVisibility);
        });
        return {
          ...prev,
          layerVisibility: updatedVisibility
        };
      });
    }
    
    return newVisibility;
  }, []);

  // Select layers
  const selectLayers = useCallback((layerIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedLayers: new Set(layerIds)
    }));
  }, []);

  // Clear layer selection
  const clearLayerSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedLayers: new Set()
    }));
  }, []);

  // Filter components by layer visibility
  const getVisibleComponents = useCallback((components: SLDComponent[]): SLDComponent[] => {
    return components.filter(component => {
      const style = getComponentStyle(component.id);
      return style?.visible !== false;
    });
  }, [getComponentStyle]);

  // Get layer statistics
  const getLayerStatistics = useCallback(() => {
    return layerService.getLayerStatistics();
  }, []);

  // Export layer configuration
  const exportLayerConfiguration = useCallback(() => {
    return layerService.exportLayerConfiguration();
  }, []);

  // Import layer configuration
  const importLayerConfiguration = useCallback((config: any) => {
    layerService.importLayerConfiguration(config);
    
    // Update state to reflect imported configuration
    const visibilityMap = new Map<string, boolean>();
    layerService.getAllLayers().forEach(layer => {
      visibilityMap.set(layer.id, layer.visible);
    });

    const assignmentMap = new Map<string, string>();
    if (config.assignments) {
      config.assignments.forEach((assignment: LayerAssignment) => {
        assignmentMap.set(assignment.componentId, assignment.layerId);
      });
    }

    setState(prev => ({
      ...prev,
      layerVisibility: visibilityMap,
      componentAssignments: assignmentMap,
      activeLayerId: config.settings?.activeLayerId || prev.activeLayerId
    }));
  }, []);

  // Get printable layers for PDF export
  const getPrintableLayers = useCallback((): LayerDefinition[] => {
    return layerService.getPrintableLayers();
  }, []);

  // Get components on specific layer
  const getComponentsOnLayer = useCallback((layerId: string): string[] => {
    const componentIds: string[] = [];
    for (const [componentId, assignedLayerId] of state.componentAssignments.entries()) {
      if (assignedLayerId === layerId) {
        componentIds.push(componentId);
      }
    }
    return componentIds;
  }, [state.componentAssignments]);

  // Isolate layer (hide all others)
  const isolateLayer = useCallback((layerId: string) => {
    const allLayers = layerService.getAllLayers();
    const updatedVisibility = new Map<string, boolean>();
    
    allLayers.forEach(layer => {
      const visible = layer.id === layerId;
      layerService.updateLayer(layer.id, { visible });
      updatedVisibility.set(layer.id, visible);
    });

    setState(prev => ({
      ...prev,
      layerVisibility: updatedVisibility
    }));
  }, []);

  // Show all layers
  const showAllLayers = useCallback(() => {
    const allLayers = layerService.getAllLayers();
    const updatedVisibility = new Map<string, boolean>();
    
    allLayers.forEach(layer => {
      layerService.updateLayer(layer.id, { visible: true });
      updatedVisibility.set(layer.id, true);
    });

    setState(prev => ({
      ...prev,
      layerVisibility: updatedVisibility
    }));
  }, []);

  return {
    // State
    isInitialized: state.isInitialized,
    activeLayerId: state.activeLayerId,
    selectedLayers: state.selectedLayers,
    componentAssignments: state.componentAssignments,

    // Layer management
    createLayer,
    updateLayer,
    deleteLayer,
    getLayer,
    getAllLayers,
    getVisibleLayers,
    getLayersByCategory,

    // Layer groups
    getLayerGroups,
    toggleLayerGroupVisibility,

    // Layer state
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    isolateLayer,
    showAllLayers,

    // Component assignment
    assignComponentToLayer,
    autoAssignComponent,
    getComponentLayer,
    getComponentStyle,
    getComponentsOnLayer,
    getVisibleComponents,

    // Layer selection
    selectLayers,
    clearLayerSelection,

    // Utilities
    getLayerStatistics,
    getPrintableLayers,
    exportLayerConfiguration,
    importLayerConfiguration,

    // Service reference for advanced usage
    layerService
  };
};

export default useLayerManager;