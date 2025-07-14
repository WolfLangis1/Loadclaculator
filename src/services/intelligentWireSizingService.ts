/**
 * Intelligent Wire Sizing Service
 * 
 * Automatically calculates appropriate wire gauges based on component amperage ratings,
 * NEC requirements, voltage drop calculations, and installation conditions
 */

interface ComponentAmperageData {
  componentId: string;
  type: string;
  amperage: number;
  voltage: number;
  phases: number;
  powerFactor?: number;
  continuous?: boolean;
}

interface WireSizingParameters {
  amperage: number;
  voltage: number;
  length: number;
  ambientTemperature: number;
  installationMethod: 'conduit' | 'cable_tray' | 'direct_burial' | 'free_air';
  conductorCount: number;
  conduitFill: number;
  maxVoltageDrop: number;
  wireType: 'copper' | 'aluminum';
  temperatureRating: '60C' | '75C' | '90C';
  continuous: boolean;
}

interface WireSizingResult {
  recommendedAwg: string;
  ampacity: number;
  actualVoltageDrop: number;
  voltageDropPercent: number;
  deratingFactor: number;
  necCompliance: {
    compliant: boolean;
    violations: string[];
    warnings: string[];
  };
  costAnalysis?: {
    copperCost: number;
    aluminumCost: number;
    recommendation: 'copper' | 'aluminum';
  };
}

interface WireSpec {
  awg: string;
  area: number;
  ampacity: {
    copper: { '60C': number; '75C': number; '90C': number };
    aluminum: { '60C': number; '75C': number; '90C': number };
  };
  resistance: {
    copper: number; // ohms per 1000ft
    aluminum: number;
  };
  cost: {
    copper: number; // $ per foot
    aluminum: number;
  };
}

// NEC Table 310.15(B)(16) - Expanded wire specification database
const WIRE_SPECIFICATIONS: WireSpec[] = [
  {
    awg: '14',
    area: 4107,
    ampacity: {
      copper: { '60C': 15, '75C': 20, '90C': 25 },
      aluminum: { '60C': 0, '75C': 0, '90C': 0 }
    },
    resistance: { copper: 3.07, aluminum: 0 },
    cost: { copper: 0.45, aluminum: 0 }
  },
  {
    awg: '12',
    area: 6530,
    ampacity: {
      copper: { '60C': 20, '75C': 25, '90C': 30 },
      aluminum: { '60C': 15, '75C': 20, '90C': 25 }
    },
    resistance: { copper: 1.93, aluminum: 3.18 },
    cost: { copper: 0.65, aluminum: 0.25 }
  },
  {
    awg: '10',
    area: 10380,
    ampacity: {
      copper: { '60C': 30, '75C': 35, '90C': 40 },
      aluminum: { '60C': 25, '75C': 30, '90C': 35 }
    },
    resistance: { copper: 1.21, aluminum: 2.00 },
    cost: { copper: 1.05, aluminum: 0.38 }
  },
  {
    awg: '8',
    area: 16510,
    ampacity: {
      copper: { '60C': 40, '75C': 50, '90C': 55 },
      aluminum: { '60C': 30, '75C': 40, '90C': 45 }
    },
    resistance: { copper: 0.764, aluminum: 1.26 },
    cost: { copper: 1.65, aluminum: 0.58 }
  },
  {
    awg: '6',
    area: 26240,
    ampacity: {
      copper: { '60C': 55, '75C': 65, '90C': 75 },
      aluminum: { '60C': 40, '75C': 50, '90C': 60 }
    },
    resistance: { copper: 0.491, aluminum: 0.808 },
    cost: { copper: 2.45, aluminum: 0.85 }
  },
  {
    awg: '4',
    area: 41740,
    ampacity: {
      copper: { '60C': 70, '75C': 85, '90C': 95 },
      aluminum: { '60C': 55, '75C': 65, '90C': 75 }
    },
    resistance: { copper: 0.308, aluminum: 0.508 },
    cost: { copper: 3.85, aluminum: 1.25 }
  },
  {
    awg: '2',
    area: 66360,
    ampacity: {
      copper: { '60C': 95, '75C': 115, '90C': 130 },
      aluminum: { '60C': 75, '75C': 90, '90C': 100 }
    },
    resistance: { copper: 0.194, aluminum: 0.319 },
    cost: { copper: 6.15, aluminum: 1.95 }
  },
  {
    awg: '1',
    area: 83690,
    ampacity: {
      copper: { '60C': 110, '75C': 130, '90C': 150 },
      aluminum: { '60C': 85, '75C': 100, '90C': 115 }
    },
    resistance: { copper: 0.154, aluminum: 0.253 },
    cost: { copper: 7.75, aluminum: 2.45 }
  },
  {
    awg: '1/0',
    area: 105600,
    ampacity: {
      copper: { '60C': 125, '75C': 150, '90C': 170 },
      aluminum: { '60C': 100, '75C': 120, '90C': 135 }
    },
    resistance: { copper: 0.122, aluminum: 0.201 },
    cost: { copper: 9.75, aluminum: 3.05 }
  },
  {
    awg: '2/0',
    area: 133100,
    ampacity: {
      copper: { '60C': 145, '75C': 175, '90C': 195 },
      aluminum: { '60C': 115, '75C': 135, '90C': 150 }
    },
    resistance: { copper: 0.097, aluminum: 0.159 },
    cost: { copper: 12.25, aluminum: 3.85 }
  },
  {
    awg: '3/0',
    area: 167800,
    ampacity: {
      copper: { '60C': 165, '75C': 200, '90C': 225 },
      aluminum: { '60C': 130, '75C': 155, '90C': 175 }
    },
    resistance: { copper: 0.077, aluminum: 0.126 },
    cost: { copper: 15.45, aluminum: 4.85 }
  },
  {
    awg: '4/0',
    area: 211600,
    ampacity: {
      copper: { '60C': 195, '75C': 230, '90C': 260 },
      aluminum: { '60C': 150, '75C': 180, '90C': 205 }
    },
    resistance: { copper: 0.061, aluminum: 0.100 },
    cost: { copper: 19.45, aluminum: 6.15 }
  },
  {
    awg: '250',
    area: 250000,
    ampacity: {
      copper: { '60C': 215, '75C': 255, '90C': 290 },
      aluminum: { '60C': 170, '75C': 205, '90C': 230 }
    },
    resistance: { copper: 0.052, aluminum: 0.085 },
    cost: { copper: 23.85, aluminum: 7.45 }
  },
  {
    awg: '300',
    area: 300000,
    ampacity: {
      copper: { '60C': 240, '75C': 285, '90C': 320 },
      aluminum: { '60C': 190, '75C': 230, '90C': 260 }
    },
    resistance: { copper: 0.044, aluminum: 0.071 },
    cost: { copper: 28.65, aluminum: 8.95 }
  },
  {
    awg: '350',
    area: 350000,
    ampacity: {
      copper: { '60C': 260, '75C': 310, '90C': 350 },
      aluminum: { '60C': 210, '75C': 250, '90C': 280 }
    },
    resistance: { copper: 0.037, aluminum: 0.061 },
    cost: { copper: 33.45, aluminum: 10.45 }
  },
  {
    awg: '400',
    area: 400000,
    ampacity: {
      copper: { '60C': 280, '75C': 335, '90C': 380 },
      aluminum: { '60C': 225, '75C': 270, '90C': 305 }
    },
    resistance: { copper: 0.033, aluminum: 0.054 },
    cost: { copper: 38.25, aluminum: 11.95 }
  },
  {
    awg: '500',
    area: 500000,
    ampacity: {
      copper: { '60C': 320, '75C': 380, '90C': 430 },
      aluminum: { '60C': 260, '75C': 310, '90C': 350 }
    },
    resistance: { copper: 0.027, aluminum: 0.043 },
    cost: { copper: 47.85, aluminum: 14.95 }
  }
];

// Temperature correction factors from NEC Table 310.15(B)(2)(a)
const TEMPERATURE_CORRECTIONS = {
  '60C': {
    21: 1.08, 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71
  },
  '75C': {
    21: 1.02, 25: 1.01, 30: 1.00, 35: 0.99, 40: 0.97, 45: 0.95, 50: 0.94, 55: 0.92, 60: 0.90
  },
  '90C': {
    21: 1.02, 25: 1.01, 30: 1.00, 35: 0.99, 40: 0.98, 45: 0.97, 50: 0.95, 55: 0.94, 60: 0.92
  }
};

// Conduit fill derating factors from NEC Table 310.15(B)(3)(a)
const CONDUIT_FILL_DERATING = {
  4: 0.80,  // 4-6 conductors
  7: 0.70,  // 7-9 conductors
  10: 0.50, // 10-20 conductors
  21: 0.45, // 21-30 conductors
  31: 0.40, // 31-40 conductors
  41: 0.35  // 41+ conductors
};

export class IntelligentWireSizingService {
  
  /**
   * Calculate wire size based on component amperage and installation conditions
   */
  static calculateWireSize(params: WireSizingParameters): WireSizingResult {
    // Step 1: Apply NEC 125% continuous load factor if applicable
    let adjustedAmperage = params.continuous ? params.amperage * 1.25 : params.amperage;
    
    // Step 2: Calculate derating factors
    const tempCorrection = this.getTemperatureCorrection(params.ambientTemperature, params.temperatureRating);
    const fillDerate = this.getConduitFillDerating(params.conductorCount);
    const totalDerating = tempCorrection * fillDerate;
    
    // Step 3: Calculate required ampacity after derating
    const requiredAmpacity = adjustedAmperage / totalDerating;
    
    // Step 4: Find minimum wire size for both copper and aluminum
    const copperWire = this.findMinimumWireSize(requiredAmpacity, 'copper', params.temperatureRating);
    const aluminumWire = this.findMinimumWireSize(requiredAmpacity, 'aluminum', params.temperatureRating);
    
    // Step 5: Calculate voltage drop for both options
    const copperVD = copperWire ? this.calculateVoltageDrop(copperWire, params, 'copper') : null;
    const aluminumVD = aluminumWire ? this.calculateVoltageDrop(aluminumWire, params, 'aluminum') : null;
    
    // Step 6: Select best option based on voltage drop and cost
    const bestOption = this.selectBestWireOption(copperWire, aluminumWire, copperVD, aluminumVD, params);
    
    // Step 7: Perform NEC compliance check
    const necCompliance = this.checkNECCompliance(bestOption.wire, params, bestOption.voltageDrop);
    
    // Step 8: Calculate cost analysis
    const costAnalysis = this.calculateCostAnalysis(copperWire, aluminumWire, params.length);
    
    return {
      recommendedAwg: bestOption.wire.awg,
      ampacity: bestOption.wire.ampacity[params.wireType][params.temperatureRating],
      actualVoltageDrop: bestOption.voltageDrop,
      voltageDropPercent: (bestOption.voltageDrop / params.voltage) * 100,
      deratingFactor: totalDerating,
      necCompliance,
      costAnalysis
    };
  }
  
  /**
   * Auto-size wire for SLD component connections
   */
  static autoSizeWireForConnection(
    fromComponent: ComponentAmperageData, 
    toComponent: ComponentAmperageData,
    distance: number,
    installationConditions?: Partial<WireSizingParameters>
  ): WireSizingResult {
    // Determine the controlling amperage (usually the lower of the two)
    const controllingAmperage = Math.min(fromComponent.amperage, toComponent.amperage);
    
    // Default installation parameters
    const defaultParams: WireSizingParameters = {
      amperage: controllingAmperage,
      voltage: fromComponent.voltage || 240,
      length: distance,
      ambientTemperature: 30, // 30°C standard
      installationMethod: 'conduit',
      conductorCount: 3, // typical 3-wire circuit
      conduitFill: 40, // moderate fill
      maxVoltageDrop: 3, // 3% max voltage drop
      wireType: 'copper',
      temperatureRating: '75C',
      continuous: fromComponent.continuous || false,
      ...installationConditions
    };
    
    return this.calculateWireSize(defaultParams);
  }
  
  /**
   * Get wire sizing recommendations for multiple scenarios
   */
  static getWireSizingOptions(params: WireSizingParameters): {
    copper: WireSizingResult | null;
    aluminum: WireSizingResult | null;
    recommended: WireSizingResult;
  } {
    // Calculate for copper
    const copperParams = { ...params, wireType: 'copper' as const };
    const copperResult = this.calculateWireSize(copperParams);
    
    // Calculate for aluminum (if wire size supports it)
    let aluminumResult = null;
    if (params.amperage >= 15) { // Aluminum not used below 12 AWG
      const aluminumParams = { ...params, wireType: 'aluminum' as const };
      aluminumResult = this.calculateWireSize(aluminumParams);
    }
    
    // Recommend based on cost-effectiveness and practicality
    const recommended = this.selectRecommendedOption(copperResult, aluminumResult, params);
    
    return {
      copper: copperResult,
      aluminum: aluminumResult,
      recommended
    };
  }
  
  /**
   * Batch calculate wire sizes for multiple connections
   */
  static batchCalculateWireSizes(
    connections: Array<{
      id: string;
      fromComponent: ComponentAmperageData;
      toComponent: ComponentAmperageData;
      distance: number;
      conditions?: Partial<WireSizingParameters>;
    }>
  ): Array<{ connectionId: string; wireSizing: WireSizingResult }> {
    return connections.map(connection => ({
      connectionId: connection.id,
      wireSizing: this.autoSizeWireForConnection(
        connection.fromComponent,
        connection.toComponent,
        connection.distance,
        connection.conditions
      )
    }));
  }
  
  // Private helper methods
  
  private static getTemperatureCorrection(ambient: number, rating: '60C' | '75C' | '90C'): number {
    const corrections = TEMPERATURE_CORRECTIONS[rating];
    const temps = Object.keys(corrections).map(Number).sort((a, b) => a - b);
    
    // Find closest temperature or interpolate
    if (ambient <= temps[0]) return corrections[temps[0]];
    if (ambient >= temps[temps.length - 1]) return corrections[temps[temps.length - 1]];
    
    // Linear interpolation
    for (let i = 0; i < temps.length - 1; i++) {
      if (ambient >= temps[i] && ambient <= temps[i + 1]) {
        const factor = (ambient - temps[i]) / (temps[i + 1] - temps[i]);
        return corrections[temps[i]] + factor * (corrections[temps[i + 1]] - corrections[temps[i]]);
      }
    }
    
    return 1.0; // Default
  }
  
  private static getConduitFillDerating(conductorCount: number): number {
    if (conductorCount <= 3) return 1.0;
    if (conductorCount <= 6) return CONDUIT_FILL_DERATING[4];
    if (conductorCount <= 9) return CONDUIT_FILL_DERATING[7];
    if (conductorCount <= 20) return CONDUIT_FILL_DERATING[10];
    if (conductorCount <= 30) return CONDUIT_FILL_DERATING[21];
    if (conductorCount <= 40) return CONDUIT_FILL_DERATING[31];
    return CONDUIT_FILL_DERATING[41];
  }
  
  private static findMinimumWireSize(
    requiredAmpacity: number, 
    material: 'copper' | 'aluminum', 
    tempRating: '60C' | '75C' | '90C'
  ): WireSpec | null {
    for (const wire of WIRE_SPECIFICATIONS) {
      const ampacity = wire.ampacity[material][tempRating];
      if (ampacity > 0 && ampacity >= requiredAmpacity) {
        return wire;
      }
    }
    return null; // No suitable wire found
  }
  
  private static calculateVoltageDrop(
    wire: WireSpec, 
    params: WireSizingParameters, 
    material: 'copper' | 'aluminum'
  ): number {
    const resistance = wire.resistance[material];
    const wireResistance = (resistance * params.length) / 1000; // Convert to actual length
    
    // Calculate voltage drop based on circuit type
    if (params.phases === 1) {
      // Single phase: VD = 2 * I * R (two-way circuit)
      return 2 * params.amperage * wireResistance;
    } else {
      // Three phase: VD = √3 * I * R
      return Math.sqrt(3) * params.amperage * wireResistance;
    }
  }
  
  private static selectBestWireOption(
    copperWire: WireSpec | null,
    aluminumWire: WireSpec | null,
    copperVD: number | null,
    aluminumVD: number | null,
    params: WireSizingParameters
  ): { wire: WireSpec; voltageDrop: number } {
    // If only one option is available
    if (!copperWire && aluminumWire && aluminumVD !== null) {
      return { wire: aluminumWire, voltageDrop: aluminumVD };
    }
    if (!aluminumWire && copperWire && copperVD !== null) {
      return { wire: copperWire, voltageDrop: copperVD };
    }
    
    // Both options available - compare based on voltage drop and preference
    if (copperWire && aluminumWire && copperVD !== null && aluminumVD !== null) {
      const copperVDPercent = (copperVD / params.voltage) * 100;
      const aluminumVDPercent = (aluminumVD / params.voltage) * 100;
      
      // If both meet voltage drop requirements, prefer based on material preference
      if (copperVDPercent <= params.maxVoltageDrop && aluminumVDPercent <= params.maxVoltageDrop) {
        return params.wireType === 'aluminum' ? 
          { wire: aluminumWire, voltageDrop: aluminumVD } : 
          { wire: copperWire, voltageDrop: copperVD };
      }
      
      // Choose the one that meets voltage drop requirements
      if (copperVDPercent <= params.maxVoltageDrop) {
        return { wire: copperWire, voltageDrop: copperVD };
      }
      if (aluminumVDPercent <= params.maxVoltageDrop) {
        return { wire: aluminumWire, voltageDrop: aluminumVD };
      }
      
      // If neither meets requirements, choose the better one
      return copperVDPercent < aluminumVDPercent ? 
        { wire: copperWire, voltageDrop: copperVD } : 
        { wire: aluminumWire, voltageDrop: aluminumVD };
    }
    
    // Fallback
    throw new Error('No suitable wire size found for the given parameters');
  }
  
  private static checkNECCompliance(
    wire: WireSpec, 
    params: WireSizingParameters, 
    voltageDrop: number
  ): { compliant: boolean; violations: string[]; warnings: string[] } {
    const violations: string[] = [];
    const warnings: string[] = [];
    
    // Check voltage drop compliance
    const voltageDropPercent = (voltageDrop / params.voltage) * 100;
    if (voltageDropPercent > 5) {
      violations.push(`Voltage drop ${voltageDropPercent.toFixed(2)}% exceeds 5% NEC recommendation`);
    } else if (voltageDropPercent > 3) {
      warnings.push(`Voltage drop ${voltageDropPercent.toFixed(2)}% exceeds recommended 3%`);
    }
    
    // Check continuous load factor
    if (params.continuous) {
      const requiredAmpacity = params.amperage * 1.25;
      const actualAmpacity = wire.ampacity[params.wireType][params.temperatureRating];
      if (actualAmpacity < requiredAmpacity) {
        violations.push(`Continuous load requires 125% factor (${requiredAmpacity}A), but wire rated for ${actualAmpacity}A`);
      }
    }
    
    // Check aluminum restrictions
    if (params.wireType === 'aluminum') {
      const awgNumber = parseInt(wire.awg);
      if (!isNaN(awgNumber) && awgNumber > 10) {
        violations.push('Aluminum conductors smaller than 10 AWG not recommended for general use');
      }
    }
    
    // Check temperature rating compatibility
    if (params.temperatureRating === '90C' && params.installationMethod === 'direct_burial') {
      warnings.push('90°C rating may not be suitable for direct burial applications');
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      warnings
    };
  }
  
  private static calculateCostAnalysis(
    copperWire: WireSpec | null, 
    aluminumWire: WireSpec | null, 
    length: number
  ): { copperCost: number; aluminumCost: number; recommendation: 'copper' | 'aluminum' } {
    const copperCost = copperWire ? copperWire.cost.copper * length : Infinity;
    const aluminumCost = aluminumWire ? aluminumWire.cost.aluminum * length : Infinity;
    
    // Factor in installation costs - aluminum typically requires larger conduit/terminations
    const aluminumInstallationFactor = 1.15; // 15% higher installation cost
    const adjustedAluminumCost = aluminumCost * aluminumInstallationFactor;
    
    return {
      copperCost,
      aluminumCost: adjustedAluminumCost,
      recommendation: copperCost <= adjustedAluminumCost ? 'copper' : 'aluminum'
    };
  }
  
  private static selectRecommendedOption(
    copperResult: WireSizingResult, 
    aluminumResult: WireSizingResult | null, 
    params: WireSizingParameters
  ): WireSizingResult {
    // If only copper is available or suitable
    if (!aluminumResult || !aluminumResult.necCompliance.compliant) {
      return copperResult;
    }
    
    // If both are compliant, choose based on cost and practical considerations
    if (copperResult.necCompliance.compliant && aluminumResult.necCompliance.compliant) {
      // For smaller circuits (< 60A), prefer copper for ease of installation
      if (params.amperage < 60) {
        return copperResult;
      }
      
      // For larger circuits, consider cost
      if (copperResult.costAnalysis && aluminumResult.costAnalysis) {
        return copperResult.costAnalysis.recommendation === 'aluminum' ? aluminumResult : copperResult;
      }
    }
    
    return copperResult; // Default to copper
  }
}

export default IntelligentWireSizingService;