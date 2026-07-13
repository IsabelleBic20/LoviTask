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
  id?: number;
  userId: string;
  eventType: string;
  timestamp: string;
  description?: string;
  category?: string;
  estimatedMinutes?: number;
  energyLevel?: number;
  mood?: string;
  completed?: boolean | null;
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
  explanation?: string;
}

export interface CognitiveLoadResult {
  score: number;
  classification: string;
  mitigationAdvice: string;
  activeTasksCount: number;
  delayedTasksCount: number;
  recentInterruptionCount: number;
  userEnergyLevel?: number;
}

export interface CognitiveProfile {
  userId: string;
  summary: string;
  bestProductivityHour: string;
  worstProductivityHour: string;
  averageTaskDuration: number;
  averageFocusTime: number;
  completionRate: number;
  delayRate: number;
  procrastinationIndex: number;
  cognitiveLoad: number;
  consistencyScore: number;
  lastUpdated: string;
  productivityWindow: { period: string; confidence: number };
  lowProductivityWindow?: { period: string; confidence: number };
  recommendations: Recommendation[];
}

export interface UserTask {
  id?: number;
  userId?: string;
  title: string;
  description: string;
  category: string;
  energyRequirement: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  dueDate?: string;
  createdAt?: string;
  completedAt?: string;
  status?: 'Pending' | 'InProgress' | 'Paused' | 'Completed' | 'Delayed' | 'Rescheduled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  parentTaskId?: number;
  suggestedTime?: string;
  predecessorTaskId?: number;
  complexityEstimate?: 'Fácil' | 'Média' | 'Difícil';
}

export interface PredictionResult {
  taskId: number;
  taskTitle: string;
  riskPercentage: number;
  explanation: string;
}

export interface CognitiveHistoryDay {
  date: string;
  averageCognitiveLoad: number;
  averageEnergy: number;
  tasksCompleted: number;
  tasksDelayed: number;
}
