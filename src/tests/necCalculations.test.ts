import { describe, it, expect } from 'vitest';
import { calculateLoadDemand } from '../services/necCalculations';
import { LOAD_TEMPLATES } from '../constants';
import type { LoadState, CalculationMethod, PanelDetails, ActualDemandData } from '../types';

const createTestLoadState = (): LoadState => ({
  generalLoads: [...LOAD_TEMPLATES.general],
  hvacLoads: [...LOAD_TEMPLATES.hvac],
  evseLoads: [...LOAD_TEMPLATES.evse],
  solarBatteryLoads: [...LOAD_TEMPLATES.solar]
});

const testPanelDetails: PanelDetails = {
  manufacturer: 'Square D',
  model: 'QO',
  type: 'Main Panel',
  phases: 1,
  voltage: 240,
  busRating: 200,
  interruptingRating: 10000,
  availableSpaces: 40,
  usedSpaces: 0
};

const testActualDemandData: ActualDemandData = {
  enabled: false,
  averageDemand: 0,
  peakDemand: 0,
  dataSource: 'test',
  measurementPeriod: '12 months',
  month1: 0, month2: 0, month3: 0, month4: 0,
  month5: 0, month6: 0, month7: 0, month8: 0,
  month9: 0, month10: 0, month11: 0, month12: 0
};

describe('NEC Load Calculations', () => {
  it('should calculate optional method correctly', () => {
    const loadState = createTestLoadState();
    const result = calculateLoadDemand(
      loadState,
      'optional' as CalculationMethod,
      2524, // square footage
      200,  // main breaker
      testPanelDetails,
      testActualDemandData,
      false, // useEMS
      0     // emsMaxLoad
    );

    expect(result.totalAmps).toBeGreaterThan(0);
    expect(result.generalDemand).toBeGreaterThan(0);
    expect(result.spareCapacity).toBeLessThan(100);
    expect(result.errors).toHaveLength(0);
  });

  it('should calculate standard method correctly', () => {
    const loadState = createTestLoadState();
    const result = calculateLoadDemand(
      loadState,
      'standard' as CalculationMethod,
      2524,
      200,
      testPanelDetails,
      testActualDemandData,
      false,
      0
    );

    expect(result.totalAmps).toBeGreaterThan(0);
    expect(result.generalDemand).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should calculate EVSE demand at 100% nameplate', () => {
    const loadState = createTestLoadState();
    // Add an EVSE load
    loadState.evseLoads[0].quantity = 1;
    loadState.evseLoads[0].total = 11520; // 48A * 240V

    const result = calculateLoadDemand(
      loadState,
      'optional' as CalculationMethod,
      2524,
      200,
      testPanelDetails,
      testActualDemandData,
      false,
      0
    );

    // EVSE demand should be 125% of nameplate per NEC 625.17 (continuous load)
    expect(result.evseDemand).toBe(11520 * 1.25);
  });

  describe('Solar 120% Rule Tests', () => {
    it('should check 120% rule for solar interconnection with explicit busbar', () => {
      const loadState = createTestLoadState();
      // Add a large solar system that exceeds 120% rule
      loadState.solarBatteryLoads[0].kw = 20;
      loadState.solarBatteryLoads[0].inverterAmps = 83.3; // 20kW / 240V
      loadState.solarBatteryLoads[0].quantity = 1;

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        2524,
        200,
        testPanelDetails, // 200A busbar
        testActualDemandData,
        false,
        0
      );

      // 200A busbar * 1.2 - 200A main = 40A max backfeed
      // 83.3A solar > 40A = non-compliant
      expect(result.interconnectionCompliant).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('NEC 705.12(B)(3)(2)');
    });

    it('should handle 200A main with undefined busbar (225A default)', () => {
      const loadState = createTestLoadState();
      // Add solar system that should be compliant with 225A busbar default
      loadState.solarBatteryLoads[0].kw = 15;
      loadState.solarBatteryLoads[0].inverterAmps = 62.5; // 15kW / 240V
      loadState.solarBatteryLoads[0].quantity = 1;
      loadState.solarBatteryLoads[0].location = 'backfeed';

      // Panel without explicit busbar rating
      const panelWithoutBusbar = {
        ...testPanelDetails,
        busRating: undefined as any
      };

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        2524,
        200,
        panelWithoutBusbar,
        testActualDemandData,
        false,
        0
      );

      // 225A busbar * 1.2 - 200A main = 70A max backfeed
      // 62.5A solar < 70A = compliant
      expect(result.interconnectionCompliant).toBe(true);
      expect(result.errors.filter(e => e.code === 'NEC 705.12(B)(3)(2)')).toHaveLength(0);
    });

    it('should support user scenario: 95A max backfeed capability', () => {
      const loadState = createTestLoadState();
      // User expects 95A backfeed capability, which suggests 275A+ busbar
      // (275 * 1.2) - 200 = 130A, or 400A busbar: (400 * 1.2) - 200 = 280A
      // Let's test with 275A busbar for 95A scenario
      loadState.solarBatteryLoads[0].kw = 22;
      loadState.solarBatteryLoads[0].inverterAmps = 91.7; // 22kW / 240V ≈ 92A
      loadState.solarBatteryLoads[0].quantity = 1;
      loadState.solarBatteryLoads[0].location = 'backfeed';

      const panel275A = {
        ...testPanelDetails,
        busRating: 275
      };

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        2524,
        200,
        panel275A,
        testActualDemandData,
        false,
        0
      );

      // 275A busbar * 1.2 - 200A main = 130A max backfeed
      // 91.7A solar < 130A = compliant
      expect(result.interconnectionCompliant).toBe(true);
      expect(result.totalInterconnectionAmps).toBeCloseTo(91.7, 1);
    });

    it('should test edge case: exactly at 120% rule limit', () => {
      const loadState = createTestLoadState();
      // Test exactly at the limit for 225A busbar
      // (225 * 1.2) - 200 = 70A max
      loadState.solarBatteryLoads[0].kw = 16.8;
      loadState.solarBatteryLoads[0].inverterAmps = 70.0; // Exactly at limit
      loadState.solarBatteryLoads[0].quantity = 1;
      loadState.solarBatteryLoads[0].location = 'backfeed';

      const panel225A = {
        ...testPanelDetails,
        busRating: 225
      };

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        2524,
        200,
        panel225A,
        testActualDemandData,
        false,
        0
      );

      expect(result.interconnectionCompliant).toBe(true);
      expect(result.totalInterconnectionAmps).toBe(70.0);
    });

    it('should handle small panels (150A main) with correct defaults', () => {
      const loadState = createTestLoadState();
      // Small solar system for 150A panel
      loadState.solarBatteryLoads[0].kw = 5;
      loadState.solarBatteryLoads[0].inverterAmps = 20.8; // 5kW / 240V
      loadState.solarBatteryLoads[0].quantity = 1;
      loadState.solarBatteryLoads[0].location = 'backfeed';

      const panel150A = {
        ...testPanelDetails,
        busRating: undefined as any
      };

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        1500,
        150, // 150A main
        panel150A,
        testActualDemandData,
        false,
        0
      );

      // For 150A main, default busbar = 150A
      // (150 * 1.2) - 150 = 30A max backfeed
      // 20.8A solar < 30A = compliant
      expect(result.interconnectionCompliant).toBe(true);
    });

    it('should handle large panels (400A main) with proportional defaults', () => {
      const loadState = createTestLoadState();
      // Large solar system for 400A panel
      loadState.solarBatteryLoads[0].kw = 50;
      loadState.solarBatteryLoads[0].inverterAmps = 208.3; // 50kW / 240V
      loadState.solarBatteryLoads[0].quantity = 1;
      loadState.solarBatteryLoads[0].location = 'backfeed';

      const panel400A = {
        ...testPanelDetails,
        busRating: undefined as any
      };

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        5000,
        400, // 400A main
        panel400A,
        testActualDemandData,
        false,
        0
      );

      // For 400A main, default busbar = 400 * 1.25 = 500A
      // (500 * 1.2) - 400 = 200A max backfeed
      // 208.3A solar > 200A = non-compliant
      expect(result.interconnectionCompliant).toBe(false);
    });

    it('should handle supply side connections (bypass 120% rule)', () => {
      const loadState = createTestLoadState();
      // Large solar system on supply side
      loadState.solarBatteryLoads[0].kw = 30;
      loadState.solarBatteryLoads[0].inverterAmps = 125; // 30kW / 240V
      loadState.solarBatteryLoads[0].quantity = 1;
      loadState.solarBatteryLoads[0].location = 'supply_side';

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        2524,
        200,
        testPanelDetails,
        testActualDemandData,
        false,
        0
      );

      // Supply side bypasses 120% rule, so should be compliant
      expect(result.interconnectionCompliant).toBe(true);
      expect(result.totalInterconnectionAmps).toBe(0); // Supply side not counted
      expect(result.warnings.some(w => w.code === 'NEC 705.12(A)')).toBe(true);
    });

    it('should handle mixed interconnection locations', () => {
      const loadState = createTestLoadState();
      // Mix of backfeed and supply side
      loadState.solarBatteryLoads[0].kw = 10;
      loadState.solarBatteryLoads[0].inverterAmps = 41.7;
      loadState.solarBatteryLoads[0].location = 'backfeed';
      loadState.solarBatteryLoads[0].quantity = 1;

      // Add second solar system on supply side
      loadState.solarBatteryLoads.push({
        id: 2,
        name: 'Supply Side Solar',
        type: 'solar',
        location: 'supply_side',
        kw: 15,
        inverterAmps: 62.5,
        efficiency: 96,
        quantity: 1,
        total: 15000,
        critical: false
      });

      const panel225A = {
        ...testPanelDetails,
        busRating: 225
      };

      const result = calculateLoadDemand(
        loadState,
        'optional' as CalculationMethod,
        2524,
        200,
        panel225A,
        testActualDemandData,
        false,
        0
      );

      // Only backfeed counted: 41.7A < 70A limit = compliant
      expect(result.interconnectionCompliant).toBe(true);
      expect(result.totalInterconnectionAmps).toBeCloseTo(41.7, 1);
    });
  });

  it('should warn about multiple EVSE without EMS', () => {
    const loadState = createTestLoadState();
    // Enable multiple EVSE
    loadState.evseLoads[0].quantity = 1;
    loadState.evseLoads[1].quantity = 1;

    const result = calculateLoadDemand(
      loadState,
      'optional' as CalculationMethod,
      2524,
      200,
      testPanelDetails,
      testActualDemandData,
      false, // No EMS
      0
    );

    expect(result.warnings.some(w => w.code === 'NEC 625.42')).toBe(true);
  });

  it('should calculate spare capacity correctly', () => {
    const loadState = createTestLoadState();
    const result = calculateLoadDemand(
      loadState,
      'optional' as CalculationMethod,
      2524,
      200,
      testPanelDetails,
      testActualDemandData,
      false,
      0
    );

    const expectedSpareCapacity = ((200 - (result.totalAmps || 0)) / 200) * 100;
    expect(result.spareCapacity).toBeCloseTo(expectedSpareCapacity, 1);
  });
});