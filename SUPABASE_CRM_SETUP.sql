-- Supabase CRM Database Setup
-- Complete schema for Load Calculator CRM system
-- Run these commands in your Supabase SQL Editor

-- =================================================================
-- STEP 1: Enable Required Extensions
-- =================================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security) - should already be enabled
-- CREATE EXTENSION IF NOT EXISTS "rls";

-- =================================================================
-- STEP 2: Create CRM Tables
-- =================================================================

-- CRM Stages Table (Pipeline stages for projects)
CREATE TABLE IF NOT EXISTS crm_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
    order_index INTEGER NOT NULL DEFAULT 0,
    automations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Customers Table
CREATE TABLE IF NOT EXISTS crm_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    source VARCHAR(50), -- 'website', 'referral', 'google', 'facebook', etc.
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    external_ids JSONB DEFAULT '{}'::jsonb, -- For integrations
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Projects Table
CREATE TABLE IF NOT EXISTS crm_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12,2), -- Project value in dollars
    expected_close_date DATE,
    actual_close_date DATE,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'on_hold', 'completed', 'cancelled'
    assigned_to UUID REFERENCES auth.users(id),
    source VARCHAR(50), -- Where the project came from
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    external_ids JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Activities Table (Calls, emails, meetings, etc.)
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'site_visit', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Tasks Table (Action items and to-dos)
CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- STEP 3: Create Indexes for Performance
-- =================================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_crm_customers_user_id ON crm_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(email);
CREATE INDEX IF NOT EXISTS idx_crm_customers_source ON crm_customers(source);
CREATE INDEX IF NOT EXISTS idx_crm_customers_created_at ON crm_customers(created_at DESC);

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_crm_projects_customer_id ON crm_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_projects_stage_id ON crm_projects(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_projects_assigned_to ON crm_projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_projects_status ON crm_projects(status);
CREATE INDEX IF NOT EXISTS idx_crm_projects_priority ON crm_projects(priority);
CREATE INDEX IF NOT EXISTS idx_crm_projects_expected_close ON crm_projects(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_crm_projects_created_at ON crm_projects(created_at DESC);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_project_id ON crm_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_customer_id ON crm_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled_at ON crm_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_project_id ON crm_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_customer_id ON crm_tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_priority ON crm_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks(due_date);

-- Stage indexes
CREATE INDEX IF NOT EXISTS idx_crm_stages_user_id ON crm_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_stages_order_index ON crm_stages(order_index);

-- =================================================================
-- STEP 4: Set up Row Level Security (RLS)
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view their own customers" ON crm_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers" ON crm_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" ON crm_customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" ON crm_customers
    FOR DELETE USING (auth.uid() = user_id);

-- Stages policies
CREATE POLICY "Users can view their own stages" ON crm_stages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stages" ON crm_stages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stages" ON crm_stages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stages" ON crm_stages
    FOR DELETE USING (auth.uid() = user_id);

-- Projects policies (users can access projects for their customers)
CREATE POLICY "Users can view projects for their customers" ON crm_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crm_customers 
            WHERE crm_customers.id = crm_projects.customer_id 
            AND crm_customers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert projects for their customers" ON crm_projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM crm_customers 
            WHERE crm_customers.id = crm_projects.customer_id 
            AND crm_customers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update projects for their customers" ON crm_projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM crm_customers 
            WHERE crm_customers.id = crm_projects.customer_id 
            AND crm_customers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete projects for their customers" ON crm_projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM crm_customers 
            WHERE crm_customers.id = crm_projects.customer_id 
            AND crm_customers.user_id = auth.uid()
        )
    );

-- Activities policies
CREATE POLICY "Users can view their own activities" ON crm_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON crm_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON crm_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON crm_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON crm_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON crm_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON crm_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON crm_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- STEP 5: Create Update Triggers
-- =================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_crm_customers_updated_at 
    BEFORE UPDATE ON crm_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_stages_updated_at 
    BEFORE UPDATE ON crm_stages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_projects_updated_at 
    BEFORE UPDATE ON crm_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at 
    BEFORE UPDATE ON crm_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at 
    BEFORE UPDATE ON crm_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- STEP 6: Create Helper Functions
-- =================================================================

-- Function to initialize default CRM stages for a new user
CREATE OR REPLACE FUNCTION initialize_default_crm_stages(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO crm_stages (user_id, name, description, color, order_index) VALUES
    (p_user_id, 'Lead', 'Initial contact and qualification', '#ef4444', 1),
    (p_user_id, 'Site Visit', 'Scheduled site assessment', '#f97316', 2),
    (p_user_id, 'Proposal', 'Quote prepared and sent', '#eab308', 3),
    (p_user_id, 'Contracted', 'Project approved and contracted', '#22c55e', 4),
    (p_user_id, 'Completed', 'Project finished and invoiced', '#3b82f6', 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move a project to a different stage with activity logging
CREATE OR REPLACE FUNCTION move_project_stage(
    p_project_id UUID,
    p_new_stage_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_stage_name VARCHAR(100);
    v_new_stage_name VARCHAR(100);
    v_customer_id UUID;
BEGIN
    -- Get old stage name and customer_id
    SELECT s.name, p.customer_id INTO v_old_stage_name, v_customer_id
    FROM crm_projects p
    JOIN crm_stages s ON p.stage_id = s.id
    WHERE p.id = p_project_id;

    -- Get new stage name
    SELECT name INTO v_new_stage_name
    FROM crm_stages
    WHERE id = p_new_stage_id AND user_id = p_user_id;

    -- Update project stage
    UPDATE crm_projects 
    SET stage_id = p_new_stage_id, updated_at = NOW()
    WHERE id = p_project_id;

    -- Log the stage change as an activity
    INSERT INTO crm_activities (
        user_id, project_id, customer_id, type, title, description
    ) VALUES (
        p_user_id, 
        p_project_id, 
        v_customer_id,
        'stage_change',
        'Project stage updated',
        'Moved from "' || v_old_stage_name || '" to "' || v_new_stage_name || '"'
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get CRM dashboard metrics
CREATE OR REPLACE FUNCTION get_crm_dashboard_metrics(
    p_user_id UUID,
    p_period VARCHAR DEFAULT 'month'
)
RETURNS JSON AS $$
DECLARE
    v_date_from DATE;
    v_result JSON;
BEGIN
    -- Calculate date range based on period
    CASE p_period
        WHEN 'week' THEN v_date_from := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'month' THEN v_date_from := CURRENT_DATE - INTERVAL '30 days';
        WHEN 'quarter' THEN v_date_from := CURRENT_DATE - INTERVAL '90 days';
        WHEN 'year' THEN v_date_from := CURRENT_DATE - INTERVAL '365 days';
        ELSE v_date_from := CURRENT_DATE - INTERVAL '30 days';
    END CASE;

    SELECT json_build_object(
        'totalCustomers', (
            SELECT COUNT(*) FROM crm_customers 
            WHERE user_id = p_user_id
        ),
        'totalProjects', (
            SELECT COUNT(*) FROM crm_projects p
            JOIN crm_customers c ON p.customer_id = c.id
            WHERE c.user_id = p_user_id
        ),
        'totalValue', (
            SELECT COALESCE(SUM(p.value), 0) FROM crm_projects p
            JOIN crm_customers c ON p.customer_id = c.id
            WHERE c.user_id = p_user_id AND p.status = 'active'
        ),
        'newCustomersThisPeriod', (
            SELECT COUNT(*) FROM crm_customers 
            WHERE user_id = p_user_id 
            AND created_at >= v_date_from
        ),
        'completedProjectsThisPeriod', (
            SELECT COUNT(*) FROM crm_projects p
            JOIN crm_customers c ON p.customer_id = c.id
            WHERE c.user_id = p_user_id 
            AND p.status = 'completed'
            AND p.actual_close_date >= v_date_from
        ),
        'activeTasks', (
            SELECT COUNT(*) FROM crm_tasks 
            WHERE user_id = p_user_id 
            AND status IN ('pending', 'in_progress')
        ),
        'overdueTasks', (
            SELECT COUNT(*) FROM crm_tasks 
            WHERE user_id = p_user_id 
            AND status IN ('pending', 'in_progress')
            AND due_date < CURRENT_DATE
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 7: Insert Sample Data (Optional)
-- =================================================================

-- Note: This section would typically be run separately after user signup
-- For now, it's commented out but can be used for testing

/*
-- Example of inserting sample data for a user
-- Replace 'your-user-uuid-here' with an actual user UUID from auth.users

-- Initialize default stages
SELECT initialize_default_crm_stages('your-user-uuid-here');

-- Insert sample customer
INSERT INTO crm_customers (user_id, name, email, phone, company, address, source, tags, notes) VALUES
('your-user-uuid-here', 'John Smith', 'john.smith@email.com', '(555) 123-4567', 'Smith Residential', '123 Main St, Anytown, CA 90210', 'website', '{"residential", "new-construction"}', 'New home construction project');

-- Insert sample project
WITH sample_customer AS (
    SELECT id FROM crm_customers WHERE user_id = 'your-user-uuid-here' LIMIT 1
), lead_stage AS (
    SELECT id FROM crm_stages WHERE user_id = 'your-user-uuid-here' AND name = 'Lead' LIMIT 1
)
INSERT INTO crm_projects (customer_id, stage_id, name, description, value, expected_close_date, priority, tags)
SELECT 
    c.id, 
    s.id, 
    'Smith Residence - Service Upgrade', 
    '200A panel upgrade for new home construction', 
    3500.00, 
    CURRENT_DATE + INTERVAL '14 days', 
    'medium',
    '{"residential", "panel-upgrade"}'
FROM sample_customer c, lead_stage s;
*/

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Supabase CRM database setup completed successfully!';
    RAISE NOTICE '📋 Created tables: crm_customers, crm_stages, crm_projects, crm_activities, crm_tasks';
    RAISE NOTICE '🔒 Row Level Security enabled for all tables';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🔧 Helper functions available:';
    RAISE NOTICE '   - initialize_default_crm_stages(user_id)';
    RAISE NOTICE '   - move_project_stage(project_id, stage_id, user_id)';
    RAISE NOTICE '   - get_crm_dashboard_metrics(user_id, period)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your CRM system is ready to use!';
    RAISE NOTICE '💡 Update your API services to use the real crmService instead of mockCrmService';
END $$;