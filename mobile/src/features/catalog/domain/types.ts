import type { Part } from '@/ml/types';

export interface DiseaseInfo {
  part: Part;
  code: string;
  index: number;
  name: string;
  description: string;
  severity: 'none' | 'medium' | 'high';
  is_healthy: boolean;
  symptoms: string[];
  treatment: string[];
}
