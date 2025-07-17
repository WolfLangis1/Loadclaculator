import type { SLDComponent, SLDDiagram } from './sld';

export interface LayerDefinition {
  id: string;
  name: string;
  category: 'power' | 'control' | 'grounding' | 'annotation' | 'custom';
  visible: boolean;
  locked: boolean;
  color: string;
  order: number;
  description?: string;
}

export interface LayerAssignment {
  componentId: string;
  layerId: string;
}

export interface LayerGroup {
  id: string;
  name: string;
  layerIds: string[];
  visible: boolean;
  locked: boolean;
}

export interface LayerManagerOptions {
  autoAssignment: boolean;
  colorByLayer: boolean;
  showLayerNames: boolean;
  layerNameSize: number;
}

export interface LayerManagerState {
  isInitialized: boolean;
  activeLayerId: string;
  selectedLayers: Set<string>;
  layerVisibility: Map<string, boolean>;
  componentAssignments: Map<string, string>; // componentId -> layerId
}
