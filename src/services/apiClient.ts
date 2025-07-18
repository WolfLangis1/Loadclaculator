
import { supabase } from '../config/supabase';
import { ApiError } from './ApiError';

const getApiBaseUrl = (): string => {
  // Production: Always use relative /api for Vercel serverless functions
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return '/api';
  }
  
  // Development: Check for configured API URLs
  if (import.meta.env.API_URL) {
    return import.meta.env.API_URL;
  }
  
  if (import.meta.env.API_BASE_URL && import.meta.env.API_BASE_URL !== 'undefined') {
    return `${import.meta.env.API_BASE_URL}/api`;
  }
  
  // Development fallback: Use /api (assumes Vite proxy or local serverless functions)
  return '/api';
};

const API_BASE = getApiBaseUrl();

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  requireAuth?: boolean;
  body?: any;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      if (!supabase) return null;
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;
      
      return session.access_token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, requireAuth = false, body, ...fetchConfig } = config;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchConfig.headers,
    };

    if (requireAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        throw new ApiError('Authentication required', 401);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchConfig,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(errorData?.message || response.statusText, response.status, errorData);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  }

  get<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T = any>(endpoint: string, body: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  delete<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
