import type { LoadItem, ValidationMessage } from '../types';

export const validateLoad = (load: LoadItem): ValidationMessage[] => {
  const errors: ValidationMessage[] = [];
  
  // Validate required fields
  if (!load.name.trim()) {
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