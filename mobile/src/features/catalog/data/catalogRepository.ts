import type { Part } from '@/ml/types';

import type { DiseaseInfo } from '../domain/types';
import catalog from './catalog.json';

const ALL = catalog as DiseaseInfo[];

/** El catálogo viaja dentro de la app: está disponible sin internet desde la primera vez. */
export const catalogRepository = {
  list: (part?: Part) => (part ? ALL.filter((d) => d.part === part) : ALL),
  find: (part: string, code: string) => ALL.find((d) => d.part === part && d.code === code) ?? null,
};
