// CRM Service - Backend service for Customer Relationship Management
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for CRM service');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class CRMService {
  // Helper method to get user ID - simplified for Supabase auth
  async getUserId(supabaseUserId) {
    // Since we're using Supabase auth directly, the user ID is the Supabase user ID
    return supabaseUserId;
  }

  // Customer Management
  async getCustomers(firebaseUid, filters = {}) {
    const userId = await this.getUserId(firebaseUid);
    
    let query = supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters with proper parameterization to prevent SQL injection
    if (filters.search) {
      // Sanitize search input
      const sanitizedSearch = filters.search.replace(/[%_]/g, '\\$&').trim();
      if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
        query = query.or(`name.ilike.*${sanitizedSearch}*,email.ilike.*${sanitizedSearch}*,company.ilike.*${sanitizedSearch}*`);
      }
    }
    
    if (filters.source && filters.source.length > 0) {
      query = query.in('source', filters.source);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    
    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }
    
    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch customers: ${error.message}`);
    
    return data;
  }

  async createCustomer(firebaseUid, customerData) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_customers')
      .insert({
        user_id: userId,
        ...customerData,
        tags: customerData.tags || [],
        custom_fields: customerData.custom_fields || {},
        external_ids: customerData.external_ids || {},
        metadata: customerData.metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create customer: ${error.message}`);
    return data;
  }

  async updateCustomer(firebaseUid, customerId, updates) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_customers')
      .update(updates)
      .eq('id', customerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update customer: ${error.message}`);
    return data;
  }

  async deleteCustomer(firebaseUid, customerId) {
    const userId = await this.getUserId(firebaseUid);
    
    const { error } = await supabase
      .from('crm_customers')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete customer: ${error.message}`);
    return true;
  }

  // Stage Management
  async getStages(firebaseUid) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('user_id', userId)
      .order('order_index');

    if (error) throw new Error(`Failed to fetch stages: ${error.message}`);
    
    // Initialize default stages if none exist
    if (!data || data.length === 0) {
      await this.initializeDefaultStages(userId);
      return this.getStages(firebaseUid);
    }
    
    return data;
  }

  async initializeDefaultStages(userId) {
    const { error } = await supabase.rpc('initialize_default_crm_stages', {
      p_user_id: userId
    });
    
    if (error) throw new Error(`Failed to initialize default stages: ${error.message}`);
  }

  async createStage(firebaseUid, stageData) {
    const userId = await this.getUserId(firebaseUid);
    
    // Get current max order index
    const { data: maxOrder } = await supabase
      .from('crm_stages')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 1;

    const { data, error } = await supabase
      .from('crm_stages')
      .insert({
        user_id: userId,
        order_index: nextOrderIndex,
        automations: [],
        ...stageData
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create stage: ${error.message}`);
    return data;
  }

  async updateStage(firebaseUid, stageId, updates) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_stages')
      .update(updates)
      .eq('id', stageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update stage: ${error.message}`);
    return data;
  }

  async reorderStages(firebaseUid, stageIds) {
    const userId = await this.getUserId(firebaseUid);
    
    // Update order index for each stage
    const updates = stageIds.map((stageId, index) => 
      supabase
        .from('crm_stages')
        .update({ order_index: index + 1 })
        .eq('id', stageId)
        .eq('user_id', userId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw new Error(`Failed to reorder stages: ${errors[0].error.message}`);
    }
    
    return true;
  }

  async deleteStage(firebaseUid, stageId) {
    const userId = await this.getUserId(firebaseUid);
    
    // Check if stage has projects
    const { data: projects } = await supabase
      .from('crm_projects')
      .select('id')
      .eq('stage_id', stageId)
      .limit(1);

    if (projects && projects.length > 0) {
      throw new Error('Cannot delete stage that contains projects');
    }

    const { error } = await supabase
      .from('crm_stages')
      .delete()
      .eq('id', stageId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete stage: ${error.message}`);
    return true;
  }

  // Project Management
  async getProjects(firebaseUid, filters = {}) {
    const userId = await this.getUserId(firebaseUid);
    
    let query = supabase
      .from('crm_projects')
      .select(`
        *,
        customer:crm_customers(*),
        stage:crm_stages(*)
      `)
      .eq('crm_customers.user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.stage_ids && filters.stage_ids.length > 0) {
      query = query.in('stage_id', filters.stage_ids);
    }
    
    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to);
    }
    
    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }
    
    if (filters.source && filters.source.length > 0) {
      query = query.in('source', filters.source);
    }
    
    if (filters.valueMin !== undefined) {
      query = query.gte('value', filters.valueMin);
    }
    
    if (filters.valueMax !== undefined) {
      query = query.lte('value', filters.valueMax);
    }
    
    if (filters.expectedCloseAfter) {
      query = query.gte('expected_close_date', filters.expectedCloseAfter);
    }
    
    if (filters.expectedCloseBefore) {
      query = query.lte('expected_close_date', filters.expectedCloseBefore);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
    
    return data;
  }

  async createProject(firebaseUid, projectData) {
    const userId = await this.getUserId(firebaseUid);
    
    // Verify customer belongs to user
    const { data: customer } = await supabase
      .from('crm_customers')
      .select('id')
      .eq('id', projectData.customer_id)
      .eq('user_id', userId)
      .single();

    if (!customer) {
      throw new Error('Customer not found or access denied');
    }

    const { data, error } = await supabase
      .from('crm_projects')
      .insert({
        ...projectData,
        tags: projectData.tags || [],
        custom_fields: projectData.custom_fields || {},
        external_ids: projectData.external_ids || {},
        metadata: projectData.metadata || {}
      })
      .select(`
        *,
        customer:crm_customers(*),
        stage:crm_stages(*)
      `)
      .single();

    if (error) throw new Error(`Failed to create project: ${error.message}`);
    
    // Log activity
    await this.createActivity(firebaseUid, {
      project_id: data.id,
      customer_id: projectData.customer_id,
      type: 'note',
      title: 'Project created',
      description: `New project created in ${data.stage.name} stage`
    });

    return data;
  }

  async updateProject(firebaseUid, projectId, updates) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_projects')
      .update(updates)
      .eq('id', projectId)
      .eq('crm_customers.user_id', userId)
      .select(`
        *,
        customer:crm_customers(*),
        stage:crm_stages(*)
      `)
      .single();

    if (error) throw new Error(`Failed to update project: ${error.message}`);
    return data;
  }

  async moveProjectStage(firebaseUid, projectId, newStageId) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data: success, error } = await supabase.rpc('move_project_stage', {
      p_project_id: projectId,
      p_new_stage_id: newStageId,
      p_user_id: userId
    });

    if (error || !success) {
      throw new Error(`Failed to move project stage: ${error?.message || 'Unknown error'}`);
    }

    // Return updated project
    const { data: project } = await supabase
      .from('crm_projects')
      .select(`
        *,
        customer:crm_customers(*),
        stage:crm_stages(*)
      `)
      .eq('id', projectId)
      .single();

    return project;
  }

  async deleteProject(firebaseUid, projectId) {
    const userId = await this.getUserId(firebaseUid);
    
    const { error } = await supabase
      .from('crm_projects')
      .delete()
      .eq('id', projectId)
      .eq('crm_customers.user_id', userId);

    if (error) throw new Error(`Failed to delete project: ${error.message}`);
    return true;
  }

  // Activity Management
  async getActivities(firebaseUid, filters = {}) {
    const userId = await this.getUserId(firebaseUid);
    
    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        project:crm_projects(id, customer:crm_customers(name)),
        customer:crm_customers(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type);
    }
    
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    
    if (filters.scheduledAfter) {
      query = query.gte('scheduled_at', filters.scheduledAfter);
    }
    
    if (filters.scheduledBefore) {
      query = query.lte('scheduled_at', filters.scheduledBefore);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch activities: ${error.message}`);
    
    return data;
  }

  async createActivity(firebaseUid, activityData) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        user_id: userId,
        metadata: {},
        ...activityData
      })
      .select(`
        *,
        project:crm_projects(id, customer:crm_customers(name)),
        customer:crm_customers(name)
      `)
      .single();

    if (error) throw new Error(`Failed to create activity: ${error.message}`);
    return data;
  }

  // Task Management
  async getTasks(firebaseUid, filters = {}) {
    const userId = await this.getUserId(firebaseUid);
    
    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        project:crm_projects(id, customer:crm_customers(name)),
        customer:crm_customers(name)
      `)
      .eq('user_id', userId)
      .order('due_date', { ascending: true, nullsLast: true });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }
    
    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to);
    }
    
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    
    if (filters.dueAfter) {
      query = query.gte('due_date', filters.dueAfter);
    }
    
    if (filters.dueBefore) {
      query = query.lte('due_date', filters.dueBefore);
    }
    
    if (filters.overdue) {
      query = query.lt('due_date', new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
    
    return data;
  }

  async createTask(firebaseUid, taskData) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        user_id: userId,
        metadata: {},
        ...taskData
      })
      .select(`
        *,
        project:crm_projects(id, customer:crm_customers(name)),
        customer:crm_customers(name)
      `)
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data;
  }

  async updateTask(firebaseUid, taskId, updates) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select(`
        *,
        project:crm_projects(id, customer:crm_customers(name)),
        customer:crm_customers(name)
      `)
      .single();

    if (error) throw new Error(`Failed to update task: ${error.message}`);
    return data;
  }

  // Dashboard and Analytics
  async getDashboardMetrics(firebaseUid, period = 'month') {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase.rpc('get_crm_dashboard_metrics', {
      p_user_id: userId,
      p_period: period
    });

    if (error) throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
    
    // Get recent activities and upcoming tasks
    const [recentActivities, upcomingTasks] = await Promise.all([
      this.getActivities(firebaseUid, { limit: 10 }),
      this.getTasks(firebaseUid, { 
        status: ['pending', 'in_progress'],
        dueAfter: new Date().toISOString(),
        limit: 10
      })
    ]);

    return {
      ...data,
      recentActivities,
      upcomingTasks
    };
  }

  async getPipelineData(firebaseUid) {
    const userId = await this.getUserId(firebaseUid);
    
    const { data, error } = await supabase
      .from('crm_stages')
      .select(`
        *,
        projects:crm_projects(
          *,
          customer:crm_customers!inner(*)
        )
      `)
      .eq('user_id', userId)
      .eq('crm_projects.crm_customers.user_id', userId)
      .order('order_index');

    if (error) throw new Error(`Failed to fetch pipeline data: ${error.message}`);
    
    return data.map(stage => ({
      stage,
      projects: stage.projects,
      totalValue: stage.projects.reduce((sum, p) => sum + (p.value || 0), 0),
      projectCount: stage.projects.length
    }));
  }
}

export const crmService = new CRMService();