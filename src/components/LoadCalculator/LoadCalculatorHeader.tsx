import React from 'react';
import { Calculator } from 'lucide-react';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { NEC_CODE_YEARS, CALCULATION_METHODS } from '../../constants/necOptions';

export const LoadCalculatorHeader: React.FC = () => {
  const { settings, updateCalculationSettings } = useProjectSettings();

  return (
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

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
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
              {NEC_CODE_YEARS.map((year) => (
                <option key={year.value} value={year.value} className="text-gray-900">
                  {year.label}
                </option>
              ))}
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
              {CALCULATION_METHODS.map((method) => (
                <option key={method.value} value={method.value} className="text-gray-900">
                  {method.label}
                </option>
              ))}
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
  );
};
