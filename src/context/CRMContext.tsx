import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';
import type {
  CRMContextValue,
  CRMState,
  Customer,
  CRMProject,
  CRMStage,
  Activity,
  Task,
  DashboardMetrics,
  PipelineData,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateCRMProjectRequest,
  UpdateCRMProjectRequest,
  CreateStageRequest,
  UpdateStageRequest,
  CreateActivityRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CustomerFilters,
  ProjectFilters,
  ActivityFilters,
  TaskFilters
} from '../types/crm';

// CRM Action Types
type CRMAction = 
  | { type: 'SET_LOADING'; payload: { key: keyof CRMState['loading']; loading: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'REMOVE_CUSTOMER'; payload: string }
  | { type: 'SET_STAGES'; payload: CRMStage[] }
  | { type: 'ADD_STAGE'; payload: CRMStage }
  | { type: 'UPDATE_STAGE'; payload: CRMStage }
  | { type: 'REMOVE_STAGE'; payload: string }
  | { type: 'SET_PROJECTS'; payload: CRMProject[] }
  | { type: 'ADD_PROJECT'; payload: CRMProject }
  | { type: 'UPDATE_PROJECT'; payload: CRMProject }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'SET_DASHBOARD_METRICS'; payload: DashboardMetrics }
  | { type: 'SET_PIPELINE_DATA'; payload: PipelineData }
  | { type: 'RESET' };

// Initial state
const initialState: CRMState = {
  customers: [],
  stages: [],
  projects: [],
  activities: [],
  tasks: [],
  integrations: [],
  loading: {
    customers: false,
    projects: false,
    activities: false,
    tasks: false,
    dashboard: false
  },
  error: null
};

// CRM Reducer
function crmReducer(state: CRMState, action: CRMAction): CRMState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'SET_CUSTOMERS':
      return {
        ...state,
        customers: action.payload
      };
    
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [action.payload, ...state.customers]
      };
    
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      };
    
    case 'REMOVE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      };
    
    case 'SET_STAGES':
      return {
        ...state,
        stages: action.payload
      };
    
    case 'ADD_STAGE':
      return {
        ...state,
        stages: [...state.stages, action.payload].sort((a, b) => a.order_index - b.order_index)
      };
    
    case 'UPDATE_STAGE':
      return {
        ...state,
        stages: state.stages.map(stage =>
          stage.id === action.payload.id ? action.payload : stage
        ).sort((a, b) => a.order_index - b.order_index)
      };
    
    case 'REMOVE_STAGE':
      return {
        ...state,
        stages: state.stages.filter(stage => stage.id !== action.payload)
      };
    
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload
      };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.payload, ...state.projects]
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        )
      };
    
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload)
      };
    
    case 'SET_ACTIVITIES':
      return {
        ...state,
        activities: action.payload
      };
    
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: [action.payload, ...state.activities]
      };
    
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks]
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    
    case 'SET_DASHBOARD_METRICS':
      return {
        ...state,
        dashboardMetrics: action.payload
      };
    
    case 'SET_PIPELINE_DATA':
      return {
        ...state,
        pipelineData: action.payload
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Create context
const CRMContext = createContext<CRMContextValue | undefined>(undefined);

// API base URL
const API_BASE = typeof window !== 'undefined' ? 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api') : 
  '/api';

// CRM Provider
export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(crmReducer, initialState);
  const { dbUser: user } = useSupabaseAuth();

  // Helper function to make API calls
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}`,
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }, [user?.id]);

  // Customer actions
  const loadCustomers = useCallback(async (filters?: CustomerFilters) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'customers', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const data = await apiCall(`crm-customers?${queryParams.toString()}`);
      dispatch({ type: 'SET_CUSTOMERS', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'customers', loading: false } });
    }
  }, [apiCall]);

  const createCustomer = useCallback(async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiCall('crm-customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const customer = response.data;
    dispatch({ type: 'ADD_CUSTOMER', payload: customer });
    return customer;
  }, [apiCall]);

  const updateCustomer = useCallback(async (data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await apiCall(`crm-customers?id=${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    const customer = response.data;
    dispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
    return customer;
  }, [apiCall]);

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    await apiCall(`crm-customers?id=${id}`, {
      method: 'DELETE'
    });
    
    dispatch({ type: 'REMOVE_CUSTOMER', payload: id });
  }, [apiCall]);

  // Stage actions
  const loadStages = useCallback(async () => {
    try {
      const data = await apiCall('crm-stages');
      dispatch({ type: 'SET_STAGES', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, [apiCall]);

  const createStage = useCallback(async (data: CreateStageRequest): Promise<CRMStage> => {
    const response = await apiCall('crm-stages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const stage = response.data;
    dispatch({ type: 'ADD_STAGE', payload: stage });
    return stage;
  }, [apiCall]);

  const updateStage = useCallback(async (data: UpdateStageRequest): Promise<CRMStage> => {
    const response = await apiCall(`crm-stages?id=${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    const stage = response.data;
    dispatch({ type: 'UPDATE_STAGE', payload: stage });
    return stage;
  }, [apiCall]);

  const reorderStages = useCallback(async (stageIds: string[]): Promise<void> => {
    await apiCall('crm-pipeline', {
      method: 'POST',
      body: JSON.stringify({ action: 'reorder_stages', stageIds })
    });
    
    // Reload stages to get updated order
    await loadStages();
  }, [apiCall, loadStages]);

  const deleteStage = useCallback(async (id: string): Promise<void> => {
    await apiCall(`crm-stages?id=${id}`, {
      method: 'DELETE'
    });
    
    dispatch({ type: 'REMOVE_STAGE', payload: id });
  }, [apiCall]);

  // Project actions
  const loadProjects = useCallback(async (filters?: ProjectFilters) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'projects', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const data = await apiCall(`crm-projects?${queryParams.toString()}`);
      dispatch({ type: 'SET_PROJECTS', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'projects', loading: false } });
    }
  }, [apiCall]);

  const createProject = useCallback(async (data: CreateCRMProjectRequest): Promise<CRMProject> => {
    const response = await apiCall('crm-projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const project = response.data;
    dispatch({ type: 'ADD_PROJECT', payload: project });
    return project;
  }, [apiCall]);

  const updateProject = useCallback(async (data: UpdateCRMProjectRequest): Promise<CRMProject> => {
    const response = await apiCall(`crm-projects?id=${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    const project = response.data;
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
    return project;
  }, [apiCall]);

  const moveProjectStage = useCallback(async (projectId: string, stageId: string): Promise<CRMProject> => {
    const response = await apiCall('crm-pipeline', {
      method: 'POST',
      body: JSON.stringify({ action: 'move_project', projectId, newStageId: stageId })
    });
    
    const project = response.data;
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
    return project;
  }, [apiCall]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await apiCall(`crm-projects?id=${id}`, {
      method: 'DELETE'
    });
    
    dispatch({ type: 'REMOVE_PROJECT', payload: id });
  }, [apiCall]);

  // Activity actions
  const loadActivities = useCallback(async (filters?: ActivityFilters) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'activities', loading: true } });
    
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const data = await apiCall(`crm-activities?${queryParams.toString()}`);
      dispatch({ type: 'SET_ACTIVITIES', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'activities', loading: false } });
    }
  }, [apiCall]);

  const createActivity = useCallback(async (data: CreateActivityRequest): Promise<Activity> => {
    const response = await apiCall('crm-activities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const activity = response.data;
    dispatch({ type: 'ADD_ACTIVITY', payload: activity });
    return activity;
  }, [apiCall]);

  // Task actions
  const loadTasks = useCallback(async (filters?: TaskFilters) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', loading: true } });
    
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const data = await apiCall(`crm-tasks?${queryParams.toString()}`);
      dispatch({ type: 'SET_TASKS', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', loading: false } });
    }
  }, [apiCall]);

  const createTask = useCallback(async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiCall('crm-tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const task = response.data;
    dispatch({ type: 'ADD_TASK', payload: task });
    return task;
  }, [apiCall]);

  const updateTask = useCallback(async (data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiCall(`crm-tasks?id=${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    const task = response.data;
    dispatch({ type: 'UPDATE_TASK', payload: task });
    return task;
  }, [apiCall]);

  // Dashboard actions
  const loadDashboardMetrics = useCallback(async (period: string = 'month') => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'dashboard', loading: true } });
    
    try {
      const data = await apiCall(`crm-dashboard?period=${period}`);
      dispatch({ type: 'SET_DASHBOARD_METRICS', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'dashboard', loading: false } });
    }
  }, [apiCall]);

  const loadPipelineData = useCallback(async () => {
    try {
      const data = await apiCall('crm-pipeline');
      dispatch({ type: 'SET_PIPELINE_DATA', payload: data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, [apiCall]);

  // Integration actions (placeholder)
  const loadIntegrations = useCallback(async () => {
    // TODO: Implement when integration endpoints are ready
  }, []);

  const connectIntegration = useCallback(async (service: string, config: Record<string, any>) => {
    // TODO: Implement when integration endpoints are ready
    throw new Error('Integration not implemented yet');
  }, []);

  const disconnectIntegration = useCallback(async (service: string) => {
    // TODO: Implement when integration endpoints are ready
    throw new Error('Integration not implemented yet');
  }, []);

  const syncIntegration = useCallback(async (service: string) => {
    // TODO: Implement when integration endpoints are ready
    throw new Error('Integration not implemented yet');
  }, []);

  // Utility actions
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Load initial data when user changes
  useEffect(() => {
    if (user?.id) {
      loadStages();
    } else {
      reset();
    }
  }, [user?.id, loadStages, reset]);

  const contextValue: CRMContextValue = {
    ...state,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    loadStages,
    createStage,
    updateStage,
    reorderStages,
    deleteStage,
    loadProjects,
    createProject,
    updateProject,
    moveProjectStage,
    deleteProject,
    loadActivities,
    createActivity,
    loadTasks,
    createTask,
    updateTask,
    loadDashboardMetrics,
    loadPipelineData,
    loadIntegrations,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    clearError,
    reset
  };

  return (
    <CRMContext.Provider value={contextValue}>
      {children}
    </CRMContext.Provider>
  );
};

// Hook to use CRM context
export const useCRM = (): CRMContextValue => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

// Specialized hooks for convenience
export const useCustomers = () => {
  const { customers, loadCustomers, createCustomer, updateCustomer, deleteCustomer, loading } = useCRM();
  return {
    customers,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    loading: loading.customers
  };
};

export const useProjects = () => {
  const { projects, loadProjects, createProject, updateProject, moveProjectStage, deleteProject, loading } = useCRM();
  return {
    projects,
    loadProjects,
    createProject,
    updateProject,
    moveProjectStage,
    deleteProject,
    loading: loading.projects
  };
};

export const useTasks = () => {
  const { tasks, loadTasks, createTask, updateTask, loading } = useCRM();
  return {
    tasks,
    loadTasks,
    createTask,
    updateTask,
    loading: loading.tasks
  };
};