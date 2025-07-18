-- CRM System Migration
-- Adds comprehensive customer relationship management functionality

-- Create CRM-specific types
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'advertising', 'social_media', 'cold_call', 'trade_show', 'other');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'site_visit', 'proposal_sent', 'contract_signed', 'installation', 'follow_up', 'note');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending');

-- CRM Customers table
CREATE TABLE crm_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  address JSONB DEFAULT '{}'::jsonb,
  source lead_source DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  hubspot_id VARCHAR(100),
  external_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- CRM Pipeline stages
CREATE TABLE crm_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_closed BOOLEAN DEFAULT FALSE,
  automations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM Projects table (extends existing projects with CRM data)
CREATE TABLE crm_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE RESTRICT,
  value DECIMAL(12,2),
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  source lead_source DEFAULT 'other',
  priority project_priority DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  hubspot_deal_id VARCHAR(100),
  external_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- CRM Activities and timeline
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM Tasks and reminders
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority project_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM Integration configurations
CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  status integration_status DEFAULT 'active',
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20),
  error_message TEXT,
  sync_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service)
);

-- CRM Analytics cache
CREATE TABLE crm_analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'day', 'week', 'month', 'quarter', 'year'
  date_range DATERANGE NOT NULL,
  data JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
  UNIQUE(user_id, metric_type, period, date_range)
);

-- Create indexes for optimal query performance
CREATE INDEX idx_crm_customers_user_id ON crm_customers(user_id);
CREATE INDEX idx_crm_customers_email ON crm_customers(email);
CREATE INDEX idx_crm_customers_source ON crm_customers(source);
CREATE INDEX idx_crm_customers_created_at ON crm_customers(created_at DESC);
CREATE INDEX idx_crm_customers_name_search ON crm_customers USING gin(to_tsvector('english', name));

CREATE INDEX idx_crm_stages_user_id ON crm_stages(user_id);
CREATE INDEX idx_crm_stages_order ON crm_stages(user_id, order_index);

CREATE INDEX idx_crm_projects_customer_id ON crm_projects(customer_id);
CREATE INDEX idx_crm_projects_stage_id ON crm_projects(stage_id);
CREATE INDEX idx_crm_projects_assigned_to ON crm_projects(assigned_to);
CREATE INDEX idx_crm_projects_expected_close ON crm_projects(expected_close_date);
CREATE INDEX idx_crm_projects_value ON crm_projects(value DESC);
CREATE INDEX idx_crm_projects_created_at ON crm_projects(created_at DESC);

CREATE INDEX idx_crm_activities_project_id ON crm_activities(project_id);
CREATE INDEX idx_crm_activities_customer_id ON crm_activities(customer_id);
CREATE INDEX idx_crm_activities_user_id ON crm_activities(user_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(type);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);
CREATE INDEX idx_crm_activities_created_at ON crm_activities(created_at DESC);

CREATE INDEX idx_crm_tasks_project_id ON crm_tasks(project_id);
CREATE INDEX idx_crm_tasks_customer_id ON crm_tasks(customer_id);
CREATE INDEX idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX idx_crm_tasks_priority ON crm_tasks(priority);

CREATE INDEX idx_crm_integrations_user_id ON crm_integrations(user_id);
CREATE INDEX idx_crm_integrations_service ON crm_integrations(service);
CREATE INDEX idx_crm_integrations_status ON crm_integrations(status);

CREATE INDEX idx_crm_analytics_cache_user_id ON crm_analytics_cache(user_id);
CREATE INDEX idx_crm_analytics_cache_expires ON crm_analytics_cache(expires_at);

-- Apply updated_at triggers
CREATE TRIGGER update_crm_customers_updated_at BEFORE UPDATE ON crm_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_stages_updated_at BEFORE UPDATE ON crm_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON crm_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_integrations_updated_at BEFORE UPDATE ON crm_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_analytics_cache ENABLE ROW LEVEL SECURITY;

-- CRM Customers policies
CREATE POLICY "Users can view their own customers" ON crm_customers
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their own customers" ON crm_customers
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- CRM Stages policies
CREATE POLICY "Users can view their own stages" ON crm_stages
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their own stages" ON crm_stages
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- CRM Projects policies
CREATE POLICY "Users can view their CRM projects" ON crm_projects
    FOR SELECT USING (customer_id IN (
        SELECT id FROM crm_customers WHERE user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    ));

CREATE POLICY "Users can manage their CRM projects" ON crm_projects
    FOR ALL USING (customer_id IN (
        SELECT id FROM crm_customers WHERE user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    ));

-- CRM Activities policies
CREATE POLICY "Users can view their CRM activities" ON crm_activities
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their CRM activities" ON crm_activities
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- CRM Tasks policies
CREATE POLICY "Users can view their CRM tasks" ON crm_tasks
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ) OR assigned_to IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their CRM tasks" ON crm_tasks
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- CRM Integrations policies
CREATE POLICY "Users can view their own integrations" ON crm_integrations
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their own integrations" ON crm_integrations
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- CRM Analytics cache policies
CREATE POLICY "Users can view their own analytics cache" ON crm_analytics_cache
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their own analytics cache" ON crm_analytics_cache
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- CRM Functions

-- Function to initialize default CRM stages for new users
CREATE OR REPLACE FUNCTION initialize_default_crm_stages(p_user_id UUID) RETURNS VOID AS $$
DECLARE
    stage_names TEXT[] := ARRAY['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Contract', 'Installation', 'Completed', 'Follow-up'];
    stage_colors TEXT[] := ARRAY['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#8B5CF6', '#10B981', '#059669', '#6B7280'];
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(stage_names, 1) LOOP
        INSERT INTO crm_stages (user_id, name, order_index, color, is_closed)
        VALUES (p_user_id, stage_names[i], i, stage_colors[i], stage_names[i] IN ('Completed', 'Follow-up'));
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get CRM dashboard metrics
CREATE OR REPLACE FUNCTION get_crm_dashboard_metrics(p_user_id UUID, p_period TEXT DEFAULT 'month') RETURNS JSONB AS $$
DECLARE
    total_customers INTEGER;
    active_projects INTEGER;
    total_value DECIMAL(12,2);
    conversion_rate DECIMAL(5,2);
    period_start TIMESTAMP WITH TIME ZONE;
    closed_won_count INTEGER;
    total_opportunities INTEGER;
BEGIN
    -- Calculate period start
    CASE p_period
        WHEN 'week' THEN period_start := CURRENT_TIMESTAMP - INTERVAL '7 days';
        WHEN 'month' THEN period_start := CURRENT_TIMESTAMP - INTERVAL '30 days';
        WHEN 'quarter' THEN period_start := CURRENT_TIMESTAMP - INTERVAL '90 days';
        WHEN 'year' THEN period_start := CURRENT_TIMESTAMP - INTERVAL '365 days';
        ELSE period_start := CURRENT_TIMESTAMP - INTERVAL '30 days';
    END CASE;

    -- Get customer count
    SELECT COUNT(*) INTO total_customers
    FROM crm_customers
    WHERE user_id = p_user_id AND created_at >= period_start;

    -- Get active projects count
    SELECT COUNT(*) INTO active_projects
    FROM crm_projects cp
    JOIN crm_customers cc ON cp.customer_id = cc.id
    JOIN crm_stages cs ON cp.stage_id = cs.id
    WHERE cc.user_id = p_user_id AND NOT cs.is_closed;

    -- Get total pipeline value
    SELECT COALESCE(SUM(cp.value), 0) INTO total_value
    FROM crm_projects cp
    JOIN crm_customers cc ON cp.customer_id = cc.id
    JOIN crm_stages cs ON cp.stage_id = cs.id
    WHERE cc.user_id = p_user_id AND NOT cs.is_closed;

    -- Calculate conversion rate
    SELECT COUNT(*) INTO closed_won_count
    FROM crm_projects cp
    JOIN crm_customers cc ON cp.customer_id = cc.id
    JOIN crm_stages cs ON cp.stage_id = cs.id
    WHERE cc.user_id = p_user_id 
      AND cs.is_closed 
      AND cp.actual_close_date >= period_start
      AND cp.value > 0;

    SELECT COUNT(*) INTO total_opportunities
    FROM crm_projects cp
    JOIN crm_customers cc ON cp.customer_id = cc.id
    WHERE cc.user_id = p_user_id AND cp.created_at >= period_start;

    IF total_opportunities > 0 THEN
        conversion_rate := (closed_won_count::DECIMAL / total_opportunities::DECIMAL) * 100;
    ELSE
        conversion_rate := 0;
    END IF;

    RETURN jsonb_build_object(
        'totalCustomers', total_customers,
        'activeProjects', active_projects,
        'totalValue', total_value,
        'conversionRate', conversion_rate,
        'period', p_period,
        'periodStart', period_start
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move project to different stage
CREATE OR REPLACE FUNCTION move_project_stage(
    p_project_id UUID,
    p_new_stage_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    old_stage_id UUID;
    stage_name TEXT;
BEGIN
    -- Verify user owns the project
    IF NOT EXISTS (
        SELECT 1 FROM crm_projects cp
        JOIN crm_customers cc ON cp.customer_id = cc.id
        WHERE cp.id = p_project_id AND cc.user_id = p_user_id
    ) THEN
        RETURN FALSE;
    END IF;

    -- Get old stage for activity log
    SELECT stage_id INTO old_stage_id FROM crm_projects WHERE id = p_project_id;

    -- Update project stage
    UPDATE crm_projects SET stage_id = p_new_stage_id WHERE id = p_project_id;

    -- Get new stage name
    SELECT name INTO stage_name FROM crm_stages WHERE id = p_new_stage_id;

    -- Log activity
    INSERT INTO crm_activities (user_id, project_id, type, title, description, metadata)
    VALUES (
        p_user_id,
        p_project_id,
        'note',
        'Project stage changed',
        'Project moved to ' || stage_name,
        jsonb_build_object('old_stage_id', old_stage_id, 'new_stage_id', p_new_stage_id)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired analytics cache
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache() RETURNS VOID AS $$
BEGIN
    DELETE FROM crm_analytics_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert some default data
-- Note: Default stages will be created automatically for users when they first access CRM