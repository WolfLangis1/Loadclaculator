import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { type DetailedProjectTemplate } from '../../services/projectService';

interface TemplateCardProps {
  template: DetailedProjectTemplate;
  onSelectTemplate: (template: DetailedProjectTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = React.memo(
  ({ template, onSelectTemplate }) => {
    return (
      <div
        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => onSelectTemplate(template)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{template.icon}</div>
            <div>
              <h4 className="font-medium text-gray-900 group-hover:text-blue-900">
                {template.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {template.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-500">{template.popularity}</span>
                </div>
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div>
            <span className="font-medium">Size:</span> {template.squareFootage.toLocaleString()} sq ft
          </div>
          <div>
            <span className="font-medium">Service:</span> {template.mainBreaker}A
          </div>
          <div>
            <span className="font-medium">Method:</span> {template.calculationMethod}
          </div>
          <div>
            <span className="font-medium">Code:</span> {template.codeYear} NEC
          </div>
        </div>

        {/* Quick preview of loads */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>General: {template.generalLoads.length}</span>
            <span>HVAC: {template.hvacLoads.length}</span>
            {template.evseLoads.length > 0 && (
              <span>EV: {template.evseLoads.length}</span>
            )}
            {template.solarBatteryLoads.length > 0 && (
              <span>Solar: {template.solarBatteryLoads.length}</span>
            )}
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{template.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    );
  }
);
