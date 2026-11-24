// Copia los modelos TFLite y el catálogo desde ../ml-models (fuente de verdad) y genera las etiquetas.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, '..', 'ml-models');
const target = join(root, 'src', 'ml', 'models');
const PARTS = ['hojas', 'tallos', 'frutos'];

const slugify = (t) =>
  t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

function parseLabels(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(' ');
      const index = Number(line.slice(0, i));
      const name = line.slice(i + 1).trim().replace(/^[A-Za-z]{1,2}[._]/, '').replace(/_/g, ' ').trim();
      const code = slugify(name);
      return { index, code, name, isHealthy: /(sano|sana)$/.test(code) };
    })
    .sort((a, b) => a.index - b.index);
}

mkdirSync(target, { recursive: true });
const labels = {};
for (const part of PARTS) {
  copyFileSync(join(source, part, 'model_unquant.tflite'), join(target, `${part}.tflite`));
  labels[part] = parseLabels(readFileSync(join(source, part, 'labels.txt'), 'utf8'));
}
writeFileSync(
  join(target, 'labels.generated.ts'),
  `// GENERADO por scripts/sync-models.mjs. No editar.\nimport type { Label, Part } from '../types';\n\nexport const LABELS: Record<Part, Label[]> = ${JSON.stringify(labels, null, 2)};\n`,
);
mkdirSync(join(root, 'src', 'features', 'catalog', 'data'), { recursive: true });
copyFileSync(join(source, 'catalog.json'), join(root, 'src', 'features', 'catalog', 'data', 'catalog.json'));
console.log('Modelos, etiquetas y catálogo sincronizados.');
