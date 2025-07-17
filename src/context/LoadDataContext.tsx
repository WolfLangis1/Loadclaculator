import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import type { 
  LoadState, 
  GeneralLoad, 
  HVACLoad, 
  EVSELoad, 
  SolarBatteryLoad,
  LoadCategory 
} from '../types';
import { LOAD_TEMPLATES } from '../constants';
import { updateGeneralLoad, updateHVACLoad, updateEVSELoad, updateSolarBatteryLoad, addLoad as addLoadReducer, removeLoad as removeLoadReducer } from '../utils/loadReducers';

// Type-safe value types for load fields
type GeneralLoadValue = GeneralLoad[keyof GeneralLoad];
type HVACLoadValue = HVACLoad[keyof HVACLoad];
type EVSELoadValue = EVSELoad[keyof EVSELoad];
type SolarBatteryLoadValue = SolarBatteryLoad[keyof SolarBatteryLoad];
type LoadItemValue = GeneralLoadValue | HVACLoadValue | EVSELoadValue | SolarBatteryLoadValue;

// Load-specific actions with proper typing
type LoadDataAction = 
  | { type: 'UPDATE_GENERAL_LOAD'; payload: { id: number; field: keyof GeneralLoad; value: GeneralLoadValue } }
  | { type: 'UPDATE_HVAC_LOAD'; payload: { id: number; field: keyof HVACLoad; value: HVACLoadValue } }
  | { type: 'UPDATE_EVSE_LOAD'; payload: { id: number; field: keyof EVSELoad; value: EVSELoadValue } }
  | { type: 'UPDATE_SOLAR_BATTERY_LOAD'; payload: { id: number; field: keyof SolarBatteryLoad; value: SolarBatteryLoadValue } }
  | { type: 'ADD_LOAD'; payload: { category: LoadCategory; load: Partial<GeneralLoad | HVACLoad | EVSELoad | SolarBatteryLoad> } }
  | { type: 'REMOVE_LOAD'; payload: { category: LoadCategory; id: number } }
  | { type: 'RESET_LOADS'; payload: LoadState }
  | { type: 'IMPORT_LOADS'; payload: LoadState };

interface LoadDataContextType {
  loads: LoadState;
  dispatch: React.Dispatch<LoadDataAction>;
  
  // Convenience methods with proper typing
  updateLoad: (category: LoadCategory, id: number, field: string, value: LoadItemValue) => void;
  addLoad: (category: LoadCategory, loadData?: Partial<GeneralLoad | HVACLoad | EVSELoad | SolarBatteryLoad>) => void;
  removeLoad: (category: LoadCategory, id: number) => void;
  resetLoads: (newLoads: LoadState) => void;
  
  // Project persistence
  saveToLocalStorage: (projectId: string) => boolean;
  loadFromLocalStorage: (projectId: string) => boolean;
  clearSessionData: () => void;
  
  // Load statistics
  totalLoads: number;
  loadCounts: { [K in LoadCategory]: number };
}

const initialLoadState: LoadState = {
  generalLoads: LOAD_TEMPLATES.general.map(template => ({ ...template })),
  hvacLoads: LOAD_TEMPLATES.hvac.map(template => ({ ...template })),
  evseLoads: LOAD_TEMPLATES.evse.map(template => ({ ...template })),
  solarBatteryLoads: LOAD_TEMPLATES.solar.map(template => ({ ...template }))
};


function loadDataReducer(state: LoadState, action: LoadDataAction): LoadState {
  switch (action.type) {
    case 'UPDATE_GENERAL_LOAD':
      return updateGeneralLoad(state, action.payload);
    case 'UPDATE_HVAC_LOAD':
      return updateHVACLoad(state, action.payload);
    case 'UPDATE_EVSE_LOAD':
      return updateEVSELoad(state, action.payload);
    case 'UPDATE_SOLAR_BATTERY_LOAD':
      return updateSolarBatteryLoad(state, action.payload);
    case 'ADD_LOAD':
      return addLoadReducer(state, action.payload);
    case 'REMOVE_LOAD':
      return removeLoadReducer(state, action.payload);
    case 'RESET_LOADS':
      return action.payload;
    case 'IMPORT_LOADS':
      return { ...action.payload };
    default:
      return state;
  }
}

const LoadDataContext = createContext<LoadDataContextType | undefined>(undefined);

const LOAD_STORAGE_KEY = 'loadCalculator_loadData';
const LOAD_SESSION_KEY = 'loadCalculator_sessionLoads';

export const LoadDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loads, dispatch] = useReducer(loadDataReducer, null, () => {
    try {
      const sessionData = sessionStorage.getItem(LOAD_SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed && 
            Array.isArray(parsed.generalLoads) && 
            Array.isArray(parsed.hvacLoads) && 
            Array.isArray(parsed.evseLoads) && 
            Array.isArray(parsed.solarBatteryLoads)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
    
    return initialLoadState;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(LOAD_SESSION_KEY, JSON.stringify(loads));
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }, [loads]);
  
  const updateLoad = React.useCallback((
    category: LoadCategory, 
    id: number, 
    field: string, 
    value: LoadItemValue
  ) => {
    switch (category) {
      case 'general':
        dispatch({ type: 'UPDATE_GENERAL_LOAD', payload: { id, field: field as keyof GeneralLoad, value: value as GeneralLoadValue } });
        break;
      case 'hvac':
        dispatch({ type: 'UPDATE_HVAC_LOAD', payload: { id, field: field as keyof HVACLoad, value: value as HVACLoadValue } });
        break;
      case 'evse':
        dispatch({ type: 'UPDATE_EVSE_LOAD', payload: { id, field: field as keyof EVSELoad, value: value as EVSELoadValue } });
        break;
      case 'solar':
        dispatch({ type: 'UPDATE_SOLAR_BATTERY_LOAD', payload: { id, field: field as keyof SolarBatteryLoad, value: value as SolarBatteryLoadValue } });
        break;
    }
  }, []);
  
  const addLoad = React.useCallback((category: LoadCategory, loadData: Partial<GeneralLoad | HVACLoad | EVSELoad | SolarBatteryLoad> = {}) => {
    dispatch({ type: 'ADD_LOAD', payload: { category, load: loadData } });
  }, []);
  
  const removeLoad = React.useCallback((category: LoadCategory, id: number) => {
    dispatch({ type: 'REMOVE_LOAD', payload: { category, id } });
  }, []);
  
  const resetLoads = React.useCallback((newLoads: LoadState) => {
    dispatch({ type: 'RESET_LOADS', payload: newLoads });
  }, []);
  
  const resetToDefaults = React.useCallback(() => {
    try {
      sessionStorage.removeItem(LOAD_SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
    dispatch({ type: 'RESET_LOADS', payload: initialLoadState });
  }, []);

  const saveToLocalStorage = React.useCallback((projectId: string) => {
    try {
      const projectKey = `${LOAD_STORAGE_KEY}_${projectId}`;
      localStorage.setItem(projectKey, JSON.stringify(loads));
      return true;
    } catch (error) {
      console.warn('Failed to save load data to localStorage:', error);
      return false;
    }
  }, [loads]);

  const loadFromLocalStorage = React.useCallback((projectId: string) => {
    try {
      const projectKey = `${LOAD_STORAGE_KEY}_${projectId}`;
      const saved = localStorage.getItem(projectKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && 
            Array.isArray(parsed.generalLoads) && 
            Array.isArray(parsed.hvacLoads) && 
            Array.isArray(parsed.evseLoads) && 
            Array.isArray(parsed.solarBatteryLoads)) {
          dispatch({ type: 'RESET_LOADS', payload: parsed });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn('Failed to load load data from localStorage:', error);
      return false;
    }
  }, []);

  const clearSessionData = React.useCallback(() => {
    try {
      sessionStorage.removeItem(LOAD_SESSION_KEY);
      dispatch({ type: 'RESET_LOADS', payload: initialLoadState });
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }, []);
  
  const loadCounts = useMemo(() => ({
    general: loads.generalLoads?.length || 0,
    hvac: loads.hvacLoads?.length || 0,
    evse: loads.evseLoads?.length || 0,
    solar: loads.solarBatteryLoads?.length || 0
  }), [loads]);
  
  const totalLoads = useMemo(() => 
    Object.values(loadCounts).reduce((sum, count) => sum + count, 0), 
    [loadCounts]
  );
  
  const contextValue = useMemo(() => ({
    loads,
    dispatch,
    updateLoad,
    addLoad,
    removeLoad,
    resetLoads,
    resetToDefaults,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearSessionData,
    totalLoads,
    loadCounts
  }), [loads, updateLoad, addLoad, removeLoad, resetLoads, resetToDefaults, saveToLocalStorage, loadFromLocalStorage, clearSessionData, totalLoads, loadCounts]);
  
  return (
    <LoadDataContext.Provider value={contextValue}>
      {children}
    </LoadDataContext.Provider>
  );
};

export const useLoadData = (): LoadDataContextType => {
  const context = useContext(LoadDataContext);
  if (!context) {
    throw new Error('useLoadData must be used within a LoadDataProvider');
  }
  return context;
};