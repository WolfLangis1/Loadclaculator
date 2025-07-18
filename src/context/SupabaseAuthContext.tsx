import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { supabaseUserService } from '../services/supabaseUserService';
import type { User, UserSettings } from '../config/supabase';

interface SupabaseAuthContextType {
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  dbUser: User | null;
  userSettings: UserSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInAsGuestUser: () => Promise<void>;
  signOut: () => Promise<void>;
  convertGuestToUser: () => Promise<void>;
  
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!supabaseUser;
  const isGuest = dbUser?.is_guest || false;

  const initializeUserData = useCallback(async (supabaseUser: SupabaseUser) => {
    console.log('initializeUserData: Starting for user:', supabaseUser.email, 'provider:', supabaseUser.app_metadata?.provider);
    
    // Always create a fallback user immediately - no database dependencies
    const fallbackUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || undefined,
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'User',
      google_id: supabaseUser.app_metadata?.provider === 'google' ? supabaseUser.id : undefined,
      avatar_url: supabaseUser.user_metadata?.avatar_url || undefined,
      created_at: new Date().toISOString(),
      subscription_tier: 'free',
      is_guest: false
    };
    
    const fallbackSettings: UserSettings = {
      user_id: supabaseUser.id,
      theme: 'light',
      default_code_year: '2023',
      default_calculation_method: 'optional',
      auto_save_enabled: true,
      auto_save_interval: 5,
      units: 'imperial',
      notifications_enabled: true
    };

    console.log('initializeUserData: Setting fallback user immediately:', fallbackUser.name);
    setDbUser(fallbackUser);
    setUserSettings(fallbackSettings);
    console.log('initializeUserData: Completed successfully - authentication ready');
    
    // TODO: Add optional background database sync here with timeout protection
    // This ensures authentication works immediately without database dependencies
  }, []);

  useEffect(() => {
    console.log('SupabaseAuthContext: Initializing...');
    
    if (!supabase) {
      console.warn('🔒 Supabase not configured, running in offline mode');
      console.log('💡 To enable authentication, set environment variables in Vercel dashboard:');
      console.log('   - SUPABASE_URL: Your Supabase project URL');
      console.log('   - SUPABASE_ANON_KEY: Your Supabase anonymous key');
      
      // Try to load guest user from localStorage
      const guestUser = localStorage.getItem('guest_user');
      const guestSettings = localStorage.getItem('guest_settings');
      if (guestUser && guestSettings) {
        console.log('Loading guest user from localStorage');
        setDbUser(JSON.parse(guestUser));
        setUserSettings(JSON.parse(guestSettings));
      } else {
        // Create a default offline user
        const offlineUser: User = {
          id: 'offline-user',
          email: undefined,
          name: 'Offline User',
          created_at: new Date().toISOString(),
          subscription_tier: 'free',
          is_guest: true
        };
        const offlineSettings: UserSettings = {
          user_id: 'offline-user',
          theme: 'light',
          default_code_year: '2023',
          default_calculation_method: 'optional',
          auto_save_enabled: false,
          auto_save_interval: 5,
          units: 'imperial',
          notifications_enabled: false
        };
        setDbUser(offlineUser);
        setUserSettings(offlineSettings);
      }
      console.log('Setting loading to false (offline mode)');
      setIsLoading(false);
      return;
    }

    // Get initial session
    console.log('Getting initial session...');
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('Got session response:', { session: !!session, error });
      if (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Found existing session, initializing user data...');
        try {
          await initializeUserData(session.user);
          console.log('User data initialization completed successfully');
        } catch (err) {
          console.error('Error initializing user data:', err);
        } finally {
          console.log('Setting loading to false (initial session complete)');
          setIsLoading(false);
        }
      } else {
        console.log('No existing session, setting loading to false');
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Error getting initial session:', err);
      console.log('Setting loading to false (session error)');
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Don't immediately set loading false - wait for user data initialization
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Auth change: initializing user data for', session.user.email);
          try {
            await initializeUserData(session.user);
            console.log('Auth change: user data initialization completed');
          } catch (error) {
            console.error('Error initializing user data on auth change:', error);
          } finally {
            console.log('Auth change: setting loading to false');
            setIsLoading(false);
          }
        } else {
          console.log('Auth change: no user, clearing data');
          setDbUser(null);
          setUserSettings(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      setIsLoading(true);
      
      // Determine the correct redirect URL based on environment
      const getRedirectUrl = () => {
        const currentOrigin = window.location.origin;
        
        // If we're on localhost, redirect back to localhost
        if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
          return `${currentOrigin}/`;
        }
        
        // If we're on Vercel preview, use the current origin
        if (currentOrigin.includes('vercel.app')) {
          return `${currentOrigin}/`;
        }
        
        // For production, use the production domain
        return 'https://proloadcalc.com/';
      };

      const redirectUrl = getRedirectUrl();
      console.log('OAuth redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInAsGuestUser = useCallback(async () => {
    console.log('Guest sign-in: Starting...');
    try {
      setIsLoading(true);
      
      // Create a mock guest user
      const guestUser: User = {
        id: `guest-${Date.now()}`,
        email: null,
        name: 'Guest User',
        avatar_url: null,
        created_at: new Date().toISOString(),
        subscription_tier: 'free',
        is_guest: true
      };
      
      const guestSettings: UserSettings = {
        user_id: guestUser.id,
        theme: 'light',
        default_code_year: '2023',
        default_calculation_method: 'optional',
        auto_save_enabled: true,
        auto_save_interval: 5,
        units: 'imperial',
        notifications_enabled: true
      };

      console.log('Guest sign-in: Created guest user:', guestUser.id);

      // Store in localStorage for guest sessions (with error handling)
      try {
        localStorage.setItem('guest_user', JSON.stringify(guestUser));
        localStorage.setItem('guest_settings', JSON.stringify(guestSettings));
        console.log('Guest sign-in: Stored in localStorage');
      } catch (storageError) {
        console.warn('Guest sign-in: localStorage failed, continuing anyway:', storageError);
        // Continue even if localStorage fails
      }
      
      // Set state atomically - both user and settings together
      console.log('Guest sign-in: Setting state...');
      setDbUser(guestUser);
      setUserSettings(guestSettings);
      
      console.log('Guest sign-in: Successfully completed');
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw error;
    } finally {
      console.log('Guest sign-in: Setting loading to false');
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (supabase && session) {
        await supabase.auth.signOut();
      }
      
      // Clear guest data
      localStorage.removeItem('guest_user');
      localStorage.removeItem('guest_settings');
      
      setSession(null);
      setSupabaseUser(null);
      setDbUser(null);
      setUserSettings(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const convertGuestToUser = useCallback(async () => {
    if (!isGuest) return;
    
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error converting guest to user:', error);
      throw error;
    }
  }, [isGuest, signInWithGoogle]);

  const updateUserProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!dbUser) return false;
    
    try {
      if (isGuest) {
        // Update guest user in localStorage
        const updatedUser = { ...dbUser, ...updates };
        localStorage.setItem('guest_user', JSON.stringify(updatedUser));
        setDbUser(updatedUser);
        return true;
      }
      
      const updatedUser = await supabaseUserService.updateUser(dbUser.id, updates);
      setDbUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }, [dbUser, isGuest]);

  const updateSettings = useCallback(async (settings: Partial<UserSettings>): Promise<boolean> => {
    if (!userSettings) return false;
    
    try {
      if (isGuest) {
        // Update guest settings in localStorage
        const updatedSettings = { ...userSettings, ...settings };
        localStorage.setItem('guest_settings', JSON.stringify(updatedSettings));
        setUserSettings(updatedSettings);
        return true;
      }
      
      const updatedSettings = await supabaseUserService.updateUserSettings(userSettings.user_id, settings);
      setUserSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      return false;
    }
  }, [userSettings, isGuest]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!dbUser) throw new Error('User not authenticated');
    
    try {
      // For guest users, we can't upload to Supabase, so return a mock URL
      if (isGuest) {
        // Create a local object URL for preview
        const objectUrl = URL.createObjectURL(file);
        const updatedUser = { ...dbUser, avatar_url: objectUrl };
        localStorage.setItem('guest_user', JSON.stringify(updatedUser));
        setDbUser(updatedUser);
        return objectUrl;
      }
      
      // For authenticated users, upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${dbUser.id}/avatar.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const avatarUrl = urlData.publicUrl;
      
      // Update user profile with new avatar URL
      await updateUserProfile({ avatar_url: avatarUrl });
      
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }, [dbUser, isGuest, updateUserProfile]);

  const value: SupabaseAuthContextType = useMemo(() => ({
    supabaseUser,
    session,
    dbUser,
    userSettings,
    isLoading,
    isAuthenticated,
    isGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuestUser,
    signOut,
    convertGuestToUser,
    updateUserProfile,
    updateSettings,
    uploadAvatar
  }), [
    supabaseUser,
    session,
    dbUser,
    userSettings,
    isLoading,
    isAuthenticated,
    isGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuestUser,
    signOut,
    convertGuestToUser,
    updateUserProfile,
    updateSettings,
    uploadAvatar
  ]);

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};