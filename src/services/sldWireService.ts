import type { SLDConnection, SLDComponent } from '../types/sld';
import { calculateWireSize, calculateVoltageDrop } from './wireCalculations';
import { NEC_CONSTANTS } from '../constants/necConstants';

export interface WireCalculation {
  conductorSize: string;
  conduitSize: string;
  voltageDrop: number;
  voltageDropPercent: number;
  ampacity: number;
  deratingFactors: DeratingFactors;
  necCompliance: boolean;
  complianceIssues: string[];
  recommendations: string[];
}

export interface DeratingFactors {
  temperature: number;
  conduitFill: number;
  ambientTemperature: number;
  totalDerating: number;
}

export interface ConduitSpecification {
  size: string;
  type: 'EMT' | 'RMC' | 'PVC' | 'FMC' | 'LFMC';
  fillPercentage: number;
  maxConductors: number;
  tradeSize: string;
}

export interface VoltageDropLimits {
  branchCircuit: number; // 3% for branch circuits
  feeder: number; // 2% for feeders
  service: number; // 1% for service conductors
}

export class SLDWireService {
  private static voltageDropLimits: VoltageDropLimits = {
    branchCircuit: 3,
    feeder: 2,
    service: 1
  };

  /**
   * Calculate wire sizing for an SLD connection
   */
  static calculateWireSizing(
    connection: SLDConnection,
    distance: number,
    tempRating: '60C' | '75C' | '90C' = '75C',
    conduitType: 'EMT' | 'RMC' | 'PVC' | 'FMC' | 'LFMC' = 'EMT',
    ambientTemperature: number = 30
  ): WireCalculation {
    const { fromComponentId, toComponentId, wireType, voltage = 240, current = 0 } = connection;
    
    // Determine conductor count based on wire type
    const conductorCount = this.getConductorCount(wireType);
    
    // Calculate required ampacity
    const requiredAmpacity = this.calculateRequiredAmpacity(current, wireType);
    
    // Get wire size
    const conductorSize = calculateWireSize(requiredAmpacity, voltage, distance, tempRating, conductorCount);
    
    // Calculate voltage drop
    const voltageDrop = calculateVoltageDrop(requiredAmpacity, voltage, conductorSize, distance);
    const voltageDropPercent = (voltageDrop / voltage) * 100;
    
    // Get ampacity for selected wire size
    const ampacity = this.getAmpacity(conductorSize, tempRating);
    
    // Calculate derating factors
    const deratingFactors = this.calculateDeratingFactors(
      tempRating,
      conductorCount,
      ambientTemperature
    );
    
    // Get conduit specification
    const conduitSpec = this.getConduitSpecification(conductorSize, conductorCount, conduitType);
    
    // Check NEC compliance
    const { necCompliance, complianceIssues } = this.checkNECCompliance(
      connection,
      conductorSize,
      voltageDropPercent,
      deratingFactors,
      conduitSpec
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      connection,
      conductorSize,
      voltageDropPercent,
      deratingFactors,
      conduitSpec
    );

    return {
      conductorSize,
      conduitSize: conduitSpec.tradeSize,
      voltageDrop,
      voltageDropPercent,
      ampacity,
      deratingFactors,
      necCompliance,
      complianceIssues,
      recommendations
    };
  }

  /**
   * Validate NEC compliance for a connection
   */
  static validateNECCompliance(connection: SLDConnection): ValidationResult {
    const calculation = this.calculateWireSizing(connection, 50); // Default distance
    
    return {
      isValid: calculation.necCompliance,
      issues: calculation.complianceIssues,
      recommendations: calculation.recommendations,
      calculation
    };
  }

  /**
   * Suggest conduit size based on wire size and conductor count
   */
  static suggestConduitSize(
    wireSize: string,
    conductorCount: number,
    conduitType: 'EMT' | 'RMC' | 'PVC' | 'FMC' | 'LFMC' = 'EMT'
  ): ConduitSpecification {
    return this.getConduitSpecification(wireSize, conductorCount, conduitType);
  }

  /**
   * Calculate voltage drop for a connection
   */
  static calculateConnectionVoltageDrop(
    connection: SLDConnection,
    distance: number
  ): { voltageDrop: number; percentage: number; isCompliant: boolean } {
    const { current = 0, voltage = 240 } = connection;
    const wireSize = this.calculateWireSizing(connection, distance).conductorSize;
    const voltageDrop = calculateVoltageDrop(current, voltage, wireSize, distance);
    const percentage = (voltageDrop / voltage) * 100;
    
    // Determine voltage drop limit based on connection type
    const limit = this.getVoltageDropLimit(connection);
    const isCompliant = percentage <= limit;
    
    return { voltageDrop, percentage, isCompliant };
  }

  /**
   * Get conductor count based on wire type
   */
  private static getConductorCount(wireType: 'dc' | 'ac' | 'ground'): number {
    switch (wireType) {
      case 'dc':
        return 2; // Positive and negative
      case 'ac':
        return 3; // Line 1, Line 2, Neutral
      case 'ground':
        return 1; // Ground conductor only
      default:
        return 3;
    }
  }

  /**
   * Calculate required ampacity
   */
  private static calculateRequiredAmpacity(current: number, wireType: 'dc' | 'ac' | 'ground'): number {
    // Apply continuous load factor for certain wire types
    if (wireType === 'ac') {
      return current * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
    }
    return current;
  }

  /**
   * Get ampacity for wire size and temperature rating
   */
  private static getAmpacity(wireSize: string, tempRating: '60C' | '75C' | '90C'): number {
    const ratings = NEC_CONSTANTS.WIRE_AMPACITY[wireSize as keyof typeof NEC_CONSTANTS.WIRE_AMPACITY];
    if (!ratings) return 0;
    
    const ampacityColumn = `copper${tempRating}` as 'copper60C' | 'copper75C' | 'copper90C';
    return (ratings as any)[ampacityColumn] || 0;
  }

  /**
   * Calculate derating factors
   */
  private static calculateDeratingFactors(
    tempRating: '60C' | '75C' | '90C',
    conductorCount: number,
    ambientTemperature: number
  ): DeratingFactors {
    // Temperature derating
    let temperatureDerating = 1.0;
    if (ambientTemperature > 30) {
      const tempDiff = ambientTemperature - 30;
      temperatureDerating = Math.max(0.8, 1.0 - (tempDiff * 0.002));
    }

    // Conduit fill derating
    let conduitFillDerating = 1.0;
    if (conductorCount > 3) {
      if (conductorCount <= 6) {
        conduitFillDerating = 0.8;
      } else if (conductorCount <= 9) {
        conduitFillDerating = 0.7;
      } else {
        conduitFillDerating = 0.5;
      }
    }

    const totalDerating = temperatureDerating * conduitFillDerating;

    return {
      temperature: temperatureDerating,
      conduitFill: conduitFillDerating,
      ambientTemperature,
      totalDerating
    };
  }

  /**
   * Get conduit specification
   */
  private static getConduitSpecification(
    wireSize: string,
    conductorCount: number,
    conduitType: 'EMT' | 'RMC' | 'PVC' | 'FMC' | 'LFMC'
  ): ConduitSpecification {
    // Simplified conduit sizing table
    const conduitSizes: Record<string, { maxConductors: number; tradeSize: string }> = {
      '14': { maxConductors: 12, tradeSize: '1/2"' },
      '12': { maxConductors: 9, tradeSize: '1/2"' },
      '10': { maxConductors: 6, tradeSize: '3/4"' },
      '8': { maxConductors: 4, tradeSize: '1"' },
      '6': { maxConductors: 3, tradeSize: '1"' },
      '4': { maxConductors: 2, tradeSize: '1.25"' },
      '3': { maxConductors: 2, tradeSize: '1.25"' },
      '2': { maxConductors: 1, tradeSize: '1.5"' },
      '1': { maxConductors: 1, tradeSize: '2"' },
      '1/0': { maxConductors: 1, tradeSize: '2"' },
      '2/0': { maxConductors: 1, tradeSize: '2.5"' },
      '3/0': { maxConductors: 1, tradeSize: '3"' },
      '4/0': { maxConductors: 1, tradeSize: '3"' }
    };

    const spec = conduitSizes[wireSize] || { maxConductors: 1, tradeSize: '1/2"' };
    const fillPercentage = (conductorCount / spec.maxConductors) * 100;

    return {
      size: wireSize,
      type: conduitType,
      fillPercentage,
      maxConductors: spec.maxConductors,
      tradeSize: spec.tradeSize
    };
  }

  /**
   * Check NEC compliance
   */
  private static checkNECCompliance(
    connection: SLDConnection,
    conductorSize: string,
    voltageDropPercent: number,
    deratingFactors: DeratingFactors,
    conduitSpec: ConduitSpecification
  ): { necCompliance: boolean; complianceIssues: string[] } {
    const issues: string[] = [];

    // Check voltage drop
    const voltageDropLimit = this.getVoltageDropLimit(connection);
    if (voltageDropPercent > voltageDropLimit) {
      issues.push(`Voltage drop (${voltageDropPercent.toFixed(1)}%) exceeds ${voltageDropLimit}% limit`);
    }

    // Check derating
    if (deratingFactors.totalDerating < 0.8) {
      issues.push(`Total derating factor (${deratingFactors.totalDerating.toFixed(2)}) is below 0.8`);
    }

    // Check conduit fill
    if (conduitSpec.fillPercentage > 40) {
      issues.push(`Conduit fill (${conduitSpec.fillPercentage.toFixed(1)}%) exceeds 40% limit`);
    }

    // Check wire size minimums
    if (this.isBelowMinimumWireSize(conductorSize, connection.wireType)) {
      issues.push(`Wire size ${conductorSize} is below minimum for ${connection.wireType} circuits`);
    }

    return {
      necCompliance: issues.length === 0,
      complianceIssues: issues
    };
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    connection: SLDConnection,
    conductorSize: string,
    voltageDropPercent: number,
    deratingFactors: DeratingFactors,
    conduitSpec: ConduitSpecification
  ): string[] {
    const recommendations: string[] = [];

    if (voltageDropPercent > this.getVoltageDropLimit(connection) * 0.8) {
      recommendations.push('Consider larger wire size to reduce voltage drop');
    }

    if (deratingFactors.totalDerating < 0.9) {
      recommendations.push('Consider larger conduit to improve derating factors');
    }

    if (conduitSpec.fillPercentage > 30) {
      recommendations.push('Consider larger conduit to reduce fill percentage');
    }

    if (connection.wireType === 'ground') {
      recommendations.push('Verify ground conductor sizing per NEC 250.122');
    }

    return recommendations;
  }

  /**
   * Get voltage drop limit based on connection type
   */
  private static getVoltageDropLimit(connection: SLDConnection): number {
    // This would be determined by the connection's role in the system
    // For now, use branch circuit limit
    return this.voltageDropLimits.branchCircuit;
  }

  /**
   * Check if wire size is below minimum
   */
  private static isBelowMinimumWireSize(wireSize: string, wireType: 'dc' | 'ac' | 'ground'): boolean {
    const minimumSizes = {
      dc: '14',
      ac: '14',
      ground: '14'
    };

    const wireSizeOrder = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0'];
    const minIndex = wireSizeOrder.indexOf(minimumSizes[wireType]);
    const currentIndex = wireSizeOrder.indexOf(wireSize);

    return currentIndex < minIndex;
  }

  /**
   * Calculate total wire length for a connection
   */
  static calculateWireLength(
    fromComponent: SLDComponent,
    toComponent: SLDComponent,
    routingType: 'direct' | 'conduit' | 'cable_tray' = 'direct'
  ): number {
    const dx = toComponent.position.x - fromComponent.position.x;
    const dy = toComponent.position.y - fromComponent.position.y;
    const directDistance = Math.sqrt(dx * dx + dy * dy);

    // Apply routing factors
    const routingFactors = {
      direct: 1.0,
      conduit: 1.1, // 10% extra for conduit bends
      cable_tray: 1.05 // 5% extra for cable tray routing
    };

    return directDistance * routingFactors[routingType];
  }

  /**
   * Get wire cost estimate
   */
  static estimateWireCost(
    conductorSize: string,
    length: number,
    conductorCount: number,
    material: 'copper' | 'aluminum' = 'copper'
  ): number {
    // Simplified cost per foot (in USD)
    const costPerFoot: Record<string, number> = {
      '14': material === 'copper' ? 0.15 : 0.08,
      '12': material === 'copper' ? 0.25 : 0.12,
      '10': material === 'copper' ? 0.40 : 0.20,
      '8': material === 'copper' ? 0.65 : 0.35,
      '6': material === 'copper' ? 1.10 : 0.60,
      '4': material === 'copper' ? 1.80 : 1.00,
      '3': material === 'copper' ? 2.40 : 1.30,
      '2': material === 'copper' ? 3.20 : 1.70,
      '1': material === 'copper' ? 4.50 : 2.40,
      '1/0': material === 'copper' ? 6.20 : 3.30,
      '2/0': material === 'copper' ? 8.50 : 4.50,
      '3/0': material === 'copper' ? 11.80 : 6.20,
      '4/0': material === 'copper' ? 16.40 : 8.60
    };

    const baseCost = costPerFoot[conductorSize] || 1.00;
    return baseCost * length * conductorCount;
  }
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  calculation: WireCalculation;
} 