import React from 'react';
import { Calculator, Info } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';

export const CalculationTransparency: React.FC = () => {
  const { state, calculations } = useLoadCalculator();
  
  // Calculate step-by-step breakdown
  const lightingVA = state.squareFootage * 3;
  const smallApplianceVA = 1500 * 2; // 2 kitchen circuits
  const laundryVA = 1500;
  const bathroomVA = 1500;
  const baseGeneralVA = lightingVA + smallApplianceVA + laundryVA + bathroomVA;
  
  // NEC 220.83 Optional Method calculation
  const first8kVA = Math.min(baseGeneralVA, 8000);
  const remainder = Math.max(baseGeneralVA - 8000, 0);
  
  // Active loads summary
  const activeGeneralLoads = state.loads.generalLoads.filter(load => load.quantity > 0);
  const activeHvacLoads = state.loads.hvacLoads.filter(load => load.quantity > 0);
  const activeEvseLoads = state.loads.evseLoads.filter(load => load.quantity > 0);
  const activeSolarLoads = state.loads.solarBatteryLoads.filter(load => load.kw > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Calculation Transparency</h3>
        <div className="flex items-center gap-1 text-sm text-blue-600">
          <Info className="h-4 w-4" />
          <span>NEC 220.83 Optional Method</span>
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
              <span className="text-emerald-700">Small Appliance Circuits:</span>
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
                  <span className="text-emerald-700 font-medium">Large Appliances:</span>
                </div>
                {activeGeneralLoads.map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-emerald-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va.toLocaleString()} VA = {load.total.toLocaleString()} VA</span>
                  </div>
                ))}
              </>
            )}
            
            <div className="border-t border-emerald-400 pt-2 mt-2 font-semibold">
              <div className="flex justify-between">
                <span className="text-emerald-800">Subtotal:</span>
                <span className="font-mono">{(baseGeneralVA + (calculations.applianceDemand || 0)).toLocaleString()} VA</span>
              </div>
            </div>
            
            <div className="bg-emerald-100 p-2 rounded border border-emerald-300">
              <div className="text-emerald-800 font-medium mb-1">NEC 220.83 Demand Factors:</div>
              <div className="flex justify-between text-sm">
                <span>First 8,000 VA at 100%:</span>
                <span className="font-mono">{first8kVA.toLocaleString()} VA</span>
              </div>
              {remainder > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Remaining {remainder.toLocaleString()} VA at 40%:</span>
                  <span className="font-mono">{(remainder * 0.4).toLocaleString()} VA</span>
                </div>
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
          <h4 className="font-semibold text-orange-800 mb-3">Part B: Loads at 100% (HVAC, EVSE, etc.)</h4>
          
          <div className="space-y-2 text-sm">
            {activeHvacLoads.length > 0 ? (
              <>
                <div className="text-orange-700 font-medium">HVAC Loads:</div>
                {activeHvacLoads.map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-orange-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va.toLocaleString()} VA = {load.total.toLocaleString()} VA</span>
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
                <div className="text-orange-700 font-medium mt-3">EV Charging (Continuous @ 125%):</div>
                {activeEvseLoads.map((load, index) => (
                  <div key={index} className="flex justify-between ml-4">
                    <span className="text-orange-600">{load.name}:</span>
                    <span className="font-mono">{load.quantity} × {load.va.toLocaleString()} VA × 1.25 = {(load.total * 1.25).toLocaleString()} VA</span>
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
            
            <div className="bg-orange-100 p-2 rounded border border-orange-300 mt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-orange-800">Part B Total:</span>
                <span className="font-mono text-orange-800">{((calculations.hvacDemand || 0) + (calculations.evseDemand || 0)).toLocaleString()} VA</span>
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
              <span className="text-purple-700">Part B (HVAC + EVSE @ 100%):</span>
              <span className="font-mono">{((calculations.hvacDemand || 0) + (calculations.evseDemand || 0)).toLocaleString()} VA</span>
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