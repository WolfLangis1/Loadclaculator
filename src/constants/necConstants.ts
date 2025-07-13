export const NEC_CONSTANTS = {
  GENERAL_LIGHTING_VA_PER_SQFT: 3,
  SMALL_APPLIANCE_VA: 1500,
  LAUNDRY_VA: 1500,
  BATHROOM_VA: 1500,
  DRYER_MIN_VA: 5000,
  EVSE_MIN_VA: 7200,
  CONTINUOUS_LOAD_FACTOR: 1.25,
  SERVICE_SIZES: [100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600, 800, 1000, 1200],
  DEMAND_FACTORS: {
    OPTIONAL_METHOD: {
      FIRST_10K: 1.0,
      REMAINDER: 0.4
    },
    STANDARD_METHOD: {
      FIRST_3K: 1.0,
      NEXT_117K: 0.35,
      ABOVE_120K: 0.25
    },
    EXISTING_DWELLING: {
      FIRST_8K: 1.0,
      REMAINDER: 0.4
    },
    APPLIANCES: {
      3: 1.0,
      4: 0.75,
      5: 0.75,
      DEFAULT: 0.75
    }
  },
  WIRE_AMPACITY: {
    '14': { copper60C: 15, copper75C: 20, copper90C: 25, aluminum: 15 },
    '12': { copper60C: 20, copper75C: 25, copper90C: 30, aluminum: 20 },
    '10': { copper60C: 30, copper75C: 35, copper90C: 40, aluminum: 30 },
    '8': { copper60C: 40, copper75C: 50, copper90C: 55, aluminum: 40 },
    '6': { copper60C: 55, copper75C: 65, copper90C: 75, aluminum: 50 },
    '4': { copper60C: 70, copper75C: 85, copper90C: 95, aluminum: 65 },
    '3': { copper60C: 85, copper75C: 100, copper90C: 110, aluminum: 75 },
    '2': { copper60C: 95, copper75C: 115, copper90C: 130, aluminum: 90 },
    '1': { copper60C: 110, copper75C: 130, copper90C: 150, aluminum: 100 },
    '1/0': { copper60C: 125, copper75C: 150, copper90C: 170, aluminum: 120 },
    '2/0': { copper60C: 145, copper75C: 175, copper90C: 195, aluminum: 135 },
    '3/0': { copper60C: 165, copper75C: 200, copper90C: 225, aluminum: 155 },
    '4/0': { copper60C: 195, copper75C: 230, copper90C: 260, aluminum: 180 },
    '250': { copper60C: 215, copper75C: 255, copper90C: 290, aluminum: 205 },
    '300': { copper60C: 240, copper75C: 285, copper90C: 320, aluminum: 230 },
    '350': { copper60C: 260, copper75C: 310, copper90C: 350, aluminum: 250 },
    '400': { copper60C: 280, copper75C: 335, copper90C: 380, aluminum: 270 },
    '500': { copper60C: 320, copper75C: 380, copper90C: 430, aluminum: 310 }
  },
  TEMPERATURE_CORRECTION: {
    '86-95': 0.96,
    '96-104': 0.91,
    '105-113': 0.87,
    '114-122': 0.82,
    '123-131': 0.76,
    '132-140': 0.71
  },
  VOLTAGE_DROP: {
    BRANCH_CIRCUIT_MAX: 3,
    FEEDER_MAX: 2,
    COMBINED_MAX: 5
  }
} as const;

export const WIRE_RESISTANCE = {
  copper: {
    '14': 3.14, '12': 1.98, '10': 1.24, '8': 0.778, '6': 0.491,
    '4': 0.308, '3': 0.245, '2': 0.194, '1': 0.154, '1/0': 0.122,
    '2/0': 0.0967, '3/0': 0.0766, '4/0': 0.0608, '250': 0.0515,
    '300': 0.0429, '350': 0.0367, '400': 0.0321, '500': 0.0258
  },
  aluminum: {
    '12': 3.25, '10': 2.04, '8': 1.28, '6': 0.808, '4': 0.508,
    '3': 0.403, '2': 0.319, '1': 0.253, '1/0': 0.201, '2/0': 0.159,
    '3/0': 0.126, '4/0': 0.100, '250': 0.0847, '300': 0.0706,
    '350': 0.0605, '400': 0.0529, '500': 0.0424
  }
} as const;