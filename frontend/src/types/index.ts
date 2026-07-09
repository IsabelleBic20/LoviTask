export interface MicrotaskSuggestion {
  title: string;
  description: string;
  priority: 'Alta' | 'Média' | 'Baixa';
}

export interface BrainDumpRequest {
  text: string;
  goal?: string;
  deadline?: string;
}

export interface UserActivityEvent {
  id: number;
  userId: string;
  eventType: string;
  timestamp: string;
  description?: string;
  category?: string;
  estimatedMinutes?: number;
  energyLevel?: number;
  mood?: string;
  completed?: boolean;
}

export interface PersonalizationMetrics {
  totalEvents: number;
  completedEvents: number;
  abandonedEvents: number;
  procrastinationRate: number;
  averageCompletionMinutes: number;
  mostProductivePeriod: string;
  leastProductivePeriod: string;
  mostFrequentCategory: string;
  shortTaskCompleted: number;
  longTaskAbandoned: number;
}

export interface Recommendation {
  title: string;
  description: string;
  category: string;
}

export interface CognitiveProfile {
  userId: string;
  summary: string;
  productivityWindow: { period: string; confidence: number };
  recommendations: Recommendation[];
}
