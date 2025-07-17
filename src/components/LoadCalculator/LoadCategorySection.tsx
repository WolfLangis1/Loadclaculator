import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getColorClasses } from '../../utils/colorUtils';
import { useProjectSettings } from '../../context/ProjectSettingsContext';

interface LoadCategorySectionProps {
  section: {
    id: string;
    label: string;
    icon: React.ElementType;
    component: React.ElementType;
    color: string;
  };
  isExpanded: boolean;
  onToggle: (sectionId: string) => void;
}

export const LoadCategorySection: React.FC<LoadCategorySectionProps> = ({
  section,
  isExpanded,
  onToggle,
}) => {
  const Icon = section.icon;
  const Component = section.component;
  const colorClasses = getColorClasses(section.color, isExpanded);
  const { settings } = useProjectSettings();

  return (
    <div key={section.id} className="rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <button
        onClick={() => onToggle(section.id)}
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

      {isExpanded && (
        <div className={`${colorClasses.content} border-t border-white/20`}>
          <div className="p-6 bg-white" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none' }}>
            {section.id === 'general' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">✓ Automatically Included per NEC 220.52:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• General lighting & receptacles: 3 VA/sq ft (currently {settings.squareFootage * 3} VA)</li>
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
};
