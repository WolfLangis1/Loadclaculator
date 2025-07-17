import { useCallback } from 'react';

export const useLoadValidation = () => {
  const validateQuantity = useCallback((value: number): boolean => {
    return value >= 0 && value <= 1000; // Reasonable limits
  }, []);

  const validateVoltage = useCallback((value: number): boolean => {
    return value > 0 && value <= 1000; // Reasonable voltage range
  }, []);

  const validateAmps = useCallback((value: number): boolean => {
    return value >= 0 && value <= 10000; // Reasonable amperage range
  }, []);

  const validateWatts = useCallback((value: number): boolean => {
    return value >= 0 && value <= 1000000; // Up to 1MW
  }, []);

  const getValidationError = useCallback((field: string, value: number): string | null => {
    switch (field) {
      case 'quantity':
        return validateQuantity(value) ? null : 'Quantity must be between 0 and 1000';
      case 'voltage':
        return validateVoltage(value) ? null : 'Voltage must be between 1 and 1000V';
      case 'amperage':
      case 'amps':
        return validateAmps(value) ? null : 'Amperage must be between 0 and 10,000A';
      case 'watts':
      case 'wattage':
        return validateWatts(value) ? null : 'Wattage must be between 0 and 1,000,000W';
      default:
        return null;
    }
  }, [validateQuantity, validateVoltage, validateAmps, validateWatts]);

  return {
    validateQuantity,
    validateVoltage,
    validateAmps,
    validateWatts,
    getValidationError
  };
};
