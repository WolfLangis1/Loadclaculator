import { NEC_CONSTANTS } from '../constants';
import type { 
  CalculationResults, 
  LoadState, 
  CalculationMethod, 
  ValidationMessage,
  ActualDemandData,
  PanelDetails 
} from '../types';

export const calculateLoadDemand = (
  loadState: LoadState,
  calculationMethod: CalculationMethod,
  squareFootage: number,
  mainBreaker: number,
  panelDetails: PanelDetails,
  actualDemandData: ActualDemandData,
  useEMS: boolean = false,
  emsMaxLoad: number = 0,
  loadManagementType: 'none' | 'ems' | 'simpleswitch' | 'dcc' = 'none',
  loadManagementMaxLoad: number = 0,
  simpleSwitchMode: 'branch_sharing' | 'feeder_monitoring' = 'branch_sharing',
  simpleSwitchLoadA: {
    type: 'general' | 'hvac' | 'evse';
    id: number;
    name: string;
    amps: number;
  } | null = null,
  simpleSwitchLoadB: {
    type: 'general' | 'hvac' | 'evse';
    id: number;
    name: string;
    amps: number;
  } | null = null
): CalculationResults => {
  const { 
    generalLoads = [], 
    hvacLoads = [], 
    evseLoads = [], 
    solarBatteryLoads = [] 
  } = loadState || {};
  
  // Initialize calculation object
  const calc: Partial<CalculationResults> = {
    warnings: [],
    errors: []
  };
  
  // Calculate base general loads (NEC 220.52 mandatory loads)
  const lightingVA = squareFootage * NEC_CONSTANTS.GENERAL_LIGHTING_VA_PER_SQFT;
  const smallApplianceVA = NEC_CONSTANTS.SMALL_APPLIANCE_VA * 2; // Kitchen circuits
  const laundryVA = NEC_CONSTANTS.LAUNDRY_VA;
  const bathroomVA = NEC_CONSTANTS.BATHROOM_VA;
  
  const baseGeneralVA = lightingVA + smallApplianceVA + laundryVA + bathroomVA;
  calc.generalLoadVA = baseGeneralVA;
  
  // Calculate large appliance demand (separate from general loads)
  const rawApplianceDemand = generalLoads.reduce((sum, load) => sum + load.total, 0);
  calc.applianceDemand = rawApplianceDemand;
  
  // Apply demand factors to general loads + appliances for optional method
  switch (calculationMethod) {
    case 'optional': {
      // NEC 220.83: First 10 kVA at 100%, remainder at 40%
      // Includes base general loads AND appliance loads
      const totalGeneralAndAppliances = baseGeneralVA + rawApplianceDemand;
      const first10kVA = Math.min(totalGeneralAndAppliances, 10000);
      const remainder = Math.max(totalGeneralAndAppliances - 10000, 0);
      calc.generalDemand = first10kVA + (remainder * NEC_CONSTANTS.DEMAND_FACTORS.OPTIONAL_METHOD.REMAINDER);
      // Store original appliance demand for transparency display, but mark as included in general
      calc.appliancesIncludedInGeneral = true;
      break;
    }
      
    case 'standard': {
      const first3kVA = Math.min(baseGeneralVA, 3000);
      const next117kVA = Math.min(Math.max(baseGeneralVA - 3000, 0), 117000);
      const above120kVA = Math.max(baseGeneralVA - 120000, 0);
      calc.generalDemand = first3kVA + 
        (next117kVA * NEC_CONSTANTS.DEMAND_FACTORS.STANDARD_METHOD.NEXT_117K) + 
        (above120kVA * NEC_CONSTANTS.DEMAND_FACTORS.STANDARD_METHOD.ABOVE_120K);
      break;
    }
      
    case 'existing': {
      if (actualDemandData.enabled && actualDemandData.averageDemand > 0) {
        calc.generalDemand = actualDemandData.averageDemand * 1000; // Convert kW to VA
      } else {
        const first8kVA = Math.min(baseGeneralVA, 8000);
        const remainderExisting = Math.max(baseGeneralVA - 8000, 0);
        calc.generalDemand = first8kVA + (remainderExisting * NEC_CONSTANTS.DEMAND_FACTORS.EXISTING_DWELLING.REMAINDER);
      }
      break;
    }
  }
  
  // Calculate EVSE demand (NEC 625.42) - moved before HVAC to handle SimpleSwitch properly
  let totalEvseVA = evseLoads.reduce((sum, load) => sum + load.total, 0);
  let totalEvseAmps = evseLoads.reduce((sum, load) => sum + (load.amps * load.quantity), 0);
  
  // Track SimpleSwitch managed loads to exclude from other calculations
  let simpleSwitchManagedEvseVA = 0;
  let simpleSwitchManagedGeneralVA = 0;
  let simpleSwitchManagedHvacVA = 0;
  
  // Determine which load management system to use
  const effectiveLoadMgmt = loadManagementType !== 'none' ? loadManagementType : (useEMS ? 'ems' : 'none');
  const effectiveMaxLoad = loadManagementType !== 'none' ? loadManagementMaxLoad : emsMaxLoad;
  
  if (effectiveLoadMgmt !== 'none') {
    let effectiveLoad = 0;
    let deviceName = '';
    
    switch (effectiveLoadMgmt) {
      case 'ems':
        effectiveLoad = effectiveMaxLoad > 0 ? Math.min(effectiveMaxLoad, totalEvseAmps) : totalEvseAmps;
        deviceName = 'Energy Management System';
        break;
        
      case 'simpleswitch':
        deviceName = 'SimpleSwitch Load Management';
        
        if (simpleSwitchMode === 'branch_sharing') {
          // Branch Circuit Sharing: Only one of two appliances operates at a time
          // SimpleSwitch max capacity: 50A/12kW per UL 916
          const primaryLoad = simpleSwitchLoadA ? Math.min(simpleSwitchLoadA.amps, 50) : 0;
          const secondaryLoad = simpleSwitchLoadB ? Math.min(simpleSwitchLoadB.amps, 50) : 0;
          effectiveLoad = Math.max(primaryLoad, secondaryLoad); // Larger of the two loads
          
          // Calculate what loads are being managed by SimpleSwitch
          if (simpleSwitchLoadA) {
            const loadA_VA = simpleSwitchLoadA.amps * 240;
            if (simpleSwitchLoadA.type === 'evse') {
              simpleSwitchManagedEvseVA += loadA_VA;
            } else if (simpleSwitchLoadA.type === 'general') {
              simpleSwitchManagedGeneralVA += loadA_VA;
            } else if (simpleSwitchLoadA.type === 'hvac') {
              simpleSwitchManagedHvacVA += loadA_VA;
            }
          }
          
          if (simpleSwitchLoadB) {
            const loadB_VA = simpleSwitchLoadB.amps * 240;
            if (simpleSwitchLoadB.type === 'evse') {
              simpleSwitchManagedEvseVA += loadB_VA;
            } else if (simpleSwitchLoadB.type === 'general') {
              simpleSwitchManagedGeneralVA += loadB_VA;
            } else if (simpleSwitchLoadB.type === 'hvac') {
              simpleSwitchManagedHvacVA += loadB_VA;
            }
          }
          
          if ((simpleSwitchLoadA && simpleSwitchLoadA.amps > 50) || (simpleSwitchLoadB && simpleSwitchLoadB.amps > 50)) {
            calc.warnings?.push({
              code: 'SS-001',
              message: `SimpleSwitch maximum capacity is 50A/12kW. Loads exceeding this require different load management.`,
              type: 'warning'
            });
          }
        } else {
          // Feeder Monitoring: Whole-home load management at 80% panel capacity
          const panelThreshold = mainBreaker * 0.8; // SimpleSwitch triggers at 80% panel capacity
          effectiveLoad = Math.min(loadManagementMaxLoad || panelThreshold, 50); // Limited by SimpleSwitch capacity
        }
        break;
        
      case 'dcc':
        effectiveLoad = effectiveMaxLoad > 0 ? Math.min(effectiveMaxLoad, totalEvseAmps) : totalEvseAmps;
        deviceName = 'DCC (Dynamic Current Control)';
        break;
    }
    
    // EVSE demand calculation per NEC 625.42(B): 100% of nameplate rating
    // For SimpleSwitch branch sharing, subtract managed loads and add effective load
    if (effectiveLoadMgmt === 'simpleswitch' && simpleSwitchMode === 'branch_sharing') {
      calc.evseDemand = (totalEvseVA - simpleSwitchManagedEvseVA) + (effectiveLoad * 240);
    } else {
      // Load management reduces the actual operating load, not the calculation factor
      calc.evseDemand = effectiveLoad * 240; // Convert amps to VA at 100%
    }
    
    // Add validation warnings based on load management type
    if (effectiveLoadMgmt === 'simpleswitch') {
      if (simpleSwitchMode === 'branch_sharing') {
        if (!simpleSwitchLoadA || !simpleSwitchLoadB) {
          calc.warnings?.push({
            code: 'SS-002',
            message: `SimpleSwitch Branch Sharing mode requires both Load A and Load B to be selected.`,
            type: 'warning'
          });
        } else {
          calc.warnings?.push({
            code: 'SS-003',
            message: `SimpleSwitch manages ${simpleSwitchLoadA.name} (${simpleSwitchLoadA.amps}A) and ${simpleSwitchLoadB.name} (${simpleSwitchLoadB.amps}A). Maximum simultaneous operation: ${effectiveLoad}A.`,
            type: 'warning'
          });
        }
      } else {
        calc.warnings?.push({
          code: 'SS-004',
          message: `SimpleSwitch Feeder Monitoring pauses loads when panel reaches 80% capacity (${(mainBreaker * 0.8).toFixed(0)}A).`,
          type: 'warning'
        });
      }
    } else {
      // Standard EMS/DCC validation
      if (effectiveMaxLoad > totalEvseAmps && totalEvseAmps > 0) {
        calc.warnings?.push({
          code: 'LM-001',
          message: `${deviceName} max load (${effectiveMaxLoad}A) exceeds total EVSE capacity (${totalEvseAmps}A). Using ${Math.min(effectiveMaxLoad, totalEvseAmps)}A.`,
          type: 'warning'
        });
      }
      
      if (totalEvseVA === 0) {
        calc.warnings?.push({
          code: 'LM-002',
          message: `${deviceName} is enabled but no EVSE loads are configured.`,
          type: 'warning'
        });
      }
    }
  } else {
    // No load management: NEC 625.42(B) - 100% of nameplate rating for all EVSE
    // Assumes all EVSE can operate simultaneously at full capacity
    calc.evseDemand = totalEvseVA; // Already at 100% - no additional factor needed
  }
  
  // Calculate HVAC demand (subtract any SimpleSwitch managed HVAC loads)
  calc.hvacDemand = hvacLoads.reduce((sum, load) => sum + load.total, 0) - simpleSwitchManagedHvacVA;
  
  // Recalculate general demand with SimpleSwitch adjustments
  if (simpleSwitchManagedGeneralVA > 0) {
    const adjustedApplianceDemand = rawApplianceDemand - simpleSwitchManagedGeneralVA;
    
    switch (calculationMethod) {
      case 'optional': {
        // NEC 220.83: First 10 kVA at 100%, remainder at 40%
        const totalGeneralAndAppliances = baseGeneralVA + adjustedApplianceDemand;
        const first10kVA = Math.min(totalGeneralAndAppliances, 10000);
        const remainder = Math.max(totalGeneralAndAppliances - 10000, 0);
        calc.generalDemand = first10kVA + (remainder * NEC_CONSTANTS.DEMAND_FACTORS.OPTIONAL_METHOD.REMAINDER);
        break;
      }
      case 'standard': {
        // For standard method, appliances are separate, so we don't adjust general demand
        // but we need to subtract from appliance demand
        calc.applianceDemand = adjustedApplianceDemand;
        break;
      }
      case 'existing': {
        if (!actualDemandData.enabled || actualDemandData.averageDemand <= 0) {
          // Only adjust if using calculated method, not actual demand data
          const totalGeneralAndAppliances = baseGeneralVA + adjustedApplianceDemand;
          const first8kVA = Math.min(totalGeneralAndAppliances, 8000);
          const remainderExisting = Math.max(totalGeneralAndAppliances - 8000, 0);
          calc.generalDemand = first8kVA + (remainderExisting * NEC_CONSTANTS.DEMAND_FACTORS.EXISTING_DWELLING.REMAINDER);
        }
        break;
      }
    }
  }
  
  // Calculate solar/battery capacity
  calc.solarCapacityKW = solarBatteryLoads
    .filter(load => load.type === 'solar')
    .reduce((sum, load) => sum + load.kw, 0);
    
  calc.batteryCapacityKW = solarBatteryLoads
    .filter(load => load.type === 'battery')
    .reduce((sum, load) => sum + load.kw, 0);
  
  // Calculate interconnection amps (only for backfeed and load side connections)
  const backfeedAndLoadSideAmps = solarBatteryLoads
    .filter(load => ['backfeed', 'load_side'].includes(load.location) && load.kw > 0)
    .reduce((sum, load) => sum + load.inverterAmps, 0);
  
  calc.totalInterconnectionAmps = backfeedAndLoadSideAmps;
  
  // Check 120% rule for solar interconnection (only applies to backfeed and load side)
  const busbarRating = panelDetails.busRating || mainBreaker;
  const maxAllowableBackfeed = (busbarRating * 1.2) - mainBreaker;
  calc.interconnectionCompliant = calc.totalInterconnectionAmps <= maxAllowableBackfeed;
  
  // Supply side connections bypass the 120% rule but should be noted
  const supplySideAmps = solarBatteryLoads
    .filter(load => load.location === 'supply_side' && load.kw > 0)
    .reduce((sum, load) => sum + load.inverterAmps, 0);
  
  // Calculate battery charging load (batteries can be loads when charging)
  const batteryChargingVA = solarBatteryLoads
    .filter(load => load.type === 'battery' && load.kw > 0)
    .reduce((sum, load) => sum + load.total, 0);
  
  calc.batteryChargingDemand = batteryChargingVA;
  
  // Calculate total demand (solar is not a load, but batteries charging are)
  // For optional method, generalDemand already includes appliances, so don't double-count
  const applianceContribution = calc.appliancesIncludedInGeneral ? 0 : (calc.applianceDemand || 0);
  const totalDemandVA = (calc.generalDemand || 0) + applianceContribution + 
    (calc.hvacDemand || 0) + (calc.evseDemand || 0) + batteryChargingVA;
  
  calc.totalVA = totalDemandVA;
  calc.totalAmps = totalDemandVA / 240; // Convert to amps at 240V
  
  // Calculate critical loads
  const criticalLoads = [
    ...generalLoads.filter(load => load.critical),
    ...hvacLoads.filter(load => load.critical)
  ];
  calc.criticalLoadsAmps = criticalLoads.reduce((sum, load) => sum + (load.total / 240), 0);
  
  // Calculate spare capacity
  calc.spareCapacity = ((mainBreaker - (calc.totalAmps || 0)) / mainBreaker) * 100;
  
  // Recommend service size
  calc.recommendedServiceSize = NEC_CONSTANTS.SERVICE_SIZES.find(size => size >= (calc.totalAmps || 0) * 1.25) || 1200;
  
  // Generate warnings and errors
  const warnings: ValidationMessage[] = [];
  const errors: ValidationMessage[] = [];
  
  // Check service adequacy - main breakers can be loaded to 100%
  // Note: 80% rule (NEC 210.20(A)) applies to branch circuits, not main service breakers
  
  // Check spare capacity
  if ((calc.spareCapacity || 0) < 25) {
    warnings.push({
      type: 'warning',
      message: 'Less than 25% spare capacity remaining for future expansion',
      code: 'NEC 220.14(A)'
    });
  }
  
  // Check solar interconnection
  if ((calc.solarCapacityKW || 0) > 0 && !calc.interconnectionCompliant) {
    errors.push({
      type: 'error',
      message: `Solar interconnection ${calc.totalInterconnectionAmps}A exceeds 120% rule limit of ${maxAllowableBackfeed.toFixed(1)}A`,
      code: 'NEC 705.12(B)(3)(2)'
    });
  }
  
  // Check multiple EVSE without EMS
  const activeEvseCount = evseLoads.filter(load => load.quantity > 0).length;
  if (activeEvseCount > 1 && !useEMS) {
    warnings.push({
      type: 'warning',
      message: 'Multiple EVSEs without EMS require full capacity calculation per NEC 625.42',
      code: 'NEC 625.42'
    });
  }
  
  // Check renewable energy with existing load calculation
  const hasRenewableEnergy = (calc.solarCapacityKW || 0) > 0 || (calc.batteryCapacityKW || 0) > 0;
  if (hasRenewableEnergy && calculationMethod === 'existing' && actualDemandData.enabled) {
    errors.push({
      type: 'error',
      message: 'Cannot use NEC 220.87 existing load determination with renewable energy systems present',
      code: 'NEC 220.87 Exception'
    });
  }
  
  // Note supply side connections
  if (supplySideAmps > 0) {
    warnings.push({
      type: 'warning',
      message: `Supply side connections (${supplySideAmps.toFixed(1)}A) bypass 120% rule but require utility approval per NEC 705.12(A)`,
      code: 'NEC 705.12(A)'
    });
  }
  
  calc.warnings = warnings;
  calc.errors = errors;
  
  return calc as CalculationResults;
};