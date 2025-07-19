import React, { createContext, useContext, useMemo } from 'react';
import type { 
  CalculationResults, 
  ValidationMessage, 
  LoadState,
  CalculationMethod,
  PanelDetails,
  ActualDemandData
} from '../types';
import { calculateGeneralLoadDemand, calculateHVACLoadDemand, calculateEVSELoadDemand } from '../utils/loadCalculations';
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
  
  const generalLoadCalculations = useMemo(() => calculateGeneralLoadDemand(loads.generalLoads), [loads.generalLoads]);
  const hvacLoadCalculations = useMemo(() => calculateHVACLoadDemand(loads.hvacLoads), [loads.hvacLoads]);
  const evseLoadCalculations = useMemo(() => calculateEVSELoadDemand(loads.evseLoads), [loads.evseLoads]);
  
  // Main calculation with performance tracking
  const calculations = useMemo(() => {
    setIsCalculating(true);
    const startTime = performance.now();
    
    try {
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
      
      // Only log if calculation takes significant time (>5ms) or in development
      if (duration > 5 || import.meta.env.DEV) {
        console.debug(`Calculation completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      console.error('Calculation failed:', error);
      console.error('Error details:', { 
        loads, 
        settings,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      setIsCalculating(false);
      
      // Return default calculation result to prevent UI crashes
      return {
        totalDemand: 0,
        serviceDemand: 0,
        generalDemand: 0,
        hvacDemand: 0,
        evseDemand: 0,
        solarDemand: 0,
        batteryDemand: 0,
        percentCapacity: 0,
        isCompliant: false,
        violations: [],
        calculations: {
          general: { totalVA: 0, demandVA: 0, demandAmps: 0 },
          hvac: { totalVA: 0, demandVA: 0, demandAmps: 0, largestMotorAmps: 0 },
          evse: { totalVA: 0, demandVA: 0, demandAmps: 0, continuousLoadFactor: 1.25 },
          solar: { totalVA: 0, demandVA: 0, demandAmps: 0 },
          battery: { totalVA: 0, demandVA: 0, demandAmps: 0 }
        }
      };
    }
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
    (loads.generalLoads || []).forEach(load => {
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
    const duration = endTime - startTime;
    
    // Only log validation time if it takes significant time (>10ms) or has many messages
    if (duration > 10 || messages.length > 10) {
      console.debug(`Validation completed in ${duration.toFixed(2)}ms with ${messages.length} messages`);
    }
    
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