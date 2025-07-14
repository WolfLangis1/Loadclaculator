import React, { useState, useMemo } from 'react';
import { X, Search, Filter, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { SLDTemplateService, type SLDTemplate } from '../../services/sldTemplateService';
import type { SLDDiagram } from '../../types/sld';

interface SLDTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (diagram: SLDDiagram) => void;
  loadData?: any; // Load calculator data for compatibility checking
}

export const SLDTemplateModal: React.FC<SLDTemplateModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  loadData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SLDTemplate['category'] | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SLDTemplate | null>(null);

  const categories = useMemo(() => SLDTemplateService.getCategories(), []);
  
  const filteredTemplates = useMemo(() => {
    let templates = SLDTemplateService.getAllTemplates();
    
    if (selectedCategory !== 'all') {
      templates = templates.filter(template => template.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      templates = SLDTemplateService.searchTemplates(searchQuery);
      if (selectedCategory !== 'all') {
        templates = templates.filter(template => template.category === selectedCategory);
      }
    }
    
    return templates;
  }, [searchQuery, selectedCategory]);

  const handleApplyTemplate = (template: SLDTemplate) => {
    const diagram = SLDTemplateService.applyTemplate(template.id);
    if (diagram) {
      onApplyTemplate(diagram);
      onClose();
    }
  };

  const getCompatibilityStatus = (template: SLDTemplate) => {
    if (!loadData) return { compatible: true, missingComponents: [] };
    return SLDTemplateService.isTemplateCompatible(template.id, loadData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              SLD Templates Library
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories ({SLDTemplateService.getAllTemplates().length})</option>
                  {categories.map(({ category, count, label }) => (
                    <option key={category} value={category}>
                      {label} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex h-96">
            {/* Template List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No templates found</p>
                    {searchQuery && (
                      <p className="text-sm mt-1">Try adjusting your search criteria</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTemplates.map((template) => {
                      const compatibility = getCompatibilityStatus(template);
                      return (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={template.preview}
                              alt={template.name}
                              className="w-12 h-9 object-cover rounded border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {template.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {compatibility.compatible ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                )}
                                <span className={`text-xs ${
                                  compatibility.compatible ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {compatibility.compatible ? 'Compatible' : 'Partial Match'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Template Preview */}
            <div className="flex-1 p-6">
              {selectedTemplate ? (
                <div className="h-full flex flex-col">
                  {/* Template Header */}
                  <div className="mb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={selectedTemplate.preview}
                        alt={selectedTemplate.name}
                        className="w-24 h-18 object-cover rounded border border-gray-200"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedTemplate.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedTemplate.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedTemplate.category}
                          </span>
                          {selectedTemplate.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Status */}
                  {loadData && (
                    <div className="mb-4 p-3 rounded-lg border">
                      {(() => {
                        const compatibility = getCompatibilityStatus(selectedTemplate);
                        return compatibility.compatible ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              This template is compatible with your current load data
                            </span>
                          </div>
                        ) : (
                          <div className="text-yellow-700">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Missing components for optimal use
                              </span>
                            </div>
                            <ul className="text-xs space-y-1 ml-6">
                              {compatibility.missingComponents.map(component => (
                                <li key={component}>• {component}</li>
                              ))}
                            </ul>
                            <p className="text-xs mt-2">
                              You can still use this template and add the missing components later.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Template Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Components</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        {selectedTemplate.diagram.components.map(component => (
                          <div key={component.id} className="flex justify-between">
                            <span>{component.name || component.type}</span>
                            <span className="text-gray-400">{component.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Standards & Compliance</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.diagram.necCodeYear && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                          >
                            NEC {selectedTemplate.diagram.necCodeYear}
                          </span>
                        )}
                        {selectedTemplate.diagram.systemType && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {selectedTemplate.diagram.systemType.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApplyTemplate(selectedTemplate)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a template</p>
                    <p className="text-sm mt-1">Choose a template from the list to see details and preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};