export const percent = (v: number) => `${Math.round(v * 100)}%`;

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
