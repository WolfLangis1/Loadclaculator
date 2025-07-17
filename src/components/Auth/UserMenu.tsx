/**
 * User Menu Component
 * 
 * Displays user profile info and provides sign out functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings, 
  UserCircle, 
  ChevronDown,
  UserPlus,
  Cloud,
  HelpCircle
} from 'lucide-react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { dbUser, isGuest, signOut, convertGuestToUser } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleConvertGuest = async () => {
    try {
      await convertGuestToUser();
    } catch (error) {
      console.error('Error converting guest:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {dbUser?.avatar_url ? (
          <img
            src={dbUser.avatar_url}
            alt={dbUser.name || 'User'}
            className="h-8 w-8 rounded-full border border-gray-200"
          />
        ) : (
          <UserCircle className="h-8 w-8 text-gray-600" />
        )}
        
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">
            {isGuest ? 'Guest User' : dbUser?.name || dbUser?.email || 'User'}
          </div>
          {!isGuest && dbUser?.subscription_tier && (
            <div className="text-xs text-gray-500 capitalize">
              {dbUser.subscription_tier} Plan
            </div>
          )}
        </div>
        
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {isGuest ? (
            <>
              {/* Guest User Menu */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm text-gray-600">
                  You're using guest mode
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sign in to save your work permanently
                </p>
              </div>
              
              <button
                onClick={handleConvertGuest}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <UserPlus className="h-4 w-4" />
                Sign In to Save Work
              </button>
            </>
          ) : (
            <>
              {/* Registered User Menu */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {dbUser?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {dbUser?.email}
                </p>
              </div>
              
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              
              <button
                onClick={() => navigate('/settings')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              
              <button
                onClick={() => navigate('/projects')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Cloud className="h-4 w-4" />
                My Projects
              </button>
            </>
          )}
          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => navigate('/help')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <HelpCircle className="h-4 w-4" />
              Help & Support
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <LogOut className="h-4 w-4" />
              {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};