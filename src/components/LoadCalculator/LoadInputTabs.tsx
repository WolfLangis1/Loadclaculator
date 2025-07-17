import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { SECTIONS } from '../../constants/loadCategories';
import { LoadCategorySection } from './LoadCategorySection';

export const LoadInputTabs: React.FC = () => {
  const { settings } = useProjectSettings();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialExpanded: Record<string, boolean> = {};
    SECTIONS.forEach(section => {
      initialExpanded[section.id] = true;
    });
    return initialExpanded;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleAllSections = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    const newState = !allExpanded;
    const newExpandedSections: Record<string, boolean> = {};
    SECTIONS.forEach(section => {
      newExpandedSections[section.id] = newState;
    });
    setExpandedSections(newExpandedSections);
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
        {SECTIONS.map((section) => (
          <LoadCategorySection
            key={section.id}
            section={section}
            isExpanded={expandedSections[section.id]}
            onToggle={toggleSection}
          />
        ))}
      </div>
    </div>
  );
};
