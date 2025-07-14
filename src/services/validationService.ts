import type { 
  LoadState, 
  ValidationMessage, 
  GeneralLoad, 
  HVACLoad, 
  EVSELoad, 
  SolarBatteryLoad,
  CalculationMethod,
  PanelDetails 
} from '../types';

export interface ValidationRule<T = any> {
  field: keyof T;
  validator: (value: any, item?: T, context?: ValidationContext) => ValidationResult;
  priority: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
}

export interface ValidationContext {
  loads: LoadState;
  method: CalculationMethod;
  squareFootage: number;
  mainBreaker: number;
  panelDetails: PanelDetails;
}

// Validation rules for different load types
export const generalLoadValidationRules: ValidationRule<GeneralLoad>[] = [
  {
    field: 'name',
    priority: 'error',
    message: 'Load description is required',
    validator: (value) => ({
      isValid: Boolean(value && value.trim().length > 0),
      message: 'Please provide a description for this load'
    })
  },
  {
    field: 'amps',
    priority: 'error',
    message: 'Amperage must be valid',
    validator: (value) => ({
      isValid: value >= 0 && value <= 200,
      message: value < 0 ? 'Amperage cannot be negative' : 
               value > 200 ? 'Amperage over 200A is unusual for general loads' :
               'Amperage is required'
    })
  },
  {
    field: 'volts',
    priority: 'warning',
    message: 'Non-standard voltage',
    validator: (value) => ({
      isValid: [120, 240, 277, 480].includes(value),
      message: 'Standard voltages are 120V, 240V, 277V, or 480V',
      suggestion: 'Verify voltage is correct for this load type'
    })
  }
];

export class ValidationService {
  static generalLoadValidationRules = generalLoadValidationRules;
  
  static validateLoad<T>(
    load: T, 
    rules: ValidationRule<T>[], 
    context?: ValidationContext
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];

    for (const rule of rules) {
      const value = (load as any)[rule.field];
      const result = rule.validator(value, load, context);
      
      if (!result.isValid || result.suggestion) {
        messages.push({
          type: result.isValid ? 'warning' : rule.priority as 'error' | 'warning',
          message: result.message || rule.message,
          code: `${String(rule.field)}_validation`,
          field: String(rule.field)
        });
      }
    }

    return messages;
  }

  static getFieldValidation(
    value: any, 
    field: string, 
    loadType: 'general' | 'hvac' | 'evse' | 'solar'
  ): ValidationResult {
    let rules: ValidationRule<any>[] = [];
    
    switch (loadType) {
      case 'general':
        rules = generalLoadValidationRules;
        break;
      default:
        return { isValid: true };
    }

    const rule = rules.find(r => r.field === field);
    if (!rule) {
      return { isValid: true };
    }

    return rule.validator(value);
  }
  
  static validateOverallSystem(
    loads: LoadState,
    calculationMethod: CalculationMethod,
    mainBreaker: number,
    totalDemand: number
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    // Check service capacity
    const serviceCapacity = mainBreaker * 240 * 0.8; // 80% rule
    if (totalDemand > serviceCapacity) {
      messages.push({
        type: 'error',
        message: `Total demand (${totalDemand.toLocaleString()}VA) exceeds 80% of service capacity (${serviceCapacity.toLocaleString()}VA)`,
        code: 'service_overload',
        field: 'system'
      });
    }
    
    return messages;
  }
}

// Legacy validation function for backward compatibility
export const validateLoad = (load: any): ValidationMessage[] => {
  const errors: ValidationMessage[] = [];
  
  // Validate required fields
  if (!load.name || !load.name.trim()) {
    errors.push({
      type: 'error',
      message: 'Load name is required',
      code: 'VALIDATION_ERROR',
      field: 'name'
    });
  }
  
  if (load.quantity < 0) {
    errors.push({
      type: 'error',
      message: 'Quantity cannot be negative',
      code: 'VALIDATION_ERROR',
      field: 'quantity'
    });
  }
  
  if (load.amps < 0) {
    errors.push({
      type: 'error',
      message: 'Amperage cannot be negative',
      code: 'VALIDATION_ERROR',
      field: 'amps'
    });
  }
  
  if (load.volts !== 120 && load.volts !== 240) {
    errors.push({
      type: 'error',
      message: 'Voltage must be 120V or 240V for residential applications',
      code: 'NEC_VOLTAGE',
      field: 'volts'
    });
  }
  
  // Validate reasonable amperage limits
  if (load.amps > 200) {
    errors.push({
      type: 'error',
      message: 'Amperage exceeds reasonable limits for residential loads',
      code: 'VALIDATION_ERROR',
      field: 'amps'
    });
  }
  
  // Validate power consistency
  const calculatedVA = load.amps * load.volts;
  if (Math.abs(calculatedVA - load.va) > 1) {
    errors.push({
      type: 'error',
      message: 'VA calculation does not match amps × volts',
      code: 'POWER_CALCULATION',
      field: 'va'
    });
  }
  
  const calculatedTotal = load.va * load.quantity;
  if (Math.abs(calculatedTotal - load.total) > 1) {
    errors.push({
      type: 'error',
      message: 'Total calculation does not match VA × quantity',
      code: 'TOTAL_CALCULATION',
      field: 'total'
    });
  }
  
  return errors;
};

export const validateProjectInfo = (projectInfo: any): ValidationMessage[] => {
  const errors: ValidationMessage[] = [];
  
  if (!projectInfo.customerName?.trim()) {
    errors.push({
      type: 'error',
      message: 'Customer name is required',
      code: 'REQUIRED_FIELD',
      field: 'customerName'
    });
  }
  
  if (!projectInfo.propertyAddress?.trim()) {
    errors.push({
      type: 'error',
      message: 'Property address is required',
      code: 'REQUIRED_FIELD',
      field: 'propertyAddress'
    });
  }
  
  if (!projectInfo.calculatedBy?.trim()) {
    errors.push({
      type: 'error',
      message: 'Calculated by field is required for permit submission',
      code: 'PERMIT_REQUIREMENT',
      field: 'calculatedBy'
    });
  }
  
  return errors;
};

export const validateServiceSize = (totalAmps: number, serviceSize: number): ValidationMessage[] => {
  const errors: ValidationMessage[] = [];
  
  if (totalAmps > serviceSize) {
    errors.push({
      type: 'error',
      message: `Total load ${totalAmps.toFixed(1)}A exceeds service capacity ${serviceSize}A`,
      code: 'NEC 220.83',
      field: 'serviceSize'
    });
  }
  
  // Main service breakers can be loaded to 100% of rating
  // 80% rule (NEC 210.20(A)) applies to branch circuits, not main service breakers
  
  return errors;
};