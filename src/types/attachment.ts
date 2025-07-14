// Project Attachment Types
// For managing aerial view images, site photos, and other attachments for permit applications

export interface ProjectAttachment {
  id: string;
  name: string;
  description?: string;
  type: AttachmentType;
  source: AttachmentSource;
  url: string;
  base64Data?: string; // For embedding in PDFs
  metadata: AttachmentMetadata;
  createdAt: Date;
  markedForExport: boolean;
  exportOptions: ExportOptions;
}

export type AttachmentType = 
  | 'satellite_image'
  | 'street_view'
  | 'solar_analysis'
  | 'site_photo'
  | 'electrical_diagram'
  | 'permit_document'
  | 'other';

export type AttachmentSource = 
  | 'google_maps'
  | 'google_streetview'
  | 'google_solar'
  | 'user_upload'
  | 'generated'
  | 'external_url';

export interface AttachmentMetadata {
  // Common metadata
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  
  // Location-based metadata
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Aerial view specific
  zoom?: number;
  mapType?: string;
  captureDate?: Date;
  
  // Street view specific
  heading?: number;
  pitch?: number;
  fov?: number;
  
  // Solar analysis specific
  roofSegments?: number;
  maxPanels?: number;
  solarPotential?: number;
  
  // Custom metadata
  [key: string]: any;
}

export interface ExportOptions {
  includeInPDF: boolean;
  pdfSection: PDFSection;
  pageSize?: 'full' | 'half' | 'quarter';
  caption?: string;
  showMetadata: boolean;
  order: number; // For controlling order in PDF
}

export type PDFSection = 
  | 'cover'
  | 'site_overview'
  | 'aerial_views'
  | 'electrical_layout'
  | 'solar_analysis'
  | 'appendix';

export interface AttachmentCollection {
  projectId: string;
  attachments: ProjectAttachment[];
  totalCount: number;
  markedForExportCount: number;
  lastUpdated: Date;
}

// Utility types for filtering and organizing attachments
export interface AttachmentFilter {
  type?: AttachmentType[];
  source?: AttachmentSource[];
  markedForExport?: boolean;
  hasCoordinates?: boolean;
}

export interface AttachmentStats {
  total: number;
  byType: Record<AttachmentType, number>;
  bySource: Record<AttachmentSource, number>;
  markedForExport: number;
  totalFileSize: number;
}

// For aerial view integration
export interface AerialViewCaptureResult {
  attachments: ProjectAttachment[];
  success: boolean;
  errors?: string[];
}

// For bulk operations
export interface BulkAttachmentOperation {
  action: 'mark_for_export' | 'unmark_for_export' | 'delete' | 'update_section';
  attachmentIds: string[];
  options?: Partial<ExportOptions>;
}