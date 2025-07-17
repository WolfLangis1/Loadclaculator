export interface Definition {
  term: string;
  definition: string;
  details?: string;
  necReference?: string;
  category: 'electrical' | 'solar' | 'calculation' | 'safety' | 'equipment';
}

export const ELECTRICAL_DEFINITIONS: Record<string, Definition> = {
  // Connection Types
  'backfeed': {
    term: 'Backfeed Connection',
    definition: 'Solar inverter connected through a breaker in the main electrical panel, feeding power backwards through the busbar.',
    details: 'Most common residential solar connection. Power flows from solar breaker → busbar → main breaker and loads. Requires tie-down kit to prevent breaker removal. Subject to NEC 705.12 120% rule.',
    necReference: 'NEC 705.12(B)',
    category: 'solar'
  },
  'load_side': {
    term: 'Load Side Connection',
    definition: 'Solar system connected directly to the electrical system after (downstream of) the main breaker.',
    details: 'Connection point is after main breaker but before branch circuits. Often uses load center taps or production meter combos. More complex than backfeed but allows production metering. Subject to NEC 705.12 120% rule.',
    necReference: 'NEC 705.12(B)',
    category: 'solar'
  },
  'supply_side': {
    term: 'Supply Side Connection',
    definition: 'Solar system connected before (upstream of) the main service disconnect.',
    details: 'Connects between utility meter and main breaker. Not subject to 120% rule limitations but requires utility coordination and approval. Often used for larger systems that exceed 120% rule limits.',
    necReference: 'NEC 705.12(A)',
    category: 'solar'
  },

  // Electrical Terms
  'amps': {
    term: 'Amperes (Amps)',
    definition: 'Unit of electrical current flow, representing the amount of electrical charge flowing past a point per second.',
    details: 'In residential applications, typical circuits range from 15A (lighting) to 50A (large appliances). Service sizes commonly range from 100A to 400A.',
    category: 'electrical'
  },
  'VA': {
    term: 'Volt-Amperes (VA)',
    definition: 'Unit of apparent electrical power, calculated as voltage × current.',
    details: 'For resistive loads, VA equals watts. For reactive loads (motors, transformers), VA is higher than watts due to power factor. Used in NEC calculations to account for worst-case scenarios.',
    category: 'electrical'
  },
  'volts': {
    term: 'Voltage (Volts)',
    definition: 'Electrical potential difference that drives current through a circuit.',
    details: 'Standard US residential voltages: 120V (lights, small appliances), 240V (large appliances, HVAC). Service voltage is typically 240V single-phase.',
    category: 'electrical'
  },
  'service size': {
    term: 'Service Size',
    definition: 'The amperage rating of the main electrical service entrance to a building.',
    details: 'Determines maximum electrical capacity. Common residential sizes: 100A, 150A, 200A, 400A. Should be sized for calculated load plus 25% spare capacity for future expansion.',
    necReference: 'NEC 220.14(A)',
    category: 'electrical'
  },
  'spare capacity': {
    term: 'Spare Capacity',
    definition: 'Percentage of electrical service capacity remaining after calculated loads.',
    details: 'Recommended minimum 25% for future expansion. Low spare capacity may require service upgrade before adding new loads like EV chargers or heat pumps.',
    necReference: 'NEC 220.14(A)',
    category: 'calculation'
  },
  'bus rating': {
    term: 'Bus Bar Rating',
    definition: 'Maximum amperage rating of the copper or aluminum bus bars in an electrical panel.',
    details: 'May be higher than main breaker rating. Critical for solar interconnection calculations per NEC 705.12. Common ratings: 100A, 125A, 200A, 225A, 400A.',
    necReference: 'NEC 705.12(B)(3)(2)',
    category: 'equipment'
  },
  'main breaker': {
    term: 'Main Breaker',
    definition: 'Primary overcurrent protection device that disconnects entire electrical service.',
    details: 'Rated in amperes, protects service entrance conductors. Can be located in meter base or main panel. Rating may be less than bus bar rating.',
    necReference: 'NEC 230.90',
    category: 'equipment'
  },

  // Solar Terms
  'inverter amps': {
    term: 'Inverter Output Current',
    definition: 'Maximum AC current output of a solar inverter under normal operating conditions.',
    details: 'Calculated as inverter AC power rating ÷ voltage. Used for breaker sizing (typically 125% of inverter output) and interconnection calculations.',
    necReference: 'NEC 705.60',
    category: 'solar'
  },
  'solar capacity': {
    term: 'Solar System Capacity',
    definition: 'Total DC power rating of solar panels in kilowatts (kW).',
    details: 'Nameplate capacity under Standard Test Conditions. Actual output varies with weather, time of day, and season. Used for system sizing and utility interconnection.',
    category: 'solar'
  },
  'battery capacity': {
    term: 'Battery Storage Capacity',
    definition: 'Energy storage capacity of battery system, typically rated in kilowatt-hours (kWh).',
    details: 'For load calculations, consider the charging power (kW) rather than energy capacity (kWh). Battery charging creates electrical load on the system.',
    category: 'solar'
  },
  '120% rule': {
    term: 'NEC 705.12 120% Rule',
    definition: 'Solar interconnection rule limiting combined main breaker and solar breaker amperage.',
    details: 'Formula: Main Breaker + Solar Breaker ≤ Bus Rating × 1.2. Prevents bus bar overload during peak solar production with full load. Does not apply to supply-side connections.',
    necReference: 'NEC 705.12(B)(3)(2)',
    category: 'solar'
  },

  // Load Calculation Terms
  'calculated load': {
    term: 'Calculated Load',
    definition: 'Total electrical demand determined using NEC calculation methods.',
    details: 'Includes mandatory loads (lighting, receptacles) plus appliances with demand factors applied. Used to size electrical service and conductors.',
    necReference: 'NEC Article 220',
    category: 'calculation'
  },
  'demand factor': {
    term: 'Demand Factor',
    definition: 'NEC multiplier applied to loads, recognizing that not all loads operate simultaneously.',
    details: 'Examples: First 8kVA of general loads at 100%, remainder at 40% (NEC 220.83). Reflects realistic usage patterns rather than worst-case scenario.',
    necReference: 'NEC 220.83',
    category: 'calculation'
  },
  'general lighting': {
    term: 'General Lighting and Receptacles',
    definition: 'Basic electrical loads calculated at 3 VA per square foot of floor area.',
    details: 'Includes general lighting, convenience receptacles, and small appliances. Foundation for all residential load calculations per NEC 220.52.',
    necReference: 'NEC 220.52',
    category: 'calculation'
  },
  'continuous load': {
    term: 'Continuous Load',
    definition: 'Electrical load expected to operate for 3+ hours continuously.',
    details: 'Must be calculated at 125% of actual load for conductor and overcurrent protection sizing. Common examples: EV chargers, some HVAC equipment.',
    necReference: 'NEC 210.19(A)(1)',
    category: 'calculation'
  },

  // Safety Terms
  'critical load': {
    term: 'Critical Load',
    definition: 'Essential electrical loads required during power outages for safety or equipment protection.',
    details: 'Examples: sump pumps, well pumps, medical equipment, refrigeration. Important for backup generator and battery storage system sizing.',
    category: 'safety'
  },
  'rapid shutdown': {
    term: 'Rapid Shutdown',
    definition: 'NEC safety requirement for solar systems to reduce DC voltage within 30 seconds.',
    details: 'Required for firefighter safety. Solar modules must reduce output to ≤80V within 30 seconds of initiation. Applies to most rooftop solar installations.',
    necReference: 'NEC 690.12',
    category: 'safety'
  },

  // Equipment Terms
  'EVSE': {
    term: 'Electric Vehicle Supply Equipment',
    definition: 'Charging equipment for electric vehicles, commonly called EV chargers.',
    details: 'Level 1 (120V, 12A), Level 2 (240V, 16-80A), DC Fast Charging (480V+). Residential typically uses Level 2. Treated as continuous load requiring 125% calculation factor.',
    necReference: 'NEC Article 625',
    category: 'equipment'
  },
  'EMS': {
    term: 'Energy Management System',
    definition: 'Smart system that manages electrical loads to prevent exceeding service capacity.',
    details: 'Allows installation of higher amperage loads (like multiple EV chargers) by intelligently controlling when they operate. Can reduce required service upgrade costs.',
    necReference: 'NEC 625.42',
    category: 'equipment'
  },
  'connection_type': {
    term: 'Solar Connection Types',
    definition: 'Methods for connecting solar inverters to the electrical system, each with different NEC requirements.',
    details: 'Backfeed: Through panel breaker (most common). Load Side: After main breaker. Supply Side: Before main breaker (no 120% limit). Choice affects sizing and compliance.',
    necReference: 'NEC 705.12',
    category: 'solar'
  },
  'solar_battery_type': {
    term: 'Solar/Battery System Type',
    definition: 'Classification of renewable energy equipment for load calculation purposes.',
    details: 'Solar PV: Generates electricity, considered a source. Battery: Stores energy, can be both load (charging) and source (discharging). Type affects electrical calculations.',
    category: 'solar'
  },
  'dedicated_circuit': {
    term: 'Dedicated Circuit',
    definition: 'Electrical circuit serving only one specific appliance or equipment.',
    details: 'Required by NEC for certain appliances like refrigerators, microwaves, dishwashers. Separate from NEC 220.52 small appliance circuits which serve general receptacles.',
    necReference: 'NEC 210.11(C)',
    category: 'electrical'
  },
  'small_appliance_circuit': {
    term: 'Small Appliance Circuit',
    definition: 'NEC 220.52 mandatory 20A circuits serving kitchen and dining receptacles.',
    details: 'Minimum 2 circuits required for kitchen countertop receptacles. These are general-use circuits for toasters, blenders, etc. Separate from dedicated appliance circuits.',
    necReference: 'NEC 220.52(A)',
    category: 'calculation'
  },
  'simpleswitch': {
    term: 'SimpleSwitch Load Management',
    definition: 'UL-listed automatic load management device that enables adding high-power appliances without electrical upgrades.',
    details: 'Patented switching technology with real-time energy monitoring. Two modes: Branch Circuit Sharing (2 appliances) and Feeder Monitoring (whole-home). 50A/12kW max capacity, NEMA 14-50 connection. Prevents simultaneous operation through automatic switching.',
    necReference: 'NEC Article 750, UL 916',
    category: 'equipment'
  },
  'dcc': {
    term: 'DCC (Dynamic Current Control)',
    definition: 'Smart load management system that dynamically adjusts charging current based on available electrical capacity.',
    details: 'Software-controlled system that monitors electrical load and adjusts EV charging current in real-time. Prevents overload conditions and allows optimized power distribution between multiple chargers.',
    necReference: 'NEC 625.42',
    category: 'equipment'
  },
  'load_management': {
    term: 'Load Management Device',
    definition: 'System that controls electrical loads to prevent exceeding available capacity.',
    details: 'Can include hardware switches, software controls, or energy management systems. For EVSE applications, allows reduced demand calculations by preventing simultaneous full-power operation.',
    necReference: 'NEC 625.42',
    category: 'equipment'
  }
};
