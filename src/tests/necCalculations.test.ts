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

    // EVSE demand should be 100% of nameplate per NEC 625.42(B)
    expect(result.evseDemand).toBe(11520);
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