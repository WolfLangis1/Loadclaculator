import { NEC_CONSTANTS, WIRE_RESISTANCE } from '../constants';
import type { WireSizeResult } from '../types';

export const calculateWireSize = (
  amps: number,
  _volts: number,
  _distance: number = 50,
  tempRating: '60C' | '75C' | '90C' = '75C',
  conduitFill: number = 3,
  material: 'copper' | 'aluminum' = 'copper'
): string => {
  const minAmpacity = amps * 1.25; // 125% safety factor
  const ampacityColumn = material === 'aluminum' ? 'aluminum' : `copper${tempRating}` as 'copper60C' | 'copper75C' | 'copper90C' | 'aluminum';
  
  // Derating factors for conduit fill
  const conduitDerating = {
    1: 1.0, 2: 1.0, 3: 1.0,
    4: 0.8, 5: 0.8, 6: 0.8,
    7: 0.7, 8: 0.7, 9: 0.7,
    10: 0.5
  };
  
  const derateFactor = conduitDerating[Math.min(conduitFill, 10) as keyof typeof conduitDerating] || 0.5;
  const requiredAmpacity = minAmpacity / derateFactor;
  
  // Find smallest wire that meets ampacity requirement
  // Wire sizes in order from smallest to largest
  const wireSizes = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500'];
  
  for (const wireSize of wireSizes) {
    const ratings = NEC_CONSTANTS.WIRE_AMPACITY[wireSize as keyof typeof NEC_CONSTANTS.WIRE_AMPACITY];
    if (ratings) {
      const ampacity = (ratings as any)[ampacityColumn];
      if (ampacity && ampacity >= requiredAmpacity) {
        return wireSize;
      }
    }
  }
  
  return '500'; // Largest available
};

export const calculateVoltageDrop = (
  amps: number,
  _volts: number,
  wireSize: string,
  distance: number,
  material: 'copper' | 'aluminum' = 'copper'
): number => {
  const resistance = WIRE_RESISTANCE[material][wireSize as keyof typeof WIRE_RESISTANCE[typeof material]];
  if (!resistance) return 0;
  
  // Voltage drop formula: VD = 2 * I * R * L / 1000
  // Factor of 2 for single-phase (round trip), divide by 1000 to convert feet to thousands of feet
  const voltageDrop = (2 * amps * resistance * distance) / 1000;
  return voltageDrop;
};

export const calculateVoltageDropPercent = (
  voltageDrop: number,
  voltage: number
): number => {
  return (voltageDrop / voltage) * 100;
};

export const getWireSizeCalculation = (
  amps: number,
  volts: number,
  distance: number = 50,
  tempRating: '60C' | '75C' | '90C' = '75C',
  conduitFill: number = 3,
  material: 'copper' | 'aluminum' = 'copper'
): WireSizeResult => {
  const wireSize = calculateWireSize(amps, volts, distance, tempRating, conduitFill, material);
  const ampacityColumn = material === 'aluminum' ? 'aluminum' : `copper${tempRating}` as 'copper60C' | 'copper75C' | 'copper90C' | 'aluminum';
  const ampacity = (NEC_CONSTANTS.WIRE_AMPACITY[wireSize as keyof typeof NEC_CONSTANTS.WIRE_AMPACITY] as any)[ampacityColumn] || 0;
  
  const voltageDrop = calculateVoltageDrop(amps, volts, wireSize, distance, material);
  const voltageDropPercent = calculateVoltageDropPercent(voltageDrop, volts);
  
  const conduitDerating = conduitFill > 3 ? (conduitFill <= 6 ? 0.8 : conduitFill <= 9 ? 0.7 : 0.5) : 1.0;
  
  return {
    wireSize,
    ampacity,
    voltageDrop,
    voltageDropPercent,
    derating: conduitDerating
  };
};