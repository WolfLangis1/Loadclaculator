/**
 * Advanced NEC Compliance with Real-time Visual Indicators
 * 
 * Provides comprehensive National Electrical Code compliance checking including:
 * - Real-time code violation detection
 * - Visual compliance indicators on diagram
 * - Automatic correction suggestions
 * - Code reference integration (2017, 2020, 2023 NEC)
 * - Clearance and spacing verification
 * - Load calculation compliance
 * - Grounding and bonding validation
 * - Installation requirement checking
 */

export interface NECRule {
  id: string;
  article: string;
  section: string;
  title: string;
  description: string;
  category: 'safety' | 'installation' | 'sizing' | 'clearance' | 'grounding' | 'protection';
  severity: 'error' | 'warning' | 'info';
  necEdition: '2017' | '2020' | '2023' | 'all';
  
  // Rule conditions
  appliesTo: string[]; // Component types this rule applies to
  conditions: NECCondition[];
  
  // Requirements
  requirements: NECRequirement[];
  
  // Exemptions and exceptions
  exceptions: string[];
  localVariations: boolean; // Whether local codes can modify this rule
}

export interface NECCondition {
  parameter: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'within_range';
  value: any;
  unit?: string;
}

export interface NECRequirement {
  type: 'minimum_distance' | 'maximum_distance' | 'minimum_size' | 'maximum_size' | 'required_component' | 'prohibited_component' | 'calculation_check';
  parameter: string;
  value: number | string;
  unit?: string;
  tolerance?: number;
  description: string;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  componentId: string;
  severity: 'error' | 'warning' | 'info';
  
  // Violation details
  title: string;
  description: string;
  necReference: string;
  currentValue: any;
  requiredValue: any;
  
  // Location and visual
  location: { x: number; y: number };
  affectedArea?: { x: number; y: number; width: number; height: number };
  visualIndicator: 'error_icon' | 'warning_icon' | 'info_icon' | 'distance_line' | 'clearance_zone';
  
  // Resolution
  suggestions: string[];
  autoCorrectAvailable: boolean;
  autoCorrectAction?: () => void;
  
  // Status
  acknowledged: boolean;
  waived: boolean;
  waiverReason?: string;
  dateDetected: Date;
  lastChecked: Date;
}

export interface ClearanceZone {
  id: string;
  componentId: string;
  type: 'working_space' | 'dedicated_space' | 'access_space' | 'ventilation_space' | 'arc_flash_boundary';
  
  // Geometry
  center: { x: number; y: number };
  dimensions: { width: number; height: number; depth?: number };
  shape: 'rectangle' | 'circle' | 'polygon';
  
  // Requirements
  necReference: string;
  description: string;
  minimumClearance: number;
  unit: string;
  
  // Visual styling
  color: string;
  opacity: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  showLabel: boolean;
}

export interface LoadCalculationCheck {
  id: string;
  type: 'service_size' | 'feeder_size' | 'branch_circuit' | 'neutral_load' | 'demand_factor';
  
  // Calculation data
  calculatedValue: number;
  necRequirement: number;
  safetyFactor: number;
  tolerance: number;
  
  // Results
  compliant: boolean;
  utilizationPercent: number;
  necReference: string;
  
  // Recommendations
  recommendedSize?: number;
  upgradeSuggestion?: string;
  energyEfficiencyNote?: string;
}

export interface GroundingCompliance {
  id: string;
  componentId: string;
  
  // Grounding requirements
  requiresEquipmentGround: boolean;
  hasEquipmentGround: boolean;
  groundingConductorSize: string;
  requiredGroundingSize: string;
  
  // Bonding requirements
  requiresBonding: boolean;
  hasBonding: boolean;
  bondingMethod: string;
  
  // Compliance status
  compliant: boolean;
  violations: string[];
  necReferences: string[];
}

export interface ComplianceSettings {
  // Code edition
  necEdition: '2017' | '2020' | '2023';
  
  // Check preferences
  enableRealTimeChecking: boolean;
  checkOnEdit: boolean;
  checkOnSave: boolean;
  showAllViolations: boolean;
  
  // Visual preferences
  showClearanceZones: boolean;
  showComplianceIcons: boolean;
  highlightViolations: boolean;
  
  // Severity filters
  showErrors: boolean;
  showWarnings: boolean;
  showInfo: boolean;
  
  // Local code variations
  ahj: string; // Authority Having Jurisdiction
  localCodes: string[];
  customRules: NECRule[];
  
  // Auto-correction
  enableAutoCorrection: boolean;
  confirmBeforeCorrection: boolean;
}

export class SLDNECComplianceService {
  private necRules: Map<string, NECRule> = new Map();
  private violations: Map<string, ComplianceViolation> = new Map();
  private clearanceZones: Map<string, ClearanceZone> = new Map();
  private settings: ComplianceSettings;
  private lastCheckTimestamp: Date = new Date();

  constructor() {
    this.settings = {
      necEdition: '2023',
      enableRealTimeChecking: true,
      checkOnEdit: true,
      checkOnSave: true,
      showAllViolations: true,
      showClearanceZones: true,
      showComplianceIcons: true,
      highlightViolations: true,
      showErrors: true,
      showWarnings: true,
      showInfo: false,
      ahj: '',
      localCodes: [],
      customRules: [],
      enableAutoCorrection: false,
      confirmBeforeCorrection: true
    };

    this.initializeNECRules();
  }

  /**
   * Initialize standard NEC rules and requirements
   */
  private initializeNECRules(): void {
    const standardRules: NECRule[] = [
      // Article 110.26 - Working Space
      {
        id: 'nec_110_26_working_space',
        article: '110',
        section: '110.26(A)',
        title: 'Working Space Requirements',
        description: 'Electrical equipment must have adequate working space for safe operation and maintenance',
        category: 'clearance',
        severity: 'error',
        necEdition: 'all',
        appliesTo: ['main_panel', 'sub_panel', 'switchgear', 'mcc', 'transformer'],
        conditions: [
          { parameter: 'voltage', operator: '>', value: 50, unit: 'V' }
        ],
        requirements: [
          {
            type: 'minimum_distance',
            parameter: 'front_clearance',
            value: 36,
            unit: 'inches',
            description: 'Minimum 3 feet working space in front of equipment 0-600V'
          },
          {
            type: 'minimum_distance',
            parameter: 'width_clearance',
            value: 30,
            unit: 'inches',
            description: 'Working space width not less than 30" or width of equipment'
          },
          {
            type: 'minimum_distance',
            parameter: 'height_clearance',
            value: 78,
            unit: 'inches',
            description: 'Minimum 6.5 feet headroom (6 feet for existing installations)'
          }
        ],
        exceptions: ['Equipment in dwelling units may have reduced clearances per 110.26(A)(2)'],
        localVariations: false
      },

      // Article 110.26 - Dedicated Space
      {
        id: 'nec_110_26_dedicated_space',
        article: '110',
        section: '110.26(E)',
        title: 'Dedicated Equipment Space',
        description: 'Indoor electrical equipment must have dedicated space above and below',
        category: 'clearance',
        severity: 'warning',
        necEdition: 'all',
        appliesTo: ['main_panel', 'sub_panel', 'switchgear'],
        conditions: [
          { parameter: 'location', operator: '==', value: 'indoor' }
        ],
        requirements: [
          {
            type: 'minimum_distance',
            parameter: 'space_above',
            value: 30,
            unit: 'inches',
            description: 'Dedicated space from top of equipment to structural ceiling'
          },
          {
            type: 'minimum_distance',
            parameter: 'space_below',
            value: 0,
            unit: 'inches',
            description: 'Dedicated space from floor to bottom of equipment'
          }
        ],
        exceptions: ['Sprinkler piping and ventilation equipment allowed with specific conditions'],
        localVariations: false
      },

      // Article 230.70 - Service Disconnect Location
      {
        id: 'nec_230_70_service_disconnect',
        article: '230',
        section: '230.70(A)',
        title: 'Service Disconnect Location',
        description: 'Service disconnect must be at readily accessible location',
        category: 'installation',
        severity: 'error',
        necEdition: 'all',
        appliesTo: ['main_panel', 'service_disconnect'],
        conditions: [
          { parameter: 'type', operator: '==', value: 'service_entrance' }
        ],
        requirements: [
          {
            type: 'maximum_distance',
            parameter: 'height_above_floor',
            value: 79,
            unit: 'inches',
            description: 'Service disconnect not more than 6 feet 7 inches above floor'
          },
          {
            type: 'minimum_distance',
            parameter: 'height_above_floor',
            value: 48,
            unit: 'inches',
            description: 'Service disconnect at least 4 feet above floor in wet locations'
          }
        ],
        exceptions: ['Individual meter socket enclosures do not require disconnect'],
        localVariations: true
      },

      // Article 408.36 - Circuit Directory
      {
        id: 'nec_408_36_circuit_directory',
        article: '408',
        section: '408.36(A)',
        title: 'Circuit Directory Required',
        description: 'Panelboards must have circuit directories identifying each circuit',
        category: 'installation',
        severity: 'warning',
        necEdition: 'all',
        appliesTo: ['main_panel', 'sub_panel'],
        conditions: [],
        requirements: [
          {
            type: 'required_component',
            parameter: 'circuit_directory',
            value: 'required',
            description: 'Circuit directory must be permanently affixed to panelboard'
          }
        ],
        exceptions: [],
        localVariations: false
      },

      // Article 625.40 - EVSE Installation
      {
        id: 'nec_625_40_evse_installation',
        article: '625',
        section: '625.40',
        title: 'EVSE Installation Requirements',
        description: 'Electric vehicle supply equipment installation requirements',
        category: 'installation',
        severity: 'error',
        necEdition: 'all',
        appliesTo: ['evse_l1', 'evse_l2', 'evse_l3'],
        conditions: [],
        requirements: [
          {
            type: 'minimum_distance',
            parameter: 'parking_space_distance',
            value: 300,
            unit: 'inches',
            description: 'EVSE within 25 feet of intended parking space'
          },
          {
            type: 'minimum_distance',
            parameter: 'ground_clearance',
            value: 18,
            unit: 'inches',
            description: 'Connector storage at least 18 inches above floor level'
          }
        ],
        exceptions: ['Overhead connector storage allowed'],
        localVariations: true
      },

      // Article 705.12 - Solar Interconnection
      {
        id: 'nec_705_12_solar_interconnection',
        article: '705',
        section: '705.12(B)(3)(2)',
        title: 'Solar 120% Rule',
        description: 'Solar interconnection overcurrent protection requirements',
        category: 'sizing',
        severity: 'error',
        necEdition: 'all',
        appliesTo: ['solar_inverter', 'solar_combiner'],
        conditions: [
          { parameter: 'interconnection_type', operator: '==', value: 'supply_side' }
        ],
        requirements: [
          {
            type: 'calculation_check',
            parameter: 'bus_rating_check',
            value: 120,
            unit: 'percent',
            description: 'Sum of OCPD ratings shall not exceed 120% of busbar rating'
          }
        ],
        exceptions: ['Supply-side connections exempt from 120% rule'],
        localVariations: false
      },

      // Article 700.12 - Emergency System Sources
      {
        id: 'nec_700_12_emergency_sources',
        article: '700',
        section: '700.12',
        title: 'Emergency Source Requirements',
        description: 'Emergency systems must have proper source and transfer equipment',
        category: 'installation',
        severity: 'error',
        necEdition: 'all',
        appliesTo: ['generator', 'ups', 'battery_system'],
        conditions: [
          { parameter: 'system_type', operator: '==', value: 'emergency' }
        ],
        requirements: [
          {
            type: 'required_component',
            parameter: 'transfer_switch',
            value: 'automatic',
            description: 'Emergency systems require automatic transfer equipment'
          },
          {
            type: 'calculation_check',
            parameter: 'load_capacity',
            value: 100,
            unit: 'percent',
            description: 'Emergency source must handle 100% of emergency loads'
          }
        ],
        exceptions: [],
        localVariations: false
      },

      // Article 250.52 - Grounding Electrodes
      {
        id: 'nec_250_52_grounding_electrodes',
        article: '250',
        section: '250.52',
        title: 'Grounding Electrode System',
        description: 'Required grounding electrodes must be bonded together',
        category: 'grounding',
        severity: 'error',
        necEdition: 'all',
        appliesTo: ['grounding_electrode', 'service_entrance'],
        conditions: [],
        requirements: [
          {
            type: 'minimum_size',
            parameter: 'grounding_conductor',
            value: 4,
            unit: 'AWG',
            description: 'Grounding electrode conductor minimum #4 AWG copper'
          },
          {
            type: 'required_component',
            parameter: 'electrode_bonding',
            value: 'required',
            description: 'All available grounding electrodes must be bonded together'
          }
        ],
        exceptions: ['Single electrode acceptable if resistance less than 25 ohms'],
        localVariations: false
      }
    ];

    standardRules.forEach(rule => {
      this.necRules.set(rule.id, rule);
    });
  }

  /**
   * Perform comprehensive compliance check on diagram
   */
  checkCompliance(components: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    specifications?: Record<string, any>;
    connections?: string[];
  }>): ComplianceViolation[] {
    // Clear previous violations
    this.violations.clear();
    this.clearanceZones.clear();

    // Check each component against applicable rules
    components.forEach(component => {
      this.checkComponentCompliance(component, components);
    });

    // Check system-level compliance
    this.checkSystemCompliance(components);

    // Update last check timestamp
    this.lastCheckTimestamp = new Date();

    return Array.from(this.violations.values());
  }

  /**
   * Check individual component compliance
   */
  private checkComponentCompliance(
    component: any,
    allComponents: any[]
  ): void {
    // Find applicable rules for this component type
    const applicableRules = Array.from(this.necRules.values())
      .filter(rule => 
        rule.appliesTo.includes(component.type) &&
        (rule.necEdition === 'all' || rule.necEdition === this.settings.necEdition)
      );

    applicableRules.forEach(rule => {
      // Check if rule conditions are met
      if (this.evaluateConditions(rule.conditions, component)) {
        // Check each requirement
        rule.requirements.forEach(requirement => {
          const violation = this.checkRequirement(rule, requirement, component, allComponents);
          if (violation) {
            this.violations.set(violation.id, violation);
          }
        });

        // Create clearance zones for clearance rules
        if (rule.category === 'clearance') {
          const clearanceZone = this.createClearanceZone(rule, component);
          if (clearanceZone) {
            this.clearanceZones.set(clearanceZone.id, clearanceZone);
          }
        }
      }
    });
  }

  /**
   * Evaluate rule conditions against component
   */
  private evaluateConditions(conditions: NECCondition[], component: any): boolean {
    return conditions.every(condition => {
      const componentValue = this.getComponentParameter(component, condition.parameter);
      
      switch (condition.operator) {
        case '>':
          return componentValue > condition.value;
        case '<':
          return componentValue < condition.value;
        case '>=':
          return componentValue >= condition.value;
        case '<=':
          return componentValue <= condition.value;
        case '==':
          return componentValue === condition.value;
        case '!=':
          return componentValue !== condition.value;
        case 'contains':
          return String(componentValue).includes(String(condition.value));
        case 'within_range':
          const [min, max] = condition.value;
          return componentValue >= min && componentValue <= max;
        default:
          return true;
      }
    });
  }

  /**
   * Get component parameter value
   */
  private getComponentParameter(component: any, parameter: string): any {
    // Handle nested parameters
    if (parameter.includes('.')) {
      const parts = parameter.split('.');
      let value = component;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }

    // Direct parameter access
    return component[parameter] || component.specifications?.[parameter];
  }

  /**
   * Check specific requirement against component
   */
  private checkRequirement(
    rule: NECRule,
    requirement: NECRequirement,
    component: any,
    allComponents: any[]
  ): ComplianceViolation | null {
    switch (requirement.type) {
      case 'minimum_distance':
        return this.checkMinimumDistance(rule, requirement, component, allComponents);
      case 'maximum_distance':
        return this.checkMaximumDistance(rule, requirement, component, allComponents);
      case 'minimum_size':
        return this.checkMinimumSize(rule, requirement, component);
      case 'maximum_size':
        return this.checkMaximumSize(rule, requirement, component);
      case 'required_component':
        return this.checkRequiredComponent(rule, requirement, component, allComponents);
      case 'prohibited_component':
        return this.checkProhibitedComponent(rule, requirement, component, allComponents);
      case 'calculation_check':
        return this.checkCalculation(rule, requirement, component, allComponents);
      default:
        return null;
    }
  }

  /**
   * Check minimum distance requirement
   */
  private checkMinimumDistance(
    rule: NECRule,
    requirement: NECRequirement,
    component: any,
    allComponents: any[]
  ): ComplianceViolation | null {
    const parameterValue = this.getDistanceParameter(component, requirement.parameter, allComponents);
    const requiredValue = requirement.value as number;
    const tolerance = requirement.tolerance || 0;

    if (parameterValue < requiredValue - tolerance) {
      return this.createViolation(
        rule,
        component,
        'Insufficient clearance distance',
        `${requirement.description}. Current: ${parameterValue}", Required: ${requiredValue}"`,
        parameterValue,
        requiredValue,
        'distance_line'
      );
    }

    return null;
  }

  /**
   * Check maximum distance requirement
   */
  private checkMaximumDistance(
    rule: NECRule,
    requirement: NECRequirement,
    component: any,
    allComponents: any[]
  ): ComplianceViolation | null {
    const parameterValue = this.getDistanceParameter(component, requirement.parameter, allComponents);
    const requiredValue = requirement.value as number;
    const tolerance = requirement.tolerance || 0;

    if (parameterValue > requiredValue + tolerance) {
      return this.createViolation(
        rule,
        component,
        'Excessive distance',
        `${requirement.description}. Current: ${parameterValue}", Maximum: ${requiredValue}"`,
        parameterValue,
        requiredValue,
        'warning_icon'
      );
    }

    return null;
  }

  /**
   * Check minimum size requirement
   */
  private checkMinimumSize(
    rule: NECRule,
    requirement: NECRequirement,
    component: any
  ): ComplianceViolation | null {
    const parameterValue = this.getComponentParameter(component, requirement.parameter);
    const requiredValue = requirement.value;

    if (this.compareSize(parameterValue, requiredValue) < 0) {
      return this.createViolation(
        rule,
        component,
        'Undersized component',
        `${requirement.description}. Current: ${parameterValue}, Required: ${requiredValue} minimum`,
        parameterValue,
        requiredValue,
        'error_icon'
      );
    }

    return null;
  }

  /**
   * Check required component
   */
  private checkRequiredComponent(
    rule: NECRule,
    requirement: NECRequirement,
    component: any,
    allComponents: any[]
  ): ComplianceViolation | null {
    const requiredType = requirement.value as string;
    
    // Check if required component exists near this component
    const hasRequiredComponent = allComponents.some(comp => 
      comp.type === requiredType &&
      this.getDistance(component.position, comp.position) < 100 // Within 100 pixels
    );

    if (!hasRequiredComponent) {
      return this.createViolation(
        rule,
        component,
        'Missing required component',
        `${requirement.description}. Required: ${requiredType}`,
        'none',
        requiredType,
        'error_icon'
      );
    }

    return null;
  }

  /**
   * Check calculation-based requirement
   */
  private checkCalculation(
    rule: NECRule,
    requirement: NECRequirement,
    component: any,
    allComponents: any[]
  ): ComplianceViolation | null {
    // Implement specific calculation checks based on parameter
    switch (requirement.parameter) {
      case 'bus_rating_check':
        return this.check120PercentRule(rule, requirement, component, allComponents);
      case 'load_capacity':
        return this.checkLoadCapacity(rule, requirement, component, allComponents);
      default:
        return null;
    }
  }

  /**
   * Check 120% rule for solar interconnection
   */
  private check120PercentRule(
    rule: NECRule,
    requirement: NECRequirement,
    component: any,
    allComponents: any[]
  ): ComplianceViolation | null {
    const panelComponents = allComponents.filter(comp => 
      comp.type === 'main_panel' || comp.type === 'sub_panel'
    );

    for (const panel of panelComponents) {
      const busRating = panel.specifications?.busRating || 200;
      const totalOCPD = this.calculateTotalOCPD(panel, allComponents);
      const allowedTotal = busRating * 1.2;

      if (totalOCPD > allowedTotal) {
        return this.createViolation(
          rule,
          component,
          '120% rule violation',
          `Total OCPD exceeds 120% of bus rating. Current: ${totalOCPD}A, Allowed: ${allowedTotal}A`,
          totalOCPD,
          allowedTotal,
          'error_icon'
        );
      }
    }

    return null;
  }

  /**
   * Calculate total OCPD ratings
   */
  private calculateTotalOCPD(panel: any, allComponents: any[]): number {
    // Find all breakers connected to this panel
    const breakers = allComponents.filter(comp => 
      comp.type.includes('breaker') && 
      comp.parentPanel === panel.id
    );

    return breakers.reduce((total, breaker) => {
      return total + (breaker.specifications?.amperage || 0);
    }, 0);
  }

  /**
   * Get distance parameter value
   */
  private getDistanceParameter(component: any, parameter: string, allComponents: any[]): number {
    switch (parameter) {
      case 'front_clearance':
        return this.calculateFrontClearance(component, allComponents);
      case 'width_clearance':
        return this.calculateWidthClearance(component, allComponents);
      case 'height_clearance':
        return this.calculateHeightClearance(component);
      case 'height_above_floor':
        return component.position.y + component.size.height;
      default:
        return this.getComponentParameter(component, parameter) || 0;
    }
  }

  /**
   * Calculate front clearance space
   */
  private calculateFrontClearance(component: any, allComponents: any[]): number {
    const componentRight = component.position.x + component.size.width;
    
    // Find nearest component in front (to the right)
    const obstaclesInFront = allComponents.filter(comp => 
      comp.id !== component.id &&
      comp.position.x > componentRight &&
      Math.abs(comp.position.y - component.position.y) < component.size.height
    );

    if (obstaclesInFront.length === 0) {
      return 72; // Assume adequate clearance if no obstacles
    }

    const nearestObstacle = obstaclesInFront.reduce((nearest, comp) => 
      comp.position.x < nearest.position.x ? comp : nearest
    );

    return nearestObstacle.position.x - componentRight;
  }

  /**
   * Calculate width clearance
   */
  private calculateWidthClearance(component: any, allComponents: any[]): number {
    // Return component width or 30", whichever is greater
    return Math.max(component.size.width, 30);
  }

  /**
   * Calculate height clearance
   */
  private calculateHeightClearance(component: any): number {
    // Assume 8' ceiling height for calculation
    const ceilingHeight = 96;
    const componentTop = component.position.y;
    return ceilingHeight - componentTop;
  }

  /**
   * Create clearance zone visualization
   */
  private createClearanceZone(rule: NECRule, component: any): ClearanceZone | null {
    if (!this.settings.showClearanceZones) return null;

    const clearanceZoneId = `clearance_${component.id}_${rule.id}`;
    
    // Determine clearance zone based on rule
    let dimensions = { width: 0, height: 0 };
    let type: ClearanceZone['type'] = 'working_space';
    
    if (rule.id === 'nec_110_26_working_space') {
      dimensions = {
        width: Math.max(component.size.width, 30),
        height: 36 // 3 feet in front
      };
      type = 'working_space';
    } else if (rule.id === 'nec_110_26_dedicated_space') {
      dimensions = {
        width: component.size.width,
        height: 30 // 30" above
      };
      type = 'dedicated_space';
    }

    return {
      id: clearanceZoneId,
      componentId: component.id,
      type,
      center: {
        x: component.position.x + component.size.width / 2,
        y: component.position.y + component.size.height / 2
      },
      dimensions,
      shape: 'rectangle',
      necReference: `${rule.article}.${rule.section}`,
      description: rule.title,
      minimumClearance: 36,
      unit: 'inches',
      color: type === 'working_space' ? '#ef4444' : '#f59e0b',
      opacity: 0.2,
      borderStyle: 'dashed',
      showLabel: true
    };
  }

  /**
   * Create compliance violation record
   */
  private createViolation(
    rule: NECRule,
    component: any,
    title: string,
    description: string,
    currentValue: any,
    requiredValue: any,
    visualIndicator: ComplianceViolation['visualIndicator']
  ): ComplianceViolation {
    const violationId = `violation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    return {
      id: violationId,
      ruleId: rule.id,
      componentId: component.id,
      severity: rule.severity,
      title,
      description,
      necReference: `NEC ${rule.article}.${rule.section}`,
      currentValue,
      requiredValue,
      location: {
        x: component.position.x + component.size.width / 2,
        y: component.position.y + component.size.height / 2
      },
      affectedArea: {
        x: component.position.x - 10,
        y: component.position.y - 10,
        width: component.size.width + 20,
        height: component.size.height + 20
      },
      visualIndicator,
      suggestions: this.generateSuggestions(rule, component),
      autoCorrectAvailable: this.isAutoCorrectAvailable(rule, component),
      acknowledged: false,
      waived: false,
      dateDetected: new Date(),
      lastChecked: new Date()
    };
  }

  /**
   * Generate correction suggestions
   */
  private generateSuggestions(rule: NECRule, component: any): string[] {
    const suggestions: string[] = [];

    switch (rule.category) {
      case 'clearance':
        suggestions.push('Relocate component to provide adequate clearance');
        suggestions.push('Remove obstructions from clearance area');
        suggestions.push('Consider alternative component placement');
        break;
      case 'sizing':
        suggestions.push('Upgrade to larger rated component');
        suggestions.push('Verify load calculations');
        suggestions.push('Consider load management systems');
        break;
      case 'installation':
        suggestions.push('Review installation requirements');
        suggestions.push('Add required components or features');
        suggestions.push('Consult local electrical inspector');
        break;
      case 'grounding':
        suggestions.push('Install proper grounding conductors');
        suggestions.push('Verify grounding electrode connections');
        suggestions.push('Check bonding requirements');
        break;
      default:
        suggestions.push('Review NEC requirements');
        suggestions.push('Consult with qualified electrical engineer');
        break;
    }

    return suggestions;
  }

  /**
   * Check if auto-correction is available
   */
  private isAutoCorrectAvailable(rule: NECRule, component: any): boolean {
    // Auto-correction available for certain types of violations
    return rule.category === 'clearance' || rule.category === 'sizing';
  }

  /**
   * Check system-level compliance
   */
  private checkSystemCompliance(components: any[]): void {
    // Check overall system requirements
    this.checkServiceSizing(components);
    this.checkGroundingSystem(components);
    this.checkEmergencySystemCompliance(components);
  }

  /**
   * Check service sizing compliance
   */
  private checkServiceSizing(components: any[]): void {
    const mainPanels = components.filter(comp => comp.type === 'main_panel');
    
    mainPanels.forEach(panel => {
      const totalLoad = this.calculateConnectedLoad(panel, components);
      const panelRating = panel.specifications?.rating || 200;
      
      if (totalLoad > panelRating * 0.8) { // 80% rule
        const violation = this.createViolation(
          this.necRules.get('nec_230_70_service_disconnect')!,
          panel,
          'Service oversized',
          `Connected load exceeds 80% of service rating. Load: ${totalLoad}A, Rating: ${panelRating}A`,
          totalLoad,
          panelRating * 0.8,
          'warning_icon'
        );
        this.violations.set(violation.id, violation);
      }
    });
  }

  /**
   * Calculate connected load
   */
  private calculateConnectedLoad(panel: any, components: any[]): number {
    // Find all loads connected to this panel
    const connectedLoads = components.filter(comp => 
      comp.parentPanel === panel.id && 
      (comp.specifications?.power || comp.specifications?.amperage)
    );

    return connectedLoads.reduce((total, load) => {
      const amperage = load.specifications?.amperage || 
        (load.specifications?.power / (load.specifications?.voltage || 240));
      return total + amperage;
    }, 0);
  }

  /**
   * Check grounding system compliance
   */
  private checkGroundingSystem(components: any[]): void {
    const groundingElectrodes = components.filter(comp => comp.type === 'grounding_electrode');
    
    if (groundingElectrodes.length === 0) {
      // Create system-level violation for missing grounding
      const mainPanel = components.find(comp => comp.type === 'main_panel');
      if (mainPanel) {
        const violation = this.createViolation(
          this.necRules.get('nec_250_52_grounding_electrodes')!,
          mainPanel,
          'Missing grounding electrode system',
          'Grounding electrode system required per NEC 250.52',
          'none',
          'grounding_electrode_system',
          'error_icon'
        );
        this.violations.set(violation.id, violation);
      }
    }
  }

  /**
   * Check emergency system compliance
   */
  private checkEmergencySystemCompliance(components: any[]): void {
    const emergencyComponents = components.filter(comp => 
      comp.specifications?.systemType === 'emergency'
    );

    if (emergencyComponents.length > 0) {
      // Check for automatic transfer switch
      const hasATS = components.some(comp => comp.type === 'transfer_switch');
      
      if (!hasATS) {
        const violation = this.createViolation(
          this.necRules.get('nec_700_12_emergency_sources')!,
          emergencyComponents[0],
          'Missing automatic transfer switch',
          'Emergency systems require automatic transfer equipment per NEC 700.12',
          'none',
          'automatic_transfer_switch',
          'error_icon'
        );
        this.violations.set(violation.id, violation);
      }
    }
  }

  /**
   * Utility functions
   */
  private compareSize(current: any, required: any): number {
    // Compare wire sizes, ratings, etc.
    if (typeof current === 'number' && typeof required === 'number') {
      return current - required;
    }
    
    // Handle AWG wire sizes
    if (typeof current === 'string' && typeof required === 'string') {
      const awgSizes = ['18', '16', '14', '12', '10', '8', '6', '4', '2', '1', '1/0', '2/0', '3/0', '4/0'];
      const currentIndex = awgSizes.indexOf(current);
      const requiredIndex = awgSizes.indexOf(required);
      
      if (currentIndex !== -1 && requiredIndex !== -1) {
        return requiredIndex - currentIndex; // Larger index = smaller wire
      }
    }
    
    return 0;
  }

  private getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Public API methods
   */

  /**
   * Get all current violations
   */
  getViolations(): ComplianceViolation[] {
    return Array.from(this.violations.values())
      .filter(violation => {
        if (!this.settings.showErrors && violation.severity === 'error') return false;
        if (!this.settings.showWarnings && violation.severity === 'warning') return false;
        if (!this.settings.showInfo && violation.severity === 'info') return false;
        return true;
      });
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: 'error' | 'warning' | 'info'): ComplianceViolation[] {
    return Array.from(this.violations.values())
      .filter(violation => violation.severity === severity);
  }

  /**
   * Get clearance zones for visualization
   */
  getClearanceZones(): ClearanceZone[] {
    return Array.from(this.clearanceZones.values());
  }

  /**
   * Acknowledge violation
   */
  acknowledgeViolation(violationId: string): boolean {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Waive violation with reason
   */
  waiveViolation(violationId: string, reason: string): boolean {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.waived = true;
      violation.waiverReason = reason;
      return true;
    }
    return false;
  }

  /**
   * Update compliance settings
   */
  updateSettings(newSettings: Partial<ComplianceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): ComplianceSettings {
    return { ...this.settings };
  }

  /**
   * Export compliance report
   */
  exportComplianceReport(): {
    summary: {
      totalViolations: number;
      errorCount: number;
      warningCount: number;
      infoCount: number;
      lastChecked: Date;
      necEdition: string;
    };
    violations: ComplianceViolation[];
    clearanceZones: ClearanceZone[];
    settings: ComplianceSettings;
  } {
    const violations = this.getViolations();
    
    return {
      summary: {
        totalViolations: violations.length,
        errorCount: violations.filter(v => v.severity === 'error').length,
        warningCount: violations.filter(v => v.severity === 'warning').length,
        infoCount: violations.filter(v => v.severity === 'info').length,
        lastChecked: this.lastCheckTimestamp,
        necEdition: this.settings.necEdition
      },
      violations,
      clearanceZones: this.getClearanceZones(),
      settings: this.settings
    };
  }

  /**
   * Add custom NEC rule
   */
  addCustomRule(rule: Omit<NECRule, 'id'>): string {
    const ruleId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const customRule: NECRule = { id: ruleId, ...rule };
    
    this.necRules.set(ruleId, customRule);
    this.settings.customRules.push(customRule);
    
    return ruleId;
  }

  /**
   * Remove custom rule
   */
  removeCustomRule(ruleId: string): boolean {
    if (ruleId.startsWith('custom_')) {
      this.necRules.delete(ruleId);
      this.settings.customRules = this.settings.customRules.filter(r => r.id !== ruleId);
      return true;
    }
    return false;
  }

  /**
   * Clear all violations
   */
  clearViolations(): void {
    this.violations.clear();
    this.clearanceZones.clear();
  }
}

export default SLDNECComplianceService;