/** Servidor por defecto (al compilar). Se puede cambiar desde la app: ver core/config/server.ts. */
export const DEFAULT_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000').replace(/\/$/, '');

export const LIVE_FRAME_INTERVAL_MS = 120; // pausa entre fotogramas del reconocimiento en vivo
export const LIVE_SMOOTHING_FRAMES = 4; // fotogramas promediados para estabilizar el resultado
export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
