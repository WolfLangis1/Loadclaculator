// Simple test to validate Part A calculations manually
// Run this in Node.js to check calculations

const calculateBasicPartA = (squareFootage, applianceVA, method = 'optional') => {
  // Base general loads per NEC 220.52
  const lightingVA = squareFootage * 3;
  const smallApplianceVA = 3000; // 2 x 1500 VA circuits
  const laundryVA = 1500;
  const bathroomVA = 1500;
  
  const baseGeneralVA = lightingVA + smallApplianceVA + laundryVA + bathroomVA;
  console.log(`Base General Load VA: ${baseGeneralVA}`);
  console.log(`  - Lighting: ${lightingVA} VA (${squareFootage} sq ft × 3 VA/sq ft)`);
  console.log(`  - Small Appliance: ${smallApplianceVA} VA`);
  console.log(`  - Laundry: ${laundryVA} VA`);
  console.log(`  - Bathroom: ${bathroomVA} VA`);
  
  if (method === 'optional') {
    // NEC 220.83 Optional Method
    const totalGeneralAndAppliances = baseGeneralVA + applianceVA;
    console.log(`Total General + Appliances: ${totalGeneralAndAppliances} VA`);
    
    const first10kVA = Math.min(totalGeneralAndAppliances, 10000);
    const remainder = Math.max(totalGeneralAndAppliances - 10000, 0);
    
    console.log(`First 10,000 VA @ 100%: ${first10kVA} VA`);
    console.log(`Remainder ${remainder} VA @ 40%: ${remainder * 0.4} VA`);
    
    const generalDemand = first10kVA + (remainder * 0.4);
    console.log(`Part A Demand: ${generalDemand} VA`);
    
    return {
      baseGeneralVA,
      applianceVA,
      totalForDemand: totalGeneralAndAppliances,
      generalDemand,
      method: 'optional'
    };
  } else if (method === 'standard') {
    // NEC 220.42 Standard Method
    const first3kVA = Math.min(baseGeneralVA, 3000);
    const next117kVA = Math.min(Math.max(baseGeneralVA - 3000, 0), 117000);
    const above120kVA = Math.max(baseGeneralVA - 120000, 0);
    
    console.log(`First 3,000 VA @ 100%: ${first3kVA} VA`);
    console.log(`Next ${Math.min(baseGeneralVA - 3000, 117000)} VA @ 35%: ${next117kVA * 0.35} VA`);
    if (above120kVA > 0) {
      console.log(`Above 120,000 VA @ 25%: ${above120kVA * 0.25} VA`);
    }
    
    const generalDemand = first3kVA + (next117kVA * 0.35) + (above120kVA * 0.25);
    console.log(`General Demand: ${generalDemand} VA`);
    console.log(`Appliance Demand (separate): ${applianceVA} VA`);
    
    return {
      baseGeneralVA,
      applianceVA,
      generalDemand,
      method: 'standard'
    };
  }
};

console.log('=== Part A Calculation Manual Tests ===\n');

console.log('Test 1: 1500 sq ft, no appliances, optional method');
calculateBasicPartA(1500, 0, 'optional');

console.log('\n' + '='.repeat(50) + '\n');

console.log('Test 2: 2000 sq ft, 11040 VA appliances, optional method');
calculateBasicPartA(2000, 11040, 'optional');

console.log('\n' + '='.repeat(50) + '\n');

console.log('Test 3: 2000 sq ft, 11040 VA appliances, standard method');
calculateBasicPartA(2000, 11040, 'standard');

console.log('\n' + '='.repeat(50) + '\n');

console.log('Test 4: Large house - 5000 sq ft, 30240 VA appliances, optional method');
calculateBasicPartA(5000, 30240, 'optional');