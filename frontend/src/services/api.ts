// frontend/src/services/api.ts
import axios from 'axios';

// Define the Subtask structure to prevent any TypeScript compilation errors
export interface Subtask {
  id: any;
  goal: any;
  title: string;
  estimated_minutes: number;
  order: number;
  status: string;
  confidence?: any;
  action_draft?: string | null;       // New field for AI Action Starters
  is_crisis_active?: boolean;          // New field for Emergency focus
}

const API_URL = import.meta.env.VITE_API_URL || 'https://karyapath-ai.onrender.com';

const api = axios.create({
  baseURL: `${API_URL}/api/`, // Must end with a slash!
});

// Interceptor to attach token...
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const createGoal = async (goalData: any) => {
  const response = await api.post('goals/', goalData); // No leading slash
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('dashboard/'); // No leading slash
  return response.data;
};

export const completeSubtask = async (subtaskId: any) => {
  const response = await api.post(`subtasks/${subtaskId}/complete/`); // No leading slash
  return response.data;
};

// NEW: API Call to trigger AI Draft Starters
export const generateSubtaskDraft = async (subtaskId: any) => {
  const response = await api.post(`subtasks/${subtaskId}/generate-draft/`);
  return response.data;
};

// NEW: API Call to toggle Crisis Mode
export const toggleSubtaskCrisis = async (subtaskId: any) => {
  const response = await api.post(`subtasks/${subtaskId}/toggle-crisis/`);
  return response.data;
};

export const verifyGoogleToken = async (credential: any) => {
  const response = await api.post('auth/google-verify/', { credential }); // No leading slash
  
  if (response.data.success && response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return response.data;
};

export const resetDb = async () => {
  try {
    const response = await api.post('reset-db/');
    return response.data;
  } catch (error) {
    console.error('Error resetting DB via Django integration:', error);
    throw error;
  }
};

// Append these inside frontend/src/services/api.ts:

export const createGoalFromBrainDump = async (text: string) => {
  const response = await api.post('goals/brain-dump/', { brain_dump: text });
  return response.data;
};

export const verifySubtaskProof = async (subtaskId: any, file: File) => {
  const formData = new FormData();
  formData.append("proof", file);
  
  // Directly post multipart form data to your endpoint view
  const response = await api.post(`subtasks/${subtaskId}/verify-proof/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export default api;