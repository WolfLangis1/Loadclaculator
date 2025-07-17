import { supabase } from '../config/supabase';
import type { User, UserSettings } from '../types/User';

export const supabaseUserService = {
  getUser: async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  createUser: async (newUser: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  },

  getUserSettings: async (userId: string): Promise<UserSettings | null> => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  updateUserSettings: async (userId: string, updates: Partial<UserSettings>): Promise<UserSettings> => {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  migrateUserData: async (guestId: string, userId: string): Promise<void> => {
    // Update projects
    await supabase
      .from('projects')
      .update({ user_id: userId })
      .eq('user_id', guestId);

    // Update user settings
    await supabase
      .from('user_settings')
      .update({ user_id: userId })
      .eq('user_id', guestId);

    // Delete guest user record
    await supabase
      .from('users')
      .delete()
      .eq('id', guestId);
  },
};
