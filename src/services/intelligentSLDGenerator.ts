/**
 * Intelligent SLD Generator Service
 * 
 * Automatically generates professional single line diagrams from load calculator data
 * Implements industry best practices from ETAP, AutoCAD Electrical, and SKM PowerTools
 */

import type { LoadState } from '../types/load';
import type { SLDComponent, SLDConnection, SLDDiagram } from '../types/sld';
import type { GeneratedSLDComponent, SLDGenerationOptions, SLDLayout } from '../types/sld-generator';
import { getComplianceWireSize } from './necComplianceEngine';

/**
 * Professional SLD component templates with proper specifications
 */
const SLD_COMPONENT_TEMPLATES = {
  utility_service: {
    type: 'utility_service' as const,
    name: 'Utility Service',
    symbol: '⚡',
    width: 100,
    height: 60,
    properties: {
      rating: '200A',
      voltage: 240,
      necReference: 'NEC 230.2'
    }
  },
  service_disconnect: {
    type: 'service_disconnect' as const,
    name: 'Service Disconnect',
    symbol: '⚹',
    width: 80,
    height: 50,
    properties: {
      rating: '200A',
      voltage: 240,
      necReference: 'NEC 230.70'
    }
  },
  meter_socket: {
    type: 'meter_socket' as const,
    name: 'Electric Meter',
    symbol: '◉',
    width: 70,
    height: 70,
    properties: {
      rating: '200A',
      voltage: 240,
      necReference: 'NEC 230.66'
    }
  },
  main_panel: {
    type: 'main_panel' as const,
    name: 'Main Panel',
    symbol: '▦',
    width: 120,
    height: 180,
    properties: {
      rating: '200A',
      voltage: 240,
      necReference: 'NEC 408.3'
    }
  },
  sub_panel: {
    type: 'sub_panel' as const,
    name: 'Sub Panel',
    symbol: '▢',
    width: 100,
    height: 150,
    properties: {
      rating: '100A',
      voltage: 240,
      necReference: 'NEC 408.3'
    }
  },
  circuit_breaker: {
    type: 'circuit_breaker' as const,
    name: 'Circuit Breaker',
    symbol: '⚡',
    width: 60,
    height: 30,
    properties: {
      rating: '20A',
      voltage: 240,
      necReference: 'NEC 240.6'
    }
  },
  evse_charger: {
    type: 'evse_charger' as const,
    name: 'EVSE Charger',
    symbol: '🔌',
    width: 80,
    height: 100,
    properties: {
      rating: '40A',
      voltage: 240,
      necReference: 'NEC 625.17'
    }
  },
  solar_inverter: {
    type: 'solar_inverter' as const,
    name: 'Solar Inverter',
    symbol: '〜',
    width: 100,
    height: 80,
    properties: {
      rating: '30A',
      voltage: 240,
      necReference: 'NEC 690.8'
    }
  },
  pv_array: {
    type: 'pv_array' as const,
    name: 'PV Array',
    symbol: '☀',
    width: 120,
    height: 60,
    properties: {
      rating: '25A',
      voltage: 600,
      necReference: 'NEC 690.7'
    }
  },
  load_generic: {
    type: 'load_generic' as const,
    name: 'General Load',
    symbol: '⚡',
    width: 80,
    height: 50,
    properties: {
      rating: '15A',
      voltage: 120,
      necReference: 'NEC 220.12'
    }
  }
};

/**
 * Calculate optimal layout positions for SLD components
 */
export const calculateSLDLayout = (
  loads: LoadState,
  options: SLDGenerationOptions
): SLDLayout => {
  const baseSpacing = { horizontal: 200, vertical: 150, panelSpacing: 300 };
  
  // Calculate total loads to determine layout complexity
  const totalLoads = loads.generalLoads.length + loads.hvacLoads.length + 
                    loads.evseLoads.length + loads.solarBatteryLoads.length;
  
  // Service entrance positioning (top-left)
  const serviceEntrance = { x: 100, y: 100 };
  
  // Main panel positioning (center)
  const mainPanel = { x: 400, y: 300 };
  
  // Sub-panels for large installations
  const subPanels: Array<{ x: number; y: number; name: string }> = [];
  if (totalLoads > 10) {
    subPanels.push(
      { x: 700, y: 300, name: 'Panel A' },
      { x: 700, y: 500, name: 'Panel B' }
    );
  }
  
  // Load positioning (right side)
  const loads_positions: Array<{ x: number; y: number; component: any }> = [];
  let currentY = 200;
  const loadX = subPanels.length > 0 ? 1000 : 700;
  
  // Position loads vertically with proper spacing
  [...loads.generalLoads, ...loads.hvacLoads, ...loads.evseLoads].forEach((load, index) => {
    loads_positions.push({
      x: loadX,
      y: currentY + (index * baseSpacing.vertical * 0.8),
      component: null // Will be populated later
    });
  });
  
  return {
    serviceEntrance,
    mainPanel,
    subPanels,
    loads: loads_positions,
    spacing: baseSpacing
  };
};

/**
 * Generate circuit numbers following NEC conventions
 */
export const generateCircuitNumbers = (
  loads: LoadState,
  startingNumber: number = 1
): Map<string, string> => {
  const circuitMap = new Map<string, string>();
  let circuitNumber = startingNumber;
  
  // General loads - typically odd numbers for 120V, even for 240V
  loads.generalLoads.forEach((load, index) => {
    const isOdd = circuitNumber % 2 === 1;
    const circuitLabel = load.volts === 240 ? `${circuitNumber}/${circuitNumber + 1}` : `${circuitNumber}`;
    circuitMap.set(`general-${load.id}`, circuitLabel);
    circuitNumber += load.volts === 240 ? 2 : 1;
  });
  
  // HVAC loads - typically dedicated circuits
  loads.hvacLoads.forEach((load, index) => {
    const circuitLabel = load.volts === 240 ? `${circuitNumber}/${circuitNumber + 1}` : `${circuitNumber}`;
    circuitMap.set(`hvac-${load.id}`, circuitLabel);
    circuitNumber += load.volts === 240 ? 2 : 1;
  });
  
  // EVSE loads - dedicated 240V circuits
  loads.evseLoads.forEach((load, index) => {
    const circuitLabel = `${circuitNumber}/${circuitNumber + 1}`;
    circuitMap.set(`evse-${load.id}`, circuitLabel);
    circuitNumber += 2;
  });
  
  return circuitMap;
};

/**
 * Generate wire sizing for each circuit
 */
export const generateWireSizing = (
  loads: LoadState,
  options: SLDGenerationOptions
): Map<string, { wireSize: string; conduitSize: string; necCompliant: boolean }> => {
  const wiringSizeMap = new Map();
  
  // Calculate wire sizing for each load type
  [...loads.generalLoads, ...loads.hvacLoads, ...loads.evseLoads].forEach(load => {
    const loadId = `${load.constructor.name.toLowerCase()}-${load.id}`;
    
    const wireCalc = getComplianceWireSize(
      load.amps,
      load.volts || options.voltageLevel,
      100, // Default 100ft run
      '75C',
      3,
      'copper',
      30,
      load.continuous || false,
      false,
      3
    );
    
    // Estimate conduit size based on wire size and quantity
    const conduitSize = estimateConduitSize(wireCalc.wireSize, load.volts === 240 ? 3 : 2);
    
    wiringSizeMap.set(loadId, {
      wireSize: wireCalc.wireSize,
      conduitSize,
      necCompliant: wireCalc.isCompliant
    });
  });
  
  return wiringSizeMap;
};

/**
 * Estimate conduit size based on wire size and conductor count
 */
const estimateConduitSize = (wireSize: string, conductorCount: number): string => {
  const conduitSizes = {
    '14': conductorCount <= 9 ? '1/2"' : '3/4"',
    '12': conductorCount <= 7 ? '1/2"' : '3/4"',
    '10': conductorCount <= 5 ? '1/2"' : '3/4"',
    '8': conductorCount <= 3 ? '3/4"' : '1"',
    '6': '1"',
    '4': '1-1/4"',
    '2': '1-1/2"',
    '1': '2"',
    '1/0': '2"',
    '2/0': '2-1/2"',
    '3/0': '3"',
    '4/0': '3-1/2"'
  };
  
  return conduitSizes[wireSize as keyof typeof conduitSizes] || '1"';
};

/**
 * Main function to generate intelligent SLD from load data
 */
export const generateIntelligentSLD = (
  loads: LoadState,
  projectInfo: any,
  options: SLDGenerationOptions
): { diagram: SLDDiagram; components: GeneratedSLDComponent[]; connections: SLDConnection[] } => {
  const layout = calculateSLDLayout(loads, options);
  const circuitNumbers = generateCircuitNumbers(loads);
  const wireSizing = generateWireSizing(loads, options);
  
  const components: GeneratedSLDComponent[] = [];
  const connections: SLDConnection[] = [];
  
  // Service entrance components
  const utilityService: GeneratedSLDComponent = {
    ...SLD_COMPONENT_TEMPLATES.utility_service,
    id: 'utility-service',
    position: layout.serviceEntrance,
    specifications: {
      rating: `${options.serviceSize}A`,
      voltage: options.voltageLevel,
      necReference: 'NEC 230.2',
    }
  };
  components.push(utilityService);
  
  // Meter socket
  const meterSocket: GeneratedSLDComponent = {
    ...SLD_COMPONENT_TEMPLATES.meter_socket,
    id: 'meter-socket',
    position: { x: layout.serviceEntrance.x, y: layout.serviceEntrance.y + 100 },
    specifications: {
      rating: `${options.serviceSize}A`,
      voltage: options.voltageLevel,
      necReference: 'NEC 230.66',
    }
  };
  components.push(meterSocket);
  
  // Service disconnect
  const serviceDisconnect: GeneratedSLDComponent = {
    ...SLD_COMPONENT_TEMPLATES.service_disconnect,
    id: 'service-disconnect',
    position: { x: layout.serviceEntrance.x, y: layout.serviceEntrance.y + 200 },
    specifications: {
      rating: `${options.serviceSize}A`,
      voltage: options.voltageLevel,
      necReference: 'NEC 230.70',
    }
  };
  components.push(serviceDisconnect);
  
  // Main panel
  const mainPanel: GeneratedSLDComponent = {
    ...SLD_COMPONENT_TEMPLATES.main_panel,
    id: 'main-panel',
    position: layout.mainPanel,
    name: `Main Panel - ${options.serviceSize}A`,
    specifications: {
      rating: `${options.serviceSize}A`,
      voltage: options.voltageLevel,
      necReference: 'NEC 408.3',
    }
  };
  components.push(mainPanel);
  
  // Service entrance connections
  connections.push(
    { id: 'utility-to-meter', from: 'utility-service', to: 'meter-socket', type: 'power' },
    { id: 'meter-to-disconnect', from: 'meter-socket', to: 'service-disconnect', type: 'power' },
    { id: 'disconnect-to-main', from: 'service-disconnect', to: 'main-panel', type: 'power' }
  );
  
  // Generate individual load components
  let loadY = layout.mainPanel.y + 200;
  let circuitCounter = 1;
  
  // General loads
  loads.generalLoads.forEach((load, index) => {
    if (load.quantity > 0) {
      const loadComponent: GeneratedSLDComponent = {
        ...SLD_COMPONENT_TEMPLATES.load_generic,
        id: `general-load-${load.id}`,
        name: load.name || `General Load ${index + 1}`,
        position: { x: layout.mainPanel.x + 300, y: loadY },
        loadReference: {
          type: 'general',
          loadId: load.id,
          loadName: load.name || `General Load ${index + 1}`
        },
        circuitNumber: circuitNumbers.get(`general-${load.id}`),
        specifications: {
          rating: `${load.amps}A`,
          voltage: load.volts || 120,
          wireSize: wireSizing.get(`general-${load.id}`)?.wireSize,
          conduitSize: wireSizing.get(`general-${load.id}`)?.conduitSize,
          necReference: 'NEC 220.12',
          continuousLoad: load.continuous
        }
      };
      components.push(loadComponent);
      
      // Connection from main panel to load
      connections.push({
        id: `main-to-general-${load.id}`,
        from: 'main-panel',
        to: `general-load-${load.id}`,
        type: 'power',
        specifications: {
          wireSize: wireSizing.get(`general-${load.id}`)?.wireSize,
          conduitSize: wireSizing.get(`general-${load.id}`)?.conduitSize,
          circuitNumber: circuitNumbers.get(`general-${load.id}`)
        }
      });
      
      loadY += layout.spacing.vertical * 0.6;
    }
  });
  
  // HVAC loads
  loads.hvacLoads.forEach((load, index) => {
    if (load.quantity > 0) {
      const hvacComponent: GeneratedSLDComponent = {
        ...SLD_COMPONENT_TEMPLATES.load_generic,
        id: `hvac-load-${load.id}`,
        name: load.name || `HVAC Load ${index + 1}`,
        symbol: '❄',
        position: { x: layout.mainPanel.x + 300, y: loadY },
        loadReference: {
          type: 'hvac',
          loadId: load.id,
          loadName: load.name || `HVAC Load ${index + 1}`
        },
        circuitNumber: circuitNumbers.get(`hvac-${load.id}`),
        specifications: {
          rating: `${load.amps}A`,
          voltage: load.volts || 240,
          wireSize: wireSizing.get(`hvac-${load.id}`)?.wireSize,
          conduitSize: wireSizing.get(`hvac-${load.id}`)?.conduitSize,
          necReference: 'NEC 430.22',
          continuousLoad: load.continuous
        }
      };
      components.push(hvacComponent);
      
      connections.push({
        id: `main-to-hvac-${load.id}`,
        from: 'main-panel',
        to: `hvac-load-${load.id}`,
        type: 'power',
        specifications: {
          wireSize: wireSizing.get(`hvac-${load.id}`)?.wireSize,
          conduitSize: wireSizing.get(`hvac-${load.id}`)?.conduitSize,
          circuitNumber: circuitNumbers.get(`hvac-${load.id}`)
        }
      });
      
      loadY += layout.spacing.vertical * 0.6;
    }
  });
  
  // EVSE loads
  loads.evseLoads.forEach((load, index) => {
    if (load.quantity > 0) {
      const evseComponent: GeneratedSLDComponent = {
        ...SLD_COMPONENT_TEMPLATES.evse_charger,
        id: `evse-load-${load.id}`,
        name: load.name || `EVSE ${index + 1}`,
        position: { x: layout.mainPanel.x + 300, y: loadY },
        loadReference: {
          type: 'evse',
          loadId: load.id,
          loadName: load.name || `EVSE ${index + 1}`
        },
        circuitNumber: circuitNumbers.get(`evse-${load.id}`),
        specifications: {
          rating: `${load.amps}A`,
          voltage: 240,
          wireSize: wireSizing.get(`evse-${load.id}`)?.wireSize,
          conduitSize: wireSizing.get(`evse-${load.id}`)?.conduitSize,
          necReference: 'NEC 625.17',
          continuousLoad: true
        }
      };
      components.push(evseComponent);
      
      connections.push({
        id: `main-to-evse-${load.id}`,
        from: 'main-panel',
        to: `evse-load-${load.id}`,
        type: 'power',
        specifications: {
          wireSize: wireSizing.get(`evse-${load.id}`)?.wireSize,
          conduitSize: wireSizing.get(`evse-${load.id}`)?.conduitSize,
          circuitNumber: circuitNumbers.get(`evse-${load.id}`)
        }
      });
      
      loadY += layout.spacing.vertical * 0.8;
    }
  });
  
  // Solar/Battery loads
  loads.solarBatteryLoads.forEach((load, index) => {
    if (load.kw > 0) {
      // PV Array
      const pvArray: GeneratedSLDComponent = {
        ...SLD_COMPONENT_TEMPLATES.pv_array,
        id: `pv-array-${load.id}`,
        name: `PV Array ${index + 1}`,
        position: { x: layout.mainPanel.x - 400, y: loadY },
        loadReference: {
          type: 'solar',
          loadId: load.id,
          loadName: load.name || `Solar System ${index + 1}`
        },
        specifications: {
          rating: `${load.kw}kW`,
          voltage: 600,
          necReference: 'NEC 690.7'
        }
      };
      components.push(pvArray);
      
      // Solar Inverter
      const solarInverter: GeneratedSLDComponent = {
        ...SLD_COMPONENT_TEMPLATES.solar_inverter,
        id: `solar-inverter-${load.id}`,
        name: `Solar Inverter ${index + 1}`,
        position: { x: layout.mainPanel.x - 200, y: loadY },
        loadReference: {
          type: 'solar',
          loadId: load.id,
          loadName: load.name || `Solar System ${index + 1}`
        },
        specifications: {
          rating: `${load.breaker}A`,
          voltage: 240,
          wireSize: wireSizing.get(`solar-${load.id}`)?.wireSize,
          necReference: 'NEC 690.8'
        }
      };
      components.push(solarInverter);
      
      // Connections
      connections.push(
        {
          id: `pv-to-inverter-${load.id}`,
          from: `pv-array-${load.id}`,
          to: `solar-inverter-${load.id}`,
          type: 'dc'
        },
        {
          id: `inverter-to-main-${load.id}`,
          from: `solar-inverter-${load.id}`,
          to: 'main-panel',
          type: 'power',
          specifications: {
            wireSize: wireSizing.get(`solar-${load.id}`)?.wireSize,
            circuitNumber: `Solar ${index + 1}`
          }
        }
      );
      
      loadY += layout.spacing.vertical * 0.8;
    }
  });
  
  // Create the diagram
  const diagram: SLDDiagram = {
    id: `auto-generated-${Date.now()}`,
    name: `${projectInfo.name || 'Project'} - Single Line Diagram`,
    description: 'Auto-generated from load calculations',
    components,
    connections,
    metadata: {
      serviceSize: options.serviceSize,
      voltageLevel: options.voltageLevel,
      diagramStyle: options.diagramStyle,
      generatedAt: new Date().toISOString(),
      generatedFrom: 'loadCalculator',
      necCompliant: true,
      includedFeatures: {
        loadCalculations: options.includeLoadCalculations,
        circuitNumbers: options.includeCircuitNumbers,
        wireSizing: options.includeWireSizing,
        necReferences: options.includeNECReferences
      }
    }
  };
  
  return { diagram, components, connections };
};

export default {
  generateIntelligentSLD,
  calculateSLDLayout,
  generateCircuitNumbers,
  generateWireSizing
};