/**
 * Supabase Login Page Component
 * 
 * Comprehensive authentication with Google OAuth, email/password, and guest mode
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  UserPlus, 
  User, 
  Shield, 
  Cloud, 
  Share2, 
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { supabase } from '../../config/supabase';

type AuthMode = 'signin' | 'signup' | 'guest';

export const SupabaseLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuestUser, isLoading } = useSupabaseAuth();
  
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!supabase) {
      setError('Supabase not configured. Please check your environment variables.');
      return;
    }

    try {
      await signInWithGoogle();
      setSuccessMessage('Redirecting to Google...');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (!formData.name.trim()) {
          throw new Error('Name is required');
        }

        await signUpWithEmail(formData.email, formData.password, formData.name);
        setSuccessMessage('Account created! Please check your email to verify your account.');
      } else {
        await signInWithEmail(formData.email, formData.password);
        setSuccessMessage('Successfully signed in!');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${authMode === 'signup' ? 'sign up' : 'sign in'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    try {
      await signInAsGuestUser();
      setSuccessMessage('Welcome! You\'re using guest mode.');
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in as guest');
    }
  };

  const features = [
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description: 'Save and sync your projects across all devices'
    },
    {
      icon: Share2,
      title: 'Share Projects',
      description: 'Collaborate with team members and clients'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="lg:flex">
            {/* Left Panel - Features */}
            <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 text-white">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="h-10 w-10" />
                <h1 className="text-3xl font-bold">Proloadcalc.com</h1>
              </div>
              
              <p className="text-lg mb-8 text-blue-100">
                Professional electrical load calculations with NEC compliance, 
                now with cloud storage and collaboration features.
              </p>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-white/20 rounded-lg p-2">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-blue-100">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              

            </div>
            
            {/* Right Panel - Authentication */}
            <div className="lg:w-1/2 p-8 lg:p-12">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {authMode === 'signup' 
                    ? 'Sign up to save your projects and access advanced features'
                    : 'Sign in to access your projects and settings'
                  }
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              )}
              
              {/* Supabase Status */}
              <div className={`mb-6 p-4 rounded-lg border ${supabase ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${supabase ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  <p className={`text-sm font-medium ${supabase ? 'text-green-800' : 'text-amber-800'}`}>
                    {supabase ? 'Supabase Connected' : 'Supabase Not Configured'}
                  </p>
                </div>
                <p className={`text-xs mt-1 ${supabase ? 'text-green-600' : 'text-amber-600'}`}>
                  {supabase 
                    ? 'Ready for authentication and cloud storage'
                    : 'Using offline mode - configure Supabase for full features'
                  }
                </p>
              </div>

              {/* Authentication Form */}
              <div className="space-y-6">
                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || !supabase}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700">
                    {isLoading ? 'Signing in...' : `Continue with Google`}
                  </span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Email/Password Form */}
                {supabase && (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {authMode === 'signup' && (
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          placeholder="Enter your full name"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {authMode === 'signup' && (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Confirm your password"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium">
                        {isSubmitting ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                      </span>
                    </button>
                  </form>
                )}

                {/* Toggle between Sign In/Sign Up */}
                {supabase && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                        setError(null);
                        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {authMode === 'signin' 
                        ? "Don't have an account? Sign up" 
                        : 'Already have an account? Sign in'
                      }
                    </button>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Guest Mode */}
                <button
                  onClick={handleGuestSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 border-2 border-transparent rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-cy="guest-login"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-700">
                    {isLoading ? 'Loading...' : 'Continue as Guest'}
                  </span>
                </button>
              </div>
              
              {/* Guest Mode Info */}
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Guest Mode
                </h4>
                <p className="text-sm text-amber-800">
                  Try all features without signing up. Your work is saved locally 
                  and can be synced to your account later.
                </p>
              </div>
              
              {/* Privacy Notice */}
              <p className="mt-6 text-xs text-gray-500 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy. 
                We never share your data with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};