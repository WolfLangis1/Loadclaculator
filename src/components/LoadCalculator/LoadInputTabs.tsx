import React, { useState } from 'react';
import { Home, Zap, Car, Battery, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { GeneralLoadsTable } from './LoadTables/GeneralLoadsTable';
import { HVACLoadsTable } from './LoadTables/HVACLoadsTable';
import { EVSELoadsTable } from './LoadTables/EVSELoadsTable';
import { SolarBatteryTable } from './LoadTables/SolarBatteryTable';

const SECTIONS = [
  { id: 'general', label: 'General Loads', icon: Home, component: GeneralLoadsTable, color: 'emerald' },
  { id: 'hvac', label: 'HVAC', icon: Zap, component: HVACLoadsTable, color: 'orange' },
  { id: 'evse', label: 'EV Charging', icon: Car, component: EVSELoadsTable, color: 'blue' },
  { id: 'solar', label: 'Solar/Battery', icon: Battery, component: SolarBatteryTable, color: 'yellow' },
] as const;

export const LoadInputTabs: React.FC = () => {
  const { state } = useLoadCalculator();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    hvac: true,
    evse: true,
    solar: true,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleAllSections = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    const newState = allExpanded ? false : true;
    setExpandedSections({
      general: newState,
      hvac: newState,
      evse: newState,
      solar: newState,
    });
  };

  const getColorClasses = (color: string, isExpanded: boolean) => {
    const colors = {
      emerald: {
        header: isExpanded ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-500',
        icon: 'text-white',
        text: 'text-white',
        chevron: 'text-emerald-100',
        content: 'bg-emerald-50/50'
      },
      orange: {
        header: isExpanded ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-orange-400 to-orange-500',
        icon: 'text-white',
        text: 'text-white',
        chevron: 'text-orange-100',
        content: 'bg-orange-50/50'
      },
      blue: {
        header: isExpanded ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-blue-400 to-blue-500',
        icon: 'text-white',
        text: 'text-white',
        chevron: 'text-blue-100',
        content: 'bg-blue-50/50'
      },
      yellow: {
        header: isExpanded ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-500',
        icon: 'text-white',
        text: 'text-white',
        chevron: 'text-yellow-100',
        content: 'bg-yellow-50/50'
      }
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  return (
    <div className="space-y-3">
      {/* Global Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Load Categories</h2>
        <button
          onClick={toggleAllSections}
          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 font-medium transition-all duration-200 shadow-sm"
        >
          {Object.values(expandedSections).every(Boolean) ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Colorful Load Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const Component = section.component;
          const isExpanded = expandedSections[section.id];
          const colorClasses = getColorClasses(section.color, isExpanded);

          return (
            <div key={section.id} className="rounded-xl shadow-lg overflow-hidden border border-gray-200">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-4 ${colorClasses.header} hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icon className={`h-5 w-5 ${colorClasses.icon}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${colorClasses.text}`}>{section.label}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`h-5 w-5 ${colorClasses.chevron}`} />
                ) : (
                  <ChevronDown className={`h-5 w-5 ${colorClasses.chevron}`} />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className={`${colorClasses.content} border-t border-white/20`}>
                  <div className="p-6 bg-white">
                    {section.id === 'general' && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">✓ Automatically Included per NEC 220.52:</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• General lighting & receptacles: 3 VA/sq ft (currently {state.squareFootage * 3} VA)</li>
                          <li>• Small appliance circuits: 3000 VA (2 kitchen circuits)</li>
                          <li>• Laundry circuit: 1500 VA</li>
                          <li>• Bathroom circuit: 1500 VA</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2 font-medium">
                          Only add appliances below that require dedicated circuits beyond these basics.
                        </p>
                      </div>
                    )}
                    <Component />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};