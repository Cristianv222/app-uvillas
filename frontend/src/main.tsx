import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/schibsted-grotesk/wght.css';
import '@fontsource-variable/schibsted-grotesk/wght-italic.css';
import './style.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LaboratoryPage = lazy(() => import('./pages/LaboratoryPage'));

const path = location.pathname.replace(/\/$/, '') || '/';
if (path === '/' && location.hash === '#laboratorio') location.replace('/laboratorio');

function NotFound() {
  return (
    <main className="not-found">
      <h1>Página no encontrada</h1>
      <p>La dirección no existe. Vuelve al inicio o abre el laboratorio.</p>
      <p><a className="btn btn-primary" href="/">Ir al inicio</a> <a className="btn btn-quiet" href="/laboratorio">Abrir laboratorio</a></p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p className="route-loading">Cargando…</p>}>
      {path === '/' ? <LandingPage /> : path === '/laboratorio' ? <LaboratoryPage /> : <NotFound />}
    </Suspense>
  </StrictMode>,
);

// App instalable en Android: el service worker solo funciona en HTTPS o en localhost.
if ('serviceWorker' in navigator && import.meta.env.PROD && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* la web sigue funcionando sin instalarse */ });
  });
}
