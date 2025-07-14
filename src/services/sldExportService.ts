import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';
import type { NECComplianceReport } from './sldNECEngine';
import type { LoadFlowAnalysis } from './sldLoadFlowService';
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'svg' | 'dxf' | 'dwg' | 'png' | 'json';
  template: 'permit' | 'construction' | 'as_built' | 'custom';
  includeCalculations: boolean;
  includeAerialView: boolean;
  includeNECCompliance: boolean;
  includeLoadFlow: boolean;
  paperSize: 'letter' | 'a4' | 'legal' | 'tabloid';
  orientation: 'portrait' | 'landscape';
  scale: number;
  layers: string[];
  watermark?: string;
  title?: string;
  subtitle?: string;
  footer?: string;
}

export interface ExportSettings {
  includeSpecifications: boolean;
  includeNECLabels: boolean;
  includeWireSizing: boolean;
  includeLoadFlow: boolean;
  paperSize: 'letter' | 'a4' | 'legal' | 'tabloid';
  orientation: 'portrait' | 'landscape';
  scale: number;
  backgroundColor: string;
  showGrid: boolean;
  showLayers: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  error?: string;
  format: string;
  size?: number;
}

export interface PermitPackage {
  diagram: SLDDiagram;
  necCompliance: NECComplianceReport;
  loadFlow: LoadFlowAnalysis;
  projectInfo: any;
  calculations: any;
  aerialView?: any;
}

export class SLDExportService {
  private static readonly DEFAULT_OPTIONS: ExportOptions = {
    format: 'pdf',
    template: 'permit',
    includeCalculations: true,
    includeAerialView: false,
    includeNECCompliance: true,
    includeLoadFlow: false,
    paperSize: 'letter',
    orientation: 'landscape',
    scale: 1.0,
    layers: ['components', 'connections', 'labels']
  };

  /**
   * Export diagram to PDF with enhanced settings
   */
  static async exportToPDF(diagram: SLDDiagram, settings?: Partial<ExportSettings>): Promise<ExportResult> {
    try {
      const defaultSettings: ExportSettings = {
        includeSpecifications: true,
        includeNECLabels: true,
        includeWireSizing: false,
        includeLoadFlow: false,
        paperSize: 'letter',
        orientation: 'landscape',
        scale: 1.0,
        backgroundColor: '#ffffff',
        showGrid: false,
        showLayers: true,
        ...settings
      };

      // Create enhanced PDF with multiple pages
      const pdf = new jsPDF({
        orientation: defaultSettings.orientation,
        unit: 'mm',
        format: defaultSettings.paperSize
      });

      // Add title page
      this.addTitlePage(pdf, diagram, defaultSettings);

      // Add diagram page
      this.addDiagramPage(pdf, diagram, defaultSettings);

      // Add specifications page if requested
      if (defaultSettings.includeSpecifications) {
        this.addSpecificationsPage(pdf, diagram, defaultSettings);
      }

      // Add NEC compliance page if requested
      if (defaultSettings.includeNECLabels) {
        this.addNECCompliancePage(pdf, diagram, defaultSettings);
      }

      // Add wire sizing page if requested
      if (defaultSettings.includeWireSizing) {
        this.addWireSizingPage(pdf, diagram, defaultSettings);
      }

      // Add load flow analysis page if requested
      if (defaultSettings.includeLoadFlow) {
        this.addLoadFlowPage(pdf, diagram, defaultSettings);
      }

      const pdfBlob = pdf.output('blob');
      const filename = `${diagram.name.replace(/[^a-zA-Z0-9]/g, '_')}_SLD_${new Date().toISOString().split('T')[0]}.pdf`;

      return {
        success: true,
        data: pdfBlob,
        filename,
        format: 'pdf',
        size: pdfBlob.size
      };
    } catch (error) {
      console.error('PDF export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed',
        format: 'pdf'
      };
    }
  }



  /**
   * Enhanced SVG export with better styling
   */
  static async exportToSVG(diagram: SLDDiagram, settings?: Partial<ExportSettings>): Promise<ExportResult> {
    try {
      const defaultSettings: ExportSettings = {
        includeSpecifications: false,
        includeNECLabels: true,
        includeWireSizing: false,
        includeLoadFlow: false,
        paperSize: 'letter',
        orientation: 'landscape',
        scale: 1.0,
        backgroundColor: '#ffffff',
        showGrid: false,
        showLayers: true,
        ...settings
      };

      const svgContent = this.generateEnhancedSVG(diagram, defaultSettings);
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const filename = `${diagram.name.replace(/[^a-zA-Z0-9]/g, '_')}_SLD_${new Date().toISOString().split('T')[0]}.svg`;

      return {
        success: true,
        data: svgBlob,
        filename,
        format: 'svg',
        size: svgBlob.size
      };
    } catch (error) {
      console.error('SVG export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SVG export failed',
        format: 'svg'
      };
    }
  }

  /**
   * Enhanced PNG export with high resolution
   */
  static async exportToPNG(diagram: SLDDiagram, settings?: Partial<ExportSettings>): Promise<ExportResult> {
    try {
      const defaultSettings: ExportSettings = {
        includeSpecifications: false,
        includeNECLabels: true,
        includeWireSizing: false,
        includeLoadFlow: false,
        paperSize: 'letter',
        orientation: 'landscape',
        scale: 2.0, // Higher resolution for PNG
        backgroundColor: '#ffffff',
        showGrid: false,
        showLayers: true,
        ...settings
      };

      // Generate SVG first, then convert to PNG
      const svgResult = await this.exportToSVG(diagram, defaultSettings);
      if (!svgResult.success) {
        throw new Error('Failed to generate SVG for PNG conversion');
      }

      const pngBlob = await this.convertSVGtoPNG(svgResult.data as Blob, defaultSettings);
      const filename = `${diagram.name.replace(/[^a-zA-Z0-9]/g, '_')}_SLD_${new Date().toISOString().split('T')[0]}.png`;

      return {
        success: true,
        data: pngBlob,
        filename,
        format: 'png',
        size: pngBlob.size
      };
    } catch (error) {
      console.error('PNG export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PNG export failed',
        format: 'png'
      };
    }
  }

  /**
   * Export diagram to JSON
   */
  static exportToJSON(
    diagram: SLDDiagram,
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    try {
      const jsonContent = JSON.stringify(diagram, null, 2);
      
      return {
        success: true,
        data: jsonContent,
        filename: this.generateFilename(diagram, 'json'),
        format: 'json',
        size: jsonContent.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: this.generateFilename(diagram, 'json'),
        format: 'json'
      };
    }
  }

  /**
   * Generate permit package
   */
  static async generatePermitPackage(
    permitData: PermitPackage,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const exportOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const packageContent = await this.generatePermitPackageContent(permitData, exportOptions);
      
      return {
        success: true,
        data: packageContent,
        filename: `permit_package_${permitData.diagram.name.replace(/\s+/g, '_')}.pdf`,
        format: 'pdf',
        size: packageContent.size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: 'permit_package.pdf',
        format: 'pdf'
      };
    }
  }

  /**
   * Export diagram to DXF format (AutoCAD compatible)
   */
  static async exportToDXF(diagram: SLDDiagram, settings?: Partial<ExportSettings>): Promise<ExportResult> {
    try {
      const defaultSettings: ExportSettings = {
        includeSpecifications: false,
        includeNECLabels: true,
        includeWireSizing: false,
        includeLoadFlow: false,
        paperSize: 'letter',
        orientation: 'landscape',
        scale: 1.0,
        backgroundColor: '#ffffff',
        showGrid: false,
        showLayers: true,
        ...settings
      };

      // Generate DXF content
      const dxfContent = this.generateDXFContent(diagram, defaultSettings);
      const dxfBlob = new Blob([dxfContent], { type: 'application/dxf' });
      const filename = `${diagram.name.replace(/[^a-zA-Z0-9]/g, '_')}_SLD_${new Date().toISOString().split('T')[0]}.dxf`;

      return {
        success: true,
        data: dxfBlob,
        filename,
        format: 'dxf',
        size: dxfBlob.size
      };
    } catch (error) {
      console.error('DXF export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DXF export failed',
        format: 'dxf'
      };
    }
  }

  /**
   * Export diagram to DWG format (AutoCAD native)
   */
  static async exportToDWG(diagram: SLDDiagram, settings?: Partial<ExportSettings>): Promise<ExportResult> {
    try {
      const defaultSettings: ExportSettings = {
        includeSpecifications: false,
        includeNECLabels: true,
        includeWireSizing: false,
        includeLoadFlow: false,
        paperSize: 'letter',
        orientation: 'landscape',
        scale: 1.0,
        backgroundColor: '#ffffff',
        showGrid: false,
        showLayers: true,
        ...settings
      };

      // Note: DWG export requires specialized libraries
      // For now, we'll convert DXF to DWG using a web service or library
      const dxfResult = await this.exportToDXF(diagram, defaultSettings);
      if (!dxfResult.success) {
        throw new Error('Failed to generate DXF for DWG conversion');
      }

      // Convert DXF to DWG (placeholder implementation)
      const dwgBlob = await this.convertDXFtoDWG(dxfResult.data as Blob);
      const filename = `${diagram.name.replace(/[^a-zA-Z0-9]/g, '_')}_SLD_${new Date().toISOString().split('T')[0]}.dwg`;

      return {
        success: true,
        data: dwgBlob,
        filename,
        format: 'dwg',
        size: dwgBlob.size
      };
    } catch (error) {
      console.error('DWG export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DWG export failed',
        format: 'dwg'
      };
    }
  }

  /**
   * Generate PDF content
   */
  private static async generatePDFContent(
    diagram: SLDDiagram,
    options: ExportOptions
  ): Promise<Uint8Array> {
    // This would typically use a PDF library like jsPDF
    // For now, we'll create a simple text-based PDF structure
    
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(${diagram.name}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF
    `;
    
    return new TextEncoder().encode(pdfContent);
  }

  /**
   * Generate SVG content
   */
  private static generateSVGContent(
    diagram: SLDDiagram,
    options: ExportOptions
  ): string {
    const { canvasSize, components, connections } = diagram;
    const { scale, layers } = options;
    
    const width = canvasSize.width * scale;
    const height = canvasSize.height * scale;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add background
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;
    
    // Add grid if enabled
    if (diagram.gridEnabled) {
      svg += this.generateGridSVG(width, height, 20 * scale); // Default grid size
    }
    
    // Add connections
    if (layers.includes('connections')) {
      connections.forEach(connection => {
        svg += this.generateConnectionSVG(connection, components, scale);
      });
    }
    
    // Add components
    if (layers.includes('components')) {
      components.forEach(component => {
        svg += this.generateComponentSVG(component, scale);
      });
    }
    
    // Add labels
    if (layers.includes('labels')) {
      diagram.labels.forEach(label => {
        svg += this.generateLabelSVG(label, scale);
      });
    }
    
    // Add title and metadata
    svg += this.generateSVGMetadata(diagram, options);
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Generate DXF content
   */
  private static generateDXFContent(
    diagram: SLDDiagram,
    options: ExportOptions
  ): string {
    // DXF file format
    let dxf = '0\nSECTION\n2\nHEADER\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nENTITIES\n';
    
    // Add components as blocks
    diagram.components.forEach(component => {
      dxf += this.generateDXFComponent(component, options.scale);
    });
    
    // Add connections as lines
    diagram.connections.forEach(connection => {
      dxf += this.generateDXFConnection(connection, diagram.components, options.scale);
    });
    
    dxf += '0\nENDSEC\n';
    dxf += '0\nEOF\n';
    
    return dxf;
  }

  /**
   * Generate permit package content
   */
  private static async generatePermitPackageContent(
    permitData: PermitPackage,
    options: ExportOptions
  ): Promise<Blob> {
    // This would generate a comprehensive permit package
    // For now, we'll create a simple text-based package
    
    const packageContent = `
PERMIT PACKAGE
==============

PROJECT INFORMATION
-------------------
Name: ${permitData.diagram.name}
Date: ${permitData.diagram.lastModified.toDateString()}
NEC Code Year: ${permitData.diagram.necCodeYear}

DIAGRAM SUMMARY
---------------
Components: ${permitData.diagram.components.length}
Connections: ${permitData.diagram.connections.length}
System Type: ${permitData.diagram.systemType}

NEC COMPLIANCE
--------------
Overall Compliant: ${permitData.necCompliance.overallCompliant ? 'YES' : 'NO'}
Errors: ${permitData.necCompliance.summary.errors}
Warnings: ${permitData.necCompliance.summary.warnings}

LOAD FLOW ANALYSIS
------------------
Overall Efficiency: ${permitData.loadFlow.efficiency.toFixed(2)}%
Critical Paths: ${permitData.loadFlow.criticalPaths.length}

RECOMMENDATIONS
---------------
${permitData.necCompliance.recommendations.join('\n')}
${permitData.loadFlow.recommendations.join('\n')}
    `;
    
    return new Blob([packageContent], { type: 'text/plain' });
  }

  /**
   * Convert SVG to PNG
   */
  private static async svgToPng(svgContent: string, options: ExportOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create PNG blob'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Could not load SVG image'));
      img.src = 'data:image/svg+xml;base64,' + btoa(svgContent);
    });
  }

  /**
   * Generate grid SVG
   */
  private static generateGridSVG(width: number, height: number, gridSize: number): string {
    let grid = `<defs><pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">`;
    grid += `<path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#e5e7eb" stroke-width="1" opacity="0.5"/>`;
    grid += '</pattern></defs>';
    grid += `<rect width="${width}" height="${height}" fill="url(#grid)"/>`;
    return grid;
  }

  /**
   * Generate component SVG
   */
  private static generateComponentSVG(component: SLDComponent, scale: number): string {
    const { position, size, type, name } = component;
    const x = position.x * scale;
    const y = position.y * scale;
    const width = size.width * scale;
    const height = size.height * scale;
    
    let svg = `<g transform="translate(${x}, ${y})">`;
    
    // Generate component shape based on type
    switch (type) {
      case 'pv_array':
        svg += `<rect width="${width}" height="${height}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" rx="4"/>`;
        break;
      case 'inverter':
        svg += `<circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/2}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`;
        break;
      case 'battery':
        svg += `<rect width="${width}" height="${height}" fill="#dcfce7" stroke="#16a34a" stroke-width="2" rx="4"/>`;
        break;
      default:
        svg += `<rect width="${width}" height="${height}" fill="#f3f4f6" stroke="#6b7280" stroke-width="2" rx="4"/>`;
    }
    
    // Add label
    svg += `<text x="${width/2}" y="${height/2}" text-anchor="middle" font-size="12" fill="#374151">${name}</text>`;
    
    svg += '</g>';
    return svg;
  }

  /**
   * Generate connection SVG
   */
  private static generateConnectionSVG(
    connection: SLDConnection,
    components: SLDComponent[],
    scale: number
  ): string {
    const fromComponent = components.find(c => c.id === connection.fromComponentId);
    const toComponent = components.find(c => c.id === connection.toComponentId);
    
    if (!fromComponent || !toComponent) return '';
    
    const fromCenter = {
      x: (fromComponent.position.x + fromComponent.size.width / 2) * scale,
      y: (fromComponent.position.y + fromComponent.size.height / 2) * scale
    };
    
    const toCenter = {
      x: (toComponent.position.x + toComponent.size.width / 2) * scale,
      y: (toComponent.position.y + toComponent.size.height / 2) * scale
    };
    
    const strokeColor = connection.wireType === 'dc' ? '#dc2626' : 
                       connection.wireType === 'ac' ? '#2563eb' : '#16a34a';
    const strokeWidth = connection.wireType === 'ground' ? 3 : 2;
    const strokeDasharray = connection.wireType === 'ground' ? '5,5' : 'none';
    
    return `<line x1="${fromCenter.x}" y1="${fromCenter.y}" x2="${toCenter.x}" y2="${toCenter.y}" 
                  stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDasharray}"/>`;
  }

  /**
   * Generate label SVG
   */
  private static generateLabelSVG(label: any, scale: number): string {
    const x = label.position.x * scale;
    const y = label.position.y * scale;
    const fontSize = label.fontSize * scale;
    
    return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${label.fontWeight}" fill="${label.color}">${label.text}</text>`;
  }

  /**
   * Generate SVG metadata
   */
  private static generateSVGMetadata(diagram: SLDDiagram, options: ExportOptions): string {
    let metadata = '<metadata>';
    metadata += `<title>${diagram.name}</title>`;
    metadata += `<description>Single Line Diagram - ${diagram.systemType}</description>`;
    metadata += `<created>${diagram.created.toISOString()}</created>`;
    metadata += `<modified>${diagram.lastModified.toISOString()}</modified>`;
    metadata += `<version>${diagram.version}</version>`;
    metadata += `<necCodeYear>${diagram.necCodeYear}</necCodeYear>`;
    metadata += '</metadata>';
    return metadata;
  }

  /**
   * Generate DXF component
   */
  private static generateDXFComponent(component: SLDComponent, scale: number): string {
    const { position, size, type } = component;
    const x = position.x * scale;
    const y = position.y * scale;
    const width = size.width * scale;
    const height = size.height * scale;
    
    // Create a simple rectangle for the component
    let dxf = '0\nINSERT\n8\nCOMPONENTS\n';
    dxf += `2\n${type.toUpperCase()}\n`;
    dxf += `10\n${x}\n20\n${y}\n`;
    dxf += `41\n${scale}\n42\n${scale}\n`;
    
    return dxf;
  }

  /**
   * Generate DXF connection
   */
  private static generateDXFConnection(
    connection: SLDConnection,
    components: SLDComponent[],
    scale: number
  ): string {
    const fromComponent = components.find(c => c.id === connection.fromComponentId);
    const toComponent = components.find(c => c.id === connection.toComponentId);
    
    if (!fromComponent || !toComponent) return '';
    
    const fromCenter = {
      x: (fromComponent.position.x + fromComponent.size.width / 2) * scale,
      y: (fromComponent.position.y + fromComponent.size.height / 2) * scale
    };
    
    const toCenter = {
      x: (toComponent.position.x + toComponent.size.width / 2) * scale,
      y: (toComponent.position.y + toComponent.size.height / 2) * scale
    };
    
    let dxf = '0\nLINE\n8\nCONNECTIONS\n';
    dxf += `10\n${fromCenter.x}\n20\n${fromCenter.y}\n`;
    dxf += `11\n${toCenter.x}\n21\n${toCenter.y}\n`;
    
    return dxf;
  }

  /**
   * Generate filename
   */
  private static generateFilename(diagram: SLDDiagram, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const safeName = diagram.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeName}_${timestamp}.${extension}`;
  }

  /**
   * Download file
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Export failed:', result.error);
      return;
    }
    
    const url = result.data instanceof Blob 
      ? URL.createObjectURL(result.data)
      : `data:text/plain;charset=utf-8,${encodeURIComponent(result.data)}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename || 'export'; // Use a default name if filename is not available
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    if (result.data instanceof Blob) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Get supported formats
   */
  static getSupportedFormats(): Array<{ format: string; description: string; extensions: string[] }> {
    return [
      { format: 'pdf', description: 'Portable Document Format', extensions: ['.pdf'] },
      { format: 'svg', description: 'Scalable Vector Graphics', extensions: ['.svg'] },
      { format: 'png', description: 'Portable Network Graphics', extensions: ['.png'] },
      { format: 'dxf', description: 'AutoCAD Drawing Exchange Format', extensions: ['.dxf'] },
      { format: 'json', description: 'JavaScript Object Notation', extensions: ['.json'] }
    ];
  }

  /**
   * Get paper sizes
   */
  static getPaperSizes(): Array<{ size: string; width: number; height: number; description: string }> {
    return [
      { size: 'letter', width: 8.5, height: 11, description: 'Letter (8.5" × 11")' },
      { size: 'a4', width: 210, height: 297, description: 'A4 (210 × 297 mm)' },
      { size: 'legal', width: 8.5, height: 14, description: 'Legal (8.5" × 14")' },
      { size: 'tabloid', width: 11, height: 17, description: 'Tabloid (11" × 17")' }
    ];
  }

  // Private helper methods

  private static addTitlePage(pdf: jsPDF, diagram: SLDDiagram, settings: ExportSettings): void {
    pdf.setFontSize(24);
    pdf.text('Single Line Diagram', 105, 40, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Project: ${diagram.name}`, 20, 80);
    pdf.text(`Created: ${diagram.created.toLocaleDateString()}`, 20, 90);
    pdf.text(`Last Modified: ${diagram.lastModified.toLocaleDateString()}`, 20, 100);
    pdf.text(`System Type: ${diagram.systemType}`, 20, 110);
    pdf.text(`NEC Code Year: ${diagram.necCodeYear}`, 20, 120);
    
    if (diagram.designedBy) {
      pdf.text(`Designed By: ${diagram.designedBy}`, 20, 140);
    }
    if (diagram.ahj) {
      pdf.text(`AHJ: ${diagram.ahj}`, 20, 150);
    }
  }

  private static addDiagramPage(pdf: jsPDF, diagram: SLDDiagram, settings: ExportSettings): void {
    pdf.addPage();
    
    // Add diagram title
    pdf.setFontSize(16);
    pdf.text('Electrical Single Line Diagram', 105, 20, { align: 'center' });
    
    // Add diagram content (simplified representation)
    pdf.setFontSize(10);
    pdf.text(`Components: ${diagram.components.length}`, 20, 40);
    pdf.text(`Connections: ${diagram.connections.length}`, 20, 50);
    
    // Add component list
    let yPos = 70;
    diagram.components.forEach((component, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`${index + 1}. ${component.name} (${component.type})`, 20, yPos);
      yPos += 8;
    });
  }

  private static addSpecificationsPage(pdf: jsPDF, diagram: SLDDiagram, settings: ExportSettings): void {
    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.text('Component Specifications', 105, 20, { align: 'center' });
    
    let yPos = 40;
    diagram.components.forEach((component, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text(`${component.name}`, 20, yPos);
      yPos += 8;
      
      pdf.setFontSize(10);
      Object.entries(component.specifications).forEach(([key, value]) => {
        pdf.text(`  ${key}: ${value}`, 25, yPos);
        yPos += 6;
      });
      yPos += 5;
    });
  }

  private static addNECCompliancePage(pdf: jsPDF, diagram: SLDDiagram, settings: ExportSettings): void {
    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.text('NEC Compliance Report', 105, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Overall Compliance: ${diagram.necCompliant ? 'YES' : 'NO'}`, 20, 40);
    
    if (diagram.necViolations.length > 0) {
      pdf.text('Violations:', 20, 60);
      let yPos = 70;
      diagram.necViolations.forEach((violation, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(`${index + 1}. ${violation}`, 25, yPos);
        yPos += 8;
      });
    }
  }

  private static addWireSizingPage(pdf: jsPDF, diagram: SLDDiagram, settings: ExportSettings): void {
    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.text('Wire Sizing Analysis', 105, 20, { align: 'center' });
    
    let yPos = 40;
    diagram.connections.forEach((connection, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(10);
      pdf.text(`Connection ${index + 1}: ${connection.fromComponentId} → ${connection.toComponentId}`, 20, yPos);
      yPos += 6;
      pdf.text(`  Wire Type: ${connection.wireType}`, 25, yPos);
      yPos += 6;
      if (connection.conductorSize) {
        pdf.text(`  Conductor Size: ${connection.conductorSize}`, 25, yPos);
        yPos += 6;
      }
      yPos += 5;
    });
  }

  private static addLoadFlowPage(pdf: jsPDF, diagram: SLDDiagram, settings: ExportSettings): void {
    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.text('Load Flow Analysis', 105, 20, { align: 'center' });
    
    // This would be populated with actual load flow analysis results
    pdf.setFontSize(10);
    pdf.text('Load flow analysis results would be displayed here.', 20, 40);
  }

  private static generateDXFContent(diagram: SLDDiagram, settings: ExportSettings): string {
    // Generate DXF format content
    let dxf = '0\nSECTION\n2\nHEADER\n';
    dxf += '9\n$ACADVER\n1\nAC1021\n'; // AutoCAD 2010 format
    dxf += '9\n$DWGCODEPAGE\n3\nANSI_1252\n';
    dxf += '0\nENDSEC\n';
    
    // Add entities
    dxf += '0\nSECTION\n2\nENTITIES\n';
    
    // Add components as blocks
    diagram.components.forEach((component, index) => {
      dxf += `0\nINSERT\n8\n0\n2\nCOMPONENT_${index}\n10\n${component.position.x}\n20\n${component.position.y}\n`;
    });
    
    // Add connections as lines
    diagram.connections.forEach((connection, index) => {
      const fromComponent = diagram.components.find(c => c.id === connection.fromComponentId);
      const toComponent = diagram.components.find(c => c.id === connection.toComponentId);
      
      if (fromComponent && toComponent) {
        dxf += `0\nLINE\n8\n0\n10\n${fromComponent.position.x}\n20\n${fromComponent.position.y}\n`;
        dxf += `11\n${toComponent.position.x}\n21\n${toComponent.position.y}\n`;
      }
    });
    
    dxf += '0\nENDSEC\n';
    dxf += '0\nEOF\n';
    
    return dxf;
  }

  private static generateEnhancedSVG(diagram: SLDDiagram, settings: ExportSettings): string {
    const width = settings.orientation === 'landscape' ? 1200 : 800;
    const height = settings.orientation === 'landscape' ? 800 : 1200;
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .component { fill: #f3f4f6; stroke: #6b7280; stroke-width: 2; }
      .connection { stroke: #374151; stroke-width: 2; fill: none; }
      .label { font-family: Arial, sans-serif; font-size: 12px; fill: #374151; }
      .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #1f2937; }
    </style>
  </defs>
  
  <rect width="${width}" height="${height}" fill="${settings.backgroundColor}"/>
  
  <text x="${width/2}" y="30" text-anchor="middle" class="title">${diagram.name}</text>
  
  <!-- Components -->
  ${diagram.components.map(component => `
    <g transform="translate(${component.position.x}, ${component.position.y})">
      <rect width="${component.size.width}" height="${component.size.height}" class="component"/>
      <text x="${component.size.width/2}" y="${component.size.height/2 + 4}" text-anchor="middle" class="label">${component.name}</text>
    </g>
  `).join('')}
  
  <!-- Connections -->
  ${diagram.connections.map(connection => {
    const fromComponent = diagram.components.find(c => c.id === connection.fromComponentId);
    const toComponent = diagram.components.find(c => c.id === connection.toComponentId);
    
    if (fromComponent && toComponent) {
      const x1 = fromComponent.position.x + fromComponent.size.width/2;
      const y1 = fromComponent.position.y + fromComponent.size.height/2;
      const x2 = toComponent.position.x + toComponent.size.width/2;
      const y2 = toComponent.position.y + toComponent.size.height/2;
      
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="connection"/>`;
    }
    return '';
  }).join('')}
</svg>`;
    
    return svg;
  }

  private static async convertDXFtoDWG(dxfBlob: Blob): Promise<Blob> {
    // Placeholder implementation - would use a library like AutoCAD API or web service
    // For now, return the DXF blob as-is
    return dxfBlob;
  }

  private static async convertSVGtoPNG(svgBlob: Blob, settings: ExportSettings): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const scale = settings.scale || 2.0;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert SVG to PNG'));
            }
          }, 'image/png');
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load SVG image'));
      img.src = URL.createObjectURL(svgBlob);
    });
  }
} 