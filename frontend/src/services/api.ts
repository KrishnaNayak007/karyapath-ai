// frontend/src/services/api.ts
import axios from 'axios';

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

// NOTICE: No leading slashes in the paths below!
// Axios will perfectly combine `${baseURL}${endpoint}` -> ".../api/goals/"

export const createGoal = async (goalData: any) => {
  try {
    const response = await api.post('goals/', goalData);
    return response.data;
  } catch (error) {
    console.error('Error creating goal via Django integration:', error);
    throw error;
  }
};

export const getDashboard = async () => {
  try {
    const response = await api.get('dashboard/');
    return response.data;
  } catch (error) {
    console.error('Error loading dashboard via Django integration:', error);
    throw error;
  }
};

export const completeSubtask = async (subtaskId: any) => {
  try {
    const response = await api.post(`subtasks/${subtaskId}/complete/`);
    return response.data;
  } catch (error) {
    console.error(`Error completing subtask ${subtaskId} via Django integration:`, error);
    throw error;
  }
};

export const verifyGoogleToken = async (credential: any) => {
  try {
    const response = await api.post('auth/google-verify/', { credential });
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying Google token via Django integration:', error);
    throw error;
  }
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

export default api;