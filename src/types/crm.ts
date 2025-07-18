// CRM Type Definitions
// Types for the Customer Relationship Management system

export type LeadSource = 'website' | 'referral' | 'advertising' | 'social_media' | 'cold_call' | 'trade_show' | 'other';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityType = 'call' | 'email' | 'meeting' | 'site_visit' | 'proposal_sent' | 'contract_signed' | 'installation' | 'follow_up' | 'note';
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

// Address interface for consistent address handling
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Customer interface
export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: Address;
  source: LeadSource;
  tags: string[];
  custom_fields: Record<string, any>;
  notes?: string;
  hubspot_id?: string;
  external_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

// CRM Pipeline Stage
export interface CRMStage {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  order_index: number;
  color: string;
  is_closed: boolean;
  automations: StageAutomation[];
  created_at: string;
  updated_at: string;
}

// Stage automation configuration
export interface StageAutomation {
  trigger: 'enter' | 'exit' | 'duration';
  condition?: string;
  action: 'create_task' | 'send_email' | 'move_stage' | 'update_field';
  parameters: Record<string, any>;
}

// CRM Project (extends regular project with CRM data)
export interface CRMProject {
  id: string;
  project_id?: string; // Link to existing project
  customer_id: string;
  stage_id: string;
  value?: number;
  probability: number; // 0-100
  expected_close_date?: string;
  actual_close_date?: string;
  assigned_to?: string;
  source: LeadSource;
  priority: ProjectPriority;
  tags: string[];
  custom_fields: Record<string, any>;
  hubspot_deal_id?: string;
  external_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  
  // Populated relations
  customer?: Customer;
  stage?: CRMStage;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  activities?: Activity[];
  tasks?: Task[];
}

// Activity interface
export interface Activity {
  id: string;
  user_id: string;
  project_id?: string;
  customer_id?: string;
  type: ActivityType;
  title: string;
  description?: string;
  duration_minutes?: number;
  scheduled_at?: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  
  // Populated relations
  user?: {
    id: string;
    name: string;
    email: string;
  };
  project?: CRMProject;
  customer?: Customer;
}

// Task interface
export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  customer_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: ProjectPriority;
  status: TaskStatus;
  assigned_to?: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  project?: CRMProject;
  customer?: Customer;
}

// Integration configuration
export interface Integration {
  id: string;
  user_id: string;
  service: string;
  config: Record<string, any>;
  status: IntegrationStatus;
  last_sync?: string;
  sync_status?: string;
  error_message?: string;
  sync_stats: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalCustomers: number;
  activeProjects: number;
  totalValue: number;
  conversionRate: number;
  period: string;
  periodStart: string;
  recentActivities: Activity[];
  upcomingTasks: Task[];
  pipelineData: {
    stage_id: string;
    stage_name: string;
    project_count: number;
    total_value: number;
  }[];
}

// Create/Update request types
export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: Address;
  source?: LeadSource;
  tags?: string[];
  custom_fields?: Record<string, any>;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}

export interface CreateCRMProjectRequest {
  customer_id: string;
  stage_id: string;
  value?: number;
  probability?: number;
  expected_close_date?: string;
  assigned_to?: string;
  source?: LeadSource;
  priority?: ProjectPriority;
  tags?: string[];
  custom_fields?: Record<string, any>;
  
  // Optional link to existing project
  project_id?: string;
}

export interface UpdateCRMProjectRequest extends Partial<CreateCRMProjectRequest> {
  id: string;
  actual_close_date?: string;
}

export interface CreateStageRequest {
  name: string;
  description?: string;
  color?: string;
  is_closed?: boolean;
  automations?: StageAutomation[];
}

export interface UpdateStageRequest extends Partial<CreateStageRequest> {
  id: string;
  order_index?: number;
}

export interface CreateActivityRequest {
  project_id?: string;
  customer_id?: string;
  type: ActivityType;
  title: string;
  description?: string;
  duration_minutes?: number;
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskRequest {
  project_id?: string;
  customer_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: ProjectPriority;
  assigned_to?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
  status?: TaskStatus;
  completed_at?: string;
}

// Filter interfaces
export interface CustomerFilters {
  search?: string;
  source?: LeadSource[];
  tags?: string[];
  hasProjects?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface ProjectFilters {
  search?: string;
  stage_ids?: string[];
  assigned_to?: string[];
  priority?: ProjectPriority[];
  source?: LeadSource[];
  tags?: string[];
  valueMin?: number;
  valueMax?: number;
  expectedCloseAfter?: string;
  expectedCloseBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface ActivityFilters {
  type?: ActivityType[];
  project_id?: string;
  customer_id?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: ProjectPriority[];
  assigned_to?: string[];
  project_id?: string;
  customer_id?: string;
  dueAfter?: string;
  dueBefore?: string;
  overdue?: boolean;
}

// API Response types
export interface CRMApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Pipeline view data
export interface PipelineStageData {
  stage: CRMStage;
  projects: CRMProject[];
  totalValue: number;
  projectCount: number;
}

export interface PipelineData {
  stages: PipelineStageData[];
  totalValue: number;
  totalProjects: number;
}

// Analytics types
export interface AnalyticsPeriod {
  start: string;
  end: string;
  label: string;
}

export interface SalesMetrics {
  period: AnalyticsPeriod;
  revenue: number;
  projectsWon: number;
  projectsLost: number;
  averageDealSize: number;
  salesCycleLength: number;
  conversionRate: number;
}

export interface CustomerMetrics {
  period: AnalyticsPeriod;
  newCustomers: number;
  activeCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  topSources: { source: LeadSource; count: number; percentage: number }[];
}

export interface ActivityMetrics {
  period: AnalyticsPeriod;
  totalActivities: number;
  activitiesByType: { type: ActivityType; count: number }[];
  averageActivitiesPerProject: number;
  responseTime: number; // in hours
}

// Integration-specific types
export interface HubSpotConfig {
  accessToken: string;
  refreshToken: string;
  portalId: string;
  expiresAt: string;
  scopes: string[];
}

export interface GoogleDriveConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  rootFolderId?: string;
}

export interface CompanyCamConfig {
  apiKey: string;
  webhookUrl?: string;
  projectMapping: Record<string, string>; // CRM project ID -> CompanyCam project ID
}

export interface GeminiAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Webhook payload types
export interface HubSpotWebhook {
  eventId: string;
  subscriptionId: string;
  portalId: string;
  appId: string;
  eventType: string;
  subscriptionType: string;
  attemptNumber: number;
  objectId: string;
  changeSource: string;
  changeFlag: string;
  changeTimestamp: number;
  propertyName?: string;
  propertyValue?: string;
}

export interface CompanyCamWebhook {
  event_type: string;
  project_id: string;
  photo_id?: string;
  user_id: string;
  timestamp: string;
  data: Record<string, any>;
}

// AI Insight types
export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions?: string[];
  metadata: Record<string, any>;
  generated_at: string;
}

export interface QuoteRecommendation {
  projectId: string;
  suggestedValue: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
  competitiveAnalysis?: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    competitors: number;
  };
}

// Error types
export interface CRMError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface IntegrationError extends CRMError {
  service: string;
  retryable: boolean;
  retryAfter?: number;
}

// State management types for React context
export interface CRMState {
  customers: Customer[];
  stages: CRMStage[];
  projects: CRMProject[];
  activities: Activity[];
  tasks: Task[];
  integrations: Integration[];
  dashboardMetrics?: DashboardMetrics;
  pipelineData?: PipelineData;
  loading: {
    customers: boolean;
    projects: boolean;
    activities: boolean;
    tasks: boolean;
    dashboard: boolean;
  };
  error: string | null;
}

export interface CRMActions {
  // Customer actions
  loadCustomers: (filters?: CustomerFilters) => Promise<void>;
  createCustomer: (data: CreateCustomerRequest) => Promise<Customer>;
  updateCustomer: (data: UpdateCustomerRequest) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Project actions
  loadProjects: (filters?: ProjectFilters) => Promise<void>;
  createProject: (data: CreateCRMProjectRequest) => Promise<CRMProject>;
  updateProject: (data: UpdateCRMProjectRequest) => Promise<CRMProject>;
  moveProjectStage: (projectId: string, stageId: string) => Promise<CRMProject>;
  deleteProject: (id: string) => Promise<void>;
  
  // Stage actions
  loadStages: () => Promise<void>;
  createStage: (data: CreateStageRequest) => Promise<CRMStage>;
  updateStage: (data: UpdateStageRequest) => Promise<CRMStage>;
  reorderStages: (stageIds: string[]) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  
  // Activity actions
  loadActivities: (filters?: ActivityFilters) => Promise<void>;
  createActivity: (data: CreateActivityRequest) => Promise<Activity>;
  
  // Task actions
  loadTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<Task>;
  updateTask: (data: UpdateTaskRequest) => Promise<Task>;
  
  // Dashboard actions
  loadDashboardMetrics: (period?: string) => Promise<void>;
  loadPipelineData: () => Promise<void>;
  
  // Integration actions
  loadIntegrations: () => Promise<void>;
  connectIntegration: (service: string, config: Record<string, any>) => Promise<Integration>;
  disconnectIntegration: (service: string) => Promise<void>;
  syncIntegration: (service: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

export interface CRMContextValue extends CRMState, CRMActions {}