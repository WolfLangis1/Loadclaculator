import React from 'react';
import { LoadDataProvider, useLoadData } from './LoadDataContext';
import { ProjectSettingsProvider, useProjectSettings } from './ProjectSettingsContext';
import { CalculationProvider, useCalculations } from './CalculationContext';
import { SLDDataProvider } from './SLDDataContext';
import { AerialViewProvider } from './AerialViewContext';

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
 */
export const UnifiedAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProjectSettingsProvider>
      <LoadDataProvider>
        <CalculationProvider>
          <SLDDataProvider>
            <AerialViewProvider>
              {children}
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
  
  // This would need to be implemented if needed for backward compatibility
  // For now, we'll encourage migration to the new hooks
  throw new Error('Please migrate to useLoadData, useProjectSettings, and useCalculations hooks');
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