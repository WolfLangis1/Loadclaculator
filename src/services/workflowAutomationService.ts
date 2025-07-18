// Workflow Automation and Notifications Service
// Handles automated business processes and notifications for the CRM system

import type { 
  Customer, 
  CRMProject, 
  Activity, 
  CreateActivityRequest 
} from '../types/crm';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
}

export interface WorkflowTrigger {
  type: 'project_created' | 'project_updated' | 'stage_changed' | 'customer_created' | 
        'activity_created' | 'time_based' | 'email_received' | 'value_threshold';
  entity: 'project' | 'customer' | 'activity' | 'email';
  event?: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for Sunday-Saturday
    dayOfMonth?: number; // 1-31
  };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'is_empty';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_email' | 'create_activity' | 'update_project' | 'assign_task' | 
        'send_notification' | 'external_webhook' | 'ai_analysis';
  parameters: Record<string, any>;
  delay?: number; // Minutes to delay execution
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  sms: boolean;
  webhooks: string[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedEntity?: {
    type: 'customer' | 'project' | 'activity';
    id: string;
    name: string;
  };
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  parameters?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'danger';
}

class WorkflowAutomationService {
  private static instance: WorkflowAutomationService;
  private workflowRules: WorkflowRule[] = [];
  private notifications: Notification[] = [];
  private notificationPreferences: NotificationPreferences = {
    email: true,
    browser: true,
    sms: false,
    webhooks: [],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  };

  private constructor() {
    this.initializeDefaultWorkflows();
    this.startScheduler();
  }

  static getInstance(): WorkflowAutomationService {
    if (!WorkflowAutomationService.instance) {
      WorkflowAutomationService.instance = new WorkflowAutomationService();
    }
    return WorkflowAutomationService.instance;
  }

  // Workflow Management
  createWorkflow(workflow: Omit<WorkflowRule, 'id' | 'createdAt' | 'executionCount'>): WorkflowRule {
    const newWorkflow: WorkflowRule = {
      ...workflow,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      executionCount: 0
    };

    this.workflowRules.push(newWorkflow);
    this.saveToStorage();
    return newWorkflow;
  }

  updateWorkflow(id: string, updates: Partial<WorkflowRule>): WorkflowRule | null {
    const index = this.workflowRules.findIndex(w => w.id === id);
    if (index === -1) return null;

    this.workflowRules[index] = { ...this.workflowRules[index], ...updates };
    this.saveToStorage();
    return this.workflowRules[index];
  }

  deleteWorkflow(id: string): boolean {
    const index = this.workflowRules.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.workflowRules.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getWorkflows(): WorkflowRule[] {
    return [...this.workflowRules];
  }

  getActiveWorkflows(): WorkflowRule[] {
    return this.workflowRules.filter(w => w.isActive);
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, triggerData: any): Promise<boolean> {
    const workflow = this.workflowRules.find(w => w.id === workflowId);
    if (!workflow || !workflow.isActive) return false;

    try {
      // Check conditions
      const conditionsMatch = this.evaluateConditions(workflow.conditions, triggerData);
      if (!conditionsMatch) return false;

      // Execute actions
      for (const action of workflow.actions) {
        if (action.delay && action.delay > 0) {
          setTimeout(() => this.executeAction(action, triggerData), action.delay * 60 * 1000);
        } else {
          await this.executeAction(action, triggerData);
        }
      }

      // Update execution stats
      workflow.executionCount++;
      workflow.lastExecuted = new Date().toISOString();
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      return false;
    }
  }

  // Trigger Processing
  async processProjectTrigger(
    triggerType: 'project_created' | 'project_updated' | 'stage_changed',
    project: CRMProject,
    previousState?: Partial<CRMProject>
  ): Promise<void> {
    const relevantWorkflows = this.getActiveWorkflows().filter(w => 
      w.trigger.type === triggerType && w.trigger.entity === 'project'
    );

    for (const workflow of relevantWorkflows) {
      await this.executeWorkflow(workflow.id, { 
        project, 
        previousState,
        timestamp: new Date().toISOString()
      });
    }
  }

  async processCustomerTrigger(
    triggerType: 'customer_created',
    customer: Customer
  ): Promise<void> {
    const relevantWorkflows = this.getActiveWorkflows().filter(w => 
      w.trigger.type === triggerType && w.trigger.entity === 'customer'
    );

    for (const workflow of relevantWorkflows) {
      await this.executeWorkflow(workflow.id, { 
        customer,
        timestamp: new Date().toISOString()
      });
    }
  }

  async processActivityTrigger(
    triggerType: 'activity_created',
    activity: Activity
  ): Promise<void> {
    const relevantWorkflows = this.getActiveWorkflows().filter(w => 
      w.trigger.type === triggerType && w.trigger.entity === 'activity'
    );

    for (const workflow of relevantWorkflows) {
      await this.executeWorkflow(workflow.id, { 
        activity,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Notification Management
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    this.notifications.unshift(newNotification);
    this.trimNotifications();
    this.saveToStorage();

    // Send notification based on preferences
    this.sendNotification(newNotification);

    return newNotification;
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;

    notification.isRead = true;
    this.saveToStorage();
    return true;
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.saveToStorage();
  }

  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return false;

    this.notifications.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getNotifications(unreadOnly = false): Notification[] {
    let notifications = [...this.notifications];
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Remove expired notifications
    const now = new Date();
    notifications = notifications.filter(n => 
      !n.expiresAt || new Date(n.expiresAt) > now
    );

    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUnreadCount(): number {
    return this.getNotifications(true).length;
  }

  // Smart Notifications
  createProjectDeadlineNotification(project: CRMProject): void {
    if (!project.expected_close_date) return;

    const closeDate = new Date(project.expected_close_date);
    const now = new Date();
    const daysUntilClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    let message = '';

    if (daysUntilClose <= 1) {
      priority = 'urgent';
      message = `Project "${project.customer?.name || 'Unknown'}" is due tomorrow!`;
    } else if (daysUntilClose <= 3) {
      priority = 'high';
      message = `Project "${project.customer?.name || 'Unknown'}" is due in ${daysUntilClose} days`;
    } else if (daysUntilClose <= 7) {
      priority = 'medium';
      message = `Project "${project.customer?.name || 'Unknown'}" is due in ${daysUntilClose} days`;
    }

    if (message) {
      this.createNotification({
        type: 'warning',
        title: 'Project Deadline Approaching',
        message,
        priority,
        relatedEntity: {
          type: 'project',
          id: project.id,
          name: project.customer?.name || 'Unknown Project'
        },
        actions: [
          {
            label: 'View Project',
            action: 'navigate_to_project',
            parameters: { projectId: project.id },
            style: 'primary'
          },
          {
            label: 'Update Timeline',
            action: 'update_project_timeline',
            parameters: { projectId: project.id },
            style: 'secondary'
          }
        ]
      });
    }
  }

  createFollowUpReminder(customer: Customer, project?: CRMProject): void {
    this.createNotification({
      type: 'info',
      title: 'Follow-up Reminder',
      message: `Time to follow up with ${customer.name}${project ? ` about their ${project.custom_fields?.projectType || 'electrical'} project` : ''}`,
      priority: 'medium',
      relatedEntity: {
        type: 'customer',
        id: customer.id,
        name: customer.name
      },
      actions: [
        {
          label: 'Send Email',
          action: 'compose_email',
          parameters: { customerId: customer.id },
          style: 'primary'
        },
        {
          label: 'Schedule Call',
          action: 'schedule_call',
          parameters: { customerId: customer.id },
          style: 'secondary'
        }
      ]
    });
  }

  createQuoteExpirationNotification(project: CRMProject): void {
    this.createNotification({
      type: 'warning',
      title: 'Quote Expiring Soon',
      message: `Quote for ${project.customer?.name || 'customer'} expires in 3 days`,
      priority: 'high',
      relatedEntity: {
        type: 'project',
        id: project.id,
        name: project.customer?.name || 'Unknown Project'
      },
      actions: [
        {
          label: 'Follow Up',
          action: 'follow_up_quote',
          parameters: { projectId: project.id },
          style: 'primary'
        },
        {
          label: 'Extend Quote',
          action: 'extend_quote',
          parameters: { projectId: project.id },
          style: 'secondary'
        }
      ]
    });
  }

  // Helper Methods
  private evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], data);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }

  private evaluateCondition(condition: WorkflowCondition, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeAction(action: WorkflowAction, triggerData: any): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.executeEmailAction(action.parameters, triggerData);
        break;
      case 'create_activity':
        await this.executeCreateActivityAction(action.parameters, triggerData);
        break;
      case 'send_notification':
        this.executeNotificationAction(action.parameters, triggerData);
        break;
      case 'ai_analysis':
        await this.executeAIAnalysisAction(action.parameters, triggerData);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  private async executeEmailAction(parameters: any, triggerData: any): Promise<void> {
    // This would integrate with the Gmail service
    console.log('Sending automated email:', parameters, triggerData);
  }

  private async executeCreateActivityAction(parameters: any, triggerData: any): Promise<void> {
    // This would integrate with the CRM service to create activities
    console.log('Creating automated activity:', parameters, triggerData);
  }

  private executeNotificationAction(parameters: any, triggerData: any): void {
    this.createNotification({
      type: parameters.type || 'info',
      title: parameters.title || 'Automated Notification',
      message: this.replacePlaceholders(parameters.message || '', triggerData),
      priority: parameters.priority || 'medium'
    });
  }

  private async executeAIAnalysisAction(parameters: any, triggerData: any): Promise<void> {
    // This would integrate with the Gemini AI service
    console.log('Executing AI analysis:', parameters, triggerData);
  }

  private replacePlaceholders(template: string, data: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private sendNotification(notification: Notification): void {
    if (this.isQuietHours()) return;

    if (this.notificationPreferences.browser) {
      this.sendBrowserNotification(notification);
    }

    // Additional notification channels would be implemented here
  }

  private sendBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }

  private isQuietHours(): boolean {
    if (!this.notificationPreferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.notificationPreferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.notificationPreferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private trimNotifications(): void {
    const maxNotifications = 100;
    if (this.notifications.length > maxNotifications) {
      this.notifications.splice(maxNotifications);
    }
  }

  private startScheduler(): void {
    // Check for time-based workflows every minute
    setInterval(() => {
      this.processTimeBasedWorkflows();
    }, 60 * 1000);
  }

  private processTimeBasedWorkflows(): void {
    const now = new Date();
    const timeBasedWorkflows = this.getActiveWorkflows().filter(w => 
      w.trigger.type === 'time_based' && w.trigger.schedule
    );

    for (const workflow of timeBasedWorkflows) {
      if (this.shouldExecuteScheduledWorkflow(workflow, now)) {
        this.executeWorkflow(workflow.id, { timestamp: now.toISOString() });
      }
    }
  }

  private shouldExecuteScheduledWorkflow(workflow: WorkflowRule, now: Date): boolean {
    const schedule = workflow.trigger.schedule;
    if (!schedule) return false;

    const lastExecuted = workflow.lastExecuted ? new Date(workflow.lastExecuted) : null;
    
    switch (schedule.frequency) {
      case 'daily':
        if (lastExecuted && now.getDate() === lastExecuted.getDate()) return false;
        return schedule.time ? this.isTimeMatch(now, schedule.time) : true;
      
      case 'weekly':
        if (lastExecuted && now.getTime() - lastExecuted.getTime() < 7 * 24 * 60 * 60 * 1000) return false;
        return schedule.dayOfWeek ? now.getDay() === schedule.dayOfWeek : true;
      
      case 'monthly':
        if (lastExecuted && now.getMonth() === lastExecuted.getMonth()) return false;
        return schedule.dayOfMonth ? now.getDate() === schedule.dayOfMonth : true;
      
      default:
        return false;
    }
  }

  private isTimeMatch(now: Date, targetTime: string): boolean {
    const [targetHour, targetMinute] = targetTime.split(':').map(Number);
    return now.getHours() === targetHour && now.getMinutes() === targetMinute;
  }

  private initializeDefaultWorkflows(): void {
    // Create some default workflows for common electrical contractor scenarios
    const defaultWorkflows: Omit<WorkflowRule, 'id' | 'createdAt' | 'executionCount'>[] = [
      {
        name: 'New Lead Follow-up',
        description: 'Automatically create follow-up task when a new project is created',
        trigger: { type: 'project_created', entity: 'project' },
        conditions: [
          { field: 'stage.name', operator: 'equals', value: 'Lead' }
        ],
        actions: [
          {
            type: 'create_activity',
            parameters: {
              type: 'task',
              title: 'Follow up with new lead',
              description: 'Contact {{project.customer.name}} about their electrical project',
              dueDate: '+2 days'
            },
            delay: 60 // 1 hour delay
          }
        ],
        isActive: true
      },
      {
        name: 'Project Deadline Reminder',
        description: 'Send notification 3 days before project deadline',
        trigger: { type: 'time_based', entity: 'project', schedule: { frequency: 'daily', time: '09:00' } },
        conditions: [
          { field: 'expected_close_date', operator: 'exists', value: true }
        ],
        actions: [
          {
            type: 'send_notification',
            parameters: {
              type: 'warning',
              title: 'Project Deadline Approaching',
              message: 'Project {{project.customer.name}} is due in 3 days',
              priority: 'high'
            }
          }
        ],
        isActive: true
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.createWorkflow(workflow);
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('crm_workflows', JSON.stringify(this.workflowRules));
      localStorage.setItem('crm_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('crm_notification_preferences', JSON.stringify(this.notificationPreferences));
    } catch (error) {
      console.error('Failed to save workflow data to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const workflows = localStorage.getItem('crm_workflows');
      if (workflows) {
        this.workflowRules = JSON.parse(workflows);
      }

      const notifications = localStorage.getItem('crm_notifications');
      if (notifications) {
        this.notifications = JSON.parse(notifications);
      }

      const preferences = localStorage.getItem('crm_notification_preferences');
      if (preferences) {
        this.notificationPreferences = { ...this.notificationPreferences, ...JSON.parse(preferences) };
      }
    } catch (error) {
      console.error('Failed to load workflow data from storage:', error);
    }
  }
}

export const workflowService = WorkflowAutomationService.getInstance();