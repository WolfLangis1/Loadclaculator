export type AttachmentType = 'satellite_image' | 'street_view' | 'solar_analysis' | 'electrical_diagram' | 'site_photo' | 'document' | 'annotated_image' | 'measurement_data' | 'other';
export type AttachmentSource = 'google_maps' | 'user_upload' | 'system_generated' | 'ai_analysis';

export interface ExportOptions {
  includeInPDF: boolean;
  pdfSection: 'aerial_views' | 'site_overview' | 'solar_analysis' | 'electrical_layout' | 'appendix' | string;
  pageSize: 'full' | 'half' | 'quarter';
  showMetadata: boolean;
  order: number;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  description?: string;
  type: AttachmentType;
  source: AttachmentSource;
  url: string;
  metadata: {
    width?: number;
    height?: number;
    mimeType?: string;
    fileSize?: number;
    captureDate?: Date;
    address?: string;
    coordinates?: { latitude: number; longitude: number };
    zoom?: number;
    heading?: number;
  };
  createdAt: Date;
  markedForExport: boolean;
  exportOptions: ExportOptions;
  base64Data?: string; // For PDF embedding
}

export interface AttachmentCollection {
  projectId: string;
  attachments: ProjectAttachment[];
  totalCount: number;
  markedForExportCount: number;
  lastUpdated: Date;
}

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

export interface AerialViewCaptureResult {
  imageUrl: string;
  metadata: {
    address?: string;
    coordinates?: { latitude: number; longitude: number };
    zoom?: number;
    heading?: number;
    description?: string;
  };
}

export interface BulkAttachmentOperation {
  action: 'mark_for_export' | 'unmark_for_export' | 'update_section' | 'delete';
  attachmentIds: string[];
  options?: Partial<ExportOptions>;
}
