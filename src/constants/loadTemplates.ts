import type { GeneralLoad, HVACLoad, EVSELoad, SolarBatteryLoad } from '../types';

export const LOAD_TEMPLATES = {
  general: [
    // Note: General lighting (3 VA/sq ft), small appliance circuits (3000 VA), 
    // laundry circuit (1500 VA), and bathroom circuit (1500 VA) are automatically 
    // calculated per NEC 220.52 and included in necCalculations.ts
    
    // Most common residential appliances
    { id: 1, name: 'Electric Range/Oven', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 2, name: 'Refrigerator', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, category: 'kitchen' as const, critical: true, circuit: '' },
    { id: 3, name: 'Microwave Oven', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 4, name: 'Dishwasher', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 5, name: 'Sub Panel', quantity: 0, amps: 48, volts: 240, va: 12000, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 6, name: 'Electric Clothes Dryer', quantity: 0, amps: 24, volts: 240, va: 5760, total: 0, category: 'laundry' as const, critical: false, circuit: '' },
    { id: 7, name: 'Electric Water Heater', quantity: 0, amps: 24, volts: 240, va: 5760, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 8, name: 'Pool Pump', quantity: 0, amps: 12, volts: 240, va: 2880, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 9, name: 'Hot Tub/Spa', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, category: 'other' as const, critical: false, circuit: '' }
  ] as GeneralLoad[],
  
  hvac: [
    { id: 1, name: 'AC#1', quantity: 0, amps: 32, volts: 240, va: 7680, total: 0, type: 'hvac' as const, critical: true, circuit: '' },
    { id: 2, name: 'AC#2', quantity: 0, amps: 32, volts: 240, va: 7680, total: 0, type: 'hvac' as const, critical: true, circuit: '' },
    { id: 3, name: 'Air Handler/Furnace Fan', quantity: 0, amps: 12, volts: 240, va: 2880, total: 0, type: 'motor' as const, hp: 0.5, critical: true, circuit: '' },
    { id: 4, name: 'Heater', quantity: 0, amps: 16, volts: 240, va: 3840, total: 0, type: 'resistance_heat' as const, critical: true, circuit: '' },
     ] as HVACLoad[],
  
  evse: [
    { id: 1, name: 'Level 2 EV Charger #1', quantity: 0, amps: 48, volts: 240, va: 11520, total: 0, continuous: true as const, circuit: '' },
    { id: 2, name: 'Level 2 EV Charger #2', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, continuous: true as const, circuit: '' }
  ] as EVSELoad[],
  
  solar: [
    { id: 1, name: 'Solar PV System (String Inverter)', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 2, name: 'Solar PV System (Micro-Inverters)', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 3, name: 'Solar PV System (Power Optimizers)', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 4, name: 'Battery Energy Storage System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'battery' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 5, name: 'Tesla Powerwall', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'battery' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' }
  ] as SolarBatteryLoad[]
} as const;