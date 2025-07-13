import React from 'react';
import { Calculator } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { ProjectInformation } from './ProjectInformation';
import { LoadInputTabs } from './LoadInputTabs';
import { CalculationResults } from './CalculationResults';
import { CalculationTransparency } from './CalculationTransparency';
import { ValidationMessages } from './ValidationMessages';
import { LoadCalculationGuide } from './LoadCalculationGuide';

export const LoadCalculatorMain: React.FC = () => {
  const { state, updateSettings } = useLoadCalculator();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[1600px] mx-auto p-3">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-7 w-7 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Professional Load Calculator
                </h1>
                <p className="text-blue-100 text-sm">NEC {state.codeYear} Compliant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="code-year" className="text-sm font-medium text-white">
                  Code:
                </label>
                <select
                  id="code-year"
                  value={state.codeYear}
                  onChange={(e) => updateSettings({ codeYear: e.target.value })}
                  className="rounded-lg border-0 bg-white/20 text-white placeholder-white/70 text-sm focus:ring-2 focus:ring-white/50"
                >
                  <option value="2023" className="text-gray-900">NEC 2023</option>
                  <option value="2020" className="text-gray-900">NEC 2020</option>
                  <option value="2017" className="text-gray-900">NEC 2017</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="calculation-method" className="text-sm font-medium text-white">
                  Method:
                </label>
                <select
                  id="calculation-method"
                  value={state.calculationMethod}
                  onChange={(e) => updateSettings({ calculationMethod: e.target.value as any })}
                  className="rounded-lg border-0 bg-white/20 text-white placeholder-white/70 text-sm focus:ring-2 focus:ring-white/50"
                >
                  <option value="optional" className="text-gray-900">Optional (220.83)</option>
                  <option value="standard" className="text-gray-900">Standard (220.42)</option>
                  <option value="existing" className="text-gray-900">Existing (220.87)</option>
                </select>
              </div>
              
              <button
                onClick={() => updateSettings({ showAdvanced: !state.showAdvanced })}
                className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {state.showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-xs text-blue-100">
              Note: All methods include mandatory NEC loads (6kVA/25A minimum) for kitchen, laundry, and bathroom circuits per NEC 220.52
            </p>
          </div>
        </div>

        {/* Main Content Grid - More Efficient Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Project Information - Horizontal Layout */}
          <div className="col-span-12">
            <ProjectInformation />
          </div>

          {/* Validation Messages */}
          <div className="col-span-12">
            <ValidationMessages />
          </div>

          {/* Load Input Section - Wider */}
          <div className="col-span-12 lg:col-span-8">
            <LoadInputTabs />
          </div>

          {/* Calculation Results - Sticky Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-4">
              <CalculationResults />
            </div>
          </div>

          {/* Calculation Transparency - Full Width */}
          <div className="col-span-12">
            <CalculationTransparency />
          </div>

          {/* Load Calculation Guide - Full Width */}
          <div className="col-span-12">
            <LoadCalculationGuide />
          </div>
        </div>
      </div>
    </div>
  );
};