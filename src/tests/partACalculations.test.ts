import { calculateLoadDemand } from '../services/necCalculations';
import type { LoadState, CalculationMethod, ActualDemandData, PanelDetails } from '../types';

// Basic test setup
const createEmptyLoadState = (): LoadState => ({
  generalLoads: [],
  hvacLoads: [],
  evseLoads: [],
  solarBatteryLoads: []
});

const basicPanelDetails: PanelDetails = {
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

const basicActualDemandData: ActualDemandData = {
  enabled: false,
  averageDemand: 0,
  peakDemand: 0,
  dataSource: 'test',
  measurementPeriod: '12 months',
  month1: 0,
  month2: 0,
  month3: 0,
  month4: 0,
  month5: 0,
  month6: 0,
  month7: 0,
  month8: 0,
  month9: 0,
  month10: 0,
  month11: 0,
  month12: 0
};

/**
 * Manual test runner for Part A calculations
 * This will log results and identify calculation issues
 */
export const runPartATests = () => {
  console.log('🧪 Running Part A General Loads Calculation Tests...\n');

  // Test 1: Basic Optional Method
  console.log('📋 Test 1: Optional Method - 1500 sq ft, no appliances');
  const test1 = calculateLoadDemand(
    createEmptyLoadState(),
    'optional' as CalculationMethod,
    1500,
    200,
    basicPanelDetails,
    basicActualDemandData
  );
  
  const test1Expected = {
    generalLoadVA: 1500 * 3 + 3000 + 1500 + 1500, // 10,500 VA
    generalDemand: 10000 + (500 * 0.4) // 10,200 VA (first 10k @ 100%, remainder @ 40%)
  };
  
  console.log(`  Base General Load VA: ${test1.generalLoadVA} (expected: ${test1Expected.generalLoadVA})`);
  console.log(`  General Demand: ${test1.generalDemand} (expected: ${test1Expected.generalDemand})`);
  console.log(`  ✅ ${test1.generalLoadVA === test1Expected.generalLoadVA ? 'PASS' : 'FAIL'} - Base VA calculation`);
  console.log(`  ✅ ${test1.generalDemand === test1Expected.generalDemand ? 'PASS' : 'FAIL'} - Demand factor calculation\n`);

  // Test 2: Optional Method with Appliances
  console.log('📋 Test 2: Optional Method - 2000 sq ft with appliances');
  const loadStateWithAppliances: LoadState = {
    generalLoads: [
      { id: 1, name: 'Electric Range', quantity: 1, amps: 40, volts: 240, va: 9600, total: 9600, category: 'kitchen', critical: false, circuit: '' },
      { id: 2, name: 'Dishwasher', quantity: 1, amps: 12, volts: 120, va: 1440, total: 1440, category: 'kitchen', critical: false, circuit: '' }
    ],
    hvacLoads: [],
    evseLoads: [],
    solarBatteryLoads: []
  };

  const test2 = calculateLoadDemand(
    loadStateWithAppliances,
    'optional' as CalculationMethod,
    2000,
    200,
    basicPanelDetails,
    basicActualDemandData
  );

  const test2Expected = {
    generalLoadVA: 2000 * 3 + 3000 + 1500 + 1500, // 12,000 VA
    applianceDemand: 9600 + 1440, // 11,040 VA
    totalForDemand: 12000 + 11040, // 23,040 VA
    generalDemand: 10000 + ((23040 - 10000) * 0.4) // 10,000 + 5,216 = 15,216 VA
  };

  console.log(`  Base General Load VA: ${test2.generalLoadVA} (expected: ${test2Expected.generalLoadVA})`);
  console.log(`  Appliance Demand: ${test2.applianceDemand} (expected: ${test2Expected.applianceDemand})`);
  console.log(`  General Demand: ${test2.generalDemand} (expected: ${test2Expected.generalDemand})`);
  console.log(`  Appliances Included in General: ${test2.appliancesIncludedInGeneral}`);
  console.log(`  ✅ ${test2.generalDemand === test2Expected.generalDemand ? 'PASS' : 'FAIL'} - Optional method with appliances\n`);

  // Test 3: Standard Method
  console.log('📋 Test 3: Standard Method - 2000 sq ft with appliances');
  const test3 = calculateLoadDemand(
    loadStateWithAppliances,
    'standard' as CalculationMethod,
    2000,
    200,
    basicPanelDetails,
    basicActualDemandData
  );

  const test3Expected = {
    generalLoadVA: 12000,
    generalDemand: 3000 + ((12000 - 3000) * 0.35), // 3,000 + 3,150 = 6,150 VA
    applianceDemand: 11040 // Separate in standard method
  };

  console.log(`  General Demand: ${test3.generalDemand} (expected: ${test3Expected.generalDemand})`);
  console.log(`  Appliance Demand: ${test3.applianceDemand} (expected: ${test3Expected.applianceDemand})`);
  console.log(`  Appliances Included in General: ${test3.appliancesIncludedInGeneral}`);
  console.log(`  ✅ ${test3.generalDemand === test3Expected.generalDemand ? 'PASS' : 'FAIL'} - Standard method general demand`);
  console.log(`  ✅ ${test3.applianceDemand === test3Expected.applianceDemand ? 'PASS' : 'FAIL'} - Standard method appliance demand\n`);

  // Test 4: SimpleSwitch Impact
  console.log('📋 Test 4: SimpleSwitch Impact on Part A');
  const test4Without = calculateLoadDemand(
    loadStateWithAppliances,
    'optional' as CalculationMethod,
    2000,
    200,
    basicPanelDetails,
    basicActualDemandData
  );

  const test4With = calculateLoadDemand(
    loadStateWithAppliances,
    'optional' as CalculationMethod,
    2000,
    200,
    basicPanelDetails,
    basicActualDemandData,
    false, // useEMS
    0, // emsMaxLoad
    'simpleswitch', // loadManagementType
    0, // loadManagementMaxLoad
    'branch_sharing', // simpleSwitchMode
    { type: 'general', id: 1, name: 'Electric Range', amps: 40 }, // Load A
    { type: 'general', id: 2, name: 'Dishwasher', amps: 12 } // Load B
  );

  console.log(`  Without SimpleSwitch - General Demand: ${test4Without.generalDemand}`);
  console.log(`  With SimpleSwitch - General Demand: ${test4With.generalDemand}`);
  console.log(`  Demand Reduction: ${test4Without.generalDemand - test4With.generalDemand} VA`);
  console.log(`  ✅ ${test4With.generalDemand < test4Without.generalDemand ? 'PASS' : 'FAIL'} - SimpleSwitch should reduce demand\n`);

  // Test 5: Edge case - Very large house
  console.log('📋 Test 5: Large house (5000 sq ft) with many appliances');
  const largeLoadState: LoadState = {
    generalLoads: [
      { id: 1, name: 'Electric Range', quantity: 1, amps: 50, volts: 240, va: 12000, total: 12000, category: 'kitchen', critical: false, circuit: '' },
      { id: 2, name: 'Dishwasher', quantity: 1, amps: 12, volts: 120, va: 1440, total: 1440, category: 'kitchen', critical: false, circuit: '' },
      { id: 3, name: 'Dryer', quantity: 1, amps: 30, volts: 240, va: 7200, total: 7200, category: 'laundry', critical: false, circuit: '' },
      { id: 4, name: 'Water Heater', quantity: 1, amps: 25, volts: 240, va: 6000, total: 6000, category: 'other', critical: false, circuit: '' },
      { id: 5, name: 'Pool Pump', quantity: 1, amps: 15, volts: 240, va: 3600, total: 3600, category: 'other', critical: false, circuit: '' }
    ],
    hvacLoads: [],
    evseLoads: [],
    solarBatteryLoads: []
  };

  const test5 = calculateLoadDemand(
    largeLoadState,
    'optional' as CalculationMethod,
    5000,
    400,
    { ...basicPanelDetails, busRating: 400 },
    basicActualDemandData
  );

  const test5Expected = {
    generalLoadVA: 5000 * 3 + 6000, // 21,000 VA
    applianceDemand: 12000 + 1440 + 7200 + 6000 + 3600, // 30,240 VA
    totalForDemand: 21000 + 30240, // 51,240 VA
    generalDemand: 10000 + ((51240 - 10000) * 0.4) // 10,000 + 16,496 = 26,496 VA
  };

  console.log(`  Base General Load VA: ${test5.generalLoadVA} (expected: ${test5Expected.generalLoadVA})`);
  console.log(`  Total appliances: ${test5.applianceDemand} (expected: ${test5Expected.applianceDemand})`);
  console.log(`  General Demand: ${test5.generalDemand} (expected: ${test5Expected.generalDemand})`);
  console.log(`  ✅ ${test5.generalDemand === test5Expected.generalDemand ? 'PASS' : 'FAIL'} - Large house calculation\n`);

  // Summary
  // Summary
  console.log('🎯 Test Summary:');
  console.log('If any tests show FAIL, there are calculation errors that need to be fixed.');
  console.log('Check the actual vs expected values to identify the specific issues.\n');

  // Return results for debugging
  const results = { test1, test2, test3, test4Without, test4With, test5 };
  
  // Store in window for browser debugging
  if (typeof window !== 'undefined') {
    (window as any).partATestResults = results;
    console.log('💾 Test results stored in window.partATestResults for debugging');
  }
  
  return results;
};

// Export for manual browser testing
if (typeof window !== 'undefined') {
  (window as any).runPartATests = runPartATests;
}