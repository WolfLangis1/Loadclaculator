import React, { useState } from 'react';
import { BookOpen, Search, Zap, Settings, Calculator, Shield, Wrench } from 'lucide-react';
import { getDefinitionsByCategory, searchDefinitions, Definition } from '../../services/definitionsService';

const CATEGORY_ICONS = {
  electrical: Zap,
  solar: Settings,
  calculation: Calculator,
  safety: Shield,
  equipment: Wrench
};

const CATEGORY_COLORS = {
  electrical: 'text-blue-600 bg-blue-50 border-blue-200',
  solar: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  calculation: 'text-purple-600 bg-purple-50 border-purple-200',
  safety: 'text-red-600 bg-red-50 border-red-200',
  equipment: 'text-green-600 bg-green-50 border-green-200'
};

export const DefinitionsGlossary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Definition['category'] | 'all'>('all');
  
  const getFilteredDefinitions = (): Definition[] => {
    let definitions: Definition[] = [];
    
    if (searchQuery) {
      definitions = searchDefinitions(searchQuery);
    } else if (selectedCategory === 'all') {
      definitions = Object.values(getDefinitionsByCategory('electrical'))
        .concat(getDefinitionsByCategory('solar'))
        .concat(getDefinitionsByCategory('calculation'))
        .concat(getDefinitionsByCategory('safety'))
        .concat(getDefinitionsByCategory('equipment'));
    } else {
      definitions = getDefinitionsByCategory(selectedCategory);
    }
    
    return definitions.sort((a, b) => a.term.localeCompare(b.term));
  };

  const filteredDefinitions = getFilteredDefinitions();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Electrical Terms Glossary</h3>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search definitions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${ 
              selectedCategory === 'all' 
                ? 'bg-gray-100 text-gray-800 border-gray-300' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_ICONS).map(([category, IconComponent]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as Definition['category'])}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors capitalize flex items-center gap-1 ${
                selectedCategory === category 
                  ? CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <IconComponent className="h-3 w-3" />
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Definitions List */}
      <div className="p-6">
        {filteredDefinitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No definitions found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDefinitions.map((definition, index) => {
              const IconComponent = CATEGORY_ICONS[definition.category];
              const categoryColor = CATEGORY_COLORS[definition.category];
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${categoryColor}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{definition.term}</h4>
                        {definition.necReference && (
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {definition.necReference}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{definition.definition}</p>
                      {definition.details && (
                        <p className="text-gray-600 text-xs leading-relaxed">{definition.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Definitions based on National Electrical Code (NEC) and industry standards. 
          Always consult local codes and a qualified electrician for specific installations.
        </p>
      </div>
    </div>
  );
};