import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  ArrowRight, 
  Home, 
  Building, 
  Factory, 
  Zap,
  X,
  ChevronDown
} from 'lucide-react';
import { ProjectTemplateService, type ProjectTemplate } from '../../services/projectTemplateService';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'recent'>('popularity');

  const categories = useMemo(() => ProjectTemplateService.getTemplateCategories(), []);
  
  const filteredTemplates = useMemo(() => {
    let templates = ProjectTemplateService.getAllTemplates();

    // Apply search filter
    if (searchQuery.trim()) {
      templates = ProjectTemplateService.searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Apply sorting
    templates.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return b.popularity - a.popularity;
        case 'recent':
          return b.popularity - a.popularity; // For now, use popularity as proxy
        default:
          return 0;
      }
    });

    return templates;
  }, [searchQuery, selectedCategory, sortBy]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential': return Home;
      case 'commercial': return Building;
      case 'industrial': return Factory;
      case 'specialty': return Zap;
      default: return Building;
    }
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Project Templates</h2>
                <p className="text-green-100">Choose a template to get started quickly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar - Categories and Filters */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>All Templates</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {ProjectTemplateService.getAllTemplates().length}
                  </span>
                </button>
                
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.category);
                  return (
                    <button
                      key={category.category}
                      onClick={() => setSelectedCategory(category.category)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.category
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{category.name}</span>
                      <span className="ml-auto text-sm text-gray-500">{category.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium">Sort & Filter</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilters && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="popularity">Most Popular</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="recent">Recently Used</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Template Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {selectedCategory === 'all' 
                  ? `All Templates (${filteredTemplates.length})`
                  : `${categories.find(c => c.category === selectedCategory)?.name} Templates (${filteredTemplates.length})`
                }
              </h3>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No templates found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleTemplateSelect(template)}
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Select a template to create a new project with pre-configured loads and settings
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};