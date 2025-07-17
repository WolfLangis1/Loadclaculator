/**
 * Electrical Component Templates Database
 * 
 * Comprehensive collection of electrical components for Single Line Diagrams
 * Organized by category with detailed specifications and manufacturer data
 */

import {
  Zap,
  Battery,
  Sun,
  Car,
  Grid3x3,
  Square,
  Triangle,
  Circle,
  Minus,
  PowerOff,
  Settings,
  Gauge,
  Shield,
  Plug,
  Lightbulb,
  Fan,
  MonitorSpeaker,
  Wifi,
  Clock,
  AlertTriangle
} from 'lucide-react';

export interface ComponentTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  icon: React.ComponentType<any>;
  color: string;
  defaultSize: { width: number; height: number };
  description: string;
  manufacturer?: string;
  model?: string;
  specifications: Record<string, any>;
}

export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // Solar Components - General
  {
    id: 'pv_array_template',
    name: 'PV Array',
    category: 'Solar',
    type: 'pv_array',
    icon: Sun,
    color: '#f59e0b',
    defaultSize: { width: 120, height: 80 },
    description: 'Solar photovoltaic array',
    specifications: {
      numStrings: 2,
      modulesPerString: 12,
      moduleWattage: 400,
      moduleVoltage: 40,
      arrayVoltage: 480,
      arrayCurrent: 20
    }
  },

  // Enphase Solar Equipment
  {
    id: 'enphase_iq8_microinverter_template',
    name: 'Enphase IQ8+ Microinverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#2563eb',
    defaultSize: { width: 60, height: 40 },
    description: 'Enphase IQ8+ microinverter with grid-forming capability - 290W output',
    manufacturer: 'Enphase',
    model: 'IQ8PLUS-72-2-US',
    specifications: {
      inverterType: 'micro',
      acOutputKW: 0.29,
      acOutputVA: 300,
      dcInputVoltage: 60,
      dcInputCurrent: 14,
      acOutputVoltage: 240,
      efficiency: 0.976,
      cecEfficiency: 0.97,
      mpptChannels: 1,
      gridForming: true,
      maxModulePower: 440,
      moduleCompatibility: '235-440W',
      dimensions: { length: 212, width: 175, unit: 'mm' },
      operatingTemp: '-40°C to +65°C',
      warranty: '25 years',
      certification: 'UL 1741, IEC 61730',
      gridTieCapability: 'Grid-tied and off-grid modes'
    }
  },

  {
    id: 'enphase_iq8_combiner_template',
    name: 'Enphase Q Combiner 4',
    category: 'Solar',
    type: 'combiner',
    icon: Grid3x3,
    color: '#059669',
    defaultSize: { width: 80, height: 60 },
    description: 'Enphase Q Combiner with 4 branch circuit breakers',
    manufacturer: 'Enphase',
    model: 'Q-4-17-240',
    specifications: {
      combinerType: 'ac_combiner',
      maxCircuits: 4,
      maxCurrent: 17,
      voltage: 240,
      breakerType: '17A 1-pole',
      enclosureRating: 'NEMA 3R',
      dimensions: { width: 8.5, height: 12, depth: 4, unit: 'inches' },
      wireLandingSize: '14-6 AWG',
      groundingLugs: 'Included',
      rapidShutdown: 'Compatible'
    }
  },

  {
    id: 'enphase_iq_battery_template',
    name: 'Enphase IQ Battery 5P',
    category: 'Energy Storage',
    type: 'battery',
    icon: Battery,
    color: '#7c3aed',
    defaultSize: { width: 100, height: 80 },
    description: 'Enphase IQ Battery 5P - 5kWh lithium iron phosphate',
    manufacturer: 'Enphase',
    model: 'B05-5P00-1-NA',
    specifications: {
      batteryType: 'lithium_iron_phosphate',
      usableCapacity: 5.0,
      totalCapacity: 5.12,
      voltage: 52.6,
      maxContinuousPower: 3.84,
      maxPeakPower: 5.76,
      efficiency: 0.89,
      cycleLife: 4000,
      operatingTemp: '-15°C to +55°C',
      dimensions: { width: 10.6, height: 28.6, depth: 6.9, unit: 'inches' },
      weight: 123,
      warranty: '15 years',
      monitoring: 'Enlighten app integration'
    }
  },

  {
    id: 'enphase_iq_system_controller_template',
    name: 'Enphase IQ System Controller 3G',
    category: 'Solar',
    type: 'controller',
    icon: MonitorSpeaker,
    color: '#059669',
    defaultSize: { width: 70, height: 50 },
    description: 'Enphase IQ System Controller with cellular connectivity',
    manufacturer: 'Enphase',
    model: 'ENV-S-AB-120-A',
    specifications: {
      controllerType: 'system_controller',
      connectivity: '3G cellular',
      monitoringCapacity: 'Unlimited microinverters',
      dataLogging: '15-minute intervals',
      communicationProtocol: 'Zigbee Pro',
      powerConsumption: '5W max',
      operatingTemp: '-40°C to +70°C',
      enclosureRating: 'NEMA 6',
      dimensions: { width: 5.8, height: 8.8, depth: 2.2, unit: 'inches' },
      installation: 'Indoor/outdoor',
      dataRetention: '1 year local storage'
    }
  },

  // Tesla Solar Equipment
  {
    id: 'tesla_solar_inverter_template',
    name: 'Tesla Solar Inverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#dc2626',
    defaultSize: { width: 80, height: 60 },
    description: 'Tesla Solar Inverter - 7.6kW string inverter',
    manufacturer: 'Tesla',
    model: 'TSI-7.6kW-G1',
    specifications: {
      inverterType: 'string',
      acOutputKW: 7.6,
      acOutputVA: 7600,
      dcInputVoltage: '300-550V',
      maxDcInputVoltage: 600,
      acOutputVoltage: 240,
      efficiency: 0.975,
      mpptChannels: 2,
      maxStringCurrent: 20,
      gridTieCapability: 'Grid-tied only',
      rapidShutdown: 'Module-level power electronics',
      dimensions: { width: 26, height: 16, depth: 6, unit: 'inches' },
      operatingTemp: '-40°C to +60°C',
      warranty: '12.5 years',
      certification: 'UL 1741, IEEE 1547'
    }
  },

  {
    id: 'tesla_powerwall_template',
    name: 'Tesla Powerwall 3',
    category: 'Energy Storage',
    type: 'battery',
    icon: Battery,
    color: '#dc2626',
    defaultSize: { width: 120, height: 100 },
    description: 'Tesla Powerwall 3 - 13.5kWh AC-coupled battery system',
    manufacturer: 'Tesla',
    model: 'PW3-13.5kWh',
    specifications: {
      batteryType: 'lithium_ion',
      usableCapacity: 13.5,
      totalCapacity: 13.5,
      voltage: 100,
      maxContinuousPower: 11.5,
      maxPeakPower: 22.0,
      efficiency: 0.90,
      cycleLife: 6000,
      operatingTemp: '-20°C to +50°C',
      dimensions: { width: 24, height: 62.8, depth: 6.3, unit: 'inches' },
      weight: 287,
      warranty: '10 years',
      monitoring: 'Tesla app',
      gridTieCapability: 'Backup and solar integration'
    }
  },

  {
    id: 'tesla_gateway_template',
    name: 'Tesla Backup Gateway 2',
    category: 'Energy Storage',
    type: 'gateway',
    icon: Shield,
    color: '#dc2626',
    defaultSize: { width: 80, height: 60 },
    description: 'Tesla Backup Gateway 2 - Smart transfer switch',
    manufacturer: 'Tesla',
    model: 'BG2-1077C-07-E',
    specifications: {
      gatewayType: 'backup_transfer_switch',
      maxPower: 7.6,
      voltage: '120/240V',
      frequency: '60Hz',
      transferTime: '0.5 seconds',
      monitoring: 'Real-time energy usage',
      connectivity: 'WiFi, cellular',
      operatingTemp: '-30°C to +60°C',
      enclosureRating: 'NEMA 3R',
      dimensions: { width: 26, height: 16, depth: 5.8, unit: 'inches' },
      installation: 'Indoor/outdoor'
    }
  },

  // SolarEdge Equipment
  {
    id: 'solaredge_hd_wave_inverter_template',
    name: 'SolarEdge HD-Wave Inverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#f59e0b',
    defaultSize: { width: 80, height: 60 },
    description: 'SolarEdge HD-Wave single phase inverter - 7.6kW',
    manufacturer: 'SolarEdge',
    model: 'SE7600H-US',
    specifications: {
      inverterType: 'string',
      acOutputKW: 7.6,
      acOutputVA: 7600,
      dcInputVoltage: '200-600V',
      maxDcInputVoltage: 600,
      acOutputVoltage: 240,
      efficiency: 0.99,
      weightedEfficiency: 0.985,
      mpptChannels: 1,
      powerOptimizers: 'DC optimizers required',
      gridTieCapability: 'Grid-tied with backup option',
      rapidShutdown: 'Module-level shutdown',
      dimensions: { width: 26, height: 17, depth: 6.7, unit: 'inches' },
      operatingTemp: '-40°C to +60°C',
      warranty: '12 years, extendable to 25',
      certification: 'UL 1741, IEEE 1547'
    }
  },

  {
    id: 'solaredge_power_optimizer_template',
    name: 'SolarEdge P850 Power Optimizer',
    category: 'Solar',
    type: 'optimizer',
    icon: Settings,
    color: '#f59e0b',
    defaultSize: { width: 50, height: 30 },
    description: 'SolarEdge P850 power optimizer for high power modules',
    manufacturer: 'SolarEdge',
    model: 'P850-4RM4MBY',
    specifications: {
      optimizerType: 'dc_optimizer',
      maxOutputPower: 850,
      maxOutputVoltage: 80,
      maxOutputCurrent: 15,
      inputVoltage: '12.5-80V',
      efficiency: 0.995,
      moduleCompatibility: '320-850W',
      operatingTemp: '-40°C to +85°C',
      dimensions: { length: 161, width: 135, depth: 33, unit: 'mm' },
      weight: 0.7,
      warranty: '25 years',
      monitoring: 'Module-level monitoring',
      rapidShutdown: 'Compliant'
    }
  },

  {
    id: 'solaredge_storedge_inverter_template',
    name: 'SolarEdge StorEdge Inverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#f59e0b',
    defaultSize: { width: 80, height: 60 },
    description: 'SolarEdge StorEdge DC-coupled inverter with battery interface',
    manufacturer: 'SolarEdge',
    model: 'SE7600H-RWS',
    specifications: {
      inverterType: 'hybrid',
      acOutputKW: 7.6,
      acOutputVA: 7600,
      dcInputVoltage: '200-600V',
      batteryInterface: 'DC-coupled',
      batteryVoltage: '400V',
      maxBatteryPower: 5.0,
      efficiency: 0.97,
      backupCapability: true,
      gridTieCapability: 'Grid-tied with backup',
      dimensions: { width: 26, height: 17, depth: 6.7, unit: 'inches' },
      operatingTemp: '-25°C to +60°C',
      warranty: '12 years'
    }
  },

  // Generac Equipment  
  {
    id: 'generac_pwrcell_inverter_template',
    name: 'Generac PWRcell Inverter',
    category: 'Energy Storage',
    type: 'inverter',
    icon: Zap,
    color: '#fb7185',
    defaultSize: { width: 80, height: 60 },
    description: 'Generac PWRcell 7.6kW hybrid inverter',
    manufacturer: 'Generac',
    model: 'APKE00007',
    specifications: {
      inverterType: 'hybrid',
      acOutputKW: 7.6,
      acOutputVA: 7600,
      dcInputVoltage: '200-600V',
      batteryInterface: 'DC-coupled',
      batteryVoltage: '340-460V',
      maxBatteryPower: 4.2,
      efficiency: 0.96,
      backupCapability: true,
      gridTieCapability: 'Grid-tied with backup',
      dimensions: { width: 26.8, height: 20.9, depth: 8.1, unit: 'inches' },
      operatingTemp: '-13°F to +140°F',
      warranty: '10 years'
    }
  },

  {
    id: 'generac_pwrcell_battery_template',
    name: 'Generac PWRcell Battery Module',
    category: 'Energy Storage',
    type: 'battery',
    icon: Battery,
    color: '#fb7185',
    defaultSize: { width: 80, height: 100 },
    description: 'Generac PWRcell M6 battery module - 3kWh',
    manufacturer: 'Generac',
    model: 'APKE00016',
    specifications: {
      batteryType: 'lithium_ion',
      usableCapacity: 3.0,
      totalCapacity: 3.4,
      voltage: 51.2,
      maxContinuousPower: 4.2,
      maxPeakPower: 8.4,
      efficiency: 0.96,
      cycleLife: 10000,
      operatingTemp: '32°F to +104°F',
      dimensions: { width: 18.1, height: 22.1, depth: 9.6, unit: 'inches' },
      weight: 66,
      warranty: '10 years',
      monitoring: 'PWRview app'
    }
  },

  // Electrical Panels and Breakers
  {
    id: 'main_electrical_panel_template',
    name: 'Main Electrical Panel',
    category: 'Distribution',
    type: 'panel',
    icon: Grid3x3,
    color: '#374151',
    defaultSize: { width: 100, height: 120 },
    description: 'Main electrical service panel',
    specifications: {
      panelType: 'main_breaker',
      mainBreakerAmps: 200,
      voltage: '120/240V',
      phases: 1,
      maxCircuits: 42,
      busbarRating: 225,
      shortCircuitRating: 22000,
      enclosureType: 'NEMA 1',
      wireLandingSize: '4/0 AWG max'
    }
  },

  {
    id: 'sub_panel_template',
    name: 'Sub Panel',
    category: 'Distribution',
    type: 'panel',
    icon: Grid3x3,
    color: '#6b7280',
    defaultSize: { width: 80, height: 100 },
    description: 'Sub electrical panel',
    specifications: {
      panelType: 'main_lug',
      maxAmps: 100,
      voltage: '120/240V',
      phases: 1,
      maxCircuits: 24,
      busbarRating: 100,
      feedFromMain: true,
      enclosureType: 'NEMA 1'
    }
  },

  {
    id: 'circuit_breaker_template',
    name: 'Circuit Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Square,
    color: '#374151',
    defaultSize: { width: 40, height: 20 },
    description: 'Circuit breaker',
    specifications: {
      breakerType: 'thermal_magnetic',
      ampRating: 20,
      voltage: 240,
      poles: 1,
      interruptingCapacity: 10000,
      wireSize: '12 AWG',
      loadType: 'general'
    }
  },

  {
    id: 'gfci_breaker_template',
    name: 'GFCI Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Shield,
    color: '#dc2626',
    defaultSize: { width: 40, height: 20 },
    description: 'Ground fault circuit interrupter breaker',
    specifications: {
      breakerType: 'gfci',
      ampRating: 20,
      voltage: 240,
      poles: 1,
      gfciProtection: true,
      testButton: true,
      wireSize: '12 AWG',
      application: 'outdoor, bathroom, kitchen'
    }
  },

  {
    id: 'afci_breaker_template',
    name: 'AFCI Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: AlertTriangle,
    color: '#f59e0b',
    defaultSize: { width: 40, height: 20 },
    description: 'Arc fault circuit interrupter breaker',
    specifications: {
      breakerType: 'afci',
      ampRating: 20,
      voltage: 240,
      poles: 1,
      afciProtection: true,
      testButton: true,
      wireSize: '12 AWG',
      application: 'bedrooms, living areas'
    }
  },

  // EVSE Equipment
  {
    id: 'tesla_wall_connector_template',
    name: 'Tesla Wall Connector',
    category: 'EVSE',
    type: 'evse',
    icon: Car,
    color: '#dc2626',
    defaultSize: { width: 60, height: 80 },
    description: 'Tesla Wall Connector - 48A Level 2 EVSE',
    manufacturer: 'Tesla',
    model: 'Gen 3 Wall Connector',
    specifications: {
      evseType: 'level_2',
      maxCurrent: 48,
      voltage: 240,
      maxPower: 11.5,
      connector: 'Proprietary Tesla',
      cordLength: 24,
      installation: 'Wall-mounted',
      operatingTemp: '-40°F to +122°F',
      enclosureRating: 'NEMA 4',
      dimensions: { width: 8.5, height: 13.4, depth: 4, unit: 'inches' },
      connectivity: 'WiFi',
      loadSharing: 'Up to 4 units',
      warranty: '4 years',
      certification: 'UL 2594'
    }
  },

  {
    id: 'chargepoint_home_flex_template',
    name: 'ChargePoint Home Flex',
    category: 'EVSE',
    type: 'evse',
    icon: Car,
    color: '#059669',
    defaultSize: { width: 60, height: 80 },
    description: 'ChargePoint Home Flex - Adjustable 16-50A EVSE',
    manufacturer: 'ChargePoint',
    model: 'CPH50-NEMA6-50-L23',
    specifications: {
      evseType: 'level_2',
      maxCurrent: 50,
      adjustableCurrent: '16-50A',
      voltage: 240,
      maxPower: 12.0,
      connector: 'J1772',
      cordLength: 23,
      installation: 'Wall-mounted',
      operatingTemp: '-40°F to +122°F',
      enclosureRating: 'NEMA 4',
      dimensions: { width: 8.8, height: 13, depth: 4.2, unit: 'inches' },
      connectivity: 'WiFi',
      smartFeatures: 'Scheduling, monitoring',
      warranty: '3 years',
      certification: 'UL 2594, Energy Star'
    }
  },

  {
    id: 'clipper_creek_hcs_template',
    name: 'ClipperCreek HCS-40',
    category: 'EVSE',
    type: 'evse',
    icon: Car,
    color: '#2563eb',
    defaultSize: { width: 60, height: 80 },
    description: 'ClipperCreek HCS-40 - 32A Level 2 EVSE',
    manufacturer: 'ClipperCreek',
    model: 'HCS-40',
    specifications: {
      evseType: 'level_2',
      maxCurrent: 32,
      voltage: 240,
      maxPower: 7.7,
      connector: 'J1772',
      cordLength: 18,
      installation: 'Wall-mounted',
      operatingTemp: '-40°F to +122°F',
      enclosureRating: 'NEMA 4',
      dimensions: { width: 8.8, height: 12.7, depth: 3.3, unit: 'inches' },
      connectivity: 'None (hardwired)',
      warranty: '3 years',
      certification: 'UL 2594, FCC'
    }
  },

  // Meters and Monitoring
  {
    id: 'production_meter_template',
    name: 'Production Meter',
    category: 'Metering',
    type: 'meter',
    icon: Gauge,
    color: '#059669',
    defaultSize: { width: 60, height: 40 },
    description: 'Net production meter for solar PV systems',
    specifications: {
      meterType: 'production',
      voltage: '120/240V',
      ampRating: 200,
      accuracy: '0.2%',
      protocol: 'Modbus RTU',
      display: 'LCD',
      functions: ['kWh', 'kW', 'voltage', 'current'],
      certification: 'ANSI C12.20'
    }
  },

  {
    id: 'consumption_meter_template',
    name: 'Consumption Meter',
    category: 'Metering',
    type: 'meter',
    icon: Gauge,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'Load consumption meter',
    specifications: {
      meterType: 'consumption',
      voltage: '120/240V',
      ampRating: 200,
      accuracy: '0.5%',
      protocol: 'Modbus RTU',
      display: 'Digital',
      functions: ['kWh', 'kW', 'demand'],
      certification: 'ANSI C12.20'
    }
  },

  {
    id: 'ct_clamp_template',
    name: 'Current Transformer',
    category: 'Metering',
    type: 'ct',
    icon: Circle,
    color: '#6b7280',
    defaultSize: { width: 30, height: 30 },
    description: 'Split-core current transformer for monitoring',
    specifications: {
      ctType: 'split_core',
      primaryRating: 200,
      secondaryRating: 5,
      ratio: '200:5',
      accuracy: '0.3%',
      wireSize: '4/0 AWG max',
      installation: 'Split-core, no rewiring'
    }
  },

  // Disconnects and Switches
  {
    id: 'ac_disconnect_template',
    name: 'AC Disconnect',
    category: 'Disconnects',
    type: 'disconnect',
    icon: PowerOff,
    color: '#dc2626',
    defaultSize: { width: 50, height: 60 },
    description: 'AC disconnect switch for solar inverter',
    specifications: {
      disconnectType: 'ac_disconnect',
      ampRating: 60,
      voltage: 240,
      poles: 2,
      fusible: false,
      enclosureRating: 'NEMA 3R',
      lockable: true,
      application: 'Solar inverter AC disconnect'
    }
  },

  {
    id: 'dc_disconnect_template',
    name: 'DC Disconnect',
    category: 'Disconnects',
    type: 'disconnect',
    icon: PowerOff,
    color: '#f59e0b',
    defaultSize: { width: 50, height: 60 },
    description: 'DC disconnect switch for solar array',
    specifications: {
      disconnectType: 'dc_disconnect',
      ampRating: 30,
      voltage: 600,
      poles: 2,
      fusible: true,
      enclosureRating: 'NEMA 3R',
      lockable: true,
      application: 'Solar array DC disconnect'
    }
  },

  {
    id: 'transfer_switch_template',
    name: 'Transfer Switch',
    category: 'Disconnects',
    type: 'transfer_switch',
    icon: Settings,
    color: '#7c3aed',
    defaultSize: { width: 80, height: 60 },
    description: 'Automatic transfer switch for backup power',
    specifications: {
      transferType: 'automatic',
      ampRating: 200,
      voltage: '120/240V',
      poles: 2,
      transferTime: '10 seconds',
      enclosureRating: 'NEMA 3R',
      serviceRated: true,
      application: 'Backup generator transfer'
    }
  },

  // Grounding Equipment
  {
    id: 'grounding_rod_template',
    name: 'Grounding Rod',
    category: 'Grounding',
    type: 'grounding',
    icon: Minus,
    color: '#059669',
    defaultSize: { width: 20, height: 60 },
    description: 'Copper grounding rod',
    specifications: {
      groundingType: 'rod',
      material: 'copper_clad_steel',
      diameter: 0.625,
      length: 8,
      drivingPoint: true,
      resistance: '25 ohms or less',
      installation: 'Driven 8 feet deep'
    }
  },

  {
    id: 'grounding_busbar_template',
    name: 'Grounding Busbar',
    category: 'Grounding',
    type: 'grounding',
    icon: Minus,
    color: '#059669',
    defaultSize: { width: 60, height: 20 },
    description: 'Equipment grounding busbar',
    specifications: {
      groundingType: 'busbar',
      material: 'copper',
      ampRating: 200,
      wireSize: '4/0 AWG max',
      lugs: 6,
      mounting: 'Panel or enclosure',
      application: 'Equipment grounding'
    }
  },

  // Conduit and Raceways
  {
    id: 'emt_conduit_template',
    name: 'EMT Conduit',
    category: 'Raceways',
    type: 'conduit',
    icon: Minus,
    color: '#6b7280',
    defaultSize: { width: 80, height: 10 },
    description: 'Electrical metallic tubing',
    specifications: {
      conduitType: 'emt',
      size: 0.75,
      material: 'steel',
      coating: 'galvanized',
      fillCapacity: '40% max',
      installation: 'Above ground, dry locations',
      standardLength: 10
    }
  },

  {
    id: 'pvc_conduit_template',
    name: 'PVC Conduit',
    category: 'Raceways',
    type: 'conduit',
    icon: Minus,
    color: '#f3f4f6',
    defaultSize: { width: 80, height: 10 },
    description: 'PVC electrical conduit',
    specifications: {
      conduitType: 'pvc',
      size: 0.75,
      material: 'pvc',
      schedule: 40,
      fillCapacity: '40% max',
      installation: 'Underground, wet locations',
      standardLength: 10
    }
  },

  // Wire and Cables
  {
    id: 'thwn_wire_template',
    name: 'THWN-2 Wire',
    category: 'Conductors',
    type: 'wire',
    icon: Minus,
    color: '#374151',
    defaultSize: { width: 60, height: 8 },
    description: 'THWN-2 building wire',
    specifications: {
      wireType: 'thwn2',
      size: 12,
      material: 'copper',
      insulation: 'PVC',
      temperature: '90°C',
      voltage: 600,
      ampacity: 20,
      application: 'Dry and wet locations'
    }
  },

  {
    id: 'pv_wire_template',
    name: 'PV Wire',
    category: 'Conductors',
    type: 'wire',
    icon: Minus,
    color: '#dc2626',
    defaultSize: { width: 60, height: 8 },
    description: 'Photovoltaic wire for solar installations',
    specifications: {
      wireType: 'pv_wire',
      size: 12,
      material: 'copper',
      insulation: 'XLPE',
      temperature: '90°C',
      voltage: 600,
      ampacity: 30,
      application: 'DC solar circuits',
      sunlightResistant: true
    }
  },

  // Utility Equipment
  {
    id: 'utility_meter_template',
    name: 'Utility Meter',
    category: 'Utility',
    type: 'meter',
    icon: Gauge,
    color: '#374151',
    defaultSize: { width: 60, height: 80 },
    description: 'Utility revenue meter',
    specifications: {
      meterType: 'revenue',
      voltage: '120/240V',
      ampRating: 200,
      phases: 1,
      accuracy: '0.1%',
      netMetering: true,
      communication: 'AMI capable',
      display: 'Digital LCD'
    }
  },

  {
    id: 'utility_transformer_template',
    name: 'Utility Transformer',
    category: 'Utility',
    type: 'transformer',
    icon: Square,
    color: '#059669',
    defaultSize: { width: 100, height: 80 },
    description: 'Utility distribution transformer',
    specifications: {
      transformerType: 'distribution',
      kvaRating: 25,
      primaryVoltage: 7200,
      secondaryVoltage: '120/240V',
      phases: 1,
      cooling: 'ONAN',
      installation: 'Pad-mounted',
      efficiency: '98.5%'
    }
  },

  {
    id: 'service_entrance_template',
    name: 'Service Entrance',
    category: 'Utility',
    type: 'service',
    icon: Grid3x3,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'Electrical service entrance equipment',
    specifications: {
      serviceType: 'overhead',
      ampRating: 200,
      voltage: '120/240V',
      phases: 1,
      wireSize: '4/0 AWG aluminum',
      mainBreaker: '200A',
      meteringSpace: 'Included',
      enclosureRating: 'NEMA 3R'
    }
  },

  // Smart Home Equipment
  {
    id: 'smart_panel_template',
    name: 'Smart Electrical Panel',
    category: 'Smart Home',
    type: 'panel',
    icon: MonitorSpeaker,
    color: '#2563eb',
    defaultSize: { width: 100, height: 120 },
    description: 'Smart electrical panel with monitoring',
    specifications: {
      panelType: 'smart_main_breaker',
      mainBreakerAmps: 200,
      voltage: '120/240V',
      maxCircuits: 42,
      monitoring: 'Circuit-level',
      connectivity: 'WiFi, cellular',
      app: 'Mobile app included',
      loadManagement: 'Automatic load shedding',
      warranty: '10 years'
    }
  },

  {
    id: 'smart_breaker_template',
    name: 'Smart Circuit Breaker',
    category: 'Smart Home',
    type: 'breaker',
    icon: Wifi,
    color: '#2563eb',
    defaultSize: { width: 40, height: 20 },
    description: 'Smart circuit breaker with monitoring',
    specifications: {
      breakerType: 'smart',
      ampRating: 20,
      voltage: 240,
      poles: 1,
      monitoring: 'Current, voltage, power',
      remoteControl: true,
      app: 'Mobile app control',
      notifications: 'Overload, fault alerts',
      warranty: '5 years'
    }
  },

  {
    id: 'energy_monitor_template',
    name: 'Whole Home Energy Monitor',
    category: 'Smart Home',
    type: 'monitor',
    icon: MonitorSpeaker,
    color: '#059669',
    defaultSize: { width: 80, height: 60 },
    description: 'Whole home energy monitoring system',
    specifications: {
      monitorType: 'whole_home',
      channels: 16,
      accuracy: '1%',
      connectivity: 'WiFi',
      app: 'Energy monitoring app',
      features: ['Usage tracking', 'Cost analysis', 'Device detection'],
      installation: 'Electrical panel mount',
      warranty: '2 years'
    }
  },

  // Generator Equipment
  {
    id: 'standby_generator_template',
    name: 'Standby Generator',
    category: 'Backup Power',
    type: 'generator',
    icon: PowerOff,
    color: '#f59e0b',
    defaultSize: { width: 120, height: 80 },
    description: 'Natural gas standby generator',
    specifications: {
      generatorType: 'standby',
      kwRating: 22,
      fuel: 'natural_gas',
      voltage: '120/240V',
      phases: 1,
      startType: 'automatic',
      transferSwitch: 'Included',
      enclosure: 'Weather-resistant',
      runtime: 'Unlimited with NG',
      warranty: '5 years'
    }
  },

  {
    id: 'portable_generator_template',
    name: 'Portable Generator',
    category: 'Backup Power',
    type: 'generator',
    icon: PowerOff,
    color: '#dc2626',
    defaultSize: { width: 80, height: 60 },
    description: 'Portable gasoline generator',
    specifications: {
      generatorType: 'portable',
      kwRating: 7.5,
      fuel: 'gasoline',
      voltage: '120/240V',
      outlets: ['120V 20A', '240V 30A'],
      runtime: '8 hours at 50% load',
      startType: 'electric',
      weight: 200,
      warranty: '3 years'
    }
  },

  // Safety Equipment
  {
    id: 'smoke_detector_template',
    name: 'Smoke Detector',
    category: 'Safety',
    type: 'detector',
    icon: AlertTriangle,
    color: '#dc2626',
    defaultSize: { width: 40, height: 40 },
    description: 'Hardwired smoke detector',
    specifications: {
      detectorType: 'smoke',
      powerSource: 'hardwired_battery_backup',
      sensing: 'photoelectric',
      interconnectable: true,
      testButton: true,
      husButton: true,
      warranty: '10 years',
      certification: 'UL 217'
    }
  },

  {
    id: 'co_detector_template',
    name: 'Carbon Monoxide Detector',
    category: 'Safety',
    type: 'detector',
    icon: AlertTriangle,
    color: '#f59e0b',
    defaultSize: { width: 40, height: 40 },
    description: 'Carbon monoxide detector',
    specifications: {
      detectorType: 'carbon_monoxide',
      powerSource: 'hardwired_battery_backup',
      sensing: 'electrochemical',
      digitalDisplay: true,
      peakLevel: true,
      testButton: true,
      warranty: '7 years',
      certification: 'UL 2034'
    }
  },

  // Lighting Controls
  {
    id: 'dimmer_switch_template',
    name: 'LED Dimmer Switch',
    category: 'Lighting',
    type: 'dimmer',
    icon: Lightbulb,
    color: '#f59e0b',
    defaultSize: { width: 30, height: 50 },
    description: 'LED compatible dimmer switch',
    specifications: {
      switchType: 'dimmer',
      loadType: 'LED',
      maxWattage: 150,
      voltage: 120,
      control: 'slide_rocker',
      preset: true,
      warranty: '2 years',
      certification: 'UL 1472'
    }
  },

  {
    id: 'occupancy_sensor_template',
    name: 'Occupancy Sensor',
    category: 'Lighting',
    type: 'sensor',
    icon: MonitorSpeaker,
    color: '#059669',
    defaultSize: { width: 40, height: 40 },
    description: 'PIR occupancy sensor switch',
    specifications: {
      sensorType: 'pir',
      coverage: '180 degrees',
      range: '20 feet',
      timeDelay: 'adjustable 1-30 minutes',
      manualOverride: true,
      loadType: 'incandescent_led_cfl',
      maxWattage: 800,
      warranty: '2 years'
    }
  },

  // HVAC Equipment
  {
    id: 'hvac_disconnect_template',
    name: 'HVAC Disconnect',
    category: 'HVAC',
    type: 'disconnect',
    icon: Fan,
    color: '#2563eb',
    defaultSize: { width: 50, height: 60 },
    description: 'HVAC equipment disconnect switch',
    specifications: {
      disconnectType: 'hvac',
      ampRating: 60,
      voltage: 240,
      poles: 2,
      fusible: true,
      enclosureRating: 'NEMA 3R',
      lockable: true,
      application: 'Air conditioning unit'
    }
  },

  {
    id: 'condenser_unit_template',
    name: 'AC Condenser Unit',
    category: 'HVAC',
    type: 'condenser',
    icon: Fan,
    color: '#6b7280',
    defaultSize: { width: 80, height: 80 },
    description: 'Air conditioning condenser unit',
    specifications: {
      unitType: 'condenser',
      tonnage: 3,
      voltage: 240,
      ampRating: 20,
      refrigerant: 'R-410A',
      seer: 16,
      compressorType: 'scroll',
      warranty: '10 years parts, 1 year labor'
    }
  },

  // Pool/Spa Equipment
  {
    id: 'pool_panel_template',
    name: 'Pool Equipment Panel',
    category: 'Pool/Spa',
    type: 'panel',
    icon: Settings,
    color: '#0891b2',
    defaultSize: { width: 80, height: 100 },
    description: 'Pool equipment electrical panel',
    specifications: {
      panelType: 'pool_equipment',
      ampRating: 100,
      voltage: '120/240V',
      gfciProtection: true,
      enclosureRating: 'NEMA 3R',
      circuits: 'Pump, heater, lights, controls',
      bondingLug: 'Included',
      timer: 'Optional'
    }
  },

  {
    id: 'pool_pump_template',
    name: 'Pool Pump',
    category: 'Pool/Spa',
    type: 'pump',
    icon: Fan,
    color: '#0891b2',
    defaultSize: { width: 60, height: 40 },
    description: 'Variable speed pool pump',
    specifications: {
      pumpType: 'variable_speed',
      horsepower: 1.5,
      voltage: 240,
      ampRating: 8,
      gpmMax: 80,
      efficiency: 'Energy Star certified',
      controls: 'Digital display',
      warranty: '3 years'
    }
  },

  // Communication Equipment
  {
    id: 'structured_wiring_panel_template',
    name: 'Structured Wiring Panel',
    category: 'Communications',
    type: 'panel',
    icon: MonitorSpeaker,
    color: '#6366f1',
    defaultSize: { width: 80, height: 100 },
    description: 'Structured wiring distribution panel',
    specifications: {
      panelType: 'structured_wiring',
      size: '14 inches',
      modules: 'Phone, data, video, cable',
      powerOutlets: 4,
      ventilation: 'Included',
      mounting: 'Flush or surface',
      expandable: true
    }
  },

  {
    id: 'network_switch_template',
    name: '8-Port Network Switch',
    category: 'Communications',
    type: 'switch',
    icon: Wifi,
    color: '#6366f1',
    defaultSize: { width: 60, height: 30 },
    description: 'Gigabit Ethernet switch',
    specifications: {
      switchType: 'gigabit_ethernet',
      ports: 8,
      speed: '10/100/1000 Mbps',
      powerConsumption: '4W',
      mounting: 'Desktop or wall',
      warranty: 'Lifetime'
    }
  }
];

/**
 * Component categories for filtering and organization
 */
export const COMPONENT_CATEGORIES = [
  'All',
  'Solar',
  'Energy Storage',
  'Distribution',
  'Protection',
  'EVSE',
  'Metering',
  'Disconnects',
  'Grounding',
  'Raceways',
  'Conductors',
  'Utility',
  'Smart Home',
  'Backup Power',
  'Safety',
  'Lighting',
  'HVAC',
  'Pool/Spa',
  'Communications'
] as const;

/**
 * Major manufacturers represented in the database
 */
export const MANUFACTURERS = [
  'All',
  'Enphase',
  'Tesla',
  'SolarEdge',
  'Generac',
  'ChargePoint',
  'ClipperCreek'
] as const;

export type ComponentCategory = typeof COMPONENT_CATEGORIES[number];
export type Manufacturer = typeof MANUFACTURERS[number];