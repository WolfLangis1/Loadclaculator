import type { GeneralLoad, HVACLoad, EVSELoad, SolarBatteryLoad } from '../types';

export const LOAD_TEMPLATES = {
  GENERAL: [
    // Note: General lighting (3 VA/sq ft), small appliance circuits (3000 VA), 
    // laundry circuit (1500 VA), and bathroom circuit (1500 VA) are automatically 
    // calculated per NEC 220.52 and included in necCalculations.ts
    
    // Only list appliances that need individual calculation beyond NEC 220.52
    { id: 1, name: 'Electric Range/Oven', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 2, name: 'Refrigerator (Dedicated Circuit)', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, category: 'kitchen' as const, critical: true, circuit: '' },
    { id: 3, name: 'Microwave (Dedicated Circuit)', quantity: 0, amps: 16, volts: 120, va: 1920, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 4, name: 'Dishwasher (Dedicated Circuit)', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 5, name: 'Garbage Disposal', quantity: 0, amps: 12, volts: 120, va: 1440, total: 0, category: 'kitchen' as const, critical: false, circuit: '' },
    { id: 6, name: 'Electric Clothes Dryer', quantity: 0, amps: 24, volts: 240, va: 5760, total: 0, category: 'laundry' as const, critical: false, circuit: '' },
    { id: 7, name: 'Electric Water Heater', quantity: 0, amps: 24, volts: 240, va: 5760, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 8, name: 'Pool Pump', quantity: 0, amps: 12, volts: 240, va: 2880, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 9, name: 'Hot Tub/Spa', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 10, name: 'Garage Door Operator', quantity: 0, amps: 6, volts: 120, va: 720, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 11, name: 'Well Pump', quantity: 0, amps: 15, volts: 240, va: 3600, total: 0, category: 'other' as const, critical: true, circuit: '' },
    { id: 12, name: 'Workshop/Garage Receptacles', quantity: 0, amps: 16, volts: 120, va: 1920, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 13, name: 'Outdoor Receptacles', quantity: 0, amps: 20, volts: 120, va: 2400, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 14, name: 'Landscape/Security Lighting', quantity: 0, amps: 5, volts: 120, va: 600, total: 0, category: 'other' as const, critical: false, circuit: '' },
    { id: 15, name: 'Other Large Appliance', quantity: 0, amps: 15, volts: 240, va: 3600, total: 0, category: 'other' as const, critical: false, circuit: '' }
  ] as GeneralLoad[],
  
  HVAC: [
    { id: 1, name: 'Air Conditioning Load #1', quantity: 0, amps: 32, volts: 240, va: 7680, total: 0, type: 'hvac' as const, critical: true, circuit: '' },
    { id: 2, name: 'Air Conditioning Load #2', quantity: 0, amps: 32, volts: 240, va: 7680, total: 0, type: 'hvac' as const, critical: false, circuit: '' },
    { id: 3, name: 'Heat Pump Load', quantity: 0, amps: 30, volts: 240, va: 7200, total: 0, type: 'hvac' as const, critical: true, circuit: '' },
    { id: 4, name: 'Electric Heat Load', quantity: 0, amps: 20, volts: 240, va: 4800, total: 0, type: 'resistance_heat' as const, critical: true, circuit: '' },
    { id: 5, name: 'Air Handler / Furnace Fan', quantity: 0, amps: 5, volts: 120, va: 600, total: 0, type: 'motor' as const, hp: 0.5, critical: true, circuit: '' },
    { id: 6, name: 'Attic Fan', quantity: 0, amps: 8, volts: 120, va: 960, total: 0, type: 'motor' as const, hp: 1, critical: false, circuit: '' },
    { id: 7, name: 'Other HVAC', quantity: 0, amps: 20, volts: 240, va: 4800, total: 0, type: 'other' as const, critical: false, circuit: '' }
  ] as HVACLoad[],
  
  EVSE: [
    { id: 1, name: 'Level 2 EV Charger #1', quantity: 0, amps: 48, volts: 240, va: 11520, total: 0, continuous: true as const, circuit: '' },
    { id: 2, name: 'Level 2 EV Charger #2', quantity: 0, amps: 32, volts: 240, va: 7680, total: 0, continuous: true as const, circuit: '' },
    { id: 3, name: 'Level 2 EV Charger #3', quantity: 0, amps: 40, volts: 240, va: 9600, total: 0, continuous: true as const, circuit: '' },
    { id: 4, name: 'Tesla Wall Connector', quantity: 0, amps: 48, volts: 240, va: 11520, total: 0, continuous: true as const, circuit: '' }
  ] as EVSELoad[],
  
  SOLAR_BATTERY: [
    { id: 1, name: 'String Inverter System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 2, name: 'Micro-Inverter System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 3, name: 'Power Optimizer System', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'solar' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 4, name: 'Battery Energy Storage #1', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'battery' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' },
    { id: 5, name: 'Battery Energy Storage #2', kw: 0, inverterAmps: 0, volts: 240, breaker: 0, type: 'battery' as const, location: 'backfeed' as const, amps: 0, va: 0, total: 0, quantity: 0, circuit: '' }
  ] as SolarBatteryLoad[]
} as const;