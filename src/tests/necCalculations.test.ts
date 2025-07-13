import { describe, it, expect } from 'vitest';
import { calculateLoadDemand } from '../services/necCalculations';
import { LOAD_TEMPLATES } from '../constants';
import type { LoadState, CalculationMethod, PanelDetails, ActualDemandData } from '../types';

const createTestLoadState = (): LoadState => ({
  generalLoads: [...LOAD_TEMPLATES.GENERAL],
  hvacLoads: [...LOAD_TEMPLATES.HVAC],
  evseLoads: [...LOAD_TEMPLATES.EVSE],
  solarBatteryLoads: [...LOAD_TEMPLATES.SOLAR_BATTERY]
});

const testPanelDetails: PanelDetails = {
  manufacturer: 'Square D',
  model: 'QO',
  busRating: 200,
  mainBreakerRating: 200,
  spaces: 40,
  phase: 1
};

const testActualDemandData: ActualDemandData = {
  enabled: false,
  month1: 0, month2: 0, month3: 0, month4: 0,
  month5: 0, month6: 0, month7: 0, month8: 0,
  month9: 0, month10: 0, month11: 0, month12: 0,
  averageDemand: 0
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

  it('should apply continuous load factor to EVSE', () => {
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

    // EVSE demand should be 125% of nameplate (continuous load)
    expect(result.evseDemand).toBe(11520 * 1.25);
  });

  it('should check 120% rule for solar interconnection', () => {
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
      testPanelDetails,
      testActualDemandData,
      false,
      0
    );

    expect(result.interconnectionCompliant).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toBe('NEC 705.12(B)(3)(2)');
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