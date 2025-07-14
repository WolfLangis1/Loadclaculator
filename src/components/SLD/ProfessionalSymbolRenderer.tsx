import React from 'react';
import { IEEESymbols } from './IEEESymbolLibrary';
import { RealisticComponentRenderer } from './RealisticComponentRenderer';
import type { SLDComponent } from '../../types/sld';

interface ProfessionalSymbolRendererProps {
  component: SLDComponent;
  size: { width: number; height: number };
  isSelected?: boolean;
  isHovered?: boolean;
  baseProps?: any;
  accessibilityMode?: boolean;
  renderingMode?: 'ieee' | 'realistic' | 'hybrid';
  symbolColor?: string;
  symbolStroke?: number;
}

/**
 * Professional Symbol Renderer that can switch between IEEE standard symbols
 * and realistic component representations based on user preference
 */
export const ProfessionalSymbolRenderer: React.FC<ProfessionalSymbolRendererProps> = ({
  component,
  size,
  isSelected = false,
  isHovered = false,
  baseProps = {},
  accessibilityMode = false,
  renderingMode = 'hybrid',
  symbolColor = '#1f2937',
  symbolStroke = 2
}) => {
  // Map component types to IEEE symbols
  const getIEEESymbol = (componentType: string) => {
    const symbolMap: Record<string, React.ComponentType<any>> = {
      // Power Sources
      'ac_source': IEEESymbols.ACVoltageSource,
      'dc_source': IEEESymbols.DCVoltageSource,
      'generator': IEEESymbols.Generator,
      'utility_grid': IEEESymbols.ACVoltageSource,
      
      // Transformers
      'transformer_single': IEEESymbols.TransformerSinglePhase,
      'transformer_three': IEEESymbols.TransformerThreePhase,
      'transformer': IEEESymbols.TransformerSinglePhase,
      
      // Protective Devices
      'circuit_breaker': IEEESymbols.CircuitBreaker,
      'breaker': IEEESymbols.CircuitBreaker,
      'fuse': IEEESymbols.Fuse,
      'gfi': IEEESymbols.GroundFaultInterrupter,
      'gfci': IEEESymbols.GroundFaultInterrupter,
      
      // Switching Devices
      'switch': IEEESymbols.SwitchSinglePole,
      'switch_single': IEEESymbols.SwitchSinglePole,
      'switch_three': IEEESymbols.SwitchThreePole,
      'disconnect': IEEESymbols.Disconnect,
      'dc_disconnect': IEEESymbols.Disconnect,
      'ac_disconnect': IEEESymbols.Disconnect,
      'main_disconnect': IEEESymbols.Disconnect,
      
      // Metering
      'ammeter': IEEESymbols.Ammeter,
      'voltmeter': IEEESymbols.Voltmeter,
      'wattmeter': IEEESymbols.Wattmeter,
      'meter': IEEESymbols.Wattmeter,
      
      // Motors and Loads
      'motor': IEEESymbols.MotorGeneral,
      'load': IEEESymbols.LoadGeneral,
      'hvac_load': IEEESymbols.MotorGeneral,
      'general_load': IEEESymbols.LoadGeneral,
      
      // Grounding
      'ground': IEEESymbols.GroundEarth,
      'grounding_electrode': IEEESymbols.GroundEarth,
      'chassis_ground': IEEESymbols.GroundChassis,
      
      // Distribution
      'busway': IEEESymbols.Busway,
      'main_panel': IEEESymbols.Busway, // Use busway symbol for panels in IEEE mode
      
      // Renewable Energy
      'pv_array': IEEESymbols.SolarPanel,
      'solar_panel': IEEESymbols.SolarPanel,
      'wind_turbine': IEEESymbols.WindTurbine,
      'battery': IEEESymbols.Battery,
      
      // Inverters (use generator symbol for IEEE compliance)
      'inverter': IEEESymbols.Generator,
      'string_inverter': IEEESymbols.Generator,
      'micro_inverter': IEEESymbols.Generator
    };
    
    return symbolMap[componentType] || IEEESymbols.LoadGeneral;
  };

  // Render IEEE standard symbol
  const renderIEEESymbol = () => {
    const SymbolComponent = getIEEESymbol(component.type);
    
    return (
      <g {...baseProps}>
        <SymbolComponent
          width={size.width}
          height={size.height}
          strokeWidth={symbolStroke}
          color={isSelected ? '#3b82f6' : symbolColor}
          fillColor={isHovered ? 'rgba(59, 130, 246, 0.1)' : 'none'}
        />
        
        {/* Component label */}
        <text
          x={size.width / 2}
          y={size.height + 15}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill={symbolColor}
          className="select-none"
        >
          {component.name || component.type.toUpperCase()}
        </text>
        
        {/* Specification labels */}
        {component.specifications && (
          <g>
            {component.specifications.rating && (
              <text
                x={size.width / 2}
                y={size.height + 27}
                textAnchor="middle"
                fontSize="8"
                fill="#6b7280"
                className="select-none"
              >
                {component.specifications.rating}
                {typeof component.specifications.rating === 'number' ? 'A' : ''}
              </text>
            )}
            {component.specifications.voltage && (
              <text
                x={size.width / 2}
                y={size.height + 37}
                textAnchor="middle"
                fontSize="8"
                fill="#6b7280"
                className="select-none"
              >
                {component.specifications.voltage}V
              </text>
            )}
          </g>
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <rect
            x={-4}
            y={-4}
            width={size.width + 8}
            height={size.height + 8}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        
        {/* Accessibility description */}
        {accessibilityMode && (
          <desc id={`component-${component.id}-desc`}>
            IEEE standard symbol for {component.type}, labeled as {component.name}
            {component.specifications?.rating && `, rated ${component.specifications.rating}`}
            {component.specifications?.voltage && `, ${component.specifications.voltage}V`}
          </desc>
        )}
      </g>
    );
  };

  // Render realistic component representation
  const renderRealisticComponent = () => {
    return (
      <RealisticComponentRenderer
        component={component}
        size={size}
        isSelected={isSelected}
        isHovered={isHovered}
        baseProps={baseProps}
        accessibilityMode={accessibilityMode}
      />
    );
  };

  // Render hybrid view (IEEE symbol with realistic details)
  const renderHybridView = () => {
    return (
      <g {...baseProps}>
        {/* IEEE symbol as base */}
        {renderIEEESymbol()}
        
        {/* Realistic details overlay */}
        <g opacity="0.3" transform={`translate(${size.width + 10}, 0)`}>
          <RealisticComponentRenderer
            component={component}
            size={{ width: size.width * 0.6, height: size.height * 0.6 }}
            isSelected={false}
            isHovered={false}
            baseProps={{}}
            accessibilityMode={false}
          />
        </g>
      </g>
    );
  };

  // Render based on mode
  switch (renderingMode) {
    case 'ieee':
      return renderIEEESymbol();
    case 'realistic':
      return renderRealisticComponent();
    case 'hybrid':
      return renderHybridView();
    default:
      return renderIEEESymbol();
  }
};

// Enhanced component library integration
export const createIEEEComponentTemplate = (
  id: string,
  name: string,
  type: string,
  category: string,
  specifications: Record<string, any> = {},
  defaultSize: { width: number; height: number } = { width: 60, height: 60 }
) => {
  return {
    id,
    name,
    category,
    type,
    icon: React.createElement('div', { 
      className: 'w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-xs bg-blue-50',
      children: type.charAt(0).toUpperCase()
    }),
    color: '#1f2937',
    defaultSize,
    description: `IEEE 315 compliant ${name}`,
    specifications,
    renderingMode: 'ieee' as const
  };
};

// Professional IEEE symbol templates
export const IEEE_COMPONENT_TEMPLATES = [
  // Power Sources
  createIEEEComponentTemplate(
    'ieee_ac_source',
    'AC Voltage Source',
    'ac_source',
    'Power Sources',
    { voltage: 240, frequency: 60, phases: 1 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_dc_source',
    'DC Voltage Source',
    'dc_source',
    'Power Sources',
    { voltage: 48, polarity: 'positive' }
  ),
  
  createIEEEComponentTemplate(
    'ieee_generator',
    'Generator',
    'generator',
    'Power Sources',
    { rating: 100, voltage: 480, phases: 3, fuel: 'diesel' }
  ),
  
  // Transformers
  createIEEEComponentTemplate(
    'ieee_transformer_single',
    'Single Phase Transformer',
    'transformer_single',
    'Transformers',
    { primaryVoltage: 240, secondaryVoltage: 120, kva: 25 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_transformer_three',
    'Three Phase Transformer',
    'transformer_three',
    'Transformers',
    { primaryVoltage: 480, secondaryVoltage: 208, kva: 75, connection: 'delta-wye' }
  ),
  
  // Protective Devices
  createIEEEComponentTemplate(
    'ieee_circuit_breaker',
    'Circuit Breaker',
    'circuit_breaker',
    'Protection',
    { rating: 100, voltage: 240, poles: 2, interruptingCapacity: 10000 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_fuse',
    'Fuse',
    'fuse',
    'Protection',
    { rating: 30, voltage: 250, type: 'cartridge', speed: 'fast' }
  ),
  
  createIEEEComponentTemplate(
    'ieee_gfi',
    'Ground Fault Interrupter',
    'gfi',
    'Protection',
    { rating: 20, sensitivity: 5, type: 'class_a' }
  ),
  
  // Switching Devices
  createIEEEComponentTemplate(
    'ieee_switch_single',
    'Single Pole Switch',
    'switch_single',
    'Switching',
    { rating: 20, voltage: 120, poles: 1 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_switch_three',
    'Three Pole Switch',
    'switch_three',
    'Switching',
    { rating: 100, voltage: 480, poles: 3 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_disconnect',
    'Disconnect Switch',
    'disconnect',
    'Switching',
    { rating: 60, voltage: 240, fusible: false, type: 'non_load_break' }
  ),
  
  // Metering
  createIEEEComponentTemplate(
    'ieee_ammeter',
    'Ammeter',
    'ammeter',
    'Metering',
    { range: '0-100A', accuracy: 1.0, type: 'analog' }
  ),
  
  createIEEEComponentTemplate(
    'ieee_voltmeter',
    'Voltmeter',
    'voltmeter',
    'Metering',
    { range: '0-250V', accuracy: 1.0, type: 'analog' }
  ),
  
  createIEEEComponentTemplate(
    'ieee_wattmeter',
    'Wattmeter',
    'wattmeter',
    'Metering',
    { range: '0-10kW', accuracy: 0.5, type: 'digital' }
  ),
  
  // Motors and Loads
  createIEEEComponentTemplate(
    'ieee_motor',
    'Motor',
    'motor',
    'Motors',
    { hp: 5, voltage: 480, phases: 3, rpm: 1800, efficiency: 0.9 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_load',
    'General Load',
    'load',
    'Loads',
    { power: 1000, voltage: 120, type: 'resistive' }
  ),
  
  // Grounding
  createIEEEComponentTemplate(
    'ieee_ground_earth',
    'Earth Ground',
    'ground',
    'Grounding',
    { resistance: 25, type: 'rod', length: 8 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_ground_chassis',
    'Chassis Ground',
    'chassis_ground',
    'Grounding',
    { type: 'chassis', bonding: 'equipment' }
  ),
  
  // Renewable Energy
  createIEEEComponentTemplate(
    'ieee_solar_panel',
    'Solar Panel Array',
    'pv_array',
    'Renewable',
    { 
      power: 400, 
      voltage: 40, 
      current: 10, 
      modules: 20,
      strings: 2,
      technology: 'monocrystalline'
    },
    { width: 80, height: 60 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_wind_turbine',
    'Wind Turbine',
    'wind_turbine',
    'Renewable',
    { 
      power: 2500, 
      voltage: 690, 
      cutIn: 3, 
      cutOut: 25,
      rated: 12,
      diameter: 80
    },
    { width: 60, height: 80 }
  ),
  
  createIEEEComponentTemplate(
    'ieee_battery',
    'Battery Bank',
    'battery',
    'Energy Storage',
    { 
      voltage: 48, 
      capacity: 100, 
      type: 'lithium_ion',
      cycles: 6000,
      efficiency: 0.95
    }
  )
];

export default ProfessionalSymbolRenderer;