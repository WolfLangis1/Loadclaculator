import React from 'react';
import { useProjectSettings } from '../context/ProjectSettingsContext';
import { useLoadData } from '../context/LoadDataContext';
import { useCalculations } from '../context/CalculationContext';

/**
 * Compatibility hook that provides the old useLoadCalculator interface
 * This helps with gradual migration to the new context system
 */
export const useLoadCalculatorCompat = () => {
  const { settings, updateProjectInfo, updateCalculationSettings } = useProjectSettings();
  const { loads, updateLoad, addLoad, removeLoad, resetLoads } = useLoadData();
  const { calculations, validationMessages } = useCalculations();

  // Create a legacy-style state object
  const state = {
    ...settings,
    loads,
    calculations,
    validationMessages
  };

  // Legacy-style dispatch function
  const dispatch = (action: any) => {
    console.warn('Legacy dispatch is deprecated. Use specific context methods instead.');
    
    switch (action.type) {
      case 'UPDATE_GENERAL_LOAD':
        updateLoad('general', action.payload.id, action.payload.field, action.payload.value);
        break;
      case 'UPDATE_HVAC_LOAD':
        updateLoad('hvac', action.payload.id, action.payload.field, action.payload.value);
        break;
      case 'UPDATE_EVSE_LOAD':
        updateLoad('evse', action.payload.id, action.payload.field, action.payload.value);
        break;
      case 'UPDATE_SOLAR_BATTERY_LOAD':
        updateLoad('solarBattery', action.payload.id, action.payload.field, action.payload.value);
        break;
      case 'ADD_LOAD':
        addLoad(action.payload.category, action.payload);
        break;
      case 'REMOVE_LOAD':
        removeLoad(action.payload.category, action.payload.id);
        break;
      case 'RESET_LOADS':
        resetLoads(action.payload);
        break;
      default:
        console.warn('Unsupported action type:', action.type);
    }
  };

  // Legacy-style update functions
  const updateSettings = (updates: any) => {
    if ('squareFootage' in updates || 'calculationMethod' in updates || 'mainBreaker' in updates) {
      updateCalculationSettings(updates);
    } else {
      updateProjectInfo(updates);
    }
  };

  // Attachment methods - stub implementations for now
  const addAttachment = React.useCallback((attachment: any) => {
    console.warn('addAttachment is not yet implemented in the new context system');
  }, []);

  const markAttachmentForExport = React.useCallback((attachmentId: string, exportOptions?: any) => {
    console.warn('markAttachmentForExport is not yet implemented in the new context system');
  }, []);

  const unmarkAttachmentForExport = React.useCallback((attachmentId: string) => {
    console.warn('unmarkAttachmentForExport is not yet implemented in the new context system');
  }, []);

  const deleteAttachment = React.useCallback((attachmentId: string) => {
    console.warn('deleteAttachment is not yet implemented in the new context system');
  }, []);

  return {
    state: {
      ...state,
      attachments: [] as any[],
      attachmentStats: {
        total: 0,
        byType: {},
        bySource: {},
        markedForExport: 0,
        totalFileSize: 0
      }
    },
    dispatch,
    updateSettings,
    updateProjectInfo,
    calculations,
    validationMessages,
    addAttachment,
    markAttachmentForExport,
    unmarkAttachmentForExport,
    deleteAttachment
  };
};

// Re-export for backward compatibility
export const useLoadCalculator = useLoadCalculatorCompat;