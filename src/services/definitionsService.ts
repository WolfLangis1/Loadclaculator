import { ELECTRICAL_DEFINITIONS, type Definition } from '../types/definitions';

export const getDefinition = (term: string): Definition | undefined => {
  // Normalize the term for lookup
  const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return ELECTRICAL_DEFINITIONS[normalizedTerm] || ELECTRICAL_DEFINITIONS[term.toLowerCase()];
};

export const searchDefinitions = (query: string): Definition[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(ELECTRICAL_DEFINITIONS).filter(def => 
    def.term.toLowerCase().includes(lowerQuery) ||
    def.definition.toLowerCase().includes(lowerQuery) ||
    (def.details && def.details.toLowerCase().includes(lowerQuery))
  );
};

export const getDefinitionsByCategory = (category: Definition['category']): Definition[] => {
  return Object.values(ELECTRICAL_DEFINITIONS).filter(def => def.category === category);
};