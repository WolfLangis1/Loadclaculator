export const TOOLTIP_DEFINITIONS = {
  // Electrical Units
  'VA': 'Volt-Amperes: The apparent power in an AC circuit. Calculated as Volts × Amps. Used for sizing electrical components.',
  'amps': 'Amperes: The unit of electric current. Represents the flow of electric charge through a conductor.',
  'amperage': 'The amount of electric current flowing through a circuit, measured in amperes (amps).',
  'volts': 'The unit of electrical potential difference. Standard residential voltage is 120V (single-phase) or 240V (split-phase).',
  'voltage': 'The electrical potential difference between two points, measured in volts.',
  'watts': 'The unit of electrical power. Represents the rate of energy consumption or production.',
  'kW': 'Kilowatts: 1,000 watts. Commonly used to measure larger electrical loads and solar system capacity.',
  'kVA': 'Kilovolt-Amperes: 1,000 VA. Used for sizing transformers and electrical service equipment.',

  // Load Calculation Terms
  'demand factor': 'A percentage applied to connected load to account for the fact that not all loads operate simultaneously.',
  'connected load': 'The total electrical load that could potentially be drawn if all equipment operated at full capacity.',
  'calculated load': 'The load after applying demand factors per NEC requirements. Used for service sizing.',
  'continuous load': 'A load that operates for 3 hours or more. Requires 125% factor for conductor and OCPD sizing.',
  'non-continuous load': 'A load that operates for less than 3 hours. No additional factor required.',

  // NEC Methods
  'optional method': 'NEC 220.82: Simplified calculation for dwelling units. First 10kVA at 100%, remainder at 40%.',
  'standard method': 'NEC 220.42: Traditional calculation. First 3kVA at 100%, next 117kVA at 35%, above 120kVA at 25%.',
  'existing dwelling': 'NEC 220.87: Uses actual demand data. Cannot be used with renewable energy systems.',

  // Electrical Components
  'main breaker': 'The main circuit breaker that controls power to the entire electrical panel. Determines service capacity.',
  'service entrance': 'The point where utility power enters the building electrical system.',
  'panel': 'Electrical distribution panel containing circuit breakers that distribute power to individual circuits.',
  'busbar': 'Copper or aluminum bars in electrical panels that carry and distribute electrical current.',
  'OCPD': 'Overcurrent Protective Device: Circuit breakers or fuses that protect circuits from overload.',

  // HVAC Terms
  'heat pump': 'Electrical heating/cooling system that moves heat rather than generating it. More efficient than resistance heating.',
  'auxiliary heat': 'Backup heating (usually electric resistance) for heat pumps during cold weather.',
  'tonnage': 'HVAC capacity measurement. 1 ton = 12,000 BTU/hr. Typical residential units are 2-5 tons.',
  'compressor': 'The heart of air conditioning/heat pump systems. Compresses refrigerant to enable heat transfer.',

  // EV Charging
  'EVSE': 'Electric Vehicle Supply Equipment: The charging station that provides power to electric vehicles.',
  'EMS': 'Energy Management System: Controls multiple EVSE units to prevent exceeding electrical capacity.',
  'charging level': 'Level 1 (120V), Level 2 (240V), or Level 3 (DC Fast Charging). Most residential use Level 2.',

  // Solar Terms
  'inverter': 'Converts DC power from solar panels to AC power for use in the home electrical system.',
  'interconnection': 'The point where solar system connects to utility grid, allowing bidirectional power flow.',
  '120% rule': 'NEC 705.12(B): Solar breaker + main breaker cannot exceed 120% of busbar rating.',
  'net metering': 'Utility program allowing excess solar production to be fed back to the grid for credit.',
  'supply-side connection': 'Solar connection before the main breaker, avoiding 120% rule limitations.',

  // Wire and Safety
  'wire gauge': 'AWG (American Wire Gauge): Smaller numbers = larger wire. 12 AWG is larger than 14 AWG.',
  'ampacity': 'The maximum current a conductor can carry continuously without exceeding temperature rating.',
  'voltage drop': 'Loss of voltage due to wire resistance. Should be kept under 3% for branch circuits.',
  'temperature rating': 'Maximum temperature a wire insulation can handle: 60°C, 75°C, or 90°C.',
  'THWN': 'Thermoplastic Heat and Water-resistant Nylon-coated wire. Common building wire type.',

  // Safety and Codes
  'NEC': 'National Electrical Code: The standard for electrical installation in the United States.',
  'AHJ': 'Authority Having Jurisdiction: Local building/electrical inspector with enforcement authority.',
  'GFCI': 'Ground Fault Circuit Interrupter: Safety device that shuts off power when ground fault detected.',
  'AFCI': 'Arc Fault Circuit Interrupter: Detects dangerous electrical arcs and shuts off power.',
  'grounding': 'Safety system that provides path for fault current to return to source and trip protection.',

  // Load Types
  'general lighting': 'Basic lighting load calculated at 3 VA per square foot for dwelling units.',
  'small appliance': 'Kitchen and dining area receptacle circuits. Minimum two 20A circuits required.',
  'laundry circuit': 'Dedicated 20A circuit for laundry room receptacles per NEC 210.11(C)(2).',
  'bathroom circuit': 'Dedicated 20A circuit for bathroom receptacles per NEC 210.11(C)(3).',
  'critical loads': 'Essential electrical loads that must continue operating during power outages.',

  // Calculation Results
  'spare capacity': 'Remaining electrical capacity available for future expansion. Recommend maintaining 25%.',
  'service size': 'Main electrical service capacity in amperes. Common sizes: 100A, 200A, 400A.',
  'load diversity': 'Not all electrical loads operate simultaneously. Allows for smaller service than connected load.',
  'safety factor': 'Additional capacity margin beyond calculated load to account for future needs and safety.'
} as const;

export type TooltipKey = keyof typeof TOOLTIP_DEFINITIONS;