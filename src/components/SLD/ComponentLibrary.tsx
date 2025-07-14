import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Battery,
  Sun,
  Car,
  Grid,
  Square,
  Triangle,
  Circle,
  Minus,
  Power,
  Settings,
  Gauge,
  Shield,
  Plug,
  Lightbulb,
  Fan,
  Monitor,
  Wifi,
  Clock,
  AlertTriangle
} from 'lucide-react';
// import type { SLDComponent } from '../../types/sld';

interface ComponentTemplate {
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

interface ComponentLibraryProps {
  onComponentSelect: (template: ComponentTemplate) => void;
  onComponentDragStart?: (template: ComponentTemplate, event: React.DragEvent) => void;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
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
    id: 'enphase_iq8m_microinverter_template',
    name: 'Enphase IQ8M Microinverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#2563eb',
    defaultSize: { width: 60, height: 40 },
    description: 'Enphase IQ8M microinverter - 330W peak output',
    manufacturer: 'Enphase',
    model: 'IQ8M-72-2-US',
    specifications: {
      inverterType: 'micro',
      acOutputKW: 0.33,
      dcInputVoltage: 60,
      dcInputCurrent: 14,
      acOutputVoltage: 240,
      efficiency: 0.976,
      cecEfficiency: 0.97,
      mpptChannels: 1,
      gridForming: true,
      maxModulePower: 540,
      moduleCompatibility: '290-540W',
      dimensions: { length: 212, width: 175, unit: 'mm' },
      operatingTemp: '-40°C to +65°C',
      warranty: '25 years',
      certification: 'UL 1741, IEC 61730'
    }
  },
  {
    id: 'enphase_iq8ac_microinverter_template',
    name: 'Enphase IQ8AC Microinverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#2563eb',
    defaultSize: { width: 60, height: 40 },
    description: 'Enphase IQ8AC microinverter - 366W peak output',
    manufacturer: 'Enphase',
    model: 'IQ8AC',
    specifications: {
      inverterType: 'micro',
      acOutputKW: 0.366,
      dcInputVoltage: 60,
      acOutputVoltage: 240,
      efficiency: 0.975,
      mpptChannels: 1,
      maxModulePower: 560
    }
  },
  {
    id: 'enphase_iq8hc_microinverter_template',
    name: 'Enphase IQ8HC Microinverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#2563eb',
    defaultSize: { width: 60, height: 40 },
    description: 'Enphase IQ8HC microinverter - 384W peak output',
    manufacturer: 'Enphase',
    model: 'IQ8HC',
    specifications: {
      inverterType: 'micro',
      acOutputKW: 0.384,
      dcInputVoltage: 60,
      acOutputVoltage: 240,
      efficiency: 0.975,
      mpptChannels: 1,
      maxModulePower: 560
    }
  },
  {
    id: 'enphase_iq8p_3p_commercial_template',
    name: 'Enphase IQ8P-3P Commercial',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#2563eb',
    defaultSize: { width: 80, height: 60 },
    description: 'Enphase IQ8P-3P commercial microinverter - 480W peak',
    manufacturer: 'Enphase',
    model: 'IQ8P-3P',
    specifications: {
      inverterType: 'micro',
      acOutputKW: 0.48,
      dcInputVoltage: 60,
      acOutputVoltage: 208,
      efficiency: 0.975,
      mpptChannels: 1,
      phases: 3,
      maxModulePower: 640,
      application: 'commercial'
    }
  },
  {
    id: 'string_inverter_template',
    name: 'String Inverter',
    category: 'Solar',
    type: 'inverter',
    icon: Zap,
    color: '#2563eb',
    defaultSize: { width: 80, height: 80 },
    description: 'Traditional string inverter',
    specifications: {
      inverterType: 'string',
      acOutputKW: 7.6,
      dcInputVoltage: 480,
      acOutputVoltage: 240,
      efficiency: 0.97,
      mpptChannels: 2
    }
  },
  {
    id: 'dc_disconnect_template',
    name: 'DC Disconnect',
    category: 'Solar',
    type: 'dc_disconnect',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'DC disconnect switch',
    specifications: {
      rating: '30A',
      voltage: 600,
      fusible: false,
      necLabel: 'PV SYSTEM DISCONNECT'
    }
  },
  {
    id: 'ac_disconnect_template',
    name: 'AC Disconnect',
    category: 'Solar',
    type: 'ac_disconnect',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'AC disconnect switch',
    specifications: {
      rating: '40A',
      voltage: 240,
      fusible: false,
      necLabel: 'PV SYSTEM DISCONNECT'
    }
  },

  // Battery Components - Tesla
  {
    id: 'tesla_powerwall_3_template',
    name: 'Tesla Powerwall 3',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 100, height: 80 },
    description: 'Tesla Powerwall 3 with integrated solar inverter',
    manufacturer: 'Tesla',
    model: 'Powerwall 3',
    specifications: {
      batteryType: 'tesla_powerwall_3',
      capacityKWh: 13.5,
      powerKW: 11.5,
      continuousPowerKW: 11.5,
      peakPowerKW: 30,
      chargePowerKW: 3.3,
      voltage: 240,
      coupling: 'ac',
      backupCapable: true,
      installedWeight: 132,
      dimensions: { height: 1050, width: 609, depth: 193, unit: 'mm' },
      operatingTemp: '-20°C to 50°C',
      ipRating: 'IP67',
      warranty: '10 years',
      integratedSolarInverter: true,
      mpptInputs: 6,
      maxSolarDCInput: '20kW',
      backupSwitchCompatible: true,
      pvInputs: 6,
      backupSwitch: true,
      integratedInverter: true,
      operatingTemp: '-20°C to 50°C',
      warranty: '10 years'
    }
  },
  {
    id: 'tesla_powerwall_3_expansion_template',
    name: 'Tesla Powerwall 3 Expansion',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 100, height: 80 },
    description: 'Tesla Powerwall 3 Expansion unit - 13.5 kWh additional capacity',
    manufacturer: 'Tesla',
    model: 'Powerwall 3 Expansion',
    specifications: {
      batteryType: 'tesla_powerwall_3_expansion',
      capacityKWh: 13.5,
      powerKW: 0, // No power conversion
      voltage: 240,
      coupling: 'dc',
      backupCapable: true,
      expansionUnit: true,
      requiresMainPowerwall: true
    }
  },
  {
    id: 'tesla_megapack_template',
    name: 'Tesla Megapack',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 200, height: 120 },
    description: 'Tesla Megapack utility-scale battery storage',
    manufacturer: 'Tesla',
    model: 'Megapack',
    specifications: {
      batteryType: 'tesla_megapack',
      capacityKWh: 3900, // 3.9 MWh
      powerKW: 1900, // 1.9 MW
      voltage: 480,
      coupling: 'ac',
      application: 'utility',
      cellType: 'LFP',
      containerSize: 'shipping_container'
    }
  },

  // Battery Components - Enphase
  {
    id: 'enphase_iq_battery_3t_template',
    name: 'Enphase IQ Battery 3T',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 80, height: 60 },
    description: 'Enphase IQ Battery 3T - 3.36 kWh',
    manufacturer: 'Enphase',
    model: 'IQ Battery 3T',
    specifications: {
      batteryType: 'enphase_iq3t',
      capacityKWh: 3.36,
      usableCapacityKWh: 3.2,
      powerKW: 1.28,
      voltage: 240,
      coupling: 'ac',
      backupCapable: true,
      microinverterIncluded: true,
      warranty: '15 years'
    }
  },
  {
    id: 'enphase_iq_battery_10t_template',
    name: 'Enphase IQ Battery 10T',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 100, height: 80 },
    description: 'Enphase IQ Battery 10T - 10.08 kWh',
    manufacturer: 'Enphase',
    model: 'IQ Battery 10T',
    specifications: {
      batteryType: 'enphase_iq10t',
      capacityKWh: 10.08,
      usableCapacityKWh: 10.1,
      powerKW: 3.84,
      voltage: 240,
      coupling: 'ac',
      backupCapable: true,
      microinverterIncluded: true,
      warranty: '15 years'
    }
  },
  {
    id: 'enphase_iq_battery_10c_template',
    name: 'Enphase IQ Battery 10C',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 100, height: 80 },
    description: 'Enphase IQ Battery 10C - 10 kWh compact design with LFP chemistry',
    manufacturer: 'Enphase',
    model: 'IQBATTERY-10C-1P-NA',
    specifications: {
      batteryType: 'enphase_iq10c',
      capacityKWh: 10.0,
      usableCapacityKWh: 10.0,
      powerKVA: 7.08,
      peakPowerKVA: 14.16,
      voltage: 240,
      coupling: 'ac',
      backupCapable: true,
      chemistry: 'LFP', // Lithium iron phosphate
      cobaltFree: true,
      microinverterCount: 4, // Four IQ8B microinverters
      microinverterModel: 'IQ8BL/IQ8BN',
      batteryUnits: 2, // Two 5.0 kWh units
      cycles: 6000,
      warranty: '15 years',
      certification: 'UL 9540A',
      passivelyCooled: true,
      mountingOptions: ['wall_bracket', 'floor_pedestal'],
      envoyCompatible: true,
      iqCombiner6cCompatible: true,
      operatingTemp: '-20°C to 50°C'
    }
  },
  {
    id: 'enphase_iq_battery_5p_template',
    name: 'Enphase IQ Battery 5P',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 90, height: 70 },
    description: 'Enphase IQ Battery 5P - 5 kWh high power output',
    manufacturer: 'Enphase',
    model: 'IQ Battery 5P',
    specifications: {
      batteryType: 'enphase_iq5p',
      capacityKWh: 5.0,
      usableCapacityKWh: 4.96,
      powerKW: 7.68, // High power output
      peakPowerKW: 11.52,
      voltage: 240,
      coupling: 'ac',
      backupCapable: true,
      microinverterIncluded: true,
      highPowerDesign: true,
      warranty: '15 years'
    }
  },

  // Battery Components - Generic
  {
    id: 'generic_battery_template',
    name: 'Generic Battery Storage',
    category: 'Battery',
    type: 'battery',
    icon: Battery,
    color: '#16a34a',
    defaultSize: { width: 100, height: 80 },
    description: 'Generic battery energy storage system',
    specifications: {
      batteryType: 'generic_ac',
      capacityKWh: 13.5,
      powerKW: 7.2,
      voltage: 240,
      coupling: 'ac',
      backupCapable: true
    }
  },

  // Protection and Control Components - Square D
  {
    id: 'square_d_qo_breaker_template',
    name: 'Square D QO Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'Square D QO circuit breaker with Visi-Trip indicator',
    manufacturer: 'Square D',
    model: 'QO',
    specifications: {
      rating: '50A',
      poles: 2,
      breakerType: 'standard',
      voltage: 240,
      icRating: '22kA',
      visiTrip: true,
      series: 'QO',
      width: '3/4 inch'
    }
  },
  {
    id: 'square_d_homeline_breaker_template',
    name: 'Square D Homeline Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'Square D Homeline circuit breaker - value series',
    manufacturer: 'Square D',
    model: 'HOM',
    specifications: {
      rating: '50A',
      poles: 2,
      breakerType: 'standard',
      voltage: 240,
      icRating: '10kA',
      series: 'Homeline',
      width: '1 inch'
    }
  },

  // Protection - Eaton
  {
    id: 'eaton_br_breaker_template',
    name: 'Eaton BR Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'Eaton BR 1-inch circuit breaker',
    manufacturer: 'Eaton',
    model: 'BR',
    specifications: {
      rating: '50A',
      poles: 2,
      breakerType: 'standard',
      voltage: 240,
      icRating: '10kA',
      series: 'BR',
      width: '1 inch'
    }
  },
  {
    id: 'eaton_ch_breaker_template',
    name: 'Eaton CH Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'Eaton CH 3/4-inch circuit breaker with lifetime warranty',
    manufacturer: 'Eaton',
    model: 'CH',
    specifications: {
      rating: '50A',
      poles: 2,
      breakerType: 'standard',
      voltage: 240,
      icRating: '25kA',
      series: 'CH',
      width: '3/4 inch',
      warranty: 'lifetime'
    }
  },

  // Generic Breaker
  {
    id: 'circuit_breaker_template',
    name: 'Circuit Breaker',
    category: 'Protection',
    type: 'breaker',
    icon: Square,
    color: '#dc2626',
    defaultSize: { width: 60, height: 40 },
    description: 'Generic circuit breaker for overcurrent protection',
    specifications: {
      rating: '50A',
      poles: 2,
      breakerType: 'standard',
      voltage: 240,
      icRating: '10kA'
    }
  },
  {
    id: 'fuse_template',
    name: 'Fuse',
    category: 'Protection',
    type: 'fuse',
    icon: Minus,
    color: '#dc2626',
    defaultSize: { width: 40, height: 20 },
    description: 'Fuse for overcurrent protection',
    specifications: {
      rating: '30A',
      voltage: 600,
      fuseType: 'time_delay',
      breakingCapacity: '200kA'
    }
  },
  {
    id: 'relay_template',
    name: 'Protective Relay',
    category: 'Protection',
    type: 'relay',
    icon: Settings,
    color: '#7c3aed',
    defaultSize: { width: 50, height: 50 },
    description: 'Protective relay for system protection',
    specifications: {
      relayType: 'overcurrent',
      setting: '150A',
      timeDelay: '0.5s',
      curves: 'inverse'
    }
  },
  {
    id: 'surge_protector_template',
    name: 'Surge Protector',
    category: 'Protection',
    type: 'surge_protector',
    icon: Shield,
    color: '#059669',
    defaultSize: { width: 60, height: 30 },
    description: 'Surge protection device',
    specifications: {
      maxVoltage: '275V',
      maxSurge: '40kA',
      responseTime: '<1ns',
      type: 'Type 2'
    }
  },

  // Transformers
  {
    id: 'power_transformer_template',
    name: 'Power Transformer',
    category: 'Transformers',
    type: 'transformer',
    icon: Circle,
    color: '#f59e0b',
    defaultSize: { width: 100, height: 80 },
    description: 'Power transformer for voltage conversion',
    specifications: {
      primaryVoltage: '13.8kV',
      secondaryVoltage: '480V',
      capacity: '1000kVA',
      connection: 'Delta-Wye',
      impedance: '5.75%'
    }
  },
  {
    id: 'current_transformer_template',
    name: 'Current Transformer',
    category: 'Transformers',
    type: 'current_transformer',
    icon: Circle,
    color: '#2563eb',
    defaultSize: { width: 40, height: 40 },
    description: 'Current transformer for measurement',
    specifications: {
      primaryRating: '1000A',
      secondaryRating: '5A',
      ratio: '200:1',
      accuracy: '0.3',
      burden: '2.5VA'
    }
  },
  {
    id: 'potential_transformer_template',
    name: 'Potential Transformer',
    category: 'Transformers',
    type: 'potential_transformer',
    icon: Triangle,
    color: '#2563eb',
    defaultSize: { width: 40, height: 40 },
    description: 'Potential transformer for measurement',
    specifications: {
      primaryVoltage: '13.8kV',
      secondaryVoltage: '120V',
      ratio: '115:1',
      accuracy: '0.3',
      burden: '75VA'
    }
  },

  // Motors and Drives
  {
    id: 'motor_template',
    name: 'Induction Motor',
    category: 'Motors',
    type: 'motor',
    icon: Settings,
    color: '#059669',
    defaultSize: { width: 80, height: 60 },
    description: 'Three-phase induction motor',
    specifications: {
      power: '50HP',
      voltage: '480V',
      current: '65A',
      speed: '1750RPM',
      efficiency: '94.1%',
      powerFactor: '0.85'
    }
  },
  {
    id: 'vfd_template',
    name: 'Variable Frequency Drive',
    category: 'Motors',
    type: 'vfd',
    icon: Gauge,
    color: '#7c3aed',
    defaultSize: { width: 80, height: 100 },
    description: 'Variable frequency drive for motor control',
    specifications: {
      power: '50HP',
      inputVoltage: '480V',
      outputVoltage: '0-480V',
      efficiency: '97%',
      features: ['Bypass', 'Soft Start', 'PID Control']
    }
  },
  {
    id: 'motor_starter_template',
    name: 'Motor Starter',
    category: 'Motors',
    type: 'motor_starter',
    icon: Power,
    color: '#dc2626',
    defaultSize: { width: 60, height: 80 },
    description: 'Motor starter with overload protection',
    specifications: {
      motorPower: '25HP',
      voltage: '480V',
      overloadRange: '23-32A',
      contactorType: 'NEMA Size 3',
      enclosure: 'NEMA 1'
    }
  },

  // Generators
  {
    id: 'generator_template',
    name: 'Emergency Generator',
    category: 'Generation',
    type: 'generator',
    icon: Zap,
    color: '#f59e0b',
    defaultSize: { width: 120, height: 80 },
    description: 'Emergency backup generator',
    specifications: {
      power: '500kW',
      voltage: '480V',
      fuelType: 'Diesel',
      fuelCapacity: '500 gallons',
      runtime: '24 hours',
      transferTime: '10 seconds'
    }
  },
  {
    id: 'ups_template',
    name: 'UPS System',
    category: 'Generation',
    type: 'ups',
    icon: Battery,
    color: '#059669',
    defaultSize: { width: 100, height: 80 },
    description: 'Uninterruptible power supply',
    specifications: {
      power: '100kVA',
      voltage: '480V',
      batteryTime: '15 minutes',
      efficiency: '96%',
      inputPF: '0.99'
    }
  },

  // Load Components
  {
    id: 'lighting_load_template',
    name: 'Lighting Load',
    category: 'Loads',
    type: 'lighting_load',
    icon: Lightbulb,
    color: '#f59e0b',
    defaultSize: { width: 60, height: 40 },
    description: 'General lighting load',
    specifications: {
      power: '5kW',
      voltage: '277V',
      lightingType: 'LED',
      controlType: 'Occupancy Sensor',
      demandFactor: '0.9'
    }
  },
  {
    id: 'hvac_load_template',
    name: 'HVAC Load',
    category: 'Loads',
    type: 'hvac_load',
    icon: Fan,
    color: '#2563eb',
    defaultSize: { width: 80, height: 60 },
    description: 'HVAC system load',
    specifications: {
      coolingLoad: '50 tons',
      heatingLoad: '200kW',
      fanPower: '25HP',
      voltage: '480V',
      efficiency: 'SEER 16'
    }
  },
  {
    id: 'receptacle_load_template',
    name: 'Receptacle Load',
    category: 'Loads',
    type: 'receptacle_load',
    icon: Plug,
    color: '#6b7280',
    defaultSize: { width: 40, height: 30 },
    description: 'General receptacle load',
    specifications: {
      power: '2.5kW',
      voltage: '120V',
      receptacleType: 'GFCI',
      quantity: '20',
      demandFactor: '0.5'
    }
  },

  // Junction Boxes and Enclosures
  {
    id: 'junction_box_template',
    name: 'Junction Box',
    category: 'Distribution',
    type: 'junction_box',
    icon: Square,
    color: '#6b7280',
    defaultSize: { width: 60, height: 60 },
    description: 'Electrical junction box for wire connections',
    specifications: {
      size: '8" x 8" x 4"',
      material: 'Steel',
      finish: 'Gray painted',
      mounting: 'Surface',
      entries: '8 knockouts',
      rating: 'NEMA 1'
    }
  },
  {
    id: 'pull_box_template',
    name: 'Pull Box',
    category: 'Distribution',
    type: 'pull_box',
    icon: Square,
    color: '#6b7280',
    defaultSize: { width: 80, height: 60 },
    description: 'Large pull box for cable routing',
    specifications: {
      size: '12" x 12" x 6"',
      material: 'Galvanized Steel',
      finish: 'Hot-dip galvanized',
      mounting: 'Surface/Flush',
      entries: '12 knockouts',
      rating: 'NEMA 3R'
    }
  },
  // Enphase Combiner and Monitoring Equipment
  {
    id: 'enphase_iq_combiner_6c_template',
    name: 'Enphase IQ Combiner 6C',
    category: 'Solar',
    type: 'combiner_box',
    icon: Grid,
    color: '#f59e0b',
    defaultSize: { width: 100, height: 120 },
    description: 'Enphase IQ Combiner 6C - 6 PV breakers + battery breaker',
    manufacturer: 'Enphase',
    model: 'IQ Combiner 6C',
    specifications: {
      pvBreakers: 6,
      batteryBreaker: true,
      evBreaker: false,
      meteringCTs: true,
      maxCurrent: 60,
      voltage: 240,
      busRating: '100A',
      integrationReady: true
    }
  },
  {
    id: 'enphase_iq_combiner_6_template',
    name: 'Enphase IQ Combiner 6',
    category: 'Solar',
    type: 'combiner_box',
    icon: Grid,
    color: '#f59e0b',
    defaultSize: { width: 90, height: 100 },
    description: 'Enphase IQ Combiner 6 - 6 PV breakers only',
    manufacturer: 'Enphase',
    model: 'IQ Combiner 6',
    specifications: {
      pvBreakers: 6,
      batteryBreaker: false,
      evBreaker: false,
      meteringCTs: true,
      maxCurrent: 60,
      voltage: 240,
      busRating: '60A'
    }
  },
  {
    id: 'enphase_iq_gateway_template',
    name: 'Enphase IQ Gateway',
    category: 'Measurement',
    type: 'monitoring',
    icon: Wifi,
    color: '#7c3aed',
    defaultSize: { width: 80, height: 60 },
    description: 'Enphase IQ Gateway for system monitoring and communication',
    manufacturer: 'Enphase',
    model: 'IQ Gateway',
    specifications: {
      communication: ['WiFi', 'Ethernet', 'Cellular'],
      monitoring: 'System level',
      dataLogging: 'Cloud based',
      appSupport: 'Enphase App',
      powerConsumption: '5W',
      mountingType: 'Wall mount'
    }
  },
  {
    id: 'generic_combiner_box_template',
    name: 'DC Combiner Box',
    category: 'Solar',
    type: 'combiner_box',
    icon: Grid,
    color: '#f59e0b',
    defaultSize: { width: 80, height: 100 },
    description: 'Generic DC combiner box for solar strings',
    specifications: {
      inputCircuits: '8',
      maxVoltage: '1000VDC',
      maxCurrent: '15A per string',
      fusing: 'DC fuses included',
      monitoring: 'String level monitoring',
      rating: 'NEMA 3R'
    }
  },
  {
    id: 'enclosure_template',
    name: 'Electrical Enclosure',
    category: 'Distribution',
    type: 'enclosure',
    icon: Square,
    color: '#374151',
    defaultSize: { width: 100, height: 120 },
    description: 'General purpose electrical enclosure',
    specifications: {
      size: '24" x 36" x 8"',
      material: 'Carbon Steel',
      finish: 'Powder coated',
      door: 'Hinged with lock',
      mounting: 'Wall mount',
      rating: 'NEMA 12'
    }
  },

  // Electrical Meters and Measurement
  {
    id: 'power_meter_template',
    name: 'Digital Power Meter',
    category: 'Measurement',
    type: 'power_meter',
    icon: Gauge,
    color: '#7c3aed',
    defaultSize: { width: 60, height: 60 },
    description: 'Digital power meter with communication',
    specifications: {
      voltage: '480V',
      current: '5000A',
      accuracy: '0.2%',
      communication: 'Modbus RTU/TCP',
      parameters: ['kW', 'kVAR', 'kVA', 'PF', 'THD', 'Harmonics'],
      display: 'LCD with backlight'
    }
  },
  {
    id: 'utility_meter_template',
    name: 'Utility Revenue Meter',
    category: 'Measurement',
    type: 'utility_meter',
    icon: Gauge,
    color: '#059669',
    defaultSize: { width: 80, height: 100 },
    description: 'Utility company revenue meter',
    specifications: {
      type: 'Form 2S',
      voltage: '240V',
      current: '200A',
      accuracy: 'Class 0.2',
      demand: 'Thermal demand register',
      communication: 'AMI capable',
      certification: 'ANSI C12.20'
    }
  },
  {
    id: 'kwh_meter_template',
    name: 'kWh Energy Meter',
    category: 'Measurement',
    type: 'kwh_meter',
    icon: Clock,
    color: '#2563eb',
    defaultSize: { width: 60, height: 80 },
    description: 'Kilowatt-hour energy meter',
    specifications: {
      voltage: '480V',
      current: '800A',
      accuracy: '0.5%',
      pulseOutput: '1 pulse/kWh',
      display: '6-digit LCD',
      mounting: 'DIN rail'
    }
  },
  {
    id: 'production_meter_template',
    name: 'Solar Production Meter',
    category: 'Measurement',
    type: 'production_meter',
    icon: Sun,
    color: '#f59e0b',
    defaultSize: { width: 60, height: 60 },
    description: 'Solar energy production meter',
    specifications: {
      application: 'Net metering',
      voltage: '240V',
      current: '200A',
      accuracy: 'Class 0.2',
      bidirectional: true,
      communication: 'Cellular/Ethernet',
      certification: 'UL 2735'
    }
  },
  {
    id: 'submetering_template',
    name: 'Submeter',
    category: 'Measurement',
    type: 'submeter',
    icon: Gauge,
    color: '#6366f1',
    defaultSize: { width: 50, height: 60 },
    description: 'Tenant or circuit submeter',
    specifications: {
      voltage: '480V',
      current: '400A',
      accuracy: '1.0%',
      display: 'LED',
      pulseOutput: '1000 imp/kWh',
      mounting: 'Panel mount'
    }
  },
  {
    id: 'demand_meter_template',
    name: 'Demand Meter',
    category: 'Measurement',
    type: 'demand_meter',
    icon: Gauge,
    color: '#dc2626',
    defaultSize: { width: 60, height: 60 },
    description: 'Peak demand monitoring meter',
    specifications: {
      demandInterval: '15 minutes',
      voltage: '480V',
      current: '2000A',
      accuracy: '0.5%',
      memory: '35 day storage',
      alarm: 'Demand limit alarm'
    }
  },
  {
    id: 'multifunction_meter_template',
    name: 'Multifunction Meter',
    category: 'Measurement',
    type: 'multifunction_meter',
    icon: Monitor,
    color: '#7c3aed',
    defaultSize: { width: 80, height: 60 },
    description: 'Advanced multifunction power meter',
    specifications: {
      voltage: '600V',
      current: '6000A',
      accuracy: '0.1%',
      parameters: ['V', 'A', 'kW', 'kVAR', 'kVA', 'PF', 'Hz', 'THD'],
      communication: ['Modbus', 'BACnet', 'Ethernet/IP'],
      display: 'Color TFT',
      dataLogging: '8MB memory'
    }
  },
  {
    id: 'control_panel_template',
    name: 'Control Panel',
    category: 'Control',
    type: 'control_panel',
    icon: Monitor,
    color: '#374151',
    defaultSize: { width: 100, height: 80 },
    description: 'Electrical control panel',
    specifications: {
      voltage: '480/277V',
      enclosure: 'NEMA 1',
      size: '72" x 36" x 12"',
      components: ['PLC', 'HMI', 'I/O Modules'],
      communication: 'Ethernet/IP'
    }
  },

  // Communication and Safety
  {
    id: 'fire_alarm_panel_template',
    name: 'Fire Alarm Panel',
    category: 'Safety',
    type: 'fire_alarm_panel',
    icon: AlertTriangle,
    color: '#dc2626',
    defaultSize: { width: 80, height: 60 },
    description: 'Fire alarm control panel',
    specifications: {
      zones: '99',
      voltage: '24VDC',
      batteryBackup: '24 hours',
      communication: 'Network',
      certification: 'UL 864'
    }
  },
  {
    id: 'security_panel_template',
    name: 'Security Panel',
    category: 'Safety',
    type: 'security_panel',
    icon: Shield,
    color: '#7c3aed',
    defaultSize: { width: 60, height: 40 },
    description: 'Security system control panel',
    specifications: {
      zones: '32',
      voltage: '12VDC',
      communication: 'IP/Cellular',
      features: ['Intrusion', 'Access Control']
    }
  },

  // EVSE Components
  {
    id: 'evse_charger_template',
    name: 'EVSE Charger',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Electric vehicle charging station',
    specifications: {
      powerKW: 11.5,
      voltage: 240,
      current: 48,
      level: 2,
      dedicatedCircuit: true
    }
  },
  {
    id: 'tesla_wall_connector_template',
    name: 'Tesla Wall Connector',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Tesla Wall Connector Gen 3 - 48A hardwired',
    manufacturer: 'Tesla',
    model: 'Wall Connector Gen 3',
    specifications: {
      powerKW: 11.5,
      voltage: 240,
      current: 48,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'Tesla Proprietary',
      installationType: 'hardwired',
      cableLength: '18 ft',
      temperatureRange: '-30°C to 50°C',
      enclosureRating: 'NEMA 4',
      warranty: '4 years'
    }
  },

  // ChargePoint EVSE
  {
    id: 'chargepoint_home_flex_template',
    name: 'ChargePoint Home Flex',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'ChargePoint Home Flex - 50A adjustable EVSE',
    manufacturer: 'ChargePoint',
    model: 'CPH50',
    specifications: {
      powerKW: 12,
      voltage: 240,
      current: 50,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired/plug-in',
      cableLength: '23 ft',
      ampAdjustable: true,
      ampSettings: [16, 20, 24, 32, 40, 50],
      wifiConnected: true,
      scheduling: true,
      energyTracking: true,
      enclosureRating: 'NEMA 4',
      warranty: '3 years'
    }
  },
  {
    id: 'chargepoint_cp4321_template',
    name: 'ChargePoint CP4321',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'ChargePoint CP4321 Commercial Station',
    manufacturer: 'ChargePoint',
    model: 'CP4321',
    specifications: {
      powerKW: 7.7,
      voltage: 240,
      current: 32,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '18 ft',
      networkConnected: true,
      paymentSystem: true,
      accessControl: 'RFID/App',
      enclosureRating: 'NEMA 4',
      application: 'commercial',
      warranty: '3 years'
    }
  },

  // JuiceBox EVSE
  {
    id: 'juicebox_40_template',
    name: 'JuiceBox 40',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'JuiceBox 40 Smart EVSE - 40A WiFi enabled',
    manufacturer: 'Enel X',
    model: 'JuiceBox 40',
    specifications: {
      powerKW: 9.6,
      voltage: 240,
      current: 40,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '20 ft',
      wifiConnected: true,
      scheduling: true,
      loadSharing: true,
      energyTracking: true,
      voiceControl: 'Alexa/Google',
      enclosureRating: 'NEMA 4',
      warranty: '3 years'
    }
  },
  {
    id: 'juicebox_32_template',
    name: 'JuiceBox 32',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'JuiceBox 32 Smart EVSE - 32A WiFi enabled',
    manufacturer: 'Enel X',
    model: 'JuiceBox 32',
    specifications: {
      powerKW: 7.7,
      voltage: 240,
      current: 32,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '20 ft',
      wifiConnected: true,
      scheduling: true,
      energyTracking: true,
      enclosureRating: 'NEMA 4',
      warranty: '3 years'
    }
  },

  // ClipperCreek EVSE
  {
    id: 'clippercreek_hcs50_template',
    name: 'ClipperCreek HCS-50',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'ClipperCreek HCS-50 Residential EVSE - 40A',
    manufacturer: 'ClipperCreek',
    model: 'HCS-50',
    specifications: {
      powerKW: 9.6,
      voltage: 240,
      current: 40,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '25 ft',
      wifiConnected: false,
      reliability: 'industrial_grade',
      mtbf: '200,000 hours',
      enclosureRating: 'NEMA 4',
      temperatureRange: '-30°C to 50°C',
      warranty: '3 years',
      madeinUSA: true
    }
  },
  {
    id: 'clippercreek_hcs40_template',
    name: 'ClipperCreek HCS-40',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'ClipperCreek HCS-40 Residential EVSE - 32A',
    manufacturer: 'ClipperCreek',
    model: 'HCS-40',
    specifications: {
      powerKW: 7.7,
      voltage: 240,
      current: 32,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '25 ft',
      wifiConnected: false,
      reliability: 'industrial_grade',
      enclosureRating: 'NEMA 4',
      warranty: '3 years',
      madeinUSA: true
    }
  },

  // Webasto EVSE
  {
    id: 'webasto_turbocord_template',
    name: 'Webasto TurboCord',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Webasto TurboCord Dual Voltage Portable EVSE',
    manufacturer: 'Webasto',
    model: 'TurboCord',
    specifications: {
      powerKW: 3.3,
      voltage: '120/240V',
      current: '12A/16A',
      level: '1/2',
      dedicatedCircuit: false,
      connectorType: 'J1772',
      installationType: 'portable',
      cableLength: '20 ft',
      plugTypes: ['NEMA 5-15', 'NEMA 14-50'],
      dualVoltage: true,
      portability: true,
      enclosureRating: 'IP65',
      warranty: '3 years'
    }
  },
  {
    id: 'webasto_pure_template',
    name: 'Webasto Pure',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Webasto Pure Wall-mounted EVSE - 32A',
    manufacturer: 'Webasto',
    model: 'Pure',
    specifications: {
      powerKW: 7.7,
      voltage: 240,
      current: 32,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '20 ft',
      design: 'minimalist',
      enclosureRating: 'NEMA 4',
      temperatureRange: '-30°C to 50°C',
      warranty: '3 years'
    }
  },

  // Grizzl-E EVSE
  {
    id: 'grizzl_e_classic_template',
    name: 'Grizzl-E Classic',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Grizzl-E Classic EVSE - 40A Canadian made',
    manufacturer: 'Grizzl-E',
    model: 'Classic',
    specifications: {
      powerKW: 9.6,
      voltage: 240,
      current: 40,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '24 ft',
      temperatureRange: '-50°C to 60°C',
      enclosureRating: 'NEMA 4',
      coldWeatherTested: true,
      warranty: '3 years',
      madeInCanada: true
    }
  },
  {
    id: 'grizzl_e_smart_template',
    name: 'Grizzl-E Smart',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Grizzl-E Smart WiFi EVSE - 40A with app control',
    manufacturer: 'Grizzl-E',
    model: 'Smart',
    specifications: {
      powerKW: 9.6,
      voltage: 240,
      current: 40,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '24 ft',
      wifiConnected: true,
      scheduling: true,
      energyTracking: true,
      loadSharing: true,
      temperatureRange: '-50°C to 60°C',
      enclosureRating: 'NEMA 4',
      warranty: '3 years',
      madeInCanada: true
    }
  },

  // Siemens EVSE
  {
    id: 'siemens_us2_template',
    name: 'Siemens US2',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Siemens US2 VersiCharge EVSE - 50A adjustable',
    manufacturer: 'Siemens',
    model: 'US2',
    specifications: {
      powerKW: 12,
      voltage: 240,
      current: 50,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '18 ft',
      ampAdjustable: true,
      ampSettings: [16, 20, 24, 32, 40, 50],
      wifiConnected: true,
      scheduling: true,
      energyTracking: true,
      enclosureRating: 'NEMA 4',
      warranty: '3 years'
    }
  },

  // Leviton EVSE
  {
    id: 'leviton_evr40_template',
    name: 'Leviton EVR40',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Leviton EVR40 Evr-Green EVSE - 40A',
    manufacturer: 'Leviton',
    model: 'EVR40',
    specifications: {
      powerKW: 9.6,
      voltage: 240,
      current: 40,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '18 ft',
      wifiConnected: true,
      scheduling: true,
      energyTracking: true,
      voiceControl: 'Alexa',
      enclosureRating: 'NEMA 4',
      warranty: '3 years'
    }
  },
  {
    id: 'leviton_evb40_template',
    name: 'Leviton EVB40',
    category: 'EVSE',
    type: 'evse_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 80, height: 60 },
    description: 'Leviton EVB40 Basic EVSE - 40A hardwired',
    manufacturer: 'Leviton',
    model: 'EVB40',
    specifications: {
      powerKW: 9.6,
      voltage: 240,
      current: 40,
      level: 2,
      dedicatedCircuit: true,
      connectorType: 'J1772',
      installationType: 'hardwired',
      cableLength: '18 ft',
      wifiConnected: false,
      basicModel: true,
      enclosureRating: 'NEMA 4',
      warranty: '3 years'
    }
  },

  // Commercial/DC Fast Charging
  {
    id: 'evgo_dcfc_template',
    name: 'EVgo DC Fast Charger',
    category: 'EVSE',
    type: 'dcfc_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 120, height: 100 },
    description: 'EVgo 350kW DC Fast Charging Station',
    manufacturer: 'EVgo',
    model: 'DCFC-350',
    specifications: {
      powerKW: 350,
      voltage: '400-920V DC',
      current: '500A',
      level: 3,
      dedicatedCircuit: true,
      connectorType: 'CCS/CHAdeMO',
      installationType: 'commercial',
      networkConnected: true,
      paymentSystem: true,
      accessControl: 'RFID/App/Credit',
      cableLength: '12 ft',
      coolingSystem: 'liquid_cooled',
      application: 'highway/commercial',
      powerSharingCapable: true,
      warranty: '5 years'
    }
  },
  {
    id: 'electrify_america_dcfc_template',
    name: 'Electrify America DCFC',
    category: 'EVSE',
    type: 'dcfc_charger',
    icon: Car,
    color: '#9333ea',
    defaultSize: { width: 120, height: 100 },
    description: 'Electrify America 150kW DC Fast Charger',
    manufacturer: 'Electrify America',
    model: 'DCFC-150',
    specifications: {
      powerKW: 150,
      voltage: '50-920V DC',
      current: '300A',
      level: 3,
      dedicatedCircuit: true,
      connectorType: 'CCS',
      installationType: 'commercial',
      networkConnected: true,
      paymentSystem: true,
      accessControl: 'App/Credit',
      cableLength: '12 ft',
      coolingSystem: 'air_cooled',
      application: 'retail/highway',
      warranty: '5 years'
    }
  },

  // Load Management Systems
  {
    id: 'simpleswitch_load_manager_template',
    name: 'SimpleSwitch Load Manager',
    category: 'EVSE',
    type: 'load_manager',
    icon: Settings,
    color: '#9333ea',
    defaultSize: { width: 100, height: 80 },
    description: 'SimpleSwitch UL 916 Branch Circuit Sharing System',
    manufacturer: 'SimpleSwitch',
    model: 'SS-50-240',
    specifications: {
      maxCapacity: '50A/12kW',
      voltage: 240,
      managedLoads: 2,
      ul916Certified: true,
      necCompliant: '625.42',
      loadTypes: ['EVSE', 'Heat Pump', 'Pool Equipment'],
      communicationProtocol: 'hardwired',
      responseTime: '<100ms',
      installationType: 'panel_mount',
      enclosureRating: 'NEMA 1',
      warranty: '10 years'
    }
  },
  {
    id: 'span_smart_panel_template',
    name: 'Span Smart Panel',
    category: 'EVSE',
    type: 'smart_panel',
    icon: Monitor,
    color: '#9333ea',
    defaultSize: { width: 120, height: 160 },
    description: 'Span Smart Electrical Panel with EV load management',
    manufacturer: 'Span',
    model: 'Smart Panel',
    specifications: {
      rating: 200,
      voltage: 240,
      phase: 1,
      spaces: 32,
      evLoadManagement: true,
      realTimeMonitoring: true,
      appControl: true,
      backupCapable: true,
      circuitLevelControl: true,
      loadShedding: true,
      solarIntegration: true,
      batteryIntegration: true,
      enclosureRating: 'NEMA 1',
      warranty: '10 years'
    }
  },

  // Distribution Components - Square D QO Panels
  {
    id: 'square_d_qo_100a_panel_template',
    name: 'Square D QO 100A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 100, height: 80 },
    description: 'Square D QO 100A main panel with 24 spaces',
    manufacturer: 'Square D',
    model: 'QO124M100PC',
    specifications: {
      rating: 100,
      busRating: 100,
      voltage: 240,
      phase: 1,
      spaces: 24,
      groundingElectrode: true,
      series: 'QO',
      breakerCompatibility: 'QO 3/4 inch',
      shortCircuitRating: '22kA/10kA',
      plugOnNeutral: true
    }
  },
  {
    id: 'square_d_qo_200a_panel_template',
    name: 'Square D QO 200A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 120, height: 160 },
    description: 'Square D QO 200A main panel with 40 spaces and dual main breakers',
    manufacturer: 'Square D',
    model: 'QO140M200PC',
    specifications: {
      rating: 200,
      busRating: 200,
      voltage: 240,
      phase: 1,
      spaces: 40,
      groundingElectrode: true,
      series: 'QO',
      breakerCompatibility: 'QO 3/4 inch',
      shortCircuitRating: '22kA/10kA',
      plugOnNeutral: true,
      solarReady: true,
      mainBreakerType: 'dual',
      mainBreakerRating: '2x100A',
      meterSocket: false,
      solarSidecar: false,
      fusedPullout: false,
      enclosureType: 'flush_mount',
      necArticle: '408.36'
    }
  },
  {
    id: 'square_d_qo_200a_meter_main_template',
    name: 'Square D QO 200A Meter Main',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 130, height: 180 },
    description: 'Square D QO 200A meter main combination with single main breaker',
    manufacturer: 'Square D',
    model: 'QO140M200PCRB',
    specifications: {
      rating: 200,
      busRating: 200,
      voltage: 240,
      phase: 1,
      spaces: 40,
      groundingElectrode: true,
      series: 'QO',
      breakerCompatibility: 'QO 3/4 inch',
      shortCircuitRating: '22kA/10kA',
      plugOnNeutral: true,
      solarReady: true,
      mainBreakerType: 'single',
      mainBreakerRating: '200A',
      meterSocket: true,
      meterSocketType: 'Form 2S',
      solarSidecar: false,
      fusedPullout: false,
      enclosureType: 'surface_mount',
      ringlessDesign: true,
      necArticle: '408.36'
    }
  },
  {
    id: 'square_d_qo_200a_solar_ready_template',
    name: 'Square D QO 200A Solar Ready',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 150, height: 160 },
    description: 'Square D QO 200A main panel with solar production meter sidecar',
    manufacturer: 'Square D',
    model: 'QO140M200PCSRB',
    specifications: {
      rating: 200,
      busRating: 200,
      voltage: 240,
      phase: 1,
      spaces: 40,
      groundingElectrode: true,
      series: 'QO',
      breakerCompatibility: 'QO 3/4 inch',
      shortCircuitRating: '22kA/10kA',
      plugOnNeutral: true,
      solarReady: true,
      mainBreakerType: 'single',
      mainBreakerRating: '200A',
      meterSocket: false,
      solarSidecar: true,
      solarMeterType: 'production_meter',
      solarBreakerSpace: '100A',
      fusedPullout: false,
      enclosureType: 'flush_mount',
      necArticle: '705.12'
    }
  },

  // Square D Homeline Panels
  {
    id: 'square_d_homeline_100a_panel_template',
    name: 'Square D Homeline 100A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 100, height: 80 },
    description: 'Square D Homeline 100A main panel - value series',
    manufacturer: 'Square D',
    model: 'HOM2424M100PC',
    specifications: {
      rating: 100,
      busRating: 100,
      voltage: 240,
      phase: 1,
      spaces: 24,
      groundingElectrode: true,
      series: 'Homeline',
      breakerCompatibility: 'HOM 1 inch',
      shortCircuitRating: '22kA/10kA',
      plugOnNeutral: true
    }
  },
  {
    id: 'square_d_homeline_200a_panel_template',
    name: 'Square D Homeline 200A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 120, height: 80 },
    description: 'Square D Homeline 200A main panel with 40 spaces',
    manufacturer: 'Square D',
    model: 'HOM4040M200PC',
    specifications: {
      rating: 200,
      busRating: 200,
      voltage: 240,
      phase: 1,
      spaces: 40,
      groundingElectrode: true,
      series: 'Homeline',
      breakerCompatibility: 'HOM 1 inch',
      shortCircuitRating: '22kA/10kA',
      plugOnNeutral: true
    }
  },

  // Eaton BR Panels
  {
    id: 'eaton_br_100a_panel_template',
    name: 'Eaton BR 100A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 100, height: 80 },
    description: 'Eaton BR 100A main panel with 20 spaces',
    manufacturer: 'Eaton',
    model: 'BR2020B100',
    specifications: {
      rating: 100,
      busRating: 100,
      voltage: 240,
      phase: 1,
      spaces: 20,
      groundingElectrode: true,
      series: 'BR',
      breakerCompatibility: 'BR 1 inch',
      plugOnNeutral: true,
      twinNeutralDesign: true
    }
  },
  {
    id: 'eaton_br_200a_panel_template',
    name: 'Eaton BR 200A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 120, height: 80 },
    description: 'Eaton BR 200A main panel with 40 spaces',
    manufacturer: 'Eaton',
    model: 'BR4040B200',
    specifications: {
      rating: 200,
      busRating: 200,
      voltage: 240,
      phase: 1,
      spaces: 40,
      groundingElectrode: true,
      series: 'BR',
      breakerCompatibility: 'BR 1 inch',
      plugOnNeutral: true,
      twinNeutralDesign: true
    }
  },

  // Eaton CH Panels
  {
    id: 'eaton_ch_125a_panel_template',
    name: 'Eaton CH 125A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 110, height: 80 },
    description: 'Eaton CH 125A main panel with 30 spaces and lifetime warranty',
    manufacturer: 'Eaton',
    model: 'CH3030B125',
    specifications: {
      rating: 125,
      busRating: 125,
      voltage: 240,
      phase: 1,
      spaces: 30,
      groundingElectrode: true,
      series: 'CH',
      breakerCompatibility: 'CH 3/4 inch',
      shortCircuitRating: '25kA',
      plugOnNeutral: true,
      warranty: 'lifetime',
      copperBus: true
    }
  },
  {
    id: 'eaton_ch_200a_panel_template',
    name: 'Eaton CH 200A Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 120, height: 80 },
    description: 'Eaton CH 200A main panel with 42 spaces and lifetime warranty',
    manufacturer: 'Eaton',
    model: 'CH4242B200',
    specifications: {
      rating: 200,
      busRating: 200,
      voltage: 240,
      phase: 1,
      spaces: 42,
      groundingElectrode: true,
      series: 'CH',
      breakerCompatibility: 'CH 3/4 inch',
      shortCircuitRating: '25kA',
      plugOnNeutral: true,
      warranty: 'lifetime',
      copperBus: true
    }
  },

  // 3-Phase Commercial Panels
  {
    id: 'eaton_ch_400a_3ph_panel_template',
    name: 'Eaton CH 400A 3-Phase Panel',
    category: 'Distribution',
    type: 'main_panel',
    icon: Grid,
    color: '#6b7280',
    defaultSize: { width: 150, height: 120 },
    description: 'Eaton CH 400A 3-phase commercial panel',
    manufacturer: 'Eaton',
    model: 'PRL3A0400G',
    specifications: {
      rating: 400,
      busRating: 400,
      voltage: 480,
      phase: 3,
      spaces: 42,
      groundingElectrode: true,
      series: 'CH',
      application: 'commercial',
      shortCircuitRating: '25kA'
    }
  },
  {
    id: 'grid_template',
    name: 'Utility Grid',
    category: 'Distribution',
    type: 'grid',
    icon: Zap,
    color: '#f59e0b',
    defaultSize: { width: 80, height: 60 },
    description: 'Utility grid connection',
    specifications: {
      serviceVoltage: 240,
      serviceType: 'overhead',
      meterType: 'smart',
      netMetering: true
    }
  },
  {
    id: 'grounding_electrode_template',
    name: 'Grounding Electrode',
    category: 'Distribution',
    type: 'grounding_electrode',
    icon: Triangle,
    color: '#92400e',
    defaultSize: { width: 40, height: 40 },
    description: 'Grounding electrode system',
    specifications: {
      electrodeType: 'rod',
      conductorSize: '6 AWG',
      bondingJumper: '6 AWG'
    }
  },

  // Tesla Gateway and Control Components
  {
    id: 'tesla_gateway_3_template',
    name: 'Tesla Gateway 3',
    category: 'Distribution',
    type: 'gateway',
    icon: Settings,
    color: '#e11d48',
    defaultSize: { width: 80, height: 100 },
    description: 'Tesla Gateway 3 - System control and monitoring for Powerwall 3',
    manufacturer: 'Tesla',
    model: 'Gateway 3',
    specifications: {
      maxServiceRating: '200A',
      voltage: '120/240V',
      phases: 'single_split',
      faultCurrent: '25kA', // with Eaton CSR/BWH breaker
      backupCapability: 'partial_or_whole_home',
      meteringCapability: true,
      gridTieControl: true,
      powerwall3Compatible: true,
      ethernetPorts: 2,
      communicationProtocol: 'TCP/IP',
      dimensions: { width: 406, height: 610, depth: 152, unit: 'mm' },
      operatingTemp: '-30°C to 60°C'
    }
  },
  {
    id: 'tesla_backup_switch_template',
    name: 'Tesla Backup Switch',
    category: 'Distribution',
    type: 'backup_switch',
    icon: Power,
    color: '#e11d48',
    defaultSize: { width: 100, height: 120 },
    description: 'Tesla Backup Switch - Automatic transfer switch for whole home backup',
    manufacturer: 'Tesla',
    model: 'Backup Switch',
    specifications: {
      maxServiceRating: '200A',
      voltage: '120/240V',
      phases: 'single_split',
      transferType: 'automatic',
      backupType: 'whole_home',
      meteringCapability: true,
      form2sMeterSocket: true,
      installationTime: 'reduced_by_6_hours',
      powerwall3Compatible: true,
      maxPowerwall3Units: 4,
      maxExpansionUnits: 3,
      canadaCertified: false,
      dimensions: { width: 508, height: 711, depth: 152, unit: 'mm' }
    }
  },
  {
    id: 'tesla_backup_gateway_2_template',
    name: 'Tesla Backup Gateway 2',
    category: 'Distribution',
    type: 'gateway',
    icon: Settings,
    color: '#e11d48',
    defaultSize: { width: 70, height: 90 },
    description: 'Tesla Backup Gateway 2 - Legacy gateway for Powerwall systems',
    manufacturer: 'Tesla',
    model: 'Backup Gateway 2',
    specifications: {
      maxServiceRating: '200A',
      voltage: '120/240V',
      phases: 'single_split',
      backupCapability: 'partial_or_whole_home',
      meteringCapability: true,
      powerwall3Compatible: true,
      legacyDesign: true,
      canadaCertified: true
    }
  },

  // Enphase Communication and Control
  {
    id: 'enphase_envoy_template',
    name: 'Enphase Envoy',
    category: 'Measurement',
    type: 'monitoring',
    icon: Wifi,
    color: '#7c3aed',
    defaultSize: { width: 80, height: 60 },
    description: 'Enphase Envoy communication gateway and system controller',
    manufacturer: 'Enphase',
    model: 'Envoy-S Standard',
    specifications: {
      communicationProtocol: ['Ethernet', 'WiFi', 'Cellular'],
      maxMicroinverters: 320,
      meteringCapability: true,
      productionCTs: 2,
      consumptionCTs: 2,
      batteryCompatible: true,
      evChargerCompatible: true,
      generatorCompatible: true,
      cloudConnectivity: true,
      localInterface: 'web_browser',
      dimensions: { width: 229, height: 140, depth: 51, unit: 'mm' },
      operatingTemp: '-40°C to 70°C',
      certification: 'FCC Part 15'
    }
  },
  {
    id: 'enphase_iq_system_controller_3m_template',
    name: 'Enphase IQ System Controller 3M',
    category: 'Distribution',
    type: 'system_controller',
    icon: Monitor,
    color: '#7c3aed',
    defaultSize: { width: 90, height: 110 },
    description: 'Enphase IQ System Controller 3M for advanced system management',
    manufacturer: 'Enphase',
    model: 'IQ System Controller 3M',
    specifications: {
      backupCapability: 'microgrid_forming',
      maxBatteryUnits: 'multiple',
      gridFormingCapability: true,
      loadShedding: true,
      priorityLoadManagement: true,
      generatorIntegration: true,
      threePhaseCapable: true,
      meteringChannels: 16,
      envoyIntegration: true,
      iq8Compatible: true
    }
  },

  // Utility Meter Components
  
  // Itron Meters
  {
    id: 'itron_openway_riva_template',
    name: 'Itron OpenWay RIVA',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'Itron OpenWay RIVA smart meter - AMI enabled',
    manufacturer: 'Itron',
    model: 'OpenWay RIVA',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'residential',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'RF Mesh',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      demandRegisters: 4,
      loadProfile: true,
      tamperDetection: true,
      powerQuality: true,
      operatingTemp: '-40°C to 70°C',
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },
  {
    id: 'itron_centron_template',
    name: 'Itron Centron',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'Itron Centron smart meter - solid state design',
    manufacturer: 'Itron',
    model: 'Centron',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'residential',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'RF Mesh/PLC',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      lcd_display: true,
      tamperDetection: true,
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },

  // Landis+Gyr Meters
  {
    id: 'landis_gyr_e350_template',
    name: 'Landis+Gyr E350',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'Landis+Gyr E350 smart meter - FOCUS AX platform',
    manufacturer: 'Landis+Gyr',
    model: 'E350',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'residential',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'RF Mesh',
      platform: 'FOCUS AX',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      demandRegisters: 4,
      loadProfile: true,
      tamperDetection: true,
      powerOutageDetection: true,
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },
  {
    id: 'landis_gyr_e470_template',
    name: 'Landis+Gyr E470',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'Landis+Gyr E470 smart meter - polyphase commercial',
    manufacturer: 'Landis+Gyr',
    model: 'E470',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'commercial',
      voltage: '480V',
      current: '2000A',
      phases: 3,
      formFactor: 'Form 9S',
      socketType: '9S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'RF Mesh/Ethernet',
      platform: 'FOCUS AX',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      demandRegisters: 8,
      loadProfile: true,
      harmonicAnalysis: true,
      powerQuality: true,
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },

  // General Electric Meters
  {
    id: 'ge_i210_template',
    name: 'GE I-210+',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'GE I-210+ smart meter - residential AMI',
    manufacturer: 'General Electric',
    model: 'I-210+',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'residential',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'RF Mesh',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      demandRegisters: 4,
      loadProfile: true,
      tamperDetection: true,
      eventLogging: true,
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },
  {
    id: 'ge_kv2c_template',
    name: 'GE kV2c',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 100, height: 120 },
    description: 'GE kV2c commercial meter - three phase',
    manufacturer: 'General Electric',
    model: 'kV2c',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'commercial',
      voltage: '480V',
      current: '4000A',
      phases: 3,
      formFactor: 'Form 16S',
      socketType: '16S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'Ethernet/RF',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      demandRegisters: 8,
      loadProfile: true,
      powerQuality: true,
      harmonicAnalysis: true,
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },

  // Honeywell (Elster) Meters
  {
    id: 'honeywell_rex2_template',
    name: 'Honeywell REX2',
    category: 'Utility',
    type: 'utility_meter',
    icon: Clock,
    color: '#374151',
    defaultSize: { width: 80, height: 100 },
    description: 'Honeywell REX2 smart meter - residential',
    manufacturer: 'Honeywell',
    model: 'REX2',
    specifications: {
      meterType: 'smart_meter',
      serviceType: 'residential',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      communication: 'RF Mesh',
      amrCapable: true,
      netMetering: true,
      timeOfUse: true,
      tamperDetection: true,
      loadProfile: true,
      certification: 'ANSI C12.1',
      warranty: '20 years'
    }
  },

  // Production/Solar Meters
  {
    id: 'production_meter_template',
    name: 'Solar Production Meter',
    category: 'Utility',
    type: 'production_meter',
    icon: Clock,
    color: '#f59e0b',
    defaultSize: { width: 80, height: 100 },
    description: 'Dedicated solar production meter for NEC 705 compliance',
    manufacturer: 'Generic',
    model: 'Production Meter',
    specifications: {
      meterType: 'production_meter',
      serviceType: 'solar_production',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      bidirectional: false,
      productionOnly: true,
      necCompliance: '705.12',
      netMetering: false,
      timeOfUse: false,
      certification: 'ANSI C12.1',
      purpose: 'solar_measurement'
    }
  },

  // Net Meters (Bidirectional)
  {
    id: 'net_meter_template',
    name: 'Net Meter (Bidirectional)',
    category: 'Utility',
    type: 'net_meter',
    icon: Clock,
    color: '#059669',
    defaultSize: { width: 80, height: 100 },
    description: 'Bidirectional net meter for solar net metering programs',
    manufacturer: 'Generic',
    model: 'Net Meter',
    specifications: {
      meterType: 'net_meter',
      serviceType: 'net_metering',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.20 Class 0.2',
      bidirectional: true,
      netMetering: true,
      reverseFlow: true,
      importRegisters: 4,
      exportRegisters: 4,
      timeOfUse: true,
      necCompliance: '705.12',
      certification: 'ANSI C12.1',
      purpose: 'net_metering'
    }
  },

  // CT Meter Combinations
  {
    id: 'ct_meter_cabinet_template',
    name: 'CT Meter Cabinet',
    category: 'Utility',
    type: 'ct_meter',
    icon: Clock,
    color: '#6b7280',
    defaultSize: { width: 120, height: 140 },
    description: 'CT meter cabinet for high amperage services',
    manufacturer: 'Generic',
    model: 'CT Cabinet',
    specifications: {
      meterType: 'ct_meter',
      serviceType: 'commercial',
      voltage: '480V',
      current: '4000A',
      phases: 3,
      ctRatio: '4000:5',
      ptRatio: '4160:120',
      formFactor: 'CT Cabinet',
      socketType: 'CT Socket',
      accuracy: 'ANSI C12.20 Class 0.2',
      netMetering: true,
      timeOfUse: true,
      demandRegisters: 8,
      powerQuality: true,
      certification: 'ANSI C12.1',
      application: 'high_amperage'
    }
  },

  // Vintage/Mechanical Meters
  {
    id: 'mechanical_meter_template',
    name: 'Mechanical Meter (Legacy)',
    category: 'Utility',
    type: 'mechanical_meter',
    icon: Clock,
    color: '#9ca3af',
    defaultSize: { width: 80, height: 100 },
    description: 'Traditional mechanical meter with spinning disk',
    manufacturer: 'Generic',
    model: 'Mechanical',
    specifications: {
      meterType: 'mechanical',
      serviceType: 'residential',
      voltage: '240V',
      current: '200A',
      phases: 1,
      formFactor: 'Form 2S',
      socketType: '2S',
      accuracy: 'ANSI C12.1 Class 1.0',
      technology: 'electromechanical',
      diskRotation: true,
      registers: 'mechanical_dials',
      amrCapable: false,
      netMetering: false,
      vintage: true,
      certification: 'ANSI C12.1'
    }
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Grid },
  { id: 'Solar', name: 'Solar', icon: Sun },
  { id: 'Battery', name: 'Battery', icon: Battery },
  { id: 'EVSE', name: 'EV Charging', icon: Car },
  { id: 'Distribution', name: 'Distribution', icon: Zap },
  { id: 'Protection', name: 'Protection', icon: Shield },
  { id: 'Transformers', name: 'Transformers', icon: Circle },
  { id: 'Motors', name: 'Motors', icon: Settings },
  { id: 'Generation', name: 'Generation', icon: Power },
  { id: 'Loads', name: 'Loads', icon: Lightbulb },
  { id: 'Measurement', name: 'Measurement', icon: Gauge },
  { id: 'Control', name: 'Control', icon: Monitor },
  { id: 'Safety', name: 'Safety', icon: AlertTriangle },
  { id: 'Utility', name: 'Utility Meters', icon: Clock }
];

const MANUFACTURERS = [
  { id: 'all', name: 'All Manufacturers' },
  { id: 'tesla', name: 'Tesla', category: ['Battery', 'EVSE'] },
  { id: 'enphase', name: 'Enphase', category: ['Solar', 'Battery'] },
  { id: 'square_d', name: 'Square D', category: ['Distribution', 'Protection'] },
  { id: 'eaton', name: 'Eaton', category: ['Distribution', 'Protection'] },
  { id: 'siemens', name: 'Siemens', category: ['Distribution', 'EVSE'] },
  { id: 'leviton', name: 'Leviton', category: ['EVSE'] },
  { id: 'chargepoint', name: 'ChargePoint', category: ['EVSE'] },
  { id: 'clippercreek', name: 'ClipperCreek', category: ['EVSE'] },
  { id: 'grizzl_e', name: 'Grizzl-E', category: ['EVSE'] },
  { id: 'webasto', name: 'Webasto', category: ['EVSE'] },
  { id: 'juicebox', name: 'JuiceBox/Enel X', category: ['EVSE'] },
  { id: 'itron', name: 'Itron', category: ['Utility'] },
  { id: 'landis_gyr', name: 'Landis+Gyr', category: ['Utility'] },
  { id: 'ge', name: 'General Electric', category: ['Utility', 'Distribution'] },
  { id: 'honeywell', name: 'Honeywell', category: ['Utility'] }
];

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onComponentSelect,
  onComponentDragStart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Solar: true,
    Battery: true,
    EVSE: true,
    Distribution: true,
    Utility: true
  });
  const [groupByManufacturer, setGroupByManufacturer] = useState(false);

  // Filter components based on search, category, and manufacturer
  const filteredComponents = COMPONENT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.manufacturer && template.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesManufacturer = selectedManufacturer === 'all' || 
                               (template.manufacturer && template.manufacturer.toLowerCase().includes(selectedManufacturer.toLowerCase()));
    return matchesSearch && matchesCategory && matchesManufacturer;
  });

  // Group components by category or manufacturer
  const groupedComponents = filteredComponents.reduce((groups, component) => {
    const groupKey = groupByManufacturer 
      ? (component.manufacturer || 'Generic')
      : component.category;
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(component);
    return groups;
  }, {} as Record<string, ComponentTemplate[]>);

  // Get unique manufacturers from filtered components
  const availableManufacturers = Array.from(
    new Set(
      filteredComponents
        .map(component => component.manufacturer)
        .filter(Boolean)
    )
  ).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDragStart = (template: ComponentTemplate, event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'copy';
    onComponentDragStart?.(template, event);
  };

  const handleComponentClick = (template: ComponentTemplate) => {
    onComponentSelect(template);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Component Library</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Manufacturer Filter and Grouping Options */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700">Filter by Manufacturer</label>
            <label className="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                checked={groupByManufacturer}
                onChange={(e) => setGroupByManufacturer(e.target.checked)}
                className="mr-1"
              />
              Group by Manufacturer
            </label>
          </div>
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Manufacturers</option>
            {availableManufacturers.map(manufacturer => (
              <option key={manufacturer} value={manufacturer}>
                {manufacturer}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <category.icon className="h-3 w-3 mr-1" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedComponents).map(([category, components]) => (
          <div key={category} className="mb-4">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
                             <div className="flex items-center">
                 {(() => {
                   const categoryData = CATEGORIES.find(c => c.id === category);
                   return categoryData?.icon ? <categoryData.icon className="h-4 w-4 mr-2" /> : null;
                 })()}
                 {category} ({components.length})
               </div>
              {expandedCategories[category] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Components */}
            {expandedCategories[category] && (
              <div className="ml-4 space-y-2">
                {components.map(component => (
                  <div
                    key={component.id}
                    draggable
                    onDragStart={(e) => handleDragStart(component, e)}
                    onClick={() => handleComponentClick(component)}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {/* Component Icon */}
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center mr-3"
                      style={{ backgroundColor: component.color + '20' }}
                    >
                      <component.icon 
                        className="h-5 w-5" 
                        style={{ color: component.color }}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {component.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {component.description}
                      </p>
                      {component.manufacturer && (
                        <p className="text-xs text-gray-400 truncate">
                          {component.manufacturer} {component.model}
                        </p>
                      )}
                    </div>

                    {/* Drag Handle */}
                    <div className="ml-2 text-gray-400">
                      <Grid className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No components found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p>• Drag components to the canvas</p>
          <p>• Click to add at default position</p>
          <p>• Components auto-connect to nearby elements</p>
        </div>
      </div>
    </div>
  );
}; 