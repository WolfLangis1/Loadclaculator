/**
 * Automatic Schedule Generation Service
 * 
 * Generates professional electrical schedules from SLD data:
 * - Panel schedules with circuit details
 * - Load schedules with demand calculations
 * - Equipment lists with specifications
 * - Wire and conduit schedules with material takeoffs
 * - NEC compliance tables
 */

import { EnhancedWireSizingService } from './enhancedWireSizingService';
import type { WireSizingParameters } from './enhancedWireSizingService';

export interface ScheduleData {
  id: string;
  type: 'panel' | 'load' | 'equipment' | 'wire' | 'compliance';
  title: string;
  subtitle?: string;
  lastUpdated: Date;
  projectInfo: ProjectReference;
  headers: ScheduleColumn[];
  rows: ScheduleRow[];
  totals?: ScheduleTotals;
  notes?: string[];
  necReferences?: string[];
}

export interface ScheduleColumn {
  id: string;
  header: string;
  width: number; // Percentage of total width
  align: 'left' | 'center' | 'right';
  dataType: 'text' | 'number' | 'currency' | 'percentage';
  format?: string; // For number formatting
}

export interface ScheduleRow {
  id: string;
  cells: ScheduleCell[];
  category?: string;
  highlighted?: boolean;
  necCompliant?: boolean;
}

export interface ScheduleCell {
  value: string | number;
  formatted?: string;
  style?: CellStyle;
  validation?: ValidationResult;
}

export interface CellStyle {
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontSize?: number;
  border?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  necReference?: string;
}

export interface ScheduleTotals {
  [columnId: string]: {
    value: number;
    formatted: string;
    label: string;
  };
}

export interface ProjectReference {
  name: string;
  number?: string;
  address?: string;
  engineer?: string;
  date: Date;
}

export interface PanelScheduleOptions {
  includeTotals: boolean;
  showVoltageDrops: boolean;
  showWireSizes: boolean;
  showProtectionSettings: boolean;
  necCompliance: boolean;
  groupByPhase: boolean;
}

export interface LoadScheduleOptions {
  calculationMethod: 'standard' | 'optional' | 'existing';
  includeDemandFactors: boolean;
  showDiversityFactors: boolean;
  breakdownByCategory: boolean;
  includeNonCoincidenLoads: boolean;
}

export interface EquipmentScheduleOptions {
  includeSpecifications: boolean;
  showManufacturerData: boolean;
  includePricing: boolean;
  necCompliance: boolean;
  groupByCategory: boolean;
}

export interface WireScheduleOptions {
  includeMaterialTakeoff: boolean;
  showConduitSizing: boolean;
  includeLaborHours: boolean;
  costEstimation: boolean;
  groupBySize: boolean;
}

// Sample data interfaces for SLD components
export interface SLDPanelData {
  id: string;
  name: string;
  type: 'main' | 'subpanel' | 'loadcenter';
  busRating: number;
  mainBreakerRating: number;
  voltage: number;
  phases: number;
  circuits: SLDCircuitData[];
  location: string;
}

export interface SLDCircuitData {
  id: string;
  number: number;
  description: string;
  load: number; // VA
  current: number; // Amps
  voltage: number;
  protectionRating: number;
  conductorSize: string;
  conduitSize?: string;
  length: number;
  loadType: 'continuous' | 'non-continuous' | 'motor' | 'evse';
  phase: 'A' | 'B' | 'C' | 'AB' | 'BC' | 'CA' | 'ABC';
  equipment?: string;
}

export interface SLDLoadData {
  id: string;
  name: string;
  category: 'lighting' | 'receptacles' | 'hvac' | 'motor' | 'evse' | 'solar' | 'appliance';
  load: number; // VA
  voltage: number;
  current: number;
  demandFactor: number;
  diversityFactor: number;
  continuous: boolean;
  location: string;
  necReference?: string;
}

export interface SLDEquipmentData {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  voltage: number;
  current: number;
  power?: number;
  specifications: Record<string, any>;
  location: string;
  necCompliance?: boolean;
}

export class AutomaticScheduleGenerator {
  
  /**
   * Generate panel schedule from SLD panel data
   */
  static generatePanelSchedule(
    panelData: SLDPanelData,
    projectInfo: ProjectReference,
    options: PanelScheduleOptions = {
      includeTotals: true,
      showVoltageDrops: true,
      showWireSizes: true,
      showProtectionSettings: true,
      necCompliance: true,
      groupByPhase: false
    }
  ): ScheduleData {
    
    const headers: ScheduleColumn[] = [
      {
        id: 'circuit',
        header: 'CKT #',
        width: 8,
        align: 'center',
        dataType: 'number'
      },
      {
        id: 'description',
        header: 'DESCRIPTION',
        width: 25,
        align: 'left',
        dataType: 'text'
      },
      {
        id: 'load',
        header: 'LOAD (VA)',
        width: 12,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      },
      {
        id: 'current',
        header: 'AMPS',
        width: 10,
        align: 'right',
        dataType: 'number',
        format: '0.0'
      },
      {
        id: 'protection',
        header: 'PROT (A)',
        width: 10,
        align: 'center',
        dataType: 'number'
      }
    ];
    
    // Add optional columns
    if (options.showWireSizes) {
      headers.push({
        id: 'wire',
        header: 'WIRE SIZE',
        width: 10,
        align: 'center',
        dataType: 'text'
      });
    }
    
    if (options.showVoltageDrops) {
      headers.push({
        id: 'voltageDrop',
        header: 'VD (%)',
        width: 8,
        align: 'right',
        dataType: 'percentage',
        format: '0.0'
      });
    }
    
    headers.push({
      id: 'phase',
      header: 'PHASE',
      width: 8,
      align: 'center',
      dataType: 'text'
    });
    
    if (options.necCompliance) {
      headers.push({
        id: 'compliance',
        header: 'NEC',
        width: 5,
        align: 'center',
        dataType: 'text'
      });
    }
    
    // Generate rows from circuit data
    const rows: ScheduleRow[] = [];
    let totalLoad = 0;
    let totalCurrent = 0;
    
    // Sort circuits by number or group by phase
    const sortedCircuits = options.groupByPhase 
      ? this.groupCircuitsByPhase(panelData.circuits)
      : panelData.circuits.sort((a, b) => a.number - b.number);
    
    sortedCircuits.forEach(circuit => {
      const cells: ScheduleCell[] = [
        { value: circuit.number },
        { value: circuit.description },
        { value: circuit.load, formatted: circuit.load.toLocaleString() },
        { value: circuit.current, formatted: circuit.current.toFixed(1) },
        { value: circuit.protectionRating }
      ];
      
      if (options.showWireSizes) {
        cells.push({ value: `${circuit.conductorSize} AWG` });
      }
      
      if (options.showVoltageDrops) {
        const voltageDrop = this.calculateVoltageDropForCircuit(circuit);
        const voltageDropPercent = (voltageDrop / circuit.voltage) * 100;
        cells.push({ 
          value: voltageDropPercent,
          formatted: `${voltageDropPercent.toFixed(1)}%`,
          style: voltageDropPercent > 3 ? { textColor: '#dc2626' } : undefined
        });
      }
      
      cells.push({ value: circuit.phase });
      
      if (options.necCompliance) {
        const compliant = this.checkCircuitCompliance(circuit);
        cells.push({ 
          value: compliant ? '✓' : '✗',
          style: { textColor: compliant ? '#059669' : '#dc2626' }
        });
      }
      
      rows.push({
        id: circuit.id,
        cells,
        necCompliant: options.necCompliance ? this.checkCircuitCompliance(circuit) : undefined
      });
      
      totalLoad += circuit.load;
      totalCurrent += circuit.current;
    });
    
    // Add totals row if requested
    const totals: ScheduleTotals = {};
    if (options.includeTotals) {
      totals.load = {
        value: totalLoad,
        formatted: totalLoad.toLocaleString(),
        label: 'Total Connected Load'
      };
      totals.current = {
        value: totalCurrent,
        formatted: totalCurrent.toFixed(1),
        label: 'Total Current'
      };
    }
    
    return {
      id: `panel_${panelData.id}`,
      type: 'panel',
      title: `${panelData.name} - Panel Schedule`,
      subtitle: `${panelData.busRating}A, ${panelData.voltage}V, ${panelData.phases}-Phase`,
      lastUpdated: new Date(),
      projectInfo,
      headers,
      rows,
      totals,
      notes: this.generatePanelScheduleNotes(panelData, options),
      necReferences: ['NEC 408.4', 'NEC 210.11', 'NEC 220.14']
    };
  }
  
  /**
   * Generate load schedule with demand calculations
   */
  static generateLoadSchedule(
    loads: SLDLoadData[],
    projectInfo: ProjectReference,
    options: LoadScheduleOptions = {
      calculationMethod: 'standard',
      includeDemandFactors: true,
      showDiversityFactors: false,
      breakdownByCategory: true,
      includeNonCoincidenLoads: false
    }
  ): ScheduleData {
    
    const headers: ScheduleColumn[] = [
      {
        id: 'category',
        header: 'LOAD CATEGORY',
        width: 20,
        align: 'left',
        dataType: 'text'
      },
      {
        id: 'description',
        header: 'DESCRIPTION',
        width: 25,
        align: 'left',
        dataType: 'text'
      },
      {
        id: 'connectedLoad',
        header: 'CONNECTED LOAD (VA)',
        width: 15,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      },
      {
        id: 'demandFactor',
        header: 'DEMAND FACTOR',
        width: 12,
        align: 'center',
        dataType: 'percentage',
        format: '0%'
      },
      {
        id: 'demandLoad',
        header: 'DEMAND LOAD (VA)',
        width: 15,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      },
      {
        id: 'necReference',
        header: 'NEC REF',
        width: 13,
        align: 'center',
        dataType: 'text'
      }
    ];
    
    // Group loads by category if requested
    const groupedLoads = options.breakdownByCategory 
      ? this.groupLoadsByCategory(loads)
      : { 'All Loads': loads };
    
    const rows: ScheduleRow[] = [];
    let grandTotalConnected = 0;
    let grandTotalDemand = 0;
    
    Object.entries(groupedLoads).forEach(([category, categoryLoads]) => {
      // Add category header
      if (options.breakdownByCategory && Object.keys(groupedLoads).length > 1) {
        rows.push({
          id: `category_${category}`,
          cells: [
            { 
              value: category.toUpperCase(),
              style: { fontWeight: 'bold', backgroundColor: '#f3f4f6' }
            },
            { value: '', style: { backgroundColor: '#f3f4f6' } },
            { value: '', style: { backgroundColor: '#f3f4f6' } },
            { value: '', style: { backgroundColor: '#f3f4f6' } },
            { value: '', style: { backgroundColor: '#f3f4f6' } },
            { value: '', style: { backgroundColor: '#f3f4f6' } }
          ],
          category,
          highlighted: true
        });
      }
      
      let categoryTotalConnected = 0;
      let categoryTotalDemand = 0;
      
      categoryLoads.forEach(load => {
        const demandLoad = load.load * load.demandFactor;
        
        rows.push({
          id: load.id,
          cells: [
            { value: options.breakdownByCategory ? '' : load.category },
            { value: load.name },
            { value: load.load, formatted: load.load.toLocaleString() },
            { value: load.demandFactor, formatted: `${(load.demandFactor * 100).toFixed(0)}%` },
            { value: demandLoad, formatted: demandLoad.toLocaleString() },
            { value: load.necReference || this.getNECReferenceForLoad(load) }
          ]
        });
        
        categoryTotalConnected += load.load;
        categoryTotalDemand += demandLoad;
      });
      
      // Add category subtotal
      if (options.breakdownByCategory && Object.keys(groupedLoads).length > 1) {
        rows.push({
          id: `subtotal_${category}`,
          cells: [
            { value: 'SUBTOTAL', style: { fontWeight: 'bold' } },
            { value: '', style: { fontWeight: 'bold' } },
            { 
              value: categoryTotalConnected,
              formatted: categoryTotalConnected.toLocaleString(),
              style: { fontWeight: 'bold' }
            },
            { value: '', style: { fontWeight: 'bold' } },
            { 
              value: categoryTotalDemand,
              formatted: categoryTotalDemand.toLocaleString(),
              style: { fontWeight: 'bold' }
            },
            { value: '', style: { fontWeight: 'bold' } }
          ]
        });
      }
      
      grandTotalConnected += categoryTotalConnected;
      grandTotalDemand += categoryTotalDemand;
    });
    
    const totals: ScheduleTotals = {
      connectedLoad: {
        value: grandTotalConnected,
        formatted: grandTotalConnected.toLocaleString(),
        label: 'Total Connected Load'
      },
      demandLoad: {
        value: grandTotalDemand,
        formatted: grandTotalDemand.toLocaleString(),
        label: 'Total Demand Load'
      }
    };
    
    return {
      id: 'load_schedule',
      type: 'load',
      title: 'Load Schedule',
      subtitle: `${options.calculationMethod.charAt(0).toUpperCase() + options.calculationMethod.slice(1)} Method`,
      lastUpdated: new Date(),
      projectInfo,
      headers,
      rows,
      totals,
      notes: this.generateLoadScheduleNotes(options),
      necReferences: this.getNECReferencesForLoadCalculation(options.calculationMethod)
    };
  }
  
  /**
   * Generate equipment list with specifications
   */
  static generateEquipmentSchedule(
    equipment: SLDEquipmentData[],
    projectInfo: ProjectReference,
    options: EquipmentScheduleOptions = {
      includeSpecifications: true,
      showManufacturerData: true,
      includePricing: false,
      necCompliance: true,
      groupByCategory: true
    }
  ): ScheduleData {
    
    const headers: ScheduleColumn[] = [
      {
        id: 'tag',
        header: 'TAG',
        width: 10,
        align: 'center',
        dataType: 'text'
      },
      {
        id: 'description',
        header: 'EQUIPMENT DESCRIPTION',
        width: 25,
        align: 'left',
        dataType: 'text'
      },
      {
        id: 'voltage',
        header: 'VOLTAGE',
        width: 10,
        align: 'center',
        dataType: 'number'
      },
      {
        id: 'current',
        header: 'CURRENT (A)',
        width: 12,
        align: 'right',
        dataType: 'number',
        format: '0.0'
      },
      {
        id: 'power',
        header: 'POWER (W)',
        width: 12,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      }
    ];
    
    if (options.showManufacturerData) {
      headers.push({
        id: 'manufacturer',
        header: 'MANUFACTURER',
        width: 15,
        align: 'left',
        dataType: 'text'
      });
      headers.push({
        id: 'model',
        header: 'MODEL',
        width: 16,
        align: 'left',
        dataType: 'text'
      });
    }
    
    const rows: ScheduleRow[] = [];
    
    // Group by category if requested
    const groupedEquipment = options.groupByCategory 
      ? this.groupEquipmentByType(equipment)
      : { 'All Equipment': equipment };
    
    Object.entries(groupedEquipment).forEach(([category, categoryEquipment]) => {
      if (options.groupByCategory && Object.keys(groupedEquipment).length > 1) {
        // Add category header
        rows.push({
          id: `category_${category}`,
          cells: headers.map(() => ({ 
            value: '',
            style: { backgroundColor: '#f3f4f6' }
          })),
          highlighted: true
        });
        rows[rows.length - 1].cells[0] = { 
          value: category.toUpperCase(),
          style: { fontWeight: 'bold', backgroundColor: '#f3f4f6' }
        };
      }
      
      categoryEquipment.forEach((item, index) => {
        const cells: ScheduleCell[] = [
          { value: `${category.charAt(0).toUpperCase()}${index + 1}` },
          { value: item.name },
          { value: item.voltage },
          { value: item.current, formatted: item.current.toFixed(1) },
          { value: item.power || (item.voltage * item.current), formatted: (item.power || (item.voltage * item.current)).toLocaleString() }
        ];
        
        if (options.showManufacturerData) {
          cells.push({ value: item.manufacturer || 'TBD' });
          cells.push({ value: item.model || 'TBD' });
        }
        
        rows.push({
          id: item.id,
          cells,
          necCompliant: options.necCompliance ? item.necCompliance : undefined
        });
      });
    });
    
    return {
      id: 'equipment_schedule',
      type: 'equipment',
      title: 'Equipment Schedule',
      subtitle: 'Electrical Equipment List and Specifications',
      lastUpdated: new Date(),
      projectInfo,
      headers,
      rows,
      notes: this.generateEquipmentScheduleNotes(options),
      necReferences: ['NEC 110.3(B)', 'NEC 110.26', 'NEC 408.3']
    };
  }
  
  /**
   * Generate wire and conduit schedule with material takeoff
   */
  static generateWireSchedule(
    circuits: SLDCircuitData[],
    projectInfo: ProjectReference,
    options: WireScheduleOptions = {
      includeMaterialTakeoff: true,
      showConduitSizing: true,
      includeLaborHours: false,
      costEstimation: false,
      groupBySize: true
    }
  ): ScheduleData {
    
    const headers: ScheduleColumn[] = [
      {
        id: 'wireSize',
        header: 'WIRE SIZE',
        width: 12,
        align: 'center',
        dataType: 'text'
      },
      {
        id: 'length',
        header: 'LENGTH (FT)',
        width: 12,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      },
      {
        id: 'conductors',
        header: '# CONDUCTORS',
        width: 12,
        align: 'center',
        dataType: 'number'
      }
    ];
    
    if (options.showConduitSizing) {
      headers.push({
        id: 'conduitSize',
        header: 'CONDUIT SIZE',
        width: 12,
        align: 'center',
        dataType: 'text'
      });
      headers.push({
        id: 'conduitLength',
        header: 'CONDUIT (FT)',
        width: 12,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      });
    }
    
    if (options.includeMaterialTakeoff) {
      headers.push({
        id: 'wireQuantity',
        header: 'WIRE QTY (FT)',
        width: 15,
        align: 'right',
        dataType: 'number',
        format: '0,0'
      });
    }
    
    if (options.costEstimation) {
      headers.push({
        id: 'unitCost',
        header: 'UNIT COST',
        width: 10,
        align: 'right',
        dataType: 'currency'
      });
      headers.push({
        id: 'totalCost',
        header: 'TOTAL COST',
        width: 15,
        align: 'right',
        dataType: 'currency'
      });
    }
    
    // Group circuits by wire size
    const wireGroups = this.groupCircuitsByWireSize(circuits);
    const rows: ScheduleRow[] = [];
    
    Object.entries(wireGroups).forEach(([wireSize, sizeCircuits]) => {
      const totalLength = sizeCircuits.reduce((sum, circuit) => sum + circuit.length, 0);
      const conductorCount = this.calculateConductorCount(sizeCircuits[0]);
      const totalWireLength = totalLength * conductorCount;
      
      // Estimate conduit requirements
      const conduitSize = this.estimateConduitSize(wireSize, conductorCount);
      
      const cells: ScheduleCell[] = [
        { value: `${wireSize} AWG` },
        { value: totalLength, formatted: totalLength.toLocaleString() },
        { value: conductorCount }
      ];
      
      if (options.showConduitSizing) {
        cells.push({ value: conduitSize });
        cells.push({ value: totalLength, formatted: totalLength.toLocaleString() });
      }
      
      if (options.includeMaterialTakeoff) {
        cells.push({ value: totalWireLength, formatted: totalWireLength.toLocaleString() });
      }
      
      if (options.costEstimation) {
        const unitCost = this.getWireUnitCost(wireSize);
        const totalCost = totalWireLength * unitCost;
        cells.push({ value: unitCost, formatted: `$${unitCost.toFixed(2)}` });
        cells.push({ value: totalCost, formatted: `$${totalCost.toFixed(2)}` });
      }
      
      rows.push({
        id: `wire_${wireSize}`,
        cells
      });
    });
    
    return {
      id: 'wire_schedule',
      type: 'wire',
      title: 'Wire and Conduit Schedule',
      subtitle: 'Material Takeoff and Specifications',
      lastUpdated: new Date(),
      projectInfo,
      headers,
      rows,
      notes: this.generateWireScheduleNotes(options),
      necReferences: ['NEC 310.15', 'NEC Chapter 9', 'NEC 358.22']
    };
  }
  
  /**
   * Helper methods for data processing and calculations
   */
  
  private static groupCircuitsByPhase(circuits: SLDCircuitData[]): SLDCircuitData[] {
    return circuits.sort((a, b) => {
      const phaseOrder = { 'A': 1, 'B': 2, 'C': 3, 'AB': 4, 'BC': 5, 'CA': 6, 'ABC': 7 };
      return phaseOrder[a.phase] - phaseOrder[b.phase];
    });
  }
  
  private static calculateVoltageDropForCircuit(circuit: SLDCircuitData): number {
    // Simplified voltage drop calculation
    // In production, would use EnhancedWireSizingService
    const wireSizingParams: WireSizingParameters = {
      loadCurrent: circuit.current,
      voltage: circuit.voltage,
      distance: circuit.length,
      conductorMaterial: 'copper',
      tempRating: '75C',
      ambientTemp: 30,
      conduitFill: 3,
      loadType: circuit.loadType,
      circuitType: 'branch',
      installationMethod: 'conduit'
    };
    
    const result = EnhancedWireSizingService.analyzeVoltageDropRealTime(
      circuit.current,
      circuit.voltage,
      circuit.length,
      circuit.conductorSize,
      'copper'
    );
    
    return result.voltageDrop;
  }
  
  private static checkCircuitCompliance(circuit: SLDCircuitData): boolean {
    // Simplified compliance check
    const voltageDrop = this.calculateVoltageDropForCircuit(circuit);
    const voltageDropPercent = (voltageDrop / circuit.voltage) * 100;
    
    // Basic checks
    return voltageDropPercent <= 3 && 
           circuit.protectionRating >= circuit.current &&
           circuit.conductorSize !== '';
  }
  
  private static groupLoadsByCategory(loads: SLDLoadData[]): Record<string, SLDLoadData[]> {
    return loads.reduce((groups, load) => {
      const category = load.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(load);
      return groups;
    }, {} as Record<string, SLDLoadData[]>);
  }
  
  private static groupEquipmentByType(equipment: SLDEquipmentData[]): Record<string, SLDEquipmentData[]> {
    return equipment.reduce((groups, item) => {
      const type = item.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
      return groups;
    }, {} as Record<string, SLDEquipmentData[]>);
  }
  
  private static groupCircuitsByWireSize(circuits: SLDCircuitData[]): Record<string, SLDCircuitData[]> {
    return circuits.reduce((groups, circuit) => {
      const size = circuit.conductorSize;
      if (!groups[size]) groups[size] = [];
      groups[size].push(circuit);
      return groups;
    }, {} as Record<string, SLDCircuitData[]>);
  }
  
  private static getNECReferenceForLoad(load: SLDLoadData): string {
    const references = {
      lighting: 'NEC 220.14(A)',
      receptacles: 'NEC 220.14(I)',
      hvac: 'NEC 220.14(C)',
      motor: 'NEC 430.22',
      evse: 'NEC 625.17',
      solar: 'NEC 690.8',
      appliance: 'NEC 220.14'
    };
    return references[load.category] || 'NEC 220.14';
  }
  
  private static calculateConductorCount(circuit: SLDCircuitData): number {
    // Simplified conductor count calculation
    if (circuit.voltage <= 120) return 2; // Hot + Neutral
    if (circuit.voltage <= 240) return 2; // Hot + Hot or Hot + Neutral
    return 3; // 3-phase
  }
  
  private static estimateConduitSize(wireSize: string, conductorCount: number): string {
    // Simplified conduit sizing - would use NEC Chapter 9 tables in production
    const conduitSizes = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"'];
    const wireIndex = ['14', '12', '10', '8', '6', '4', '2', '1', '1/0', '2/0', '3/0', '4/0'].indexOf(wireSize);
    const sizeIndex = Math.min(Math.floor(wireIndex / 2) + Math.floor(conductorCount / 3), conduitSizes.length - 1);
    return conduitSizes[Math.max(0, sizeIndex)];
  }
  
  private static getWireUnitCost(wireSize: string): number {
    // Simplified pricing - would integrate with actual pricing database
    const prices: Record<string, number> = {
      '14': 0.25, '12': 0.35, '10': 0.55, '8': 0.85, '6': 1.25,
      '4': 1.85, '2': 2.65, '1': 3.25, '1/0': 4.15, '2/0': 5.25
    };
    return prices[wireSize] || 1.0;
  }
  
  private static generatePanelScheduleNotes(panel: SLDPanelData, options: PanelScheduleOptions): string[] {
    const notes = [
      'All circuits sized per NEC requirements',
      `Panel rated for ${panel.busRating}A, ${panel.voltage}V, ${panel.phases}-phase`
    ];
    
    if (options.showVoltageDrops) {
      notes.push('Voltage drops calculated at full load');
    }
    
    return notes;
  }
  
  private static generateLoadScheduleNotes(options: LoadScheduleOptions): string[] {
    const notes = [
      `Load calculation per NEC ${options.calculationMethod} method`,
      'Demand factors per NEC Table 220.42'
    ];
    
    if (options.includeDemandFactors) {
      notes.push('Individual demand factors applied per equipment type');
    }
    
    return notes;
  }
  
  private static generateEquipmentScheduleNotes(options: EquipmentScheduleOptions): string[] {
    return [
      'All equipment shall be UL listed',
      'Equipment specifications subject to engineer approval',
      'Manufacturer substitutions require engineer approval'
    ];
  }
  
  private static generateWireScheduleNotes(options: WireScheduleOptions): string[] {
    const notes = [
      'All conductors 75°C copper unless noted',
      'Wire quantities include 10% waste factor'
    ];
    
    if (options.showConduitSizing) {
      notes.push('Conduit sizing per NEC Chapter 9');
    }
    
    return notes;
  }
  
  private static getNECReferencesForLoadCalculation(method: string): string[] {
    const references = {
      standard: ['NEC 220.40', 'NEC 220.42', 'NEC 220.14'],
      optional: ['NEC 220.82', 'NEC 220.83'],
      existing: ['NEC 220.87']
    };
    return references[method as keyof typeof references] || references.standard;
  }
}