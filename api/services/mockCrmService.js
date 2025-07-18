// Mock CRM Service - Provides sample data for development/demo purposes
// Replace this with the full crmService.js when Supabase CRM tables are set up

class MockCRMService {
  constructor() {
    // Sample data for demo purposes
    this.mockCustomers = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        company: 'Smith Residential',
        address: '123 Main St, Anytown, CA 90210',
        source: 'website',
        tags: ['residential', 'new-construction'],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'New home construction project, looking for electrical service upgrade'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@johnsonelectric.com',
        phone: '(555) 987-6543',
        company: 'Johnson Electric Co.',
        address: '456 Oak Ave, Business District, CA 90211',
        source: 'referral',
        tags: ['commercial', 'panel-upgrade'],
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Commercial panel upgrade for office building'
      },
      {
        id: '3',
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '(555) 456-7890',
        company: 'Chen Solar Solutions',
        address: '789 Pine St, Solar City, CA 90212',
        source: 'google',
        tags: ['solar', 'battery-storage'],
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Solar installation with battery backup system'
      }
    ];

    this.mockStages = [
      {
        id: 'stage-1',
        name: 'Lead',
        description: 'Initial contact and qualification',
        color: '#ef4444',
        order_index: 1,
        automations: []
      },
      {
        id: 'stage-2',
        name: 'Site Visit',
        description: 'Scheduled site assessment',
        color: '#f97316',
        order_index: 2,
        automations: []
      },
      {
        id: 'stage-3',
        name: 'Proposal',
        description: 'Quote prepared and sent',
        color: '#eab308',
        order_index: 3,
        automations: []
      },
      {
        id: 'stage-4',
        name: 'Contracted',
        description: 'Project approved and contracted',
        color: '#22c55e',
        order_index: 4,
        automations: []
      },
      {
        id: 'stage-5',
        name: 'Completed',
        description: 'Project finished and invoiced',
        color: '#3b82f6',
        order_index: 5,
        automations: []
      }
    ];

    this.mockProjects = [
      {
        id: 'proj-1',
        customer_id: '1',
        stage_id: 'stage-2',
        name: 'Smith Residence - Service Upgrade',
        description: '200A panel upgrade for new home',
        value: 3500,
        expected_close_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        tags: ['residential', 'panel-upgrade'],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        customer: this.mockCustomers[0],
        stage: this.mockStages[1]
      },
      {
        id: 'proj-2',
        customer_id: '2',
        stage_id: 'stage-3',
        name: 'Johnson Electric - Commercial Upgrade',
        description: 'Main electrical panel upgrade for office building',
        value: 12000,
        expected_close_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        tags: ['commercial', 'panel-upgrade'],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        customer: this.mockCustomers[1],
        stage: this.mockStages[2]
      },
      {
        id: 'proj-3',
        customer_id: '3',
        stage_id: 'stage-1',
        name: 'Chen Solar - Solar Installation',
        description: '10kW solar system with battery storage',
        value: 25000,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        tags: ['solar', 'battery'],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        customer: this.mockCustomers[2],
        stage: this.mockStages[0]
      }
    ];

    this.mockActivities = [
      {
        id: 'act-1',
        project_id: 'proj-1',
        customer_id: '1',
        type: 'call',
        title: 'Initial consultation call',
        description: 'Discussed project requirements and timeline',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_at: null
      },
      {
        id: 'act-2',
        project_id: 'proj-2',
        customer_id: '2',
        type: 'site_visit',
        title: 'Site assessment completed',
        description: 'Measured existing panel and assessed upgrade requirements',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_at: null
      }
    ];

    this.mockTasks = [
      {
        id: 'task-1',
        project_id: 'proj-1',
        customer_id: '1',
        title: 'Prepare load calculation',
        description: 'Complete electrical load calculation for permit application',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'task-2',
        project_id: 'proj-2',
        customer_id: '2',
        title: 'Schedule permit inspection',
        description: 'Coordinate with city inspector for permit review',
        status: 'in_progress',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    ];
  }

  // Helper method - for mock service, just return the user ID
  async getUserId(userIdFromAuth) {
    return userIdFromAuth;
  }

  // Customer Management
  async getCustomers(userId, filters = {}) {
    // In a real implementation, filter by userId
    let customers = [...this.mockCustomers];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.company && c.company.toLowerCase().includes(search))
      );
    }
    
    return customers;
  }

  async createCustomer(userId, customerData) {
    const newCustomer = {
      id: `customer-${Date.now()}`,
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: customerData.tags || [],
      custom_fields: customerData.custom_fields || {},
      external_ids: customerData.external_ids || {},
      metadata: customerData.metadata || {}
    };
    
    this.mockCustomers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(userId, customerId, updates) {
    const customerIndex = this.mockCustomers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }
    
    this.mockCustomers[customerIndex] = {
      ...this.mockCustomers[customerIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return this.mockCustomers[customerIndex];
  }

  async deleteCustomer(userId, customerId) {
    const customerIndex = this.mockCustomers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }
    
    this.mockCustomers.splice(customerIndex, 1);
    return true;
  }

  // Stage Management
  async getStages(userId) {
    return [...this.mockStages];
  }

  async createStage(userId, stageData) {
    const newStage = {
      id: `stage-${Date.now()}`,
      order_index: this.mockStages.length + 1,
      automations: [],
      ...stageData
    };
    
    this.mockStages.push(newStage);
    return newStage;
  }

  async updateStage(userId, stageId, updates) {
    const stageIndex = this.mockStages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) {
      throw new Error('Stage not found');
    }
    
    this.mockStages[stageIndex] = { ...this.mockStages[stageIndex], ...updates };
    return this.mockStages[stageIndex];
  }

  async reorderStages(userId, stageIds) {
    // Reorder stages based on provided IDs
    const reorderedStages = stageIds.map((id, index) => {
      const stage = this.mockStages.find(s => s.id === id);
      return { ...stage, order_index: index + 1 };
    });
    
    this.mockStages.splice(0, this.mockStages.length, ...reorderedStages);
    return true;
  }

  async deleteStage(userId, stageId) {
    const stageIndex = this.mockStages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) {
      throw new Error('Stage not found');
    }
    
    // Check if stage has projects
    const hasProjects = this.mockProjects.some(p => p.stage_id === stageId);
    if (hasProjects) {
      throw new Error('Cannot delete stage that contains projects');
    }
    
    this.mockStages.splice(stageIndex, 1);
    return true;
  }

  // Project Management
  async getProjects(userId, filters = {}) {
    let projects = [...this.mockProjects];
    
    if (filters.stage_ids && filters.stage_ids.length > 0) {
      projects = projects.filter(p => filters.stage_ids.includes(p.stage_id));
    }
    
    return projects;
  }

  async createProject(userId, projectData) {
    const customer = this.mockCustomers.find(c => c.id === projectData.customer_id);
    const stage = this.mockStages.find(s => s.id === projectData.stage_id);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const newProject = {
      id: `project-${Date.now()}`,
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer,
      stage,
      tags: projectData.tags || [],
      custom_fields: projectData.custom_fields || {},
      external_ids: projectData.external_ids || {},
      metadata: projectData.metadata || {}
    };
    
    this.mockProjects.push(newProject);
    
    // Create activity
    await this.createActivity(userId, {
      project_id: newProject.id,
      customer_id: projectData.customer_id,
      type: 'note',
      title: 'Project created',
      description: `New project created in ${stage?.name || 'Unknown'} stage`
    });
    
    return newProject;
  }

  async updateProject(userId, projectId, updates) {
    const projectIndex = this.mockProjects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    this.mockProjects[projectIndex] = {
      ...this.mockProjects[projectIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return this.mockProjects[projectIndex];
  }

  async moveProjectStage(userId, projectId, newStageId) {
    const project = await this.updateProject(userId, projectId, { stage_id: newStageId });
    const stage = this.mockStages.find(s => s.id === newStageId);
    
    return { ...project, stage };
  }

  async deleteProject(userId, projectId) {
    const projectIndex = this.mockProjects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    this.mockProjects.splice(projectIndex, 1);
    return true;
  }

  // Activity Management
  async getActivities(userId, filters = {}) {
    let activities = [...this.mockActivities];
    
    if (filters.project_id) {
      activities = activities.filter(a => a.project_id === filters.project_id);
    }
    
    if (filters.customer_id) {
      activities = activities.filter(a => a.customer_id === filters.customer_id);
    }
    
    return activities;
  }

  async createActivity(userId, activityData) {
    const newActivity = {
      id: `activity-${Date.now()}`,
      user_id: userId,
      metadata: {},
      ...activityData,
      created_at: new Date().toISOString()
    };
    
    this.mockActivities.push(newActivity);
    return newActivity;
  }

  // Task Management
  async getTasks(userId, filters = {}) {
    let tasks = [...this.mockTasks];
    
    if (filters.status && filters.status.length > 0) {
      tasks = tasks.filter(t => filters.status.includes(t.status));
    }
    
    if (filters.project_id) {
      tasks = tasks.filter(t => t.project_id === filters.project_id);
    }
    
    return tasks;
  }

  async createTask(userId, taskData) {
    const newTask = {
      id: `task-${Date.now()}`,
      user_id: userId,
      metadata: {},
      ...taskData,
      created_at: new Date().toISOString()
    };
    
    this.mockTasks.push(newTask);
    return newTask;
  }

  async updateTask(userId, taskId, updates) {
    const taskIndex = this.mockTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    this.mockTasks[taskIndex] = {
      ...this.mockTasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return this.mockTasks[taskIndex];
  }

  // Dashboard and Analytics
  async getDashboardMetrics(userId, period = 'month') {
    const totalCustomers = this.mockCustomers.length;
    const totalProjects = this.mockProjects.length;
    const totalValue = this.mockProjects.reduce((sum, p) => sum + (p.value || 0), 0);
    const activeTasks = this.mockTasks.filter(t => t.status !== 'completed').length;
    
    return {
      totalCustomers,
      totalProjects,
      totalValue,
      activeTasks,
      conversionRate: 0.25, // 25%
      averageProjectValue: totalValue / totalProjects || 0,
      recentActivities: this.mockActivities.slice(0, 5),
      upcomingTasks: this.mockTasks.filter(t => t.status !== 'completed').slice(0, 5)
    };
  }

  async getPipelineData(userId) {
    return this.mockStages.map(stage => {
      const stageProjects = this.mockProjects.filter(p => p.stage_id === stage.id);
      return {
        stage,
        projects: stageProjects,
        totalValue: stageProjects.reduce((sum, p) => sum + (p.value || 0), 0),
        projectCount: stageProjects.length
      };
    });
  }
}

export const mockCrmService = new MockCRMService();