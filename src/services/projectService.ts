/**
 * Project Service - Comprehensive Project Management
 * 
 * Handles project persistence, caching, templates, and logo management
 */

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  version: string;
  author: string;
  templateUsed?: string;
  isTemplate: boolean;
  tags: string[];
  thumbnail?: string;
  logoData?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    license: string;
  };
}

export interface ProjectData {
  metadata: ProjectMetadata;
  settings: any;
  loads: any;
  sldDiagram: any;
  aerialView: any;
  calculations: any;
  reports: any;
  assets: {
    logos: { [key: string]: string };
    images: { [key: string]: string };
    documents: { [key: string]: any };
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'industrial' | 'solar' | 'evse' | 'custom';
  thumbnail: string;
  defaultValues: Partial<ProjectData>;
  isBuiltIn: boolean;
  tags: string[];
}

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
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let baseData: Partial<ProjectData> = {};
    let templateUsed: string | undefined;

    if (templateId) {
      const template = this.templates.get(templateId);
      if (template) {
        baseData = template.defaultValues;
        templateUsed = templateId;
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