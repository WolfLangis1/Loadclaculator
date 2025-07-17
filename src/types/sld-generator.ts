import type { SLDComponent, SLDConnection } from './sld';
import type { LoadState } from './load';

export interface GeneratedSLDComponent extends Omit<SLDComponent, 'id'> {
  id: string;
  loadReference?: {
    type: 'general' | 'hvac' | 'evse' | 'solar';
    loadId: number;
    loadName: string;
  };
  circuitNumber?: string;
  specifications: {
    rating: string;
    voltage: number;
    wireSize?: string;
    conduitSize?: string;
    necReference: string;
    continuousLoad?: boolean;
  };
}

export interface SLDGenerationOptions {
  includeLoadCalculations: boolean;
  includeCircuitNumbers: boolean;
  includeWireSizing: boolean;
  includeNECReferences: boolean;
  diagramStyle: 'residential' | 'commercial' | 'industrial';
  voltageLevel: 120 | 240 | 480;
  serviceSize: number;
}

export interface SLDLayout {
  serviceEntrance: { x: number; y: number };
  mainPanel: { x: number; y: number };
  subPanels: Array<{ x: number; y: number; name: string }>;
  loads: Array<{ x: number; y: number; component: GeneratedSLDComponent }>;
  spacing: {
    horizontal: number;
    vertical: number;
    panelSpacing: number;
  };
}
