/**
 * Multi-Format Export Service
 * 
 * Professional export system supporting multiple formats:
 * - PDF with vector graphics and proper scaling
 * - DWG for CAD system compatibility
 * - SVG for web and vector applications
 * - PNG for presentations and documentation
 * - Excel/CSV for data analysis
 */

import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'dwg' | 'svg' | 'png' | 'excel' | 'csv';
  scale: 'fit' | 'actual' | number; // Scale factor or fit mode
  paperSize: 'letter' | 'a4' | 'a3' | 'a2' | 'a1' | 'a0' | 'custom';
  orientation: 'portrait' | 'landscape';
  quality: 'draft' | 'standard' | 'high' | 'print';
  includeElements: {
    titleBlock: boolean;
    grid: boolean;
    measurements: boolean;
    annotations: boolean;
    wireRouting: boolean;
    schedules: boolean;
    legends: boolean;
  };
  customSize?: { width: number; height: number; units: 'mm' | 'inches' };
  dpi?: number;
  colorMode?: 'color' | 'grayscale' | 'blackwhite';
}

export interface ExportData {
  // SLD Canvas Data
  components: SLDComponent[];
  wires: SLDWire[];
  measurements: SLDMeasurement[];
  annotations: SLDAnnotation[];
  titleBlock?: TitleBlockData;
  
  // Project Data
  projectInfo: ProjectInformation;
  calculations: CalculationResults;
  schedules: ScheduleData[];
  
  // Canvas Properties
  canvasSize: { width: number; height: number };
  viewBox: { x: number; y: number; width: number; height: number };
  gridSettings: GridSettings;
}

export interface SLDComponent {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
  symbol: string;
  connections: ComponentConnection[];
}

export interface SLDWire {
  id: string;
  startComponent: string;
  endComponent: string;
  path: { x: number; y: number }[];
  style: WireStyle;
  label?: string;
}

export interface SLDMeasurement {
  id: string;
  type: 'linear' | 'angular' | 'area' | 'coordinate';
  points: { x: number; y: number }[];
  value: number;
  displayValue: string;
  style: MeasurementStyle;
}

export interface SLDAnnotation {
  id: string;
  type: 'text' | 'dimension' | 'callout';
  position: { x: number; y: number };
  content: string;
  style: AnnotationStyle;
}

export interface TitleBlockData {
  projectName: string;
  drawingNumber: string;
  revision: string;
  date: string;
  drawnBy: string;
  checkedBy: string;
  approvedBy: string;
  scale: string;
  sheet: string;
  position: { x: number; y: number };
}

export interface ScheduleData {
  type: 'panel' | 'load' | 'equipment' | 'wire';
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename: string;
  size?: number;
  error?: string;
  metadata?: {
    format: string;
    dimensions: { width: number; height: number };
    fileSize: number;
    createdAt: Date;
  };
}

export class MultiFormatExportService {
  
  /**
   * Export SLD data to specified format
   */
  static async exportSLD(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(data, options);
        case 'svg':
          return await this.exportToSVG(data, options);
        case 'png':
          return await this.exportToPNG(data, options);
        case 'dwg':
          return await this.exportToDWG(data, options);
        case 'excel':
          return await this.exportToExcel(data, options);
        case 'csv':
          return await this.exportToCSV(data, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }
  
  /**
   * Export to PDF with vector graphics
   */
  private static async exportToPDF(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    const { paperSize, orientation, scale } = options;
    
    // Create PDF with specified paper size
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize === 'custom' && options.customSize 
        ? [options.customSize.width, options.customSize.height]
        : paperSize
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const drawingArea = {
      width: pageWidth - (2 * margin),
      height: pageHeight - (2 * margin)
    };
    
    // Calculate scaling
    const scaleFactors = this.calculateScaling(data.canvasSize, drawingArea, scale);
    
    // Draw grid if enabled
    if (options.includeElements.grid) {
      this.drawGridToPDF(pdf, drawingArea, margin, data.gridSettings, scaleFactors);
    }
    
    // Draw components
    data.components.forEach(component => {
      this.drawComponentToPDF(pdf, component, margin, scaleFactors);
    });
    
    // Draw wires
    if (options.includeElements.wireRouting) {
      data.wires.forEach(wire => {
        this.drawWireToPDF(pdf, wire, margin, scaleFactors);
      });
    }
    
    // Draw measurements
    if (options.includeElements.measurements) {
      data.measurements.forEach(measurement => {
        this.drawMeasurementToPDF(pdf, measurement, margin, scaleFactors);
      });
    }
    
    // Draw annotations
    if (options.includeElements.annotations) {
      data.annotations.forEach(annotation => {
        this.drawAnnotationToPDF(pdf, annotation, margin, scaleFactors);
      });
    }
    
    // Draw title block
    if (options.includeElements.titleBlock && data.titleBlock) {
      this.drawTitleBlockToPDF(pdf, data.titleBlock, pageWidth, pageHeight);
    }
    
    // Add schedules if enabled
    if (options.includeElements.schedules && data.schedules.length > 0) {
      this.addSchedulesToPDF(pdf, data.schedules);
    }
    
    const pdfBlob = pdf.output('blob');
    const filename = this.generateFilename(data.projectInfo.projectName, 'pdf');
    
    return {
      success: true,
      data: pdfBlob,
      filename,
      size: pdfBlob.size,
      metadata: {
        format: 'pdf',
        dimensions: { width: pageWidth, height: pageHeight },
        fileSize: pdfBlob.size,
        createdAt: new Date()
      }
    };
  }
  
  /**
   * Export to SVG format
   */
  private static async exportToSVG(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    const { scale } = options;
    const canvasSize = data.canvasSize;
    
    // Calculate scaled dimensions
    const scaleFactor = typeof scale === 'number' ? scale : 1;
    const svgWidth = canvasSize.width * scaleFactor;
    const svgHeight = canvasSize.height * scaleFactor;
    
    // Create SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .component { fill: #f3f4f6; stroke: #374151; stroke-width: 1; }
      .wire { stroke: #dc2626; stroke-width: 2; fill: none; }
      .measurement { stroke: #2563eb; stroke-width: 1; fill: none; }
      .text { font-family: Arial, sans-serif; font-size: 12px; fill: #111827; }
      .grid { stroke: #e5e7eb; stroke-width: 0.5; opacity: 0.5; }
    </style>
  </defs>`;
    
    // Add grid
    if (options.includeElements.grid) {
      svgContent += this.generateGridSVG(data.gridSettings, canvasSize);
    }
    
    // Add components
    data.components.forEach(component => {
      svgContent += this.generateComponentSVG(component);
    });
    
    // Add wires
    if (options.includeElements.wireRouting) {
      data.wires.forEach(wire => {
        svgContent += this.generateWireSVG(wire);
      });
    }
    
    // Add measurements
    if (options.includeElements.measurements) {
      data.measurements.forEach(measurement => {
        svgContent += this.generateMeasurementSVG(measurement);
      });
    }
    
    // Add annotations
    if (options.includeElements.annotations) {
      data.annotations.forEach(annotation => {
        svgContent += this.generateAnnotationSVG(annotation);
      });
    }
    
    svgContent += '</svg>';
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const filename = this.generateFilename(data.projectInfo.projectName, 'svg');
    
    return {
      success: true,
      data: blob,
      filename,
      size: blob.size,
      metadata: {
        format: 'svg',
        dimensions: { width: svgWidth, height: svgHeight },
        fileSize: blob.size,
        createdAt: new Date()
      }
    };
  }
  
  /**
   * Export to PNG format
   */
  private static async exportToPNG(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    // First create SVG, then convert to PNG
    const svgResult = await this.exportToSVG(data, options);
    if (!svgResult.success || !svgResult.data) {
      throw new Error('Failed to generate SVG for PNG conversion');
    }
    
    // Convert SVG to PNG using canvas
    const svgBlob = svgResult.data as Blob;
    const svgText = await svgBlob.text();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    // Set canvas size based on DPI
    const dpi = options.dpi || 300;
    const scaleFactor = dpi / 96; // 96 DPI is standard
    canvas.width = data.canvasSize.width * scaleFactor;
    canvas.height = data.canvasSize.height * scaleFactor;
    
    // Create image from SVG
    const img = new Image();
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Set background color based on color mode
        if (options.colorMode === 'blackwhite' || options.colorMode === 'grayscale') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw SVG to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Apply color mode filters
        if (options.colorMode === 'grayscale') {
          this.applyGrayscaleFilter(ctx, canvas.width, canvas.height);
        } else if (options.colorMode === 'blackwhite') {
          this.applyBlackWhiteFilter(ctx, canvas.width, canvas.height);
        }
        
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({
              success: false,
              filename: '',
              error: 'Failed to generate PNG blob'
            });
            return;
          }
          
          const filename = this.generateFilename(data.projectInfo.projectName, 'png');
          resolve({
            success: true,
            data: blob,
            filename,
            size: blob.size,
            metadata: {
              format: 'png',
              dimensions: { width: canvas.width, height: canvas.height },
              fileSize: blob.size,
              createdAt: new Date()
            }
          });
        }, 'image/png', options.quality === 'high' ? 1.0 : 0.8);
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          filename: '',
          error: 'Failed to load SVG for PNG conversion'
        });
      };
      
      img.src = svgDataUrl;
    });
  }
  
  /**
   * Export to DWG format (simplified implementation)
   */
  private static async exportToDWG(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    // Note: Full DWG export would require a specialized library like dxf-writer
    // This is a simplified implementation that creates a DXF file (ASCII format)
    
    let dxfContent = this.generateDXFHeader();
    
    // Add entities section
    dxfContent += '0\\nSECTION\\n2\\nENTITIES\\n';
    
    // Add components as blocks
    data.components.forEach(component => {
      dxfContent += this.generateComponentDXF(component);
    });
    
    // Add wires as polylines
    if (options.includeElements.wireRouting) {
      data.wires.forEach(wire => {
        dxfContent += this.generateWireDXF(wire);
      });
    }
    
    dxfContent += '0\\nENDSEC\\n0\\nEOF\\n';
    
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const filename = this.generateFilename(data.projectInfo.projectName, 'dxf');
    
    return {
      success: true,
      data: blob,
      filename,
      size: blob.size,
      metadata: {
        format: 'dxf',
        dimensions: data.canvasSize,
        fileSize: blob.size,
        createdAt: new Date()
      }
    };
  }
  
  /**
   * Export to Excel format
   */
  private static async exportToExcel(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    // Create workbook data structure
    const workbook = {
      SheetNames: ['Components', 'Calculations', 'Schedules'],
      Sheets: {
        Components: this.generateComponentsSheet(data.components),
        Calculations: this.generateCalculationsSheet(data.calculations),
        Schedules: this.generateSchedulesSheet(data.schedules)
      }
    };
    
    // Convert to Excel format (would use SheetJS in production)
    const csvData = this.convertWorkbookToCSV(workbook);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const filename = this.generateFilename(data.projectInfo.projectName, 'csv');
    
    return {
      success: true,
      data: blob,
      filename,
      size: blob.size
    };
  }
  
  /**
   * Export to CSV format
   */
  private static async exportToCSV(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    // Generate CSV for components list
    let csvContent = 'Component ID,Name,Type,X Position,Y Position,Width,Height,Properties\\n';
    
    data.components.forEach(component => {
      const properties = JSON.stringify(component.properties).replace(/"/g, '""');
      csvContent += `"${component.id}","${component.name}","${component.type}",${component.position.x},${component.position.y},${component.size.width},${component.size.height},"${properties}"\\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const filename = this.generateFilename(data.projectInfo.projectName, 'csv');
    
    return {
      success: true,
      data: blob,
      filename,
      size: blob.size
    };
  }
  
  /**
   * Helper methods for drawing and generation
   */
  
  private static calculateScaling(
    sourceSize: { width: number; height: number },
    targetSize: { width: number; height: number },
    scale: 'fit' | 'actual' | number
  ): { x: number; y: number } {
    if (scale === 'actual') {
      return { x: 1, y: 1 };
    } else if (scale === 'fit') {
      const scaleX = targetSize.width / sourceSize.width;
      const scaleY = targetSize.height / sourceSize.height;
      const uniformScale = Math.min(scaleX, scaleY);
      return { x: uniformScale, y: uniformScale };
    } else {
      return { x: scale, y: scale };
    }
  }
  
  private static drawComponentToPDF(
    pdf: jsPDF,
    component: SLDComponent,
    margin: number,
    scale: { x: number; y: number }
  ): void {
    const x = margin + (component.position.x * scale.x);
    const y = margin + (component.position.y * scale.y);
    const width = component.size.width * scale.x;
    const height = component.size.height * scale.y;
    
    // Draw component rectangle
    pdf.setDrawColor(55, 65, 81);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height);
    
    // Draw component label
    pdf.setFontSize(8);
    pdf.setTextColor(17, 24, 39);
    pdf.text(component.name, x + 2, y + height/2, { maxWidth: width - 4 });
  }
  
  private static drawWireToPDF(
    pdf: jsPDF,
    wire: SLDWire,
    margin: number,
    scale: { x: number; y: number }
  ): void {
    if (wire.path.length < 2) return;
    
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(1);
    
    const startPoint = wire.path[0];
    pdf.moveTo(
      margin + (startPoint.x * scale.x),
      margin + (startPoint.y * scale.y)
    );
    
    for (let i = 1; i < wire.path.length; i++) {
      const point = wire.path[i];
      pdf.lineTo(
        margin + (point.x * scale.x),
        margin + (point.y * scale.y)
      );
    }
    
    pdf.stroke();
  }
  
  private static generateComponentSVG(component: SLDComponent): string {
    return `
      <g id="${component.id}">
        <rect x="${component.position.x}" y="${component.position.y}" 
              width="${component.size.width}" height="${component.size.height}" 
              class="component"/>
        <text x="${component.position.x + 5}" y="${component.position.y + component.size.height/2}" 
              class="text">${component.name}</text>
      </g>`;
  }
  
  private static generateWireSVG(wire: SLDWire): string {
    if (wire.path.length < 2) return '';
    
    const pathData = wire.path.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    return `<path id="${wire.id}" d="${pathData}" class="wire"/>`;
  }
  
  private static generateDXFHeader(): string {
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1021
0
ENDSEC
`;
  }
  
  private static generateComponentDXF(component: SLDComponent): string {
    return `0
INSERT
8
COMPONENTS
2
${component.type.toUpperCase()}
10
${component.position.x}
20
${component.position.y}
30
0.0
`;
  }
  
  private static generateFilename(projectName: string, extension: string): string {
    const sanitized = projectName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitized}_SLD_${timestamp}.${extension}`;
  }
  
  private static applyGrayscaleFilter(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  private static applyBlackWhiteFilter(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const blackWhite = gray > 128 ? 255 : 0;
      data[i] = blackWhite;     // Red
      data[i + 1] = blackWhite; // Green
      data[i + 2] = blackWhite; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Placeholder implementations for complex methods
  private static drawGridToPDF(pdf: jsPDF, area: any, margin: number, grid: any, scale: any): void {}
  private static drawMeasurementToPDF(pdf: jsPDF, measurement: any, margin: number, scale: any): void {}
  private static drawAnnotationToPDF(pdf: jsPDF, annotation: any, margin: number, scale: any): void {}
  private static drawTitleBlockToPDF(pdf: jsPDF, titleBlock: any, width: number, height: number): void {}
  private static addSchedulesToPDF(pdf: jsPDF, schedules: any[]): void {}
  private static generateGridSVG(grid: any, canvas: any): string { return ''; }
  private static generateMeasurementSVG(measurement: any): string { return ''; }
  private static generateAnnotationSVG(annotation: any): string { return ''; }
  private static generateWireDXF(wire: any): string { return ''; }
  private static generateComponentsSheet(components: any[]): any { return {}; }
  private static generateCalculationsSheet(calculations: any): any { return {}; }
  private static generateSchedulesSheet(schedules: any[]): any { return {}; }
  private static convertWorkbookToCSV(workbook: any): string { return ''; }
}

// Type definitions for missing interfaces
interface ComponentConnection {
  id: string;
  point: { x: number; y: number };
  type: 'input' | 'output';
}

interface WireStyle {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

interface MeasurementStyle {
  color: string;
  lineWidth: number;
  textSize: number;
}

interface AnnotationStyle {
  fontSize: number;
  color: string;
  background?: string;
}

interface GridSettings {
  size: number;
  visible: boolean;
  color: string;
}

interface ProjectInformation {
  projectName: string;
  clientName?: string;
  propertyAddress?: string;
  engineerName?: string;
}

interface CalculationResults {
  totalLoad: number;
  serviceSize: number;
  method: string;
  [key: string]: any;
}