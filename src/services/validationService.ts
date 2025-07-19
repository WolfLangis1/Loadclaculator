import { ErrorHandlingService } from './errorHandlingService';
import { ErrorType } from '../types/error';
import type {
  LoadState,
  CalculationMethod,
  PanelDetails,
  ActualDemandData,
  ValidationMessage,
} from '../types';

export class ValidationService {
  static validateCalculationInputs(
    loadState: LoadState,
    calculationMethod: CalculationMethod,
    squareFootage: number,
    mainBreaker: number,
    panelDetails: PanelDetails,
    actualDemandData: ActualDemandData
  ): void {
    if (!loadState) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Load state is required',
        'Load data is missing.',
        { loadState },
        'ValidationService.validateCalculationInputs'
      );
    }

    const validMethods: CalculationMethod[] = ['standard', 'optional', 'existing'];
    if (!validMethods.includes(calculationMethod)) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid calculation method',
        'Please select a valid calculation method.',
        { calculationMethod },
        'ValidationService.validateCalculationInputs'
      );
    }

    if (typeof squareFootage !== 'number' || squareFootage <= 0 || squareFootage > 100000) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid square footage',
        'Square footage must be a positive number between 1 and 100,000.',
        { squareFootage },
        'ValidationService.validateCalculationInputs'
      );
    }

    const validBreakerSizes = [60, 100, 125, 150, 175, 200, 225, 300, 320, 350, 400, 600, 800, 1000, 1200, 1600, 2000];
    if (!validBreakerSizes.includes(mainBreaker)) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid main breaker size',
        `Main breaker must be one of: ${validBreakerSizes.join(', ')}.`,
        { mainBreaker },
        'ValidationService.validateCalculationInputs'
      );
    }

    if (!panelDetails) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Panel details are required',
        'Panel details are missing.',
        { panelDetails },
        'ValidationService.validateCalculationInputs'
      );
    }

    if (calculationMethod === 'existing' && actualDemandData.enabled) {
      if (typeof actualDemandData.averageDemand !== 'number' || actualDemandData.averageDemand < 0) {
        throw ErrorHandlingService.createError(
          ErrorType.VALIDATION,
          'Invalid average demand',
          'Average demand must be a non-negative number when using existing dwelling method.',
          { averageDemand: actualDemandData.averageDemand },
          'ValidationService.validateCalculationInputs'
        );
      }
    }

    if (loadState.generalLoads && !Array.isArray(loadState.generalLoads)) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'General loads must be an array',
        'General load data is malformed.',
        { generalLoads: loadState.generalLoads },
        'ValidationService.validateCalculationInputs'
      );
    }

    if (loadState.hvacLoads && !Array.isArray(loadState.hvacLoads)) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'HVAC loads must be an array',
        'HVAC load data is malformed.',
        { hvacLoads: loadState.hvacLoads },
        'ValidationService.validateCalculationInputs'
      );
    }

    if (loadState.evseLoads && !Array.isArray(loadState.evseLoads)) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'EVSE loads must be an array',
        'EVSE load data is malformed.',
        { evseLoads: loadState.evseLoads },
        'ValidationService.validateCalculationInputs'
      );
    }

    if (loadState.solarBatteryLoads && !Array.isArray(loadState.solarBatteryLoads)) {
      throw ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Solar/Battery loads must be an array',
        'Solar/Battery load data is malformed.',
        { solarBatteryLoads: loadState.solarBatteryLoads },
        'ValidationService.validateCalculationInputs'
      );
    }
  }

  static validateLoad(load: any, rules: any): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    for (const field in rules) {
      const rule = rules[field];
      const value = load[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        messages.push({
          type: 'error',
          message: `${field} is required.`,
          code: 'REQUIRED_FIELD',
        });
      }

      if (rule.min !== undefined && value < rule.min) {
        messages.push({
          type: 'error',
          message: `${field} must be at least ${rule.min}.`,
          code: 'MIN_VALUE',
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        messages.push({
          type: 'error',
          message: `${field} cannot exceed ${rule.max}.`,
          code: 'MAX_VALUE',
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        messages.push({
          type: 'error',
          message: `${field} format is invalid.`,
          code: 'INVALID_FORMAT',
        });
      }
    }
    return messages;
  }

  static validateOverallSystem(
    loads: LoadState,
    calculationMethod: CalculationMethod,
    mainBreaker: number,
    totalDemand: number
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];

    // Example: Check if total demand exceeds main breaker rating
    if (totalDemand > mainBreaker * 240) { // Convert amps to VA for comparison
      messages.push({
        type: 'error',
        message: `Total calculated load (${(totalDemand / 240).toFixed(1)}A) exceeds main breaker rating (${mainBreaker}A).`,
        code: 'SERVICE_OVERLOAD',
      });
    }

    // Add more system-level validation rules here

    return messages;
  }

  static generalLoadValidationRules = {
    name: { required: true, minLength: 3 },
    quantity: { required: true, min: 0, max: 1000 },
    amps: { required: true, min: 0, max: 200 },
    volts: { required: true, enum: [120, 240, 277, 480] },
  };

  static hvacLoadValidationRules = {
    name: { required: true, minLength: 3 },
    quantity: { required: true, min: 0, max: 100 },
    amps: { required: true, min: 0, max: 500 },
    volts: { required: true, enum: [120, 240, 277, 480] },
    type: { required: true, enum: ['hvac', 'resistance_heat', 'motor', 'other'] },
  };

  static evseLoadValidationRules = {
    name: { required: true, minLength: 3 },
    quantity: { required: true, min: 0, max: 10 },
    amps: { required: true, min: 12, max: 80 },
    volts: { required: true, enum: [120, 240] },
    continuous: { required: true, type: 'boolean' },
  };

  static solarBatteryLoadValidationRules = {
    name: { required: true, minLength: 3 },
    kw: { required: true, min: 0, max: 1000 },
    inverterAmps: { required: true, min: 0, max: 1000 },
    volts: { required: true, enum: [120, 240, 277, 480] },
    breaker: { required: true, min: 0, max: 1000 },
    type: { required: true, enum: ['solar', 'battery'] },
    location: { required: true, enum: ['backfeed', 'supply_side', 'load_side'] },
  };
}
