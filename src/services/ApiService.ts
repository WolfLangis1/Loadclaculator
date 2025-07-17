
import { apiClient } from './apiClient';

class ApiService {
  async auth() {
    return {
      verifyToken: (idToken: string) => apiClient.post('/auth/verify', { idToken }),
      getProfile: () => apiClient.get('/auth/profile', { requireAuth: true }),
      updateProfile: (updates: any) => apiClient.put('/auth/profile', updates, { requireAuth: true }),
    };
  }

  async users() {
    return {
      getSettings: () => apiClient.get('/users/settings', { requireAuth: true }),
      updateSettings: (settings: any) => apiClient.put('/users/settings', settings, { requireAuth: true }),
    };
  }

  async projects() {
    return {
      list: (params?: { limit?: number; offset?: number }) => apiClient.get('/projects', { params, requireAuth: true }),
      get: (projectId: string) => apiClient.get(`/projects/${projectId}`, { requireAuth: true }),
      create: (projectData: any) => apiClient.post('/projects', projectData, { requireAuth: true }),
      update: (projectId: string, updates: any) => apiClient.put(`/projects/${projectId}`, updates, { requireAuth: true }),
      delete: (projectId: string) => apiClient.delete(`/projects/${projectId}`, { requireAuth: true }),
      share: (projectId: string, shareData: any) => apiClient.post(`/projects/${projectId}/share`, shareData, { requireAuth: true }),
    };
  }

  async templates() {
    return {
      list: (params?: { category?: string; limit?: number }) => apiClient.get('/templates', { params }),
      get: (templateId: string) => apiClient.get(`/templates/${templateId}`),
      create: (templateData: any) => apiClient.post('/templates', templateData, { requireAuth: true }),
    };
  }

  async components() {
    return {
      list: (params?: { category?: string; public?: boolean }) => apiClient.get('/components', { params, requireAuth: !params?.public }),
      create: (componentData: any) => apiClient.post('/components', componentData, { requireAuth: true }),
      update: (componentId: string, updates: any) => apiClient.put(`/components/${componentId}`, updates, { requireAuth: true }),
    };
  }

  geocode(address: string) {
    return apiClient.get('/geocode', { params: { address } });
  }

  places(input: string, sessionToken?: string) {
    return apiClient.get('/places', { params: { input, sessiontoken: sessionToken } });
  }

  weather(lat: number, lon: number, provider = 'openweather') {
    return apiClient.get('/weather', { params: { lat, lon, provider } });
  }

  satellite(params: { lat: number; lon: number; zoom?: number; width?: number; height?: number; provider?: string; }) {
    return apiClient.get('/satellite', { params });
  }

  solar(lat: number, lon: number, radiusMeters = 100) {
    return apiClient.get('/solar', { params: { lat, lon, radiusMeters } });
  }

  roofAnalysis(imageData: string, lat: number, lon: number) {
    return apiClient.post('/roof-analysis', { imageData, lat, lon });
  }
}

export const apiService = new ApiService();
