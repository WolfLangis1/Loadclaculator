/**
 * Automatic Dimensioning with Customizable Styles
 * 
 * Provides intelligent automatic dimensioning for electrical drawings including:
 * - Component spacing dimensions
 * - Wire routing dimensions
 * - Panel and equipment positioning
 * - Conduit and raceway dimensions
 * - Clearance and code compliance dimensions
 * - Custom dimension styles and templates
 */

export interface Point {
  x: number;
  y: number;
}

export interface DimensionStyle {
  id: string;
  name: string;
  description: string;
  
  // Line properties
  lineColor: string;
  lineWidth: number;
  extensionLineLength: number;
  extensionLineOffset: number;
  
  // Arrow properties
  arrowStyle: 'closed' | 'open' | 'tick' | 'dot' | 'slash' | 'none';
  arrowSize: number;
  arrowColor: string;
  
  // Text properties
  textSize: number;
  textColor: string;
  textFont: string;
  textPosition: 'above' | 'below' | 'inline' | 'centered';
  textRotation: 'horizontal' | 'aligned' | 'vertical';
  textOffset: number;
  textBackground: boolean;
  textBackgroundColor: string;
  textBorderColor: string;
  
  // Format properties
  precision: number;
  units: string;
  showUnits: boolean;
  unitFormat: 'symbol' | 'abbreviation' | 'full';
  fractionFormat: 'decimal' | 'fractional' | 'architectural';
  
  // Leader line properties (for angular dimensions)
  leaderLineStyle: 'straight' | 'curved';
  leaderLineLength: number;
  
  // Tolerance properties
  showTolerance: boolean;
  toleranceFormat: 'plus_minus' | 'limit' | 'geometric';
  toleranceUpper: number;
  toleranceLower: number;
}

export interface AutoDimension {
  id: string;
  type: 'linear' | 'angular' | 'radial' | 'diameter' | 'arc_length' | 'coordinate';
  
  // Geometric properties
  startPoint: Point;
  endPoint: Point;
  dimensionLine: Point[];
  extensionLines: Point[][];
  
  // Measured values
  nominalValue: number;
  displayValue: string;
  tolerance?: { upper: number; lower: number };
  
  // Reference information
  referencedComponents: string[];
  dimensionPurpose: 'positioning' | 'sizing' | 'clearance' | 'code_compliance' | 'general';
  codeReference?: string; // NEC article reference
  
  // Style and display
  style: DimensionStyle;
  visible: boolean;
  locked: boolean;
  automatic: boolean; // Whether this was auto-generated
  
  // Metadata
  label?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DimensionChain {
  id: string;
  name: string;
  dimensions: string[]; // Dimension IDs in order
  direction: 'horizontal' | 'vertical';
  baseline: Point;
  spacing: number;
  style: DimensionStyle;
  showTotal: boolean;
  totalDimension?: AutoDimension;
}

export interface DimensionSettings {
  autoGenerate: boolean;
  autoUpdate: boolean;
  minSpacing: number; // Minimum spacing between dimensions
  defaultStyle: string;
  
  // Code compliance dimensions
  enableCodeDimensions: boolean;
  necEdition: '2017' | '2020' | '2023';
  
  // Geometric constraints
  snapToGrid: boolean;
  gridSize: number;
  
  // Display options
  showOnlyActive: boolean;
  hideRedundant: boolean;
  groupByPurpose: boolean;
}

export class SLDDimensionService {
  private dimensions: Map<string, AutoDimension> = new Map();
  private dimensionChains: Map<string, DimensionChain> = new Map();
  private styles: Map<string, DimensionStyle> = new Map();
  private settings: DimensionSettings;

  constructor() {
    this.settings = {
      autoGenerate: true,
      autoUpdate: true,
      minSpacing: 40,
      defaultStyle: 'electrical_standard',
      enableCodeDimensions: true,
      necEdition: '2023',
      snapToGrid: false,
      gridSize: 12,
      showOnlyActive: false,
      hideRedundant: true,
      groupByPurpose: true
    };

    this.initializeStandardStyles();
  }

  /**
   * Initialize standard dimension styles for electrical drawings
   */
  private initializeStandardStyles(): void {
    const standardStyles: DimensionStyle[] = [
      {
        id: 'electrical_standard',
        name: 'Electrical Standard',
        description: 'Standard style for electrical drawings per IEEE standards',
        lineColor: '#1f2937',
        lineWidth: 1,
        extensionLineLength: 6,
        extensionLineOffset: 3,
        arrowStyle: 'closed',
        arrowSize: 8,
        arrowColor: '#1f2937',
        textSize: 10,
        textColor: '#1f2937',
        textFont: 'Arial',
        textPosition: 'above',
        textRotation: 'horizontal',
        textOffset: 4,
        textBackground: true,
        textBackgroundColor: '#ffffff',
        textBorderColor: '#e5e7eb',
        precision: 2,
        units: 'feet',
        showUnits: true,
        unitFormat: 'symbol',
        fractionFormat: 'decimal',
        leaderLineStyle: 'straight',
        leaderLineLength: 20,
        showTolerance: false,
        toleranceFormat: 'plus_minus',
        toleranceUpper: 0.125,
        toleranceLower: 0.125
      },
      
      {
        id: 'clearance_dimensions',
        name: 'Code Clearance',
        description: 'Dimensions for NEC clearance requirements',
        lineColor: '#dc2626',
        lineWidth: 1.5,
        extensionLineLength: 8,
        extensionLineOffset: 4,
        arrowStyle: 'closed',
        arrowSize: 10,
        arrowColor: '#dc2626',
        textSize: 11,
        textColor: '#dc2626',
        textFont: 'Arial Bold',
        textPosition: 'above',
        textRotation: 'horizontal',
        textOffset: 6,
        textBackground: true,
        textBackgroundColor: '#fef2f2',
        textBorderColor: '#dc2626',
        precision: 1,
        units: 'feet',
        showUnits: true,
        unitFormat: 'symbol',
        fractionFormat: 'architectural',
        leaderLineStyle: 'straight',
        leaderLineLength: 25,
        showTolerance: true,
        toleranceFormat: 'plus_minus',
        toleranceUpper: 0,
        toleranceLower: 0.25
      },
      
      {
        id: 'equipment_sizing',
        name: 'Equipment Sizing',
        description: 'Dimensions for equipment and component sizing',
        lineColor: '#2563eb',
        lineWidth: 1,
        extensionLineLength: 6,
        extensionLineOffset: 3,
        arrowStyle: 'tick',
        arrowSize: 6,
        arrowColor: '#2563eb',
        textSize: 9,
        textColor: '#2563eb',
        textFont: 'Arial',
        textPosition: 'inline',
        textRotation: 'aligned',
        textOffset: 2,
        textBackground: false,
        textBackgroundColor: '#ffffff',
        textBorderColor: '#e5e7eb',
        precision: 3,
        units: 'inches',
        showUnits: true,
        unitFormat: 'abbreviation',
        fractionFormat: 'decimal',
        leaderLineStyle: 'straight',
        leaderLineLength: 15,
        showTolerance: false,
        toleranceFormat: 'plus_minus',
        toleranceUpper: 0.0625,
        toleranceLower: 0.0625
      },
      
      {
        id: 'conduit_routing',
        name: 'Conduit Routing',
        description: 'Dimensions for conduit and raceway routing',
        lineColor: '#059669',
        lineWidth: 1,
        extensionLineLength: 5,
        extensionLineOffset: 2,
        arrowStyle: 'open',
        arrowSize: 7,
        arrowColor: '#059669',
        textSize: 8,
        textColor: '#059669',
        textFont: 'Arial',
        textPosition: 'centered',
        textRotation: 'horizontal',
        textOffset: 3,
        textBackground: true,
        textBackgroundColor: '#ffffff',
        textBorderColor: '#d1d5db',
        precision: 1,
        units: 'feet',
        showUnits: false,
        unitFormat: 'symbol',
        fractionFormat: 'architectural',
        leaderLineStyle: 'straight',
        leaderLineLength: 12,
        showTolerance: false,
        toleranceFormat: 'plus_minus',
        toleranceUpper: 0.5,
        toleranceLower: 0.5
      }
    ];

    standardStyles.forEach(style => {
      this.styles.set(style.id, style);
    });
  }

  /**
   * Auto-generate dimensions for components
   */
  autoDimensionComponents(
    components: Array<{ id: string; position: Point; size: { width: number; height: number }; type: string }>,
    connections: Array<{ id: string; fromComponentId: string; toComponentId: string; path: Point[] }>
  ): string[] {
    if (!this.settings.autoGenerate) return [];

    const generatedDimensions: string[] = [];

    // Generate positioning dimensions between components
    generatedDimensions.push(...this.generatePositioningDimensions(components));

    // Generate sizing dimensions for critical components
    generatedDimensions.push(...this.generateSizingDimensions(components));

    // Generate clearance dimensions for code compliance
    if (this.settings.enableCodeDimensions) {
      generatedDimensions.push(...this.generateClearanceDimensions(components));
    }

    // Generate conduit routing dimensions
    generatedDimensions.push(...this.generateConduitDimensions(connections, components));

    return generatedDimensions;
  }

  /**
   * Generate positioning dimensions between components
   */
  private generatePositioningDimensions(
    components: Array<{ id: string; position: Point; size: { width: number; height: number }; type: string }>
  ): string[] {
    const dimensions: string[] = [];
    const style = this.styles.get('electrical_standard')!;

    // Sort components by position for logical dimensioning
    const sortedByX = [...components].sort((a, b) => a.position.x - b.position.x);
    const sortedByY = [...components].sort((a, b) => a.position.y - b.position.y);

    // Generate horizontal dimensions
    for (let i = 0; i < sortedByX.length - 1; i++) {
      const comp1 = sortedByX[i];
      const comp2 = sortedByX[i + 1];

      // Skip if components are too far apart or overlapping
      const distance = comp2.position.x - (comp1.position.x + comp1.size.width);
      if (distance < 12 || distance > 200) continue;

      const startPoint: Point = {
        x: comp1.position.x + comp1.size.width,
        y: comp1.position.y + comp1.size.height / 2
      };

      const endPoint: Point = {
        x: comp2.position.x,
        y: comp2.position.y + comp2.size.height / 2
      };

      const dimensionId = this.createLinearDimension(
        startPoint,
        endPoint,
        {
          style,
          purpose: 'positioning',
          referencedComponents: [comp1.id, comp2.id],
          automatic: true
        }
      );

      if (dimensionId) dimensions.push(dimensionId);
    }

    // Generate vertical dimensions
    for (let i = 0; i < sortedByY.length - 1; i++) {
      const comp1 = sortedByY[i];
      const comp2 = sortedByY[i + 1];

      // Skip if components are too far apart or overlapping
      const distance = comp2.position.y - (comp1.position.y + comp1.size.height);
      if (distance < 12 || distance > 200) continue;

      const startPoint: Point = {
        x: comp1.position.x + comp1.size.width / 2,
        y: comp1.position.y + comp1.size.height
      };

      const endPoint: Point = {
        x: comp2.position.x + comp2.size.width / 2,
        y: comp2.position.y
      };

      const dimensionId = this.createLinearDimension(
        startPoint,
        endPoint,
        {
          style,
          purpose: 'positioning',
          referencedComponents: [comp1.id, comp2.id],
          automatic: true
        }
      );

      if (dimensionId) dimensions.push(dimensionId);
    }

    return dimensions;
  }

  /**
   * Generate sizing dimensions for equipment
   */
  private generateSizingDimensions(
    components: Array<{ id: string; position: Point; size: { width: number; height: number }; type: string }>
  ): string[] {
    const dimensions: string[] = [];
    const style = this.styles.get('equipment_sizing')!;

    // Critical components that need sizing dimensions
    const criticalTypes = ['main_panel', 'sub_panel', 'transformer', 'generator', 'switchgear'];

    components.forEach(component => {
      if (!criticalTypes.includes(component.type)) return;

      // Width dimension
      const widthStart: Point = {
        x: component.position.x,
        y: component.position.y - 20
      };

      const widthEnd: Point = {
        x: component.position.x + component.size.width,
        y: component.position.y - 20
      };

      const widthDimensionId = this.createLinearDimension(
        widthStart,
        widthEnd,
        {
          style,
          purpose: 'sizing',
          referencedComponents: [component.id],
          automatic: true,
          label: `${component.type} Width`
        }
      );

      if (widthDimensionId) dimensions.push(widthDimensionId);

      // Height dimension
      const heightStart: Point = {
        x: component.position.x - 20,
        y: component.position.y
      };

      const heightEnd: Point = {
        x: component.position.x - 20,
        y: component.position.y + component.size.height
      };

      const heightDimensionId = this.createLinearDimension(
        heightStart,
        heightEnd,
        {
          style,
          purpose: 'sizing',
          referencedComponents: [component.id],
          automatic: true,
          label: `${component.type} Height`
        }
      );

      if (heightDimensionId) dimensions.push(heightDimensionId);
    });

    return dimensions;
  }

  /**
   * Generate NEC code compliance clearance dimensions
   */
  private generateClearanceDimensions(
    components: Array<{ id: string; position: Point; size: { width: number; height: number }; type: string }>
  ): string[] {
    const dimensions: string[] = [];
    const style = this.styles.get('clearance_dimensions')!;

    // NEC clearance requirements (in pixels, assuming 1 pixel = 1 inch)
    const clearanceRequirements = {
      main_panel: { front: 36, sides: 30, top: 30 }, // NEC 110.26
      sub_panel: { front: 36, sides: 30, top: 30 },
      transformer: { front: 36, sides: 12, top: 12 }, // NEC 450.13
      generator: { front: 36, sides: 36, top: 60 },
      switchgear: { front: 48, sides: 36, top: 36 }
    };

    components.forEach(component => {
      const clearances = clearanceRequirements[component.type as keyof typeof clearanceRequirements];
      if (!clearances) return;

      // Front clearance
      const frontStart: Point = {
        x: component.position.x + component.size.width,
        y: component.position.y + component.size.height / 2
      };

      const frontEnd: Point = {
        x: component.position.x + component.size.width + clearances.front,
        y: component.position.y + component.size.height / 2
      };

      const frontDimensionId = this.createLinearDimension(
        frontStart,
        frontEnd,
        {
          style,
          purpose: 'code_compliance',
          referencedComponents: [component.id],
          automatic: true,
          label: 'Front Clearance',
          codeReference: 'NEC 110.26(A)',
          notes: `Required ${clearances.front}" minimum working space`
        }
      );

      if (frontDimensionId) dimensions.push(frontDimensionId);

      // Side clearances (check for adjacent components)
      const rightClearanceEnd: Point = {
        x: component.position.x + component.size.width + clearances.sides,
        y: component.position.y
      };

      // Check if there's adequate clearance to the right
      const hasRightClearance = !components.some(other => 
        other.id !== component.id &&
        other.position.x < rightClearanceEnd.x &&
        other.position.x + other.size.width > component.position.x + component.size.width &&
        other.position.y < component.position.y + component.size.height &&
        other.position.y + other.size.height > component.position.y
      );

      if (!hasRightClearance) {
        const sideDimensionId = this.createLinearDimension(
          { x: component.position.x + component.size.width, y: component.position.y },
          rightClearanceEnd,
          {
            style,
            purpose: 'code_compliance',
            referencedComponents: [component.id],
            automatic: true,
            label: 'Side Clearance',
            codeReference: 'NEC 110.26(A)',
            notes: `Required ${clearances.sides}" minimum side clearance`
          }
        );

        if (sideDimensionId) dimensions.push(sideDimensionId);
      }
    });

    return dimensions;
  }

  /**
   * Generate conduit routing dimensions
   */
  private generateConduitDimensions(
    connections: Array<{ id: string; fromComponentId: string; toComponentId: string; path: Point[] }>,
    components: Array<{ id: string; position: Point; size: { width: number; height: number }; type: string }>
  ): string[] {
    const dimensions: string[] = [];
    const style = this.styles.get('conduit_routing')!;

    connections.forEach(connection => {
      if (connection.path.length < 2) return;

      // Create dimensions for conduit runs longer than 2 feet
      for (let i = 0; i < connection.path.length - 1; i++) {
        const segment = {
          start: connection.path[i],
          end: connection.path[i + 1]
        };

        const distance = Math.sqrt(
          Math.pow(segment.end.x - segment.start.x, 2) +
          Math.pow(segment.end.y - segment.start.y, 2)
        );

        // Only dimension significant runs (> 24 inches)
        if (distance > 24) {
          const dimensionId = this.createLinearDimension(
            segment.start,
            segment.end,
            {
              style,
              purpose: 'general',
              referencedComponents: [connection.fromComponentId, connection.toComponentId],
              automatic: true,
              label: 'Conduit Run'
            }
          );

          if (dimensionId) dimensions.push(dimensionId);
        }
      }
    });

    return dimensions;
  }

  /**
   * Create linear dimension
   */
  createLinearDimension(
    startPoint: Point,
    endPoint: Point,
    options: {
      style?: DimensionStyle;
      purpose?: AutoDimension['dimensionPurpose'];
      referencedComponents?: string[];
      automatic?: boolean;
      label?: string;
      codeReference?: string;
      notes?: string;
    } = {}
  ): string | null {
    const id = `dim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const style = options.style || this.styles.get(this.settings.defaultStyle)!;

    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    // Skip very small dimensions
    if (distance < 6) return null;

    const displayValue = this.formatDimensionValue(distance, style);

    // Calculate dimension line position (offset from the line being dimensioned)
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const perpAngle = angle + Math.PI / 2;
    const offset = 20; // Offset distance for dimension line

    const dimLineStart: Point = {
      x: startPoint.x + Math.cos(perpAngle) * offset,
      y: startPoint.y + Math.sin(perpAngle) * offset
    };

    const dimLineEnd: Point = {
      x: endPoint.x + Math.cos(perpAngle) * offset,
      y: endPoint.y + Math.sin(perpAngle) * offset
    };

    // Calculate extension lines
    const extensionLines: Point[][] = [
      [
        startPoint,
        {
          x: startPoint.x + Math.cos(perpAngle) * (offset + style.extensionLineLength),
          y: startPoint.y + Math.sin(perpAngle) * (offset + style.extensionLineLength)
        }
      ],
      [
        endPoint,
        {
          x: endPoint.x + Math.cos(perpAngle) * (offset + style.extensionLineLength),
          y: endPoint.y + Math.sin(perpAngle) * (offset + style.extensionLineLength)
        }
      ]
    ];

    const dimension: AutoDimension = {
      id,
      type: 'linear',
      startPoint,
      endPoint,
      dimensionLine: [dimLineStart, dimLineEnd],
      extensionLines,
      nominalValue: distance,
      displayValue,
      referencedComponents: options.referencedComponents || [],
      dimensionPurpose: options.purpose || 'general',
      codeReference: options.codeReference,
      style,
      visible: true,
      locked: false,
      automatic: options.automatic || false,
      label: options.label,
      notes: options.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dimensions.set(id, dimension);
    return id;
  }

  /**
   * Create angular dimension
   */
  createAngularDimension(
    centerPoint: Point,
    startPoint: Point,
    endPoint: Point,
    options: {
      style?: DimensionStyle;
      purpose?: AutoDimension['dimensionPurpose'];
      referencedComponents?: string[];
      automatic?: boolean;
      label?: string;
    } = {}
  ): string | null {
    const id = `dim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const style = options.style || this.styles.get(this.settings.defaultStyle)!;

    const startAngle = Math.atan2(startPoint.y - centerPoint.y, startPoint.x - centerPoint.x);
    const endAngle = Math.atan2(endPoint.y - centerPoint.y, endPoint.x - centerPoint.x);

    let angle = endAngle - startAngle;
    if (angle < 0) angle += 2 * Math.PI;
    if (angle > 2 * Math.PI) angle -= 2 * Math.PI;

    const displayValue = this.formatAngleValue(angle, style);

    const dimension: AutoDimension = {
      id,
      type: 'angular',
      startPoint,
      endPoint,
      dimensionLine: [centerPoint, startPoint, endPoint],
      extensionLines: [
        [centerPoint, startPoint],
        [centerPoint, endPoint]
      ],
      nominalValue: angle,
      displayValue,
      referencedComponents: options.referencedComponents || [],
      dimensionPurpose: options.purpose || 'general',
      style,
      visible: true,
      locked: false,
      automatic: options.automatic || false,
      label: options.label,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dimensions.set(id, dimension);
    return id;
  }

  /**
   * Create dimension chain
   */
  createDimensionChain(
    dimensionIds: string[],
    options: {
      name?: string;
      direction?: 'horizontal' | 'vertical';
      baseline?: Point;
      spacing?: number;
      style?: DimensionStyle;
      showTotal?: boolean;
    } = {}
  ): string | null {
    const id = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Validate that all dimensions exist
    const validDimensions = dimensionIds.filter(dimId => this.dimensions.has(dimId));
    if (validDimensions.length < 2) return null;

    const style = options.style || this.styles.get(this.settings.defaultStyle)!;

    const chain: DimensionChain = {
      id,
      name: options.name || 'Dimension Chain',
      dimensions: validDimensions,
      direction: options.direction || 'horizontal',
      baseline: options.baseline || { x: 0, y: 0 },
      spacing: options.spacing || this.settings.minSpacing,
      style,
      showTotal: options.showTotal || false
    };

    // Create total dimension if requested
    if (chain.showTotal) {
      const firstDim = this.dimensions.get(validDimensions[0])!;
      const lastDim = this.dimensions.get(validDimensions[validDimensions.length - 1])!;

      const totalDimId = this.createLinearDimension(
        firstDim.startPoint,
        lastDim.endPoint,
        {
          style,
          purpose: 'general',
          automatic: true,
          label: 'Total'
        }
      );

      if (totalDimId) {
        chain.totalDimension = this.dimensions.get(totalDimId)!;
      }
    }

    this.dimensionChains.set(id, chain);
    return id;
  }

  /**
   * Update dimension
   */
  updateDimension(id: string, updates: Partial<AutoDimension>): boolean {
    const dimension = this.dimensions.get(id);
    if (!dimension || dimension.locked) return false;

    const updatedDimension = { ...dimension, ...updates, updatedAt: new Date() };

    // Recalculate display value if geometric properties changed
    if (updates.startPoint || updates.endPoint || updates.dimensionLine) {
      if (updatedDimension.type === 'linear') {
        const distance = Math.sqrt(
          Math.pow(updatedDimension.endPoint.x - updatedDimension.startPoint.x, 2) +
          Math.pow(updatedDimension.endPoint.y - updatedDimension.startPoint.y, 2)
        );
        updatedDimension.nominalValue = distance;
        updatedDimension.displayValue = this.formatDimensionValue(distance, updatedDimension.style);
      }
    }

    this.dimensions.set(id, updatedDimension);
    return true;
  }

  /**
   * Delete dimension
   */
  deleteDimension(id: string): boolean {
    const dimension = this.dimensions.get(id);
    if (!dimension || dimension.locked) return false;

    // Remove from any chains
    for (const chain of this.dimensionChains.values()) {
      chain.dimensions = chain.dimensions.filter(dimId => dimId !== id);
      if (chain.totalDimension?.id === id) {
        chain.totalDimension = undefined;
      }
    }

    return this.dimensions.delete(id);
  }

  /**
   * Get dimension by ID
   */
  getDimension(id: string): AutoDimension | null {
    return this.dimensions.get(id) || null;
  }

  /**
   * Get all dimensions
   */
  getAllDimensions(): AutoDimension[] {
    return Array.from(this.dimensions.values());
  }

  /**
   * Get dimensions by purpose
   */
  getDimensionsByPurpose(purpose: AutoDimension['dimensionPurpose']): AutoDimension[] {
    return Array.from(this.dimensions.values()).filter(dim => dim.dimensionPurpose === purpose);
  }

  /**
   * Get visible dimensions
   */
  getVisibleDimensions(): AutoDimension[] {
    return Array.from(this.dimensions.values()).filter(dim => dim.visible);
  }

  /**
   * Format dimension value for display
   */
  private formatDimensionValue(value: number, style: DimensionStyle): string {
    // Convert pixels to specified units (assuming 1 pixel = 1 inch by default)
    let convertedValue = value;
    
    switch (style.units) {
      case 'feet':
        convertedValue = value / 12;
        break;
      case 'meters':
        convertedValue = value * 0.0254; // inches to meters
        break;
      case 'millimeters':
        convertedValue = value * 25.4; // inches to mm
        break;
      // 'inches' and default use value as-is
    }

    let formattedValue: string;

    if (style.fractionFormat === 'architectural' && style.units === 'feet') {
      // Convert to feet and inches
      const feet = Math.floor(convertedValue);
      const inches = (convertedValue - feet) * 12;
      const roundedInches = Math.round(inches * Math.pow(10, style.precision)) / Math.pow(10, style.precision);
      
      if (feet > 0 && roundedInches > 0) {
        formattedValue = `${feet}'-${roundedInches}"`;
      } else if (feet > 0) {
        formattedValue = `${feet}'`;
      } else {
        formattedValue = `${roundedInches}"`;
      }
    } else {
      formattedValue = convertedValue.toFixed(style.precision);
    }

    if (style.showUnits) {
      let unitSuffix = '';
      switch (style.unitFormat) {
        case 'symbol':
          unitSuffix = this.getUnitSymbol(style.units);
          break;
        case 'abbreviation':
          unitSuffix = ` ${style.units.substring(0, 2)}`;
          break;
        case 'full':
          unitSuffix = ` ${style.units}`;
          break;
      }
      
      if (!formattedValue.includes("'") && !formattedValue.includes('"')) {
        formattedValue += unitSuffix;
      }
    }

    return formattedValue;
  }

  /**
   * Format angle value for display
   */
  private formatAngleValue(angle: number, style: DimensionStyle): string {
    const degrees = (angle * 180) / Math.PI;
    return `${degrees.toFixed(style.precision)}°`;
  }

  /**
   * Get unit symbol
   */
  private getUnitSymbol(unit: string): string {
    const symbols: Record<string, string> = {
      'inches': '"',
      'feet': "'",
      'meters': 'm',
      'millimeters': 'mm',
      'degrees': '°'
    };
    return symbols[unit] || '';
  }

  /**
   * Toggle dimension visibility
   */
  toggleVisibility(id: string): boolean {
    const dimension = this.dimensions.get(id);
    if (!dimension) return false;

    dimension.visible = !dimension.visible;
    dimension.updatedAt = new Date();
    return dimension.visible;
  }

  /**
   * Toggle dimension lock
   */
  toggleLock(id: string): boolean {
    const dimension = this.dimensions.get(id);
    if (!dimension) return false;

    dimension.locked = !dimension.locked;
    dimension.updatedAt = new Date();
    return dimension.locked;
  }

  /**
   * Clear all automatic dimensions
   */
  clearAutomaticDimensions(): void {
    const automaticDimensions = Array.from(this.dimensions.entries())
      .filter(([id, dim]) => dim.automatic)
      .map(([id]) => id);

    automaticDimensions.forEach(id => this.deleteDimension(id));
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<DimensionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): DimensionSettings {
    return { ...this.settings };
  }

  /**
   * Export dimensions
   */
  exportDimensions(): {
    dimensions: AutoDimension[];
    chains: DimensionChain[];
    styles: DimensionStyle[];
    settings: DimensionSettings;
  } {
    return {
      dimensions: this.getAllDimensions(),
      chains: Array.from(this.dimensionChains.values()),
      styles: Array.from(this.styles.values()),
      settings: this.getSettings()
    };
  }

  /**
   * Import dimensions
   */
  importDimensions(data: {
    dimensions?: AutoDimension[];
    chains?: DimensionChain[];
    styles?: DimensionStyle[];
    settings?: Partial<DimensionSettings>;
  }): void {
    if (data.dimensions) {
      this.dimensions.clear();
      data.dimensions.forEach(dimension => {
        this.dimensions.set(dimension.id, dimension);
      });
    }

    if (data.chains) {
      this.dimensionChains.clear();
      data.chains.forEach(chain => {
        this.dimensionChains.set(chain.id, chain);
      });
    }

    if (data.styles) {
      data.styles.forEach(style => {
        this.styles.set(style.id, style);
      });
    }

    if (data.settings) {
      this.updateSettings(data.settings);
    }
  }

  /**
   * Get dimension statistics
   */
  getDimensionStatistics(): {
    totalDimensions: number;
    byType: Record<string, number>;
    byPurpose: Record<string, number>;
    automaticCount: number;
    visibleCount: number;
    lockedCount: number;
  } {
    const dimensions = this.getAllDimensions();
    const byType: Record<string, number> = {};
    const byPurpose: Record<string, number> = {};

    dimensions.forEach(dimension => {
      byType[dimension.type] = (byType[dimension.type] || 0) + 1;
      byPurpose[dimension.dimensionPurpose] = (byPurpose[dimension.dimensionPurpose] || 0) + 1;
    });

    return {
      totalDimensions: dimensions.length,
      byType,
      byPurpose,
      automaticCount: dimensions.filter(d => d.automatic).length,
      visibleCount: dimensions.filter(d => d.visible).length,
      lockedCount: dimensions.filter(d => d.locked).length
    };
  }
}

export default SLDDimensionService;