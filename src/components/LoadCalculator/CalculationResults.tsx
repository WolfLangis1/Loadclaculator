import React from 'react';
import { Download, BarChart3, Battery } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { exportToPDF } from '../../services/pdfExportService';
import { TooltipWrapper } from '../UI/TooltipWrapper';

export const CalculationResults: React.FC = () => {
  const { state, calculations } = useLoadCalculator();

  const handleExportReport = () => {
    exportToPDF(
      calculations,
      state.projectInfo,
      state.loads,
      state.calculationMethod,
      state.mainBreaker,
      state.panelDetails,
      state.codeYear,
      state.squareFootage,
      state.useEMS,
      state.emsMaxLoad
    );
  };


  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Results</h2>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>

        <div className="space-y-4">
          {/* Total Load */}
          <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
            <span className="font-medium text-white">
              <TooltipWrapper term="calculated load">Total Calculated Load</TooltipWrapper>
            </span>
            <span className="text-2xl font-bold text-white">
              {calculations.totalAmps?.toFixed(1) || '0.0'} <TooltipWrapper term="amps">A</TooltipWrapper>
            </span>
          </div>

          {/* Service Size */}
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
            <span className="text-white/90">
              <TooltipWrapper term="service size">Service Size</TooltipWrapper>
            </span>
            <span className="font-mono font-bold text-white">{state.mainBreaker} A</span>
          </div>

          {/* Spare Capacity */}
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
            <span className="text-white/90">
              <TooltipWrapper term="spare capacity">Spare Capacity</TooltipWrapper>
            </span>
            <span className={`font-mono font-bold ${
              (calculations.spareCapacity || 0) < 10 ? 'text-red-300' :
              (calculations.spareCapacity || 0) < 25 ? 'text-yellow-300' : 'text-green-300'
            }`}>
              {calculations.spareCapacity?.toFixed(1) || '0.0'}%
            </span>
          </div>

        </div>
      </div>

      {/* Load Breakdown Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
          Load Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
            <span className="text-emerald-800 font-medium">
              <TooltipWrapper term="general lighting">General/Lighting</TooltipWrapper>
            </span>
            <span className="font-mono font-bold text-emerald-900">{(calculations.generalDemand || 0).toLocaleString()} <TooltipWrapper term="VA">VA</TooltipWrapper></span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <span className="text-blue-800 font-medium">Appliances</span>
            <span className="font-mono font-bold text-blue-900">{(calculations.applianceDemand || 0).toLocaleString()} <TooltipWrapper term="VA">VA</TooltipWrapper></span>
          </div>
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <span className="text-orange-800 font-medium">HVAC</span>
            <span className="font-mono font-bold text-orange-900">{(calculations.hvacDemand || 0).toLocaleString()} VA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <span className="text-blue-800 font-medium">EV Charging</span>
            <span className="font-mono font-bold text-blue-900">{(calculations.evseDemand || 0).toLocaleString()} VA</span>
          </div>
        </div>
      </div>

      {/* Solar/Battery Info */}
      {(calculations.solarCapacityKW > 0 || calculations.batteryCapacityKW > 0) && (
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Battery className="h-5 w-5 text-white" />
            </div>
            Renewable Energy
          </h3>
          <div className="space-y-3">
            {calculations.solarCapacityKW > 0 && (
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                <span className="text-white/90">Solar Capacity</span>
                <span className="font-mono font-bold text-white">{calculations.solarCapacityKW.toFixed(1)} kW</span>
              </div>
            )}
            {calculations.batteryCapacityKW > 0 && (
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                <span className="text-white/90">Battery Capacity</span>
                <span className="font-mono font-bold text-white">{calculations.batteryCapacityKW.toFixed(1)} kW</span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span className="text-white/90">Interconnection</span>
              <span className={`font-mono font-bold ${calculations.interconnectionCompliant ? 'text-green-300' : 'text-red-300'}`}>
                {calculations.interconnectionCompliant ? 'Compliant' : 'Non-Compliant'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Critical Loads */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
          Critical Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
            <span className="text-red-800 font-medium">Critical Loads</span>
            <span className="font-mono font-bold text-red-900">{calculations.criticalLoadsAmps?.toFixed(1) || '0.0'} A</span>
          </div>

          {/* Recommended Service Size */}
          {calculations.recommendedServiceSize !== state.mainBreaker && (
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <span className="text-amber-800 font-medium">Recommended Service</span>
              <span className="font-mono font-bold text-amber-900">
                {calculations.recommendedServiceSize} A
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Method Info Card */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Calculation Method</h3>
        <p className="text-sm text-blue-700">
          {state.calculationMethod === 'optional' && 'NEC 220.82 Optional Method - Simplified residential calculation'}
          {state.calculationMethod === 'standard' && 'NEC 220.42-220.55 Standard Method - Traditional demand factor calculation'}
          {state.calculationMethod === 'existing' && 'NEC 220.87 Existing Dwelling - Based on actual demand data'}
        </p>
      </div>
    </div>
  );
};