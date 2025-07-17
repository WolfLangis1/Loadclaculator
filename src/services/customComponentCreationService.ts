/**
 * Custom Component Creation Service
 * 
 * Professional component creation tools with:
 * - Vector graphics symbol editor
 * - Component property editor with electrical specifications
 * - Terminal definition system for connection points
 * - Component validation for electrical compatibility
 * - Export to component library
 */

export interface CustomComponent {
  id: string;
  name: string;
  category: string;
  type: string;
  version: string;
  description: string;
  author: string;
  createdDate: Date;
  lastModified: Date;
  
  // Visual properties
  symbol: ComponentSymbol;
  defaultSize: { width: number; height: number };
  color: string;
  
  // Electrical properties
  specifications: ComponentSpecifications;
  terminals: ComponentTerminal[];
  connections: ConnectionRule[];
  
  // Validation rules
  validationRules: ValidationRule[];
  necCompliance: NECComplianceInfo;
  
  // Metadata
  tags: string[];
  manufacturer?: string;
  model?: string;
  dataSheetUrl?: string;
  customFields: Record<string, any>;
}

export interface ComponentSymbol {
  type: 'vector' | 'text' | 'hybrid';
  elements: SymbolElement[];
  viewBox: { x: number; y: number; width: number; height: number };
  preserveAspectRatio: boolean;
}

export interface SymbolElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'path' | 'text' | 'polygon';
  properties: ElementProperties;
  style: ElementStyle;
  transform?: Transform;
}

export interface ElementProperties {
  // Line
  x1?: number; y1?: number; x2?: number; y2?: number;
  // Rectangle
  x?: number; y?: number; width?: number; height?: number; rx?: number; ry?: number;
  // Circle
  cx?: number; cy?: number; r?: number;
  // Path
  d?: string;
  // Text
  text?: string; fontSize?: number; fontFamily?: string;
  // Polygon
  points?: string;
}

export interface ElementStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
}

export interface Transform {
  translate?: { x: number; y: number };
  rotate?: { angle: number; centerX?: number; centerY?: number };
  scale?: { x: number; y: number };
  skew?: { x: number; y: number };
}

export interface ComponentSpecifications {
  electrical: ElectricalSpecs;
  mechanical: MechanicalSpecs;
  environmental: EnvironmentalSpecs;
  performance: PerformanceSpecs;
  compliance: ComplianceSpecs;
}

export interface ElectricalSpecs {
  voltageRating: { min: number; max: number; nominal: number; unit: string };
  currentRating: { continuous: number; peak?: number; unit: string };
  powerRating?: { value: number; unit: string };
  frequency?: { min: number; max: number; nominal: number; unit: string };
  phases: number;
  poles?: number;
  wireCount?: number;
  insulationClass?: string;
  shortCircuitRating?: number;
  groundFaultRating?: number;
}

export interface MechanicalSpecs {
  dimensions: { width: number; height: number; depth: number; unit: string };
  weight: { value: number; unit: string };
  mounting: string[];
  enclosureType: string;
  material: string;
  finish?: string;
  operatingPosition?: string[];
}

export interface EnvironmentalSpecs {
  operatingTemperature: { min: number; max: number; unit: string };
  storageTemperature: { min: number; max: number; unit: string };
  humidity: { min: number; max: number; unit: string };
  altitude: { max: number; unit: string };
  vibration?: string;
  shock?: string;
  ipRating?: string;
  nemaRating?: string;
}

export interface PerformanceSpecs {
  efficiency?: number;
  powerFactor?: number;
  rippleFactor?: number;
  responseTime?: { value: number; unit: string };
  accuracy?: { value: number; unit: string };
  repeatability?: { value: number; unit: string };
  lifeExpectancy?: { value: number; unit: string };
  mtbf?: { value: number; unit: string };
}

export interface ComplianceSpecs {
  ulListed: boolean;
  csaApproved: boolean;
  cecCompliant: boolean;
  iecCompliant: boolean;
  necArticles: string[];
  otherStandards: string[];
  certificationNumbers: string[];
}

export interface ComponentTerminal {
  id: string;
  name: string;
  type: 'input' | 'output' | 'bidirectional' | 'ground' | 'neutral';
  position: { x: number; y: number };
  electricalType: 'power' | 'control' | 'signal' | 'data' | 'ground';
  voltage?: number;
  current?: number;
  signals?: string[];
  connectionType: 'wire' | 'busbar' | 'plug' | 'terminal_block';
  required: boolean;
  multiple: boolean; // Can accept multiple connections
}

export interface ConnectionRule {
  id: string;
  fromTerminal: string;
  toTerminalTypes: string[];
  voltageCompatibility: VoltageCompatibility;
  currentCompatibility: CurrentCompatibility;
  signalCompatibility?: SignalCompatibility;
  necRequirements?: string[];
  warnings?: string[];
}

export interface VoltageCompatibility {
  exactMatch: boolean;
  tolerance?: number; // Percentage
  validRanges?: { min: number; max: number }[];
}

export interface CurrentCompatibility {
  minimumRating: number;
  derateFactor?: number;
  overloadProtection?: boolean;
}

export interface SignalCompatibility {
  signalTypes: string[];
  protocol?: string;
  baudRate?: number;
  impedance?: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  condition: ValidationCondition;
  message: string;
  necReference?: string;
  autoFix?: AutoFixAction;
}

export interface ValidationCondition {
  property: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'regex';
  value: any;
  unit?: string;
}

export interface AutoFixAction {
  type: 'set_property' | 'suggest_component' | 'add_protection' | 'resize_conductor';
  parameters: Record<string, any>;
}

export interface NECComplianceInfo {
  applicableArticles: string[];
  specialRequirements: string[];
  installationRestrictions: string[];
  maintenanceRequirements: string[];
  inspectionPoints: string[];
}

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  baseComponent?: string; // ID of component to copy from
  defaultSpecifications: Partial<ComponentSpecifications>;
  requiredFields: string[];
  optionalFields: string[];
  fieldValidation: Record<string, ValidationRule[]>;
}

export interface SymbolLibrary {
  id: string;
  name: string;
  description: string;
  standard: 'IEEE-315' | 'IEC-60617' | 'ANSI-Y32' | 'custom';
  symbols: Record<string, ComponentSymbol>;
  lastUpdated: Date;
}

export class CustomComponentCreationService {
  private static templates: Map<string, ComponentTemplate> = new Map();
  private static symbolLibraries: Map<string, SymbolLibrary> = new Map();
  
  static {
    this.initializeTemplates();
    this.initializeSymbolLibraries();
  }
  
  /**
   * Create a new custom component from template
   */
  static createComponent(templateId: string, customData: Partial<CustomComponent>): CustomComponent {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const component: CustomComponent = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customData.name || 'New Component',
      category: customData.category || template.category,
      type: customData.type || 'custom',
      version: '1.0.0',
      description: customData.description || '',
      author: customData.author || 'Unknown',
      createdDate: new Date(),
      lastModified: new Date(),
      
      symbol: customData.symbol || this.createDefaultSymbol(),
      defaultSize: customData.defaultSize || { width: 60, height: 40 },
      color: customData.color || '#374151',
      
      specifications: this.mergeSpecifications(template.defaultSpecifications, customData.specifications),
      terminals: customData.terminals || [],
      connections: customData.connections || [],
      
      validationRules: customData.validationRules || [],
      necCompliance: customData.necCompliance || {
        applicableArticles: [],
        specialRequirements: [],
        installationRestrictions: [],
        maintenanceRequirements: [],
        inspectionPoints: []
      },
      
      tags: customData.tags || [],
      manufacturer: customData.manufacturer,
      model: customData.model,
      dataSheetUrl: customData.dataSheetUrl,
      customFields: customData.customFields || {}
    };
    
    // Validate component
    const validationResult = this.validateComponent(component);
    if (!validationResult.valid) {
      throw new Error(`Component validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    return component;
  }
  
  /**
   * Create vector graphics symbol editor
   */
  static createSymbolEditor(): SymbolEditor {
    return new SymbolEditor();
  }
  
  /**
   * Validate component electrical compatibility
   */
  static validateComponent(component: CustomComponent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];
    
    // Validate required fields
    if (!component.name.trim()) {
      errors.push('Component name is required');
    }
    
    if (!component.category.trim()) {
      errors.push('Component category is required');
    }
    
    // Validate electrical specifications
    if (component.specifications.electrical) {
      const elec = component.specifications.electrical;
      
      if (elec.voltageRating.max < elec.voltageRating.min) {
        errors.push('Maximum voltage cannot be less than minimum voltage');
      }
      
      if (elec.currentRating.continuous <= 0) {
        errors.push('Continuous current rating must be positive');
      }
      
      if (elec.phases < 1 || elec.phases > 3) {
        warnings.push('Unusual phase count - verify this is correct');
      }
    }
    
    // Validate terminals
    if (component.terminals.length === 0) {
      warnings.push('Component has no terminals defined');
    }
    
    component.terminals.forEach((terminal, index) => {
      if (!terminal.name.trim()) {
        errors.push(`Terminal ${index + 1} name is required`);
      }
      
      if (terminal.position.x < 0 || terminal.position.y < 0) {
        errors.push(`Terminal ${terminal.name} has invalid position`);
      }
    });
    
    // Validate connection rules
    component.connections.forEach((connection, index) => {
      const fromTerminal = component.terminals.find(t => t.id === connection.fromTerminal);
      if (!fromTerminal) {
        errors.push(`Connection rule ${index + 1} references invalid terminal`);
      }
    });
    
    // Apply custom validation rules
    component.validationRules.forEach(rule => {
      const result = this.applyValidationRule(component, rule);
      if (!result.passed) {
        switch (rule.type) {
          case 'error':
            errors.push(result.message);
            break;
          case 'warning':
            warnings.push(result.message);
            break;
          case 'info':
            info.push(result.message);
            break;
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }
  
  /**
   * Generate component symbol from specifications
   */
  static generateSymbolFromSpecs(specifications: ComponentSpecifications, type: string): ComponentSymbol {
    const elements: SymbolElement[] = [];
    
    // Base rectangle
    elements.push({
      id: 'base_rect',
      type: 'rectangle',
      properties: { x: 0, y: 0, width: 60, height: 40, rx: 2 },
      style: { 
        stroke: '#374151', 
        strokeWidth: 1.5, 
        fill: '#f9fafb',
        fillOpacity: 1
      }
    });
    
    // Add type-specific elements
    switch (type) {
      case 'breaker':
        elements.push(...this.generateBreakerSymbol());
        break;
      case 'transformer':
        elements.push(...this.generateTransformerSymbol());
        break;
      case 'motor':
        elements.push(...this.generateMotorSymbol());
        break;
      case 'inverter':
        elements.push(...this.generateInverterSymbol());
        break;
      default:
        // Generic component symbol
        elements.push({
          id: 'label',
          type: 'text',
          properties: { 
            x: 30, y: 25, 
            text: type.toUpperCase(),
            fontSize: 10,
            fontFamily: 'Arial'
          },
          style: { fill: '#374151' }
        });
    }
    
    // Add voltage/current ratings if specified
    if (specifications.electrical) {
      const elec = specifications.electrical;
      elements.push({
        id: 'rating',
        type: 'text',
        properties: {
          x: 30, y: 35,
          text: `${elec.voltageRating.nominal}V ${elec.currentRating.continuous}A`,
          fontSize: 6,
          fontFamily: 'Arial'
        },
        style: { fill: '#6b7280' }
      });
    }
    
    return {
      type: 'vector',
      elements,
      viewBox: { x: 0, y: 0, width: 60, height: 40 },
      preserveAspectRatio: true
    };
  }
  
  /**
   * Export component to library format
   */
  static exportComponent(component: CustomComponent): string {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        generator: 'Custom Component Creation Service'
      },
      component: {
        ...component,
        // Convert symbols to serializable format
        symbol: this.serializeSymbol(component.symbol)
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Import component from library format
   */
  static importComponent(data: string): CustomComponent {
    try {
      const importData = JSON.parse(data);
      const component = importData.component;
      
      // Validate imported data
      if (!component.id || !component.name) {
        throw new Error('Invalid component data');
      }
      
      // Deserialize symbol
      component.symbol = this.deserializeSymbol(component.symbol);
      
      // Update timestamps
      component.lastModified = new Date();
      
      return component;
    } catch (error) {
      throw new Error(`Failed to import component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Private helper methods
   */
  
  private static initializeTemplates(): void {
    const templates: ComponentTemplate[] = [
      {
        id: 'circuit_breaker',
        name: 'Circuit Breaker',
        description: 'Standard circuit breaker template',
        category: 'Protection',
        defaultSpecifications: {
          electrical: {
            voltageRating: { min: 120, max: 480, nominal: 240, unit: 'V' },
            currentRating: { continuous: 20, unit: 'A' },
            phases: 1,
            poles: 1
          } as ElectricalSpecs
        },
        requiredFields: ['name', 'currentRating', 'voltageRating', 'poles'],
        optionalFields: ['manufacturer', 'model', 'shortCircuitRating'],
        fieldValidation: {}
      },
      {
        id: 'transformer',
        name: 'Transformer',
        description: 'Power transformer template',
        category: 'Distribution',
        defaultSpecifications: {
          electrical: {
            voltageRating: { min: 120, max: 13800, nominal: 480, unit: 'V' },
            currentRating: { continuous: 100, unit: 'A' },
            powerRating: { value: 45, unit: 'kVA' },
            phases: 3
          } as ElectricalSpecs
        },
        requiredFields: ['name', 'powerRating', 'primaryVoltage', 'secondaryVoltage'],
        optionalFields: ['impedance', 'tapSettings', 'coolingType'],
        fieldValidation: {}
      }
    ];
    
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
  
  private static initializeSymbolLibraries(): void {
    const ieee315Library: SymbolLibrary = {
      id: 'ieee_315',
      name: 'IEEE 315 Standard Symbols',
      description: 'IEEE Standard 315 electrical symbols',
      standard: 'IEEE-315',
      symbols: {
        'circuit_breaker': this.createCircuitBreakerSymbol(),
        'transformer': this.createTransformerSymbol(),
        'motor': this.createMotorSymbol()
      },
      lastUpdated: new Date()
    };
    
    this.symbolLibraries.set(ieee315Library.id, ieee315Library);
  }
  
  private static createDefaultSymbol(): ComponentSymbol {
    return {
      type: 'vector',
      elements: [
        {
          id: 'base',
          type: 'rectangle',
          properties: { x: 0, y: 0, width: 60, height: 40, rx: 3 },
          style: { 
            stroke: '#374151', 
            strokeWidth: 2, 
            fill: '#f3f4f6',
            fillOpacity: 1
          }
        },
        {
          id: 'label',
          type: 'text',
          properties: { 
            x: 30, y: 25, 
            text: 'COMP',
            fontSize: 10,
            fontFamily: 'Arial'
          },
          style: { fill: '#374151' }
        }
      ],
      viewBox: { x: 0, y: 0, width: 60, height: 40 },
      preserveAspectRatio: true
    };
  }
  
  private static mergeSpecifications(
    template: Partial<ComponentSpecifications>,
    custom?: Partial<ComponentSpecifications>
  ): ComponentSpecifications {
    return {
      electrical: { ...template.electrical, ...custom?.electrical } as ElectricalSpecs,
      mechanical: { ...template.mechanical, ...custom?.mechanical } as MechanicalSpecs,
      environmental: { ...template.environmental, ...custom?.environmental } as EnvironmentalSpecs,
      performance: { ...template.performance, ...custom?.performance } as PerformanceSpecs,
      compliance: { ...template.compliance, ...custom?.compliance } as ComplianceSpecs
    };
  }
  
  private static applyValidationRule(component: CustomComponent, rule: ValidationRule): { passed: boolean; message: string } {
    // Simplified validation rule application
    // In production, would implement a full expression evaluator
    return { passed: true, message: rule.message };
  }
  
  private static generateBreakerSymbol(): SymbolElement[] {
    return [
      {
        id: 'contacts',
        type: 'path',
        properties: { d: 'M 20 15 L 40 15 M 20 25 L 40 25' },
        style: { stroke: '#374151', strokeWidth: 2 }
      }
    ];
  }
  
  private static generateTransformerSymbol(): SymbolElement[] {
    return [
      {
        id: 'primary',
        type: 'circle',
        properties: { cx: 25, cy: 20, r: 8 },
        style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
      },
      {
        id: 'secondary',
        type: 'circle',
        properties: { cx: 35, cy: 20, r: 8 },
        style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
      }
    ];
  }
  
  private static generateMotorSymbol(): SymbolElement[] {
    return [
      {
        id: 'motor_circle',
        type: 'circle',
        properties: { cx: 30, cy: 20, r: 15 },
        style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
      },
      {
        id: 'motor_m',
        type: 'text',
        properties: { x: 30, y: 25, text: 'M', fontSize: 12, fontFamily: 'Arial' },
        style: { fill: '#374151' }
      }
    ];
  }
  
  private static generateInverterSymbol(): SymbolElement[] {
    return [
      {
        id: 'inverter_wave',
        type: 'path',
        properties: { d: 'M 15 25 L 20 15 L 25 25 L 30 15 L 35 25 L 40 15 L 45 25' },
        style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
      }
    ];
  }
  
  private static createCircuitBreakerSymbol(): ComponentSymbol {
    return {
      type: 'vector',
      elements: [
        {
          id: 'base',
          type: 'rectangle',
          properties: { x: 0, y: 0, width: 60, height: 40 },
          style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
        },
        ...this.generateBreakerSymbol()
      ],
      viewBox: { x: 0, y: 0, width: 60, height: 40 },
      preserveAspectRatio: true
    };
  }
  
  private static createTransformerSymbol(): ComponentSymbol {
    return {
      type: 'vector',
      elements: [
        {
          id: 'base',
          type: 'rectangle',
          properties: { x: 0, y: 0, width: 60, height: 40 },
          style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
        },
        ...this.generateTransformerSymbol()
      ],
      viewBox: { x: 0, y: 0, width: 60, height: 40 },
      preserveAspectRatio: true
    };
  }
  
  private static createMotorSymbol(): ComponentSymbol {
    return {
      type: 'vector',
      elements: [
        {
          id: 'base',
          type: 'rectangle',
          properties: { x: 0, y: 0, width: 60, height: 40 },
          style: { stroke: '#374151', strokeWidth: 2, fill: 'none' }
        },
        ...this.generateMotorSymbol()
      ],
      viewBox: { x: 0, y: 0, width: 60, height: 40 },
      preserveAspectRatio: true
    };
  }
  
  private static serializeSymbol(symbol: ComponentSymbol): any {
    return JSON.parse(JSON.stringify(symbol));
  }
  
  private static deserializeSymbol(data: any): ComponentSymbol {
    return data as ComponentSymbol;
  }
}

/**
 * Symbol Editor class for vector graphics editing
 */
export class SymbolEditor {
  private elements: SymbolElement[] = [];
  private selectedElement: string | null = null;
  private canvas: { width: number; height: number } = { width: 100, height: 80 };
  private zoom: number = 1;
  private pan: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor() {}
  
  addElement(type: SymbolElement['type'], properties: ElementProperties, style: ElementStyle): string {
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const element: SymbolElement = { id, type, properties, style };
    this.elements.push(element);
    return id;
  }
  
  updateElement(id: string, properties?: Partial<ElementProperties>, style?: Partial<ElementStyle>): boolean {
    const element = this.elements.find(e => e.id === id);
    if (!element) return false;
    
    if (properties) {
      element.properties = { ...element.properties, ...properties };
    }
    if (style) {
      element.style = { ...element.style, ...style };
    }
    
    return true;
  }
  
  deleteElement(id: string): boolean {
    const index = this.elements.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    this.elements.splice(index, 1);
    if (this.selectedElement === id) {
      this.selectedElement = null;
    }
    
    return true;
  }
  
  selectElement(id: string): boolean {
    const exists = this.elements.some(e => e.id === id);
    if (exists) {
      this.selectedElement = id;
      return true;
    }
    return false;
  }
  
  getSymbol(): ComponentSymbol {
    return {
      type: 'vector',
      elements: [...this.elements],
      viewBox: { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height },
      preserveAspectRatio: true
    };
  }
  
  loadSymbol(symbol: ComponentSymbol): void {
    this.elements = [...symbol.elements];
    this.canvas = { width: symbol.viewBox.width, height: symbol.viewBox.height };
    this.selectedElement = null;
  }
  
  exportSVG(): string {
    const svg = `<svg width="${this.canvas.width}" height="${this.canvas.height}" viewBox="0 0 ${this.canvas.width} ${this.canvas.height}" xmlns="http://www.w3.org/2000/svg">
      ${this.elements.map(element => this.elementToSVG(element)).join('\n')}
    </svg>`;
    return svg;
  }
  
  private elementToSVG(element: SymbolElement): string {
    const styleStr = Object.entries(element.style || {})
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}="${value}"`)
      .join(' ');
    
    switch (element.type) {
      case 'line':
        return `<line x1="${element.properties.x1}" y1="${element.properties.y1}" x2="${element.properties.x2}" y2="${element.properties.y2}" ${styleStr} />`;
      case 'rectangle':
        return `<rect x="${element.properties.x}" y="${element.properties.y}" width="${element.properties.width}" height="${element.properties.height}" ${styleStr} />`;
      case 'circle':
        return `<circle cx="${element.properties.cx}" cy="${element.properties.cy}" r="${element.properties.r}" ${styleStr} />`;
      case 'path':
        return `<path d="${element.properties.d}" ${styleStr} />`;
      case 'text':
        return `<text x="${element.properties.x}" y="${element.properties.y}" font-size="${element.properties.fontSize}" font-family="${element.properties.fontFamily}" ${styleStr}>${element.properties.text}</text>`;
      case 'polygon':
        return `<polygon points="${element.properties.points}" ${styleStr} />`;
      default:
        return '';
    }
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}