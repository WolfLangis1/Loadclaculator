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
  emsMaxLoad: number = 0
): CalculationResults => {
  const { generalLoads, hvacLoads, evseLoads, solarBatteryLoads } = loadState;
  
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
  
  // Apply demand factors to base general loads
  switch (calculationMethod) {
    case 'optional': {
      // NEC 220.83: First 8 kVA at 100%, remainder at 40%
      const first8kVA = Math.min(baseGeneralVA, 8000);
      const remainder = Math.max(baseGeneralVA - 8000, 0);
      calc.generalDemand = first8kVA + (remainder * NEC_CONSTANTS.DEMAND_FACTORS.OPTIONAL_METHOD.REMAINDER);
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
  
  // Calculate large appliance demand (separate from general loads)
  calc.applianceDemand = generalLoads.reduce((sum, load) => sum + load.total, 0);
  
  // Calculate HVAC demand
  calc.hvacDemand = hvacLoads.reduce((sum, load) => sum + load.total, 0);
  
  // Calculate EVSE demand
  if (useEMS && emsMaxLoad > 0) {
    calc.evseDemand = emsMaxLoad * 240 * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR; // Convert amps to VA
  } else {
    calc.evseDemand = evseLoads.reduce((sum, load) => sum + load.total, 0) * NEC_CONSTANTS.CONTINUOUS_LOAD_FACTOR;
  }
  
  // Calculate solar/battery capacity
  calc.solarCapacityKW = solarBatteryLoads
    .filter(load => load.type === 'solar')
    .reduce((sum, load) => sum + load.kw, 0);
    
  calc.batteryCapacityKW = solarBatteryLoads
    .filter(load => load.type === 'battery')
    .reduce((sum, load) => sum + load.kw, 0);
  
  // Calculate interconnection amps
  calc.totalInterconnectionAmps = solarBatteryLoads.reduce((sum, load) => sum + load.inverterAmps, 0);
  
  // Check 120% rule for solar interconnection
  const busbarRating = panelDetails.busRating || mainBreaker;
  const maxAllowableBackfeed = (busbarRating * 1.2) - mainBreaker;
  calc.interconnectionCompliant = calc.totalInterconnectionAmps <= maxAllowableBackfeed;
  
  // Calculate total demand
  const totalDemandVA = (calc.generalDemand || 0) + (calc.applianceDemand || 0) + 
    (calc.hvacDemand || 0) + (calc.evseDemand || 0);
  
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
  
  // Check service adequacy
  if ((calc.totalAmps || 0) > mainBreaker * 0.8) {
    warnings.push({
      type: 'warning',
      message: `Load ${calc.totalAmps?.toFixed(1)}A exceeds 80% of ${mainBreaker}A service capacity`,
      code: 'NEC 220.83'
    });
  }
  
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
  
  calc.warnings = warnings;
  calc.errors = errors;
  
  return calc as CalculationResults;
};