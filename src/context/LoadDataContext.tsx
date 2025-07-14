import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { 
  LoadState, 
  GeneralLoad, 
  HVACLoad, 
  EVSELoad, 
  SolarBatteryLoad,
  LoadCategory 
} from '../types';
import { LOAD_TEMPLATES } from '../constants';

// Load-specific actions
type LoadDataAction = 
  | { type: 'UPDATE_GENERAL_LOAD'; payload: { id: number; field: keyof GeneralLoad; value: any } }
  | { type: 'UPDATE_HVAC_LOAD'; payload: { id: number; field: keyof HVACLoad; value: any } }
  | { type: 'UPDATE_EVSE_LOAD'; payload: { id: number; field: keyof EVSELoad; value: any } }
  | { type: 'UPDATE_SOLAR_BATTERY_LOAD'; payload: { id: number; field: keyof SolarBatteryLoad; value: any } }
  | { type: 'ADD_LOAD'; payload: { category: LoadCategory; load: any } }
  | { type: 'REMOVE_LOAD'; payload: { category: LoadCategory; id: number } }
  | { type: 'RESET_LOADS'; payload: LoadState }
  | { type: 'IMPORT_LOADS'; payload: LoadState };

interface LoadDataContextType {
  loads: LoadState;
  dispatch: React.Dispatch<LoadDataAction>;
  
  // Convenience methods
  updateLoad: (category: LoadCategory, id: number, field: string, value: any) => void;
  addLoad: (category: LoadCategory, loadData?: Partial<any>) => void;
  removeLoad: (category: LoadCategory, id: number) => void;
  resetLoads: (newLoads: LoadState) => void;
  
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
    case 'UPDATE_GENERAL_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        generalLoads: state.generalLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'UPDATE_HVAC_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        hvacLoads: state.hvacLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'UPDATE_EVSE_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        evseLoads: state.evseLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'UPDATE_SOLAR_BATTERY_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        solarBatteryLoads: state.solarBatteryLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'ADD_LOAD': {
      const { category, load } = action.payload;
      const template = LOAD_TEMPLATES[category][0]; // Get default template
      const newLoad = {
        ...template,
        ...load,
        id: Date.now() + Math.random() // Ensure unique ID
      };
      
      switch (category) {
        case 'general':
          return { ...state, generalLoads: [...state.generalLoads, newLoad] };
        case 'hvac':
          return { ...state, hvacLoads: [...state.hvacLoads, newLoad] };
        case 'evse':
          return { ...state, evseLoads: [...state.evseLoads, newLoad] };
        case 'solar':
          return { ...state, solarBatteryLoads: [...state.solarBatteryLoads, newLoad] };
        default:
          return state;
      }
    }
    
    case 'REMOVE_LOAD': {
      const { category, id } = action.payload;
      
      switch (category) {
        case 'general':
          return { 
            ...state, 
            generalLoads: state.generalLoads.filter(load => load.id !== id) 
          };
        case 'hvac':
          return { 
            ...state, 
            hvacLoads: state.hvacLoads.filter(load => load.id !== id) 
          };
        case 'evse':
          return { 
            ...state, 
            evseLoads: state.evseLoads.filter(load => load.id !== id) 
          };
        case 'solar':
          return { 
            ...state, 
            solarBatteryLoads: state.solarBatteryLoads.filter(load => load.id !== id) 
          };
        default:
          return state;
      }
    }
    
    case 'RESET_LOADS':
      return action.payload;
      
    case 'IMPORT_LOADS':
      return { ...action.payload };
    
    default:
      return state;
  }
}

const LoadDataContext = createContext<LoadDataContextType | undefined>(undefined);

export const LoadDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loads, dispatch] = useReducer(loadDataReducer, initialLoadState);
  
  // Memoized convenience methods
  const updateLoad = React.useCallback((
    category: LoadCategory, 
    id: number, 
    field: string, 
    value: any
  ) => {
    switch (category) {
      case 'general':
        dispatch({ type: 'UPDATE_GENERAL_LOAD', payload: { id, field: field as keyof GeneralLoad, value } });
        break;
      case 'hvac':
        dispatch({ type: 'UPDATE_HVAC_LOAD', payload: { id, field: field as keyof HVACLoad, value } });
        break;
      case 'evse':
        dispatch({ type: 'UPDATE_EVSE_LOAD', payload: { id, field: field as keyof EVSELoad, value } });
        break;
      case 'solar':
        dispatch({ type: 'UPDATE_SOLAR_BATTERY_LOAD', payload: { id, field: field as keyof SolarBatteryLoad, value } });
        break;
    }
  }, []);
  
  const addLoad = React.useCallback((category: LoadCategory, loadData: Partial<any> = {}) => {
    dispatch({ type: 'ADD_LOAD', payload: { category, load: loadData } });
  }, []);
  
  const removeLoad = React.useCallback((category: LoadCategory, id: number) => {
    dispatch({ type: 'REMOVE_LOAD', payload: { category, id } });
  }, []);
  
  const resetLoads = React.useCallback((newLoads: LoadState) => {
    dispatch({ type: 'RESET_LOADS', payload: newLoads });
  }, []);
  
  // Memoized statistics
  const loadCounts = useMemo(() => ({
    general: loads.generalLoads.length,
    hvac: loads.hvacLoads.length,
    evse: loads.evseLoads.length,
    solar: loads.solarBatteryLoads.length
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
    totalLoads,
    loadCounts
  }), [loads, updateLoad, addLoad, removeLoad, resetLoads, totalLoads, loadCounts]);
  
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