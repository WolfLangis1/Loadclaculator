import type { LoadState } from '../types';

export const calculateGeneralLoadDemand = (generalLoads: LoadState['generalLoads']) => {
  const totalVA = (generalLoads || []).reduce((sum, load) => sum + (load.total || 0), 0);
  const demandVA = totalVA; // Simplified for demo
  const demandAmps = demandVA / 240;
  
  return {
    totalVA,
    demandVA,
    demandAmps
  };
};

export const calculateHVACLoadDemand = (hvacLoads: LoadState['hvacLoads']) => {
  const totalVA = (hvacLoads || []).reduce((sum, load) => sum + (load.total || 0), 0);
  const largestMotorAmps = Math.max(...(hvacLoads || []).map(load => load.amps || 0), 0);
  const demandVA = totalVA + (largestMotorAmps * 240 * 0.25); // 125% factor for largest motor
  const demandAmps = demandVA / 240;
  
  return {
    totalVA,
    demandVA,
    demandAmps,
    largestMotorAmps
  };
};

export const calculateEVSELoadDemand = (evseLoads: LoadState['evseLoads']) => {
  const totalVA = (evseLoads || []).reduce((sum, load) => sum + (load.total || 0), 0);
  const continuousLoadFactor = 1.25; // 125% continuous load factor
  const demandVA = totalVA * continuousLoadFactor;
  const demandAmps = demandVA / 240;
  
  return {
    totalVA,
    demandVA,
    demandAmps,
    continuousLoadFactor
  };
};
