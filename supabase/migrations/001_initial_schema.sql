-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE project_permission AS ENUM ('view', 'edit', 'admin');
CREATE TYPE template_category AS ENUM ('residential', 'commercial', 'industrial', 'solar', 'evse', 'custom');
CREATE TYPE component_category AS ENUM ('panel', 'breaker', 'wire', 'meter', 'disconnect', 'inverter', 'evse', 'battery', 'transformer', 'custom');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE,
  email TEXT,
  name TEXT,
  google_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  subscription_tier subscription_tier DEFAULT 'free',
  is_guest BOOLEAN DEFAULT false,
  guest_converted_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  default_voltage INTEGER DEFAULT 120,
  default_phase TEXT DEFAULT 'single',
  units TEXT DEFAULT 'imperial',
  auto_save BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  company_name TEXT,
  company_logo_url TEXT,
  license_number TEXT,
  default_jurisdiction TEXT,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'draft',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculations JSONB DEFAULT '{}'::jsonb,
  sld_data JSONB DEFAULT '{}'::jsonb,
  aerial_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  tags TEXT[],
  is_template BOOLEAN DEFAULT false,
  template_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Project shares table for collaboration
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  permission project_permission DEFAULT 'view',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE,
  accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, shared_with_user_id),
  UNIQUE(project_id, shared_with_email)
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category template_category,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  data JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Component library table
CREATE TABLE component_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category component_category,
  manufacturer TEXT,
  model_number TEXT,
  specifications JSONB NOT NULL,
  symbol_data JSONB,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Activity log table for audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_guest ON users(is_guest);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_project_shares_project_id ON project_shares(project_id);
CREATE INDEX idx_project_shares_shared_with_user_id ON project_shares(shared_with_user_id);
CREATE INDEX idx_project_shares_share_token ON project_shares(share_token);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_component_library_category ON component_library(category);
CREATE INDEX idx_component_library_is_public ON component_library(is_public);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_library_updated_at BEFORE UPDATE ON component_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = firebase_uid OR id::text = auth.uid()::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = firebase_uid OR id::text = auth.uid()::text);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        OR id IN (
            SELECT project_id FROM project_shares 
            WHERE shared_with_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        )
    );

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        OR id IN (
            SELECT project_id FROM project_shares 
            WHERE shared_with_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
            AND permission IN ('edit', 'admin')
        )
    );

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Project shares policies
CREATE POLICY "Users can view shares for their projects" ON project_shares
    FOR SELECT USING (
        shared_by_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        OR shared_with_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );

CREATE POLICY "Users can create shares for their projects" ON project_shares
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
        )
    );

CREATE POLICY "Users can update shares for their projects" ON project_shares
    FOR UPDATE USING (
        shared_by_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );

CREATE POLICY "Users can delete shares for their projects" ON project_shares
    FOR DELETE USING (
        shared_by_user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );

-- Templates policies
CREATE POLICY "Anyone can view public templates" ON templates
    FOR SELECT USING (is_public = true OR is_system = true);

CREATE POLICY "Users can view their own templates" ON templates
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their own templates" ON templates
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Component library policies
CREATE POLICY "Anyone can view public components" ON component_library
    FOR SELECT USING (is_public = true OR is_system = true);

CREATE POLICY "Users can view their own components" ON component_library
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can manage their own components" ON component_library
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Activity logs policies
CREATE POLICY "Users can view their own activity" ON activity_logs
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Create functions for common operations

-- Function to get or create user from Firebase auth
CREATE OR REPLACE FUNCTION get_or_create_user(
    p_firebase_uid TEXT,
    p_email TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_google_id TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_is_guest BOOLEAN DEFAULT false
) RETURNS users AS $$
DECLARE
    v_user users;
BEGIN
    -- Try to find existing user
    SELECT * INTO v_user FROM users WHERE firebase_uid = p_firebase_uid;
    
    -- If not found, create new user
    IF NOT FOUND THEN
        INSERT INTO users (firebase_uid, email, name, google_id, avatar_url, is_guest)
        VALUES (p_firebase_uid, p_email, p_name, p_google_id, p_avatar_url, p_is_guest)
        RETURNING * INTO v_user;
        
        -- Create default settings for new user
        INSERT INTO user_settings (user_id) VALUES (v_user.id);
    END IF;
    
    -- Update last login
    UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = v_user.id;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate guest data to authenticated user
CREATE OR REPLACE FUNCTION migrate_guest_to_user(
    p_guest_user_id UUID,
    p_firebase_uid TEXT,
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_google_id TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
) RETURNS users AS $$
DECLARE
    v_user users;
    v_existing_user users;
BEGIN
    -- Check if target user already exists
    SELECT * INTO v_existing_user FROM users WHERE firebase_uid = p_firebase_uid;
    
    IF FOUND THEN
        -- Migrate projects from guest to existing user
        UPDATE projects SET user_id = v_existing_user.id 
        WHERE user_id = p_guest_user_id;
        
        -- Delete guest user
        DELETE FROM users WHERE id = p_guest_user_id;
        
        RETURN v_existing_user;
    ELSE
        -- Convert guest user to authenticated user
        UPDATE users 
        SET firebase_uid = p_firebase_uid,
            email = p_email,
            name = p_name,
            google_id = p_google_id,
            avatar_url = p_avatar_url,
            is_guest = false,
            guest_converted_at = CURRENT_TIMESTAMP
        WHERE id = p_guest_user_id
        RETURNING * INTO v_user;
        
        RETURN v_user;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE templates SET usage_count = usage_count + 1 WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system templates
INSERT INTO templates (name, description, category, is_public, is_system, data) VALUES
('Residential 200A Service', 'Standard residential 200A service with common loads', 'residential', true, true, 
 '{"mainBreakerSize": 200, "voltage": 240, "phase": "single", "loads": {"general": {"lighting": 3000, "receptacles": 3000}, "appliances": [{"name": "Range", "watts": 12000}, {"name": "Dryer", "watts": 5000}, {"name": "Water Heater", "watts": 4500}], "hvac": [{"name": "AC Unit", "tons": 3, "heatPump": false}]}}'::jsonb),

('Small Commercial 400A', 'Small commercial building 400A 3-phase service', 'commercial', true, true,
 '{"mainBreakerSize": 400, "voltage": 208, "phase": "three", "loads": {"general": {"lighting": 10000, "receptacles": 8000}, "motors": [{"name": "HVAC Motor", "hp": 10}, {"name": "Exhaust Fan", "hp": 5}]}}'::jsonb),

('Residential Solar + Battery', 'Residential service with solar PV and battery backup', 'solar', true, true,
 '{"mainBreakerSize": 200, "voltage": 240, "phase": "single", "solar": {"inverterSize": 7600, "batterySize": 13500}, "loads": {"general": {"lighting": 3000, "receptacles": 3000}}}'::jsonb),

('EV Charging Station', 'Electric vehicle charging setup with load management', 'evse', true, true,
 '{"mainBreakerSize": 200, "voltage": 240, "phase": "single", "evse": [{"name": "Level 2 Charger", "amps": 48, "voltage": 240, "quantity": 2}], "loads": {"general": {"lighting": 2000, "receptacles": 2000}}}'::jsonb);

-- Insert default system components
INSERT INTO component_library (name, category, manufacturer, model_number, specifications, is_public, is_system) VALUES
('Main Panel 200A', 'panel', 'Generic', 'MP200', '{"type": "main", "amps": 200, "spaces": 40, "voltage": 240}'::jsonb, true, true),
('Subpanel 100A', 'panel', 'Generic', 'SP100', '{"type": "sub", "amps": 100, "spaces": 20, "voltage": 240}'::jsonb, true, true),
('2-Pole Breaker', 'breaker', 'Generic', 'BR220', '{"poles": 2, "amps": [20, 30, 40, 50, 60], "voltage": 240}'::jsonb, true, true),
('Digital Meter', 'meter', 'Generic', 'DM200', '{"type": "digital", "amps": 200, "voltage": 240, "phases": 1}'::jsonb, true, true),
('Service Disconnect', 'disconnect', 'Generic', 'SD200', '{"type": "service", "amps": 200, "voltage": 240, "fusible": false}'::jsonb, true, true),
('String Inverter', 'inverter', 'Generic', 'INV7600', '{"type": "string", "power": 7600, "voltage": 240, "phases": 1}'::jsonb, true, true),
('Level 2 EVSE', 'evse', 'Generic', 'EV48', '{"level": 2, "amps": 48, "voltage": 240, "connector": "J1772"}'::jsonb, true, true),
('Battery System', 'battery', 'Generic', 'BAT13.5', '{"capacity": 13.5, "voltage": 48, "power": 5000, "chemistry": "LFP"}'::jsonb, true, true);

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;