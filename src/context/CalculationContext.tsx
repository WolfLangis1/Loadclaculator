import React, { createContext, useContext, useMemo } from 'react';
import type { 
  CalculationResults, 
  ValidationMessage, 
  LoadState,
  CalculationMethod,
  PanelDetails,
  ActualDemandData
} from '../types';
import { calculateLoadDemand } from '../services/necCalculations';
import { ValidationService } from '../services/validationService';
import { useLoadData } from './LoadDataContext';
import { useProjectSettings } from './ProjectSettingsContext';

interface CalculationContextType {
  calculations: CalculationResults;
  validationMessages: ValidationMessage[];
  isCalculating: boolean;
  performanceMetrics: {
    calculationTime: number;
    lastUpdated: Date;
    memoryUsage?: number;
  };
  
  // Selective calculation methods
  generalLoadCalculations: {
    totalVA: number;
    demandVA: number;
    demandAmps: number;
  };
  hvacLoadCalculations: {
    totalVA: number;
    demandVA: number;
    demandAmps: number;
    largestMotorAmps: number;
  };
  evseLoadCalculations: {
    totalVA: number;
    demandVA: number;
    demandAmps: number;
    continuousLoadFactor: number;
  };
}

const CalculationContext = createContext<CalculationContextType | undefined>(undefined);

export const CalculationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loads } = useLoadData();
  const { settings } = useProjectSettings();
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationTime, setCalculationTime] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  
  // Memoized individual load type calculations for better performance
  const generalLoadCalculations = useMemo(() => {
    const startTime = performance.now();
    
    const totalVA = loads.generalLoads.reduce((sum, load) => sum + (load.total || 0), 0);
    const demandVA = totalVA; // Simplified for demo
    const demandAmps = demandVA / 240;
    
    const endTime = performance.now();
    console.log(`General load calculation took ${endTime - startTime}ms`);
    
    return {
      totalVA,
      demandVA,
      demandAmps
    };
  }, [loads.generalLoads]);
  
  const hvacLoadCalculations = useMemo(() => {
    const startTime = performance.now();
    
    const totalVA = loads.hvacLoads.reduce((sum, load) => sum + (load.total || 0), 0);
    const largestMotorAmps = Math.max(...loads.hvacLoads.map(load => load.amps || 0), 0);
    const demandVA = totalVA + (largestMotorAmps * 240 * 0.25); // 125% factor for largest motor
    const demandAmps = demandVA / 240;
    
    const endTime = performance.now();
    console.log(`HVAC load calculation took ${endTime - startTime}ms`);
    
    return {
      totalVA,
      demandVA,
      demandAmps,
      largestMotorAmps
    };
  }, [loads.hvacLoads]);
  
  const evseLoadCalculations = useMemo(() => {
    const startTime = performance.now();
    
    const totalVA = loads.evseLoads.reduce((sum, load) => sum + (load.total || 0), 0);
    const continuousLoadFactor = 1.25; // 125% continuous load factor
    const demandVA = totalVA * continuousLoadFactor;
    const demandAmps = demandVA / 240;
    
    const endTime = performance.now();
    console.log(`EVSE load calculation took ${endTime - startTime}ms`);
    
    return {
      totalVA,
      demandVA,
      demandAmps,
      continuousLoadFactor
    };
  }, [loads.evseLoads]);
  
  // Main calculation with performance tracking
  const calculations = useMemo(() => {
    setIsCalculating(true);
    const startTime = performance.now();
    
    const result = calculateLoadDemand(
      loads,
      settings.calculationMethod,
      settings.squareFootage,
      settings.mainBreaker,
      settings.panelDetails,
      settings.actualDemandData,
      settings.useEMS,
      settings.emsMaxLoad,
      settings.loadManagementType,
      settings.loadManagementMaxLoad,
      settings.simpleSwitchMode,
      settings.simpleSwitchLoadA,
      settings.simpleSwitchLoadB
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setCalculationTime(duration);
    setLastUpdated(new Date());
    setIsCalculating(false);
    
    console.log(`Total calculation took ${duration}ms`);
    
    return result;
  }, [
    loads,
    settings.calculationMethod,
    settings.squareFootage,
    settings.mainBreaker,
    settings.panelDetails,
    settings.actualDemandData,
    settings.useEMS,
    settings.emsMaxLoad,
    settings.loadManagementType,
    settings.loadManagementMaxLoad,
    settings.simpleSwitchMode,
    settings.simpleSwitchLoadA,
    settings.simpleSwitchLoadB
  ]);
  
  // Validation messages with performance tracking
  const validationMessages = useMemo(() => {
    const startTime = performance.now();
    
    const messages: ValidationMessage[] = [];
    
    // Validate general loads
    loads.generalLoads.forEach(load => {
      const loadMessages = ValidationService.validateLoad(load, ValidationService.generalLoadValidationRules);
      messages.push(...loadMessages);
    });
    
    // Add system-level validations
    const systemMessages = ValidationService.validateOverallSystem(
      loads,
      settings.calculationMethod,
      settings.mainBreaker,
      calculations.totalDemand || 0
    );
    messages.push(...systemMessages);
    
    const endTime = performance.now();
    console.log(`Validation took ${endTime - startTime}ms`);
    
    return messages;
  }, [loads, settings.calculationMethod, settings.mainBreaker, calculations.totalDemand]);
  
  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    calculationTime,
    lastUpdated,
    memoryUsage: (performance as any).memory?.usedJSHeapSize
  }), [calculationTime, lastUpdated]);
  
  const contextValue = useMemo(() => ({
    calculations,
    validationMessages,
    isCalculating,
    performanceMetrics,
    generalLoadCalculations,
    hvacLoadCalculations,
    evseLoadCalculations
  }), [
    calculations,
    validationMessages,
    isCalculating,
    performanceMetrics,
    generalLoadCalculations,
    hvacLoadCalculations,
    evseLoadCalculations
  ]);
  
  return (
    <CalculationContext.Provider value={contextValue}>
      {children}
    </CalculationContext.Provider>
  );
};

export const useCalculations = (): CalculationContextType => {
  const context = useContext(CalculationContext);
  if (!context) {
    throw new Error('useCalculations must be used within a CalculationProvider');
  }
  return context;
};