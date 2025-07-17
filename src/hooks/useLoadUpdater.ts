import { useCallback } from 'react';
import { useLoadData } from '../context/LoadDataContext';
import type { LoadItem, LoadCategory } from '../types';

/**
 * Custom hook for managing load updates with optimized performance
 * Reduces duplicate code across load table components and batches updates
 */
export const useLoadUpdater = (category: LoadCategory) => {
  const { dispatch } = useLoadData();

  // Batch multiple field updates into single action for better performance
  const updateLoad = useCallback((id: number, updates: Partial<LoadItem>) => {
    const actionType = `UPDATE_${category.toUpperCase()}_LOAD`;
    
    dispatch({
      type: actionType as any, // Type assertion due to dynamic actionType
      payload: { id, updates }
    });
  }, [dispatch, category]);

  // Update single field - optimized for individual field changes
  const updateLoadField = useCallback((id: number, field: keyof LoadItem, value: any) => {
    updateLoad(id, { [field]: value });
  }, [updateLoad]);

  // Toggle enabled state
  const toggleLoad = useCallback((id: number) => {
    updateLoadField(id, 'enabled' as keyof LoadItem, undefined); // Let the reducer handle the toggle
  }, [updateLoadField]);

  // Batch update multiple loads (useful for bulk operations)
  const updateMultipleLoads = useCallback((updates: Array<{ id: number; updates: Partial<LoadItem> }>) => {
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
