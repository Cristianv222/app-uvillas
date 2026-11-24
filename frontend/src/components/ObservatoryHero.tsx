import { useState } from 'react';
import UvillaObservatory from './UvillaObservatory';

/**
 * Portada 3D de Joel Pilacuán: planta de uvilla en Three.js con puntos interactivos.
 * Las cifras de las tarjetas son las reales del proyecto.
 */
type Focus = 'caliz' | 'fruto' | 'tallo' | 'base' | null;
type HotspotKey = 'hoja' | 'caliz' | 'fruto' | 'tallo';

const ORGANS: { parte: string; label: string; focus: Focus }[] = [
  { parte: 'hojas', label: 'Hoja', focus: null },
  { parte: 'tallos', label: 'Tallo', focus: 'tallo' },
  { parte: 'frutos', label: 'Fruto', focus: 'fruto' },
];

const HOTSPOTS: { key: HotspotKey; label: string; title: string; text: string; parte: string; organ: string; focus: Focus }[] = [
  { key: 'hoja', label: 'Hojas', title: 'Hoja', text: 'Ocho clases: Mancha gris, Muerte descendente, Marchitez bacterial y otras cinco, incluida la hoja sana.', parte: 'hojas', organ: 'una hoja', focus: null },
  { key: 'caliz', label: 'Inspeccionar cáliz', title: 'Capacho dorado', text: 'Envoltura que cubre el fruto mientras madura. La Mancha grasienta avanza desde su punta.', parte: 'frutos', organ: 'un fruto', focus: 'caliz' },
  { key: 'fruto', label: 'Frutos maduros', title: 'Fruto', text: 'Siete clases. Blando y húmedo con micelio sugiere Esclerotiniosis; firme y seco, Pudrición dura.', parte: 'frutos', organ: 'un fruto', focus: 'fruto' },
  { key: 'tallo', label: 'Estructura vascular', title: 'Tallo', text: 'Cuatro clases: Esclerotiniosis, Moho blanco, Pudrición dura y tallo sano.', parte: 'tallos', organ: 'un tallo', focus: 'tallo' },
];

export function ObservatoryHero() {
  const [menu, setMenu] = useState(false);
  const [observatoryMode, setObservatoryMode] = useState(0);
  const [focusPart, setFocusPart] = useState<Focus>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const specimens = [
    { name: 'Planta de uvilla (Physalis)', tag: 'Espécimen 3D completo' },
    { name: 'Cáliz dorado en capacho', tag: 'Cáliz protector maduro' },
    { name: 'Fruto maduro y pulpa', tag: 'Baya naranja andina' },
    { name: 'Vórtice de esporas doradas', tag: 'Dispersión de bio-partículas' },
  ];

  const handlePrevSpecimen = () => {
    setObservatoryMode((prev) => (prev - 1 + specimens.length) % specimens.length);
    setFocusPart(null);
  };

  const handleNextSpecimen = () => {
    setObservatoryMode((prev) => (prev + 1) % specimens.length);
    setFocusPart(null);
  };

  const handleHotspotClick = (key: HotspotKey | 'base') => {
    const focus: Focus = key === 'base' ? 'base' : HOTSPOTS.find(h => h.key === key)!.focus;
    if (activeHotspot === key) {
      setFocusPart(null);
      setActiveHotspot(null);
    } else {
      setFocusPart(focus);
      setActiveHotspot(key);
    }
  };

  return (
      <section className="saltmere-viewport" id="inicio">
        {/* Background 3D Three.js Canvas con árbol de uvilla y partículas */}
        <UvillaObservatory mode={observatoryMode} focusPart={focusPart} />

        {/* Ambient mist and vignette overlays */}
        <div className="saltmere-fog-overlay" aria-hidden="true" />
        <div className="saltmere-vignette" aria-hidden="true" />

        {/* ── Top Header / Saltmere Nav ── */}
        <header className="saltmere-header">
          <a className="brand" href="#inicio" aria-label="Uvillas – inicio">
            <span className="brand-mark">✳</span> uvillas<span className="brand-dot">.</span>
          </a>

          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-controls="navigation"
            onClick={() => setMenu(!menu)}
          >
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
          </button>

          <nav id="navigation" className={`saltmere-nav-pill ${menu ? 'open' : ''}`} onClick={() => setMenu(false)}>
            <a href="#inicio" className="active">Inicio</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#resultado">El resultado</a>
            <a href="#equipo">Equipo</a>
            <a href="/documentacion">Documentación</a>
            <a href="/laboratorio" className="nav-highlight">Laboratorio IA</a>
          </nav>

          <div className="saltmere-header-actions">
            <button
              className="saltmere-icon-btn"
              title="Alternar vórtice de partículas"
              onClick={() => setObservatoryMode((prev) => (prev === 3 ? 0 : 3))}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            <a href="/laboratorio" className="saltmere-cta-btn">
              Analizar mi planta →
            </a>
          </div>
        </header>

        {/* ── Main Hero Content ── */}
        <div className="saltmere-stage">
          {/* Columna Izquierda: Copywriting y CTAs */}
          <div className="saltmere-copy">
            <p className="saltmere-eyebrow">PHYSALIS PERUVIANA · OBSERVATORIO</p>

            <h1 className="saltmere-title">
              Una mirada profunda<br />
              <span className="saltmere-title-pill">al cultivo andino.</span>
            </h1>

            <div className="saltmere-desc-box">
              <p>
                Diagnóstico de enfermedades de la uvilla con visión artificial y un sistema experto:
                una foto de la hoja, el tallo o el fruto, y reglas que explican qué enfermedad es y con cuánta certeza.
              </p>
            </div>

            <div className="organ-picker" role="group" aria-labelledby="organ-picker-label">
              <p id="organ-picker-label">¿Qué parte de la planta vas a analizar?</p>
              <div>
                {ORGANS.map(o => (
                  <a key={o.parte} className="organ-chip" href={`/laboratorio?parte=${o.parte}`}
                    onMouseEnter={() => setFocusPart(o.focus)} onFocus={() => setFocusPart(o.focus)}>
                    {o.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="saltmere-cta-row">
              <a className="saltmere-primary-btn" href="/laboratorio">
                <span className="btn-chevron">›</span> Iniciar Observación
              </a>
              <a className="saltmere-ghost-btn" href="#como-funciona">
                Cómo funciona ↓
              </a>
            </div>
          </div>

          {/* Área Central: puntos interactivos sobre la planta 3D; cada uno abre el análisis de ese órgano */}
          <div className="saltmere-hotspots-layer">
            {HOTSPOTS.map(h => (
              <div key={h.key} className={`saltmere-hotspot hs-${h.key} ${activeHotspot === h.key ? 'active' : ''}`}>
                <button
                  className="hotspot-trigger"
                  onClick={() => handleHotspotClick(h.key)}
                  aria-expanded={activeHotspot === h.key}
                  aria-label={`Inspeccionar ${h.label.toLowerCase()}`}
                >
                  <span className="hs-plus">+</span> {h.label}
                </button>
                {activeHotspot === h.key && (
                  <div className="hotspot-card">
                    <h4>{h.title}</h4>
                    <p>{h.text}</p>
                    <a className="hotspot-action" href={`/laboratorio?parte=${h.parte}`}>Analizar {h.organ} ›</a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Columna Derecha: Tarjetas flotantes de telemetría (Glassmorphism) */}
          <div className="saltmere-telemetry">
            {/* Card 1: Altitud y clima */}
            <div className="telemetry-card">
              <div className="tc-header">
                <span>Acierto en órgano sano</span>
                <span className="tc-arrow">↗</span>
              </div>
              <div className="tc-wave-chart">
                <svg viewBox="0 0 100 28" fill="none">
                  <path
                    d="M0 20 Q20 5 45 15 T85 10 T100 22"
                    stroke="#e8882a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 24 Q30 18 55 24 T100 25"
                    stroke="#d4a850"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    opacity="0.6"
                  />
                </svg>
              </div>
              <div className="tc-stat">
                <strong>80–95</strong>
                <small>%</small>
              </div>
              <p className="tc-sub">3 modelos TFLite · prueba del 15 %</p>
            </div>

            {/* Card 2: Salubridad foliar */}
            <div className="telemetry-card">
              <div className="tc-header">
                <span>Certeza del sistema experto</span>
                <span className="tc-arrow">↗</span>
              </div>
              <div className="tc-spark-chart">
                <svg viewBox="0 0 100 24" fill="none">
                  <path
                    d="M0 12 Q15 6 30 14 T60 8 T85 16 T100 6"
                    stroke="#52c41a"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="6" r="3.5" fill="#52c41a" />
                </svg>
              </div>
              <div className="tc-stat">
                <strong>0,79</strong>
                <small>FC</small>
              </div>
              <p className="tc-sub">Ejemplo real: Mancha gris en hoja</p>
            </div>
          </div>
        </div>

        {/* ── Bottom Controls Bar ── */}
        <div className="saltmere-bottom-bar">
          <button
            className="saltmere-base-btn"
            onClick={() => handleHotspotClick('base')}
          >
            <span className="hs-plus">+</span> Base & Sustrato
          </button>

          <div className="saltmere-specimen-pill">
            <button
              className="specimen-nav-arrow"
              onClick={handlePrevSpecimen}
              aria-label="Espécimen anterior"
            >
              ‹
            </button>
            <span className="specimen-name">{specimens[observatoryMode].name}</span>
            <button
              className="specimen-nav-arrow"
              onClick={handleNextSpecimen}
              aria-label="Siguiente espécimen"
            >
              ›
            </button>
          </div>
        </div>
      </section>
  );
}
