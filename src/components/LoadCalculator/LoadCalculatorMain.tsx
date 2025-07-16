import React, { memo } from 'react';
import { Calculator } from 'lucide-react';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { ProjectInformation } from './ProjectInformation';
import { LoadInputTabs } from './LoadInputTabs';
import { CalculationResults } from './CalculationResults';
import { CalculationSummary } from './CalculationSummary';
import { ValidationMessages } from './ValidationMessages';
import { LoadCalculationGuide } from './LoadCalculationGuide';
import { DefinitionsGlossary } from './DefinitionsGlossary';

export const LoadCalculatorMain: React.FC = memo(() => {
  const { settings, updateCalculationSettings } = useProjectSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[1800px] mx-auto p-1 sm:p-2">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-3 sm:p-4 mb-2 sm:mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Calculator className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Load Calculator
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm">NEC {settings.codeYear} Compliant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">{/* Mobile: reduce gap, allow wrap */}
              <div className="flex items-center gap-2">
                <label htmlFor="code-year" className="text-sm font-medium text-white">
                  Code:
                </label>
                <select
                  id="code-year"
                  value={settings.codeYear}
                  onChange={(e) => updateCalculationSettings({ codeYear: e.target.value })}
                  className="rounded-lg border-0 bg-white/20 text-white placeholder-white/70 text-xs sm:text-sm focus:ring-2 focus:ring-white/50 min-w-0"
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
                  value={settings.calculationMethod}
                  onChange={(e) => updateCalculationSettings({ calculationMethod: e.target.value as any })}
                  className="rounded-lg border-0 bg-white/20 text-white placeholder-white/70 text-xs sm:text-sm focus:ring-2 focus:ring-white/50 min-w-0"
                >
                  <option value="optional" className="text-gray-900">Optional (220.83)</option>
                  <option value="standard" className="text-gray-900">Standard (220.42)</option>
                  <option value="existing" className="text-gray-900">Existing (220.87)</option>
                </select>
              </div>
              
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-xs text-blue-100">
              Note: All methods include mandatory NEC loads (6kVA/25A minimum) for kitchen, laundry, and bathroom circuits per NEC 220.52
            </p>
          </div>
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">{/* Mobile: single column, desktop: 12 columns */}
          {/* Project Information - Full Width */}
          <div className="lg:col-span-12">
            <ProjectInformation />
          </div>

          {/* Validation Messages - Full Width */}
          <div className="lg:col-span-12">
            <ValidationMessages />
          </div>

          {/* Load Inputs - Full Width on Mobile, 7/12 on Desktop */}
          <div className="lg:col-span-7">
            <LoadInputTabs />
          </div>

          {/* Calculation Results - Full Width on Mobile, 5/12 on Desktop */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4 space-y-2 sm:space-y-3">
              <CalculationResults />
              <CalculationSummary />
            </div>
          </div>

          {/* Bottom Section - Full Width on Mobile, 6/12 each on Desktop */}
          <div className="lg:col-span-6">
            <LoadCalculationGuide />
          </div>
          
          <div className="lg:col-span-6">
            <DefinitionsGlossary />
          </div>
        </div>
      </div>
    </div>
  );
});