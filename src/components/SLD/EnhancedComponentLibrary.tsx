/**
 * Enhanced Component Library for SLD - Vercel Compatible
 * 
 * Professional electrical component library with search, filtering, and IEEE symbols
 * Optimized for performance and professional electrical design workflows
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Zap, Settings, Grid, Eye, EyeOff } from 'lucide-react';
import { IEEE_SYMBOLS, getSymbolCategories, IEEESymbolRenderer, type IEEESymbol } from './IEEESymbolsSimple';
import { useSLDData } from '../../context/SLDDataContext';

interface ComponentTemplate {
  id: string;
  name: string;
  category: string;
  necReference?: string;
  rating?: string;
  voltage?: number;
  description: string;
  ieeeSymbolId?: string;
  properties: Record<string, any>;
}

// Professional component templates with IEEE symbols
const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'main_panel_200a',
    name: '200A Main Service Panel',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    rating: '200A',
    voltage: 240,
    description: 'Main electrical service panel with 200A rating',
    ieeeSymbolId: 'main_breaker',
    properties: {
      rating: '200A',
      volts: 240,
      phase: 1,
      poles: 2,
      necReference: 'NEC 408.3'
    }
  },
  {
    id: 'main_panel_400a',
    name: '400A Main Service Panel',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    rating: '400A',
    voltage: 240,
    description: 'Commercial main electrical service panel with 400A rating',
    ieeeSymbolId: 'main_breaker',
    properties: {
      rating: '400A',
      volts: 240,
      phase: 3,
      poles: 3,
      necReference: 'NEC 408.3'
    }
  },
  {
    id: 'breaker_20a',
    name: '20A Circuit Breaker',
    category: 'Protection',
    necReference: 'NEC 240.6',
    rating: '20A',
    voltage: 240,
    description: 'Single-pole 20A circuit breaker for branch circuits',
    ieeeSymbolId: 'circuit_breaker',
    properties: {
      rating: '20A',
      volts: 240,
      poles: 1,
      necReference: 'NEC 240.6'
    }
  },
  {
    id: 'breaker_50a',
    name: '50A Circuit Breaker',
    category: 'Protection',
    necReference: 'NEC 240.6',
    rating: '50A',
    voltage: 240,
    description: 'Double-pole 50A circuit breaker for EVSE and large appliances',
    ieeeSymbolId: 'circuit_breaker',
    properties: {
      rating: '50A',
      volts: 240,
      poles: 2,
      necReference: 'NEC 240.6'
    }
  },
  {
    id: 'meter_socket',
    name: 'Electric Meter Socket',
    category: 'Metering',
    necReference: 'NEC 230.66',
    rating: '200A',
    voltage: 240,
    description: 'Standard residential electric meter socket',
    ieeeSymbolId: 'electric_meter',
    properties: {
      rating: '200A',
      volts: 240,
      type: 'socket',
      necReference: 'NEC 230.66'
    }
  },
  {
    id: 'solar_disconnect',
    name: 'Solar AC Disconnect',
    category: 'Switching',
    necReference: 'NEC 690.13',
    rating: '60A',
    voltage: 240,
    description: 'AC disconnect switch for solar PV systems',
    ieeeSymbolId: 'disconnect_switch',
    properties: {
      rating: '60A',
      volts: 240,
      type: 'solar_ac',
      necReference: 'NEC 690.13'
    }
  },
  {
    id: 'inverter_string',
    name: 'String Solar Inverter',
    category: 'Renewable',
    necReference: 'NEC 690.8',
    rating: '7.6kW',
    voltage: 240,
    description: 'String inverter for residential solar PV systems',
    ieeeSymbolId: 'solar_inverter',
    properties: {
      capacity: '7.6kW',
      volts: 240,
      type: 'string',
      efficiency: '97.5%',
      necReference: 'NEC 690.8'
    }
  },
  {
    id: 'evse_level2_40a',
    name: 'Level 2 EVSE (40A)',
    category: 'EVSE',
    necReference: 'NEC 625.17',
    rating: '40A',
    voltage: 240,
    description: 'Level 2 electric vehicle charging station, 40A continuous',
    ieeeSymbolId: 'evse_charger',
    properties: {
      rating: '40A',
      volts: 240,
      power: '9.6kW',
      continuous: true,
      necReference: 'NEC 625.17'
    }
  },
  {
    id: 'evse_level2_80a',
    name: 'Level 2 EVSE (80A)',
    category: 'EVSE',
    necReference: 'NEC 625.17',
    rating: '80A',
    voltage: 240,
    description: 'High-power Level 2 electric vehicle charging station, 80A continuous',
    ieeeSymbolId: 'evse_charger',
    properties: {
      rating: '80A',
      volts: 240,
      power: '19.2kW',
      continuous: true,
      necReference: 'NEC 625.17'
    }
  },
  {
    id: 'transformer_75kva',
    name: '75kVA Transformer',
    category: 'Power',
    necReference: 'NEC 450.3',
    rating: '75kVA',
    voltage: 480,
    description: 'Step-down transformer for commercial applications',
    ieeeSymbolId: 'transformer',
    properties: {
      capacity: '75kVA',
      primaryVolts: 480,
      secondaryVolts: 208,
      necReference: 'NEC 450.3'
    }
  },
  
  // Square D Components
  {
    id: 'sqd_qo_main_200a',
    name: 'Square D QO 200A Main',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    rating: '200A',
    voltage: 240,
    description: 'Square D QO series main panel with 200A main breaker',
    ieeeSymbolId: 'main_breaker',
    properties: {
      manufacturer: 'Square D',
      series: 'QO',
      rating: '200A',
      volts: 240,
      spaces: 40,
      necReference: 'NEC 408.3'
    }
  },
  {
    id: 'sqd_homeline_100a',
    name: 'Square D Homeline 100A Panel',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    rating: '100A',
    voltage: 240,
    description: 'Square D Homeline residential panel with 100A main',
    ieeeSymbolId: 'main_breaker',
    properties: {
      manufacturer: 'Square D',
      series: 'Homeline',
      rating: '100A',
      volts: 240,
      spaces: 20,
      necReference: 'NEC 408.3'
    }
  },
  {
    id: 'sqd_qo_20a_afci',
    name: 'Square D QO 20A AFCI Breaker',
    category: 'Protection',
    necReference: 'NEC 210.12',
    rating: '20A',
    voltage: 120,
    description: 'Square D QO Arc Fault Circuit Interrupter breaker',
    ieeeSymbolId: 'circuit_breaker',
    properties: {
      manufacturer: 'Square D',
      series: 'QO',
      rating: '20A',
      volts: 120,
      type: 'AFCI',
      necReference: 'NEC 210.12'
    }
  },
  {
    id: 'sqd_qo_50a_gfci',
    name: 'Square D QO 50A GFCI Breaker',
    category: 'Protection',
    necReference: 'NEC 625.22',
    rating: '50A',
    voltage: 240,
    description: 'Square D QO GFCI breaker for EVSE applications',
    ieeeSymbolId: 'gfci_breaker',
    properties: {
      manufacturer: 'Square D',
      series: 'QO',
      rating: '50A',
      volts: 240,
      type: 'GFCI',
      application: 'EVSE',
      necReference: 'NEC 625.22'
    }
  },
  {
    id: 'sqd_meter_socket_200a',
    name: 'Square D 200A Meter Socket',
    category: 'Metering',
    necReference: 'NEC 230.66',
    rating: '200A',
    voltage: 240,
    description: 'Square D residential meter socket, 200A rated',
    ieeeSymbolId: 'electric_meter',
    properties: {
      manufacturer: 'Square D',
      rating: '200A',
      volts: 240,
      jaws: 4,
      necReference: 'NEC 230.66'
    }
  },
  {
    id: 'sqd_load_center_combo',
    name: 'Square D Meter-Main Combo',
    category: 'Distribution',
    necReference: 'NEC 230.85',
    rating: '200A',
    voltage: 240,
    description: 'Square D meter-main combination panel',
    ieeeSymbolId: 'meter_main_combo',
    properties: {
      manufacturer: 'Square D',
      rating: '200A',
      volts: 240,
      spaces: 30,
      hasDisconnect: true,
      necReference: 'NEC 230.85'
    }
  },
  {
    id: 'sqd_evse_ready_40a',
    name: 'Square D EVlink 40A EVSE',
    category: 'EVSE',
    necReference: 'NEC 625.17',
    rating: '40A',
    voltage: 240,
    description: 'Square D EVlink Level 2 charging station',
    ieeeSymbolId: 'evse_outlet',
    properties: {
      manufacturer: 'Square D',
      model: 'EVlink',
      rating: '40A',
      volts: 240,
      connector: 'J1772',
      necReference: 'NEC 625.17'
    }
  },
  
  // Eaton Components
  {
    id: 'eaton_br_main_200a',
    name: 'Eaton BR 200A Main Panel',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    rating: '200A',
    voltage: 240,
    description: 'Eaton BR series main panel with 200A main breaker',
    ieeeSymbolId: 'main_breaker',
    properties: {
      manufacturer: 'Eaton',
      series: 'BR',
      rating: '200A',
      volts: 240,
      spaces: 40,
      necReference: 'NEC 408.3'
    }
  },
  {
    id: 'eaton_ch_commercial_400a',
    name: 'Eaton CH 400A Commercial Panel',
    category: 'Distribution',
    necReference: 'NEC 408.3',
    rating: '400A',
    voltage: 480,
    description: 'Eaton CH series commercial panel for 3-phase applications',
    ieeeSymbolId: 'main_breaker',
    properties: {
      manufacturer: 'Eaton',
      series: 'CH',
      rating: '400A',
      volts: 480,
      phases: 3,
      spaces: 42,
      necReference: 'NEC 408.3'
    }
  },
  {
    id: 'eaton_br_30a_afci',
    name: 'Eaton BR 30A AFCI Breaker',
    category: 'Protection',
    necReference: 'NEC 210.12',
    rating: '30A',
    voltage: 240,
    description: 'Eaton BR Arc Fault Circuit Interrupter breaker',
    ieeeSymbolId: 'circuit_breaker',
    properties: {
      manufacturer: 'Eaton',
      series: 'BR',
      rating: '30A',
      volts: 240,
      type: 'AFCI',
      necReference: 'NEC 210.12'
    }
  },
  {
    id: 'eaton_ch_60a_gfci',
    name: 'Eaton CH 60A GFCI Breaker',
    category: 'Protection',
    necReference: 'NEC 625.22',
    rating: '60A',
    voltage: 240,
    description: 'Eaton CH GFCI breaker for high-power applications',
    ieeeSymbolId: 'gfci_breaker',
    properties: {
      manufacturer: 'Eaton',
      series: 'CH',
      rating: '60A',
      volts: 240,
      type: 'GFCI',
      application: 'High Power',
      necReference: 'NEC 625.22'
    }
  },
  {
    id: 'eaton_surge_protector_type2',
    name: 'Eaton Type 2 Surge Protector',
    category: 'Protection',
    necReference: 'NEC 285.6',
    rating: '50kA',
    voltage: 240,
    description: 'Eaton whole-house surge protective device',
    ieeeSymbolId: 'surge_protector',
    properties: {
      manufacturer: 'Eaton',
      type: 'Type 2 SPD',
      rating: '50kA',
      volts: 240,
      necReference: 'NEC 285.6'
    }
  },
  {
    id: 'eaton_motor_starter_30a',
    name: 'Eaton Motor Starter 30A',
    category: 'Protection',
    necReference: 'NEC 430.83',
    rating: '30A',
    voltage: 480,
    description: 'Eaton motor circuit protector and starter combination',
    ieeeSymbolId: 'motor_starter',
    properties: {
      manufacturer: 'Eaton',
      rating: '30A',
      volts: 480,
      motorHP: '15HP',
      necReference: 'NEC 430.83'
    }
  },
  {
    id: 'eaton_meter_socket_320a',
    name: 'Eaton 320A Meter Socket',
    category: 'Metering',
    necReference: 'NEC 230.66',
    rating: '320A',
    voltage: 240,
    description: 'Eaton commercial meter socket for high-amperage service',
    ieeeSymbolId: 'electric_meter',
    properties: {
      manufacturer: 'Eaton',
      rating: '320A',
      volts: 240,
      jaws: 4,
      application: 'Commercial',
      necReference: 'NEC 230.66'
    }
  },
  
  // Enphase Components
  {
    id: 'enphase_iq8_plus_microinverter',
    name: 'Enphase IQ8+ Microinverter',
    category: 'Renewable',
    necReference: 'NEC 690.12',
    rating: '300W',
    voltage: 240,
    description: 'Enphase IQ8+ microinverter for PV module integration',
    ieeeSymbolId: 'solar_inverter',
    properties: {
      manufacturer: 'Enphase',
      model: 'IQ8+',
      maxPower: '300W',
      volts: 240,
      efficiency: '97.0%',
      necReference: 'NEC 690.12'
    }
  },
  {
    id: 'enphase_iq_combiner_3',
    name: 'Enphase IQ Combiner 3',
    category: 'Renewable',
    necReference: 'NEC 690.35',
    rating: '60A',
    voltage: 240,
    description: 'Enphase IQ Combiner with monitoring and switching',
    ieeeSymbolId: 'combiner_box',
    properties: {
      manufacturer: 'Enphase',
      model: 'IQ Combiner 3',
      rating: '60A',
      volts: 240,
      strings: 12,
      monitoring: true,
      necReference: 'NEC 690.35'
    }
  },
  {
    id: 'enphase_iq_battery_5p',
    name: 'Enphase IQ Battery 5P',
    category: 'Storage',
    necReference: 'NEC 706.30',
    rating: '5kWh',
    voltage: 240,
    description: 'Enphase IQ Battery 5P lithium storage system',
    ieeeSymbolId: 'battery_storage',
    properties: {
      manufacturer: 'Enphase',
      model: 'IQ Battery 5P',
      capacity: '5kWh',
      volts: 240,
      chemistry: 'Lithium Iron Phosphate',
      necReference: 'NEC 706.30'
    }
  },
  {
    id: 'enphase_iq_gateway_metered',
    name: 'Enphase IQ Gateway Metered',
    category: 'Monitoring',
    necReference: 'NEC 690.54',
    rating: '200A',
    voltage: 240,
    description: 'Enphase IQ Gateway with revenue-grade metering',
    ieeeSymbolId: 'monitoring_device',
    properties: {
      manufacturer: 'Enphase',
      model: 'IQ Gateway Metered',
      rating: '200A',
      volts: 240,
      wireless: true,
      internetConnected: true,
      necReference: 'NEC 690.54'
    }
  },
  {
    id: 'enphase_ac_disconnect_60a',
    name: 'Enphase AC Disconnect 60A',
    category: 'Switching',
    necReference: 'NEC 690.13',
    rating: '60A',
    voltage: 240,
    description: 'Enphase AC disconnect switch for solar systems',
    ieeeSymbolId: 'disconnect_switch',
    properties: {
      manufacturer: 'Enphase',
      rating: '60A',
      volts: 240,
      type: 'AC Disconnect',
      weatherproof: true,
      necReference: 'NEC 690.13'
    }
  },
  {
    id: 'enphase_iq8_microinverter_trio',
    name: 'Enphase IQ8 Microinverter (3-Phase)',
    category: 'Renewable',
    necReference: 'NEC 690.12',
    rating: '320W',
    voltage: 480,
    description: 'Enphase IQ8 three-phase microinverter for commercial applications',
    ieeeSymbolId: 'solar_inverter',
    properties: {
      manufacturer: 'Enphase',
      model: 'IQ8 Trio',
      maxPower: '320W',
      volts: 480,
      phases: 3,
      efficiency: '97.5%',
      necReference: 'NEC 690.12'
    }
  },
  {
    id: 'enphase_production_meter_ct',
    name: 'Enphase Production Meter CT',
    category: 'Metering',
    necReference: 'NEC 690.72',
    rating: '200A',
    voltage: 240,
    description: 'Enphase current transformer for production monitoring',
    ieeeSymbolId: 'current_transformer',
    properties: {
      manufacturer: 'Enphase',
      model: 'Production CT',
      rating: '200A',
      volts: 240,
      accuracy: '±1%',
      wireless: true,
      necReference: 'NEC 690.72'
    }
  },
  
  // Tesla Components
  {
    id: 'tesla_powerwall_3',
    name: 'Tesla Powerwall 3',
    category: 'Storage',
    necReference: 'NEC 706.30',
    rating: '13.5kWh',
    voltage: 240,
    description: 'Tesla Powerwall 3 integrated battery storage system',
    ieeeSymbolId: 'battery_storage',
    properties: {
      manufacturer: 'Tesla',
      model: 'Powerwall 3',
      capacity: '13.5kWh',
      volts: 240,
      continuousPower: '11.04kW',
      peakPower: '22.08kW',
      necReference: 'NEC 706.30'
    }
  },
  {
    id: 'tesla_solar_inverter_7_6kw',
    name: 'Tesla Solar Inverter 7.6kW',
    category: 'Renewable',
    necReference: 'NEC 690.8',
    rating: '7.6kW',
    voltage: 240,
    description: 'Tesla solar inverter for residential PV systems',
    ieeeSymbolId: 'solar_inverter',
    properties: {
      manufacturer: 'Tesla',
      model: 'Solar Inverter',
      capacity: '7.6kW',
      volts: 240,
      efficiency: '97.5%',
      necReference: 'NEC 690.8'
    }
  },
  {
    id: 'tesla_backup_gateway_2',
    name: 'Tesla Backup Gateway 2',
    category: 'Switching',
    necReference: 'NEC 701.12',
    rating: '200A',
    voltage: 240,
    description: 'Tesla automatic transfer switch and energy management',
    ieeeSymbolId: 'transfer_switch',
    properties: {
      manufacturer: 'Tesla',
      model: 'Backup Gateway 2',
      rating: '200A',
      volts: 240,
      automatic: true,
      monitoring: true,
      necReference: 'NEC 701.12'
    }
  },
  {
    id: 'tesla_wall_connector_gen3',
    name: 'Tesla Wall Connector Gen 3',
    category: 'EVSE',
    necReference: 'NEC 625.17',
    rating: '48A',
    voltage: 240,
    description: 'Tesla Wall Connector Generation 3 for home charging',
    ieeeSymbolId: 'evse_charger',
    properties: {
      manufacturer: 'Tesla',
      model: 'Wall Connector Gen 3',
      rating: '48A',
      volts: 240,
      power: '11.5kW',
      connector: 'Tesla Proprietary',
      necReference: 'NEC 625.17'
    }
  },
  {
    id: 'tesla_mobile_connector',
    name: 'Tesla Mobile Connector',
    category: 'EVSE',
    necReference: 'NEC 625.17',
    rating: '32A',
    voltage: 240,
    description: 'Tesla portable charging solution with adapters',
    ieeeSymbolId: 'evse_outlet',
    properties: {
      manufacturer: 'Tesla',
      model: 'Mobile Connector',
      rating: '32A',
      volts: 240,
      power: '7.7kW',
      portable: true,
      necReference: 'NEC 625.17'
    }
  },
  {
    id: 'tesla_solar_roof_tile_system',
    name: 'Tesla Solar Roof Tile System',
    category: 'Renewable',
    necReference: 'NEC 690.7',
    rating: '400W',
    voltage: 48,
    description: 'Tesla integrated solar roof tile with DC optimizer',
    ieeeSymbolId: 'solar_panel',
    properties: {
      manufacturer: 'Tesla',
      model: 'Solar Roof Tile',
      capacity: '400W',
      volts: 48,
      dcOptimizer: true,
      integrated: true,
      necReference: 'NEC 690.7'
    }
  },
  {
    id: 'tesla_megapack_2xl',
    name: 'Tesla Megapack 2XL',
    category: 'Storage',
    necReference: 'NEC 706.30',
    rating: '4MWh',
    voltage: 480,
    description: 'Tesla utility-scale battery storage system',
    ieeeSymbolId: 'battery_storage',
    properties: {
      manufacturer: 'Tesla',
      model: 'Megapack 2XL',
      capacity: '4MWh',
      volts: 480,
      power: '1.9MW',
      application: 'Utility Scale',
      necReference: 'NEC 706.30'
    }
  },
  
  // Milbank Components
  {
    id: 'milbank_meter_main_200a',
    name: 'Milbank 200A Meter-Main',
    category: 'Distribution',
    necReference: 'NEC 230.85',
    rating: '200A',
    voltage: 240,
    description: 'Milbank meter-main combination panel with disconnect',
    ieeeSymbolId: 'meter_main_combo',
    properties: {
      manufacturer: 'Milbank',
      rating: '200A',
      volts: 240,
      spaces: 30,
      raintight: true,
      necReference: 'NEC 230.85'
    }
  },
  {
    id: 'milbank_ct_cabinet_400a',
    name: 'Milbank 400A CT Cabinet',
    category: 'Metering',
    necReference: 'NEC 314.28',
    rating: '400A',
    voltage: 480,
    description: 'Milbank current transformer cabinet for commercial metering',
    ieeeSymbolId: 'ct_cabinet',
    properties: {
      manufacturer: 'Milbank',
      rating: '400A',
      volts: 480,
      phases: 3,
      ctRatio: '400:5',
      necReference: 'NEC 314.28'
    }
  },
  {
    id: 'milbank_ringless_meter_socket',
    name: 'Milbank Ringless Meter Socket',
    category: 'Metering',
    necReference: 'NEC 230.66',
    rating: '320A',
    voltage: 240,
    description: 'Milbank ringless meter socket for high-amperage service',
    ieeeSymbolId: 'electric_meter',
    properties: {
      manufacturer: 'Milbank',
      rating: '320A',
      volts: 240,
      ringless: true,
      weatherproof: true,
      necReference: 'NEC 230.66'
    }
  },
  {
    id: 'milbank_generator_transfer_switch',
    name: 'Milbank Generator Transfer Switch',
    category: 'Switching',
    necReference: 'NEC 701.12',
    rating: '200A',
    voltage: 240,
    description: 'Milbank automatic transfer switch for backup generators',
    ieeeSymbolId: 'transfer_switch',
    properties: {
      manufacturer: 'Milbank',
      rating: '200A',
      volts: 240,
      automatic: true,
      exerciser: true,
      necReference: 'NEC 701.12'
    }
  },
  {
    id: 'milbank_service_entrance_disconnect',
    name: 'Milbank Service Entrance Disconnect',
    category: 'Switching',
    necReference: 'NEC 230.70',
    rating: '600A',
    voltage: 480,
    description: 'Milbank heavy-duty service entrance disconnect switch',
    ieeeSymbolId: 'disconnect_switch',
    properties: {
      manufacturer: 'Milbank',
      rating: '600A',
      volts: 480,
      phases: 3,
      fusible: false,
      necReference: 'NEC 230.70'
    }
  },
  {
    id: 'milbank_pedestal_meter_socket',
    name: 'Milbank Pedestal Meter Socket',
    category: 'Metering',
    necReference: 'NEC 230.66',
    rating: '200A',
    voltage: 240,
    description: 'Milbank underground pedestal with meter socket',
    ieeeSymbolId: 'electric_meter',
    properties: {
      manufacturer: 'Milbank',
      rating: '200A',
      volts: 240,
      underground: true,
      pedestal: true,
      necReference: 'NEC 230.66'
    }
  },
  {
    id: 'milbank_temporary_power_panel',
    name: 'Milbank Temporary Power Panel',
    category: 'Distribution',
    necReference: 'NEC 590.6',
    rating: '100A',
    voltage: 240,
    description: 'Milbank temporary construction power distribution panel',
    ieeeSymbolId: 'temp_panel',
    properties: {
      manufacturer: 'Milbank',
      rating: '100A',
      volts: 240,
      temporary: true,
      gfciProtected: true,
      necReference: 'NEC 590.6'
    }
  }
];

export const EnhancedComponentLibrary: React.FC = () => {
  const { addComponent, updateUIState, state } = useSLDData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDetails, setShowDetails] = useState(false);

  // Get all categories
  const categories = useMemo(() => {
    const componentCategories = [...new Set(COMPONENT_TEMPLATES.map(comp => comp.category))];
    const symbolCategories = getSymbolCategories();
    return ['all', ...new Set([...componentCategories, ...symbolCategories])];
  }, []);

  // Filter components and symbols
  const filteredItems = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    // Filter component templates
    const filteredComponents = COMPONENT_TEMPLATES.filter(comp => {
      const matchesSearch = 
        comp.name.toLowerCase().includes(searchLower) ||
        comp.description.toLowerCase().includes(searchLower) ||
        comp.necReference?.toLowerCase().includes(searchLower) ||
        comp.rating?.toLowerCase().includes(searchLower);
      
      const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Filter IEEE symbols
    const filteredSymbols = IEEE_SYMBOLS.filter(symbol => {
      const matchesSearch = 
        symbol.name.toLowerCase().includes(searchLower) ||
        symbol.category.toLowerCase().includes(searchLower) ||
        symbol.necReference?.toLowerCase().includes(searchLower);
      
      const matchesCategory = selectedCategory === 'all' || symbol.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    return { components: filteredComponents, symbols: filteredSymbols };
  }, [searchTerm, selectedCategory]);

  // Add component to canvas
  const addComponentToCanvas = (template: ComponentTemplate) => {
    const id = `${template.id}-${Date.now()}`;
    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };

    const symbol = template.ieeeSymbolId ? 
      IEEE_SYMBOLS.find(s => s.id === template.ieeeSymbolId)?.symbol : 
      undefined;

    addComponent({
      id,
      name: template.name,
      type: template.id,
      position,
      width: 80,
      height: 60,
      symbol: symbol ? '⚡' : '▦', // Fallback symbol
      properties: {
        ...template.properties,
        description: template.description
      }
    });
  };

  // Add IEEE symbol to canvas
  const addSymbolToCanvas = (symbol: IEEESymbol) => {
    const id = `${symbol.id}-${Date.now()}`;
    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };

    addComponent({
      id,
      name: symbol.name,
      type: symbol.id,
      position,
      width: symbol.width,
      height: symbol.height,
      symbol: '⚡', // Will be replaced by proper IEEE symbol
      properties: {
        necReference: symbol.necReference,
        category: symbol.category,
        terminals: symbol.terminals
      }
    });
  };

  const toggleLibraryVisibility = () => {
    updateUIState({ showComponentLibrary: !state.ui.showComponentLibrary });
  };

  if (!state.ui.showComponentLibrary) {
    return (
      <button
        onClick={toggleLibraryVisibility}
        className="fixed top-20 left-4 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 z-20"
        title="Show Component Library"
      >
        <Eye className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Component Library</h3>
          <button
            onClick={toggleLibraryVisibility}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Hide Component Library"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md text-sm py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 border-l border-gray-300 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              title="List View"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`p-1 text-sm ${showDetails ? 'text-blue-600' : 'text-gray-500'}`}
            title="Toggle Details"
          >
            Details
          </button>
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Professional Components Section */}
        {filteredItems.components.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-3">
              Professional Components ({filteredItems.components.length})
            </h4>
            
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
              {filteredItems.components.map(component => (
                <div
                  key={component.id}
                  className={`border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    viewMode === 'list' ? 'flex items-center gap-3' : 'text-center'
                  }`}
                  onClick={() => addComponentToCanvas(component)}
                  title={`Add ${component.name} to diagram`}
                >
                  {component.ieeeSymbolId && (
                    <div className={viewMode === 'list' ? 'flex-shrink-0' : 'mb-2'}>
                      <IEEESymbolRenderer 
                        symbolId={component.ieeeSymbolId} 
                        size={viewMode === 'list' ? 24 : 32}
                        color="#4F46E5"
                      />
                    </div>
                  )}
                  
                  <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {component.name}
                    </div>
                    {component.rating && (
                      <div className="text-xs text-blue-600 font-mono">
                        {component.rating}
                      </div>
                    )}
                    {showDetails && (
                      <div className="text-xs text-gray-500 mt-1">
                        {component.necReference}
                      </div>
                    )}
                  </div>
                  
                  <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IEEE Symbols Section */}
        {filteredItems.symbols.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-3">
              IEEE Symbols ({filteredItems.symbols.length})
            </h4>
            
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
              {filteredItems.symbols.map(symbol => (
                <div
                  key={symbol.id}
                  className={`border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    viewMode === 'list' ? 'flex items-center gap-3' : 'text-center'
                  }`}
                  onClick={() => addSymbolToCanvas(symbol)}
                  title={`Add ${symbol.name} to diagram`}
                >
                  <div className={viewMode === 'list' ? 'flex-shrink-0' : 'mb-2'}>
                    <IEEESymbolRenderer 
                      symbolId={symbol.id} 
                      size={viewMode === 'list' ? 24 : 32}
                      color="#059669"
                    />
                  </div>
                  
                  <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {symbol.name}
                    </div>
                    <div className="text-xs text-green-600">
                      {symbol.category}
                    </div>
                    {showDetails && symbol.necReference && (
                      <div className="text-xs text-gray-500 mt-1">
                        {symbol.necReference}
                      </div>
                    )}
                  </div>
                  
                  <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredItems.components.length === 0 && filteredItems.symbols.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm font-medium">No components found</div>
            <div className="text-xs">Try adjusting your search or filter</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-medium">IEEE 315 Compliant</div>
          <div>Professional electrical symbols</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedComponentLibrary;