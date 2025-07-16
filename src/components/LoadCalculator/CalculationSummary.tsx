import React from 'react';
import { Calculator, Info } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';

export const CalculationSummary: React.FC = () => {
  const { state, calculations } = useLoadCalculator();
  
  // Calculate step-by-step breakdown
  const lightingVA = state.squareFootage * 3;
  const smallApplianceVA = 1500 * 2; // 2 kitchen circuits
  const laundryVA = 1500;
  const bathroomVA = 1500;
  const baseGeneralVA = lightingVA + smallApplianceVA + laundryVA + bathroomVA;
  
  // Get the correct demand factor calculation details to match actual calculation logic
  const getDemandFactorCalculation = () => {
    switch (state.calculationMethod) {
      case 'optional': {
        // For optional method, appliances are included in general demand calculation
        const totalGeneralAndAppliances = baseGeneralVA + (calculations.applianceDemand || 0);
        const first10kVA = Math.min(totalGeneralAndAppliances, 10000);
        const remainder = Math.max(totalGeneralAndAppliances - 10000, 0);
        return { 
          totalForDemand: totalGeneralAndAppliances,
          first: first10kVA, 
          remainder, 
          factor: 0.4, 
          method: 'NEC 220.83 Optional Method',
          appliancesIncluded: true
        };
      }
      case 'standard': {
        // For standard method, only base general loads get demand factors, appliances are separate
        const first3kVA = Math.min(baseGeneralVA, 3000);
        const next117kVA = Math.min(Math.max(baseGeneralVA - 3000, 0), 117000);
        const above120kVA = Math.max(baseGeneralVA - 120000, 0);
        return { 
          totalForDemand: baseGeneralVA,
          first: first3kVA, 
          next117: next117kVA, 
          above120: above120kVA,
          method: 'NEC 220.42 Standard Method',
          appliancesIncluded: false
        };
      }
      case 'existing': {
        if (state.actualDemandData?.enabled && state.actualDemandData.averageDemand > 0) {
          return { 
            actualDemand: state.actualDemandData.averageDemand, 
            method: 'NEC 220.87 Existing Dwelling (Actual Data)',
            appliancesIncluded: true
          };
        } else {
          const totalGeneralAndAppliances = baseGeneralVA + (calculations.applianceDemand || 0);
          const first8kVA = Math.min(totalGeneralAndAppliances, 8000);
          const remainder = Math.max(totalGeneralAndAppliances - 8000, 0);
          return { 
            totalForDemand: totalGeneralAndAppliances,
            first: first8kVA, 
            remainder, 
            factor: 0.4, 
            method: 'NEC 220.87 Existing Dwelling (40% Factor)',
            appliancesIncluded: true
          };
        }
      }
      default:
        return { first: 0, remainder: 0, factor: 0.4, method: 'Unknown Method', appliancesIncluded: false };
    }
  };
  
  const demandCalc = getDemandFactorCalculation();
  
  // Active loads summary
  const activeGeneralLoads = (state.loads.generalLoads || []).filter(load => load.quantity > 0);
  const activeHvacLoads = (state.loads.hvacLoads || []).filter(load => load.quantity > 0);
  const activeEvseLoads = (state.loads.evseLoads || []).filter(load => load.quantity > 0);
  const activeSolarLoads = (state.loads.solarBatteryLoads || []).filter(load => load.kw > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Calculation Transparency</h3>
        <div className="flex items-center gap-1 text-sm text-blue-600">
          <Info className="h-4 w-4" />
          <span>{demandCalc.method}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Part A: General Loads */}
        <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
          <h4 className="font-semibold text-emerald-800 mb-3">Part A: General Loads (NEC 220.83)</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-emerald-700">General Lighting:</span>
              <span className="font-mono">{state.squareFootage} sq ft × 3 VA = {lightingVA.toLocaleString()} VA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Small Appliance Circuits (NEC 220.52):</span>
              <span className="font-mono">2 × 1,500 VA = {smallApplianceVA.toLocaleString()} VA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Laundry Circuit:</span>
              <span className="font-mono">{laundryVA.toLocaleString()} VA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Bathroom Circuit:</span>
              <span className="font-mono">{bathroomVA.toLocaleString()} VA</span>
            </div>
            
            {activeGeneralLoads.length > 0 && (
              <>
                <div className="border-t border-emerald-300 pt-2 mt-2">
                  <span className="text-emerald-700 font-medium">Dedicated Appliance Circuits:</span>
                </div>
                {activeGeneralLoads.map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-emerald-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va?.toLocaleString() || '0'} VA = {load.total?.toLocaleString() || '0'} VA</span>
                  </div>
                ))}
              </>
            )}
            
            <div className="border-t border-emerald-400 pt-2 mt-2 font-semibold">
              <div className="flex justify-between">
                <span className="text-emerald-800">
                  {demandCalc.appliancesIncluded ? 'Total for Demand Calculation:' : 'General Loads Subtotal:'}
                </span>
                <span className="font-mono">{(demandCalc.totalForDemand || baseGeneralVA).toLocaleString()} VA</span>
              </div>
            </div>
            
            {!demandCalc.appliancesIncluded && (calculations.applianceDemand || 0) > 0 && (
              <div className="text-sm text-emerald-600 italic">
                Note: Appliances calculated separately in Standard Method ({(calculations.applianceDemand || 0).toLocaleString()} VA)
              </div>
            )}
            
            <div className="bg-emerald-100 p-2 rounded border border-emerald-300">
              <div className="text-emerald-800 font-medium mb-1">{demandCalc.method} Demand Factors:</div>
              
              {state.calculationMethod === 'optional' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>First 10,000 VA at 100%:</span>
                    <span className="font-mono">{(demandCalc.first || 0).toLocaleString()} VA</span>
                  </div>
                  {(demandCalc.remainder || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Remaining {(demandCalc.remainder || 0).toLocaleString()} VA at 40%:</span>
                      <span className="font-mono">{((demandCalc.remainder || 0) * 0.4).toLocaleString()} VA</span>
                    </div>
                  )}
                </>
              )}

              {state.calculationMethod === 'standard' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>First 3,000 VA at 100%:</span>
                    <span className="font-mono">{(demandCalc.first || 0).toLocaleString()} VA</span>
                  </div>
                  {(demandCalc.next117 || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Next {(demandCalc.next117 || 0).toLocaleString()} VA at 35%:</span>
                      <span className="font-mono">{((demandCalc.next117 || 0) * 0.35).toLocaleString()} VA</span>
                    </div>
                  )}
                  {(demandCalc.above120 || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Above 120kVA at 25%:</span>
                      <span className="font-mono">{((demandCalc.above120 || 0) * 0.25).toLocaleString()} VA</span>
                    </div>
                  )}
                </>
              )}

              {state.calculationMethod === 'existing' && (
                <>
                  {demandCalc.actualDemand ? (
                    <div className="flex justify-between text-sm">
                      <span>Actual Demand Data:</span>
                      <span className="font-mono">{(demandCalc.actualDemand * 1000).toLocaleString()} VA</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>First 8,000 VA at 100%:</span>
                        <span className="font-mono">{(demandCalc.first || 0).toLocaleString()} VA</span>
                      </div>
                      {(demandCalc.remainder || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Remaining {(demandCalc.remainder || 0).toLocaleString()} VA at 40%:</span>
                          <span className="font-mono">{((demandCalc.remainder || 0) * 0.4).toLocaleString()} VA</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="flex justify-between font-semibold border-t border-emerald-400 pt-1 mt-1">
                <span>Part A Total:</span>
                <span className="font-mono text-emerald-800">{(calculations.generalDemand || 0).toLocaleString()} VA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Part B: HVAC and Other Loads */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <h4 className="font-semibold text-orange-800 mb-3">Part B: Loads at 100% (HVAC, EVSE, Battery Charging)</h4>
          
          <div className="space-y-2 text-sm">
            {activeHvacLoads.length > 0 ? (
              <>
                <div className="text-orange-700 font-medium">HVAC Loads:</div>
                {activeHvacLoads.map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-orange-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va?.toLocaleString() || '0'} VA = {load.total?.toLocaleString() || '0'} VA</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium ml-4">
                  <span className="text-orange-700">HVAC Subtotal:</span>
                  <span className="font-mono">{(calculations.hvacDemand || 0).toLocaleString()} VA</span>
                </div>
              </>
            ) : (
              <div className="text-orange-600 italic">No HVAC loads</div>
            )}
            
            {activeEvseLoads.length > 0 ? (
              <>
                <div className="text-orange-700 font-medium mt-3">EV Charging (NEC 625.42 @ 100%):</div>
                {activeEvseLoads.map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-orange-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va?.toLocaleString() || '0'} VA = {load.total?.toLocaleString() || '0'} VA</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium ml-4">
                  <span className="text-orange-700">EVSE Subtotal:</span>
                  <span className="font-mono">{(calculations.evseDemand || 0).toLocaleString()} VA</span>
                </div>
              </>
            ) : (
              <div className="text-orange-600 italic">No EV charging loads</div>
            )}
            
            {/* Battery Charging Loads */}
            {activeSolarLoads.filter(load => load.type === 'battery').length > 0 ? (
              <>
                <div className="text-orange-700 font-medium mt-3">Battery Charging Loads:</div>
                {activeSolarLoads.filter(load => load.type === 'battery').map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-orange-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va?.toLocaleString() || '0'} VA = {load.total?.toLocaleString() || '0'} VA</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium ml-4">
                  <span className="text-orange-700">Battery Charging Subtotal:</span>
                  <span className="font-mono">{(calculations.batteryChargingDemand || 0).toLocaleString()} VA</span>
                </div>
              </>
            ) : (
              <div className="text-orange-600 italic mt-2">No battery charging loads</div>
            )}
            
            <div className="bg-orange-100 p-2 rounded border border-orange-300 mt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-orange-800">Part B Total:</span>
                <span className="font-mono text-orange-800">{((calculations.hvacDemand || 0) + (calculations.evseDemand || 0) + (calculations.batteryChargingDemand || 0)).toLocaleString()} VA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Final Calculation */}
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
          <h4 className="font-semibold text-purple-800 mb-3">Total Calculated Load</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700">Part A (General w/ demand factors):</span>
              <span className="font-mono">{(calculations.generalDemand || 0).toLocaleString()} VA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Part B (HVAC + EVSE + Battery @ 100%):</span>
              <span className="font-mono">{((calculations.hvacDemand || 0) + (calculations.evseDemand || 0) + (calculations.batteryChargingDemand || 0)).toLocaleString()} VA</span>
            </div>
            
            <div className="border-t border-purple-400 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-purple-800">Total Demand:</span>
                <span className="font-mono text-purple-800">{(calculations.totalVA || 0).toLocaleString()} VA</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-purple-800">Total Amps @ 240V:</span>
                <span className="font-mono text-purple-800">{(calculations.totalAmps || 0).toFixed(1)} A</span>
              </div>
            </div>
            
            <div className="bg-purple-100 p-2 rounded border border-purple-300 mt-3">
              <div className="flex justify-between">
                <span className="text-purple-700">Service Size:</span>
                <span className="font-mono">{state.mainBreaker} A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Service Utilization:</span>
                <span className="font-mono">{(((calculations.totalAmps || 0) / state.mainBreaker) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Spare Capacity:</span>
                <span className={`font-mono ${(calculations.spareCapacity || 0) < 25 ? 'text-red-600' : 'text-green-600'}`}>
                  {(calculations.spareCapacity || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Solar/Battery Section (if applicable) */}
        {activeSolarLoads.length > 0 && (
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <h4 className="font-semibold text-yellow-800 mb-3">Solar/Battery Interconnection</h4>
            
            <div className="space-y-2 text-sm">
              {activeSolarLoads.map((load, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-yellow-700">{load.name}:</span>
                  <span className="font-mono">{load.kw} kW ({load.inverterAmps.toFixed(1)} A @ 240V)</span>
                </div>
              ))}
              
              <div className="bg-yellow-100 p-2 rounded border border-yellow-300 mt-3">
                <div className="text-yellow-800 font-medium mb-1">NEC 705.12(B)(3)(2) - 120% Rule:</div>
                <div className="flex justify-between text-sm">
                  <span>Bus Rating × 120%:</span>
                  <span className="font-mono">{state.panelDetails.busRating} A × 1.2 = {(state.panelDetails.busRating * 1.2).toFixed(0)} A</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Main Breaker + Solar:</span>
                  <span className="font-mono">{state.mainBreaker} A + {(calculations.totalInterconnectionAmps || 0).toFixed(1)} A = {(state.mainBreaker + (calculations.totalInterconnectionAmps || 0)).toFixed(1)} A</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Compliance:</span>
                  <span className={`font-mono ${calculations.interconnectionCompliant ? 'text-green-600' : 'text-red-600'}`}>
                    {calculations.interconnectionCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {(calculations.warnings.length > 0 || calculations.errors.length > 0) && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h4 className="font-semibold text-red-800 mb-3">Code Compliance Issues</h4>
            
            {calculations.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-red-700 mb-2">
                <span className="font-bold">ERROR:</span>
                <span>{error.message} ({error.code})</span>
              </div>
            ))}
            
            {calculations.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-orange-700 mb-2">
                <span className="font-bold">WARNING:</span>
                <span>{warning.message} ({warning.code})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};