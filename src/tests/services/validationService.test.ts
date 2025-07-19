import { describe, it, expect } from 'vitest';
import { validateProjectSettings, validateLoadData, validateNECCompliance } from '../../services/validationService';
import type { ProjectSettings, LoadState, ValidationResult } from '../../types';

describe('ValidationService', () => {
  const validProjectSettings: ProjectSettings = {
    address: '123 Main St, Anytown, CA 90210',
    squareFootage: 2500,
    calculationMethod: 'optional',
    mainBreakerAmps: 200,
    panelDetails: {
      manufacturer: 'Square D',
      model: 'QO',
      type: 'Main Panel',
      phases: 1,
      voltage: 240,
      busRating: 200,
      interruptingRating: 10000,
      availableSpaces: 40,
      usedSpaces: 0
    }
  };

  const validLoadState: LoadState = {
    generalLoads: [],
    hvacLoads: [],
    evseLoads: [],
    solarBatteryLoads: []
  };

  describe('Project Settings Validation', () => {
    it('should validate correct project settings', () => {
      const result = validateProjectSettings(validProjectSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative square footage', () => {
      const invalidSettings = { ...validProjectSettings, squareFootage: -100 };
      const result = validateProjectSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'squareFootage')).toBe(true);
    });

    it('should reject zero square footage', () => {
      const invalidSettings = { ...validProjectSettings, squareFootage: 0 };
      const result = validateProjectSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'squareFootage')).toBe(true);
    });

    it('should reject excessively large square footage', () => {
      const invalidSettings = { ...validProjectSettings, squareFootage: 1000000 };
      const result = validateProjectSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'squareFootage')).toBe(true);
    });

    it('should reject invalid main breaker amps', () => {
      const invalidSettings = { ...validProjectSettings, mainBreakerAmps: 50 };
      const result = validateProjectSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'mainBreakerAmps')).toBe(true);
    });

    it('should validate standard main breaker sizes', () => {
      const validSizes = [100, 150, 200, 225, 400, 800];
      validSizes.forEach(size => {
        const settings = { ...validProjectSettings, mainBreakerAmps: size };
        const result = validateProjectSettings(settings);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject empty address', () => {
      const invalidSettings = { ...validProjectSettings, address: '' };
      const result = validateProjectSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'address')).toBe(true);
    });

    it('should reject invalid calculation method', () => {
      const invalidSettings = { ...validProjectSettings, calculationMethod: 'invalid' as any };
      const result = validateProjectSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'calculationMethod')).toBe(true);
    });
  });

  describe('Load Data Validation', () => {
    it('should validate empty load state', () => {
      const result = validateLoadData(validLoadState);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject negative load quantities', () => {
      const invalidLoadState: LoadState = {
        ...validLoadState,
        generalLoads: [{
          id: 1,
          name: 'Test Load',
          type: 'general',
          location: 'kitchen',
          watts: 1000,
          quantity: -1,
          total: -1000,
          critical: false
        }]
      };
      
      const result = validateLoadData(invalidLoadState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'quantity')).toBe(true);
    });

    it('should reject negative wattage values', () => {
      const invalidLoadState: LoadState = {
        ...validLoadState,
        generalLoads: [{
          id: 1,
          name: 'Test Load',
          type: 'general',
          location: 'kitchen',
          watts: -1000,
          quantity: 1,
          total: -1000,
          critical: false
        }]
      };
      
      const result = validateLoadData(invalidLoadState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'watts')).toBe(true);
    });

    it('should validate total matches watts * quantity', () => {
      const invalidLoadState: LoadState = {
        ...validLoadState,
        generalLoads: [{
          id: 1,
          name: 'Test Load',
          type: 'general',
          location: 'kitchen',
          watts: 1000,
          quantity: 2,
          total: 1500, // Should be 2000
          critical: false
        }]
      };
      
      const result = validateLoadData(invalidLoadState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'total')).toBe(true);
    });

    it('should warn about excessive EVSE loads without EMS', () => {
      const loadStateWithEVSE: LoadState = {
        ...validLoadState,
        evseLoads: [
          {
            id: 1,
            name: 'EVSE 1',
            type: 'evse',
            location: 'garage',
            amps: 48,
            voltage: 240,
            quantity: 2,
            total: 23040,
            critical: false,
            emsControlled: false
          }
        ]
      };
      
      const result = validateLoadData(loadStateWithEVSE);
      expect(result.warnings.some(w => w.code === 'NEC 625.42')).toBe(true);
    });

    it('should validate EVSE EMS requirements', () => {
      const loadStateWithEMS: LoadState = {
        ...validLoadState,
        evseLoads: [
          {
            id: 1,
            name: 'EVSE 1',
            type: 'evse',
            location: 'garage',
            amps: 48,
            voltage: 240,
            quantity: 3,
            total: 34560,
            critical: false,
            emsControlled: true
          }
        ]
      };
      
      const result = validateLoadData(loadStateWithEMS);
      expect(result.warnings.some(w => w.code === 'NEC 625.42')).toBe(false);
    });
  });

  describe('NEC Compliance Validation', () => {
    it('should validate 80% service capacity rule', () => {
      const highLoadState: LoadState = {
        ...validLoadState,
        generalLoads: [{
          id: 1,
          name: 'High Load',
          type: 'general',
          location: 'workshop',
          watts: 40000, // 167A at 240V
          quantity: 1,
          total: 40000,
          critical: false
        }]
      };
      
      const result = validateNECCompliance(highLoadState, validProjectSettings);
      // 167A > 160A (80% of 200A) should trigger warning
      expect(result.warnings.some(w => w.code === 'NEC 220.83')).toBe(true);
    });

    it('should validate solar 120% interconnection rule', () => {
      const solarLoadState: LoadState = {
        ...validLoadState,
        solarBatteryLoads: [{
          id: 1,
          name: 'Solar Array',
          type: 'solar',
          location: 'backfeed',
          kw: 25,
          inverterAmps: 104.2, // 25kW / 240V
          efficiency: 96,
          quantity: 1,
          total: 25000,
          critical: false
        }]
      };
      
      const result = validateNECCompliance(solarLoadState, validProjectSettings);
      // 104.2A > 40A (120% of 200A - 200A) should trigger error
      expect(result.errors.some(e => e.code === 'NEC 705.12(B)(3)(2)')).toBe(true);
    });

    it('should validate continuous load factors', () => {
      const continuousLoadState: LoadState = {
        ...validLoadState,
        evseLoads: [{
          id: 1,
          name: 'EVSE',
          type: 'evse',
          location: 'garage',
          amps: 40,
          voltage: 240,
          quantity: 1,
          total: 9600,
          critical: false,
          emsControlled: false
        }]
      };
      
      const result = validateNECCompliance(continuousLoadState, validProjectSettings);
      // EVSE loads should be validated at 125% per NEC 625.17
      expect(result.appliedFactors.evse).toBe(1.25);
    });

    it('should validate motor load factors', () => {
      const motorLoadState: LoadState = {
        ...validLoadState,
        hvacLoads: [{
          id: 1,
          name: 'Motor',
          type: 'motor',
          location: 'basement',
          watts: 5000,
          quantity: 1,
          total: 5000,
          critical: false,
          isLargestMotor: true
        }]
      };
      
      const result = validateNECCompliance(motorLoadState, validProjectSettings);
      // Largest motor should have 125% factor per NEC 430.25
      expect(result.appliedFactors.largestMotor).toBe(1.25);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => validateProjectSettings(null as any)).not.toThrow();
      expect(() => validateLoadData(null as any)).not.toThrow();
      expect(() => validateNECCompliance(null as any, null as any)).not.toThrow();
    });

    it('should validate extreme values', () => {
      const extremeSettings = {
        ...validProjectSettings,
        squareFootage: Number.MAX_SAFE_INTEGER
      };
      
      const result = validateProjectSettings(extremeSettings);
      expect(result.isValid).toBe(false);
    });

    it('should handle missing required fields', () => {
      const incompleteSettings = {
        address: '123 Main St',
        // Missing required fields
      } as ProjectSettings;
      
      const result = validateProjectSettings(incompleteSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate field lengths and formats', () => {
      const longNameSettings = {
        ...validProjectSettings,
        address: 'x'.repeat(1000) // Excessively long address
      };
      
      const result = validateProjectSettings(longNameSettings);
      expect(result.errors.some(e => e.field === 'address')).toBe(true);
    });
  });
});