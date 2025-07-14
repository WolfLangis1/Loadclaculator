// Single Line Diagram (SLD) Types and Interfaces
// Based on electrical industry standards and NEC compliance requirements

export interface SLDPosition {
  x: number;
  y: number;
}

export interface SLDSize {
  width: number;
  height: number;
}

export interface SLDConnection {
  id: string;
  fromComponentId: string;
  toComponentId: string;
  fromPort?: string;
  toPort?: string;
  startPoint?: SLDPosition;
  endPoint?: SLDPosition;
  wireType?: 'dc' | 'ac' | 'ground';
  voltage?: number;
  current?: number;
  conductorSize?: string;
  wireGauge?: string;
  conduitType?: string;
  conduitSize?: string;
  label?: string;
  metadata?: {
    voltageDrop?: string;
    ampacity?: string;
    necCompliant?: boolean;
    autoSized?: boolean;
    [key: string]: any;
  };
}

export interface SLDLabel {
  id: string;
  text: string;
  position: SLDPosition;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  necRequired: boolean;
  necReference?: string;
}

export interface SLDComponentBase {
  id: string;
  type: string;
  name?: string;
  label?: string;
  position: SLDPosition;
  size: SLDSize;
  rotation: number;
  labels?: SLDLabel[];
  necLabels?: string[];
  specifications?: Record<string, any>;
  terminals?: SLDTerminal[];
  visual?: {
    fillColor?: string;
    strokeColor?: string;
    lineWeight?: number;
    label?: string;
    showRating?: boolean;
  };
}

export interface SLDTerminal {
  id: string;
  type: 'input' | 'output';
  position: SLDPosition;
  connectionPoint: SLDPosition;
  label: string;
}

// PV Array Component
export interface SLDPVArray extends SLDComponentBase {
  type: 'pv_array';
  numStrings: number;
  modulesPerString: number;
  moduleWattage: number;
  moduleVoltage: number;
  moduleCurrent: number;
  arrayVoltage: number;
  arrayCurrent: number;
  manufacturer: string;
  model: string;
  location: 'roof' | 'ground' | 'carport' | 'other';
}

// Inverter Component
export interface SLDInverter extends SLDComponentBase {
  type: 'inverter';
  inverterType: 'string' | 'power_optimizer' | 'micro';
  manufacturer: string;
  model: string;
  acOutputKW: number;
  dcInputVoltage: number;
  acOutputVoltage: number;
  efficiency: number;
  mpptChannels: number;
}

// Disconnect Components
export interface SLDDisconnect extends SLDComponentBase {
  type: 'dc_disconnect' | 'ac_disconnect' | 'main_disconnect' | 'disconnect';
  rating: string; // e.g., "30A", "60A"
  voltage: number;
  fusible: boolean;
  necLabel: string; // Required NEC labeling
  location: string;
}

// Battery Storage Components
export interface SLDBattery extends SLDComponentBase {
  type: 'battery';
  batteryType: 'tesla_powerwall_3' | 'enphase_iq10c' | 'generic_ac' | 'generic_dc';
  manufacturer: string;
  model: string;
  capacityKWh: number;
  powerKW: number;
  voltage: number;
  coupling: 'ac' | 'dc' | 'hybrid';
  backupCapable: boolean;
  rapidShutdown: boolean;
}

// Tesla Powerwall 3 Specific
export interface SLDTeslaPowerwall3 extends SLDBattery {
  batteryType: 'tesla_powerwall_3';
  pvInputs: number; // 6 PV inputs
  pvInputVoltage: string; // "PV 1+/-" through "PV 6+/-"
  acTerminals: {
    l1: string; // black
    l2: string; // red
    neutral: string; // white
    ground: string;
  };
  backupSwitch: boolean;
}

// Enphase IQ Battery 10C
export interface SLDEnphaseIQ10C extends SLDBattery {
  batteryType: 'enphase_iq10c';
  usableCapacity: number; // 10 kWh
  continuousPower: number; // 7.08 kW
  combiner6C: boolean; // Uses IQ Combiner 6C
}

// Main Service Panel
export interface SLDMainPanel extends SLDComponentBase {
  type: 'main_panel';
  rating: number; // e.g., 200A
  busRating: number;
  voltage: number;
  phase: 1 | 3;
  manufacturer: string;
  model: string;
  meterLocation: 'internal' | 'external' | 'separate';
  groundingElectrode: boolean;
}

// Combiner Box (Enphase IQ Combiner 6C)
export interface SLDCombinerBox extends SLDComponentBase {
  type: 'combiner_box';
  manufacturer: string;
  model: string;
  pvBreakers: number;
  batteryBreaker: boolean;
  evBreaker: boolean;
  meteringCTs: boolean;
  maxCurrent: number;
}

// EVSE Charger
export interface SLDEVSECharger extends SLDComponentBase {
  type: 'evse_charger';
  manufacturer: string;
  model: string;
  powerKW: number;
  voltage: number;
  current: number;
  level: 1 | 2;
  circuitBreaker: string;
  dedicatedCircuit: boolean;
  necCompliant: boolean;
}

// Grid Connection
export interface SLDGrid extends SLDComponentBase {
  type: 'grid';
  utilityName: string;
  serviceVoltage: number;
  serviceType: 'overhead' | 'underground';
  meterType: 'analog' | 'digital' | 'smart';
  netMetering: boolean;
}

// Monitoring/Metering
export interface SLDMeter extends SLDComponentBase {
  type: 'production_meter' | 'consumption_meter' | 'utility_meter';
  manufacturer: string;
  model: string;
  ctRating: string;
  communicationType: 'ethernet' | 'wifi' | 'cellular' | 'zigbee';
}

// Ground/Bonding
export interface SLDGroundingElectrode extends SLDComponentBase {
  type: 'grounding_electrode';
  electrodeType: 'rod' | 'plate' | 'ring' | 'concrete';
  conductorSize: string;
  bondingJumper: string;
}

// Breaker Component
export interface SLDBreaker extends SLDComponentBase {
  type: 'breaker';
  rating: string; // e.g., "50A", "100A"
  poles: number;
  breakerType: 'standard' | 'gfci' | 'afci' | 'dedicated';
  voltage: number;
  manufacturer: string;
  model: string;
}

// EV Charger Component (alternative to EVSE)
export interface SLDEVCharger extends SLDComponentBase {
  type: 'ev_charger';
  manufacturer: string;
  model: string;
  powerKW: number;
  voltage: number;
  current: number;
  level: 1 | 2 | 3;
  connector: 'J1772' | 'Tesla' | 'CCS' | 'CHAdeMO';
  circuitBreaker: string;
  dedicatedCircuit: boolean;
  necCompliant: boolean;
}

// Union of all component types
export type SLDComponent = 
  | SLDPVArray
  | SLDInverter
  | SLDDisconnect
  | SLDBattery
  | SLDTeslaPowerwall3
  | SLDEnphaseIQ10C
  | SLDMainPanel
  | SLDCombinerBox
  | SLDEVSECharger
  | SLDEVCharger
  | SLDBreaker
  | SLDGrid
  | SLDMeter
  | SLDGroundingElectrode;

// Complete SLD Diagram
export interface SLDDiagram {
  id: string;
  projectId?: string;
  name: string;
  created?: Date;
  lastModified?: Date;
  version?: string;
  necCodeYear?: '2017' | '2020' | '2023';
  systemType?: 'grid_tied' | 'grid_tied_with_battery' | 'off_grid';
  
  // Diagram elements
  components: SLDComponent[];
  connections: SLDConnection[];
  labels?: SLDLabel[];
  
  // Layout and styling
  canvasSize?: SLDSize;
  backgroundColor?: string;
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  
  // Auto-generated from load calculator
  autoGenerated?: boolean;
  sourceCalculationId?: string;
  
  // NEC compliance
  necCompliant?: boolean;
  necViolations?: string[];
  requiredLabels?: SLDLabel[];
  
  // Professional information
  designedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  permitNumber?: string;
  ahj?: string; // Authority Having Jurisdiction

  // Metadata
  metadata?: {
    necCompliance?: string;
    drawingStandard?: string;
    createdBy?: string;
    createdDate?: string;
    lastModified?: string;
    generatedFrom?: string;
    [key: string]: any;
  };
}

// Aerial View Integration
export interface AerialView {
  id: string;
  projectId: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  imageUrl: string;
  imageData?: string; // Base64 encoded image
  captureDate: Date;
  resolution: number; // meters per pixel
  zoom: number;
  mapProvider: 'google' | 'mapbox' | 'esri' | 'bing';
  annotations: AerialAnnotation[];
}

export interface AerialAnnotation {
  id: string;
  type: 'pv_array' | 'meter' | 'disconnect' | 'panel' | 'obstacle' | 'setback' | 'note';
  position: SLDPosition; // relative to image
  size?: SLDSize;
  label: string;
  color: string;
  notes?: string;
}

// Project Integration
export interface SLDProject {
  diagram: SLDDiagram;
  aerialView?: AerialView;
  loadCalculatorData: any; // Reference to existing load calculator state
  exportSettings: {
    includeDiagram: boolean;
    includeAerial: boolean;
    paperSize: 'letter' | 'a4' | 'legal' | 'tabloid';
    orientation: 'portrait' | 'landscape';
    scale: number;
  };
}

// NEC Code Requirements
export interface NECRequirement {
  article: string;
  section: string;
  description: string;
  labelText: string;
  required: boolean;
  componentTypes: string[];
}

// SLD Generation Configuration
export interface SLDGenerationConfig {
  style: 'professional' | 'standard' | 'custom';
  includeSpecifications: boolean;
  includeNECLabels: boolean;
  autoLayout: boolean;
  componentSpacing: number;
  lineStyle: 'solid' | 'dashed';
  showGrounding: boolean;
  showConduitSizing: boolean;
  colorCoding: boolean;
}