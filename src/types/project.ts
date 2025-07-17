import type { LoadItem } from './load';
import type { ComplianceData } from './compliance';

export interface ProjectMetadata {
  id: string;
  databaseId?: string; // ID in the database (Supabase)
  name: string;
  description: string;
  created: string;
  modified: string;
  version: string;
  author: string;
  templateUsed?: string;
  isTemplate: boolean;
  tags: string[];
  thumbnail?: string;
  logoData?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    license: string;
  };
}

export interface ProjectData {
  metadata: ProjectMetadata;
  settings: any;
  loads: any;
  sldDiagram: any;
  aerialView: any;
  calculations: any;
  reports: any;
  compliance?: ComplianceData;
  assets: {
    logos: { [key: string]: string };
    images: { [key: string]: string };
    documents: { [key: string]: any };
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'industrial' | 'solar' | 'evse' | 'custom';
  thumbnail: string;
  defaultValues: Partial<ProjectData>;
  isBuiltIn: boolean;
  tags: string[];
}

export interface DetailedProjectTemplate {
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
  popularity: number;
}
