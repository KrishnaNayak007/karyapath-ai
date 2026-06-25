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

// Replace your endpoints in frontend/src/services/api.ts with these (no leading slash):
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

export default api;