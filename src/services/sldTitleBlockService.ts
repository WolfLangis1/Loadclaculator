/**
 * Professional Title Blocks and Sheet Management Service
 * 
 * Provides industry-standard drawing documentation including:
 * - Professional title blocks with project information
 * - Multi-sheet drawing management
 * - Revision tracking and control
 * - Drawing standards compliance (IEEE, ANSI)
 * - Automatic sheet numbering and indexing
 * - Cross-reference management
 * - Drawing approval workflows
 */

export interface ProjectInformation {
  // Basic project data
  projectName: string;
  projectNumber: string;
  clientName: string;
  clientAddress: string;
  
  // Location data
  siteName: string;
  siteAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Engineering data
  engineerName: string;
  engineerLicense: string;
  engineerStamp?: string; // Base64 encoded stamp image
  designFirm: string;
  designFirmAddress: string;
  
  // Contractor data
  contractorName: string;
  contractorLicense: string;
  contractorAddress: string;
  
  // Project details
  projectDescription: string;
  buildingType: string;
  occupancyType: string;
  voltageSystem: string;
  serviceSize: number;
  
  // Code references
  necEdition: '2017' | '2020' | '2023';
  localCodes: string[];
  ahj: string; // Authority Having Jurisdiction
}

export interface RevisionRecord {
  number: number;
  letter: string;
  date: Date;
  description: string;
  issuedBy: string;
  checkedBy: string;
  approvedBy: string;
  cloud?: string; // Revision cloud ID for visual marking
  status: 'draft' | 'issued' | 'superseded';
}

export interface DrawingSheet {
  id: string;
  number: string; // E1, E2, E3, etc.
  title: string;
  subtitle?: string;
  scale: string;
  size: 'A' | 'B' | 'C' | 'D' | 'E' | 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
  orientation: 'portrait' | 'landscape';
  
  // Content areas
  drawingArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  titleBlockArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Sheet content
  components: string[]; // Component IDs on this sheet
  details: DrawingDetail[];
  notes: DrawingNote[];
  symbols: DrawingSymbol[];
  
  // References
  parentSheet?: string; // For detail sheets
  detailSheets: string[]; // Child detail sheets
  crossReferences: CrossReference[];
  
  // Status
  status: 'draft' | 'in_review' | 'approved' | 'issued' | 'superseded';
  revisions: RevisionRecord[];
  currentRevision: number;
  
  // Metadata
  createdDate: Date;
  modifiedDate: Date;
  createdBy: string;
  checkedBy?: string;
  approvedBy?: string;
}

export interface DrawingDetail {
  id: string;
  title: string;
  scale: string;
  referenceNumber: string; // Detail bubble number
  location: { x: number; y: number };
  size: { width: number; height: number };
  sourceSheet?: string; // Sheet this detail is referenced from
}

export interface DrawingNote {
  id: string;
  number: number;
  text: string;
  location: { x: number; y: number };
  leader?: { x: number; y: number }[]; // Leader line points
  category: 'general' | 'electrical' | 'safety' | 'installation' | 'code';
}

export interface DrawingSymbol {
  id: string;
  type: 'north_arrow' | 'scale_indicator' | 'match_line' | 'section_cut' | 'elevation_mark';
  location: { x: number; y: number };
  rotation: number;
  properties: Record<string, any>;
}

export interface CrossReference {
  id: string;
  type: 'detail' | 'section' | 'elevation' | 'schedule' | 'note';
  sourceLocation: { x: number; y: number };
  targetSheet: string;
  targetLocation?: { x: number; y: number };
  label: string;
}

export interface TitleBlockTemplate {
  id: string;
  name: string;
  description: string;
  standard: 'IEEE' | 'ANSI' | 'ISO' | 'Custom';
  size: DrawingSheet['size'];
  
  // Layout definition
  layout: TitleBlockLayout;
  
  // Field definitions
  fields: TitleBlockField[];
  
  // Styling
  borderStyle: {
    lineWidth: number;
    color: string;
    cornerRadius: number;
  };
  
  textStyle: {
    fontFamily: string;
    fontSize: number;
    color: string;
    weight: 'normal' | 'bold';
  };
  
  // Compliance
  compliance: string[];
  version: string;
}

export interface TitleBlockLayout {
  // Main title block dimensions
  width: number;
  height: number;
  position: { x: number; y: number };
  
  // Internal zones
  projectZone: { x: number; y: number; width: number; height: number };
  drawingZone: { x: number; y: number; width: number; height: number };
  revisionZone: { x: number; y: number; width: number; height: number };
  approvalZone: { x: number; y: number; width: number; height: number };
  logoZone?: { x: number; y: number; width: number; height: number };
}

export interface TitleBlockField {
  id: string;
  label: string;
  dataKey: string; // Key in project data or sheet data
  required: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  textAlign: 'left' | 'center' | 'right';
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  maxLength?: number;
  format?: 'text' | 'date' | 'number' | 'uppercase';
}

export interface SheetIndex {
  sheets: Array<{
    number: string;
    title: string;
    status: string;
    revision: string;
    lastModified: Date;
  }>;
  totalSheets: number;
  lastUpdated: Date;
}

export class SLDTitleBlockService {
  private project: ProjectInformation;
  private sheets: Map<string, DrawingSheet> = new Map();
  private templates: Map<string, TitleBlockTemplate> = new Map();
  private currentSheetId: string | null = null;
  private sheetCounter: number = 1;

  constructor() {
    this.project = this.createDefaultProject();
    this.initializeStandardTemplates();
  }

  /**
   * Create default project information
   */
  private createDefaultProject(): ProjectInformation {
    return {
      projectName: '',
      projectNumber: '',
      clientName: '',
      clientAddress: '',
      siteName: '',
      siteAddress: '',
      city: '',
      state: '',
      zipCode: '',
      engineerName: '',
      engineerLicense: '',
      designFirm: '',
      designFirmAddress: '',
      contractorName: '',
      contractorLicense: '',
      contractorAddress: '',
      projectDescription: '',
      buildingType: '',
      occupancyType: '',
      voltageSystem: '120/240V 1Ø',
      serviceSize: 200,
      necEdition: '2023',
      localCodes: [],
      ahj: ''
    };
  }

  /**
   * Initialize standard title block templates
   */
  private initializeStandardTemplates(): void {
    // IEEE Standard Title Block (D-size)
    const ieeeTemplate: TitleBlockTemplate = {
      id: 'ieee_d_landscape',
      name: 'IEEE Standard D-Size Landscape',
      description: 'IEEE Std 315 compliant title block for electrical drawings',
      standard: 'IEEE',
      size: 'D',
      layout: {
        width: 400,
        height: 120,
        position: { x: 2800, y: 1680 }, // Bottom right for D-size (34"x22")
        projectZone: { x: 0, y: 60, width: 240, height: 60 },
        drawingZone: { x: 240, y: 60, width: 160, height: 60 },
        revisionZone: { x: 320, y: 0, width: 80, height: 120 },
        approvalZone: { x: 0, y: 0, width: 320, height: 60 },
        logoZone: { x: 240, y: 80, width: 80, height: 40 }
      },
      fields: [
        {
          id: 'project_name',
          label: 'Project Name',
          dataKey: 'projectName',
          required: true,
          position: { x: 10, y: 75 },
          size: { width: 220, height: 12 },
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 'bold',
          format: 'text'
        },
        {
          id: 'project_number',
          label: 'Project No.',
          dataKey: 'projectNumber',
          required: true,
          position: { x: 10, y: 90 },
          size: { width: 100, height: 10 },
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 'normal',
          format: 'text'
        },
        {
          id: 'drawing_title',
          label: 'Drawing Title',
          dataKey: 'title',
          required: true,
          position: { x: 250, y: 75 },
          size: { width: 150, height: 12 },
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 'bold',
          format: 'text'
        },
        {
          id: 'sheet_number',
          label: 'Sheet',
          dataKey: 'number',
          required: true,
          position: { x: 250, y: 90 },
          size: { width: 50, height: 10 },
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 'normal',
          format: 'text'
        },
        {
          id: 'scale',
          label: 'Scale',
          dataKey: 'scale',
          required: true,
          position: { x: 310, y: 90 },
          size: { width: 80, height: 10 },
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 'normal',
          format: 'text'
        },
        {
          id: 'engineer_name',
          label: 'Engineer',
          dataKey: 'engineerName',
          required: true,
          position: { x: 10, y: 25 },
          size: { width: 100, height: 10 },
          textAlign: 'left',
          fontSize: 10,
          fontWeight: 'normal',
          format: 'text'
        },
        {
          id: 'date',
          label: 'Date',
          dataKey: 'modifiedDate',
          required: true,
          position: { x: 120, y: 25 },
          size: { width: 80, height: 10 },
          textAlign: 'left',
          fontSize: 10,
          fontWeight: 'normal',
          format: 'date'
        },
        {
          id: 'revision',
          label: 'Rev',
          dataKey: 'currentRevision',
          required: true,
          position: { x: 330, y: 25 },
          size: { width: 20, height: 10 },
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 'bold',
          format: 'text'
        }
      ],
      borderStyle: {
        lineWidth: 2,
        color: '#000000',
        cornerRadius: 0
      },
      textStyle: {
        fontFamily: 'Arial',
        fontSize: 10,
        color: '#000000',
        weight: 'normal'
      },
      compliance: ['IEEE Std 315', 'ANSI Y32.2'],
      version: '1.0'
    };

    // ANSI Standard Title Block (C-size)
    const ansiTemplate: TitleBlockTemplate = {
      id: 'ansi_c_landscape',
      name: 'ANSI Standard C-Size Landscape',
      description: 'ANSI compliant title block for general electrical drawings',
      standard: 'ANSI',
      size: 'C',
      layout: {
        width: 350,
        height: 100,
        position: { x: 2200, y: 1400 }, // Bottom right for C-size (22"x17")
        projectZone: { x: 0, y: 50, width: 200, height: 50 },
        drawingZone: { x: 200, y: 50, width: 150, height: 50 },
        revisionZone: { x: 280, y: 0, width: 70, height: 100 },
        approvalZone: { x: 0, y: 0, width: 280, height: 50 }
      },
      fields: [
        {
          id: 'company_name',
          label: 'Company',
          dataKey: 'designFirm',
          required: true,
          position: { x: 10, y: 65 },
          size: { width: 180, height: 12 },
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 'bold',
          format: 'text'
        },
        {
          id: 'project_title',
          label: 'Project',
          dataKey: 'projectName',
          required: true,
          position: { x: 10, y: 80 },
          size: { width: 180, height: 10 },
          textAlign: 'left',
          fontSize: 11,
          fontWeight: 'normal',
          format: 'text'
        },
        {
          id: 'drawing_number',
          label: 'Drawing No.',
          dataKey: 'number',
          required: true,
          position: { x: 210, y: 65 },
          size: { width: 60, height: 10 },
          textAlign: 'left',
          fontSize: 11,
          fontWeight: 'normal',
          format: 'text'
        },
        {
          id: 'sheet_title',
          label: 'Title',
          dataKey: 'title',
          required: true,
          position: { x: 210, y: 80 },
          size: { width: 130, height: 10 },
          textAlign: 'left',
          fontSize: 11,
          fontWeight: 'normal',
          format: 'text'
        }
      ],
      borderStyle: {
        lineWidth: 1.5,
        color: '#000000',
        cornerRadius: 0
      },
      textStyle: {
        fontFamily: 'Arial',
        fontSize: 9,
        color: '#000000',
        weight: 'normal'
      },
      compliance: ['ANSI Y14.1'],
      version: '1.0'
    };

    this.templates.set(ieeeTemplate.id, ieeeTemplate);
    this.templates.set(ansiTemplate.id, ansiTemplate);
  }

  /**
   * Create new drawing sheet
   */
  createSheet(options: {
    title: string;
    subtitle?: string;
    size?: DrawingSheet['size'];
    orientation?: DrawingSheet['orientation'];
    templateId?: string;
    scale?: string;
  }): string {
    const sheetId = `sheet_${this.sheetCounter.toString().padStart(2, '0')}`;
    const sheetNumber = `E${this.sheetCounter}`;
    
    const template = this.templates.get(options.templateId || 'ieee_d_landscape');
    const sheetSize = options.size || template?.size || 'D';
    const orientation = options.orientation || 'landscape';
    
    // Calculate drawing area based on sheet size and title block
    const sheetDimensions = this.getSheetDimensions(sheetSize, orientation);
    const titleBlockHeight = template?.layout.height || 120;
    
    const sheet: DrawingSheet = {
      id: sheetId,
      number: sheetNumber,
      title: options.title,
      subtitle: options.subtitle,
      scale: options.scale || '1/4" = 1\'-0"',
      size: sheetSize,
      orientation,
      
      drawingArea: {
        x: 50, // Border margin
        y: 50,
        width: sheetDimensions.width - 100 - (template?.layout.width || 400),
        height: sheetDimensions.height - 100 - titleBlockHeight
      },
      
      titleBlockArea: {
        x: sheetDimensions.width - (template?.layout.width || 400) - 50,
        y: sheetDimensions.height - titleBlockHeight - 50,
        width: template?.layout.width || 400,
        height: titleBlockHeight
      },
      
      components: [],
      details: [],
      notes: [],
      symbols: [],
      
      detailSheets: [],
      crossReferences: [],
      
      status: 'draft',
      revisions: [],
      currentRevision: 0,
      
      createdDate: new Date(),
      modifiedDate: new Date(),
      createdBy: this.project.engineerName || 'Unknown'
    };

    this.sheets.set(sheetId, sheet);
    this.sheetCounter++;
    
    return sheetId;
  }

  /**
   * Get sheet dimensions in pixels (assuming 100 DPI)
   */
  private getSheetDimensions(size: DrawingSheet['size'], orientation: 'portrait' | 'landscape'): { width: number; height: number } {
    const dimensions: Record<DrawingSheet['size'], { width: number; height: number }> = {
      'A': { width: 1100, height: 850 },   // 11" x 8.5"
      'B': { width: 1700, height: 1100 },  // 17" x 11"
      'C': { width: 2200, height: 1700 },  // 22" x 17"
      'D': { width: 3400, height: 2200 },  // 34" x 22"
      'E': { width: 4400, height: 3400 },  // 44" x 34"
      'A4': { width: 842, height: 595 },   // 210mm x 297mm
      'A3': { width: 1191, height: 842 },  // 297mm x 420mm
      'A2': { width: 1684, height: 1191 }, // 420mm x 594mm
      'A1': { width: 2384, height: 1684 }, // 594mm x 841mm
      'A0': { width: 3370, height: 2384 }  // 841mm x 1189mm
    };

    const baseDimensions = dimensions[size];
    
    if (orientation === 'portrait') {
      return {
        width: Math.min(baseDimensions.width, baseDimensions.height),
        height: Math.max(baseDimensions.width, baseDimensions.height)
      };
    } else {
      return {
        width: Math.max(baseDimensions.width, baseDimensions.height),
        height: Math.min(baseDimensions.width, baseDimensions.height)
      };
    }
  }

  /**
   * Update project information
   */
  updateProjectInformation(updates: Partial<ProjectInformation>): void {
    this.project = { ...this.project, ...updates };
    
    // Update all sheets with new project data
    this.sheets.forEach(sheet => {
      sheet.modifiedDate = new Date();
    });
  }

  /**
   * Add revision to sheet
   */
  addRevision(sheetId: string, revision: Omit<RevisionRecord, 'number' | 'status'>): boolean {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return false;

    const revisionNumber = sheet.revisions.length + 1;
    const revisionLetter = String.fromCharCode(64 + revisionNumber); // A, B, C, etc.

    // Mark previous revisions as superseded
    sheet.revisions.forEach(rev => {
      if (rev.status === 'issued') {
        rev.status = 'superseded';
      }
    });

    const newRevision: RevisionRecord = {
      number: revisionNumber,
      letter: revisionLetter,
      ...revision,
      status: 'draft'
    };

    sheet.revisions.push(newRevision);
    sheet.currentRevision = revisionNumber;
    sheet.modifiedDate = new Date();

    return true;
  }

  /**
   * Issue revision (change status from draft to issued)
   */
  issueRevision(sheetId: string, revisionNumber: number): boolean {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return false;

    const revision = sheet.revisions.find(r => r.number === revisionNumber);
    if (!revision) return false;

    revision.status = 'issued';
    return true;
  }

  /**
   * Add drawing note
   */
  addNote(sheetId: string, note: Omit<DrawingNote, 'id' | 'number'>): string | null {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return null;

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const noteNumber = sheet.notes.length + 1;

    const drawingNote: DrawingNote = {
      id: noteId,
      number: noteNumber,
      ...note
    };

    sheet.notes.push(drawingNote);
    sheet.modifiedDate = new Date();

    return noteId;
  }

  /**
   * Add drawing detail
   */
  addDetail(sheetId: string, detail: Omit<DrawingDetail, 'id'>): string | null {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return null;

    const detailId = `detail_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const drawingDetail: DrawingDetail = {
      id: detailId,
      ...detail
    };

    sheet.details.push(drawingDetail);
    sheet.modifiedDate = new Date();

    return detailId;
  }

  /**
   * Add cross reference
   */
  addCrossReference(sheetId: string, crossRef: Omit<CrossReference, 'id'>): string | null {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return null;

    const crossRefId = `xref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const crossReference: CrossReference = {
      id: crossRefId,
      ...crossRef
    };

    sheet.crossReferences.push(crossReference);
    sheet.modifiedDate = new Date();

    return crossRefId;
  }

  /**
   * Generate sheet index
   */
  generateSheetIndex(): SheetIndex {
    const sheetList = Array.from(this.sheets.values())
      .sort((a, b) => a.number.localeCompare(b.number))
      .map(sheet => ({
        number: sheet.number,
        title: sheet.title,
        status: sheet.status,
        revision: sheet.currentRevision > 0 ? 
          sheet.revisions.find(r => r.number === sheet.currentRevision)?.letter || '0' : '0',
        lastModified: sheet.modifiedDate
      }));

    return {
      sheets: sheetList,
      totalSheets: this.sheets.size,
      lastUpdated: new Date()
    };
  }

  /**
   * Get sheet by ID
   */
  getSheet(sheetId: string): DrawingSheet | null {
    return this.sheets.get(sheetId) || null;
  }

  /**
   * Get all sheets
   */
  getAllSheets(): DrawingSheet[] {
    return Array.from(this.sheets.values())
      .sort((a, b) => a.number.localeCompare(b.number));
  }

  /**
   * Get sheets by status
   */
  getSheetsByStatus(status: DrawingSheet['status']): DrawingSheet[] {
    return Array.from(this.sheets.values())
      .filter(sheet => sheet.status === status)
      .sort((a, b) => a.number.localeCompare(b.number));
  }

  /**
   * Update sheet status
   */
  updateSheetStatus(sheetId: string, status: DrawingSheet['status']): boolean {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return false;

    sheet.status = status;
    sheet.modifiedDate = new Date();
    
    return true;
  }

  /**
   * Delete sheet
   */
  deleteSheet(sheetId: string): boolean {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return false;

    // Remove cross-references to this sheet
    this.sheets.forEach(otherSheet => {
      otherSheet.crossReferences = otherSheet.crossReferences.filter(
        xref => xref.targetSheet !== sheet.number
      );
      otherSheet.detailSheets = otherSheet.detailSheets.filter(
        detailId => detailId !== sheetId
      );
    });

    return this.sheets.delete(sheetId);
  }

  /**
   * Get available templates
   */
  getTemplates(): TitleBlockTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): TitleBlockTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Create custom template
   */
  createCustomTemplate(template: Omit<TitleBlockTemplate, 'id'>): string {
    const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const customTemplate: TitleBlockTemplate = {
      id: templateId,
      ...template
    };

    this.templates.set(templateId, customTemplate);
    return templateId;
  }

  /**
   * Export title block data for rendering
   */
  exportTitleBlockData(sheetId: string): {
    template: TitleBlockTemplate;
    project: ProjectInformation;
    sheet: DrawingSheet;
    fieldValues: Record<string, any>;
  } | null {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return null;

    // Find template (default to first available)
    const template = Array.from(this.templates.values())[0];
    
    // Combine project and sheet data for field population
    const fieldValues: Record<string, any> = {
      ...this.project,
      ...sheet,
      modifiedDate: sheet.modifiedDate.toLocaleDateString(),
      createdDate: sheet.createdDate.toLocaleDateString(),
      currentRevision: sheet.currentRevision > 0 ? 
        sheet.revisions.find(r => r.number === sheet.currentRevision)?.letter || '0' : '0'
    };

    return {
      template,
      project: this.project,
      sheet,
      fieldValues
    };
  }

  /**
   * Set current sheet
   */
  setCurrentSheet(sheetId: string): boolean {
    if (this.sheets.has(sheetId)) {
      this.currentSheetId = sheetId;
      return true;
    }
    return false;
  }

  /**
   * Get current sheet
   */
  getCurrentSheet(): DrawingSheet | null {
    return this.currentSheetId ? this.sheets.get(this.currentSheetId) || null : null;
  }

  /**
   * Get project information
   */
  getProjectInformation(): ProjectInformation {
    return { ...this.project };
  }

  /**
   * Export all drawing data
   */
  exportDrawingSet(): {
    project: ProjectInformation;
    sheets: DrawingSheet[];
    templates: TitleBlockTemplate[];
    index: SheetIndex;
  } {
    return {
      project: this.getProjectInformation(),
      sheets: this.getAllSheets(),
      templates: this.getTemplates(),
      index: this.generateSheetIndex()
    };
  }

  /**
   * Import drawing set
   */
  importDrawingSet(data: {
    project?: ProjectInformation;
    sheets?: DrawingSheet[];
    templates?: TitleBlockTemplate[];
  }): void {
    if (data.project) {
      this.project = data.project;
    }

    if (data.sheets) {
      this.sheets.clear();
      data.sheets.forEach(sheet => {
        this.sheets.set(sheet.id, sheet);
      });
      
      // Update sheet counter
      const maxSheetNum = Math.max(...data.sheets.map(s => {
        const match = s.number.match(/E(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }));
      this.sheetCounter = maxSheetNum + 1;
    }

    if (data.templates) {
      data.templates.forEach(template => {
        this.templates.set(template.id, template);
      });
    }
  }

  /**
   * Generate drawing transmittal
   */
  generateTransmittal(sheetIds: string[], purpose: string, recipient: string): {
    transmittalNumber: string;
    date: Date;
    project: ProjectInformation;
    sheets: Array<{
      number: string;
      title: string;
      revision: string;
      status: string;
    }>;
    purpose: string;
    recipient: string;
    totalSheets: number;
  } {
    const transmittalNumber = `T${Date.now().toString().slice(-6)}`;
    const sheets = sheetIds
      .map(id => this.sheets.get(id))
      .filter(sheet => sheet !== undefined)
      .map(sheet => ({
        number: sheet!.number,
        title: sheet!.title,
        revision: sheet!.currentRevision > 0 ? 
          sheet!.revisions.find(r => r.number === sheet!.currentRevision)?.letter || '0' : '0',
        status: sheet!.status
      }));

    return {
      transmittalNumber,
      date: new Date(),
      project: this.project,
      sheets,
      purpose,
      recipient,
      totalSheets: sheets.length
    };
  }
}

export default SLDTitleBlockService;