/**
 * Expanded SLD Component Library
 */

import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Zap,
  Home,
  Factory,
  Car,
  Sun,
  Shield,
  Cpu,
  Radio,
  Lightbulb
} from 'lucide-react';
import { RealisticElectricalSymbols } from './RealisticElectricalSymbols';

interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  symbol: React.ComponentType<any>;
  defaultProps: {
    amperage?: number;
    voltage?: string;
    showRating?: boolean;
  };
  description: string;
}

interface ExpandedComponentLibraryProps {
  onComponentSelect: (componentType: string, componentName: string) => void;
  selectedComponent?: string;
  className?: string;
}

export const ExpandedComponentLibrary: React.FC<ExpandedComponentLibraryProps> = ({
  onComponentSelect,
  selectedComponent,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    panels: true,
    protection: true,
    power: false,
    renewable: false,
    evse: false,
    instruments: false,
    controls: false
  });

  const componentCategories = [
    {
      id: 'panels',
      name: 'Panels & Distribution',
      icon: Home,
      components: [
        {
          id: 'main_panel',
          name: 'Main Electrical Panel',
          type: 'main_panel',
          symbol: RealisticElectricalSymbols.MainElectricalPanel,
          defaultProps: { amperage: 200, showRating: true },
          description: 'Main service panel with breaker spaces'
        },
        {
          id: 'sub_panel',
          name: 'Sub Panel',
          type: 'sub_panel',
          symbol: RealisticElectricalSymbols.SubPanel,
          defaultProps: { amperage: 100, showRating: true },
          description: 'Secondary distribution panel'
        }
      ]
    },
    {
      id: 'protection',
      name: 'Protection & Switching',
      icon: Shield,
      components: [
        {
          id: 'circuit_breaker_sp',
          name: 'Single Pole Breaker',
          type: 'circuit_breaker_sp',
          symbol: RealisticElectricalSymbols.CircuitBreakerSP,
          defaultProps: { amperage: 20, showRating: true },
          description: 'Single pole circuit breaker'
        },
        {
          id: 'circuit_breaker_dp',
          name: 'Double Pole Breaker',
          type: 'circuit_breaker_dp',
          symbol: RealisticElectricalSymbols.CircuitBreakerDP,
          defaultProps: { amperage: 50, showRating: true },
          description: 'Double pole circuit breaker'
        },
        {
          id: 'disconnect_switch',
          name: 'Disconnect Switch',
          type: 'disconnect',
          symbol: RealisticElectricalSymbols.DisconnectSwitch,
          defaultProps: { amperage: 60, showRating: true },
          description: 'Safety disconnect switch'
        }
      ]
    },
    {
      id: 'power',
      name: 'Power & Transformation',
      icon: Zap,
      components: [
        {
          id: 'transformer_pad',
          name: 'Pad Mount Transformer',
          type: 'transformer',
          symbol: RealisticElectricalSymbols.TransformerPadMount,
          defaultProps: { amperage: 75, voltage: '12.47kV/240V', showRating: true },
          description: 'Ground mounted distribution transformer'
        },
        {
          id: 'electric_meter',
          name: 'Electric Meter',
          type: 'meter',
          symbol: RealisticElectricalSymbols.ElectricMeter,
          defaultProps: { showRating: true },
          description: 'Revenue grade electricity meter'
        },
        {
          id: 'motor_3phase',
          name: '3-Phase Motor',
          type: 'motor',
          symbol: RealisticElectricalSymbols.MotorThreePhaseHeavyDuty,
          defaultProps: { amperage: 15, showRating: true },
          description: 'Three phase induction motor'
        }
      ]
    },
    {
      id: 'renewable',
      name: 'Renewable Energy',
      icon: Sun,
      components: [
        {
          id: 'solar_panel',
          name: 'Solar Panel Array',
          type: 'solar_panel',
          symbol: RealisticElectricalSymbols.MainElectricalPanel, // Placeholder
          defaultProps: { amperage: 30, voltage: '600V DC', showRating: true },
          description: 'Photovoltaic solar panel array'
        },
        {
          id: 'inverter',
          name: 'Solar Inverter',
          type: 'inverter',
          symbol: RealisticElectricalSymbols.SubPanel, // Placeholder
          defaultProps: { amperage: 25, voltage: '240V AC', showRating: true },
          description: 'DC to AC power inverter'
        },
        {
          id: 'battery_storage',
          name: 'Battery Storage',
          type: 'battery',
          symbol: RealisticElectricalSymbols.MainElectricalPanel, // Placeholder
          defaultProps: { amperage: 100, voltage: '48V DC', showRating: true },
          description: 'Energy storage battery system'
        }
      ]
    },
    {
      id: 'evse',
      name: 'EV Charging',
      icon: Car,
      components: [
        {
          id: 'evse_level2',
          name: 'Level 2 EVSE',
          type: 'evse_l2',
          symbol: RealisticElectricalSymbols.CircuitBreakerDP, // Placeholder
          defaultProps: { amperage: 40, voltage: '240V', showRating: true },
          description: 'Level 2 electric vehicle charging station'
        },
        {
          id: 'evse_dcfc',
          name: 'DC Fast Charger',
          type: 'evse_dcfc',
          symbol: RealisticElectricalSymbols.MainElectricalPanel, // Placeholder
          defaultProps: { amperage: 200, voltage: '480V', showRating: true },
          description: 'DC fast charging station'
        }
      ]
    },
    {
      id: 'instruments',
      name: 'Instrumentation',
      icon: Radio,
      components: [
        {
          id: 'current_transformer',
          name: 'Current Transformer',
          type: 'ct',
          symbol: RealisticElectricalSymbols.TransformerPadMount, // Placeholder
          defaultProps: { amperage: 100, voltage: '5A', showRating: true },
          description: 'Current measurement transformer'
        },
        {
          id: 'voltage_transformer',
          name: 'Voltage Transformer',
          type: 'vt',
          symbol: RealisticElectricalSymbols.TransformerPadMount, // Placeholder
          defaultProps: { voltage: '120V', showRating: true },
          description: 'Voltage measurement transformer'
        }
      ]
    },
    {
      id: 'controls',
      name: 'Control Devices',
      icon: Cpu,
      components: [
        {
          id: 'contactor',
          name: 'Contactor',
          type: 'contactor',
          symbol: RealisticElectricalSymbols.CircuitBreakerSP, // Placeholder
          defaultProps: { amperage: 30, showRating: true },
          description: 'Electrical contactor'
        },
        {
          id: 'relay',
          name: 'Control Relay',
          type: 'relay',
          symbol: RealisticElectricalSymbols.CircuitBreakerSP, // Placeholder
          defaultProps: { amperage: 10, showRating: true },
          description: 'Control relay'
        }
      ]
    }
  ];

  const filteredCategories = componentCategories.map(category => ({
    ...category,
    components: category.components.filter((component: ComponentDefinition) =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.components.length > 0);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-t-lg">
        <h3 className="font-medium flex items-center gap-2">
          <Factory className="h-4 w-4" />
          Component Library
        </h3>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Component Categories */}
      <div className="max-h-96 overflow-y-auto">
        {filteredCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories[category.id];

          return (
            <div key={category.id} className="border-b border-gray-100 last:border-b-0">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span className="text-xs text-gray-500">({category.components.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Category Components */}
              {isExpanded && (
                <div className="pb-2">
                  {category.components.map((component: ComponentDefinition) => {
                    const Symbol = component.symbol;
                    const isSelected = selectedComponent === component.type;

                    return (
                      <div
                        key={component.id}
                        onClick={() => onComponentSelect(component.type, component.name)}
                        className={`mx-3 mb-2 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Component Symbol */}
                          <div className="flex-shrink-0">
                            <Symbol
                              width={32}
                              height={32}
                              {...component.defaultProps}
                            />
                          </div>

                          {/* Component Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {component.name}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {component.description}
                            </p>
                            
                            {/* Quick specs */}
                            <div className="flex items-center gap-2 mt-1">
                              {component.defaultProps.amperage && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  {component.defaultProps.amperage}A
                                </span>
                              )}
                              {component.defaultProps.voltage && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  {component.defaultProps.voltage}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {filteredCategories.reduce((total, cat) => total + cat.components.length, 0)} components available
        </p>
      </div>
    </div>
  );
};

export default ExpandedComponentLibrary;