// frontend/src/services/api.ts
import axios from 'axios';

// Get the base domain directly (without appending /api here)
const baseURL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL, // Points to "https://karyapath-ai.onrender.com" or local
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach the Token to every request header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// We explicitly include '/api' at the start of each endpoint below
export const createGoal = async (goalData: any) => {
  try {
    const response = await api.post('/api/goals/', goalData);
    return response.data;
  } catch (error) {
    console.error('Error creating goal via Django integration:', error);
    throw error;
  }
};

export const getDashboard = async () => {
  try {
    const response = await api.get('/api/dashboard/');
    return response.data;
  } catch (error) {
    console.error('Error loading dashboard via Django integration:', error);
    throw error;
  }
};

export const completeSubtask = async (subtaskId: any) => {
  try {
    const response = await api.post(`/api/subtasks/${subtaskId}/complete/`);
    return response.data;
  } catch (error) {
    console.error(`Error completing subtask ${subtaskId} via Django integration:`, error);
    throw error;
  }
};

export const verifyGoogleToken = async (credential: any) => {
  try {
    const response = await api.post('/api/auth/google-verify/', { credential });
    
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
    const response = await api.post('/api/reset-db/');
    return response.data;
  } catch (error) {
    console.error('Error resetting DB via Django integration:', error);
    throw error;
  }
};

export default api;