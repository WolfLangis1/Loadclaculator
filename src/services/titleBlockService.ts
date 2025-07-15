/**
 * Title Block Management Service
 * 
 * Manages professional title block creation, customization, and export
 * Integrates with project data and drawing generation workflows
 */

import type { TitleBlockData } from '../components/SLD/TitleBlockTemplates';
import type { LoadState } from '../types/load';

export interface TitleBlockTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'professional' | 'engineering' | 'permit';
  industryStandard: 'ANSI' | 'IEEE' | 'IEC' | 'Custom';
  fields: (keyof TitleBlockData)[];
  defaultData: Partial<TitleBlockData>;
  requiredFields: (keyof TitleBlockData)[];
  paperSizes: ('letter' | 'legal' | 'tabloid' | 'a4' | 'a3' | 'a2' | 'a1')[];
  orientations: ('portrait' | 'landscape')[];
}

export interface TitleBlockConfiguration {
  template: TitleBlockTemplate;
  data: TitleBlockData;
  paperSize: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3' | 'a2' | 'a1';
  orientation: 'portrait' | 'landscape';
  customization: {
    showLogo: boolean;
    logoUrl?: string;
    customColors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
  };
}

// Professional title block templates
export const TITLE_BLOCK_TEMPLATES: TitleBlockTemplate[] = [
  {
    id: 'standard-residential',
    name: 'Standard Residential',
    description: 'Basic title block for residential electrical projects',
    category: 'standard',
    industryStandard: 'ANSI',
    fields: [
      'projectName', 'drawingTitle', 'drawingNumber', 'revision', 'date',
      'drawnBy', 'client', 'address', 'scale', 'sheetNumber', 'totalSheets'
    ],
    defaultData: {
      scale: 'NTS',
      revision: 'A',
      necCodeYear: '2023',
      sheetNumber: '1',
      totalSheets: '1'
    },
    requiredFields: ['projectName', 'drawingTitle', 'drawingNumber', 'drawnBy', 'client'],
    paperSizes: ['letter', 'legal', 'tabloid'],
    orientations: ['portrait', 'landscape']
  },
  {
    id: 'professional-commercial',
    name: 'Professional Commercial',
    description: 'Enhanced title block for commercial electrical projects',
    category: 'professional',
    industryStandard: 'IEEE',
    fields: [
      'projectName', 'projectNumber', 'drawingTitle', 'drawingNumber', 'revision',
      'date', 'drawnBy', 'checkedBy', 'approvedBy', 'client', 'address',
      'scale', 'sheetNumber', 'totalSheets', 'necCodeYear', 'voltage', 'service'
    ],
    defaultData: {
      scale: 'NTS',
      revision: 'A',
      necCodeYear: '2023',
      voltage: '120/240V',
      service: '200A',
      sheetNumber: '1',
      totalSheets: '1'
    },
    requiredFields: [
      'projectName', 'drawingTitle', 'drawingNumber', 'drawnBy', 
      'checkedBy', 'client', 'necCodeYear'
    ],
    paperSizes: ['letter', 'legal', 'tabloid', 'a4', 'a3'],
    orientations: ['portrait', 'landscape']
  },
  {
    id: 'engineering-industrial',
    name: 'Engineering Industrial',
    description: 'Professional engineering title block for industrial projects',
    category: 'engineering',
    industryStandard: 'IEEE',
    fields: [
      'projectName', 'projectNumber', 'drawingTitle', 'drawingNumber', 'revision',
      'date', 'drawnBy', 'checkedBy', 'approvedBy', 'client', 'address',
      'scale', 'sheetNumber', 'totalSheets', 'necCodeYear', 'voltage', 'service',
      'description'
    ],
    defaultData: {
      scale: '1/4" = 1\'',
      revision: '0',
      necCodeYear: '2023',
      voltage: '480/277V',
      service: '800A',
      sheetNumber: 'E1',
      totalSheets: '1'
    },
    requiredFields: [
      'projectName', 'drawingTitle', 'drawingNumber', 'drawnBy', 
      'checkedBy', 'approvedBy', 'client', 'necCodeYear'
    ],
    paperSizes: ['tabloid', 'a3', 'a2', 'a1'],
    orientations: ['landscape']
  },
  {
    id: 'permit-submission',
    name: 'Permit Submission',
    description: 'AHJ-compliant title block for electrical permit submissions',
    category: 'permit',
    industryStandard: 'Custom',
    fields: [
      'projectName', 'projectNumber', 'drawingTitle', 'drawingNumber', 'revision',
      'date', 'drawnBy', 'checkedBy', 'approvedBy', 'client', 'address',
      'permitNumber', 'ahj', 'scale', 'sheetNumber', 'totalSheets', 'necCodeYear',
      'voltage', 'service', 'description'
    ],
    defaultData: {
      scale: 'NTS',
      revision: 'A',
      necCodeYear: '2023',
      sheetNumber: '1',
      totalSheets: '1'
    },
    requiredFields: [
      'projectName', 'drawingTitle', 'drawingNumber', 'drawnBy', 
      'client', 'address', 'ahj', 'necCodeYear'
    ],
    paperSizes: ['letter', 'legal', 'tabloid'],
    orientations: ['portrait', 'landscape']
  }
];

/**
 * Generate title block data from project and load information
 */
export const generateTitleBlockFromProject = (
  projectInfo: any,
  loads: LoadState,
  templateId: string = 'professional'
): TitleBlockData => {
  // Map simple template names to actual template IDs
  const templateMap: Record<string, string> = {
    'professional': 'professional-commercial',
    'standard': 'standard-residential',
    'engineering': 'engineering-industrial',
    'permit': 'permit-submission'
  };
  
  const actualTemplateId = templateMap[templateId] || templateId;
  const template = TITLE_BLOCK_TEMPLATES.find(t => t.id === actualTemplateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Calculate electrical specifications from load data
  const totalGeneralLoad = loads.generalLoads.reduce((sum, load) => 
    sum + (load.amps * load.quantity), 0
  );
  const totalHvacLoad = loads.hvacLoads.reduce((sum, load) => 
    sum + (load.amps * load.quantity), 0
  );
  const totalEvseLoad = loads.evseLoads.reduce((sum, load) => 
    sum + (load.amps * load.quantity), 0
  );
  const totalLoad = totalGeneralLoad + totalHvacLoad + totalEvseLoad;

  // Determine service size based on load
  let serviceSize = '200A';
  if (totalLoad > 200) serviceSize = '400A';
  else if (totalLoad > 150) serviceSize = '200A';
  else if (totalLoad > 100) serviceSize = '150A';
  else serviceSize = '100A';

  // Determine voltage based on loads
  const hasHvacOrEvse = loads.hvacLoads.some(l => l.quantity > 0) || 
                        loads.evseLoads.some(l => l.quantity > 0);
  const voltage = hasHvacOrEvse ? '120/240V' : '120V';

  const currentDate = new Date().toLocaleDateString();

  const titleBlockData: TitleBlockData = {
    projectName: projectInfo.projectName || 'Electrical Project',
    projectNumber: projectInfo.projectNumber || '',
    drawingTitle: 'Single Line Diagram',
    drawingNumber: `${projectInfo.projectNumber || 'E'}-SLD-001`,
    revision: 'A',
    date: currentDate,
    drawnBy: projectInfo.engineer || 'Design Engineer',
    checkedBy: projectInfo.checker || '',
    approvedBy: projectInfo.approver || '',
    client: projectInfo.clientName || projectInfo.projectName || 'Client',
    address: projectInfo.address || 'Project Address',
    permitNumber: projectInfo.permitNumber || '',
    ahj: projectInfo.ahj || 'Local AHJ',
    scale: 'NTS',
    sheetNumber: '1',
    totalSheets: '1',
    necCodeYear: '2023',
    voltage: voltage,
    service: serviceSize,
    description: `Electrical single line diagram showing ${serviceSize} service with ${Math.round(totalLoad)}A calculated load`,
    ...template.defaultData
  };

  return titleBlockData;
};

/**
 * Validate title block data against template requirements
 */
export const validateTitleBlockData = (
  data: Partial<TitleBlockData>,
  template: TitleBlockTemplate
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of template.requiredFields) {
    if (!data[field] || data[field]?.trim() === '') {
      errors.push(`${field} is required for ${template.name} template`);
    }
  }

  // Validate drawing number format
  if (data.drawingNumber && !/^[A-Z0-9-]+$/i.test(data.drawingNumber)) {
    warnings.push('Drawing number should contain only letters, numbers, and hyphens');
  }

  // Validate revision format
  if (data.revision && !/^[A-Z0-9]$/i.test(data.revision)) {
    warnings.push('Revision should be a single letter or number');
  }

  // Validate date format
  if (data.date && !isValidDate(data.date)) {
    errors.push('Date must be in valid format (MM/DD/YYYY or MM-DD-YYYY)');
  }

  // Validate NEC code year
  if (data.necCodeYear && !['2017', '2020', '2023'].includes(data.necCodeYear)) {
    errors.push('NEC Code Year must be 2017, 2020, or 2023');
  }

  // Check professional requirements for engineering templates
  if (template.category === 'engineering') {
    if (!data.approvedBy || data.approvedBy.trim() === '') {
      errors.push('Professional engineer approval required for engineering templates');
    }
  }

  // Check permit requirements
  if (template.category === 'permit') {
    if (!data.ahj || data.ahj.trim() === '') {
      errors.push('Authority Having Jurisdiction (AHJ) required for permit submissions');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Generate drawing numbering scheme
 */
export const generateDrawingNumber = (
  projectNumber: string,
  discipline: 'E' | 'A' | 'M' | 'P' = 'E',
  drawingType: 'SLD' | 'PLN' | 'DTL' | 'SCH' = 'SLD',
  sequenceNumber: number = 1
): string => {
  const prefix = projectNumber ? `${projectNumber}-` : '';
  const sequence = sequenceNumber.toString().padStart(3, '0');
  return `${prefix}${discipline}-${drawingType}-${sequence}`;
};

/**
 * Export title block configuration as JSON
 */
export const exportTitleBlockConfiguration = (config: TitleBlockConfiguration): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * Import title block configuration from JSON
 */
export const importTitleBlockConfiguration = (jsonString: string): TitleBlockConfiguration => {
  try {
    const config = JSON.parse(jsonString) as TitleBlockConfiguration;
    
    // Validate the imported configuration
    if (!config.template || !config.data) {
      throw new Error('Invalid title block configuration format');
    }
    
    return config;
  } catch (error) {
    throw new Error(`Failed to import title block configuration: ${error.message}`);
  }
};

/**
 * Get title block template by category
 */
export const getTemplatesByCategory = (category: 'standard' | 'professional' | 'engineering' | 'permit') => {
  return TITLE_BLOCK_TEMPLATES.filter(template => template.category === category);
};

/**
 * Create custom title block template
 */
export const createCustomTemplate = (
  name: string,
  description: string,
  baseTemplateId: string,
  customizations: Partial<TitleBlockTemplate>
): TitleBlockTemplate => {
  const baseTemplate = TITLE_BLOCK_TEMPLATES.find(t => t.id === baseTemplateId);
  if (!baseTemplate) {
    throw new Error(`Base template ${baseTemplateId} not found`);
  }

  return {
    ...baseTemplate,
    id: `custom-${Date.now()}`,
    name,
    description,
    category: 'standard',
    industryStandard: 'Custom',
    ...customizations
  };
};

// Helper function to validate date
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Generate title block preview SVG
 */
export const generateTitleBlockPreview = (
  template: TitleBlockTemplate,
  data: TitleBlockData,
  width: number = 400,
  height: number = 200
): string => {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white" stroke="black" stroke-width="2"/>
      <rect x="10" y="10" width="${width - 20}" height="30" fill="#f0f0f0" stroke="black"/>
      <text x="20" y="30" font-family="Arial" font-size="14" font-weight="bold">${data.drawingTitle || 'Drawing Title'}</text>
      <text x="20" y="60" font-family="Arial" font-size="12">Project: ${data.projectName || 'Project Name'}</text>
      <text x="20" y="80" font-family="Arial" font-size="12">Client: ${data.client || 'Client Name'}</text>
      <text x="20" y="100" font-family="Arial" font-size="12">Drawing No: ${data.drawingNumber || 'DWG-001'}</text>
      <text x="${width - 150}" y="60" font-family="Arial" font-size="12">Date: ${data.date || new Date().toLocaleDateString()}</text>
      <text x="${width - 150}" y="80" font-family="Arial" font-size="12">Rev: ${data.revision || 'A'}</text>
      <text x="${width - 150}" y="100" font-family="Arial" font-size="12">Scale: ${data.scale || 'NTS'}</text>
      <rect x="${width - 200}" y="120" width="180" height="60" fill="none" stroke="black" stroke-dasharray="5,5"/>
      <text x="${width - 110}" y="140" font-family="Arial" font-size="10" text-anchor="middle">Professional Seal</text>
      <text x="${width - 110}" y="155" font-family="Arial" font-size="10" text-anchor="middle">Area</text>
    </svg>
  `;
};

export default {
  TITLE_BLOCK_TEMPLATES,
  generateTitleBlockFromProject,
  validateTitleBlockData,
  generateDrawingNumber,
  exportTitleBlockConfiguration,
  importTitleBlockConfiguration,
  getTemplatesByCategory,
  createCustomTemplate,
  generateTitleBlockPreview
};