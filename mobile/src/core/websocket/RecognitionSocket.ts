import { WS_URL } from '@/core/config/env';
import { getValidAccessToken } from '@/core/http/client';
import type { Part, Prediction } from '@/ml/types';

export type SocketStatus = 'closed' | 'connecting' | 'open';

export interface ServerResult {
  part: Part;
  predictions: Prediction[];
}

interface Handlers {
  onStatus: (s: SocketStatus) => void;
  onResult: (r: ServerResult) => void;
  onError: (message: string) => void;
}

/** Cliente WebSocket del reconocimiento en el servidor, con reconexión automática. */
export class RecognitionSocket {
  private ws: WebSocket | null = null;
  private wantOpen = false;
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private waiting = false; // una imagen a la vez: evita acumular fotogramas
  part: Part;

  constructor(part: Part, private h: Handlers) {
    this.part = part;
  }

  get ready() {
    return this.ws?.readyState === WebSocket.OPEN && !this.waiting;
  }

  async connect() {
    this.wantOpen = true;
    await this.open();
  }

  private async open() {
    if (!this.wantOpen || this.ws) return;
    this.h.onStatus('connecting');
    const token = await getValidAccessToken().catch(() => null);
    if (!token) return this.scheduleRetry();
    const ws = new WebSocket(`${WS_URL}/ws/recognition/?token=${encodeURIComponent(token)}&part=${this.part}`);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.waiting = false;
      this.h.onStatus('open');
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.type === 'result') {
        this.waiting = false;
        this.h.onResult({
          part: msg.part,
          predictions: msg.predictions.map((p: any) => ({
            code: p.code, name: p.name, confidence: p.confidence, isHealthy: p.is_healthy,
          })),
        });
      } else if (msg.type === 'error') {
        this.waiting = false;
        this.h.onError(msg.detail);
      }
    };
    ws.onclose = () => {
      this.ws = null;
      this.h.onStatus('closed');
      this.scheduleRetry();
    };
    ws.onerror = () => ws.close();
  }

  private scheduleRetry() {
    if (!this.wantOpen || this.timer) return;
    const delay = Math.min(1000 * 2 ** this.retry++, 15_000);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.ws = null;
      void this.open();
    }, delay);
  }

  setPart(part: Part) {
    this.part = part;
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ part }));
  }

  sendFrame(base64Jpeg: string) {
    if (!this.ready) return false;
    this.waiting = true;
    this.ws!.send(JSON.stringify({ part: this.part, image: base64Jpeg }));
    return true;
  }

  close() {
    this.wantOpen = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.ws?.close();
    this.ws = null;
  }
}
