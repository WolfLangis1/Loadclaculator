/**
 * Professional Drawing Standards Service
 * 
 * IEEE 315 and ANSI Y14.5 compliant drawing standards for electrical diagrams
 */

import { createComponentLogger } from './loggingService';
import type { TitleBlockData } from '../components/SLD/TitleBlock';

export type PaperSize = 'A' | 'B' | 'C' | 'D' | 'E';
export type DrawingScale = '1:1' | '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64' | '1:128';
export type DimensionStyle = 'architectural' | 'engineering' | 'decimal' | 'fractional';

interface DrawingStandards {
  paperSize: PaperSize;
  orientation: 'landscape' | 'portrait';
  scale: DrawingScale;
  units: 'imperial' | 'metric';
  lineWeights: {
    object: number;
    hidden: number;
    center: number;
    dimension: number;
    extension: number;
    cutting: number;
  };
  textSizes: {
    title: number;
    subtitle: number;
    dimension: number;
    note: number;
    label: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface DimensionLine {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  dimensionText: string;
  style: DimensionStyle;
  precision: number;
  units: string;
  offset: number; // Distance from object
  extensionLines: boolean;
}

interface Annotation {
  id: string;
  position: { x: number; y: number };
  text: string;
  style: 'note' | 'label' | 'callout' | 'leader';
  fontSize: number;
  leader?: {
    points: Array<{ x: number; y: number }>;
    arrowStyle: 'arrow' | 'dot' | 'slash' | 'none';
  };
}

export class ProfessionalDrawingService {
  private static logger = createComponentLogger('ProfessionalDrawingService');

  // ANSI paper size specifications (inches)
  private static PAPER_SIZES = {
    A: { width: 8.5, height: 11, margins: { top: 1, bottom: 0.5, left: 0.5, right: 0.5 } },
    B: { width: 11, height: 17, margins: { top: 1, bottom: 0.5, left: 0.5, right: 0.5 } },
    C: { width: 17, height: 22, margins: { top: 1, bottom: 0.5, left: 0.5, right: 0.5 } },
    D: { width: 22, height: 34, margins: { top: 1, bottom: 0.5, left: 0.5, right: 0.5 } },
    E: { width: 34, height: 44, margins: { top: 1, bottom: 0.5, left: 0.5, right: 0.5 } }
  };

  // IEEE 315 standard line weights (points)
  private static LINE_WEIGHTS = {
    object: 0.7,    // Main electrical components
    hidden: 0.35,   // Hidden or internal components
    center: 0.35,   // Centerlines and axes
    dimension: 0.25, // Dimension and extension lines
    extension: 0.25, // Extension lines
    cutting: 1.0    // Cutting plane lines
  };

  // ANSI Y14.5 text sizes (points)
  private static TEXT_SIZES = {
    title: 14,      // Drawing title
    subtitle: 10,   // Subtitle and major headings
    dimension: 8,   // Dimension text
    note: 8,        // General notes
    label: 6        // Component labels
  };

  /**
   * Generate professional title block data from project information
   */
  static generateTitleBlock(
    projectInfo: any,
    drawingInfo: {
      title: string;
      number: string;
      revision: string;
      scale: DrawingScale;
      sheetNumber: string;
      totalSheets: string;
    }
  ): TitleBlockData {
    const now = new Date();
    
    return {
      projectName: projectInfo?.customerName || 'Electrical Installation',
      projectNumber: projectInfo?.projectNumber || 'E-' + now.getFullYear() + '-001',
      drawingTitle: drawingInfo.title,
      drawingNumber: drawingInfo.number,
      revision: drawingInfo.revision,
      dateCreated: now.toLocaleDateString(),
      dateModified: now.toLocaleDateString(),
      drawnBy: 'CAD System',
      checkedBy: '',
      approvedBy: '',
      companyName: projectInfo?.companyName || 'Electrical Design Associates',
      companyAddress: projectInfo?.companyAddress || '123 Electric Ave, Power City, ST 12345',
      scale: drawingInfo.scale,
      sheetNumber: drawingInfo.sheetNumber,
      totalSheets: drawingInfo.totalSheets,
      necCodeYear: projectInfo?.codeYear || '2023',
      jurisdictionCode: projectInfo?.jurisdiction,
      permitNumber: projectInfo?.permitNumber
    };
  }

  /**
   * Calculate drawing scale factor from scale string
   */
  static getScaleFactor(scale: DrawingScale): number {
    const scaleParts = scale.split(':');
    return parseInt(scaleParts[1]) / parseInt(scaleParts[0]);
  }

  /**
   * Convert real-world dimensions to drawing dimensions
   */
  static scaleDistance(realDistance: number, scale: DrawingScale): number {
    const factor = this.getScaleFactor(scale);
    return realDistance / factor;
  }

  /**
   * Create professional dimension line
   */
  static createDimensionLine(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    style: DimensionStyle = 'engineering',
    precision: number = 2,
    offset: number = 20
  ): DimensionLine {
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    let dimensionText: string;
    let units: string;

    switch (style) {
      case 'architectural':
        dimensionText = this.formatArchitecturalDimension(distance);
        units = 'ft-in';
        break;
      case 'engineering':
        dimensionText = (distance / 12).toFixed(precision); // Convert to feet
        units = 'ft';
        break;
      case 'decimal':
        dimensionText = distance.toFixed(precision);
        units = 'in';
        break;
      case 'fractional':
        dimensionText = this.formatFractionalDimension(distance);
        units = 'in';
        break;
      default:
        dimensionText = distance.toFixed(precision);
        units = 'in';
    }

    return {
      id: `dim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startPoint,
      endPoint,
      dimensionText,
      style,
      precision,
      units,
      offset,
      extensionLines: true
    };
  }

  /**
   * Format distance in architectural style (feet and inches)
   */
  private static formatArchitecturalDimension(inches: number): string {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    
    if (feet === 0) {
      return `${remainingInches.toFixed(1)}"`;
    } else if (remainingInches === 0) {
      return `${feet}'`;
    } else {
      return `${feet}'-${remainingInches.toFixed(1)}"`;
    }
  }

  /**
   * Format distance as fractional inches
   */
  private static formatFractionalDimension(inches: number): string {
    const wholeInches = Math.floor(inches);
    const fraction = inches - wholeInches;
    
    // Convert to nearest 1/16"
    const sixteenths = Math.round(fraction * 16);
    
    if (sixteenths === 0) {
      return `${wholeInches}"`;
    } else if (sixteenths === 16) {
      return `${wholeInches + 1}"`;
    } else {
      // Simplify fraction
      const [num, den] = this.simplifyFraction(sixteenths, 16);
      return wholeInches > 0 ? `${wholeInches} ${num}/${den}"` : `${num}/${den}"`;
    }
  }

  /**
   * Simplify fraction to lowest terms
   */
  private static simplifyFraction(numerator: number, denominator: number): [number, number] {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(numerator, denominator);
    return [numerator / divisor, denominator / divisor];
  }

  /**
   * Create annotation with leader line
   */
  static createAnnotation(
    position: { x: number; y: number },
    text: string,
    style: 'note' | 'label' | 'callout' | 'leader' = 'note',
    targetPoint?: { x: number; y: number }
  ): Annotation {
    const annotation: Annotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position,
      text,
      style,
      fontSize: this.TEXT_SIZES[style === 'label' ? 'label' : 'note']
    };

    // Add leader line if target point specified
    if (targetPoint && style === 'leader') {
      annotation.leader = {
        points: [position, targetPoint],
        arrowStyle: 'arrow'
      };
    }

    return annotation;
  }

  /**
   * Generate standard electrical notes
   */
  static generateStandardNotes(
    necYear: string = '2023',
    jurisdiction?: string
  ): Annotation[] {
    const notes: string[] = [
      `ALL ELECTRICAL WORK SHALL COMPLY WITH NEC ${necYear}`,
      'ALL ELECTRICAL WORK SHALL BE PERFORMED BY LICENSED ELECTRICIAN',
      'ELECTRICAL PERMIT REQUIRED PRIOR TO INSTALLATION',
      'ALL CIRCUITS SHALL BE AFCI/GFCI PROTECTED AS REQUIRED BY CODE',
      'WORKING CLEARANCES PER NEC 110.26 SHALL BE MAINTAINED',
      'GROUNDING AND BONDING PER NEC ARTICLE 250'
    ];

    if (jurisdiction) {
      notes.unshift(`ALL WORK SHALL COMPLY WITH ${jurisdiction.toUpperCase()} ELECTRICAL CODE`);
    }

    return notes.map((note, index) => ({
      id: `note_${index}`,
      position: { x: 50, y: 50 + (index * 15) },
      text: `${index + 1}. ${note}`,
      style: 'note' as const,
      fontSize: this.TEXT_SIZES.note
    }));
  }

  /**
   * Validate drawing against professional standards
   */
  static validateDrawing(
    components: any[],
    dimensions: DimensionLine[],
    annotations: Annotation[],
    standards: DrawingStandards
  ): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check title block presence
    if (!annotations.some(ann => ann.text.toLowerCase().includes('title'))) {
      warnings.push('Drawing should include a title block');
    }

    // Check for general notes
    if (!annotations.some(ann => ann.text.toLowerCase().includes('nec'))) {
      warnings.push('Drawing should include NEC compliance notes');
    }

    // Check dimension completeness
    if (components.length > 2 && dimensions.length === 0) {
      warnings.push('Consider adding dimensions for component spacing');
    }

    // Check text size consistency
    const textSizes = annotations.map(ann => ann.fontSize);
    const uniqueSizes = [...new Set(textSizes)];
    if (uniqueSizes.length > 3) {
      warnings.push('Too many different text sizes - limit to 3 sizes maximum');
    }

    // Check line weight usage
    // This would integrate with actual component line weights

    this.logger.info('Drawing validation completed', { 
      warnings: warnings.length, 
      errors: errors.length 
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Generate drawing border with standard layout
   */
  static generateDrawingBorder(
    paperSize: PaperSize,
    orientation: 'landscape' | 'portrait' = 'landscape'
  ): {
    outerBorder: { x: number; y: number; width: number; height: number };
    innerBorder: { x: number; y: number; width: number; height: number };
    titleBlockArea: { x: number; y: number; width: number; height: number };
    drawingArea: { x: number; y: number; width: number; height: number };
  } {
    const paper = this.PAPER_SIZES[paperSize];
    const width = orientation === 'landscape' ? paper.width : paper.height;
    const height = orientation === 'landscape' ? paper.height : paper.width;
    
    // Convert to pixels (assuming 96 DPI)
    const pixelWidth = width * 96;
    const pixelHeight = height * 96;
    
    const margins = paper.margins;
    const marginLeft = margins.left * 96;
    const marginRight = margins.right * 96;
    const marginTop = margins.top * 96;
    const marginBottom = margins.bottom * 96;

    const titleBlockHeight = 108; // Standard title block height
    
    return {
      outerBorder: {
        x: 0,
        y: 0,
        width: pixelWidth,
        height: pixelHeight
      },
      innerBorder: {
        x: marginLeft,
        y: marginTop,
        width: pixelWidth - marginLeft - marginRight,
        height: pixelHeight - marginTop - marginBottom
      },
      titleBlockArea: {
        x: pixelWidth - marginRight - 432, // Standard title block width
        y: pixelHeight - marginBottom - titleBlockHeight,
        width: 432,
        height: titleBlockHeight
      },
      drawingArea: {
        x: marginLeft,
        y: marginTop,
        width: pixelWidth - marginLeft - marginRight,
        height: pixelHeight - marginTop - marginBottom - titleBlockHeight - 10
      }
    };
  }

  /**
   * Auto-generate drawing layout with professional spacing
   */
  static autoLayoutComponents(
    components: Array<{ id: string; type: string; size: { width: number; height: number } }>,
    drawingArea: { x: number; y: number; width: number; height: number }
  ): Array<{ id: string; position: { x: number; y: number } }> {
    const positions: Array<{ id: string; position: { x: number; y: number } }> = [];
    
    // Group components by type/category
    const groups = this.groupComponentsByCategory(components);
    
    let currentX = drawingArea.x + 50;
    let currentY = drawingArea.y + 50;
    const groupSpacing = 150;
    const componentSpacing = 80;
    
    Object.entries(groups).forEach(([category, categoryComponents]) => {
      let maxHeightInGroup = 0;
      
      categoryComponents.forEach((component, index) => {
        positions.push({
          id: component.id,
          position: { x: currentX, y: currentY }
        });
        
        currentX += component.size.width + componentSpacing;
        maxHeightInGroup = Math.max(maxHeightInGroup, component.size.height);
        
        // Wrap to next row if needed
        if (currentX + component.size.width > drawingArea.x + drawingArea.width - 50) {
          currentX = drawingArea.x + 50;
          currentY += maxHeightInGroup + componentSpacing;
          maxHeightInGroup = 0;
        }
      });
      
      // Move to next group
      currentX = drawingArea.x + 50;
      currentY += maxHeightInGroup + groupSpacing;
    });
    
    return positions;
  }

  /**
   * Group components by electrical category
   */
  private static groupComponentsByCategory(
    components: Array<{ id: string; type: string; size: { width: number; height: number } }>
  ): Record<string, Array<{ id: string; type: string; size: { width: number; height: number } }>> {
    const groups: Record<string, typeof components> = {
      power_sources: [],
      protection: [],
      switching: [],
      loads: [],
      metering: [],
      other: []
    };

    components.forEach(component => {
      if (component.type.includes('generator') || component.type.includes('source')) {
        groups.power_sources.push(component);
      } else if (component.type.includes('breaker') || component.type.includes('fuse')) {
        groups.protection.push(component);
      } else if (component.type.includes('switch') || component.type.includes('disconnect')) {
        groups.switching.push(component);
      } else if (component.type.includes('motor') || component.type.includes('load')) {
        groups.loads.push(component);
      } else if (component.type.includes('meter') || component.type.includes('ct')) {
        groups.metering.push(component);
      } else {
        groups.other.push(component);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }
}