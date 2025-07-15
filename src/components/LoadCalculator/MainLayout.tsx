import React, { useState, createContext, useContext } from 'react';
import { Calculator } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { ProjectInformation } from './ProjectInformation';
import { LoadInputTabs } from './LoadInputTabs';
import { CalculationResults } from './CalculationResults';
import { CalculationSummary } from './CalculationSummary';
import { ValidationMessages } from './ValidationMessages';
import { LoadCalculationGuide } from './LoadCalculationGuide';
import { DefinitionsGlossary } from './DefinitionsGlossary';
import { SingleLineDiagram } from '../SLD/SingleLineDiagram';
import { FileImage } from 'lucide-react';

type MainTab = 'loads' | 'sld';

interface MainLayoutContextType {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
}

const MainLayoutContext = createContext<MainLayoutContextType | undefined>(undefined);

export const useMainLayout = () => {
  const context = useContext(MainLayoutContext);
  if (!context) {
    throw new Error('useMainLayout must be used within MainLayoutProvider');
  }
  return context;
};

export const MainLayout: React.FC = () => {
  const { state, updateSettings } = useLoadCalculator();
  const [activeTab, setActiveTab] = useState<MainTab>('loads');

  const contextValue: MainLayoutContextType = {
    activeTab,
    setActiveTab
  };

  return (
    <MainLayoutContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-[1800px] mx-auto p-2">
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-7 w-7 text-white" />
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Load Calculator
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
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-blue-100">
                Note: All methods include mandatory NEC loads (6kVA/25A minimum) for kitchen, laundry, and bathroom circuits per NEC 220.52
              </p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
              <button
                onClick={() => setActiveTab('loads')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'loads'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calculator className="h-4 w-4" />
                Load Calculator
              </button>
              
              <button
                onClick={() => setActiveTab('sld')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'sld'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileImage className="h-4 w-4" />
                Single Line Diagram & Site Plan
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'loads' && (
            <div className="grid grid-cols-12 gap-3">
              {/* Project Information - Horizontal Layout */}
              <div className="col-span-12">
                <ProjectInformation />
              </div>

              {/* Validation Messages */}
              <div className="col-span-12">
                <ValidationMessages />
              </div>

              {/* Two Column Layout - Load Inputs + Results */}
              <div className="col-span-12 lg:col-span-8">
                <div className="bg-white rounded-xl p-6">
                  <LoadInputTabs />
                </div>
              </div>

              {/* Calculation Results - Sticky Sidebar */}
              <div className="col-span-12 lg:col-span-4">
                <div className="lg:sticky lg:top-4 space-y-3">
                  <CalculationResults />
                  <CalculationSummary />
                </div>
              </div>

              {/* Two Column Bottom Section */}
              <div className="col-span-12 lg:col-span-6">
                <LoadCalculationGuide />
              </div>
              
              <div className="col-span-12 lg:col-span-6">
                <DefinitionsGlossary />
              </div>
            </div>
          )}

          {/* Full Width SLD */}
          {activeTab === 'sld' && (
            <div className="h-[calc(100vh-200px)] bg-white rounded-xl">
              <SingleLineDiagram className="h-full" />
            </div>
          )}
        </div>
      </div>
    </MainLayoutContext.Provider>
  );
};