/**
 * Supabase Configuration
 * 
 * Handles database connections and authentication
 */

console.log('supabase.ts: Loading Supabase config...');

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - only create client if proper URLs are provided
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

console.log('supabase.ts: Environment variables loaded:', { 
  url: !!supabaseUrl, 
  key: !!supabaseAnonKey,
  urlValue: supabaseUrl?.substring(0, 20) + '...' 
});

// Validate URLs before creating client
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Create Supabase client with validation
export const supabase = (() => {
  try {
    // Check if environment variables are provided
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not configured, running in offline mode');
      return null;
    }
    
    if (!isValidUrl(supabaseUrl)) {
      console.warn('Invalid Supabase URL provided, running in offline mode');
      return null;
    }
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.warn('Failed to initialize Supabase client, running in offline mode:', error);
    return null;
  }
})();

// Database type definitions
export interface User {
  id: string;
  email?: string;
  name?: string;
  google_id?: string;
  avatar_url?: string;
  created_at: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  is_guest: boolean;
}

export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark';
  default_code_year: string;
  default_calculation_method: 'optional' | 'standard' | 'existing';
  auto_save_enabled: boolean;
  auto_save_interval: number;
  units: 'imperial' | 'metric';
  notifications_enabled: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  data: any; // JSON data containing all project state
  created_at: string;
  updated_at: string;
  is_template: boolean;
  is_public: boolean;
  thumbnail_url?: string;
  tags: string[];
}

export interface ProjectShare {
  id: string;
  project_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit' | 'admin';
  created_at: string;
  expires_at?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'industrial' | 'specialty';
  data: any;
  is_public: boolean;
  created_by: string;
  created_at: string;
  usage_count: number;
  rating: number;
  tags: string[];
}

export interface ComponentLibraryItem {
  id: string;
  user_id: string;
  name: string;
  type: string;
  symbol: string;
  properties: any;
  is_public: boolean;
  created_at: string;
  category: string;
  tags: string[];
}

// Check if Supabase is available
const checkSupabase = (): boolean => {
  if (!supabase) {
    console.warn('Supabase client not available - database operations will be mocked');
    return false;
  }
  return true;
};

// Helper functions for database operations
export const dbHelpers = {
  // User operations
  async getUser(userId: string): Promise<User | null> {
    if (!supabase) {
      console.warn('Supabase client not available, returning null');
      return null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data;
  },

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase client not available');
      return false;
    }
    
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...settings });
    
    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }
    
    return true;
  },

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    
    return data || [];
  },

  async saveProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving project:', error);
      return null;
    }
    
    return data;
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);
    
    if (error) {
      console.error('Error updating project:', error);
      return false;
    }
    
    return true;
  },

  // Template operations
  async getTemplates(category?: string): Promise<Template[]> {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
    
    return data || [];
  },

  // Component library operations
  async getComponentLibrary(userId?: string): Promise<ComponentLibraryItem[]> {
    let query = supabase
      .from('component_library')
      .select('*');
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching component library:', error);
      return [];
    }
    
    return data || [];
  }
};

export default supabase;