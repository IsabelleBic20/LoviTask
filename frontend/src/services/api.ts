import axios from 'axios';
import {
  MicrotaskSuggestion,
  BrainDumpRequest,
  UserActivityEvent,
  PersonalizationMetrics,
  CognitiveProfile,
  Recommendation,
  UserTask,
  CognitiveLoadResult,
  PredictionResult,
  CognitiveHistoryDay,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para anexar o token JWT às requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lovitask_jwt') || sessionStorage.getItem('lovitask_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const loviTaskAPI = {
  // Autenticação
  login: (email: string, password: string): Promise<{ token: string; email: string; expiresAt: string }> =>
    api.post('/Auth/login', { email, password }).then((res) => res.data),

  googleLogin: (email: string): Promise<{ token: string; email: string; expiresAt: string }> =>
    api.post('/Auth/google', { email }).then((res) => res.data),

  // Brain Dump
  analyzeBrainDump: (request: BrainDumpRequest): Promise<MicrotaskSuggestion[]> =>
    api.post('/BrainDump/analyze', request).then((res) => res.data),

  // Events
  getEvents: (): Promise<UserActivityEvent[]> =>
    api.get('/Events').then((res) => res.data),

  trackEvent: (event: UserActivityEvent): Promise<void> =>
    api.post('/Personalization/events', event),

  // Metrics
  getMetrics: (): Promise<PersonalizationMetrics> =>
    api.get('/Metrics').then((res) => res.data),

  // Profile
  getProfile: (): Promise<CognitiveProfile> =>
    api.get('/Cognitive/profile').then((res) => res.data),

  recalculateProfile: (): Promise<CognitiveProfile> =>
    api.post('/Cognitive/profile/recalculate').then((res) => res.data),

  // Recommendations
  getRecommendations: (): Promise<Recommendation[]> =>
    api.get('/recommendations').then((res) => res.data),

  // Cognitive Load
  getCognitiveLoad: (): Promise<CognitiveLoadResult> =>
    api.get('/Cognitive/load').then((res) => res.data),

  // Register Energy
  registerEnergy: (energyLevel: number): Promise<void> =>
    api.post('/energy', { energyLevel }),

  // Tasks
  getTasks: (): Promise<UserTask[]> =>
    api.get('/tasks').then((res) => res.data),

  createTask: (task: UserTask): Promise<UserTask[]> =>
    api.post('/tasks', task).then((res) => res.data),

  rebuildSchedule: (): Promise<{ message: string }> =>
    api.post('/planning/rebuild').then((res) => res.data),

  completeTask: (id: number, actualMinutes?: number): Promise<UserTask> =>
    api.post(`/tasks/${id}/complete`, { actualMinutes }).then((res) => res.data),

  delayTask: (id: number): Promise<{ message: string; task: UserTask }> =>
    api.post(`/tasks/${id}/delay`).then((res) => res.data),

  // Predictions
  getPredictions: (): Promise<PredictionResult[]> =>
    api.get('/predictions').then((res) => res.data),

  optimizeTask: (id: number): Promise<{ message: string; task: UserTask }> =>
    api.post(`/tasks/${id}/optimize`).then((res) => res.data),

  // Cognitive History
  getCognitiveHistory: (days?: number): Promise<CognitiveHistoryDay[]> =>
    api.get(`/cognitive/history`, { params: { days } }).then((res) => res.data),
};

export default api;
