import React from 'react';
import { LoadDataProvider, useLoadData } from './LoadDataContext';
import { ProjectSettingsProvider, useProjectSettings } from './ProjectSettingsContext';
import { CalculationProvider, useCalculations } from './CalculationContext';
import { SLDDataProvider } from './SLDDataContext';
import { AerialViewProvider } from './AerialViewContext';
import { ComplianceProvider } from './ComplianceContext';
import { CRMProvider } from './CRMContext';
import { AddressSyncProvider } from './AddressSyncContext';
import { useFeatureFlags } from '../config/featureFlags';

/**
 * Conditional CRM Provider Wrapper
 * Only includes CRM provider if the feature flag is enabled
 */
const ConditionalCRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const featureFlags = useFeatureFlags();
  
  if (featureFlags.crm.enabled) {
    return <CRMProvider>{children}</CRMProvider>;
  }
  
  return <>{children}</>;
};

/**
 * Unified App Context Provider
 * 
 * This provider combines all the focused contexts in the correct hierarchy
 * to ensure optimal performance and proper data flow.
 * 
 * Context Hierarchy:
 * 1. ProjectSettingsProvider (project configuration)
 * 2. LoadDataProvider (load data management)
 * 3. CalculationProvider (calculations based on settings + loads)
 * 4. SLDProvider (single line diagram management)
 * 5. AerialViewProvider (aerial view and site analysis)
 * 6. ComplianceProvider (inspection and compliance management)
 * 7. CRMProvider (customer relationship management) - conditional
 */
export const UnifiedAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProjectSettingsProvider>
      <LoadDataProvider>
        <CalculationProvider>
          <SLDDataProvider>
            <AerialViewProvider>
              <AddressSyncProvider>
                <ComplianceProvider>
                  <ConditionalCRMProvider>
                    {children}
                  </ConditionalCRMProvider>
                </ComplianceProvider>
              </AddressSyncProvider>
            </AerialViewProvider>
          </SLDDataProvider>
        </CalculationProvider>
      </LoadDataProvider>
    </ProjectSettingsProvider>
  );
};

// Legacy compatibility hook that combines all contexts
export const useLegacyLoadCalculator = () => {
  console.warn('useLegacyLoadCalculator is deprecated. Use specific context hooks instead.');
  
  // Return null instead of throwing to prevent application crashes
  // This allows graceful migration from legacy hook usage
  return null;
};

// Migration helper hook that provides the old interface
export const useLoadCalculatorCompat = () => {
  const { loads, updateLoad, addLoad, removeLoad } = useLoadData();
  const { settings, updateProjectInfo, updateCalculationSettings } = useProjectSettings();
  const { calculations } = useCalculations();
  
  // Recreate the old interface for easier migration
  const dispatch = React.useCallback((action: any) => {
    console.warn('dispatch is deprecated. Use specific update methods instead.');
    
    switch (action.type) {
      case 'UPDATE_GENERAL_LOAD':
        updateLoad('general', action.payload.id, action.payload.field, action.payload.value);
        break;
      case 'ADD_LOAD':
        addLoad(action.payload.category, action.payload);
        break;
      case 'REMOVE_LOAD':
        removeLoad(action.payload.category, action.payload.id);
        break;
      default:
        console.warn('Unsupported action type:', action.type);
    }
  }, [updateLoad, addLoad, removeLoad]);
  
  const updateSettings = React.useCallback((updates: any) => {
    if ('squareFootage' in updates || 'calculationMethod' in updates) {
      updateCalculationSettings(updates);
    } else {
      updateProjectInfo(updates);
    }
  }, [updateCalculationSettings, updateProjectInfo]);
  
  // Old state structure for compatibility
  const state = React.useMemo(() => ({
    loads,
    projectInfo: settings.projectInfo,
    squareFootage: settings.squareFootage,
    calculationMethod: settings.calculationMethod,
    mainBreaker: settings.mainBreaker,
    panelDetails: settings.panelDetails,
    codeYear: settings.codeYear,
    // ... other settings
  }), [loads, settings]);
  
  return {
    state,
    dispatch,
    calculations,
    updateSettings
  };
};