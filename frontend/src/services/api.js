import axios from 'axios';

// Base API configuration pointing to Django backend port 8000
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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

export const createGoal = async (goalData) => {
  try {
    const response = await api.post('/goals/', goalData);
    return response.data;
  } catch (error) {
    console.error('Error creating goal via Django integration:', error);
    throw error;
  }
};

export const getDashboard = async () => {
  try {
    const response = await api.get('/dashboard/');
    return response.data;
  } catch (error) {
    console.error('Error loading dashboard via Django integration:', error);
    throw error;
  }
};

export const completeSubtask = async (subtaskId) => {
  try {
    const response = await api.post(`/subtasks/${subtaskId}/complete/`);
    return response.data;
  } catch (error) {
    console.error(`Error completing subtask ${subtaskId} via Django integration:`, error);
    throw error;
  }
};

/**
 * Google ID Token verification
 * Stores the backend-generated Token in localStorage on success
 */
export const verifyGoogleToken = async (credential) => {
  try {
    const response = await api.post('/auth/google-verify/', { credential });
    
    // Save the token from the backend response
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
    const response = await api.post('/reset-db/');
    return response.data;
  } catch (error) {
    console.error('Error resetting DB via Django integration:', error);
    throw error;
  }
};

export default api;