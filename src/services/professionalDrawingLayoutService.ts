/**
 * Professional Drawing Layout System
 * 
 * Manages multi-sheet layout with automatic sheet numbering, title blocks,
 * drawing scale management, and sheet template system for consistent formatting
 */

export interface DrawingSheet {
  id: string;
  number: number;
  name: string;
  size: PaperSize;
  orientation: 'portrait' | 'landscape';
  scale: string;
  template: SheetTemplate;
  titleBlock: TitleBlockData;
  drawingArea: DrawingArea;
  content: SheetContent[];
  revisions: RevisionEntry[];
  lastModified: Date;
}

export interface PaperSize {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  margins: Margins;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SheetTemplate {
  id: string;
  name: string;
  description: string;
  paperSize: PaperSize;
  titleBlockLayout: TitleBlockLayout;
  borderStyle: BorderStyle;
  logoPlacement?: LogoPlacement;
  standardNotes?: string[];
  revisionTable?: boolean;
  scaleBars?: boolean;
}

export interface TitleBlockData {
  projectName: string;
  projectNumber: string;
  sheetTitle: string;
  drawingNumber: string;
  revision: string;
  date: string;
  drawnBy: string;
  checkedBy: string;
  approvedBy: string;
  scale: string;
  sheetNumber: string;
  totalSheets: string;
  clientName?: string;
  contractNumber?: string;
  issueDate?: string;
  customFields?: Record<string, string>;
}

export interface TitleBlockLayout {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width: number;
  height: number;
  fields: TitleBlockField[];
}

export interface TitleBlockField {
  id: string;
  label: string;
  dataKey: keyof TitleBlockData | string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  alignment: 'left' | 'center' | 'right';
  border: boolean;
  required: boolean;
}

export interface DrawingArea {
  x: number;
  y: number;
  width: number;
  height: number;
  viewBox: ViewBox;
  gridSettings: GridSettings;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface GridSettings {
  visible: boolean;
  spacing: number; // mm
  subdivisions: number;
  color: string;
  opacity: number;
}

export interface SheetContent {
  id: string;
  type: 'sld' | 'schedule' | 'notes' | 'detail' | 'section';
  title: string;
  position: Position;
  size: Size;
  data: any;
  scale?: string;
  visible: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface RevisionEntry {
  number: string;
  date: string;
  description: string;
  by: string;
  approved: string;
}

export interface BorderStyle {
  lineWidth: number;
  color: string;
  style: 'solid' | 'dashed';
  cornerMarks: boolean;
  centerMarks: boolean;
}

export interface LogoPlacement {
  position: 'title-block' | 'top-left' | 'top-right' | 'bottom-left';
  width: number;
  height: number;
  preserveAspectRatio: boolean;
}

export interface DrawingSet {
  id: string;
  name: string;
  projectInfo: ProjectInfo;
  sheets: DrawingSheet[];
  masterTemplate: SheetTemplate;
  numbering: NumberingScheme;
  standards: DrawingStandards;
  revisionLog: RevisionLog;
}

export interface ProjectInfo {
  name: string;
  number: string;
  client: string;
  location: string;
  engineer: string;
  firm: string;
  phase: 'Preliminary' | 'Design Development' | 'Construction Documents' | 'As-Built';
  discipline: 'Electrical' | 'Mechanical' | 'Plumbing' | 'Structural';
}

export interface NumberingScheme {
  prefix: string;
  format: 'sequential' | 'discipline-based' | 'building-based';
  startNumber: number;
  leadingZeros: number;
  disciplineCode?: string;
  buildingCode?: string;
}

export interface DrawingStandards {
  textStyles: TextStyle[];
  lineStyles: LineStyle[];
  dimensionStyles: DimensionStyle[];
  layerStandards: LayerStandard[];
  symbolLibrary: string;
  plotStyles: PlotStyle[];
}

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  usage: 'title' | 'heading' | 'body' | 'dimension' | 'note';
}

export interface LineStyle {
  id: string;
  name: string;
  width: number;
  color: string;
  pattern: 'solid' | 'dashed' | 'dotted' | 'dashdot';
  usage: 'object' | 'hidden' | 'centerline' | 'cutting-plane' | 'break';
}

export interface DimensionStyle {
  id: string;
  name: string;
  textHeight: number;
  arrowSize: number;
  extensionLineOffset: number;
  dimensionLineSpacing: number;
  precision: number;
  units: 'mm' | 'inches' | 'feet';
}

export interface LayerStandard {
  id: string;
  name: string;
  color: string;
  lineType: string;
  lineWeight: number;
  plotStyle: string;
  description: string;
}

export interface PlotStyle {
  id: string;
  name: string;
  penMapping: Record<string, string>;
  lineWeights: Record<string, number>;
  colors: Record<string, string>;
}

export interface RevisionLog {
  entries: RevisionEntry[];
  currentRevision: string;
  revisionClouds: RevisionCloud[];
}

export interface RevisionCloud {
  id: string;
  revision: string;
  bounds: Bounds;
  description: string;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ProfessionalDrawingLayoutService {
  private static standardPaperSizes: Record<string, PaperSize> = {
    'A4': {
      id: 'A4',
      name: 'A4',
      width: 210,
      height: 297,
      margins: { top: 25, right: 25, bottom: 25, left: 25 }
    },
    'A3': {
      id: 'A3', 
      name: 'A3',
      width: 297,
      height: 420,
      margins: { top: 25, right: 25, bottom: 25, left: 25 }
    },
    'A2': {
      id: 'A2',
      name: 'A2', 
      width: 420,
      height: 594,
      margins: { top: 25, right: 25, bottom: 25, left: 25 }
    },
    'A1': {
      id: 'A1',
      name: 'A1',
      width: 594,
      height: 841,
      margins: { top: 25, right: 25, bottom: 25, left: 25 }
    },
    'A0': {
      id: 'A0',
      name: 'A0',
      width: 841,
      height: 1189,
      margins: { top: 25, right: 25, bottom: 25, left: 25 }
    },
    'LETTER': {
      id: 'LETTER',
      name: 'Letter',
      width: 216,
      height: 279,
      margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 }
    },
    'LEGAL': {
      id: 'LEGAL',
      name: 'Legal',
      width: 216,
      height: 356,
      margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 }
    },
    'TABLOID': {
      id: 'TABLOID',
      name: 'Tabloid',
      width: 279,
      height: 432,
      margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 }
    }
  };

  private static standardTemplates: Record<string, SheetTemplate> = {
    'electrical-standard': {
      id: 'electrical-standard',
      name: 'Electrical Standard',
      description: 'Standard electrical drawing template',
      paperSize: this.standardPaperSizes.A3,
      titleBlockLayout: {
        position: 'bottom-right',
        width: 180,
        height: 80,
        fields: [
          {
            id: 'project-name',
            label: 'PROJECT NAME',
            dataKey: 'projectName',
            x: 5, y: 5, width: 170, height: 12,
            fontSize: 10, fontWeight: 'bold',
            alignment: 'left', border: true, required: true
          },
          {
            id: 'drawing-title',
            label: 'DRAWING TITLE',
            dataKey: 'sheetTitle',
            x: 5, y: 20, width: 110, height: 12,
            fontSize: 9, fontWeight: 'normal',
            alignment: 'left', border: true, required: true
          },
          {
            id: 'drawing-number',
            label: 'DWG NO.',
            dataKey: 'drawingNumber',
            x: 120, y: 20, width: 55, height: 12,
            fontSize: 9, fontWeight: 'normal',
            alignment: 'center', border: true, required: true
          },
          {
            id: 'scale',
            label: 'SCALE',
            dataKey: 'scale',
            x: 5, y: 35, width: 40, height: 12,
            fontSize: 8, fontWeight: 'normal',
            alignment: 'center', border: true, required: false
          },
          {
            id: 'date',
            label: 'DATE',
            dataKey: 'date',
            x: 50, y: 35, width: 40, height: 12,
            fontSize: 8, fontWeight: 'normal',
            alignment: 'center', border: true, required: true
          },
          {
            id: 'drawn-by',
            label: 'DRAWN',
            dataKey: 'drawnBy',
            x: 95, y: 35, width: 40, height: 12,
            fontSize: 8, fontWeight: 'normal',
            alignment: 'center', border: true, required: true
          },
          {
            id: 'checked-by',
            label: 'CHECKED',
            dataKey: 'checkedBy',
            x: 140, y: 35, width: 35, height: 12,
            fontSize: 8, fontWeight: 'normal',
            alignment: 'center', border: true, required: false
          },
          {
            id: 'sheet-number',
            label: 'SHEET',
            dataKey: 'sheetNumber',
            x: 5, y: 50, width: 85, height: 12,
            fontSize: 8, fontWeight: 'normal',
            alignment: 'center', border: true, required: true
          },
          {
            id: 'revision',
            label: 'REV',
            dataKey: 'revision',
            x: 95, y: 50, width: 25, height: 12,
            fontSize: 8, fontWeight: 'normal',
            alignment: 'center', border: true, required: true
          }
        ]
      },
      borderStyle: {
        lineWidth: 0.7,
        color: '#000000',
        style: 'solid',
        cornerMarks: true,
        centerMarks: false
      },
      logoPlacement: {
        position: 'title-block',
        width: 40,
        height: 25,
        preserveAspectRatio: true
      },
      standardNotes: [
        'ALL WORK SHALL COMPLY WITH LATEST EDITION OF NEC',
        'VERIFY ALL DIMENSIONS IN FIELD PRIOR TO INSTALLATION',
        'CONTRACTOR SHALL COORDINATE ALL WORK WITH OTHER TRADES'
      ],
      revisionTable: true,
      scaleBars: false
    }
  };

  /**
   * Create a new drawing set with standard configuration
   */
  static createDrawingSet(
    projectInfo: ProjectInfo,
    templateId: string = 'electrical-standard'
  ): DrawingSet {
    const template = this.standardTemplates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const numbering: NumberingScheme = {
      prefix: 'E',
      format: 'sequential',
      startNumber: 1,
      leadingZeros: 2,
      disciplineCode: 'E'
    };

    return {
      id: `set_${Date.now()}`,
      name: projectInfo.name,
      projectInfo,
      sheets: [],
      masterTemplate: template,
      numbering,
      standards: this.getDefaultStandards(),
      revisionLog: {
        entries: [],
        currentRevision: '0',
        revisionClouds: []
      }
    };
  }

  /**
   * Add a new sheet to the drawing set
   */
  static addSheet(
    drawingSet: DrawingSet,
    sheetName: string,
    sheetType: 'plan' | 'schedule' | 'detail' | 'section',
    paperSize?: string,
    orientation: 'portrait' | 'landscape' = 'landscape'
  ): DrawingSheet {
    const sheetNumber = this.generateSheetNumber(drawingSet);
    const template = drawingSet.masterTemplate;
    const size = paperSize ? this.standardPaperSizes[paperSize] : template.paperSize;

    // Adjust paper size for orientation
    const actualSize = orientation === 'landscape' && size.width < size.height
      ? { ...size, width: size.height, height: size.width }
      : size;

    const sheet: DrawingSheet = {
      id: `sheet_${sheetNumber}`,
      number: parseInt(sheetNumber.replace(/\D/g, '')),
      name: sheetName,
      size: actualSize,
      orientation,
      scale: 'NTS',
      template,
      titleBlock: this.createTitleBlockData(drawingSet.projectInfo, sheetName, sheetNumber, drawingSet.sheets.length + 1),
      drawingArea: this.calculateDrawingArea(actualSize, template),
      content: [],
      revisions: [],
      lastModified: new Date()
    };

    drawingSet.sheets.push(sheet);
    this.updateSheetNumbers(drawingSet);

    return sheet;
  }

  /**
   * Add content to a specific sheet
   */
  static addContentToSheet(
    sheet: DrawingSheet,
    contentType: 'sld' | 'schedule' | 'notes' | 'detail' | 'section',
    title: string,
    position: Position,
    size: Size,
    data: any,
    scale?: string
  ): SheetContent {
    const content: SheetContent = {
      id: `content_${Date.now()}`,
      type: contentType,
      title,
      position,
      size,
      data,
      scale,
      visible: true
    };

    sheet.content.push(content);
    sheet.lastModified = new Date();

    return content;
  }

  /**
   * Auto-layout content on sheet based on content type and size
   */
  static autoLayoutSheet(sheet: DrawingSheet): void {
    const drawingArea = sheet.drawingArea;
    const margin = 10; // mm
    const spacing = 15; // mm between content blocks

    let currentY = drawingArea.y + margin;
    let maxHeight = 0;
    let currentRowWidth = 0;
    const availableWidth = drawingArea.width - (2 * margin);

    sheet.content.forEach((content, index) => {
      // Check if content fits in current row
      if (currentRowWidth + content.size.width + spacing > availableWidth && currentRowWidth > 0) {
        // Move to next row
        currentY += maxHeight + spacing;
        currentRowWidth = 0;
        maxHeight = 0;
      }

      // Position content
      content.position = {
        x: drawingArea.x + margin + currentRowWidth,
        y: currentY
      };

      currentRowWidth += content.size.width + spacing;
      maxHeight = Math.max(maxHeight, content.size.height);
    });

    sheet.lastModified = new Date();
  }

  /**
   * Generate automatic sheet numbering
   */
  private static generateSheetNumber(drawingSet: DrawingSet): string {
    const numbering = drawingSet.numbering;
    const nextNumber = drawingSet.sheets.length + numbering.startNumber;
    
    switch (numbering.format) {
      case 'discipline-based':
        return `${numbering.disciplineCode}${nextNumber.toString().padStart(numbering.leadingZeros, '0')}`;
      case 'building-based':
        return `${numbering.buildingCode}-${numbering.disciplineCode}${nextNumber.toString().padStart(numbering.leadingZeros, '0')}`;
      default:
        return `${numbering.prefix}${nextNumber.toString().padStart(numbering.leadingZeros, '0')}`;
    }
  }

  /**
   * Update sheet numbers when sheets are reordered
   */
  private static updateSheetNumbers(drawingSet: DrawingSet): void {
    drawingSet.sheets.forEach((sheet, index) => {
      const totalSheets = drawingSet.sheets.length;
      sheet.titleBlock.sheetNumber = `${index + 1}`;
      sheet.titleBlock.totalSheets = totalSheets.toString();
    });
  }

  /**
   * Create title block data from project info
   */
  private static createTitleBlockData(
    projectInfo: ProjectInfo,
    sheetTitle: string,
    drawingNumber: string,
    sheetNumber: number
  ): TitleBlockData {
    return {
      projectName: projectInfo.name,
      projectNumber: projectInfo.number,
      sheetTitle,
      drawingNumber,
      revision: '0',
      date: new Date().toLocaleDateString(),
      drawnBy: projectInfo.engineer,
      checkedBy: '',
      approvedBy: '',
      scale: 'NTS',
      sheetNumber: sheetNumber.toString(),
      totalSheets: '1',
      clientName: projectInfo.client
    };
  }

  /**
   * Calculate drawing area within sheet margins and title block
   */
  private static calculateDrawingArea(paperSize: PaperSize, template: SheetTemplate): DrawingArea {
    const margins = paperSize.margins;
    const titleBlock = template.titleBlockLayout;
    
    let availableWidth = paperSize.width - margins.left - margins.right;
    let availableHeight = paperSize.height - margins.top - margins.bottom;
    
    // Subtract title block area
    if (titleBlock.position.includes('bottom')) {
      availableHeight -= titleBlock.height;
    }
    if (titleBlock.position.includes('right')) {
      availableWidth -= titleBlock.width;
    }

    return {
      x: margins.left,
      y: margins.top,
      width: availableWidth,
      height: availableHeight,
      viewBox: {
        x: 0,
        y: 0,
        width: availableWidth,
        height: availableHeight,
        scale: 1
      },
      gridSettings: {
        visible: true,
        spacing: 5,
        subdivisions: 5,
        color: '#E5E7EB',
        opacity: 0.5
      }
    };
  }

  /**
   * Get default drawing standards
   */
  private static getDefaultStandards(): DrawingStandards {
    return {
      textStyles: [
        {
          id: 'title',
          name: 'Title Text',
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#000000',
          usage: 'title'
        },
        {
          id: 'heading',
          name: 'Heading Text',
          fontFamily: 'Arial',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#000000',
          usage: 'heading'
        },
        {
          id: 'body',
          name: 'Body Text',
          fontFamily: 'Arial',
          fontSize: 8,
          fontWeight: 'normal',
          color: '#000000',
          usage: 'body'
        }
      ],
      lineStyles: [
        {
          id: 'object',
          name: 'Object Lines',
          width: 0.5,
          color: '#000000',
          pattern: 'solid',
          usage: 'object'
        },
        {
          id: 'hidden',
          name: 'Hidden Lines',
          width: 0.3,
          color: '#666666',
          pattern: 'dashed',
          usage: 'hidden'
        }
      ],
      dimensionStyles: [
        {
          id: 'standard',
          name: 'Standard Dimensions',
          textHeight: 2.5,
          arrowSize: 2,
          extensionLineOffset: 1,
          dimensionLineSpacing: 7,
          precision: 1,
          units: 'mm'
        }
      ],
      layerStandards: [
        {
          id: 'E-POWER',
          name: 'Power Distribution',
          color: '#FF0000',
          lineType: 'solid',
          lineWeight: 0.5,
          plotStyle: 'standard',
          description: 'Power distribution equipment and wiring'
        },
        {
          id: 'E-LITE',
          name: 'Lighting',
          color: '#00FF00',
          lineType: 'solid',
          lineWeight: 0.3,
          plotStyle: 'standard',
          description: 'Lighting fixtures and controls'
        }
      ],
      symbolLibrary: 'IEEE-315',
      plotStyles: [
        {
          id: 'standard',
          name: 'Standard Plot',
          penMapping: {},
          lineWeights: {},
          colors: {}
        }
      ]
    };
  }

  /**
   * Add revision to drawing set
   */
  static addRevision(
    drawingSet: DrawingSet,
    description: string,
    by: string,
    approved: string,
    affectedSheets?: string[]
  ): void {
    const revisionNumber = this.getNextRevisionNumber(drawingSet.revisionLog.currentRevision);
    const revision: RevisionEntry = {
      number: revisionNumber,
      date: new Date().toLocaleDateString(),
      description,
      by,
      approved
    };

    drawingSet.revisionLog.entries.push(revision);
    drawingSet.revisionLog.currentRevision = revisionNumber;

    // Update affected sheets
    const sheetsToUpdate = affectedSheets || drawingSet.sheets.map(s => s.id);
    sheetsToUpdate.forEach(sheetId => {
      const sheet = drawingSet.sheets.find(s => s.id === sheetId);
      if (sheet) {
        sheet.titleBlock.revision = revisionNumber;
        sheet.revisions.push(revision);
        sheet.lastModified = new Date();
      }
    });
  }

  /**
   * Get next revision number (A, B, C, ... AA, AB, etc.)
   */
  private static getNextRevisionNumber(currentRevision: string): string {
    if (currentRevision === '0') return 'A';
    
    // Convert revision to number, increment, then back to letters
    let num = 0;
    for (let i = 0; i < currentRevision.length; i++) {
      num = num * 26 + (currentRevision.charCodeAt(i) - 64);
    }
    num++;
    
    let result = '';
    while (num > 0) {
      result = String.fromCharCode(64 + (num % 26 || 26)) + result;
      num = Math.floor((num - 1) / 26);
    }
    
    return result;
  }

  /**
   * Export drawing set layout information
   */
  static exportLayoutData(drawingSet: DrawingSet): string {
    const layoutData = {
      projectInfo: drawingSet.projectInfo,
      sheets: drawingSet.sheets.map(sheet => ({
        number: sheet.number,
        name: sheet.name,
        size: sheet.size.name,
        orientation: sheet.orientation,
        scale: sheet.scale,
        contentCount: sheet.content.length,
        lastModified: sheet.lastModified
      })),
      standards: drawingSet.standards,
      totalSheets: drawingSet.sheets.length,
      currentRevision: drawingSet.revisionLog.currentRevision
    };

    return JSON.stringify(layoutData, null, 2);
  }
}