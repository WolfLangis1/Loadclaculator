import React, { memo } from 'react';
import { LoadCalculatorHeader } from './LoadCalculatorHeader';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { ProjectInformation } from './ProjectInformation';
import { ValidationMessages } from './ValidationMessages';
import { LoadInputTabs } from './LoadInputTabs';
import { CalculationResults } from './CalculationResults';
import { CalculationSummary } from './CalculationSummary';
import { LoadCalculationGuide } from './LoadCalculationGuide';
import { DefinitionsGlossary } from './DefinitionsGlossary';

export const LoadCalculatorMain: React.FC = memo(() => {
  useProjectSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" data-cy="load-calculator">
      <div className="max-w-[1800px] mx-auto p-1 sm:p-2">
        <div data-cy="load-calculator-header">
          <LoadCalculatorHeader />
        </div>
        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">
          {/* Project Information - Full Width */}
          <div className="lg:col-span-12" data-cy="project-information">
            <ProjectInformation />
          </div>
          {/* Validation Messages - Full Width */}
          <div className="lg:col-span-12" data-cy="validation-messages">
            <ValidationMessages />
          </div>
          {/* Load Inputs - Full Width on Mobile, 7/12 on Desktop */}
          <div className="lg:col-span-7" data-cy="load-input-tabs">
            <LoadInputTabs />
          </div>
          {/* Calculation Results - Full Width on Mobile, 5/12 on Desktop */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4 space-y-2 sm:space-y-3" data-cy="calculation-results">
              <CalculationResults />
              <div data-cy="calculation-summary">
                <CalculationSummary />
              </div>
            </div>
          </div>
          {/* Bottom Section - Full Width on Mobile, 6/12 each on Desktop */}
          <div className="lg:col-span-6" data-cy="load-calculation-guide">
            <LoadCalculationGuide />
          </div>
          <div className="lg:col-span-6" data-cy="definitions-glossary">
            <DefinitionsGlossary />
          </div>
        </div>
      </div>
    </div>
  );
});