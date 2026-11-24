import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';

import { LIVE_FRAME_INTERVAL_MS, LIVE_SMOOTHING_FRAMES } from '@/core/config/env';
import type { InferenceMode } from '@/core/storage/settingsStore';
import { RecognitionSocket } from '@/core/websocket/RecognitionSocket';
import { averagePredictions, classifyLocal, loadModel } from '@/ml/inference/localClassifier';
import { captureModelFrame } from '@/ml/preprocessing/capture';
import { jpegToModelInput } from '@/ml/preprocessing/jpeg';
import type { Part, Prediction } from '@/ml/types';
import { errorMessage } from '@/core/errors';
import { sleep } from '@/shared/utils/format';

interface Args {
  camera: React.RefObject<CameraView | null>;
  part: Part;
  active: boolean;
  mode: InferenceMode;
  online: boolean;
}

export type Engine = 'local' | 'server';

/**
 * Reconocimiento en vivo. Cada ciclo: foto reducida a 224x224 -> modelo -> resultado promediado.
 * - 'local': TFLite en el teléfono (siempre disponible, sin internet).
 * - 'server': WebSocket al backend; si se pierde la conexión usa el modelo local automáticamente.
 */
export function useLiveRecognition({ camera, part, active, mode, online }: Args) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [engine, setEngine] = useState<Engine>('local');
  const [error, setError] = useState<string | null>(null);
  const buffer = useRef<Prediction[][]>([]);
  const socket = useRef<RecognitionSocket | null>(null);
  const socketOpen = useRef(false);
  const partRef = useRef(part);

  const push = (frame: Prediction[]) => {
    buffer.current = [...buffer.current, frame].slice(-LIVE_SMOOTHING_FRAMES);
    setPredictions(averagePredictions(buffer.current));
  };

  // Cambiar de parte reinicia el promedio.
  useEffect(() => {
    partRef.current = part;
    buffer.current = [];
    setPredictions([]);
    socket.current?.setPart(part);
  }, [part]);

  // WebSocket (solo en modo servidor y con internet).
  useEffect(() => {
    const wantServer = active && mode === 'server' && online;
    if (!wantServer) {
      socketOpen.current = false;
      return;
    }
    const ws = new RecognitionSocket(partRef.current, {
      onStatus: (s) => (socketOpen.current = s === 'open'),
      onResult: (r) => r.part === partRef.current && push(r.predictions),
      onError: (m) => setError(m),
    });
    socket.current = ws;
    void ws.connect();
    return () => {
      ws.close();
      socket.current = null;
      socketOpen.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode, online]);

  // Bucle de captura.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void loadModel(part).catch(() => {}); // precarga
    (async () => {
      while (!cancelled) {
        const cam = camera.current;
        if (!cam) { await sleep(300); continue; }
        try {
          const useServer = mode === 'server' && online && socketOpen.current;
          setEngine(useServer ? 'server' : 'local');
          const base64 = await captureModelFrame(cam);
          if (cancelled) break;
          if (useServer) {
            socket.current?.sendFrame(base64);
          } else {
            push(await classifyLocal(partRef.current, jpegToModelInput(base64)));
          }
          setError(null);
        } catch (e) {
          setError(errorMessage(e));
          await sleep(800);
        }
        await sleep(LIVE_FRAME_INTERVAL_MS);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, part, mode, online]);

  return { predictions, engine, error };
}
