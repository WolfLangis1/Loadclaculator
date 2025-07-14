/**
 * Project Template Service
 * Provides pre-configured templates for common electrical installations
 * Includes residential, commercial, and specialty building types
 */

import type { LoadCalculatorState } from '../context/LoadCalculatorContext';
import type { LoadItem } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'industrial' | 'specialty';
  icon: string;
  squareFootage: number;
  mainBreaker: number;
  codeYear: string;
  calculationMethod: 'optional' | 'standard' | 'existing';
  generalLoads: LoadItem[];
  hvacLoads: LoadItem[];
  evseLoads: LoadItem[];
  solarBatteryLoads: LoadItem[];
  projectInfo: {
    customerName: string;
    projectName: string;
    calculatedBy: string;
    jurisdiction: string;
  };
  tags: string[];
  popularity: number; // For sorting
}

export class ProjectTemplateService {
  private static templates: ProjectTemplate[] = [
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
    },

    // === SPECIALTY TEMPLATES ===
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
        { id: 1, description: 'Heat Pump System', quantity: 1, amps: 30, volts: 240, va: 7200, enabled: true, category: 'hvac', critical: false }
      ],
      evseLoads: [
        { id: 1, description: 'Tesla Wall Connector', quantity: 1, amps: 48, volts: 240, va: 11520, enabled: true, category: 'evse', critical: false }
      ],
      solarBatteryLoads: [
        { id: 1, description: 'Solar PV System', quantity: 1, amps: 30, volts: 240, va: 7200, enabled: true, category: 'solar', critical: false },
        { id: 2, description: 'Tesla Powerwall 3', quantity: 1, amps: 25, volts: 240, va: 6000, enabled: true, category: 'battery', critical: false }
      ],
      projectInfo: {
        customerName: 'Green Energy Customer',
        projectName: 'Solar-Ready Home',
        calculatedBy: 'Solar Electrician',
        jurisdiction: 'Local AHJ'
      },
      tags: ['residential', 'solar', 'battery', 'ev', 'sustainable', 'modern'],
      popularity: 80
    },

    {
      id: 'data_center_small',
      name: 'Small Data Center/Server Room',
      description: 'Dedicated server room with redundant power and cooling',
      category: 'specialty',
      icon: '💾',
      squareFootage: 500,
      mainBreaker: 400,
      codeYear: '2023',
      calculationMethod: 'standard',
      generalLoads: [
        { id: 1, description: 'LED Lighting (2 VA/sq ft)', quantity: 1, amps: 0, volts: 120, va: 1000, enabled: true, category: 'general', critical: false },
        { id: 2, description: 'Server Racks (208V)', quantity: 10, amps: 30, volts: 208, va: 6240, enabled: true, category: 'general', critical: true },
        { id: 3, description: 'Network Equipment', quantity: 1, amps: 20, volts: 120, va: 2400, enabled: true, category: 'general', critical: true },
        { id: 4, description: 'UPS Systems', quantity: 2, amps: 50, volts: 208, va: 10400, enabled: true, category: 'general', critical: true },
        { id: 5, description: 'Fire Suppression System', quantity: 1, amps: 10, volts: 120, va: 1200, enabled: true, category: 'general', critical: true }
      ],
      hvacLoads: [
        { id: 1, description: 'Precision Air Conditioner #1', quantity: 1, amps: 25, volts: 208, va: 5200, enabled: true, category: 'hvac', critical: true },
        { id: 2, description: 'Precision Air Conditioner #2', quantity: 1, amps: 25, volts: 208, va: 5200, enabled: true, category: 'hvac', critical: true }
      ],
      evseLoads: [],
      solarBatteryLoads: [],
      projectInfo: {
        customerName: 'Data Center Client',
        projectName: 'Small Data Center',
        calculatedBy: 'Data Center Electrician',
        jurisdiction: 'City Building Dept'
      },
      tags: ['specialty', 'data-center', 'critical', 'redundant', 'servers'],
      popularity: 40
    }
  ];

  /**
   * Get all available templates
   */
  static getAllTemplates(): ProjectTemplate[] {
    return this.templates.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
    return this.templates
      .filter(template => template.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Search templates by keywords
   */
  static searchTemplates(query: string): ProjectTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): ProjectTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  /**
   * Apply template to create initial project state
   */
  static applyTemplate(templateId: string, customizations?: Partial<ProjectTemplate>): Partial<LoadCalculatorState> | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    // Merge with customizations if provided
    const finalTemplate = { ...template, ...customizations };

    return {
      // Load data
      loads: {
        generalLoads: finalTemplate.generalLoads,
        hvacLoads: finalTemplate.hvacLoads,
        evseLoads: finalTemplate.evseLoads,
        solarBatteryLoads: finalTemplate.solarBatteryLoads
      },
      
      // Project settings
      projectInfo: {
        customerName: finalTemplate.projectInfo.customerName,
        propertyAddress: '',
        city: '',
        state: '',
        zipCode: '',
        projectName: finalTemplate.projectInfo.projectName,
        calculatedBy: finalTemplate.projectInfo.calculatedBy,
        date: new Date().toISOString().split('T')[0],
        permitNumber: '',
        jobNumber: '',
        prnNumber: '',
        issueDate: '',
        approvedBy: '',
        jurisdiction: finalTemplate.projectInfo.jurisdiction,
        phone: ''
      },
      squareFootage: finalTemplate.squareFootage,
      codeYear: finalTemplate.codeYear,
      calculationMethod: finalTemplate.calculationMethod,
      mainBreaker: finalTemplate.mainBreaker,
      panelDetails: {
        manufacturer: 'Square D',
        model: 'QO',
        busRating: finalTemplate.mainBreaker,
        mainBreakerRating: finalTemplate.mainBreaker,
        spaces: 40,
        phase: 1
      },
      actualDemandData: {
        enabled: false,
        month1: 0, month2: 0, month3: 0, month4: 0,
        month5: 0, month6: 0, month7: 0, month8: 0,
        month9: 0, month10: 0, month11: 0, month12: 0,
        averageDemand: 0
      },
      
      // Load Management settings (defaults)
      useEMS: false,
      emsMaxLoad: 0,
      loadManagementType: 'none' as const,
      loadManagementMaxLoad: 0,
      simpleSwitchMode: 'branch_sharing' as const,
      simpleSwitchLoadA: null,
      simpleSwitchLoadB: null,
      
      // UI state (defaults)
      showAdvanced: false,
      activeTab: 'loads',
      
      // Project attachments (empty for templates)
      attachments: [],
      attachmentStats: {
        total: 0,
        byType: {},
        bySource: {},
        markedForExport: 0,
        totalFileSize: 0
      }
    };
  }

  /**
   * Get template categories with counts
   */
  static getTemplateCategories(): Array<{
    category: ProjectTemplate['category'];
    name: string;
    count: number;
    icon: string;
  }> {
    const categories = [
      { category: 'residential' as const, name: 'Residential', icon: '🏠' },
      { category: 'commercial' as const, name: 'Commercial', icon: '🏢' },
      { category: 'industrial' as const, name: 'Industrial', icon: '🏭' },
      { category: 'specialty' as const, name: 'Specialty', icon: '⚡' }
    ];

    return categories.map(cat => ({
      ...cat,
      count: this.templates.filter(t => t.category === cat.category).length
    }));
  }

  /**
   * Get recommended templates based on project parameters
   */
  static getRecommendedTemplates(
    squareFootage?: number,
    buildingType?: string,
    hasEV?: boolean,
    hasSolar?: boolean
  ): ProjectTemplate[] {
    let filtered = [...this.templates];

    // Filter by square footage
    if (squareFootage) {
      filtered = filtered.filter(template => {
        const sizeDiff = Math.abs(template.squareFootage - squareFootage);
        return sizeDiff <= template.squareFootage * 0.5; // Within 50% of template size
      });
    }

    // Filter by features
    if (hasEV) {
      filtered = filtered.filter(template => 
        template.evseLoads.length > 0 || template.tags.includes('ev')
      );
    }

    if (hasSolar) {
      filtered = filtered.filter(template => 
        template.solarBatteryLoads.length > 0 || template.tags.includes('solar')
      );
    }

    return filtered
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5); // Return top 5 recommendations
  }
}