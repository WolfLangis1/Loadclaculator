// Project Attachment Service
// Manages aerial view images, site photos, and other attachments for permit applications

import type { 
  ProjectAttachment, 
  AttachmentType, 
  AttachmentSource, 
  AttachmentCollection,
  AttachmentFilter,
  AttachmentStats,
  AerialViewCaptureResult,
  BulkAttachmentOperation,
  ExportOptions
} from '../types/attachment';

export class AttachmentService {
  private static attachments: Map<string, AttachmentCollection> = new Map();

  /**
   * Convert image URL to base64 for PDF embedding
   */
  static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert URL to base64:', error);
      throw new Error('Failed to process image for PDF export');
    }
  }

  /**
   * Get image dimensions from URL
   */
  static async getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image dimensions'));
      };
      img.src = url;
    });
  }

  /**
   * Create attachment from aerial view capture
   */
  static async createAttachmentFromCapture(
    projectId: string,
    type: AttachmentType,
    source: AttachmentSource,
    url: string,
    metadata: {
      address?: string;
      coordinates?: { latitude: number; longitude: number };
      zoom?: number;
      heading?: number;
      description?: string;
    }
  ): Promise<ProjectAttachment> {
    try {
      // Get image dimensions
      const dimensions = await this.getImageDimensions(url);
      
      // Generate unique ID
      const id = `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create attachment
      const attachment: ProjectAttachment = {
        id,
        name: this.generateAttachmentName(type, metadata),
        description: metadata.description,
        type,
        source,
        url,
        metadata: {
          ...metadata,
          width: dimensions.width,
          height: dimensions.height,
          mimeType: 'image/png',
          captureDate: new Date()
        },
        createdAt: new Date(),
        markedForExport: false, // User must explicitly mark for export
        exportOptions: {
          includeInPDF: false,
          pdfSection: this.getDefaultPDFSection(type),
          pageSize: 'full',
          showMetadata: true,
          order: this.getNextOrder(projectId)
        }
      };

      // Add to collection
      this.addAttachment(projectId, attachment);
      
      return attachment;
    } catch (error) {
      console.error('Failed to create attachment:', error);
      throw error;
    }
  }

  /**
   * Generate descriptive name for attachment
   */
  private static generateAttachmentName(
    type: AttachmentType, 
    metadata: { address?: string; heading?: number; zoom?: number }
  ): string {
    const timestamp = new Date().toLocaleDateString();
    
    switch (type) {
      case 'satellite_image':
        return `Satellite View - ${metadata.address || 'Project Site'} (${timestamp})`;
      case 'street_view':
        const direction = this.headingToDirection(metadata.heading);
        return `Street View ${direction} - ${metadata.address || 'Project Site'} (${timestamp})`;
      case 'solar_analysis':
        return `Solar Analysis - ${metadata.address || 'Project Site'} (${timestamp})`;
      default:
        return `Site Photo - ${metadata.address || 'Project Site'} (${timestamp})`;
    }
  }

  /**
   * Convert heading degrees to cardinal direction
   */
  private static headingToDirection(heading?: number): string {
    if (heading === undefined) return '';
    
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }

  /**
   * Get default PDF section for attachment type
   */
  private static getDefaultPDFSection(type: AttachmentType): any {
    switch (type) {
      case 'satellite_image':
        return 'aerial_views';
      case 'street_view':
        return 'site_overview';
      case 'solar_analysis':
        return 'solar_analysis';
      case 'electrical_diagram':
        return 'electrical_layout';
      default:
        return 'appendix';
    }
  }

  /**
   * Get next order number for attachments
   */
  private static getNextOrder(projectId: string): number {
    const collection = this.attachments.get(projectId);
    if (!collection) return 1;
    
    const maxOrder = Math.max(...collection.attachments.map(a => a.exportOptions.order), 0);
    return maxOrder + 1;
  }

  /**
   * Add attachment to project collection
   */
  static addAttachment(projectId: string, attachment: ProjectAttachment): void {
    let collection = this.attachments.get(projectId);
    
    if (!collection) {
      collection = {
        projectId,
        attachments: [],
        totalCount: 0,
        markedForExportCount: 0,
        lastUpdated: new Date()
      };
    }
    
    collection.attachments.push(attachment);
    collection.totalCount = collection.attachments.length;
    collection.markedForExportCount = collection.attachments.filter(a => a.markedForExport).length;
    collection.lastUpdated = new Date();
    
    this.attachments.set(projectId, collection);
  }

  /**
   * Get all attachments for a project
   */
  static getProjectAttachments(projectId: string, filter?: AttachmentFilter): ProjectAttachment[] {
    const collection = this.attachments.get(projectId);
    if (!collection) return [];
    
    let attachments = [...collection.attachments];
    
    if (filter) {
      if (filter.type) {
        attachments = attachments.filter(a => filter.type!.includes(a.type));
      }
      if (filter.source) {
        attachments = attachments.filter(a => filter.source!.includes(a.source));
      }
      if (filter.markedForExport !== undefined) {
        attachments = attachments.filter(a => a.markedForExport === filter.markedForExport);
      }
      if (filter.hasCoordinates) {
        attachments = attachments.filter(a => a.metadata.coordinates);
      }
    }
    
    return attachments.sort((a, b) => a.exportOptions.order - b.exportOptions.order);
  }

  /**
   * Get attachments marked for export
   */
  static getExportAttachments(projectId: string): ProjectAttachment[] {
    return this.getProjectAttachments(projectId, { markedForExport: true });
  }

  /**
   * Mark attachment for export
   */
  static markForExport(
    projectId: string, 
    attachmentId: string, 
    exportOptions?: Partial<ExportOptions>
  ): boolean {
    const collection = this.attachments.get(projectId);
    if (!collection) return false;
    
    const attachment = collection.attachments.find(a => a.id === attachmentId);
    if (!attachment) return false;
    
    attachment.markedForExport = true;
    attachment.exportOptions = {
      ...attachment.exportOptions,
      includeInPDF: true,
      ...exportOptions
    };
    
    // Update collection stats
    collection.markedForExportCount = collection.attachments.filter(a => a.markedForExport).length;
    collection.lastUpdated = new Date();
    
    return true;
  }

  /**
   * Unmark attachment for export
   */
  static unmarkForExport(projectId: string, attachmentId: string): boolean {
    const collection = this.attachments.get(projectId);
    if (!collection) return false;
    
    const attachment = collection.attachments.find(a => a.id === attachmentId);
    if (!attachment) return false;
    
    attachment.markedForExport = false;
    attachment.exportOptions.includeInPDF = false;
    
    // Update collection stats
    collection.markedForExportCount = collection.attachments.filter(a => a.markedForExport).length;
    collection.lastUpdated = new Date();
    
    return true;
  }

  /**
   * Update attachment export options
   */
  static updateExportOptions(
    projectId: string, 
    attachmentId: string, 
    options: Partial<ExportOptions>
  ): boolean {
    const collection = this.attachments.get(projectId);
    if (!collection) return false;
    
    const attachment = collection.attachments.find(a => a.id === attachmentId);
    if (!attachment) return false;
    
    attachment.exportOptions = {
      ...attachment.exportOptions,
      ...options
    };
    
    collection.lastUpdated = new Date();
    return true;
  }

  /**
   * Delete attachment
   */
  static deleteAttachment(projectId: string, attachmentId: string): boolean {
    const collection = this.attachments.get(projectId);
    if (!collection) return false;
    
    const index = collection.attachments.findIndex(a => a.id === attachmentId);
    if (index === -1) return false;
    
    collection.attachments.splice(index, 1);
    collection.totalCount = collection.attachments.length;
    collection.markedForExportCount = collection.attachments.filter(a => a.markedForExport).length;
    collection.lastUpdated = new Date();
    
    return true;
  }

  /**
   * Bulk operations on attachments
   */
  static bulkOperation(projectId: string, operation: BulkAttachmentOperation): boolean {
    const collection = this.attachments.get(projectId);
    if (!collection) return false;
    
    const attachments = collection.attachments.filter(a => 
      operation.attachmentIds.includes(a.id)
    );
    
    if (attachments.length === 0) return false;
    
    switch (operation.action) {
      case 'mark_for_export':
        attachments.forEach(a => {
          a.markedForExport = true;
          a.exportOptions = { ...a.exportOptions, includeInPDF: true, ...operation.options };
        });
        break;
        
      case 'unmark_for_export':
        attachments.forEach(a => {
          a.markedForExport = false;
          a.exportOptions.includeInPDF = false;
        });
        break;
        
      case 'update_section':
        if (operation.options?.pdfSection) {
          attachments.forEach(a => {
            a.exportOptions.pdfSection = operation.options!.pdfSection!;
          });
        }
        break;
        
      case 'delete':
        operation.attachmentIds.forEach(id => {
          const index = collection.attachments.findIndex(a => a.id === id);
          if (index >= 0) collection.attachments.splice(index, 1);
        });
        break;
    }
    
    // Update collection stats
    collection.totalCount = collection.attachments.length;
    collection.markedForExportCount = collection.attachments.filter(a => a.markedForExport).length;
    collection.lastUpdated = new Date();
    
    return true;
  }

  /**
   * Get attachment statistics
   */
  static getAttachmentStats(projectId: string): AttachmentStats {
    const collection = this.attachments.get(projectId);
    if (!collection) {
      return {
        total: 0,
        byType: {} as Record<any, number>,
        bySource: {} as Record<any, number>,
        markedForExport: 0,
        totalFileSize: 0
      };
    }
    
    const stats: AttachmentStats = {
      total: collection.totalCount,
      byType: {} as Record<any, number>,
      bySource: {} as Record<any, number>,
      markedForExport: collection.markedForExportCount,
      totalFileSize: 0
    };
    
    collection.attachments.forEach(attachment => {
      // Count by type
      stats.byType[attachment.type] = (stats.byType[attachment.type] || 0) + 1;
      
      // Count by source
      stats.bySource[attachment.source] = (stats.bySource[attachment.source] || 0) + 1;
      
      // Sum file sizes (if available)
      if (attachment.metadata.fileSize) {
        stats.totalFileSize += attachment.metadata.fileSize;
      }
    });
    
    return stats;
  }

  /**
   * Prepare attachments for PDF export with base64 conversion
   */
  static async prepareAttachmentsForPDF(projectId: string): Promise<ProjectAttachment[]> {
    const exportAttachments = this.getExportAttachments(projectId);
    
    // Convert images to base64 for PDF embedding
    const processedAttachments = await Promise.all(
      exportAttachments.map(async (attachment) => {
        try {
          if (!attachment.base64Data) {
            attachment.base64Data = await this.urlToBase64(attachment.url);
          }
          return attachment;
        } catch (error) {
          console.error(`Failed to process attachment ${attachment.id}:`, error);
          return null;
        }
      })
    );
    
    return processedAttachments.filter(Boolean) as ProjectAttachment[];
  }

  /**
   * Clear all project attachments
   */
  static clearProjectAttachments(projectId: string): void {
    this.attachments.delete(projectId);
  }

  /**
   * Get attachment by ID
   */
  static getAttachment(projectId: string, attachmentId: string): ProjectAttachment | null {
    const collection = this.attachments.get(projectId);
    if (!collection) return null;
    
    return collection.attachments.find(a => a.id === attachmentId) || null;
  }
}