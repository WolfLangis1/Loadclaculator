import React, { createContext, useReducer, useMemo, ReactNode } from 'react';
import type { 
  LoadState, 
  LoadAction, 
  CalculationResults, 
  ProjectInformation, 
  PanelDetails, 
  ActualDemandData,
  CalculationMethod 
} from '../types';
import { LOAD_TEMPLATES } from '../constants';
import { calculateLoadDemand } from '../services';

interface LoadCalculatorState {
  // Load data
  loads: LoadState;
  
  // Project settings
  projectInfo: ProjectInformation;
  squareFootage: number;
  codeYear: string;
  calculationMethod: CalculationMethod;
  mainBreaker: number;
  panelDetails: PanelDetails;
  actualDemandData: ActualDemandData;
  
  // EMS settings
  useEMS: boolean;
  emsMaxLoad: number;
  
  // UI state
  showAdvanced: boolean;
  activeTab: string;
}

export interface LoadCalculatorContextType {
  state: LoadCalculatorState;
  dispatch: React.Dispatch<LoadAction>;
  calculations: CalculationResults;
  updateProjectInfo: (updates: Partial<ProjectInformation>) => void;
  updateSettings: (updates: Partial<Omit<LoadCalculatorState, 'loads' | 'projectInfo'>>) => void;
}

const initialProjectInfo: ProjectInformation = {
  customerName: '',
  propertyAddress: '',
  city: '',
  state: '',
  zipCode: '',
  projectName: '',
  calculatedBy: '',
  date: new Date().toISOString().split('T')[0],
  permitNumber: '',
  jobNumber: '',
  prnNumber: '',
  issueDate: '',
  approvedBy: '',
  jurisdiction: '',
  phone: ''
};

const initialPanelDetails: PanelDetails = {
  manufacturer: 'Square D',
  model: 'QO',
  busRating: 200,
  mainBreakerRating: 200,
  spaces: 40,
  phase: 1
};

const initialActualDemandData: ActualDemandData = {
  enabled: false,
  month1: 0, month2: 0, month3: 0, month4: 0,
  month5: 0, month6: 0, month7: 0, month8: 0,
  month9: 0, month10: 0, month11: 0, month12: 0,
  averageDemand: 0
};

const initialState: LoadCalculatorState = {
  loads: {
    generalLoads: [...LOAD_TEMPLATES.GENERAL],
    hvacLoads: [...LOAD_TEMPLATES.HVAC],
    evseLoads: [...LOAD_TEMPLATES.EVSE],
    solarBatteryLoads: [...LOAD_TEMPLATES.SOLAR_BATTERY]
  },
  projectInfo: initialProjectInfo,
  squareFootage: 1500,
  codeYear: '2023',
  calculationMethod: 'optional',
  mainBreaker: 200,
  panelDetails: initialPanelDetails,
  actualDemandData: initialActualDemandData,
  useEMS: false,
  emsMaxLoad: 0,
  showAdvanced: false,
  activeTab: 'loads'
};

const loadReducer = (state: LoadState, action: LoadAction): LoadState => {
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
    
    case 'RESET_LOADS': {
      return action.payload;
    }
    
    default:
      return state;
  }
};

export const LoadCalculatorContext = createContext<LoadCalculatorContextType | undefined>(undefined);

export const LoadCalculatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loads, dispatch] = useReducer(loadReducer, initialState.loads);
  const [appState, setAppState] = React.useState(() => {
    const { loads, ...rest } = initialState;
    return rest;
  });
  
  const state: LoadCalculatorState = {
    loads,
    ...appState
  };
  
  const calculations = useMemo(() => 
    calculateLoadDemand(
      loads,
      state.calculationMethod,
      state.squareFootage,
      state.mainBreaker,
      state.panelDetails,
      state.actualDemandData,
      state.useEMS,
      state.emsMaxLoad
    ),
    [loads, state.calculationMethod, state.squareFootage, state.mainBreaker, 
     state.panelDetails, state.actualDemandData, state.useEMS, state.emsMaxLoad]
  );
  
  const updateProjectInfo = React.useCallback((updates: Partial<ProjectInformation>) => {
    setAppState(prev => ({
      ...prev,
      projectInfo: { ...prev.projectInfo, ...updates }
    }));
  }, []);
  
  const updateSettings = React.useCallback((updates: Partial<Omit<LoadCalculatorState, 'loads' | 'projectInfo'>>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const contextValue: LoadCalculatorContextType = {
    state,
    dispatch,
    calculations,
    updateProjectInfo,
    updateSettings
  };
  
  return (
    <LoadCalculatorContext.Provider value={contextValue}>
      {children}
    </LoadCalculatorContext.Provider>
  );
};

