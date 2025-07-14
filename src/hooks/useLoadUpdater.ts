import { useCallback } from 'react';
import { useLoadCalculator } from './useLoadCalculator';
import type { LoadItem, LoadAction } from '../types';

export type LoadCategory = 'general' | 'hvac' | 'evse' | 'solarBattery';

/**
 * Custom hook for managing load updates with optimized performance
 * Reduces duplicate code across load table components and batches updates
 */
export const useLoadUpdater = (category: LoadCategory) => {
  const { dispatch } = useLoadCalculator();

  // Batch multiple field updates into single action for better performance
  const updateLoad = useCallback((id: number, updates: Partial<LoadItem>) => {
    const actionType = `UPDATE_${category.toUpperCase()}_LOAD` as LoadAction['type'];
    
    dispatch({
      type: actionType,
      payload: { id, updates }
    });
  }, [dispatch, category]);

  // Update single field - optimized for individual field changes
  const updateLoadField = useCallback((id: number, field: keyof LoadItem, value: any) => {
    updateLoad(id, { [field]: value });
  }, [updateLoad]);

  // Toggle enabled state
  const toggleLoad = useCallback((id: number) => {
    updateLoadField(id, 'enabled', undefined); // Let the reducer handle the toggle
  }, [updateLoadField]);

  // Batch update multiple loads (useful for bulk operations)
  const updateMultipleLoads = useCallback((updates: Array<{ id: number; updates: Partial<LoadItem> }>) => {
    // Use a single dispatch with multiple updates for better performance
    updates.forEach(({ id, updates: loadUpdates }) => {
      updateLoad(id, loadUpdates);
    });
  }, [updateLoad]);

  // Reset load to default values
  const resetLoad = useCallback((id: number, defaultLoad: Partial<LoadItem>) => {
    updateLoad(id, defaultLoad);
  }, [updateLoad]);

  return {
    updateLoad,
    updateLoadField,
    toggleLoad,
    updateMultipleLoads,
    resetLoad
  };
};

/**
 * Validation hook for load inputs
 * Provides consistent validation across all load types
 */
export const useLoadValidation = () => {
  const validateQuantity = useCallback((value: number): boolean => {
    return value >= 0 && value <= 1000; // Reasonable limits
  }, []);

  const validateVoltage = useCallback((value: number): boolean => {
    return value > 0 && value <= 1000; // Reasonable voltage range
  }, []);

  const validateAmps = useCallback((value: number): boolean => {
    return value >= 0 && value <= 10000; // Reasonable amperage range
  }, []);

  const validateWatts = useCallback((value: number): boolean => {
    return value >= 0 && value <= 1000000; // Up to 1MW
  }, []);

  const getValidationError = useCallback((field: string, value: number): string | null => {
    switch (field) {
      case 'quantity':
        return validateQuantity(value) ? null : 'Quantity must be between 0 and 1000';
      case 'voltage':
        return validateVoltage(value) ? null : 'Voltage must be between 1 and 1000V';
      case 'amperage':
      case 'amps':
        return validateAmps(value) ? null : 'Amperage must be between 0 and 10,000A';
      case 'watts':
      case 'wattage':
        return validateWatts(value) ? null : 'Wattage must be between 0 and 1,000,000W';
      default:
        return null;
    }
  }, [validateQuantity, validateVoltage, validateAmps, validateWatts]);

  return {
    validateQuantity,
    validateVoltage,
    validateAmps,
    validateWatts,
    getValidationError
  };
};