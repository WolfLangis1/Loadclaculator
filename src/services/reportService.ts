import type { 
  CalculationResults, 
  ProjectInformation, 
  LoadState, 
  CalculationMethod,
  PanelDetails 
} from '../types';
import { calculateWireSize } from './wireCalculations';

export const generateLoadCalculationReport = (
  calculations: CalculationResults,
  projectInfo: ProjectInformation,
  loadState: LoadState,
  calculationMethod: CalculationMethod,
  mainBreaker: number,
  panelDetails: PanelDetails,
  codeYear: string,
  squareFootage: number,
  useEMS: boolean,
  emsMaxLoad: number
): string => {
  const { generalLoads, hvacLoads, evseLoads, solarBatteryLoads } = loadState;
  const hasRenewableEnergy = calculations.solarCapacityKW > 0 || calculations.batteryCapacityKW > 0;

  const report = `
ELECTRICAL LOAD CALCULATION REPORT
==================================

PROJECT INFORMATION
-------------------
Customer: ${projectInfo.customerName}
Property: ${projectInfo.propertyAddress}
City: ${projectInfo.city}, ${projectInfo.state} ${projectInfo.zipCode}
Project: ${projectInfo.projectName}
Square Footage: ${squareFootage.toLocaleString()} sq ft
Calculation Method: NEC ${calculationMethod === 'optional' ? '220.82 Optional' : calculationMethod === 'standard' ? '220.42-220.55 Standard' : '220.87 Existing'} Method
Service Size: ${mainBreaker}A, ${panelDetails.phase === 3 ? '3-Phase' : 'Single Phase'}

LOAD BREAKDOWN
--------------
General Lighting & Receptacles: ${calculations.generalLoadVA?.toLocaleString() || 0} VA
General Load Demand: ${calculations.generalDemand?.toLocaleString() || 0} VA
Appliance Demand: ${calculations.applianceDemand?.toLocaleString() || 0} VA
HVAC Demand: ${calculations.hvacDemand?.toLocaleString() || 0} VA
EVSE Demand: ${calculations.evseDemand?.toLocaleString() || 0} VA

TOTAL CALCULATED LOAD: ${calculations.totalAmps?.toFixed(1) || 0} AMPS

GENERAL LOADS:
${generalLoads.filter(load => load.total > 0).map(load => 
  `${load.name}: Qty=${load.quantity}, ${load.amps}A @ ${load.volts}V, ${load.va}VA, Total=${load.total}VA${load.critical ? ' [CRITICAL]' : ''}`
).join('\n')}

HVAC LOADS:
${hvacLoads.filter(load => load.total > 0).map(load => 
  `${load.name}: Qty=${load.quantity}, ${load.amps}A @ ${load.volts}V, ${load.va}VA, Total=${load.total}VA${load.critical ? ' [CRITICAL]' : ''}`
).join('\n')}

EV CHARGING:
${evseLoads.filter(load => load.total > 0).map(load => 
  `${load.name}: Qty=${load.quantity}, ${load.amps}A @ ${load.volts}V, ${load.va}VA, Total=${load.total}VA (Continuous)`
).join('\n')}

SOLAR & BATTERY SYSTEMS:
${solarBatteryLoads.filter(load => load.kw > 0).map(load => 
  `${load.name}: ${load.kw}kW, Inverter=${load.inverterAmps.toFixed(1)}A, Breaker=${load.breaker}A, Connection=${load.location}`
).join('\n')}

ENERGY MANAGEMENT SYSTEM
------------------------
EMS Enabled: ${useEMS ? 'YES' : 'NO'}
${useEMS ? `EMS Maximum Load Setting: ${emsMaxLoad}A` : ''}

COMPLIANCE NOTES
----------------
${calculations.warnings.map(w => `• ${w.message} (${w.code})`).join('\n')}
${calculations.errors.map(e => `• ERROR: ${e.message} (${e.code})`).join('\n')}

WIRE SIZING SUMMARY
-------------------
Service Conductors: ${calculateWireSize(calculations.totalAmps || 0, 240)} AWG Copper THWN-2
Grounding Electrode Conductor: ${calculations.totalAmps > 100 ? '4' : '6'} AWG Copper
Main Bonding Jumper: ${calculateWireSize((calculations.totalAmps || 0) * 0.125, 240)} AWG

RECOMMENDATIONS
---------------
${calculations.spareCapacity < 25 ? '• Consider upgrading service for future expansion capacity\n' : ''}
${calculations.solarCapacityKW > 0 && !calculations.interconnectionCompliant ? 
  '• Solar interconnection exceeds 120% rule - consider alternative connection methods\n' : ''}
${calculations.totalAmps > mainBreaker * 0.8 ? '• Load exceeds 80% of service capacity - service upgrade recommended\n' : ''}
${evseLoads.filter(l => l.quantity > 0).length > 1 && !useEMS ? 
  '• Multiple EVSEs without EMS - consider installing energy management system per NEC 750.30\n' : ''}
${hasRenewableEnergy ? 
  '• NEC 220.87 cannot be used with renewable energy present - calculation method adjusted\n' : ''}

INSPECTOR NOTES
---------------
This calculation is performed in accordance with NEC ${codeYear} requirements.
All continuous loads have been calculated at 125% per NEC requirements.
${hasRenewableEnergy ? 'Renewable energy interconnection must comply with NEC Article 705.' : ''}
${evseLoads.some(l => l.quantity > 0) ? 'EVSE installation must comply with NEC Article 625.' : ''}

Prepared by: ${projectInfo.calculatedBy || '_____________________'}
Date: ${projectInfo.date}
License #: _____________________

This report is generated for permit submission and field verification purposes.
All calculations should be verified by a licensed electrical professional.
`;

  return report.trim();
};

export const exportReport = (
  calculations: CalculationResults,
  projectInfo: ProjectInformation,
  loadState: LoadState,
  calculationMethod: CalculationMethod,
  mainBreaker: number,
  panelDetails: PanelDetails,
  codeYear: string,
  squareFootage: number,
  useEMS: boolean,
  emsMaxLoad: number
): void => {
  const report = generateLoadCalculationReport(
    calculations, projectInfo, loadState, calculationMethod, 
    mainBreaker, panelDetails, codeYear, squareFootage, useEMS, emsMaxLoad
  );
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Load_Calculation_${projectInfo.propertyAddress || 'Report'}_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};