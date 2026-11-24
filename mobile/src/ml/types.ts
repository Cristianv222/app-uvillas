export type Part = 'hojas' | 'tallos' | 'frutos';
export const PARTS: Part[] = ['hojas', 'tallos', 'frutos'];
export const PART_LABEL: Record<Part, string> = { hojas: 'Hoja', tallos: 'Tallo', frutos: 'Fruto' };

export interface Label {
  index: number;
  code: string;
  name: string;
  isHealthy: boolean;
}

export interface Prediction {
  code: string;
  name: string;
  confidence: number;
  isHealthy: boolean;
}
