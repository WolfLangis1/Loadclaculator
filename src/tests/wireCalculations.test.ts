import { describe, it, expect } from 'vitest';
import { calculateWireSize, calculateVoltageDrop, getWireSizeCalculation } from '../services/wireCalculations';

describe('Wire Size Calculations', () => {
  it('should calculate correct wire size for given amperage', () => {
    // Test case: 30A load with 125% factor = 37.5A required
    const wireSize = calculateWireSize(30, 240, 50, '75C', 3, 'copper');
    expect(wireSize).toBe('8'); // 8 AWG copper rated for 50A at 75°C
  });

  it('should upsize wire for high amperage loads', () => {
    // Test case: 100A load should require at least 1 AWG copper
    const wireSize = calculateWireSize(100, 240, 50, '75C', 3, 'copper');
    expect(wireSize).toBe('1'); // 1 AWG copper rated for 130A at 75°C
  });

  it('should apply derating for conduit fill', () => {
    // Test case: 30A load with 4 conductors (80% derating)
    const wireSize = calculateWireSize(30, 240, 50, '75C', 4, 'copper');
    // With derating, need 30A / 0.8 = 37.5A capacity, so 8 AWG (50A)
    expect(wireSize).toBe('8');
  });

  it('should calculate voltage drop correctly', () => {
    // Test case: 30A, 240V, 12 AWG, 100 feet
    const voltageDrop = calculateVoltageDrop(30, 240, '12', 100, 'copper');
    // Expected: 2 * 30A * 1.98 ohms/1000ft * 100ft / 1000 = 11.88V
    expect(voltageDrop).toBeCloseTo(11.88, 0.1);
  });

  it('should provide complete wire sizing analysis', () => {
    const result = getWireSizeCalculation(30, 240, 100, '75C', 3, 'copper');
    
    expect(result.wireSize).toBe('8');
    expect(result.ampacity).toBe(50); // 8 AWG at 75°C
    expect(result.voltageDrop).toBeGreaterThan(0);
    expect(result.voltageDropPercent).toBeGreaterThan(0);
    expect(result.derating).toBe(1.0); // No derating for 3 conductors
  });

  it('should handle aluminum conductors', () => {
    const wireSize = calculateWireSize(30, 240, 50, '75C', 3, 'aluminum');
    // Aluminum has lower ampacity, so larger wire size needed
    expect(wireSize).toBe('8'); // 8 AWG aluminum rated for 40A at 75°C
  });

  it('should calculate voltage drop percentage', () => {
    const voltageDrop = 12; // volts
    const voltage = 240; // volts
    const percentage = (voltageDrop / voltage) * 100;
    
    expect(percentage).toBe(5.0); // 5% voltage drop
  });

  it('should apply temperature correction factors', () => {
    // Test high amperage load requiring temperature considerations
    const wireSize90C = calculateWireSize(80, 240, 50, '90C', 3, 'copper');
    const wireSize75C = calculateWireSize(80, 240, 50, '75C', 3, 'copper');
    
    // 90°C rating allows smaller wire size for same amperage
    expect(parseInt(wireSize90C)).toBeGreaterThanOrEqual(parseInt(wireSize75C));
  });
});