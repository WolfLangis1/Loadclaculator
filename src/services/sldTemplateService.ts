import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';

export interface SLDTemplate {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'solar' | 'battery' | 'evse' | 'mixed';
  preview: string; // Base64 or SVG string for preview
  diagram: SLDDiagram;
  tags: string[];
  requiredComponents: string[];
}

export const SLD_TEMPLATES: SLDTemplate[] = [
  {
    id: 'residential-solar-basic',
    name: 'Basic Residential Solar',
    description: 'Simple grid-tie solar system with utility interconnection',
    category: 'solar',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NDE1MSI+QmFzaWMgU29sYXI8L3RleHQ+Cjwvc3ZnPg==',
    diagram: {
      id: 'residential-solar-basic',
      name: 'Basic Residential Solar',
      components: [
        {
          id: 'utility-grid',
          type: 'utility_grid',
          label: 'Utility Grid',
          position: { x: 50, y: 50 },
          properties: {
            voltage: '240V',
            phases: 'single',
            groundingType: 'system'
          }
        },
        {
          id: 'main-meter',
          type: 'meter',
          label: 'Main Meter',
          position: { x: 200, y: 50 },
          properties: {
            rating: '200A',
            type: 'net_meter'
          }
        },
        {
          id: 'main-panel',
          type: 'main_panel',
          label: 'Main Panel',
          position: { x: 350, y: 50 },
          properties: {
            rating: '200A',
            busbar: '200A',
            spaces: '40'
          }
        },
        {
          id: 'pv-array',
          type: 'pv_array',
          label: 'PV Array',
          position: { x: 200, y: 200 },
          properties: {
            power: '10kW',
            voltage: '600V DC',
            modules: '28'
          }
        },
        {
          id: 'solar-inverter',
          type: 'inverter',
          label: 'Solar Inverter',
          position: { x: 350, y: 200 },
          properties: {
            rating: '10kW',
            efficiency: '97.5%',
            type: 'string'
          }
        }
      ],
      connections: [
        {
          id: 'grid-meter',
          from: 'utility-grid',
          to: 'main-meter',
          label: '240V Service',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'meter-panel',
          from: 'main-meter',
          to: 'main-panel',
          label: '200A Feed',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'pv-inverter',
          from: 'pv-array',
          to: 'solar-inverter',
          label: '600V DC',
          wireGauge: '10 AWG',
          conduitSize: '3/4"'
        },
        {
          id: 'inverter-panel',
          from: 'solar-inverter',
          to: 'main-panel',
          label: '240V AC',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        }
      ],
      metadata: {
        codeYear: 2023,
        jurisdiction: 'NEC',
        standards: ['NEC 705', 'UL 1741'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['solar', 'grid-tie', 'residential', 'basic'],
    requiredComponents: ['pv_array', 'inverter', 'main_panel']
  },
  {
    id: 'solar-battery-backup',
    name: 'Solar + Battery Backup',
    description: 'Solar system with battery backup and critical load panel',
    category: 'battery',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2ZlZmZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSI+U29sYXIgKyBCYXR0ZXJ5PC90ZXh0Pgo8L3N2Zz4=',
    diagram: {
      id: 'solar-battery-backup',
      name: 'Solar + Battery Backup',
      components: [
        {
          id: 'utility-grid',
          type: 'utility_grid',
          label: 'Utility Grid',
          position: { x: 50, y: 50 },
          properties: {
            voltage: '240V',
            phases: 'single',
            groundingType: 'system'
          }
        },
        {
          id: 'main-panel',
          type: 'main_panel',
          label: 'Main Panel',
          position: { x: 300, y: 50 },
          properties: {
            rating: '200A',
            busbar: '200A',
            spaces: '40'
          }
        },
        {
          id: 'critical-panel',
          type: 'subpanel',
          label: 'Critical Load Panel',
          position: { x: 500, y: 50 },
          properties: {
            rating: '100A',
            spaces: '20'
          }
        },
        {
          id: 'pv-array',
          type: 'pv_array',
          label: 'PV Array',
          position: { x: 100, y: 200 },
          properties: {
            power: '12kW',
            voltage: '600V DC',
            modules: '32'
          }
        },
        {
          id: 'hybrid-inverter',
          type: 'inverter',
          label: 'Hybrid Inverter',
          position: { x: 300, y: 200 },
          properties: {
            rating: '12kW',
            type: 'hybrid',
            batteryReady: true
          }
        },
        {
          id: 'battery-system',
          type: 'battery',
          label: 'Battery Storage',
          position: { x: 500, y: 200 },
          properties: {
            capacity: '20kWh',
            voltage: '400V DC',
            type: 'lithium'
          }
        }
      ],
      connections: [
        {
          id: 'grid-panel',
          from: 'utility-grid',
          to: 'main-panel',
          label: '240V Service',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'panel-critical',
          from: 'main-panel',
          to: 'critical-panel',
          label: '100A Feed',
          wireGauge: '3 AWG',
          conduitSize: '1.25"'
        },
        {
          id: 'pv-inverter',
          from: 'pv-array',
          to: 'hybrid-inverter',
          label: '600V DC',
          wireGauge: '10 AWG',
          conduitSize: '3/4"'
        },
        {
          id: 'inverter-panel',
          from: 'hybrid-inverter',
          to: 'main-panel',
          label: '240V AC',
          wireGauge: '4 AWG',
          conduitSize: '1.25"'
        },
        {
          id: 'battery-inverter',
          from: 'battery-system',
          to: 'hybrid-inverter',
          label: '400V DC',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        }
      ],
      metadata: {
        codeYear: 2023,
        jurisdiction: 'NEC',
        standards: ['NEC 705', 'NEC 706', 'UL 1741'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['solar', 'battery', 'backup', 'critical-loads'],
    requiredComponents: ['pv_array', 'inverter', 'battery', 'main_panel', 'subpanel']
  },
  {
    id: 'evse-installation',
    name: 'EV Charging Installation',
    description: 'Dedicated EV charging circuit with load management',
    category: 'evse',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VmZjZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSI+RVYgQ2hhcmdpbmc8L3RleHQ+Cjwvc3ZnPg==',
    diagram: {
      id: 'evse-installation',
      name: 'EV Charging Installation',
      components: [
        {
          id: 'main-panel',
          type: 'main_panel',
          label: 'Main Panel',
          position: { x: 200, y: 50 },
          properties: {
            rating: '200A',
            busbar: '200A',
            spaces: '40'
          }
        },
        {
          id: 'evse-breaker',
          type: 'breaker',
          label: '50A EVSE Breaker',
          position: { x: 200, y: 150 },
          properties: {
            rating: '50A',
            poles: '2',
            type: 'dedicated'
          }
        },
        {
          id: 'evse-disconnect',
          type: 'disconnect',
          label: 'EVSE Disconnect',
          position: { x: 400, y: 150 },
          properties: {
            rating: '60A',
            type: 'non_fused'
          }
        },
        {
          id: 'ev-charger',
          type: 'ev_charger',
          label: 'Level 2 EV Charger',
          position: { x: 600, y: 150 },
          properties: {
            rating: '48A',
            connector: 'J1772',
            power: '11.5kW'
          }
        }
      ],
      connections: [
        {
          id: 'panel-breaker',
          from: 'main-panel',
          to: 'evse-breaker',
          label: '50A Circuit',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        },
        {
          id: 'breaker-disconnect',
          from: 'evse-breaker',
          to: 'evse-disconnect',
          label: '240V Feed',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        },
        {
          id: 'disconnect-charger',
          from: 'evse-disconnect',
          to: 'ev-charger',
          label: '240V Load',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        }
      ],
      metadata: {
        codeYear: 2023,
        jurisdiction: 'NEC',
        standards: ['NEC 625', 'UL 2594'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['evse', 'charging', 'electric-vehicle'],
    requiredComponents: ['main_panel', 'breaker', 'ev_charger']
  },
  {
    id: 'commercial-solar',
    name: 'Commercial Solar System',
    description: 'Three-phase commercial solar installation with multiple inverters',
    category: 'commercial',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2ZlZjNjNyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSI+Q29tbWVyY2lhbCBTb2xhcjwvdGV4dD4KPC9zdmc+',
    diagram: {
      id: 'commercial-solar',
      name: 'Commercial Solar System',
      components: [
        {
          id: 'utility-grid',
          type: 'utility_grid',
          label: 'Utility Grid',
          position: { x: 50, y: 50 },
          properties: {
            voltage: '480V',
            phases: 'three',
            groundingType: 'wye'
          }
        },
        {
          id: 'main-switchboard',
          type: 'main_panel',
          label: 'Main Switchboard',
          position: { x: 300, y: 50 },
          properties: {
            rating: '800A',
            voltage: '480V',
            phases: '3'
          }
        },
        {
          id: 'pv-array-1',
          type: 'pv_array',
          label: 'PV Array 1',
          position: { x: 100, y: 200 },
          properties: {
            power: '50kW',
            voltage: '1000V DC',
            modules: '140'
          }
        },
        {
          id: 'pv-array-2',
          type: 'pv_array',
          label: 'PV Array 2',
          position: { x: 300, y: 200 },
          properties: {
            power: '50kW',
            voltage: '1000V DC',
            modules: '140'
          }
        },
        {
          id: 'inverter-1',
          type: 'inverter',
          label: 'String Inverter 1',
          position: { x: 500, y: 200 },
          properties: {
            rating: '50kW',
            type: 'commercial',
            phases: '3'
          }
        },
        {
          id: 'inverter-2',
          type: 'inverter',
          label: 'String Inverter 2',
          position: { x: 700, y: 200 },
          properties: {
            rating: '50kW',
            type: 'commercial',
            phases: '3'
          }
        }
      ],
      connections: [
        {
          id: 'grid-switchboard',
          from: 'utility-grid',
          to: 'main-switchboard',
          label: '480V 3Φ Service',
          wireGauge: '500 MCM',
          conduitSize: '4"'
        },
        {
          id: 'pv1-inv1',
          from: 'pv-array-1',
          to: 'inverter-1',
          label: '1000V DC',
          wireGauge: '8 AWG',
          conduitSize: '1"'
        },
        {
          id: 'pv2-inv2',
          from: 'pv-array-2',
          to: 'inverter-2',
          label: '1000V DC',
          wireGauge: '8 AWG',
          conduitSize: '1"'
        },
        {
          id: 'inv1-switchboard',
          from: 'inverter-1',
          to: 'main-switchboard',
          label: '480V AC',
          wireGauge: '4 AWG',
          conduitSize: '1.25"'
        },
        {
          id: 'inv2-switchboard',
          from: 'inverter-2',
          to: 'main-switchboard',
          label: '480V AC',
          wireGauge: '4 AWG',
          conduitSize: '1.25"'
        }
      ],
      metadata: {
        codeYear: 2023,
        jurisdiction: 'NEC',
        standards: ['NEC 705', 'UL 1741'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['commercial', 'solar', 'three-phase', 'multiple-inverters'],
    requiredComponents: ['pv_array', 'inverter', 'main_panel']
  },
  {
    id: 'tesla-powerwall-3-with-backup-switch',
    name: 'Tesla Powerwall 3 + Backup Switch',
    description: 'Complete Tesla Powerwall 3 system with integrated solar inverter and Backup Switch for whole home backup',
    category: 'battery',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VmZjZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+VGVzbGEgUG93ZXJ3YWxsIDM8L3RleHQ+Cjwvc3ZnPg==',
    diagram: {
      id: 'tesla-powerwall-3-with-backup-switch',
      name: 'Tesla Powerwall 3 + Backup Switch',
      components: [
        {
          id: 'utility-grid',
          type: 'utility_grid',
          label: 'Utility Grid',
          position: { x: 50, y: 50 },
          properties: {
            voltage: '240V',
            phases: 'single',
            groundingType: 'system'
          }
        },
        {
          id: 'tesla-backup-switch',
          type: 'backup_switch',
          label: 'Tesla Backup Switch',
          position: { x: 200, y: 50 },
          properties: {
            rating: '200A',
            transferType: 'automatic',
            meteringCapability: true
          }
        },
        {
          id: 'main-panel',
          type: 'main_panel',
          label: 'Main Panel',
          position: { x: 400, y: 50 },
          properties: {
            rating: '200A',
            busbar: '200A',
            spaces: '40'
          }
        },
        {
          id: 'tesla-powerwall-3',
          type: 'battery',
          label: 'Tesla Powerwall 3',
          position: { x: 200, y: 200 },
          properties: {
            capacity: '13.5kWh',
            power: '11.5kW',
            integratedInverter: true,
            solarInputs: '6 MPPT'
          }
        },
        {
          id: 'solar-array',
          type: 'pv_array',
          label: 'Solar Array',
          position: { x: 50, y: 300 },
          properties: {
            power: '20kW',
            voltage: '600V DC',
            modules: '50'
          }
        }
      ],
      connections: [
        {
          id: 'grid-switch',
          from: 'utility-grid',
          to: 'tesla-backup-switch',
          label: '240V Service',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'switch-panel',
          from: 'tesla-backup-switch',
          to: 'main-panel',
          label: '200A Feed',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'powerwall-switch',
          from: 'tesla-powerwall-3',
          to: 'tesla-backup-switch',
          label: '240V AC Coupling',
          wireGauge: '4 AWG',
          conduitSize: '1.25"'
        },
        {
          id: 'solar-powerwall',
          from: 'solar-array',
          to: 'tesla-powerwall-3',
          label: '600V DC Direct',
          wireGauge: '10 AWG',
          conduitSize: '3/4"'
        }
      ],
      metadata: {
        codeYear: 2025,
        jurisdiction: 'NEC',
        standards: ['NEC 705', 'NEC 706', 'UL 1741'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['tesla', 'powerwall-3', 'backup-switch', 'whole-home-backup', 'integrated-solar'],
    requiredComponents: ['battery', 'backup_switch', 'pv_array']
  },
  {
    id: 'enphase-iq8-plus-iq-battery-10c',
    name: 'Enphase IQ8+ + IQ Battery 10C',
    description: 'Complete Enphase system with IQ8+ microinverters, IQ Battery 10C storage, and Envoy gateway',
    category: 'mixed',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2ZlZjNjNyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+RW5waGFzZSBJUTggU3lzdGVtPC90ZXh0Pgo8L3N2Zz4=',
    diagram: {
      id: 'enphase-iq8-plus-iq-battery-10c',
      name: 'Enphase IQ8+ + IQ Battery 10C',
      components: [
        {
          id: 'utility-grid',
          type: 'utility_grid',
          label: 'Utility Grid',
          position: { x: 50, y: 50 },
          properties: {
            voltage: '240V',
            phases: 'single',
            groundingType: 'system'
          }
        },
        {
          id: 'main-panel',
          type: 'main_panel',
          label: 'Main Panel',
          position: { x: 300, y: 50 },
          properties: {
            rating: '200A',
            busbar: '200A',
            spaces: '40'
          }
        },
        {
          id: 'iq-combiner-6c',
          type: 'combiner_box',
          label: 'IQ Combiner 6C',
          position: { x: 500, y: 50 },
          properties: {
            pvBreakers: '6',
            batteryBreaker: true,
            meteringCTs: true
          }
        },
        {
          id: 'enphase-envoy',
          type: 'monitoring',
          label: 'Enphase Envoy',
          position: { x: 400, y: 150 },
          properties: {
            communication: 'WiFi/Ethernet',
            maxMicroinverters: '320',
            meteringCapability: true
          }
        },
        {
          id: 'solar-array-1',
          type: 'pv_array',
          label: 'Solar Array East',
          position: { x: 100, y: 250 },
          properties: {
            power: '3.5kW',
            modules: '10 x 350W',
            microinverters: '10 x IQ8+'
          }
        },
        {
          id: 'solar-array-2',
          type: 'pv_array',
          label: 'Solar Array West',
          position: { x: 300, y: 250 },
          properties: {
            power: '3.5kW',
            modules: '10 x 350W',
            microinverters: '10 x IQ8+'
          }
        },
        {
          id: 'iq-battery-10c',
          type: 'battery',
          label: 'IQ Battery 10C',
          position: { x: 500, y: 200 },
          properties: {
            capacity: '10kWh',
            power: '7.08kVA',
            chemistry: 'LFP',
            microinverters: '4 x IQ8B'
          }
        }
      ],
      connections: [
        {
          id: 'grid-panel',
          from: 'utility-grid',
          to: 'main-panel',
          label: '240V Service',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'panel-combiner',
          from: 'main-panel',
          to: 'iq-combiner-6c',
          label: '60A PV Backfeed',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        },
        {
          id: 'array1-combiner',
          from: 'solar-array-1',
          to: 'iq-combiner-6c',
          label: '240V AC Output',
          wireGauge: '12 AWG',
          conduitSize: '3/4"'
        },
        {
          id: 'array2-combiner',
          from: 'solar-array-2',
          to: 'iq-combiner-6c',
          label: '240V AC Output',
          wireGauge: '12 AWG',
          conduitSize: '3/4"'
        },
        {
          id: 'battery-combiner',
          from: 'iq-battery-10c',
          to: 'iq-combiner-6c',
          label: 'Battery AC Output',
          wireGauge: '8 AWG',
          conduitSize: '3/4"'
        },
        {
          id: 'envoy-communication',
          from: 'enphase-envoy',
          to: 'iq-combiner-6c',
          label: 'Communication & Control',
          wireGauge: 'Cat6 Ethernet',
          conduitSize: '1/2"'
        }
      ],
      metadata: {
        codeYear: 2025,
        jurisdiction: 'NEC',
        standards: ['NEC 705', 'NEC 706', 'UL 1741', 'UL 9540A'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['enphase', 'iq8', 'microinverters', 'iq-battery-10c', 'envoy', 'grid-forming'],
    requiredComponents: ['pv_array', 'battery', 'monitoring', 'combiner_box']
  },
  {
    id: 'tesla-enphase-hybrid',
    name: 'Tesla Powerwall 3 + Enphase IQ8',
    description: 'Hybrid system combining Tesla Powerwall 3 storage with Enphase IQ8 microinverters for maximum flexibility',
    category: 'mixed',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2ZlZjNjNyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiBmaWxsPSIjMzc0MTUxIj5UZXNsYSArIEVucGhhc2U8L3RleHQ+Cjwvc3ZnPg==',
    diagram: {
      id: 'tesla-enphase-hybrid',
      name: 'Tesla Powerwall 3 + Enphase IQ8',
      components: [
        {
          id: 'utility-grid',
          type: 'utility_grid',
          label: 'Utility Grid',
          position: { x: 50, y: 50 },
          properties: {
            voltage: '240V',
            phases: 'single',
            groundingType: 'system'
          }
        },
        {
          id: 'tesla-gateway-3',
          type: 'gateway',
          label: 'Tesla Gateway 3',
          position: { x: 200, y: 50 },
          properties: {
            rating: '200A',
            meteringCapability: true,
            backupCapability: 'partial'
          }
        },
        {
          id: 'main-panel',
          type: 'main_panel',
          label: 'Main Panel',
          position: { x: 400, y: 50 },
          properties: {
            rating: '200A',
            busbar: '200A',
            spaces: '40'
          }
        },
        {
          id: 'critical-panel',
          type: 'subpanel',
          label: 'Critical Load Panel',
          position: { x: 600, y: 50 },
          properties: {
            rating: '100A',
            spaces: '20'
          }
        },
        {
          id: 'tesla-powerwall-3',
          type: 'battery',
          label: 'Tesla Powerwall 3',
          position: { x: 100, y: 200 },
          properties: {
            capacity: '13.5kWh',
            power: '11.5kW',
            integratedInverter: true
          }
        },
        {
          id: 'enphase-solar-array',
          type: 'pv_array',
          label: 'Enphase Solar Array',
          position: { x: 400, y: 200 },
          properties: {
            power: '10kW',
            modules: '25 x 400W',
            microinverters: '25 x IQ8M'
          }
        },
        {
          id: 'tesla-solar-direct',
          type: 'pv_array',
          label: 'Tesla Direct Solar',
          position: { x: 100, y: 300 },
          properties: {
            power: '8kW',
            modules: '20 x 400W',
            directToPowerwall: true
          }
        },
        {
          id: 'enphase-envoy',
          type: 'monitoring',
          label: 'Enphase Envoy',
          position: { x: 500, y: 150 },
          properties: {
            communication: 'WiFi/Ethernet',
            meteringCapability: true
          }
        }
      ],
      connections: [
        {
          id: 'grid-gateway',
          from: 'utility-grid',
          to: 'tesla-gateway-3',
          label: '240V Service',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'gateway-panel',
          from: 'tesla-gateway-3',
          to: 'main-panel',
          label: '200A Feed',
          wireGauge: '4/0 AWG',
          conduitSize: '2"'
        },
        {
          id: 'panel-critical',
          from: 'main-panel',
          to: 'critical-panel',
          label: '100A Critical Feed',
          wireGauge: '3 AWG',
          conduitSize: '1.25"'
        },
        {
          id: 'powerwall-gateway',
          from: 'tesla-powerwall-3',
          to: 'tesla-gateway-3',
          label: '240V AC Coupling',
          wireGauge: '4 AWG',
          conduitSize: '1.25"'
        },
        {
          id: 'enphase-panel',
          from: 'enphase-solar-array',
          to: 'main-panel',
          label: '240V AC Backfeed',
          wireGauge: '6 AWG',
          conduitSize: '1"'
        },
        {
          id: 'tesla-solar-powerwall',
          from: 'tesla-solar-direct',
          to: 'tesla-powerwall-3',
          label: '600V DC Direct',
          wireGauge: '10 AWG',
          conduitSize: '3/4"'
        }
      ],
      metadata: {
        codeYear: 2025,
        jurisdiction: 'NEC',
        standards: ['NEC 705', 'NEC 706', 'UL 1741', 'UL 9540A'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    },
    tags: ['tesla', 'enphase', 'hybrid', 'powerwall-3', 'iq8', 'flexible-backup'],
    requiredComponents: ['battery', 'pv_array', 'gateway', 'monitoring']
  }
];

export class SLDTemplateService {
  /**
   * Get all available SLD templates
   */
  static getAllTemplates(): SLDTemplate[] {
    return SLD_TEMPLATES;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: SLDTemplate['category']): SLDTemplate[] {
    return SLD_TEMPLATES.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): SLDTemplate | null {
    return SLD_TEMPLATES.find(template => template.id === id) || null;
  }

  /**
   * Search templates by name, description, or tags
   */
  static searchTemplates(query: string): SLDTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return SLD_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Apply template to create a new diagram
   */
  static applyTemplate(templateId: string): SLDDiagram | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const timestamp = Date.now();
    
    // Create component ID mapping for connections
    const componentIdMap: Record<string, string> = {};
    const newComponents = template.diagram.components.map(component => {
      const newId = `${component.id}-${timestamp}`;
      componentIdMap[component.id] = newId;
      return {
        ...component,
        id: newId,
        // Ensure all required SLDComponent properties exist
        position: component.position || { x: 100, y: 100 },
        size: component.size || { width: 80, height: 60 },
        rotation: component.rotation || 0,
        labels: component.labels || [],
        necLabels: component.necLabels || [],
        specifications: component.specifications || {},
        // Preserve any additional properties from the original component
        name: component.name || component.label || component.type
      };
    });

    // Create a deep copy of the template diagram with new IDs and proper connection mapping
    const newDiagram: SLDDiagram = {
      ...template.diagram,
      id: `diagram-${timestamp}`,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      components: newComponents,
      connections: template.diagram.connections.map(connection => ({
        ...connection,
        id: `${connection.id}-${timestamp}`,
        // Map from/to to fromComponentId/toComponentId
        fromComponentId: componentIdMap[(connection as any).from] || (connection as any).from,
        toComponentId: componentIdMap[(connection as any).to] || (connection as any).to,
        // Ensure wireType is set (default to 'ac' if not specified)
        wireType: (connection as any).wireType || 'ac',
        // Map additional properties
        fromPort: (connection as any).fromPort || 'output',
        toPort: (connection as any).toPort || 'input'
      })),
      metadata: {
        ...template.diagram.metadata,
        created: new Date().toISOString(),
        templateUsed: templateId
      }
    };

    return newDiagram;
  }

  /**
   * Get template categories with counts
   */
  static getCategories(): Array<{ category: SLDTemplate['category']; count: number; label: string }> {
    const categoryLabels: Record<SLDTemplate['category'], string> = {
      residential: 'Residential',
      commercial: 'Commercial',
      solar: 'Solar Only',
      battery: 'Battery Systems',
      evse: 'EV Charging',
      mixed: 'Mixed Systems'
    };

    const categoryCounts = SLD_TEMPLATES.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<SLDTemplate['category'], number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category: category as SLDTemplate['category'],
      count,
      label: categoryLabels[category as SLDTemplate['category']]
    }));
  }

  /**
   * Validate if current load data is compatible with template
   */
  static isTemplateCompatible(templateId: string, loadData: any): { compatible: boolean; missingComponents: string[] } {
    const template = this.getTemplateById(templateId);
    if (!template) return { compatible: false, missingComponents: [] };

    const missingComponents: string[] = [];

    // Check if required components are available based on load data
    template.requiredComponents.forEach(component => {
      switch (component) {
        case 'pv_array':
          if (!loadData.solarBatteryLoads?.some((load: any) => load.type === 'solar' && load.quantity > 0)) {
            missingComponents.push('Solar PV System');
          }
          break;
        case 'battery':
          if (!loadData.solarBatteryLoads?.some((load: any) => load.type === 'battery' && load.quantity > 0)) {
            missingComponents.push('Battery Storage');
          }
          break;
        case 'ev_charger':
          if (!loadData.evseLoads?.some((load: any) => load.quantity > 0)) {
            missingComponents.push('EV Charging Equipment');
          }
          break;
        case 'main_panel':
          // Always assume main panel exists
          break;
        default:
          break;
      }
    });

    return {
      compatible: missingComponents.length === 0,
      missingComponents
    };
  }
}