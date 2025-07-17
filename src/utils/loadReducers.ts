import type { LoadState, GeneralLoad, HVACLoad, EVSELoad, SolarBatteryLoad, LoadCategory } from '../types';
import { LOAD_TEMPLATES } from '../constants';

type LoadItem = GeneralLoad | HVACLoad | EVSELoad | SolarBatteryLoad;

export const updateGeneralLoad = (state: LoadState, payload: { id: number; field: keyof GeneralLoad; value: GeneralLoad[keyof GeneralLoad] }): LoadState => {
  const { id, field, value } = payload;
  return {
    ...state,
    generalLoads: state.generalLoads.map(load =>
      load.id === id ? { ...load, [field]: value } : load
    )
  };
};

export const updateHVACLoad = (state: LoadState, payload: { id: number; field: keyof HVACLoad; value: HVACLoad[keyof HVACLoad] }): LoadState => {
  const { id, field, value } = payload;
  return {
    ...state,
    hvacLoads: state.hvacLoads.map(load =>
      load.id === id ? { ...load, [field]: value } : load
    )
  };
};

export const updateEVSELoad = (state: LoadState, payload: { id: number; field: keyof EVSELoad; value: EVSELoad[keyof EVSELoad] }): LoadState => {
  const { id, field, value } = payload;
  return {
    ...state,
    evseLoads: state.evseLoads.map(load =>
      load.id === id ? { ...load, [field]: value } : load
    )
  };
};

export const updateSolarBatteryLoad = (state: LoadState, payload: { id: number; field: keyof SolarBatteryLoad; value: SolarBatteryLoad[keyof SolarBatteryLoad] }): LoadState => {
  const { id, field, value } = payload;
  return {
    ...state,
    solarBatteryLoads: state.solarBatteryLoads.map(load =>
      load.id === id ? { ...load, [field]: value } : load
    )
  };
};

export const addLoad = (state: LoadState, payload: { category: LoadCategory; load: Partial<LoadItem> }): LoadState => {
  const { category, load } = payload;
  const template = LOAD_TEMPLATES[category][0]; // Get default template
  const newLoad = {
    ...template,
    ...load,
    id: Date.now() + Math.random() // Ensure unique ID
  };
  
  switch (category) {
    case 'general':
      return { ...state, generalLoads: [...state.generalLoads, newLoad as GeneralLoad] };
    case 'hvac':
      return { ...state, hvacLoads: [...state.hvacLoads, newLoad as HVACLoad] };
    case 'evse':
      return { ...state, evseLoads: [...state.evseLoads, newLoad as EVSELoad] };
    case 'solar':
      return { ...state, solarBatteryLoads: [...state.solarBatteryLoads, newLoad as SolarBatteryLoad] };
    default:
      return state;
  }
};

export const removeLoad = (state: LoadState, payload: { category: LoadCategory; id: number }): LoadState => {
  const { category, id } = payload;
  
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
};
