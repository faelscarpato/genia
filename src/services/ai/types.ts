import { z } from 'zod';

export const AIProviderSchema = z.enum(['groq', 'mistral', 'nvidia', 'openrouter']);
export type AIProvider = z.infer<typeof AIProviderSchema>;

export interface AIModelConfig {
  provider: AIProvider;
  modelId: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ExtractionResult {
  full_name: string;
  birth_date?: string;
  father_name?: string;
  mother_name?: string;
  location?: string;
  confidence: number;
  raw_reasoning?: string;
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}
