import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: '', // Relative URLs to connect to the same host/port
});

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  goal_id: string;
  title: string;
  estimated_minutes: number;
  status: 'pending' | 'completed';
  confidence: string;
}

export interface ScheduledBlock {
  id: string;
  subtask_id: string;
  start_time: string;
  end_time: string;
  google_calendar_event_id: string | null;
  was_auto_rescheduled: boolean;
  reschedule_reason: string | null;
}

export interface ReplanLog {
  id: string;
  trigger_reason: string;
  ai_reasoning: string;
  triggered_at: string;
  was_automatic: boolean;
  goal_title?: string;
  task_title?: string;
}

export interface DashboardData {
  goals: Goal[];
  subtasks: Subtask[];
  scheduled_blocks: ScheduledBlock[];
  replan_logs: ReplanLog[];
  new_replans: ReplanLog[];
}

/**
 * Creates a new goal, which triggers the Gemini subtask and block schedule planner.
 */
export const createGoal = async (data: {
  title: string;
  description?: string;
  deadline: string;
  priority: string;
}): Promise<{ goal: Goal; subtasks: Subtask[]; scheduled_blocks: ScheduledBlock[] }> => {
  const response = await api.post('/goals', data);
  return response.data;
};

/**
 * Loads all dashboard data and triggers the autonomous planner check on the backend.
 */
export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/dashboard');
  return response.data;
};

/**
 * Marks a subtask as completed and logs the action.
 */
export const completeSubtask = async (id: string): Promise<{ success: boolean; subtask: Subtask }> => {
  const response = await api.post(`/subtasks/${id}/complete`);
  return response.data;
};

/**
 * Verifies the Google Identity Services token with the backend and retrieves user details.
 */
export const verifyGoogleToken = async (credential: string): Promise<{ success: boolean; user: { email: string; name: string; avatarUrl: string } }> => {
  const response = await api.post('/api/auth/google-verify', { credential });
  return response.data;
};

/**
 * Resets the server database to the initial pre-seeded state for demo purposes.
 */
export const resetDb = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/reset-db');
  return response.data;
};
