export interface LoadItem {
  id: number;
  name: string;
  quantity: number;
  amps: number;
  volts: number;
  va: number;
  total: number;
  category?: string;
  critical?: boolean;
  continuous?: boolean;
  circuit?: string;
  type?: string;
  hp?: number;
}

export interface GeneralLoad extends LoadItem {
  category: 'lighting' | 'kitchen' | 'laundry' | 'bathroom' | 'other';
}

export interface HVACLoad extends LoadItem {
  type: 'hvac' | 'resistance_heat' | 'motor' | 'other';
  hp?: number;
}

export interface EVSELoad extends LoadItem {
  continuous: true;
}

export interface SolarBatteryLoad extends LoadItem {
  kw: number;
  inverterAmps: number;
  breaker: number;
  type: 'solar' | 'battery';
  location: 'backfeed' | 'supply_side' | 'load_side';
}

export type LoadCategory = 'general' | 'hvac' | 'evse' | 'solar';

export interface LoadState {
  generalLoads: GeneralLoad[];
  hvacLoads: HVACLoad[];
  evseLoads: EVSELoad[];
  solarBatteryLoads: SolarBatteryLoad[];
}

export type LoadAction = 
  | { type: 'UPDATE_GENERAL_LOAD'; payload: { id: number; field: keyof GeneralLoad; value: any } }
  | { type: 'UPDATE_HVAC_LOAD'; payload: { id: number; field: keyof HVACLoad; value: any } }
  | { type: 'UPDATE_EVSE_LOAD'; payload: { id: number; field: keyof EVSELoad; value: any } }
  | { type: 'UPDATE_SOLAR_BATTERY_LOAD'; payload: { id: number; field: keyof SolarBatteryLoad; value: any } }
  | { type: 'ADD_LOAD'; payload: { category: LoadCategory; load: LoadItem } }
  | { type: 'REMOVE_LOAD'; payload: { category: LoadCategory; id: number } }
  | { type: 'RESET_LOADS'; payload: LoadState };