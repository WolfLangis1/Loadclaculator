
import { supabase } from '../utils/db.js';

const getUserSettings = async (userId) => {
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to fetch settings');
  }

  if (!settings) {
    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert({ user_id: userId })
      .select()
      .single();

    if (createError) {
      throw new Error('Failed to create settings');
    }
    return newSettings;
  }
  return settings;
};

const updateUserSettings = async (userId, updates) => {
  const { data: existingSettings } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .single();

  let result;
  if (existingSettings) {
    result = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('user_settings')
      .insert({ user_id: userId, ...updates })
      .select()
      .single();
  }

  if (result.error) {
    throw new Error('Failed to update settings');
  }
  return result.data;
};

export const userService = {
  getUserSettings,
  updateUserSettings,
};
