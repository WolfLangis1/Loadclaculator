/**
 * Automatic BOM (Bill of Materials) Generation Service
 * 
 * Generates professional bills of materials from SLD diagrams including:
 * - Component extraction and cataloging
 * - Pricing and availability data
 * - Material takeoffs and calculations
 * - Labor estimates and installation time
 * - Supplier integration and procurement
 * - Professional BOM formatting and export
 */

export interface BOMItem {
  id: string;
  componentId: string;
  category: string;
  manufacturer: string;
  model: string;
  partNumber: string;
  description: string;
  
  // Quantities
  quantity: number;
  unit: string;
  
  // Pricing
  unitPrice: number;
  totalPrice: number;
  currency: string;
  priceDate: Date;
  supplier: string;
  
  // Specifications
  specifications: Record<string, any>;
  
  // Installation data
  laborHours: number;
  installationNotes: string[];
  
  // Procurement data
  availability: string;
  leadTime: number; // days
  minimumOrder: number;
  
  // Electrical data
  voltage?: number;
  amperage?: number;
  power?: number;
  phases?: number;
  
  // Physical data
  dimensions?: { width: number; height: number; depth?: number };
  weight?: number;
  mounting?: string;
  
  // Code compliance
  necReferences: string[];
  certifications: string[];
  
  // Status
  status: 'specified' | 'priced' | 'ordered' | 'received' | 'installed';
  notes: string;
}

export interface BOMSection {
  id: string;
  name: string;
  description: string;
  items: BOMItem[];
  subtotal: number;
  laborHours: number;
  category: 'electrical' | 'controls' | 'safety' | 'communication' | 'mounting' | 'accessories';
  sortOrder: number;
}

export interface MaterialTakeoff {
  // Wire and Cable
  wire: {
    [size: string]: {
      thhn: number; // feet
      romex: number; // feet
      mc: number; // feet
      tray: number; // feet
    };
  };
  
  // Conduit and Raceway
  conduit: {
    [size: string]: {
      emt: number; // feet
      rigid: number; // feet
      pvc: number; // feet
      flex: number; // feet
    };
  };
  
  // Fittings and Hardware
  fittings: {
    conduit: Record<string, number>;
    wire_nuts: Record<string, number>;
    lugs: Record<string, number>;
    connectors: Record<string, number>;
  };
  
  // Mounting and Support
  mounting: {
    unistrut: number; // feet
    hangers: number; // pieces
    brackets: number; // pieces
    hardware: Record<string, number>;
  };
}

export interface LaborEstimate {
  // Installation hours by category
  electrical: number;
  controls: number;
  testing: number;
  commissioning: number;
  
  // Labor rates (per hour)
  electricianRate: number;
  apprenticeRate: number;
  helperRate: number;
  
  // Total costs
  totalHours: number;
  totalLaborCost: number;
  
  // Breakdown by phase
  roughIn: number;
  trimOut: number;
  startup: number;
}

export interface BOMSummary {
  // Totals
  totalItems: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalProjectCost: number;
  
  // By category
  categoryTotals: Record<string, number>;
  
  // Timeline
  maxLeadTime: number;
  criticalPath: string[];
  
  // Procurement
  totalSuppliers: number;
  procurementValue: number;
}

export interface BOMConfiguration {
  // Pricing options
  includePricing: boolean;
  priceSource: 'list' | 'contractor' | 'street';
  markupPercent: number;
  
  // Labor options
  includeLaborPricing: boolean;
  laborRates: {
    electrician: number;
    apprentice: number;
    helper: number;
  };
  
  // Takeoff options
  includeTakeoffs: boolean;
  wireDerating: number; // percentage safety factor
  conduitFill: number; // percentage
  
  // Formatting options
  groupByCategory: boolean;
  showSpecifications: boolean;
  showInstallationNotes: boolean;
  includeAlternates: boolean;
  
  // Export options
  currency: string;
  units: 'imperial' | 'metric';
  locale: string;
}

export class SLDBOMService {
  private bomItems: Map<string, BOMItem> = new Map();
  private sections: Map<string, BOMSection> = new Map();
  private configuration: BOMConfiguration;
  private materialTakeoff: MaterialTakeoff;
  private laborEstimate: LaborEstimate;

  constructor() {
    this.configuration = {
      includePricing: true,
      priceSource: 'contractor',
      markupPercent: 15,
      includeLaborPricing: true,
      laborRates: {
        electrician: 65,
        apprentice: 45,
        helper: 35
      },
      includeTakeoffs: true,
      wireDerating: 25,
      conduitFill: 40,
      groupByCategory: true,
      showSpecifications: true,
      showInstallationNotes: true,
      includeAlternates: false,
      currency: 'USD',
      units: 'imperial',
      locale: 'en-US'
    };

    this.materialTakeoff = {
      wire: {},
      conduit: {},
      fittings: {
        conduit: {},
        wire_nuts: {},
        lugs: {},
        connectors: {}
      },
      mounting: {
        unistrut: 0,
        hangers: 0,
        brackets: 0,
        hardware: {}
      }
    };

    this.laborEstimate = {
      electrical: 0,
      controls: 0,
      testing: 0,
      commissioning: 0,
      electricianRate: 65,
      apprenticeRate: 45,
      helperRate: 35,
      totalHours: 0,
      totalLaborCost: 0,
      roughIn: 0,
      trimOut: 0,
      startup: 0
    };

    this.initializeStandardSections();
  }

  /**
   * Initialize standard BOM sections
   */
  private initializeStandardSections(): void {
    const standardSections: Omit<BOMSection, 'items' | 'subtotal' | 'laborHours'>[] = [
      {
        id: 'service_entrance',
        name: 'Service Entrance Equipment',
        description: 'Main service panels, meter sockets, and service equipment',
        category: 'electrical',
        sortOrder: 1
      },
      {
        id: 'distribution',
        name: 'Distribution Equipment',
        description: 'Subpanels, load centers, and distribution panels',
        category: 'electrical',
        sortOrder: 2
      },
      {
        id: 'protection',
        name: 'Overcurrent Protection',
        description: 'Circuit breakers, fuses, and protective devices',
        category: 'electrical',
        sortOrder: 3
      },
      {
        id: 'generation',
        name: 'Generation Equipment',
        description: 'Generators, transfer switches, and generation accessories',
        category: 'electrical',
        sortOrder: 4
      },
      {
        id: 'renewable',
        name: 'Renewable Energy Systems',
        description: 'Solar panels, inverters, batteries, and renewable equipment',
        category: 'electrical',
        sortOrder: 5
      },
      {
        id: 'evse',
        name: 'Electric Vehicle Supply Equipment',
        description: 'EV chargers and charging infrastructure',
        category: 'electrical',
        sortOrder: 6
      },
      {
        id: 'controls',
        name: 'Control Systems',
        description: 'Motor controls, PLCs, and automation equipment',
        category: 'controls',
        sortOrder: 7
      },
      {
        id: 'communication',
        name: 'Communication Systems',
        description: 'Network equipment, gateways, and communication devices',
        category: 'communication',
        sortOrder: 8
      },
      {
        id: 'safety',
        name: 'Safety Systems',
        description: 'Fire alarm, security, and life safety equipment',
        category: 'safety',
        sortOrder: 9
      },
      {
        id: 'wire_cable',
        name: 'Wire and Cable',
        description: 'Electrical conductors and cable assemblies',
        category: 'electrical',
        sortOrder: 10
      },
      {
        id: 'conduit_raceway',
        name: 'Conduit and Raceway',
        description: 'Conduit, cable tray, and raceway systems',
        category: 'electrical',
        sortOrder: 11
      },
      {
        id: 'fittings',
        name: 'Fittings and Hardware',
        description: 'Electrical fittings, connectors, and hardware',
        category: 'electrical',
        sortOrder: 12
      },
      {
        id: 'mounting',
        name: 'Mounting and Support',
        description: 'Unistrut, hangers, brackets, and mounting hardware',
        category: 'mounting',
        sortOrder: 13
      },
      {
        id: 'accessories',
        name: 'Accessories and Miscellaneous',
        description: 'Labels, tags, and miscellaneous items',
        category: 'accessories',
        sortOrder: 14
      }
    ];

    standardSections.forEach(section => {
      this.sections.set(section.id, {
        ...section,
        items: [],
        subtotal: 0,
        laborHours: 0
      });
    });
  }

  /**
   * Generate BOM from SLD diagram components
   */
  generateBOMFromDiagram(components: Array<{
    id: string;
    type: string;
    manufacturer?: string;
    model?: string;
    specifications?: Record<string, any>;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>): string {
    // Clear existing BOM
    this.bomItems.clear();
    this.resetSectionItems();

    // Process each component
    components.forEach(component => {
      const bomItem = this.createBOMItemFromComponent(component);
      if (bomItem) {
        this.bomItems.set(bomItem.id, bomItem);
        this.addItemToSection(bomItem);
      }
    });

    // Calculate material takeoffs
    this.calculateMaterialTakeoffs(components);

    // Estimate labor
    this.estimateLabor();

    // Update section totals
    this.updateSectionTotals();

    return 'BOM generated successfully';
  }

  /**
   * Create BOM item from component
   */
  private createBOMItemFromComponent(component: any): BOMItem | null {
    // Get component template data (would integrate with ExpandedComponentLibrary)
    const template = this.getComponentTemplate(component.type, component.manufacturer, component.model);
    
    if (!template) {
      console.warn(`No template found for component: ${component.type}`);
      return null;
    }

    const bomItem: BOMItem = {
      id: `bom_${component.id}`,
      componentId: component.id,
      category: template.category || 'electrical',
      manufacturer: template.manufacturer || 'Generic',
      model: template.model || component.type,
      partNumber: template.partNumber || '',
      description: template.description || component.type,
      
      quantity: 1,
      unit: 'EA',
      
      unitPrice: template.price || 0,
      totalPrice: template.price || 0,
      currency: this.configuration.currency,
      priceDate: new Date(),
      supplier: 'TBD',
      
      specifications: component.specifications || template.specifications || {},
      
      laborHours: this.calculateLaborHours(component.type),
      installationNotes: template.installationNotes || [],
      
      availability: template.availability || 'TBD',
      leadTime: this.getLeadTime(template.manufacturer),
      minimumOrder: 1,
      
      voltage: template.specifications?.voltage,
      amperage: template.specifications?.amperage || template.specifications?.rating,
      power: template.specifications?.power,
      phases: template.specifications?.phases,
      
      dimensions: template.specifications?.dimensions,
      weight: template.specifications?.weight,
      mounting: template.specifications?.mounting,
      
      necReferences: template.necReferences || [],
      certifications: this.getCertifications(template.manufacturer, component.type),
      
      status: 'specified',
      notes: ''
    };

    // Apply markup if configured
    if (this.configuration.includePricing && this.configuration.markupPercent > 0) {
      bomItem.unitPrice *= (1 + this.configuration.markupPercent / 100);
      bomItem.totalPrice = bomItem.unitPrice * bomItem.quantity;
    }

    return bomItem;
  }

  /**
   * Get component template (would integrate with actual component library)
   */
  private getComponentTemplate(type: string, manufacturer?: string, model?: string): any {
    // This would integrate with the ExpandedComponentLibrary
    // For now, return basic templates
    const basicTemplates: Record<string, any> = {
      main_panel: {
        category: 'Distribution',
        manufacturer: manufacturer || 'Square D',
        model: model || 'QO120M100C',
        partNumber: 'QO120M100C',
        description: 'Main electrical panel with breakers',
        price: 145.50,
        specifications: { rating: 100, voltage: 240, circuits: 20 },
        installationNotes: ['Requires 3\' clearance', 'Mount 6\' above floor'],
        necReferences: ['NEC 408.36', 'NEC 110.26'],
        availability: 'In Stock'
      },
      circuit_breaker: {
        category: 'Protection',
        manufacturer: manufacturer || 'Square D',
        model: model || 'QO120',
        partNumber: 'QO120',
        description: 'Single pole circuit breaker',
        price: 12.45,
        specifications: { rating: 20, voltage: 120, poles: 1 },
        necReferences: ['NEC 240.4'],
        availability: 'In Stock'
      },
      generator: {
        category: 'Generation',
        manufacturer: manufacturer || 'Generac',
        model: model || '7043',
        partNumber: '7043',
        description: 'Standby generator with transfer switch',
        price: 4899.00,
        specifications: { power: 24000, voltage: 240, fuel: 'natural_gas' },
        installationNotes: ['Requires concrete pad', '5\' clearance all sides'],
        necReferences: ['NEC 702.6'],
        availability: '2-3 weeks'
      },
      evse_l2: {
        category: 'EVSE',
        manufacturer: manufacturer || 'ChargePoint',
        model: model || 'CPH50',
        partNumber: 'CPH50',
        description: 'Level 2 EV charging station',
        price: 699.00,
        specifications: { power: 12000, voltage: 240, amperage: 50 },
        installationNotes: ['Requires 60A circuit', 'Within 25\' of parking'],
        necReferences: ['NEC 625.40'],
        availability: 'In Stock'
      },
      battery_system: {
        category: 'Renewable',
        manufacturer: manufacturer || 'Tesla',
        model: model || 'Powerwall 3',
        partNumber: '1232100-XX-X',
        description: 'Battery energy storage system',
        price: 14900.00,
        specifications: { capacity: 13.5, power: 11.04, voltage: 400 },
        installationNotes: ['Indoor/outdoor rated', 'Requires Gateway'],
        necReferences: ['NEC 706.30'],
        availability: '4-6 weeks'
      }
    };

    return basicTemplates[type] || {
      category: 'Electrical',
      manufacturer: manufacturer || 'Generic',
      model: model || type,
      partNumber: '',
      description: type.replace('_', ' '),
      price: 0,
      specifications: {},
      installationNotes: [],
      necReferences: [],
      availability: 'TBD'
    };
  }

  /**
   * Calculate labor hours for component type
   */
  private calculateLaborHours(componentType: string): number {
    const laborHours: Record<string, number> = {
      main_panel: 8.0,
      sub_panel: 4.0,
      circuit_breaker: 0.5,
      generator: 16.0,
      transfer_switch: 6.0,
      evse_l2: 4.0,
      battery_system: 12.0,
      transformer: 8.0,
      meter_socket: 2.0,
      disconnect: 2.0,
      motor_starter: 3.0,
      security_panel: 6.0,
      fire_alarm_panel: 8.0,
      smart_meter: 1.0,
      communication_gateway: 2.0
    };

    return laborHours[componentType] || 1.0;
  }

  /**
   * Get typical lead time for manufacturer
   */
  private getLeadTime(manufacturer: string): number {
    const leadTimes: Record<string, number> = {
      'Square D': 1,
      'Siemens': 2,
      'Generac': 14,
      'Tesla': 28,
      'Enphase': 7,
      'ChargePoint': 3,
      'Trane': 10,
      'Edwards': 21
    };

    return leadTimes[manufacturer] || 7; // Default 1 week
  }

  /**
   * Get certifications for component
   */
  private getCertifications(manufacturer: string, componentType: string): string[] {
    const certifications: string[] = ['UL Listed'];

    if (componentType.includes('fire')) {
      certifications.push('UL 864', 'NFPA 72');
    }

    if (componentType.includes('evse')) {
      certifications.push('UL 2594', 'FCC Part 15');
    }

    if (componentType.includes('solar') || componentType.includes('battery')) {
      certifications.push('UL 1741', 'IEEE 1547');
    }

    return certifications;
  }

  /**
   * Add item to appropriate section
   */
  private addItemToSection(item: BOMItem): void {
    let sectionId = 'accessories'; // Default section

    // Determine section based on category and type
    if (item.category === 'Distribution') {
      sectionId = item.partNumber.includes('M') ? 'service_entrance' : 'distribution';
    } else if (item.category === 'Protection') {
      sectionId = 'protection';
    } else if (item.category === 'Generation') {
      sectionId = 'generation';
    } else if (item.category === 'Energy Storage' || item.category === 'Solar Equipment') {
      sectionId = 'renewable';
    } else if (item.category === 'EVSE') {
      sectionId = 'evse';
    } else if (item.category === 'Security' || item.category === 'Fire Safety') {
      sectionId = 'safety';
    } else if (item.category === 'Monitoring') {
      sectionId = 'communication';
    }

    const section = this.sections.get(sectionId);
    if (section) {
      section.items.push(item);
    }
  }

  /**
   * Calculate material takeoffs (wire, conduit, fittings)
   */
  private calculateMaterialTakeoffs(components: any[]): void {
    // This would analyze the diagram routing and calculate required materials
    // For now, provide estimates based on component count and spacing

    const componentCount = components.length;
    const avgDistance = 50; // feet between components

    // Estimate wire requirements
    this.materialTakeoff.wire = {
      '12 AWG': {
        thhn: componentCount * 25,
        romex: 0,
        mc: 0,
        tray: 0
      },
      '10 AWG': {
        thhn: componentCount * 15,
        romex: 0,
        mc: 0,
        tray: 0
      },
      '8 AWG': {
        thhn: Math.max(componentCount - 5, 0) * 10,
        romex: 0,
        mc: 0,
        tray: 0
      }
    };

    // Estimate conduit requirements
    this.materialTakeoff.conduit = {
      '3/4"': {
        emt: componentCount * 20,
        rigid: 0,
        pvc: 0,
        flex: componentCount * 5
      },
      '1"': {
        emt: Math.max(componentCount - 3, 0) * 15,
        rigid: 0,
        pvc: 0,
        flex: 0
      }
    };

    // Add takeoff items to BOM
    this.addTakeoffItems();
  }

  /**
   * Add takeoff items to BOM
   */
  private addTakeoffItems(): void {
    if (!this.configuration.includeTakeoffs) return;

    // Add wire items
    Object.entries(this.materialTakeoff.wire).forEach(([size, types]) => {
      Object.entries(types).forEach(([type, footage]) => {
        if (footage > 0) {
          const wireItem = this.createWireItem(size, type, footage);
          this.bomItems.set(wireItem.id, wireItem);
          this.addItemToSection(wireItem);
        }
      });
    });

    // Add conduit items
    Object.entries(this.materialTakeoff.conduit).forEach(([size, types]) => {
      Object.entries(types).forEach(([type, footage]) => {
        if (footage > 0) {
          const conduitItem = this.createConduitItem(size, type, footage);
          this.bomItems.set(conduitItem.id, conduitItem);
          this.addItemToSection(conduitItem);
        }
      });
    });
  }

  /**
   * Create wire BOM item
   */
  private createWireItem(size: string, type: string, footage: number): BOMItem {
    const pricePerFoot: Record<string, Record<string, number>> = {
      '12 AWG': { thhn: 0.45, romex: 0.85, mc: 1.25, tray: 2.10 },
      '10 AWG': { thhn: 0.65, romex: 1.15, mc: 1.85, tray: 2.85 },
      '8 AWG': { thhn: 1.05, romex: 1.85, mc: 2.65, tray: 4.25 }
    };

    const unitPrice = pricePerFoot[size]?.[type] || 1.0;

    return {
      id: `wire_${size}_${type}`,
      componentId: '',
      category: 'Wire and Cable',
      manufacturer: 'Southwire',
      model: `${size} ${type.toUpperCase()}`,
      partNumber: `SW-${size}-${type}`,
      description: `${size} ${type.toUpperCase()} building wire`,
      quantity: Math.ceil(footage),
      unit: 'FT',
      unitPrice,
      totalPrice: unitPrice * Math.ceil(footage),
      currency: this.configuration.currency,
      priceDate: new Date(),
      supplier: 'Electrical Distributor',
      specifications: { size, type, voltage: 600 },
      laborHours: footage * 0.02, // 0.02 hours per foot
      installationNotes: ['Pull in conduit', 'Terminate in approved fittings'],
      availability: 'Stock',
      leadTime: 1,
      minimumOrder: 100,
      necReferences: ['NEC 310.104'],
      certifications: ['UL Listed'],
      status: 'specified',
      notes: 'Calculated from takeoff'
    };
  }

  /**
   * Create conduit BOM item
   */
  private createConduitItem(size: string, type: string, footage: number): BOMItem {
    const pricePerFoot: Record<string, Record<string, number>> = {
      '3/4"': { emt: 1.85, rigid: 4.25, pvc: 0.95, flex: 2.15 },
      '1"': { emt: 2.45, rigid: 5.85, pvc: 1.35, flex: 3.25 }
    };

    const unitPrice = pricePerFoot[size]?.[type] || 2.0;

    return {
      id: `conduit_${size}_${type}`,
      componentId: '',
      category: 'Conduit and Raceway',
      manufacturer: 'Allied Tube',
      model: `${size} ${type.toUpperCase()}`,
      partNumber: `AT-${size}-${type}`,
      description: `${size} ${type.toUpperCase()} conduit`,
      quantity: Math.ceil(footage / 10), // 10-foot sticks
      unit: 'EA',
      unitPrice: unitPrice * 10, // Price per 10-foot stick
      totalPrice: unitPrice * Math.ceil(footage),
      currency: this.configuration.currency,
      priceDate: new Date(),
      supplier: 'Electrical Distributor',
      specifications: { size, type, length: 10 },
      laborHours: footage * 0.15, // 0.15 hours per foot installed
      installationNotes: ['Install per NEC requirements', 'Support every 10 feet'],
      availability: 'Stock',
      leadTime: 1,
      minimumOrder: 1,
      necReferences: ['NEC 358.30'],
      certifications: ['UL Listed'],
      status: 'specified',
      notes: 'Calculated from takeoff'
    };
  }

  /**
   * Estimate labor costs
   */
  private estimateLabor(): void {
    let totalElectrical = 0;
    let totalControls = 0;

    // Sum labor hours from all items
    this.bomItems.forEach(item => {
      if (item.category.includes('Control') || item.category.includes('Communication')) {
        totalControls += item.laborHours;
      } else {
        totalElectrical += item.laborHours;
      }
    });

    // Add testing and commissioning
    const totalInstallHours = totalElectrical + totalControls;
    const testingHours = totalInstallHours * 0.15; // 15% of install time
    const commissioningHours = totalInstallHours * 0.10; // 10% of install time

    this.laborEstimate = {
      electrical: totalElectrical,
      controls: totalControls,
      testing: testingHours,
      commissioning: commissioningHours,
      electricianRate: this.configuration.laborRates.electrician,
      apprenticeRate: this.configuration.laborRates.apprentice,
      helperRate: this.configuration.laborRates.helper,
      totalHours: totalElectrical + totalControls + testingHours + commissioningHours,
      totalLaborCost: 0, // Will be calculated
      roughIn: totalInstallHours * 0.60,
      trimOut: totalInstallHours * 0.30,
      startup: totalInstallHours * 0.10
    };

    // Calculate total labor cost (assume 70% electrician, 30% apprentice)
    this.laborEstimate.totalLaborCost = 
      (this.laborEstimate.totalHours * 0.7 * this.laborEstimate.electricianRate) +
      (this.laborEstimate.totalHours * 0.3 * this.laborEstimate.apprenticeRate);
  }

  /**
   * Reset section items
   */
  private resetSectionItems(): void {
    this.sections.forEach(section => {
      section.items = [];
      section.subtotal = 0;
      section.laborHours = 0;
    });
  }

  /**
   * Update section totals
   */
  private updateSectionTotals(): void {
    this.sections.forEach(section => {
      section.subtotal = section.items.reduce((sum, item) => sum + item.totalPrice, 0);
      section.laborHours = section.items.reduce((sum, item) => sum + item.laborHours, 0);
    });
  }

  /**
   * Get BOM summary
   */
  getBOMSummary(): BOMSummary {
    const items = Array.from(this.bomItems.values());
    const totalMaterialCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const categoryTotals: Record<string, number> = {};
    items.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.totalPrice;
    });

    const suppliers = new Set(items.map(item => item.supplier));
    const maxLeadTime = Math.max(...items.map(item => item.leadTime));
    const criticalPath = items
      .filter(item => item.leadTime === maxLeadTime)
      .map(item => item.description);

    return {
      totalItems: items.length,
      totalMaterialCost,
      totalLaborCost: this.laborEstimate.totalLaborCost,
      totalProjectCost: totalMaterialCost + this.laborEstimate.totalLaborCost,
      categoryTotals,
      maxLeadTime,
      criticalPath,
      totalSuppliers: suppliers.size,
      procurementValue: totalMaterialCost
    };
  }

  /**
   * Get all BOM sections
   */
  getAllSections(): BOMSection[] {
    return Array.from(this.sections.values())
      .filter(section => section.items.length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get section by ID
   */
  getSection(sectionId: string): BOMSection | null {
    return this.sections.get(sectionId) || null;
  }

  /**
   * Export BOM to CSV
   */
  exportToCSV(): string {
    const headers = [
      'Item',
      'Manufacturer',
      'Model',
      'Part Number',
      'Description',
      'Quantity',
      'Unit',
      'Unit Price',
      'Total Price',
      'Labor Hours',
      'Availability',
      'Lead Time',
      'NEC References'
    ];

    const rows = [headers.join(',')];

    this.getAllSections().forEach(section => {
      // Add section header
      rows.push(`\n"${section.name}",,,,,,,,,,,`);
      
      // Add section items
      section.items.forEach(item => {
        const row = [
          item.id,
          `"${item.manufacturer}"`,
          `"${item.model}"`,
          `"${item.partNumber}"`,
          `"${item.description}"`,
          item.quantity,
          item.unit,
          item.unitPrice.toFixed(2),
          item.totalPrice.toFixed(2),
          item.laborHours.toFixed(1),
          `"${item.availability}"`,
          item.leadTime,
          `"${item.necReferences.join(', ')}"`
        ];
        rows.push(row.join(','));
      });
    });

    return rows.join('\n');
  }

  /**
   * Export BOM to professional PDF format
   */
  exportToPDF(): Promise<Blob> {
    // This would integrate with jsPDF or similar library
    // For now, return a placeholder
    return Promise.resolve(new Blob(['PDF BOM content'], { type: 'application/pdf' }));
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<BOMConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): BOMConfiguration {
    return { ...this.configuration };
  }

  /**
   * Get labor estimate
   */
  getLaborEstimate(): LaborEstimate {
    return { ...this.laborEstimate };
  }

  /**
   * Get material takeoff
   */
  getMaterialTakeoff(): MaterialTakeoff {
    return { ...this.materialTakeoff };
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(itemId: string, quantity: number): boolean {
    const item = this.bomItems.get(itemId);
    if (!item) return false;

    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
    this.updateSectionTotals();
    
    return true;
  }

  /**
   * Update item pricing
   */
  updateItemPricing(itemId: string, unitPrice: number, supplier?: string): boolean {
    const item = this.bomItems.get(itemId);
    if (!item) return false;

    item.unitPrice = unitPrice;
    item.totalPrice = unitPrice * item.quantity;
    item.priceDate = new Date();
    
    if (supplier) {
      item.supplier = supplier;
    }
    
    this.updateSectionTotals();
    return true;
  }

  /**
   * Add custom BOM item
   */
  addCustomItem(customItem: Omit<BOMItem, 'id' | 'totalPrice' | 'priceDate'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const bomItem: BOMItem = {
      ...customItem,
      id,
      totalPrice: customItem.unitPrice * customItem.quantity,
      priceDate: new Date()
    };

    this.bomItems.set(id, bomItem);
    this.addItemToSection(bomItem);
    this.updateSectionTotals();

    return id;
  }

  /**
   * Remove BOM item
   */
  removeItem(itemId: string): boolean {
    const item = this.bomItems.get(itemId);
    if (!item) return false;

    // Remove from section
    const section = Array.from(this.sections.values())
      .find(s => s.items.some(i => i.id === itemId));
    
    if (section) {
      section.items = section.items.filter(i => i.id !== itemId);
    }

    this.bomItems.delete(itemId);
    this.updateSectionTotals();

    return true;
  }

  /**
   * Clear entire BOM
   */
  clearBOM(): void {
    this.bomItems.clear();
    this.resetSectionItems();
    this.materialTakeoff = {
      wire: {},
      conduit: {},
      fittings: { conduit: {}, wire_nuts: {}, lugs: {}, connectors: {} },
      mounting: { unistrut: 0, hangers: 0, brackets: 0, hardware: {} }
    };
    this.laborEstimate = {
      electrical: 0,
      controls: 0,
      testing: 0,
      commissioning: 0,
      electricianRate: this.configuration.laborRates.electrician,
      apprenticeRate: this.configuration.laborRates.apprentice,
      helperRate: this.configuration.laborRates.helper,
      totalHours: 0,
      totalLaborCost: 0,
      roughIn: 0,
      trimOut: 0,
      startup: 0
    };
  }
}

export default SLDBOMService;