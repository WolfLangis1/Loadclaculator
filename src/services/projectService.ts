/**
 * Project Service - Comprehensive Project Management
 * 
 * Handles project persistence, caching, templates, and logo management
 * Consolidated from projectTemplateService.ts for better organization
 */

import { ErrorHandlingService } from './errorHandlingService';
import { apiClient } from './apiClient';
import type { LoadItem } from '../types';
import type { ProjectMetadata, ProjectData, ProjectTemplate, DetailedProjectTemplate } from '../types/project';

const PROJECT_STORAGE_KEY = 'loadCalculatorProjects';
const TEMPLATE_STORAGE_KEY = 'loadCalculatorTemplates';
const LOGO_CACHE_KEY = 'loadCalculatorLogos';
const SETTINGS_KEY = 'loadCalculatorSettings';

// Built-in project templates
const BUILT_IN_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'residential-basic',
    name: 'Basic Residential',
    description: 'Standard single-family home electrical service',
    category: 'residential',
    thumbnail: '🏠',
    isBuiltIn: true,
    tags: ['residential', 'basic', 'single-family'],
    defaultValues: {
      settings: {
        mainBreaker: 200,
        voltage: 240,
        phases: 1,
        serviceType: 'overhead'
      },
      loads: {
        generalLoads: [
          { name: 'General Lighting', watts: 3000, quantity: 1, category: 'lighting' },
          { name: 'Small Appliance Circuits', watts: 1500, quantity: 2, category: 'receptacle' },
          { name: 'Laundry Circuit', watts: 1500, quantity: 1, category: 'receptacle' }
        ]
      }
    }
  },
  {
    id: 'residential-luxury',
    name: 'Luxury Residential',
    description: 'High-end home with advanced electrical features',
    category: 'residential',
    thumbnail: '🏰',
    isBuiltIn: true,
    tags: ['residential', 'luxury', 'high-end'],
    defaultValues: {
      settings: {
        mainBreaker: 400,
        voltage: 240,
        phases: 1,
        serviceType: 'underground'
      },
      loads: {
        generalLoads: [
          { name: 'General Lighting', watts: 5000, quantity: 1, category: 'lighting' },
          { name: 'Small Appliance Circuits', watts: 1500, quantity: 4, category: 'receptacle' },
          { name: 'Kitchen Island Outlet', watts: 1500, quantity: 2, category: 'receptacle' }
        ],
        hvacLoads: [
          { name: 'Central Air Conditioning', watts: 5000, quantity: 2, category: 'hvac' },
          { name: 'Electric Heat Pump', watts: 8000, quantity: 1, category: 'hvac' }
        ]
      }
    }
  },
  {
    id: 'commercial-office',
    name: 'Commercial Office',
    description: 'Office building electrical distribution',
    category: 'commercial',
    thumbnail: '🏢',
    isBuiltIn: true,
    tags: ['commercial', 'office', '3-phase'],
    defaultValues: {
      settings: {
        mainBreaker: 800,
        voltage: 480,
        phases: 3,
        serviceType: 'underground'
      }
    }
  },
  {
    id: 'solar-residential',
    name: 'Solar + Storage',
    description: 'Residential solar with battery storage',
    category: 'solar',
    thumbnail: '☀️',
    isBuiltIn: true,
    tags: ['solar', 'battery', 'renewable'],
    defaultValues: {
      loads: {
        solarBatteryLoads: [
          { 
            name: 'Rooftop Solar Array', 
            kw: 10, 
            quantity: 1, 
            category: 'solar',
            inverterType: 'string',
            batteryCapacity: 13.5
          }
        ]
      }
    }
  },
  {
    id: 'evse-multifamily',
    name: 'Multi-Family EVSE',
    description: 'Electric vehicle charging for apartments/condos',
    category: 'evse',
    thumbnail: '🚗',
    isBuiltIn: true,
    tags: ['evse', 'multi-family', 'load-management'],
    defaultValues: {
      loads: {
        evseLoads: [
          { 
            name: 'Level 2 EVSE Bank', 
            amps: 40, 
            quantity: 8, 
            category: 'evse',
            hasEMS: true,
            loadManagementFactor: 0.6
          }
        ]
      }
    }
  },
  {
    id: 'industrial-facility',
    name: 'Industrial Facility',
    description: 'Manufacturing or industrial electrical system',
    category: 'industrial',
    thumbnail: '🏭',
    isBuiltIn: true,
    tags: ['industrial', 'manufacturing', 'motors'],
    defaultValues: {
      settings: {
        mainBreaker: 2000,
        voltage: 480,
        phases: 3,
        serviceType: 'underground'
      }
    }
  }
];

// Comprehensive detailed templates with full load specifications
const DETAILED_TEMPLATES: DetailedProjectTemplate[] = [
  // === RESIDENTIAL TEMPLATES ===
  {
    id: 'single_family_small',
    name: 'Single Family Home - Small (Under 1500 sq ft)',
    description: 'Typical 2-3 bedroom home with basic electrical needs',
    category: 'residential',
    icon: '🏠',
    squareFootage: 1200,
    mainBreaker: 100,
    codeYear: '2023',
    calculationMethod: 'optional',
    generalLoads: [
      { id: 1, description: 'General Lighting (3 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 3600, enabled: true, category: 'general', critical: false },
      { id: 2, description: 'Small Appliance Circuits (2 required)', quantity: 2, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 3, description: 'Laundry Circuit', quantity: 1, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 4, description: 'Bathroom Circuit', quantity: 1, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 5, description: 'Garbage Disposal', quantity: 1, amps: 8, volts: 120, va: 960, enabled: true, category: 'general', critical: false },
      { id: 6, description: 'Dishwasher', quantity: 1, amps: 10, volts: 120, va: 1200, enabled: true, category: 'general', critical: false },
      { id: 7, description: 'Range/Oven', quantity: 1, amps: 40, volts: 240, va: 9600, enabled: true, category: 'general', critical: false }
    ],
    hvacLoads: [
      { id: 1, description: 'Central Air Conditioning', quantity: 1, amps: 25, volts: 240, va: 6000, enabled: true, category: 'hvac', critical: false },
      { id: 2, description: 'Heat Pump', quantity: 1, amps: 20, volts: 240, va: 4800, enabled: false, category: 'hvac', critical: false }
    ],
    evseLoads: [],
    solarBatteryLoads: [],
    projectInfo: {
      customerName: 'Sample Customer',
      projectName: 'Small Single Family Home',
      calculatedBy: 'Electrical Contractor',
      jurisdiction: 'Local AHJ'
    },
    tags: ['residential', 'single-family', 'small', 'basic'],
    popularity: 90
  },
  {
    id: 'single_family_large',
    name: 'Single Family Home - Large (Over 3000 sq ft)',
    description: 'Large home with modern amenities and high electrical demand',
    category: 'residential',
    icon: '🏡',
    squareFootage: 3500,
    mainBreaker: 200,
    codeYear: '2023',
    calculationMethod: 'optional',
    generalLoads: [
      { id: 1, description: 'General Lighting (3 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 10500, enabled: true, category: 'general', critical: false },
      { id: 2, description: 'Small Appliance Circuits (4 recommended)', quantity: 4, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 3, description: 'Laundry Circuit', quantity: 1, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 4, description: 'Bathroom Circuits', quantity: 3, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 5, description: 'Garbage Disposal', quantity: 1, amps: 8, volts: 120, va: 960, enabled: true, category: 'general', critical: false },
      { id: 6, description: 'Dishwasher', quantity: 1, amps: 10, volts: 120, va: 1200, enabled: true, category: 'general', critical: false },
      { id: 7, description: 'Range/Oven - Electric', quantity: 1, amps: 50, volts: 240, va: 12000, enabled: true, category: 'general', critical: false },
      { id: 8, description: 'Pool Pump', quantity: 1, amps: 15, volts: 240, va: 3600, enabled: true, category: 'general', critical: false },
      { id: 9, description: 'Hot Tub', quantity: 1, amps: 50, volts: 240, va: 12000, enabled: true, category: 'general', critical: false },
      { id: 10, description: 'Workshop/Garage Outlets', quantity: 1, amps: 20, volts: 240, va: 4800, enabled: true, category: 'general', critical: false }
    ],
    hvacLoads: [
      { id: 1, description: 'Central Air Conditioning - Main', quantity: 1, amps: 40, volts: 240, va: 9600, enabled: true, category: 'hvac', critical: false },
      { id: 2, description: 'Central Air Conditioning - Zone 2', quantity: 1, amps: 25, volts: 240, va: 6000, enabled: true, category: 'hvac', critical: false },
      { id: 3, description: 'Heat Pump', quantity: 1, amps: 35, volts: 240, va: 8400, enabled: false, category: 'hvac', critical: false }
    ],
    evseLoads: [
      { id: 1, description: 'Level 2 EV Charger', quantity: 1, amps: 32, volts: 240, va: 7680, enabled: true, category: 'evse', critical: false }
    ],
    solarBatteryLoads: [],
    projectInfo: {
      customerName: 'Sample Customer',
      projectName: 'Large Single Family Home',
      calculatedBy: 'Electrical Contractor',
      jurisdiction: 'Local AHJ'
    },
    tags: ['residential', 'single-family', 'large', 'luxury', 'pool', 'ev'],
    popularity: 85
  },
  {
    id: 'solar_ready_home',
    name: 'Solar-Ready Home with Battery Storage',
    description: 'Modern home designed for renewable energy integration',
    category: 'specialty',
    icon: '☀️',
    squareFootage: 2200,
    mainBreaker: 200,
    codeYear: '2023',
    calculationMethod: 'optional',
    generalLoads: [
      { id: 1, description: 'General Lighting - LED (2 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 4400, enabled: true, category: 'general', critical: false },
      { id: 2, description: 'Small Appliance Circuits', quantity: 2, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 3, description: 'Laundry Circuit', quantity: 1, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 4, description: 'Bathroom Circuits', quantity: 2, amps: 0, volts: 120, va: 1500, enabled: true, category: 'general', critical: false },
      { id: 5, description: 'Induction Cooktop', quantity: 1, amps: 40, volts: 240, va: 9600, enabled: true, category: 'general', critical: false },
      { id: 6, description: 'Heat Pump Water Heater', quantity: 1, amps: 25, volts: 240, va: 6000, enabled: true, category: 'general', critical: false }
    ],
    hvacLoads: [
      { id: 1, description: 'Heat Pump System', quantity: 1, amps: 35, volts: 240, va: 8400, enabled: true, category: 'hvac', critical: false }
    ],
    evseLoads: [
      { id: 1, description: 'Level 2 EV Charger', quantity: 1, amps: 32, volts: 240, va: 7680, enabled: true, category: 'evse', critical: false }
    ],
    solarBatteryLoads: [
      { id: 1, description: 'Solar PV System', quantity: 1, amps: 0, volts: 240, va: 8000, enabled: true, category: 'solar', critical: false, kw: 8, batteryCapacity: 13.5 },
      { id: 2, description: 'Battery Storage System', quantity: 1, amps: 0, volts: 240, va: 5000, enabled: true, category: 'battery', critical: false, kw: 5, batteryCapacity: 13.5 }
    ],
    projectInfo: {
      customerName: 'Green Energy Customer',
      projectName: 'Solar-Ready Home',
      calculatedBy: 'Solar Installer',
      jurisdiction: 'Local AHJ'
    },
    tags: ['specialty', 'solar', 'battery', 'renewable', 'heat-pump', 'ev'],
    popularity: 95
  },
  // === COMMERCIAL TEMPLATES ===
  {
    id: 'small_office',
    name: 'Small Office Building',
    description: 'Professional office space with standard commercial loads',
    category: 'commercial',
    icon: '🏢',
    squareFootage: 2500,
    mainBreaker: 225,
    codeYear: '2023',
    calculationMethod: 'standard',
    generalLoads: [
      { id: 1, description: 'General Lighting (1.5 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 3750, enabled: true, category: 'general', critical: false },
      { id: 2, description: 'Receptacle Outlets (1 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 2500, enabled: true, category: 'general', critical: false },
      { id: 3, description: 'Copy/Printer Room', quantity: 1, amps: 20, volts: 240, va: 4800, enabled: true, category: 'general', critical: false },
      { id: 4, description: 'Break Room Appliances', quantity: 1, amps: 30, volts: 240, va: 7200, enabled: true, category: 'general', critical: false },
      { id: 5, description: 'Emergency Lighting', quantity: 1, amps: 5, volts: 120, va: 600, enabled: true, category: 'general', critical: true },
      { id: 6, description: 'Fire Alarm System', quantity: 1, amps: 3, volts: 120, va: 360, enabled: true, category: 'general', critical: true },
      { id: 7, description: 'Security System', quantity: 1, amps: 2, volts: 120, va: 240, enabled: true, category: 'general', critical: true }
    ],
    hvacLoads: [
      { id: 1, description: 'Rooftop HVAC Unit #1', quantity: 1, amps: 35, volts: 480, va: 29088, enabled: true, category: 'hvac', critical: false },
      { id: 2, description: 'Rooftop HVAC Unit #2', quantity: 1, amps: 35, volts: 480, va: 29088, enabled: true, category: 'hvac', critical: false }
    ],
    evseLoads: [
      { id: 1, description: 'Employee EV Charging Stations', quantity: 4, amps: 32, volts: 240, va: 7680, enabled: true, category: 'evse', critical: false }
    ],
    solarBatteryLoads: [],
    projectInfo: {
      customerName: 'Sample Business',
      projectName: 'Small Office Building',
      calculatedBy: 'Commercial Electrician',
      jurisdiction: 'City Building Dept'
    },
    tags: ['commercial', 'office', 'small', 'business', 'ev-ready'],
    popularity: 75
  },
  {
    id: 'retail_store',
    name: 'Retail Store',
    description: 'Retail space with display lighting and commercial equipment',
    category: 'commercial',
    icon: '🏪',
    squareFootage: 4000,
    mainBreaker: 400,
    codeYear: '2023',
    calculationMethod: 'standard',
    generalLoads: [
      { id: 1, description: 'General Lighting (3 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 12000, enabled: true, category: 'general', critical: false },
      { id: 2, description: 'Display Lighting (2 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 8000, enabled: true, category: 'general', critical: false },
      { id: 3, description: 'Receptacle Outlets (1 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 4000, enabled: true, category: 'general', critical: false },
      { id: 4, description: 'Cash Register Systems', quantity: 6, amps: 5, volts: 120, va: 600, enabled: true, category: 'general', critical: true },
      { id: 5, description: 'Security System', quantity: 1, amps: 8, volts: 120, va: 960, enabled: true, category: 'general', critical: true },
      { id: 6, description: 'Refrigerated Display Cases', quantity: 4, amps: 15, volts: 120, va: 1800, enabled: true, category: 'general', critical: true }
    ],
    hvacLoads: [
      { id: 1, description: 'Rooftop Units (RTU)', quantity: 2, amps: 45, volts: 480, va: 38520, enabled: true, category: 'hvac', critical: false }
    ],
    evseLoads: [],
    solarBatteryLoads: [],
    projectInfo: {
      customerName: 'Retail Client',
      projectName: 'Retail Store',
      calculatedBy: 'Commercial Electrician',
      jurisdiction: 'City Building Dept'
    },
    tags: ['commercial', 'retail', 'store', 'display', 'refrigeration'],
    popularity: 70
  }
];

export class ProjectTemplateService {
  /**
   * Get all available detailed templates
   */
  static getTemplates(): DetailedProjectTemplate[] {
    return DETAILED_TEMPLATES;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: 'residential' | 'commercial' | 'industrial' | 'specialty'): DetailedProjectTemplate[] {
    return DETAILED_TEMPLATES.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): DetailedProjectTemplate | undefined {
    return DETAILED_TEMPLATES.find(template => template.id === id);
  }

  /**
   * Get popular templates (sorted by popularity)
   */
  static getPopularTemplates(limit: number = 5): DetailedProjectTemplate[] {
    return DETAILED_TEMPLATES
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Search templates by name, description, or tags
   */
  static searchTemplates(query: string): DetailedProjectTemplate[] {
    const searchTerm = query.toLowerCase();
    return DETAILED_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get template statistics
   */
  static getTemplateStats() {
    return {
      total: DETAILED_TEMPLATES.length,
      byCategory: {
        residential: DETAILED_TEMPLATES.filter(t => t.category === 'residential').length,
        commercial: DETAILED_TEMPLATES.filter(t => t.category === 'commercial').length,
        industrial: DETAILED_TEMPLATES.filter(t => t.category === 'industrial').length,
        specialty: DETAILED_TEMPLATES.filter(t => t.category === 'specialty').length
      },
      averagePopularity: DETAILED_TEMPLATES.reduce((sum, t) => sum + t.popularity, 0) / DETAILED_TEMPLATES.length
    };
  }
}

class ProjectService {
  private projects: Map<string, ProjectData> = new Map();
  private templates: Map<string, ProjectTemplate> = new Map();
  private logoCache: Map<string, string> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    // Load projects from localStorage
    this.loadProjectsFromStorage();
    
    // Load templates (built-in + custom)
    this.loadTemplatesFromStorage();
    
    // Load logo cache
    this.loadLogoCacheFromStorage();

    this.initialized = true;
  }

  private loadProjectsFromStorage(): void {
    try {
      const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (stored) {
        const projectsArray = JSON.parse(stored);
        projectsArray.forEach((projectData: ProjectData) => {
          this.projects.set(projectData.metadata.id, projectData);
        });
      }
    } catch (error) {
      console.warn('Failed to load projects from storage:', error);
    }
  }

  private loadTemplatesFromStorage(): void {
    // Load built-in templates
    BUILT_IN_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });

    // Load custom templates
    try {
      const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (stored) {
        const customTemplates = JSON.parse(stored);
        customTemplates.forEach((template: ProjectTemplate) => {
          this.templates.set(template.id, template);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom templates from storage:', error);
    }
  }

  private loadLogoCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(LOGO_CACHE_KEY);
      if (stored) {
        const logoData = JSON.parse(stored);
        Object.entries(logoData).forEach(([key, value]) => {
          this.logoCache.set(key, value as string);
        });
      }
    } catch (error) {
      console.warn('Failed to load logo cache from storage:', error);
    }
  }

  private saveProjectsToStorage(): void {
    try {
      const projectsArray = Array.from(this.projects.values());
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projectsArray));
    } catch (error) {
      console.error('Failed to save projects to storage:', error);
    }
  }

  private saveTemplatesToStorage(): void {
    try {
      const customTemplates = Array.from(this.templates.values())
        .filter(template => !template.isBuiltIn);
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Failed to save templates to storage:', error);
    }
  }

  private saveLogoCacheToStorage(): void {
    try {
      const logoData = Object.fromEntries(this.logoCache);
      localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(logoData));
    } catch (error) {
      console.error('Failed to save logo cache to storage:', error);
    }
  }

  // Project Management
  createProject(name: string, templateId?: string): ProjectData {
    try {
      // Validate project name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw ErrorHandlingService.handleValidationError(
          'name',
          name,
          'must be a non-empty string',
          'ProjectService.createProject'
        );
      }

      if (name.length > 100) {
        throw ErrorHandlingService.handleValidationError(
          'name',
          name,
          'must be less than 100 characters',
          'ProjectService.createProject'
        );
      }

      const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      let baseData: Partial<ProjectData> = {};
      let templateUsed: string | undefined;

      if (templateId) {
        const template = this.templates.get(templateId);
        if (template) {
          baseData = template.defaultValues;
          templateUsed = templateId;
        } else {
          throw ErrorHandlingService.handleValidationError(
            'templateId',
            templateId,
            'template not found',
            'ProjectService.createProject'
          );
        }
      }

    const projectData: ProjectData = {
      metadata: {
        id: projectId,
        name,
        description: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0',
        author: 'Load Calculator User',
        templateUsed,
        isTemplate: false,
        tags: [],
        ...baseData.metadata
      },
      settings: baseData.settings || {},
      loads: baseData.loads || {},
      sldDiagram: baseData.sldDiagram || null,
      aerialView: baseData.aerialView || null,
      calculations: baseData.calculations || {},
      reports: baseData.reports || {},
      assets: {
        logos: {},
        images: {},
        documents: {},
        ...baseData.assets
      }
    };

    this.projects.set(projectId, projectData);
    this.saveProjectsToStorage();

    return projectData;
    
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'ProjectService.createProject');
    }
  }

  updateProject(projectId: string, updates: Partial<ProjectData>): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const updatedProject = {
      ...project,
      ...updates,
      metadata: {
        ...project.metadata,
        ...updates.metadata,
        modified: new Date().toISOString()
      }
    };

    this.projects.set(projectId, updatedProject);
    this.saveProjectsToStorage();
    return true;
  }

  deleteProject(projectId: string): boolean {
    const success = this.projects.delete(projectId);
    if (success) {
      this.saveProjectsToStorage();
    }
    return success;
  }

  getProject(projectId: string): ProjectData | null {
    return this.projects.get(projectId) || null;
  }

  getAllProjects(): ProjectData[] {
    return Array.from(this.projects.values())
      .sort((a, b) => new Date(b.metadata.modified).getTime() - new Date(a.metadata.modified).getTime());
  }

  duplicateProject(projectId: string, newName?: string): ProjectData | null {
    const original = this.projects.get(projectId);
    if (!original) return null;

    const newProjectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duplicatedProject: ProjectData = {
      ...JSON.parse(JSON.stringify(original)), // Deep clone
      metadata: {
        ...original.metadata,
        id: newProjectId,
        name: newName || `${original.metadata.name} (Copy)`,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        isTemplate: false
      }
    };

    this.projects.set(newProjectId, duplicatedProject);
    this.saveProjectsToStorage();

    return duplicatedProject;
  }

  // Template Management
  createTemplateFromProject(projectId: string, templateName: string, category: ProjectTemplate['category']): ProjectTemplate | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const template: ProjectTemplate = {
      id: templateId,
      name: templateName,
      description: `Template created from ${project.metadata.name}`,
      category,
      thumbnail: this.getCategoryThumbnail(category),
      isBuiltIn: false,
      tags: project.metadata.tags,
      defaultValues: {
        settings: project.settings,
        loads: project.loads,
        sldDiagram: project.sldDiagram,
        assets: project.assets
      }
    };

    this.templates.set(templateId, template);
    this.saveTemplatesToStorage();

    return template;
  }

  getTemplate(templateId: string): ProjectTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getAllTemplates(): ProjectTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.isBuiltIn) return false;

    const success = this.templates.delete(templateId);
    if (success) {
      this.saveTemplatesToStorage();
    }
    return success;
  }

  private getCategoryThumbnail(category: ProjectTemplate['category']): string {
    const thumbnails = {
      residential: '🏠',
      commercial: '🏢',
      industrial: '🏭',
      solar: '☀️',
      evse: '🚗',
      custom: '📋'
    };
    return thumbnails[category];
  }

  // Logo Management
  cacheLogo(logoKey: string, logoData: string): void {
    this.logoCache.set(logoKey, logoData);
    this.saveLogoCacheToStorage();
  }

  getCachedLogo(logoKey: string): string | null {
    return this.logoCache.get(logoKey) || null;
  }

  removeCachedLogo(logoKey: string): boolean {
    const success = this.logoCache.delete(logoKey);
    if (success) {
      this.saveLogoCacheToStorage();
    }
    return success;
  }

  getAllCachedLogos(): Array<{ key: string; data: string }> {
    return Array.from(this.logoCache.entries()).map(([key, data]) => ({ key, data }));
  }

  // Search and Filter
  searchProjects(query: string): ProjectData[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllProjects().filter(project => 
      project.metadata.name.toLowerCase().includes(lowercaseQuery) ||
      project.metadata.description.toLowerCase().includes(lowercaseQuery) ||
      project.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      project.metadata.author.toLowerCase().includes(lowercaseQuery)
    );
  }

  getProjectsByTag(tag: string): ProjectData[] {
    return this.getAllProjects().filter(project =>
      project.metadata.tags.includes(tag)
    );
  }

  // Export/Import
  exportProject(projectId: string): string | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    return JSON.stringify(project, null, 2);
  }

  importProject(projectData: string): boolean {
    try {
      const project: ProjectData = JSON.parse(projectData);
      
      // Validate required fields
      if (!project.metadata || !project.metadata.id || !project.metadata.name) {
        throw new Error('Invalid project data structure');
      }

      // Ensure unique ID
      if (this.projects.has(project.metadata.id)) {
        project.metadata.id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      project.metadata.modified = new Date().toISOString();
      
      this.projects.set(project.metadata.id, project);
      this.saveProjectsToStorage();

      return true;
    } catch (error) {
      console.error('Failed to import project:', error);
      return false;
    }
  }

  // Statistics
  getProjectStatistics() {
    const projects = this.getAllProjects();
    const templates = this.getAllTemplates();
    
    return {
      totalProjects: projects.length,
      totalTemplates: templates.length,
      builtInTemplates: templates.filter(t => t.isBuiltIn).length,
      customTemplates: templates.filter(t => !t.isBuiltIn).length,
      projectsByMonth: this.getProjectsByMonth(projects),
      mostUsedTemplates: this.getMostUsedTemplates(projects),
      cachedLogos: this.logoCache.size
    };
  }

  // ============ Database Sync Methods ============
  
  /**
   * Sync local projects with database
   * Called when user authenticates
   */
  async syncWithDatabase(userId?: string): Promise<void> {
    if (!userId) return;
    
    try {
      // Get projects from database
      const projectsApi = await apiClient.projects();
      const response = await projectsApi.list({ limit: 1000 });
      
      if (response.success) {
        // Merge database projects with local projects
        const dbProjects = response.data.projects || [];
        const localProjects = this.getAllProjects();
        
        // Upload local projects that don't exist in database
        for (const localProject of localProjects) {
          const exists = dbProjects.some(p => 
            p.name === localProject.metadata.name && 
            p.created_at === localProject.metadata.created
          );
          
          if (!exists) {
            await this.uploadProjectToDatabase(localProject);
          }
        }
        
        // Download database projects to local storage
        for (const dbProject of dbProjects) {
          await this.downloadProjectFromDatabase(dbProject.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync projects with database:', error);
    }
  }
  
  /**
   * Save project to database
   */
  async saveProjectToDatabase(projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;
    
    try {
      const projectsApi = await apiClient.projects();
      
      // Check if project exists in database
      const dbProject = await this.findProjectInDatabase(projectId);
      
      if (dbProject) {
        // Update existing project
        const response = await projectsApi.update(dbProject.id, {
          name: project.metadata.name,
          data: project.loads,
          calculations: project.calculations,
          sldData: project.sldDiagram,
          aerialData: project.aerialView,
          notes: project.metadata.description,
          tags: project.metadata.tags
        });
        
        return response.success;
      } else {
        // Create new project
        const response = await projectsApi.create({
          name: project.metadata.name,
          data: project.loads,
          calculations: project.calculations,
          sldData: project.sldDiagram,
          aerialData: project.aerialView,
          notes: project.metadata.description,
          tags: project.metadata.tags
        });
        
        if (response.success && response.data.project) {
          // Store mapping between local and database IDs
          project.metadata.databaseId = response.data.project.id;
          this.saveProjectsToStorage();
        }
        
        return response.success;
      }
    } catch (error) {
      console.error('Failed to save project to database:', error);
      return false;
    }
  }
  
  /**
   * Load project from database
   */
  async loadProjectFromDatabase(databaseId: string): Promise<ProjectData | null> {
    try {
      const projectsApi = await apiClient.projects();
      const response = await projectsApi.get(databaseId);
      
      if (response.success && response.data.project) {
        const dbProject = response.data.project;
        
        // Convert database format to local format
        const project: ProjectData = {
          metadata: {
            id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            databaseId: dbProject.id,
            name: dbProject.name,
            description: dbProject.notes || '',
            created: dbProject.created_at,
            modified: dbProject.updated_at,
            version: dbProject.version?.toString() || '1.0.0',
            author: dbProject.user?.name || 'Unknown',
            isTemplate: false,
            tags: dbProject.tags || []
          },
          settings: dbProject.data?.settings || {},
          loads: dbProject.data || {},
          sldDiagram: dbProject.sld_data || {},
          aerialView: dbProject.aerial_data || {},
          calculations: dbProject.calculations || {},
          reports: {},
          assets: {
            logos: {},
            images: {},
            documents: {}
          }
        };
        
        // Save to local storage
        this.projects.set(project.metadata.id, project);
        this.saveProjectsToStorage();
        
        return project;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load project from database:', error);
      return null;
    }
  }
  
  /**
   * Delete project from database
   */
  async deleteProjectFromDatabase(projectId: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project || !project.metadata.databaseId) return false;
    
    try {
      const projectsApi = await apiClient.projects();
      const response = await projectsApi.delete(project.metadata.databaseId);
      
      return response.success;
    } catch (error) {
      console.error('Failed to delete project from database:', error);
      return false;
    }
  }
  
  // Helper methods for database operations
  private async findProjectInDatabase(localProjectId: string): Promise<any | null> {
    const project = this.projects.get(localProjectId);
    if (!project || !project.metadata.databaseId) return null;
    
    try {
      const projectsApi = await apiClient.projects();
      const response = await projectsApi.get(project.metadata.databaseId);
      
      return response.success ? response.data.project : null;
    } catch (error) {
      return null;
    }
  }
  
  private async uploadProjectToDatabase(project: ProjectData): Promise<void> {
    try {
      const projectsApi = await apiClient.projects();
      const response = await projectsApi.create({
        name: project.metadata.name,
        data: project.loads,
        calculations: project.calculations,
        sldData: project.sldDiagram,
        aerialData: project.aerialView,
        notes: project.metadata.description,
        tags: project.metadata.tags
      });
      
      if (response.success && response.data.project) {
        project.metadata.databaseId = response.data.project.id;
        this.saveProjectsToStorage();
      }
    } catch (error) {
      console.error('Failed to upload project to database:', error);
    }
  }
  
  private async downloadProjectFromDatabase(databaseId: string): Promise<void> {
    // Check if we already have this project locally
    const existingProject = Array.from(this.projects.values()).find(
      p => p.metadata.databaseId === databaseId
    );
    
    if (!existingProject) {
      await this.loadProjectFromDatabase(databaseId);
    }
  }

  private getProjectsByMonth(projects: ProjectData[]) {
    const monthCounts = new Map<string, number>();
    
    projects.forEach(project => {
      const date = new Date(project.metadata.created);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    return Array.from(monthCounts.entries()).map(([month, count]) => ({ month, count }));
  }

  private getMostUsedTemplates(projects: ProjectData[]) {
    const templateCounts = new Map<string, number>();
    
    projects.forEach(project => {
      if (project.metadata.templateUsed) {
        const count = templateCounts.get(project.metadata.templateUsed) || 0;
        templateCounts.set(project.metadata.templateUsed, count + 1);
      }
    });

    return Array.from(templateCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([templateId, count]) => {
        const template = this.templates.get(templateId);
        return {
          templateId,
          templateName: template?.name || 'Unknown Template',
          count
        };
      });
  }
}

// Singleton instance
export const projectService = new ProjectService();
export default projectService;