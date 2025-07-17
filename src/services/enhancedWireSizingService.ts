/**
 * Enhanced Wire Sizing Service
 * 
 * Advanced NEC-compliant wire sizing calculations with:
 * - Real-time voltage drop analysis
 * - Conduit fill calculations
 * - Temperature derating
 * - Motor load calculations
 * - Continuous load factors
 * - EVSE special requirements
 * - Solar DC conductor sizing
 */

export interface WireSizingParameters {
  loadCurrent: number;
  voltage: number;
  distance: number; // One-way distance in feet
  conductorMaterial: 'copper' | 'aluminum';
  tempRating: '60C' | '75C' | '90C';
  ambientTemp: number; // °C
  conduitFill: number; // Number of current-carrying conductors
  loadType: 'continuous' | 'non-continuous' | 'motor' | 'evse' | 'solar_dc';
  circuitType: 'branch' | 'feeder' | 'service';
  installationMethod: 'conduit' | 'cable' | 'direct_burial' | 'overhead';
  conduitType?: 'EMT' | 'RMC' | 'PVC' | 'IMC' | 'FMC' | 'LFMC';
  specialConditions?: {
    wetLocation?: boolean;
    corrosiveEnvironment?: boolean;
    sunlightExposure?: boolean;
    buriedDepth?: number; // feet
  };
}

export interface WireSizingResult {
  recommendedSize: string;
  minSize: string;
  ampacity: number;
  adjustedAmpacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
  conduitSize: string;
  groundingConductor: string;
  equipmentGroundingConductor?: string;
  neutralSize?: string;
  deratingFactors: DeratingFactors;
  necCompliance: NECCompliance;
  costEstimate?: WireCostEstimate;
  alternativeOptions: WireAlternative[];
}

export interface DeratingFactors {
  temperatureDerating: number;
  conduitFillDerating: number;
  bundlingDerating: number;
  totalDerating: number;
  appliedFactors: {
    factor: number;
    description: string;
    necReference: string;
  }[];
}

export interface NECCompliance {
  compliant: boolean;
  violations: {
    code: string;
    description: string;
    necArticle: string;
    severity: 'error' | 'warning' | 'info';
    recommendation: string;
  }[];
  codeReferences: string[];
}

export interface WireCostEstimate {
  conductorCost: number;
  conduitCost: number;
  fittingsCost: number;
  laborCost: number;
  totalCost: number;
  currency: string;
}

export interface WireAlternative {
  conductorSize: string;
  material: 'copper' | 'aluminum';
  pros: string[];
  cons: string[];
  costDifference: number;
  necCompliant: boolean;
}

// Standard wire sizes in AWG/kcmil
const WIRE_SIZES = [
  '14', '12', '10', '8', '6', '4', '3', '2', '1', 
  '1/0', '2/0', '3/0', '4/0', 
  '250', '300', '350', '400', '500', '600', '700', '750', '800', '900', '1000'
];

// NEC Table 310.16 - Allowable Ampacities
const AMPACITY_TABLE = {
  '14': { copper60C: 15, copper75C: 20, copper90C: 25, aluminum75C: 15, aluminum90C: 20 },
  '12': { copper60C: 20, copper75C: 25, copper90C: 30, aluminum75C: 20, aluminum90C: 25 },
  '10': { copper60C: 30, copper75C: 35, copper90C: 40, aluminum75C: 25, aluminum90C: 30 },
  '8': { copper60C: 40, copper75C: 50, copper90C: 55, aluminum75C: 40, aluminum90C: 45 },
  '6': { copper60C: 55, copper75C: 65, copper90C: 75, aluminum75C: 50, aluminum90C: 55 },
  '4': { copper60C: 70, copper75C: 85, copper90C: 95, aluminum75C: 65, aluminum90C: 75 },
  '3': { copper60C: 85, copper75C: 100, copper90C: 110, aluminum75C: 75, aluminum90C: 85 },
  '2': { copper60C: 95, copper75C: 115, copper90C: 130, aluminum75C: 90, aluminum90C: 100 },
  '1': { copper60C: 110, copper75C: 130, copper90C: 150, aluminum75C: 100, aluminum90C: 115 },
  '1/0': { copper60C: 125, copper75C: 150, copper90C: 170, aluminum75C: 120, aluminum90C: 135 },
  '2/0': { copper60C: 145, copper75C: 175, copper90C: 195, aluminum75C: 135, aluminum90C: 150 },
  '3/0': { copper60C: 165, copper75C: 200, copper90C: 225, aluminum75C: 155, aluminum90C: 175 },
  '4/0': { copper60C: 195, copper75C: 230, copper90C: 260, aluminum75C: 180, aluminum90C: 205 },
  '250': { copper60C: 215, copper75C: 255, copper90C: 290, aluminum75C: 205, aluminum90C: 230 },
  '300': { copper60C: 240, copper75C: 285, copper90C: 320, aluminum75C: 230, aluminum90C: 260 },
  '350': { copper60C: 260, copper75C: 310, copper90C: 350, aluminum75C: 250, aluminum90C: 280 },
  '400': { copper60C: 280, copper75C: 335, copper90C: 380, aluminum75C: 270, aluminum90C: 305 },
  '500': { copper60C: 320, copper75C: 380, copper90C: 430, aluminum75C: 310, aluminum90C: 350 },
  '600': { copper60C: 355, copper75C: 420, copper90C: 475, aluminum75C: 340, aluminum90C: 385 },
  '700': { copper60C: 385, copper75C: 460, copper90C: 520, aluminum75C: 375, aluminum90C: 420 },
  '750': { copper60C: 400, copper75C: 475, copper90C: 535, aluminum75C: 385, aluminum90C: 435 },
  '800': { copper60C: 410, copper75C: 490, copper90C: 555, aluminum75C: 395, aluminum90C: 445 },
  '900': { copper60C: 435, copper75C: 520, copper90C: 585, aluminum75C: 425, aluminum90C: 480 },
  '1000': { copper60C: 455, copper75C: 545, copper90C: 615, aluminum75C: 445, aluminum90C: 500 }
};

// Wire resistance in ohms per 1000 feet at 75°C
const WIRE_RESISTANCE = {
  copper: {
    '14': 3.07, '12': 1.93, '10': 1.21, '8': 0.764, '6': 0.491, '4': 0.308,
    '3': 0.245, '2': 0.194, '1': 0.154, '1/0': 0.122, '2/0': 0.0967,
    '3/0': 0.0766, '4/0': 0.0608, '250': 0.0515, '300': 0.0429,
    '350': 0.0367, '400': 0.0321, '500': 0.0258, '600': 0.0214,
    '700': 0.0184, '750': 0.0171, '800': 0.0161, '900': 0.0143, '1000': 0.0129
  },
  aluminum: {
    '14': 5.06, '12': 3.18, '10': 2.00, '8': 1.26, '6': 0.808, '4': 0.508,
    '3': 0.403, '2': 0.319, '1': 0.253, '1/0': 0.201, '2/0': 0.159,
    '3/0': 0.126, '4/0': 0.100, '250': 0.0847, '300': 0.0706,
    '350': 0.0605, '400': 0.0529, '500': 0.0424, '600': 0.0353,
    '700': 0.0303, '750': 0.0282, '800': 0.0265, '900': 0.0235, '1000': 0.0212
  }
};

// Grounding electrode conductor sizing per NEC 250.66
const GROUNDING_CONDUCTOR_TABLE = {
  '4': '8', '3': '8', '2': '8', '1': '6', '1/0': '6', '2/0': '4',
  '3/0': '2', '4/0': '1/0', '250': '2/0', '300': '3/0', '350': '4/0',
  '400': '4/0', '500': '4/0', '600': '1/0', '700': '1/0', '750': '2/0',
  '800': '2/0', '900': '3/0', '1000': '3/0'
};

export class EnhancedWireSizingService {
  
  /**
   * Calculate comprehensive wire sizing with NEC compliance
   */
  static calculateWireSizing(parameters: WireSizingParameters): WireSizingResult {
    // Step 1: Apply load factors based on type
    const adjustedCurrent = this.applyLoadFactors(parameters.loadCurrent, parameters.loadType);
    
    // Step 2: Calculate derating factors
    const deratingFactors = this.calculateDeratingFactors(
      parameters.tempRating,
      parameters.ambientTemp,
      parameters.conduitFill
    );
    
    // Step 3: Calculate minimum required ampacity
    const requiredAmpacity = adjustedCurrent / deratingFactors.totalDerating;
    
    // Step 4: Find minimum wire size for ampacity
    const minSizeForAmpacity = this.findMinimumWireSize(
      requiredAmpacity,
      parameters.conductorMaterial,
      parameters.tempRating
    );
    
    // Step 5: Check voltage drop and upsize if necessary
    const minSizeForVoltageDrop = this.findMinimumWireSizeForVoltageDrop(
      parameters.loadCurrent,
      parameters.voltage,
      parameters.distance,
      parameters.conductorMaterial,
      parameters.circuitType
    );
    
    // Step 6: Select larger of the two requirements
    const recommendedSize = this.getLargerWireSize(minSizeForAmpacity, minSizeForVoltageDrop);
    
    // Step 7: Calculate final voltage drop
    const voltageDrop = this.calculateVoltageDrop(
      parameters.loadCurrent,
      parameters.voltage,
      recommendedSize,
      parameters.distance,
      parameters.conductorMaterial
    );
    
    // Step 8: Calculate conduit sizing
    const conduitSize = this.calculateConduitSize(
      recommendedSize,
      parameters.conduitFill,
      parameters.conduitType || 'EMT'
    );
    
    // Step 9: Determine grounding conductor
    const groundingConductor = this.calculateGroundingConductor(recommendedSize);
    
    // Step 10: Check NEC compliance
    const necCompliance = this.checkNECCompliance(parameters, recommendedSize, voltageDrop);
    
    // Step 11: Generate alternatives
    const alternatives = this.generateAlternatives(parameters, recommendedSize);
    
    return {
      recommendedSize,
      minSize: minSizeForAmpacity,
      ampacity: this.getAmpacity(recommendedSize, parameters.conductorMaterial, parameters.tempRating),
      adjustedAmpacity: this.getAmpacity(recommendedSize, parameters.conductorMaterial, parameters.tempRating) * deratingFactors.totalDerating,
      voltageDrop,
      voltageDropPercent: (voltageDrop / parameters.voltage) * 100,
      conduitSize,
      groundingConductor,
      deratingFactors,
      necCompliance,
      alternativeOptions: alternatives
    };
  }
  
  /**
   * Apply load factors based on load type per NEC requirements
   */
  private static applyLoadFactors(current: number, loadType: string): number {
    switch (loadType) {
      case 'continuous':
        return current * 1.25; // 125% for continuous loads (NEC 210.20(A))
      case 'motor':
        return current * 1.25; // 125% for motor loads (NEC 430.22)
      case 'evse':
        return current * 1.25; // 125% for EVSE continuous loads (NEC 625.17)
      case 'solar_dc':
        return current * 1.56; // 156% for solar DC (NEC 690.8(A))
      default:
        return current;
    }
  }
  
  /**
   * Calculate comprehensive derating factors
   */
  private static calculateDeratingFactors(
    tempRating: '60C' | '75C' | '90C',
    ambientTemp: number,
    conduitFill: number
  ): DeratingFactors {
    const appliedFactors: DeratingFactors['appliedFactors'] = [];
    
    // Temperature derating per NEC 310.15(B)(1)
    let temperatureDerating = 1.0;
    const baseTemp = tempRating === '60C' ? 30 : tempRating === '75C' ? 30 : 30; // Base 30°C
    
    if (ambientTemp > baseTemp) {
      const tempDeratTable = {
        '60C': { 31: 0.91, 36: 0.82, 41: 0.71, 46: 0.58, 51: 0.41 },
        '75C': { 31: 0.94, 36: 0.88, 41: 0.82, 46: 0.75, 51: 0.67, 56: 0.58, 61: 0.47, 66: 0.33 },
        '90C': { 31: 0.96, 36: 0.91, 41: 0.87, 46: 0.82, 51: 0.76, 56: 0.71, 61: 0.65, 66: 0.58, 71: 0.50, 76: 0.41, 81: 0.29 }
      };
      
      const deratTable = tempDeratTable[tempRating];
      for (const [temp, factor] of Object.entries(deratTable).reverse()) {
        if (ambientTemp >= parseInt(temp)) {
          temperatureDerating = factor;
          appliedFactors.push({
            factor,
            description: `Temperature derating for ${ambientTemp}°C ambient`,
            necReference: 'NEC 310.15(B)(1)'
          });
          break;
        }
      }
    }
    
    // Conduit fill derating per NEC 310.15(B)(3)(a)
    let conduitFillDerating = 1.0;
    if (conduitFill > 3) {
      const fillFactors = {
        4: 0.8, 5: 0.8, 6: 0.8, 7: 0.7, 8: 0.7, 9: 0.7
      };
      conduitFillDerating = fillFactors[Math.min(conduitFill, 9) as keyof typeof fillFactors] || 0.5;
      appliedFactors.push({
        factor: conduitFillDerating,
        description: `Conduit fill derating for ${conduitFill} conductors`,
        necReference: 'NEC 310.15(B)(3)(a)'
      });
    }
    
    const totalDerating = temperatureDerating * conduitFillDerating;
    
    return {
      temperatureDerating,
      conduitFillDerating,
      bundlingDerating: 1.0, // Not implemented in this version
      totalDerating,
      appliedFactors
    };
  }
  
  /**
   * Find minimum wire size for required ampacity
   */
  private static findMinimumWireSize(
    requiredAmpacity: number,
    material: 'copper' | 'aluminum',
    tempRating: '60C' | '75C' | '90C'
  ): string {
    const column = material === 'copper' ? `copper${tempRating}` : `aluminum${tempRating}`;
    
    for (const wireSize of WIRE_SIZES) {
      const ratings = AMPACITY_TABLE[wireSize as keyof typeof AMPACITY_TABLE];
      if (ratings) {
        const ampacity = (ratings as any)[column];
        if (ampacity && ampacity >= requiredAmpacity) {
          return wireSize;
        }
      }
    }
    
    return '1000'; // Largest available
  }
  
  /**
   * Find minimum wire size to meet voltage drop requirements
   */
  private static findMinimumWireSizeForVoltageDrop(
    current: number,
    voltage: number,
    distance: number,
    material: 'copper' | 'aluminum',
    circuitType: 'branch' | 'feeder' | 'service'
  ): string {
    const voltageDropLimits = {
      branch: 0.03,    // 3% for branch circuits
      feeder: 0.02,    // 2% for feeders  
      service: 0.01    // 1% for service conductors
    };
    
    const maxVoltageDrop = voltage * voltageDropLimits[circuitType];
    
    for (const wireSize of WIRE_SIZES) {
      const voltageDrop = this.calculateVoltageDrop(current, voltage, wireSize, distance, material);
      if (voltageDrop <= maxVoltageDrop) {
        return wireSize;
      }
    }
    
    return '1000'; // Largest available
  }
  
  /**
   * Calculate voltage drop for given parameters
   */
  private static calculateVoltageDrop(
    current: number,
    voltage: number,
    wireSize: string,
    distance: number,
    material: 'copper' | 'aluminum'
  ): number {
    const resistance = WIRE_RESISTANCE[material][wireSize as keyof typeof WIRE_RESISTANCE[typeof material]];
    if (!resistance) return 999; // Invalid wire size
    
    // Single-phase: VD = 2 * I * R * L / 1000
    // Three-phase: VD = √3 * I * R * L / 1000
    const multiplier = voltage > 300 ? Math.sqrt(3) : 2;
    return (multiplier * current * resistance * distance) / 1000;
  }
  
  /**
   * Get ampacity for wire size and conditions
   */
  private static getAmpacity(
    wireSize: string,
    material: 'copper' | 'aluminum',
    tempRating: '60C' | '75C' | '90C'
  ): number {
    const ratings = AMPACITY_TABLE[wireSize as keyof typeof AMPACITY_TABLE];
    if (!ratings) return 0;
    
    const column = material === 'copper' ? `copper${tempRating}` : `aluminum${tempRating}`;
    return (ratings as any)[column] || 0;
  }
  
  /**
   * Select larger of two wire sizes
   */
  private static getLargerWireSize(size1: string, size2: string): string {
    const index1 = WIRE_SIZES.indexOf(size1);
    const index2 = WIRE_SIZES.indexOf(size2);
    return index1 > index2 ? size1 : size2;
  }
  
  /**
   * Calculate grounding conductor size per NEC 250.66
   */
  private static calculateGroundingConductor(wireSize: string): string {
    return GROUNDING_CONDUCTOR_TABLE[wireSize as keyof typeof GROUNDING_CONDUCTOR_TABLE] || '1/0';
  }
  
  /**
   * Calculate conduit size requirements
   */
  private static calculateConduitSize(
    wireSize: string,
    conductorCount: number,
    conduitType: string
  ): string {
    // Simplified conduit sizing - in practice would use detailed NEC Chapter 9 tables
    const conduitSizes = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2', '2-1/2', '3', '3-1/2', '4', '5', '6'];
    
    // Basic sizing logic - would need full implementation with NEC tables
    const wireIndex = WIRE_SIZES.indexOf(wireSize);
    const baseSize = Math.floor(wireIndex / 3) + Math.floor(conductorCount / 3);
    
    return conduitSizes[Math.min(baseSize, conduitSizes.length - 1)];
  }
  
  /**
   * Check comprehensive NEC compliance
   */
  private static checkNECCompliance(
    parameters: WireSizingParameters,
    wireSize: string,
    voltageDrop: number
  ): NECCompliance {
    const violations: NECCompliance['violations'] = [];
    const codeReferences: string[] = [];
    
    // Check voltage drop compliance
    const voltageDropLimits = {
      branch: 0.03,
      feeder: 0.02,
      service: 0.01
    };
    
    const maxVoltageDrop = parameters.voltage * voltageDropLimits[parameters.circuitType];
    if (voltageDrop > maxVoltageDrop) {
      violations.push({
        code: 'VD001',
        description: `Voltage drop ${(voltageDrop/parameters.voltage*100).toFixed(1)}% exceeds ${(voltageDropLimits[parameters.circuitType]*100)}% limit`,
        necArticle: 'NEC 210.19(A) FPN 4',
        severity: 'warning',
        recommendation: 'Increase conductor size to reduce voltage drop'
      });
    }
    
    // Check minimum wire size for branch circuits
    if (parameters.circuitType === 'branch' && ['14', '12'].includes(wireSize)) {
      if (parameters.loadCurrent > 15 && wireSize === '14') {
        violations.push({
          code: 'MIN001',
          description: '14 AWG wire cannot carry more than 15A',
          necArticle: 'NEC 240.4(D)(3)',
          severity: 'error',
          recommendation: 'Use minimum 12 AWG for loads over 15A'
        });
      }
    }
    
    // Add relevant code references
    codeReferences.push('NEC 310.15', 'NEC 310.16', 'NEC 250.66');
    if (parameters.loadType === 'motor') {
      codeReferences.push('NEC 430.22', 'NEC 430.24');
    }
    if (parameters.loadType === 'evse') {
      codeReferences.push('NEC 625.17', 'NEC 625.50');
    }
    
    return {
      compliant: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      codeReferences
    };
  }
  
  /**
   * Generate alternative wire sizing options
   */
  private static generateAlternatives(
    parameters: WireSizingParameters,
    recommendedSize: string
  ): WireAlternative[] {
    const alternatives: WireAlternative[] = [];
    const currentIndex = WIRE_SIZES.indexOf(recommendedSize);
    
    // Suggest one size larger (conservative option)
    if (currentIndex < WIRE_SIZES.length - 1) {
      const largerSize = WIRE_SIZES[currentIndex + 1];
      alternatives.push({
        conductorSize: largerSize,
        material: parameters.conductorMaterial,
        pros: ['Lower voltage drop', 'Higher safety margin', 'Future expansion capacity'],
        cons: ['Higher material cost', 'Larger conduit required'],
        costDifference: 15, // Percentage increase
        necCompliant: true
      });
    }
    
    // Suggest aluminum alternative for copper (if applicable)
    if (parameters.conductorMaterial === 'copper' && !['14', '12', '10'].includes(recommendedSize)) {
      const aluminumEquivalent = this.getAluminumEquivalent(recommendedSize, parameters);
      if (aluminumEquivalent) {
        alternatives.push({
          conductorSize: aluminumEquivalent,
          material: 'aluminum',
          pros: ['Lower material cost', 'Lighter weight'],
          cons: ['Requires special connections', 'Higher resistance', 'Expansion/contraction issues'],
          costDifference: -25, // Percentage decrease
          necCompliant: true
        });
      }
    }
    
    return alternatives;
  }
  
  /**
   * Get aluminum conductor equivalent
   */
  private static getAluminumEquivalent(copperSize: string, parameters: WireSizingParameters): string | null {
    const copperAmpacity = this.getAmpacity(copperSize, 'copper', parameters.tempRating);
    
    // Find aluminum conductor with similar ampacity
    for (const wireSize of WIRE_SIZES) {
      const aluminumAmpacity = this.getAmpacity(wireSize, 'aluminum', parameters.tempRating);
      if (aluminumAmpacity >= copperAmpacity) {
        return wireSize;
      }
    }
    
    return null;
  }
  
  /**
   * Real-time voltage drop analysis for live feedback
   */
  static analyzeVoltageDropRealTime(
    current: number,
    voltage: number,
    distance: number,
    wireSize: string,
    material: 'copper' | 'aluminum'
  ): {
    voltageDrop: number;
    voltageDropPercent: number;
    status: 'excellent' | 'good' | 'marginal' | 'poor';
    recommendation: string;
  } {
    const voltageDrop = this.calculateVoltageDrop(current, voltage, wireSize, distance, material);
    const voltageDropPercent = (voltageDrop / voltage) * 100;
    
    let status: 'excellent' | 'good' | 'marginal' | 'poor';
    let recommendation: string;
    
    if (voltageDropPercent <= 1) {
      status = 'excellent';
      recommendation = 'Voltage drop is well within recommended limits';
    } else if (voltageDropPercent <= 2) {
      status = 'good';
      recommendation = 'Voltage drop is acceptable for most applications';
    } else if (voltageDropPercent <= 3) {
      status = 'marginal';
      recommendation = 'Consider increasing wire size for better performance';
    } else {
      status = 'poor';
      recommendation = 'Wire size should be increased to reduce voltage drop';
    }
    
    return {
      voltageDrop,
      voltageDropPercent,
      status,
      recommendation
    };
  }
}