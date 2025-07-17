import { Home, Zap, Car, Battery } from 'lucide-react';
import { OptimizedGeneralLoadsTable } from '../components/LoadCalculator/LoadTables/OptimizedGeneralLoadsTable';
import { HVACLoadsTable } from '../components/LoadCalculator/LoadTables/HVACLoadsTable';
import { EVSELoadsTable } from '../components/LoadCalculator/LoadTables/EVSELoadsTable';
import { SolarBatteryTable } from '../components/LoadCalculator/LoadTables/SolarBatteryTable';

export const SECTIONS = [
  { id: 'general', label: 'General Loads', icon: Home, component: OptimizedGeneralLoadsTable, color: 'emerald' },
  { id: 'hvac', label: 'HVAC', icon: Zap, component: HVACLoadsTable, color: 'orange' },
  { id: 'evse', label: 'EV Charging', icon: Car, component: EVSELoadsTable, color: 'blue' },
  { id: 'solar', label: 'Solar/Battery', icon: Battery, component: SolarBatteryTable, color: 'yellow' },
] as const;
