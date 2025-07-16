/**
 * Template Card Component
 * 
 * Visual card representation of a project template
 */

import React from 'react';
import { Plus, Star, Tag } from 'lucide-react';
import type { ProjectTemplate } from '../../services/projectService';

interface TemplateCardProps {
  template: ProjectTemplate;
  onSelect: (templateId: string) => void;
  onCreateProject: (templateId: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onCreateProject
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'residential': return 'bg-green-100 text-green-800';
      case 'commercial': return 'bg-blue-100 text-blue-800';
      case 'industrial': return 'bg-purple-100 text-purple-800';
      case 'solar': return 'bg-yellow-100 text-yellow-800';
      case 'evse': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{template.thumbnail}</div>
        {template.isBuiltIn && (
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
          <Tag className="h-3 w-3 mr-1" />
          {template.category}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelect(template.id)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onCreateProject(template.id)}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Use
        </button>
      </div>
    </div>
  );
};