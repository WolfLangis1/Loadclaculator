import { supabase, firebaseAdmin } from '../utils/db.js';

const getUserProfile = async (userId) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) {
    throw new Error('User not found');
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('archived_at', null);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    isGuest: user.is_guest,
    subscriptionTier: user.subscription_tier,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    settings: settings || {},
    stats: {
      projectCount: projectCount || 0
    }
  };
};

const updateUserProfile = async (userId, updates) => {
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    throw new Error('Failed to update profile');
  }
  return updatedUser;
};

const verifyIdToken = async (idToken) => {
  return firebaseAdmin.auth().verifyIdToken(idToken);
};

const getOrCreateUser = async (uid, email, name, googleId, avatarUrl, isGuest) => {
  const { data: userData, error: userError } = await supabase.rpc('get_or_create_user', {
    p_firebase_uid: uid,
    p_email: email || null,
    p_name: name || null,
    p_google_id: googleId || null,
    p_avatar_url: avatarUrl || null,
    p_is_guest: isGuest
  });

  if (userError) {
    console.error('Error creating/fetching user:', userError);
    throw new Error('Failed to process user data');
  }
  return userData;
};

export const authService = {
  getUserProfile,
  updateUserProfile,
  verifyIdToken,
  getOrCreateUser,
};