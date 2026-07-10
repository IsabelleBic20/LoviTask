import axios from 'axios';
import {
  MicrotaskSuggestion,
  BrainDumpRequest,
  UserActivityEvent,
  PersonalizationMetrics,
  CognitiveProfile,
  Recommendation,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loviTaskAPI = {
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
    api.get('/Personalization/profile').then((res) => res.data),

  // Recommendations
  getRecommendations: (): Promise<Recommendation[]> =>
    api.get('/Personalization/recommendations').then((res) => res.data),
};

export default api;
