/**
 * Enhanced NEC Compliance Engine
 * 
 * Comprehensive NEC compliance validation for electrical calculations
 * Integrates with wire sizing and load calculations for complete compliance analysis
 */

import { NEC_CONSTANTS, WIRE_RESISTANCE } from '../constants';
import { calculateWireSize, calculateVoltageDrop, getWireSizeCalculation } from './wireCalculations';
import type { WireSizeResult, ValidationMessage } from '../types';

export interface NECViolation {
  code: string;
  section: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  recommendation?: string;
  calculation?: any;
}

export interface CircuitAnalysis {
  circuitId: string;
  circuitName: string;
  load: number; // amps
  voltage: number;
  wireSize: string;
  ampacity: number;
  length: number;
  material: 'copper' | 'aluminum';
  temperatureRating: '60C' | '75C' | '90C';
  conduitFill: number;
  violations: NECViolation[];
  recommendations: string[];
}

export interface ComplianceAnalysis {
  overallCompliance: boolean;
  totalViolations: number;
  criticalViolations: number;
  warningViolations: number;
  circuits: CircuitAnalysis[];
  systemViolations: NECViolation[];
  recommendations: string[];
}

// Enhanced NEC code sections and requirements
const NEC_SECTIONS = {
  '110.14': 'Electrical connections - Temperature ratings',
  '210.19': 'Conductors - Minimum ampacity and size',
  '210.20': 'Overcurrent protection',
  '220.83': 'Optional calculation for dwelling units',
  '230.42': 'Minimum size and rating - Service entrance conductors',
  '240.4': 'Protection of conductors',
  '240.6': 'Standard ampere ratings',
  '250.122': 'Size of equipment grounding conductors',
  '310.10': 'Uses permitted - Conductor applications',
  '310.15': 'Ampacities of conductors',
  '625.17': 'EVSE circuit conductor sizing',
  '690.8': 'Circuit sizing and current - Solar PV',
  '705.12': 'Point of interconnection - Solar systems'
} as const;

// NEC ampacity derating factors
const DERATING_FACTORS = {
  conductorCount: {
    1: 1.0, 2: 1.0, 3: 1.0,
    4: 0.8, 5: 0.8, 6: 0.8,
    7: 0.7, 8: 0.7, 9: 0.7,
    10: 0.5, 20: 0.45, 30: 0.4
  },
  ambientTemperature: {
    // Temperature correction factors for 30°C baseline (Table 310.15(B)(2)(a))
    21: 1.08, 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91,
    45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71, 65: 0.65, 70: 0.58
  }
};

/**
 * Validate wire size compliance with NEC requirements
 */
export const validateWireSizing = (
  load: number,
  voltage: number,
  wireSize: string,
  material: 'copper' | 'aluminum',
  temperatureRating: '60C' | '75C' | '90C',
  conduitFill: number = 3,
  ambientTemp: number = 30,
  isContinuous: boolean = false,
  isMotorLoad: boolean = false
): NECViolation[] => {
  const violations: NECViolation[] = [];
  
  // Apply 125% factor for continuous loads (NEC 210.19(A)(1))
  const adjustedLoad = isContinuous ? load * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR : load;
  
  // Apply 125% factor for motor loads (NEC 430.22)
  const motorAdjustedLoad = isMotorLoad ? load * 1.25 : adjustedLoad;
  
  // Get wire ampacity
  const wireData = NEC_CONSTANTS.WIRE_AMPACITY[wireSize as keyof typeof NEC_CONSTANTS.WIRE_AMPACITY];
  if (!wireData) {
    violations.push({
      code: 'WIRE-001',
      section: '310.15',
      description: `Invalid wire size: ${wireSize}`,
      severity: 'error',
      recommendation: 'Use standard NEC wire sizes (14 AWG through 500 kcmil)'
    });
    return violations;
  }
  
  // Get base ampacity
  const ampacityKey = material === 'aluminum' ? 'aluminum' : `copper${temperatureRating}` as keyof typeof wireData;
  const baseAmpacity = (wireData as any)[ampacityKey];
  
  if (!baseAmpacity || baseAmpacity === 0) {
    violations.push({
      code: 'WIRE-002',
      section: '310.15',
      description: `Wire size ${wireSize} not available in ${material} for ${temperatureRating} rating`,
      severity: 'error',
      recommendation: `Use copper wire or select different temperature rating`
    });
    return violations;
  }
  
  // Apply derating factors
  const conductorDerate = DERATING_FACTORS.conductorCount[Math.min(conduitFill, 30) as keyof typeof DERATING_FACTORS.conductorCount] || 0.35;
  const tempDerate = DERATING_FACTORS.ambientTemperature[ambientTemp as keyof typeof DERATING_FACTORS.ambientTemperature] || 0.58;
  
  const deredAmpacity = baseAmpacity * conductorDerate * tempDerate;
  
  // Check ampacity compliance (NEC 210.19)
  if (deredAmpacity < motorAdjustedLoad) {
    violations.push({
      code: 'WIRE-003',
      section: '210.19',
      description: `Wire ampacity (${deredAmpacity.toFixed(1)}A) insufficient for load (${motorAdjustedLoad.toFixed(1)}A)`,
      severity: 'error',
      recommendation: `Use minimum ${calculateWireSize(motorAdjustedLoad, voltage, 0, temperatureRating, conduitFill, material)} AWG wire`,
      calculation: {
        baseAmpacity,
        conductorDerate,
        tempDerate,
        deredAmpacity,
        requiredLoad: motorAdjustedLoad
      }
    });
  }
  
  // Check temperature rating compliance (NEC 110.14)
  if (temperatureRating === '60C' && load > 100) {
    violations.push({
      code: 'WIRE-004',
      section: '110.14',
      description: '60°C rated wire not recommended for loads over 100A',
      severity: 'warning',
      recommendation: 'Use 75°C or 90°C rated wire for better performance and code compliance'
    });
  }
  
  // Check minimum wire size for specific applications
  if (wireSize === '14' && voltage === 240) {
    violations.push({
      code: 'WIRE-005',
      section: '210.19',
      description: '14 AWG wire not permitted for 240V circuits over 15A',
      severity: 'error',
      recommendation: 'Use minimum 12 AWG wire for 240V circuits'
    });
  }
  
  // Check aluminum wire restrictions
  if (material === 'aluminum' && ['14', '12'].includes(wireSize)) {
    violations.push({
      code: 'WIRE-006',
      section: '310.106',
      description: 'Aluminum wire smaller than 10 AWG not recommended for branch circuits',
      severity: 'warning',
      recommendation: 'Use copper wire for branch circuits 12 AWG and smaller'
    });
  }
  
  return violations;
};

/**
 * Validate voltage drop compliance
 */
export const validateVoltageDrop = (
  load: number,
  voltage: number,
  wireSize: string,
  distance: number,
  material: 'copper' | 'aluminum',
  circuitType: 'branch' | 'feeder' = 'branch'
): NECViolation[] => {
  const violations: NECViolation[] = [];
  
  const voltageDrop = calculateVoltageDrop(load, voltage, wireSize, distance, material);
  const voltageDropPercent = (voltageDrop / voltage) * 100;
  
  const maxDropPercent = circuitType === 'branch' ? 
    NEC_CONSTANTS.VOLTAGE_DROP.BRANCH_CIRCUIT_MAX : 
    NEC_CONSTANTS.VOLTAGE_DROP.FEEDER_MAX;
  
  if (voltageDropPercent > maxDropPercent) {
    violations.push({
      code: 'VD-001',
      section: '210.19',
      description: `Voltage drop (${voltageDropPercent.toFixed(2)}%) exceeds ${maxDropPercent}% limit for ${circuitType} circuits`,
      severity: 'warning',
      recommendation: `Use larger wire size or reduce circuit length. Consider ${getRecommendedWireForVoltageDrop(load, voltage, distance, material, maxDropPercent)} AWG`,
      calculation: {
        voltageDrop,
        voltageDropPercent,
        maxDropPercent,
        distance,
        load
      }
    });
  }
  
  // Critical voltage drop warning
  if (voltageDropPercent > 5) {
    violations.push({
      code: 'VD-002',
      section: 'FPN',
      description: `Excessive voltage drop (${voltageDropPercent.toFixed(2)}%) may cause equipment malfunction`,
      severity: 'error',
      recommendation: 'Increase wire size significantly or relocate equipment closer to source'
    });
  }
  
  return violations;
};

/**
 * Get recommended wire size for voltage drop compliance
 */
export const getRecommendedWireForVoltageDrop = (
  load: number,
  voltage: number,
  distance: number,
  material: 'copper' | 'aluminum',
  maxDropPercent: number
): string => {
  const wireSizes = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500'];
  
  for (const wireSize of wireSizes) {
    const voltageDrop = calculateVoltageDrop(load, voltage, wireSize, distance, material);
    const voltageDropPercent = (voltageDrop / voltage) * 100;
    
    if (voltageDropPercent <= maxDropPercent) {
      return wireSize;
    }
  }
  
  return '500'; // Largest available
};

/**
 * Validate EVSE circuit compliance
 */
export const validateEVSECompliance = (
  evseLoad: number,
  wireSize: string,
  breaker: number,
  isContinuous: boolean = true
): NECViolation[] => {
  const violations: NECViolation[] = [];
  
  // NEC 625.17 - EVSE circuit sizing
  const requiredLoad = isContinuous ? evseLoad * 1.25 : evseLoad;
  
  if (breaker < requiredLoad) {
    violations.push({
      code: 'EVSE-001',
      section: '625.17',
      description: `EVSE breaker (${breaker}A) insufficient for continuous load (${requiredLoad.toFixed(1)}A)`,
      severity: 'error',
      recommendation: `Use minimum ${Math.ceil(requiredLoad)}A breaker`
    });
  }
  
  // Check wire sizing for EVSE
  const wireCalc = getWireSizeCalculation(requiredLoad, 240, 50, '75C', 3, 'copper');
  const minWireSize = wireCalc.wireSize;
  
  if (compareWireSizes(wireSize, minWireSize) < 0) {
    violations.push({
      code: 'EVSE-002',
      section: '625.17',
      description: `Wire size ${wireSize} AWG insufficient for EVSE load`,
      severity: 'error',
      recommendation: `Use minimum ${minWireSize} AWG wire for EVSE circuit`
    });
  }
  
  return violations;
};

/**
 * Compare wire sizes (returns -1 if first is smaller, 0 if equal, 1 if first is larger)
 */
const compareWireSizes = (size1: string, size2: string): number => {
  const wireOrder = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500'];
  const index1 = wireOrder.indexOf(size1);
  const index2 = wireOrder.indexOf(size2);
  
  if (index1 < index2) return -1;
  if (index1 > index2) return 1;
  return 0;
};

/**
 * Comprehensive circuit analysis
 */
export const analyzeCircuit = (
  circuitId: string,
  circuitName: string,
  load: number,
  voltage: number = 240,
  wireSize: string,
  material: 'copper' | 'aluminum' = 'copper',
  temperatureRating: '60C' | '75C' | '90C' = '75C',
  conduitFill: number = 3,
  length: number = 100,
  ambientTemp: number = 30,
  isContinuous: boolean = false,
  isMotorLoad: boolean = false,
  isEVSE: boolean = false,
  breakerSize?: number
): CircuitAnalysis => {
  const violations: NECViolation[] = [];
  const recommendations: string[] = [];
  
  // Get wire ampacity
  const wireCalc = getWireSizeCalculation(load, voltage, length, temperatureRating, conduitFill, material);
  
  // Wire sizing validation
  violations.push(...validateWireSizing(
    load, voltage, wireSize, material, temperatureRating, 
    conduitFill, ambientTemp, isContinuous, isMotorLoad
  ));
  
  // Voltage drop validation
  violations.push(...validateVoltageDrop(load, voltage, wireSize, length, material, 'branch'));
  
  // EVSE specific validation
  if (isEVSE && breakerSize) {
    violations.push(...validateEVSECompliance(load, wireSize, breakerSize, isContinuous));
  }
  
  // Generate recommendations
  if (violations.length === 0) {
    recommendations.push('Circuit meets all NEC requirements');
  } else {
    recommendations.push(...violations
      .filter(v => v.recommendation)
      .map(v => v.recommendation!)
    );
  }
  
  return {
    circuitId,
    circuitName,
    load,
    voltage,
    wireSize,
    ampacity: wireCalc.ampacity,
    length,
    material,
    temperatureRating,
    conduitFill,
    violations,
    recommendations
  };
};

/**
 * Generate comprehensive compliance report
 */
export const generateComplianceReport = (circuits: CircuitAnalysis[]): ComplianceAnalysis => {
  const systemViolations: NECViolation[] = [];
  const recommendations: string[] = [];
  
  let totalViolations = 0;
  let criticalViolations = 0;
  let warningViolations = 0;
  
  // Analyze each circuit
  circuits.forEach(circuit => {
    totalViolations += circuit.violations.length;
    criticalViolations += circuit.violations.filter(v => v.severity === 'error').length;
    warningViolations += circuit.violations.filter(v => v.severity === 'warning').length;
  });
  
  // System-level checks
  const totalLoad = circuits.reduce((sum, circuit) => sum + circuit.load, 0);
  
  if (totalLoad > 200) {
    systemViolations.push({
      code: 'SYS-001',
      section: '230.42',
      description: `Total calculated load (${totalLoad.toFixed(1)}A) may require service upgrade`,
      severity: 'warning',
      recommendation: 'Consider upgrading electrical service or implementing load management'
    });
  }
  
  // Generate system recommendations
  if (criticalViolations > 0) {
    recommendations.push('Address all critical violations before energizing circuits');
  }
  
  if (warningViolations > 0) {
    recommendations.push('Review warning violations for optimal performance and future compliance');
  }
  
  if (totalViolations === 0) {
    recommendations.push('All circuits meet current NEC requirements');
  }
  
  return {
    overallCompliance: criticalViolations === 0,
    totalViolations,
    criticalViolations,
    warningViolations,
    circuits,
    systemViolations,
    recommendations
  };
};

/**
 * Enhanced wire sizing with full NEC compliance
 */
export const getComplianceWireSize = (
  load: number,
  voltage: number = 240,
  distance: number = 100,
  temperatureRating: '60C' | '75C' | '90C' = '75C',
  conduitFill: number = 3,
  material: 'copper' | 'aluminum' = 'copper',
  ambientTemp: number = 30,
  isContinuous: boolean = false,
  isMotorLoad: boolean = false,
  maxVoltageDropPercent: number = 3
): {
  wireSize: string;
  ampacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
  violations: NECViolation[];
  isCompliant: boolean;
} => {
  const wireSizes = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500'];
  
  // Apply load factors
  const adjustedLoad = isContinuous ? load * 1.25 : load;
  const finalLoad = isMotorLoad ? Math.max(adjustedLoad, load * 1.25) : adjustedLoad;
  
  for (const wireSize of wireSizes) {
    const violations = [
      ...validateWireSizing(finalLoad, voltage, wireSize, material, temperatureRating, conduitFill, ambientTemp, isContinuous, isMotorLoad),
      ...validateVoltageDrop(finalLoad, voltage, wireSize, distance, material, 'branch')
    ];
    
    const hasAmpacityViolations = violations.some(v => v.code.startsWith('WIRE-003'));
    const voltageDropViolations = violations.filter(v => v.code.startsWith('VD-'));
    const hasExcessiveVoltageDrop = voltageDropViolations.some(v => 
      v.calculation && v.calculation.voltageDropPercent > maxVoltageDropPercent
    );
    
    if (!hasAmpacityViolations && !hasExcessiveVoltageDrop) {
      const wireCalc = getWireSizeCalculation(finalLoad, voltage, distance, temperatureRating, conduitFill, material);
      const voltageDrop = calculateVoltageDrop(finalLoad, voltage, wireSize, distance, material);
      const voltageDropPercent = (voltageDrop / voltage) * 100;
      
      return {
        wireSize,
        ampacity: wireCalc.ampacity,
        voltageDrop,
        voltageDropPercent,
        violations: violations.filter(v => v.severity !== 'error'),
        isCompliant: violations.filter(v => v.severity === 'error').length === 0
      };
    }
  }
  
  // Fallback to largest wire if no size works
  const wireSize = '500';
  const wireCalc = getWireSizeCalculation(finalLoad, voltage, distance, temperatureRating, conduitFill, material);
  const voltageDrop = calculateVoltageDrop(finalLoad, voltage, wireSize, distance, material);
  const voltageDropPercent = (voltageDrop / voltage) * 100;
  const violations = [
    ...validateWireSizing(finalLoad, voltage, wireSize, material, temperatureRating, conduitFill, ambientTemp, isContinuous, isMotorLoad),
    ...validateVoltageDrop(finalLoad, voltage, wireSize, distance, material, 'branch')
  ];
  
  return {
    wireSize,
    ampacity: wireCalc.ampacity,
    voltageDrop,
    voltageDropPercent,
    violations,
    isCompliant: false
  };
};

export default {
  validateWireSizing,
  validateVoltageDrop,
  validateEVSECompliance,
  analyzeCircuit,
  generateComplianceReport,
  getComplianceWireSize,
  getRecommendedWireForVoltageDrop
};