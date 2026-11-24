import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'Inicio', key: 'inicio' },
  { href: '/#como-funciona', label: 'Cómo funciona', key: '' },
  { href: '/documentacion', label: 'Documentación', key: 'documentacion' },
];

export function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
      {/* Cáliz (capacho) abierto con el fruto dentro */}
      <path d="M16 3 C9 7 5 13 6 20 C7 26 11 29 16 29 C21 29 25 26 26 20 C27 13 23 7 16 3 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 3 V29 M16 8 C12 13 11 20 13 28 M16 8 C20 13 21 20 19 28" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
      <circle cx="16" cy="20" r="4.6" fill="var(--uvilla)" />
    </svg>
  );
}

export function SiteHeader({ current, tone }: { current: 'inicio' | 'laboratorio' | 'documentacion' | 'requisitos'; tone?: 'dark' }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`site-header ${tone === 'dark' ? 'site-header--dark' : ''}`}>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <a className="brand" href="/" aria-label="Uvillas, inicio">
        <Logo />
        <span>Uvillas</span>
      </a>
      <button className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(o => !o)}>
        {open ? 'Cerrar' : 'Menú'}
      </button>
      <nav id="site-nav" className={open ? 'is-open' : ''} aria-label="Secciones">
        {LINKS.map(l => <a key={l.href} href={l.href} aria-current={l.key === current ? 'page' : undefined} onClick={() => setOpen(false)}>{l.label}</a>)}
        <a className="nav-cta" href="/laboratorio" aria-current={current === 'laboratorio' ? 'page' : undefined}>Abrir laboratorio</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="footer-brand"><Logo /> Uvillas</p>
      <nav className="footer-links" aria-label="Información">
        <a href="/documentacion">Documentación</a>
        <a href="/requisitos">Requisitos</a>
      </nav>
    </footer>
  );
}
