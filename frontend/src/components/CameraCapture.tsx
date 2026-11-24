import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Cámara dentro de la página (webcam en la computadora, cámara trasera en el celular).
 * El navegador solo permite la cámara en HTTPS o en localhost; si no se puede, `canUseCamera()`
 * devuelve false y el laboratorio usa el selector de archivos con `capture`.
 */
export function canUseCamera() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
}

export function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameras, setCameras] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(async stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) setCameras(devices.filter(d => d.kind === 'videoinput').length);
      })
      .catch((e: DOMException) => {
        if (cancelled) return;
        setError(
          e.name === 'NotAllowedError' ? 'El navegador no tiene permiso para usar la cámara. Actívalo en el candado de la barra de direcciones y vuelve a intentar.'
          : e.name === 'NotFoundError' || e.name === 'OverconstrainedError' ? 'No se encontró una cámara en este equipo. Usa «Elegir de la galería».'
          : e.name === 'NotReadableError' ? 'La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentar.'
          : 'No se pudo abrir la cámara. Usa «Elegir de la galería».',
        );
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    setFlash(true);
    canvas.toBlob(blob => {
      if (!blob) { setError('No se pudo capturar la foto.'); return; }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      onCapture(new File([blob], `uvilla-${stamp}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  }

  // En un portal: las tarjetas animadas crean su propio contexto y encerrarían la vista a pantalla completa.
  return createPortal(
    <div className="camera" role="dialog" aria-modal="true" aria-label="Cámara">
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted className={facing === 'user' ? 'mirror' : ''} />
        {!ready && !error && <p className="camera-status">Abriendo la cámara…</p>}
        {error && <p className="camera-status camera-error" role="alert">{error}</p>}
        {ready && <div className="camera-guide" aria-hidden="true"><span /></div>}
        {ready && <p className="camera-tip">Centra la parte de la planta dentro del recuadro</p>}
        {flash && <div className="camera-flash" aria-hidden="true" onAnimationEnd={() => setFlash(false)} />}
      </div>
      <div className="camera-bar">
        <button type="button" className="pill pill-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="shutter" onClick={capture} disabled={!ready} aria-label="Capturar foto"><span /></button>
        <button type="button" className="pill pill-ghost" onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))} disabled={cameras < 2}>
          Girar
        </button>
      </div>
    </div>,
    document.body,
  );
}
