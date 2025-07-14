/**
 * Multi-Layer Drawing Organization System
 * 
 * Provides professional CAD-style layer management for organizing different
 * electrical systems on separate layers with visibility controls, color coding,
 * and printing options.
 */

export interface LayerDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  strokeWidth: number;
  visible: boolean;
  locked: boolean;
  printable: boolean;
  opacity: number;
  lineType: 'solid' | 'dashed' | 'dotted' | 'dashdot';
  category: 'power' | 'control' | 'communication' | 'safety' | 'grounding' | 'annotation' | 'dimension' | 'custom';
  order: number; // Z-order for rendering
}

export interface LayerAssignment {
  componentId: string;
  layerId: string;
  overrideColor?: string;
  overrideStroke?: number;
  overrideOpacity?: number;
}

export interface LayerGroup {
  id: string;
  name: string;
  description: string;
  layerIds: string[];
  visible: boolean;
  collapsed: boolean;
}

export interface LayerSettings {
  activeLayerId: string;
  defaultLayer: string;
  autoAssignment: boolean;
  colorByLayer: boolean;
  showLayerNames: boolean;
  layerNameSize: number;
}

export class SLDLayerService {
  private layers: Map<string, LayerDefinition> = new Map();
  private layerGroups: Map<string, LayerGroup> = new Map();
  private componentAssignments: Map<string, LayerAssignment> = new Map();
  private settings: LayerSettings;

  constructor() {
    this.settings = {
      activeLayerId: 'power_main',
      defaultLayer: 'power_main',
      autoAssignment: true,
      colorByLayer: true,
      showLayerNames: false,
      layerNameSize: 8
    };

    this.initializeStandardLayers();
    this.initializeLayerGroups();
  }

  /**
   * Initialize IEEE standard electrical drawing layers
   */
  private initializeStandardLayers(): void {
    const standardLayers: LayerDefinition[] = [
      // Power Distribution Layers
      {
        id: 'power_main',
        name: 'Main Power',
        description: 'Main service entrance and primary distribution',
        color: '#dc2626', // Red
        strokeWidth: 3,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'power',
        order: 10
      },
      {
        id: 'power_branch',
        name: 'Branch Circuits',
        description: 'Branch circuit distribution and loads',
        color: '#ea580c', // Orange
        strokeWidth: 2,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'power',
        order: 9
      },
      {
        id: 'power_emergency',
        name: 'Emergency Power',
        description: 'Generator, UPS, and emergency circuits',
        color: '#dc2626', // Red
        strokeWidth: 2,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'dashed',
        category: 'power',
        order: 8
      },

      // Control System Layers
      {
        id: 'control_logic',
        name: 'Control Logic',
        description: 'Control circuits and logic diagrams',
        color: '#2563eb', // Blue
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'control',
        order: 7
      },
      {
        id: 'control_instrumentation',
        name: 'Instrumentation',
        description: 'Meters, sensors, and monitoring devices',
        color: '#7c3aed', // Purple
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'control',
        order: 6
      },

      // Communication Layers
      {
        id: 'comm_data',
        name: 'Data/Network',
        description: 'Ethernet, fiber optic, and data communications',
        color: '#059669', // Green
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'dotted',
        category: 'communication',
        order: 5
      },
      {
        id: 'comm_wireless',
        name: 'Wireless',
        description: 'WiFi, cellular, and wireless communications',
        color: '#0891b2', // Cyan
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 0.8,
        lineType: 'dashdot',
        category: 'communication',
        order: 4
      },

      // Safety System Layers
      {
        id: 'safety_fire',
        name: 'Fire Safety',
        description: 'Fire alarm, suppression, and detection systems',
        color: '#dc2626', // Red
        strokeWidth: 2,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'dashdot',
        category: 'safety',
        order: 8
      },
      {
        id: 'safety_security',
        name: 'Security',
        description: 'Access control, surveillance, and intrusion detection',
        color: '#7c2d12', // Brown
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'dashed',
        category: 'safety',
        order: 7
      },

      // Grounding and Bonding
      {
        id: 'grounding_main',
        name: 'Grounding System',
        description: 'Equipment grounding and grounding electrode system',
        color: '#166534', // Dark Green
        strokeWidth: 2,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'grounding',
        order: 3
      },
      {
        id: 'grounding_lightning',
        name: 'Lightning Protection',
        description: 'Lightning rods, surge protection, and bonding',
        color: '#facc15', // Yellow
        strokeWidth: 2,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'dashed',
        category: 'grounding',
        order: 2
      },

      // Annotation and Documentation
      {
        id: 'annotation_text',
        name: 'Text & Labels',
        description: 'Component labels, notes, and text annotations',
        color: '#1f2937', // Dark Gray
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'annotation',
        order: 15
      },
      {
        id: 'annotation_symbols',
        name: 'Symbols & Tags',
        description: 'Reference symbols, tags, and callouts',
        color: '#374151', // Gray
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 1.0,
        lineType: 'solid',
        category: 'annotation',
        order: 14
      },

      // Dimensioning
      {
        id: 'dimension_linear',
        name: 'Linear Dimensions',
        description: 'Length, width, and distance dimensions',
        color: '#6b7280', // Gray
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 0.8,
        lineType: 'solid',
        category: 'dimension',
        order: 13
      },
      {
        id: 'dimension_angular',
        name: 'Angular Dimensions',
        description: 'Angle and arc dimensions',
        color: '#9ca3af', // Light Gray
        strokeWidth: 1,
        visible: true,
        locked: false,
        printable: true,
        opacity: 0.8,
        lineType: 'solid',
        category: 'dimension',
        order: 12
      },

      // Construction and Reference
      {
        id: 'construction_grid',
        name: 'Construction Grid',
        description: 'Grid lines and construction geometry',
        color: '#e5e7eb', // Very Light Gray
        strokeWidth: 0.5,
        visible: false,
        locked: false,
        printable: false,
        opacity: 0.5,
        lineType: 'dotted',
        category: 'annotation',
        order: 1
      },
      {
        id: 'reference_background',
        name: 'Background Reference',
        description: 'Building outlines, site plans, and reference drawings',
        color: '#f3f4f6', // Very Light Gray
        strokeWidth: 1,
        visible: true,
        locked: true,
        printable: true,
        opacity: 0.3,
        lineType: 'dashed',
        category: 'annotation',
        order: 0
      }
    ];

    standardLayers.forEach(layer => {
      this.layers.set(layer.id, layer);
    });
  }

  /**
   * Initialize logical layer groups
   */
  private initializeLayerGroups(): void {
    const standardGroups: LayerGroup[] = [
      {
        id: 'power_systems',
        name: 'Power Distribution',
        description: 'All power distribution and electrical circuits',
        layerIds: ['power_main', 'power_branch', 'power_emergency'],
        visible: true,
        collapsed: false
      },
      {
        id: 'control_systems',
        name: 'Control & Instrumentation',
        description: 'Control circuits and instrumentation',
        layerIds: ['control_logic', 'control_instrumentation'],
        visible: true,
        collapsed: false
      },
      {
        id: 'communication_systems',
        name: 'Communications',
        description: 'Data, network, and communication systems',
        layerIds: ['comm_data', 'comm_wireless'],
        visible: true,
        collapsed: true
      },
      {
        id: 'safety_systems',
        name: 'Safety & Security',
        description: 'Fire safety, security, and life safety systems',
        layerIds: ['safety_fire', 'safety_security'],
        visible: true,
        collapsed: true
      },
      {
        id: 'grounding_systems',
        name: 'Grounding & Protection',
        description: 'Grounding, bonding, and lightning protection',
        layerIds: ['grounding_main', 'grounding_lightning'],
        visible: true,
        collapsed: false
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Annotations, dimensions, and documentation',
        layerIds: ['annotation_text', 'annotation_symbols', 'dimension_linear', 'dimension_angular'],
        visible: true,
        collapsed: true
      },
      {
        id: 'reference',
        name: 'Reference & Construction',
        description: 'Grid, construction, and reference elements',
        layerIds: ['construction_grid', 'reference_background'],
        visible: false,
        collapsed: true
      }
    ];

    standardGroups.forEach(group => {
      this.layerGroups.set(group.id, group);
    });
  }

  /**
   * Create a new custom layer
   */
  createLayer(layer: Omit<LayerDefinition, 'order'>): string {
    const maxOrder = Math.max(...Array.from(this.layers.values()).map(l => l.order));
    const newLayer: LayerDefinition = {
      ...layer,
      order: maxOrder + 1
    };
    
    this.layers.set(layer.id, newLayer);
    return layer.id;
  }

  /**
   * Update an existing layer
   */
  updateLayer(layerId: string, updates: Partial<LayerDefinition>): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    const updatedLayer = { ...layer, ...updates };
    this.layers.set(layerId, updatedLayer);
    return true;
  }

  /**
   * Delete a layer (moves components to default layer)
   */
  deleteLayer(layerId: string): boolean {
    if (layerId === this.settings.defaultLayer) {
      throw new Error('Cannot delete the default layer');
    }

    if (!this.layers.has(layerId)) return false;

    // Move all components on this layer to default layer
    for (const [componentId, assignment] of this.componentAssignments.entries()) {
      if (assignment.layerId === layerId) {
        this.componentAssignments.set(componentId, {
          ...assignment,
          layerId: this.settings.defaultLayer
        });
      }
    }

    // Remove from layer groups
    for (const group of this.layerGroups.values()) {
      group.layerIds = group.layerIds.filter(id => id !== layerId);
    }

    this.layers.delete(layerId);
    return true;
  }

  /**
   * Assign component to layer
   */
  assignComponentToLayer(
    componentId: string, 
    layerId: string, 
    overrides: Pick<LayerAssignment, 'overrideColor' | 'overrideStroke' | 'overrideOpacity'> = {}
  ): boolean {
    if (!this.layers.has(layerId)) return false;

    this.componentAssignments.set(componentId, {
      componentId,
      layerId,
      ...overrides
    });

    return true;
  }

  /**
   * Auto-assign component to appropriate layer based on type
   */
  autoAssignComponent(componentId: string, componentType: string): string {
    if (!this.settings.autoAssignment) {
      return this.settings.defaultLayer;
    }

    const layerMap: Record<string, string> = {
      // Power components
      'main_panel': 'power_main',
      'sub_panel': 'power_branch',
      'circuit_breaker': 'power_branch',
      'generator': 'power_emergency',
      'ups': 'power_emergency',
      'transformer': 'power_main',
      'utility_meter': 'power_main',
      
      // Control components
      'motor_starter': 'control_logic',
      'contactor': 'control_logic',
      'relay': 'control_logic',
      'plc': 'control_logic',
      'hmi': 'control_instrumentation',
      'meter': 'control_instrumentation',
      'sensor': 'control_instrumentation',
      
      // Communication components
      'ethernet_switch': 'comm_data',
      'router': 'comm_data',
      'wireless_ap': 'comm_wireless',
      'cellular_modem': 'comm_wireless',
      
      // Safety components
      'fire_alarm_panel': 'safety_fire',
      'smoke_detector': 'safety_fire',
      'security_panel': 'safety_security',
      'camera': 'safety_security',
      
      // Grounding components
      'grounding_electrode': 'grounding_main',
      'surge_protector': 'grounding_lightning',
      'lightning_rod': 'grounding_lightning'
    };

    const targetLayerId = layerMap[componentType] || this.settings.defaultLayer;
    this.assignComponentToLayer(componentId, targetLayerId);
    
    return targetLayerId;
  }

  /**
   * Get layer for component
   */
  getComponentLayer(componentId: string): LayerDefinition | null {
    const assignment = this.componentAssignments.get(componentId);
    if (!assignment) return null;
    
    return this.layers.get(assignment.layerId) || null;
  }

  /**
   * Get effective style for component (considering layer and overrides)
   */
  getComponentStyle(componentId: string): {
    color: string;
    strokeWidth: number;
    opacity: number;
    lineType: string;
    visible: boolean;
  } | null {
    const assignment = this.componentAssignments.get(componentId);
    if (!assignment) return null;

    const layer = this.layers.get(assignment.layerId);
    if (!layer) return null;

    return {
      color: assignment.overrideColor || layer.color,
      strokeWidth: assignment.overrideStroke || layer.strokeWidth,
      opacity: assignment.overrideOpacity || layer.opacity,
      lineType: layer.lineType,
      visible: layer.visible
    };
  }

  /**
   * Get all layers sorted by order
   */
  getAllLayers(): LayerDefinition[] {
    return Array.from(this.layers.values()).sort((a, b) => b.order - a.order);
  }

  /**
   * Get layers by category
   */
  getLayersByCategory(category: LayerDefinition['category']): LayerDefinition[] {
    return this.getAllLayers().filter(layer => layer.category === category);
  }

  /**
   * Get visible layers
   */
  getVisibleLayers(): LayerDefinition[] {
    return this.getAllLayers().filter(layer => layer.visible);
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.visible = !layer.visible;
    return layer.visible;
  }

  /**
   * Lock/unlock layer
   */
  toggleLayerLock(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.locked = !layer.locked;
    return layer.locked;
  }

  /**
   * Set active layer
   */
  setActiveLayer(layerId: string): boolean {
    if (!this.layers.has(layerId)) return false;
    
    this.settings.activeLayerId = layerId;
    return true;
  }

  /**
   * Get active layer
   */
  getActiveLayer(): LayerDefinition | null {
    return this.layers.get(this.settings.activeLayerId) || null;
  }

  /**
   * Create layer group
   */
  createLayerGroup(group: LayerGroup): string {
    this.layerGroups.set(group.id, group);
    return group.id;
  }

  /**
   * Get all layer groups
   */
  getAllLayerGroups(): LayerGroup[] {
    return Array.from(this.layerGroups.values());
  }

  /**
   * Toggle layer group visibility
   */
  toggleLayerGroupVisibility(groupId: string): boolean {
    const group = this.layerGroups.get(groupId);
    if (!group) return false;

    group.visible = !group.visible;
    
    // Apply to all layers in group
    group.layerIds.forEach(layerId => {
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.visible = group.visible;
      }
    });

    return group.visible;
  }

  /**
   * Get printable layers (for PDF export)
   */
  getPrintableLayers(): LayerDefinition[] {
    return this.getAllLayers().filter(layer => layer.printable && layer.visible);
  }

  /**
   * Export layer configuration
   */
  exportLayerConfiguration(): {
    layers: LayerDefinition[];
    groups: LayerGroup[];
    assignments: LayerAssignment[];
    settings: LayerSettings;
  } {
    return {
      layers: this.getAllLayers(),
      groups: this.getAllLayerGroups(),
      assignments: Array.from(this.componentAssignments.values()),
      settings: this.settings
    };
  }

  /**
   * Import layer configuration
   */
  importLayerConfiguration(config: {
    layers?: LayerDefinition[];
    groups?: LayerGroup[];
    assignments?: LayerAssignment[];
    settings?: Partial<LayerSettings>;
  }): void {
    if (config.layers) {
      this.layers.clear();
      config.layers.forEach(layer => {
        this.layers.set(layer.id, layer);
      });
    }

    if (config.groups) {
      this.layerGroups.clear();
      config.groups.forEach(group => {
        this.layerGroups.set(group.id, group);
      });
    }

    if (config.assignments) {
      this.componentAssignments.clear();
      config.assignments.forEach(assignment => {
        this.componentAssignments.set(assignment.componentId, assignment);
      });
    }

    if (config.settings) {
      this.settings = { ...this.settings, ...config.settings };
    }
  }

  /**
   * Get layer statistics
   */
  getLayerStatistics(): {
    totalLayers: number;
    visibleLayers: number;
    lockedLayers: number;
    componentsByLayer: Record<string, number>;
    layersByCategory: Record<string, number>;
  } {
    const componentsByLayer: Record<string, number> = {};
    const layersByCategory: Record<string, number> = {};

    // Count components by layer
    for (const assignment of this.componentAssignments.values()) {
      componentsByLayer[assignment.layerId] = (componentsByLayer[assignment.layerId] || 0) + 1;
    }

    // Count layers by category
    for (const layer of this.layers.values()) {
      layersByCategory[layer.category] = (layersByCategory[layer.category] || 0) + 1;
    }

    return {
      totalLayers: this.layers.size,
      visibleLayers: this.getVisibleLayers().length,
      lockedLayers: Array.from(this.layers.values()).filter(l => l.locked).length,
      componentsByLayer,
      layersByCategory
    };
  }
}

export default SLDLayerService;