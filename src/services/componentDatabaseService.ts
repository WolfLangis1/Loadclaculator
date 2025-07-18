/**
 * Professional Component Database Service
 * 
 * Provides advanced component search, filtering, and management capabilities
 * for electrical component libraries with manufacturer data integration
 */

import { ComponentTemplate } from '../data/componentTemplates';

export interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  parentCategory?: string;
  subcategories?: string[];
  color: string;
  icon: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  website: string;
  supportPhone?: string;
  supportEmail?: string;
  description: string;
  certifications: string[];
  regions: string[];
  specialties: string[];
}

export interface ComponentSpecification {
  id: string;
  name: string;
  category: 'electrical' | 'mechanical' | 'environmental' | 'performance' | 'compliance';
  type: 'number' | 'string' | 'boolean' | 'range' | 'enum';
  unit?: string;
  description: string;
  required: boolean;
  searchable: boolean;
  filterable: boolean;
}

export interface EnhancedComponentTemplate extends ComponentTemplate {
  version: string;
  status: 'active' | 'deprecated' | 'obsolete';
  tags: string[];
  certifications: string[];
  standardCompliance: string[];
  priceRange?: { min: number; max: number; currency: string };
  availability: 'available' | 'limited' | 'discontinued';
  leadTime?: number; // weeks
  dataSheetUrl?: string;
  installationGuideUrl?: string;
  compatibleWith: string[]; // Compatible component IDs
  replacementFor?: string[]; // Component IDs this can replace
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  categories?: string[];
  manufacturers?: string[];
  specifications?: Record<string, any>;
  priceRange?: { min?: number; max?: number };
  availability?: string[];
  certifications?: string[];
  tags?: string[];
  voltageRating?: { min?: number; max?: number };
  currentRating?: { min?: number; max?: number };
  powerRating?: { min?: number; max?: number };
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'name' | 'manufacturer' | 'price' | 'popularity' | 'updated';
  sortOrder?: 'asc' | 'desc';
  fuzzySearch?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  components: EnhancedComponentTemplate[];
  totalCount: number;
  facets: {
    categories: Record<string, number>;
    manufacturers: Record<string, number>;
    specifications: Record<string, Record<string, number>>;
  };
  suggestions?: string[];
}

export class ComponentDatabaseService {
  private components: Map<string, EnhancedComponentTemplate> = new Map();
  private categories: Map<string, ComponentCategory> = new Map();
  private manufacturers: Map<string, Manufacturer> = new Map();
  private specifications: Map<string, ComponentSpecification> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();
  private recentlyUsed: string[] = [];
  private favorites: Set<string> = new Set();

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Initialize database with component categories, manufacturers, and specifications
   */
  private initializeDatabase(): void {
    this.initializeCategories();
    this.initializeManufacturers();
    this.initializeSpecifications();
  }

  /**
   * Initialize component categories hierarchy
   */
  private initializeCategories(): void {
    const categories: ComponentCategory[] = [
      {
        id: 'power_distribution',
        name: 'Power Distribution',
        description: 'Electrical panels, subpanels, and distribution equipment',
        color: '#2563eb',
        icon: 'grid',
        subcategories: ['panels', 'subpanels', 'load_centers', 'switchboards']
      },
      {
        id: 'solar_pv',
        name: 'Solar PV Systems',
        description: 'Photovoltaic panels, inverters, and solar equipment',
        color: '#f59e0b',
        icon: 'sun',
        subcategories: ['pv_modules', 'inverters', 'optimizers', 'combiners', 'monitoring']
      },
      {
        id: 'energy_storage',
        name: 'Energy Storage',
        description: 'Battery systems, energy storage solutions',
        color: '#7c3aed',
        icon: 'battery',
        subcategories: ['batteries', 'controllers', 'management_systems', 'inverters']
      },
      {
        id: 'evse',
        name: 'Electric Vehicle Charging',
        description: 'EV charging stations and equipment',
        color: '#059669',
        icon: 'car',
        subcategories: ['level_1', 'level_2', 'level_3', 'accessories']
      },
      {
        id: 'protection',
        name: 'Protection Devices',
        description: 'Circuit breakers, fuses, surge protectors',
        color: '#dc2626',
        icon: 'shield',
        subcategories: ['breakers', 'fuses', 'surge_protection', 'arc_fault']
      },
      {
        id: 'metering',
        name: 'Metering & Monitoring',
        description: 'Electrical meters, monitoring equipment',
        color: '#0891b2',
        icon: 'gauge',
        subcategories: ['utility_meters', 'smart_meters', 'sub_meters', 'monitoring']
      },
      {
        id: 'disconnects',
        name: 'Disconnects & Switches',
        description: 'Disconnect switches, transfer switches',
        color: '#374151',
        icon: 'power-off',
        subcategories: ['safety_disconnects', 'transfer_switches', 'manual_switches']
      },
      {
        id: 'grounding',
        name: 'Grounding & Bonding',
        description: 'Grounding electrodes, bonding equipment',
        color: '#92400e',
        icon: 'minus',
        subcategories: ['grounding_rods', 'bonding_jumpers', 'grounding_blocks']
      },
      {
        id: 'raceways',
        name: 'Raceways & Conduits',
        description: 'Electrical conduits and raceway systems',
        color: '#6b7280',
        icon: 'square',
        subcategories: ['metal_conduit', 'pvc_conduit', 'flexible_conduit', 'cable_tray']
      },
      {
        id: 'conductors',
        name: 'Conductors & Cables',
        description: 'Electrical wires and cables',
        color: '#ef4444',
        icon: 'minus',
        subcategories: ['building_wire', 'service_wire', 'specialty_cable', 'grounding_wire']
      }
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Initialize manufacturer database
   */
  private initializeManufacturers(): void {
    const manufacturers: Manufacturer[] = [
      {
        id: 'enphase',
        name: 'Enphase Energy',
        code: 'ENPH',
        website: 'https://enphase.com',
        supportPhone: '1-877-797-4743',
        supportEmail: 'support@enphase.com',
        description: 'Leading provider of microinverter-based solar and battery systems',
        certifications: ['UL', 'CSA', 'IEC', 'CE'],
        regions: ['North America', 'Europe', 'Australia'],
        specialties: ['microinverters', 'energy_storage', 'monitoring']
      },
      {
        id: 'tesla',
        name: 'Tesla Energy',
        code: 'TSLA',
        website: 'https://tesla.com/energy',
        supportPhone: '1-888-765-2489',
        description: 'Electric vehicle and renewable energy company',
        certifications: ['UL', 'CSA', 'IEC'],
        regions: ['North America', 'Europe', 'Asia-Pacific'],
        specialties: ['energy_storage', 'solar_systems', 'charging_infrastructure']
      },
      {
        id: 'solaredge',
        name: 'SolarEdge Technologies',
        code: 'SEDG',
        website: 'https://solaredge.com',
        supportPhone: '1-510-498-3263',
        description: 'Smart energy technology company',
        certifications: ['UL', 'CSA', 'IEC', 'CE'],
        regions: ['Global'],
        specialties: ['inverters', 'optimizers', 'monitoring', 'ev_charging']
      },
      {
        id: 'schneider',
        name: 'Schneider Electric',
        code: 'SCHD',
        website: 'https://schneider-electric.com',
        description: 'Global energy management and automation solutions',
        certifications: ['UL', 'CSA', 'IEC', 'CE', 'NEMA'],
        regions: ['Global'],
        specialties: ['electrical_distribution', 'protection', 'automation', 'ev_charging']
      },
      {
        id: 'eaton',
        name: 'Eaton Corporation',
        code: 'ETN',
        website: 'https://eaton.com',
        description: 'Power management company',
        certifications: ['UL', 'CSA', 'IEC', 'CE', 'NEMA'],
        regions: ['Global'],
        specialties: ['electrical_distribution', 'protection', 'ups_systems', 'ev_charging']
      },
      {
        id: 'siemens',
        name: 'Siemens',
        code: 'SIE',
        website: 'https://siemens.com',
        description: 'Technology and engineering company',
        certifications: ['UL', 'CSA', 'IEC', 'CE', 'VDE'],
        regions: ['Global'],
        specialties: ['electrical_distribution', 'automation', 'digitalization', 'energy_management']
      },
      {
        id: 'generac',
        name: 'Generac Power Systems',
        code: 'GNRC',
        website: 'https://generac.com',
        description: 'Backup power generation systems',
        certifications: ['UL', 'CSA', 'EPA', 'CARB'],
        regions: ['North America'],
        specialties: ['backup_generators', 'transfer_switches', 'solar_storage']
      }
    ];

    manufacturers.forEach(manufacturer => {
      this.manufacturers.set(manufacturer.id, manufacturer);
    });
  }

  /**
   * Initialize component specifications schema
   */
  private initializeSpecifications(): void {
    const specifications: ComponentSpecification[] = [
      // Electrical Specifications
      {
        id: 'voltage_rating',
        name: 'Voltage Rating',
        category: 'electrical',
        type: 'number',
        unit: 'V',
        description: 'Maximum operating voltage',
        required: true,
        searchable: true,
        filterable: true
      },
      {
        id: 'current_rating',
        name: 'Current Rating',
        category: 'electrical',
        type: 'number',
        unit: 'A',
        description: 'Maximum continuous current',
        required: true,
        searchable: true,
        filterable: true
      },
      {
        id: 'power_rating',
        name: 'Power Rating',
        category: 'electrical',
        type: 'number',
        unit: 'W',
        description: 'Maximum power handling',
        required: false,
        searchable: true,
        filterable: true
      },
      {
        id: 'frequency',
        name: 'Frequency',
        category: 'electrical',
        type: 'number',
        unit: 'Hz',
        description: 'Operating frequency',
        required: false,
        searchable: false,
        filterable: true
      },
      {
        id: 'efficiency',
        name: 'Efficiency',
        category: 'performance',
        type: 'number',
        unit: '%',
        description: 'Energy conversion efficiency',
        required: false,
        searchable: false,
        filterable: true
      },
      // Physical Specifications
      {
        id: 'enclosure_rating',
        name: 'Enclosure Rating',
        category: 'environmental',
        type: 'enum',
        description: 'NEMA/IP enclosure protection rating',
        required: false,
        searchable: true,
        filterable: true
      },
      {
        id: 'operating_temperature',
        name: 'Operating Temperature',
        category: 'environmental',
        type: 'range',
        unit: '°C',
        description: 'Operating temperature range',
        required: false,
        searchable: false,
        filterable: true
      },
      // Compliance Specifications
      {
        id: 'ul_listing',
        name: 'UL Listed',
        category: 'compliance',
        type: 'boolean',
        description: 'UL safety certification',
        required: false,
        searchable: true,
        filterable: true
      },
      {
        id: 'nec_compliance',
        name: 'NEC Compliance',
        category: 'compliance',
        type: 'string',
        description: 'National Electrical Code compliance version',
        required: false,
        searchable: true,
        filterable: true
      }
    ];

    specifications.forEach(spec => {
      this.specifications.set(spec.id, spec);
    });
  }

  /**
   * Search components with advanced filtering and fuzzy search
   */
  searchComponents(options: SearchOptions = {}): SearchResult {
    const {
      query = '',
      filters = {},
      sortBy = 'name',
      sortOrder = 'asc',
      fuzzySearch = true,
      limit = 50,
      offset = 0
    } = options;

    let results = Array.from(this.components.values());

    // Apply text search
    if (query) {
      results = this.performTextSearch(results, query, fuzzySearch);
    }

    // Apply filters
    results = this.applyFilters(results, filters);

    // Sort results
    results = this.sortResults(results, sortBy, sortOrder);

    // Calculate facets for remaining results
    const facets = this.calculateFacets(results);

    // Apply pagination
    const totalCount = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      components: paginatedResults,
      totalCount,
      facets,
      suggestions: this.generateSearchSuggestions(query, results)
    };
  }

  /**
   * Perform fuzzy text search across component fields
   */
  private performTextSearch(
    components: EnhancedComponentTemplate[],
    query: string,
    fuzzy: boolean
  ): EnhancedComponentTemplate[] {
    const searchTerm = query.toLowerCase();
    
    return components.filter(component => {
      const searchableFields = [
        component.name,
        component.description,
        component.manufacturer,
        component.model,
        component.category,
        component.type,
        ...component.tags
      ].filter(Boolean).join(' ').toLowerCase();

      if (fuzzy) {
        return this.fuzzyMatch(searchableFields, searchTerm);
      } else {
        return searchableFields.includes(searchTerm);
      }
    });
  }

  /**
   * Simple fuzzy matching algorithm
   */
  private fuzzyMatch(text: string, pattern: string, threshold: number = 0.7): boolean {
    const words = pattern.split(' ').filter(word => word.length > 2);
    if (words.length === 0) return true;

    const matches = words.filter(word => text.includes(word));
    return matches.length / words.length >= threshold;
  }

  /**
   * Apply search filters to component list
   */
  private applyFilters(
    components: EnhancedComponentTemplate[],
    filters: SearchFilters
  ): EnhancedComponentTemplate[] {
    return components.filter(component => {
      // Category filter
      if (filters.categories?.length && !filters.categories.includes(component.category)) {
        return false;
      }

      // Manufacturer filter
      if (filters.manufacturers?.length && !filters.manufacturers.includes(component.manufacturer || '')) {
        return false;
      }

      // Availability filter
      if (filters.availability?.length && !filters.availability.includes(component.availability)) {
        return false;
      }

      // Certification filter
      if (filters.certifications?.length) {
        const hasRequiredCert = filters.certifications.some(cert => 
          component.certifications.includes(cert)
        );
        if (!hasRequiredCert) return false;
      }

      // Tag filter
      if (filters.tags?.length) {
        const hasRequiredTag = filters.tags.some(tag => 
          component.tags.includes(tag)
        );
        if (!hasRequiredTag) return false;
      }

      // Specification filters
      if (filters.specifications) {
        for (const [specId, value] of Object.entries(filters.specifications)) {
          const componentValue = component.specifications[specId];
          if (!this.matchesSpecificationFilter(componentValue, value)) {
            return false;
          }
        }
      }

      // Price range filter
      if (filters.priceRange && component.priceRange) {
        if (filters.priceRange.min && component.priceRange.max < filters.priceRange.min) {
          return false;
        }
        if (filters.priceRange.max && component.priceRange.min > filters.priceRange.max) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if component specification matches filter criteria
   */
  private matchesSpecificationFilter(componentValue: any, filterValue: any): boolean {
    if (componentValue === undefined || filterValue === undefined) {
      return true;
    }

    if (typeof filterValue === 'object' && filterValue.min !== undefined || filterValue.max !== undefined) {
      // Range filter
      if (filterValue.min && componentValue < filterValue.min) return false;
      if (filterValue.max && componentValue > filterValue.max) return false;
      return true;
    }

    // Exact match or array inclusion
    if (Array.isArray(componentValue)) {
      return componentValue.includes(filterValue);
    }

    return componentValue === filterValue;
  }

  /**
   * Sort component results
   */
  private sortResults(
    components: EnhancedComponentTemplate[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): EnhancedComponentTemplate[] {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return components.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'manufacturer':
          comparison = (a.manufacturer || '').localeCompare(b.manufacturer || '');
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'price':
          const aPrice = a.priceRange?.min || 0;
          const bPrice = b.priceRange?.min || 0;
          comparison = aPrice - bPrice;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return comparison * multiplier;
    });
  }

  /**
   * Calculate search result facets for filtering UI
   */
  private calculateFacets(components: EnhancedComponentTemplate[]): SearchResult['facets'] {
    const facets = {
      categories: {} as Record<string, number>,
      manufacturers: {} as Record<string, number>,
      specifications: {} as Record<string, Record<string, number>>
    };

    components.forEach(component => {
      // Category facets
      facets.categories[component.category] = (facets.categories[component.category] || 0) + 1;

      // Manufacturer facets
      if (component.manufacturer) {
        facets.manufacturers[component.manufacturer] = (facets.manufacturers[component.manufacturer] || 0) + 1;
      }

      // Specification facets (simplified for common specs)
      const voltage = component.specifications.voltage;
      if (voltage) {
        if (!facets.specifications.voltage) facets.specifications.voltage = {};
        const voltageRange = this.getVoltageRange(voltage);
        facets.specifications.voltage[voltageRange] = (facets.specifications.voltage[voltageRange] || 0) + 1;
      }
    });

    return facets;
  }

  /**
   * Categorize voltage into ranges for faceting
   */
  private getVoltageRange(voltage: number): string {
    if (voltage <= 120) return '≤120V';
    if (voltage <= 240) return '121-240V';
    if (voltage <= 480) return '241-480V';
    if (voltage <= 600) return '481-600V';
    return '>600V';
  }

  /**
   * Generate search suggestions based on query and results
   */
  private generateSearchSuggestions(query: string, results: EnhancedComponentTemplate[]): string[] {
    if (!query || results.length > 10) return [];

    const suggestions = new Set<string>();
    
    // Add manufacturer suggestions
    results.forEach(component => {
      if (component.manufacturer && !component.manufacturer.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(component.manufacturer);
      }
    });

    // Add category suggestions
    results.forEach(component => {
      if (!component.category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(component.category);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Get component by ID
   */
  getComponent(id: string): EnhancedComponentTemplate | undefined {
    return this.components.get(id);
  }

  /**
   * Get all categories
   */
  getCategories(): ComponentCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get category hierarchy
   */
  getCategoryHierarchy(): ComponentCategory[] {
    return Array.from(this.categories.values()).filter(cat => !cat.parentCategory);
  }

  /**
   * Get all manufacturers
   */
  getManufacturers(): Manufacturer[] {
    return Array.from(this.manufacturers.values());
  }

  /**
   * Get component specifications schema
   */
  getSpecifications(): ComponentSpecification[] {
    return Array.from(this.specifications.values());
  }

  /**
   * Add component to recently used list
   */
  addToRecentlyUsed(componentId: string): void {
    this.recentlyUsed = this.recentlyUsed.filter(id => id !== componentId);
    this.recentlyUsed.unshift(componentId);
    this.recentlyUsed = this.recentlyUsed.slice(0, 20); // Keep last 20
  }

  /**
   * Get recently used components
   */
  getRecentlyUsed(): EnhancedComponentTemplate[] {
    return this.recentlyUsed
      .map(id => this.components.get(id))
      .filter(Boolean) as EnhancedComponentTemplate[];
  }

  /**
   * Toggle component favorite status
   */
  toggleFavorite(componentId: string): void {
    if (this.favorites.has(componentId)) {
      this.favorites.delete(componentId);
    } else {
      this.favorites.add(componentId);
    }
  }

  /**
   * Get favorite components
   */
  getFavorites(): EnhancedComponentTemplate[] {
    return Array.from(this.favorites)
      .map(id => this.components.get(id))
      .filter(Boolean) as EnhancedComponentTemplate[];
  }

  /**
   * Import components from existing template data
   */
  importComponents(components: ComponentTemplate[]): void {
    components.forEach(component => {
      const enhanced: EnhancedComponentTemplate = {
        ...component,
        version: '1.0.0',
        status: 'active',
        tags: this.generateTags(component),
        certifications: this.extractCertifications(component),
        standardCompliance: this.extractStandardCompliance(component),
        availability: 'available',
        compatibleWith: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.components.set(component.id, enhanced);
      this.updateSearchIndex(enhanced);
    });
  }

  /**
   * Generate tags for component based on its properties
   */
  private generateTags(component: ComponentTemplate): string[] {
    const tags = [component.type, component.category.toLowerCase()];
    
    if (component.manufacturer) {
      tags.push(component.manufacturer.toLowerCase().replace(/\s+/g, '_'));
    }

    // Add specification-based tags
    const specs = component.specifications;
    if (specs.voltage) tags.push(`${specs.voltage}v`);
    if (specs.current) tags.push(`${specs.current}a`);
    if (specs.power) tags.push(`${specs.power}w`);

    return [...new Set(tags)];
  }

  /**
   * Extract certifications from component specifications
   */
  private extractCertifications(component: ComponentTemplate): string[] {
    const certifications: string[] = [];
    const specs = component.specifications;
    
    if (specs.ulListed) certifications.push('UL');
    if (specs.csaApproved) certifications.push('CSA');
    if (specs.cecCompliant) certifications.push('CEC');
    if (specs.iecCompliant) certifications.push('IEC');
    
    return certifications;
  }

  /**
   * Extract standard compliance information
   */
  private extractStandardCompliance(component: ComponentTemplate): string[] {
    const standards: string[] = [];
    const specs = component.specifications;
    
    if (specs.necCompliant) standards.push('NEC 2023');
    if (specs.ieee1547) standards.push('IEEE 1547');
    if (specs.ul1741) standards.push('UL 1741');
    
    return standards;
  }

  /**
   * Update search index for component
   */
  private updateSearchIndex(component: EnhancedComponentTemplate): void {
    const searchTerms = [
      component.name,
      component.description,
      component.manufacturer,
      component.model,
      component.category,
      component.type,
      ...component.tags
    ].filter(Boolean);

    searchTerms.forEach(term => {
      const normalizedTerm = term!.toLowerCase();
      if (!this.searchIndex.has(normalizedTerm)) {
        this.searchIndex.set(normalizedTerm, new Set());
      }
      this.searchIndex.get(normalizedTerm)!.add(component.id);
    });
  }
}