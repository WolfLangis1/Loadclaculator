/**
 * Supabase Login Page Component
 * 
 * Comprehensive authentication with Google OAuth, email/password, and guest mode
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  User, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calculator,
  Cable,
  MapPin,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3
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

  const coreFeatures = [
    {
      icon: Calculator,
      title: 'Load Calculator',
      description: 'NEC compliant electrical load calculations for residential and commercial projects',
      highlight: 'Most Popular',
      color: 'bg-blue-500'
    },
    {
      icon: Cable,
      title: 'Wire Sizing',
      description: 'Comprehensive wire sizing charts and calculations with ampacity tables',
      highlight: 'Essential Tool',
      color: 'bg-green-500'
    },
    {
      icon: MapPin,
      title: 'Site Analysis',
      description: 'Aerial view with advanced measurement tools and calibration',
      highlight: 'New Feature',
      color: 'bg-purple-500'
    },
    {
      icon: Users,
      title: 'Project Management',
      description: 'Organize projects, collaborate with teams, and track progress',
      highlight: 'Pro Feature',
      color: 'bg-orange-500'
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: 'Professional Results',
      description: 'Generate accurate, NEC-compliant calculations trusted by professionals'
    },
    {
      icon: BarChart3,
      title: 'Save Time',
      description: 'Complete load calculations in minutes, not hours'
    },
    {
      icon: Shield,
      title: 'Always Compliant',
      description: 'Stay up-to-date with latest NEC codes and standards'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with App Preview */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* App Preview Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-80 h-60 bg-white/20 rounded-xl transform rotate-12"></div>
          <div className="absolute bottom-32 right-1/4 w-64 h-48 bg-white/15 rounded-xl transform -rotate-6"></div>
          <div className="absolute top-1/3 right-1/3 w-96 h-64 bg-white/10 rounded-xl transform rotate-3"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 animate-pulse">
          <Calculator className="h-12 w-12 text-blue-400/30" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-pulse delay-1000">
          <Cable className="h-10 w-10 text-green-400/30" />
        </div>
        <div className="absolute top-1/2 left-1/6 animate-pulse delay-2000">
          <MapPin className="h-8 w-8 text-purple-400/30" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Hero & Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-16 text-white">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">ProLoadCalc</h1>
                <p className="text-blue-200 text-sm">Professional Edition</p>
              </div>
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight">
              Professional Electrical
              <span className="text-blue-400"> Load Calculations</span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-8">
              NEC-compliant calculations trusted by electrical professionals worldwide. 
              Complete projects faster with our comprehensive suite of tools.
            </p>
          </div>

          {/* Core Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all group">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`${feature.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/50 rounded-full">{feature.highlight}</span>
                    </div>
                    <p className="text-xs text-blue-200 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Why Professionals Choose Us
            </h3>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-blue-100">
                <benefit.icon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-white">{benefit.title}</span>
                  <span className="ml-2 text-sm">{benefit.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Authentication */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 lg:p-10">
              {/* Mobile Header */}
              <div className="lg:hidden mb-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">ProLoadCalc</h1>
                </div>
                <p className="text-gray-600">Professional electrical load calculations</p>
              </div>

              {/* Auth Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {authMode === 'signup' 
                    ? 'Join thousands of electrical professionals using ProLoadCalc'
                    : 'Sign in to access your projects and continue your work'
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
              <div className={`mb-6 p-3 rounded-lg border ${supabase ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${supabase ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  <p className={`text-xs font-medium ${supabase ? 'text-green-800' : 'text-amber-800'}`}>
                    {supabase ? 'Cloud Storage Ready' : 'Offline Mode Active'}
                  </p>
                </div>
              </div>

              {/* Authentication Form */}
              <div className="space-y-4">
                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || !supabase}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">
                    {isLoading ? 'Signing in...' : `Continue with Google`}
                  </span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
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
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Confirm your password"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <span className="font-medium">
                        {isSubmitting ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                      </span>
                      {!isSubmitting && <ArrowRight className="h-4 w-4" />}
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
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Guest Mode */}
                <button
                  onClick={handleGuestSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  data-cy="guest-login"
                >
                  <User className="h-5 w-5 text-gray-600 group-hover:text-gray-700" />
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">
                    {isLoading ? 'Loading...' : 'Try as Guest'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
              
              {/* Guest Mode Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Guest Access
                </h4>
                <p className="text-sm text-blue-800">
                  Explore all features instantly. Your work is saved locally and can be synced when you create an account.
                </p>
              </div>
              
              {/* Privacy Notice */}
              <p className="mt-6 text-xs text-gray-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Your data is always secure and never shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};