import React, { useState } from 'react';
import UvillaObservatory from '../components/UvillaObservatory';

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [observatoryMode, setObservatoryMode] = useState(0);
  const [focusPart, setFocusPart] = useState<'caliz' | 'fruto' | 'tallo' | 'base' | null>(null);
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

  const handleHotspotClick = (part: 'caliz' | 'fruto' | 'tallo' | 'base') => {
    if (focusPart === part) {
      setFocusPart(null);
      setActiveHotspot(null);
    } else {
      setFocusPart(part);
      setActiveHotspot(part);
    }
  };

  return (
    <>
      <a className="skip" href="#sabores">Saltar al contenido</a>

      {/* ══════════════════════════════════════════
          HERO OBSERVATORIO SALTMERE — Uvilla 3D
      ══════════════════════════════════════════ */}
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
            <a href="#sabores">Propiedades</a>
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
                Monitoreo fitosanitario con visión artificial. Detección temprana en hojas,
                tallos y cálices para preservar la vitalidad de la uvilla andina.
              </p>
            </div>

            <div className="saltmere-cta-row">
              <a className="saltmere-primary-btn" href="/laboratorio">
                <span className="btn-chevron">›</span> Iniciar Observación
              </a>
              <a className="saltmere-ghost-btn" href="#sabores">
                Ver propiedades ↓
              </a>
            </div>

            <div className="saltmere-social-proof">
              <div className="avatar-stack">
                <span className="avatar av-1">🌿</span>
                <span className="avatar av-2">🍂</span>
                <span className="avatar av-3">🟠</span>
              </div>
              <div className="proof-text">
                <strong>4.9</strong>
                <span>· 19 patologías clasificadas por IA</span>
              </div>
            </div>
          </div>

          {/* Área Central: Hotspots interactivos sobre la planta 3D */}
          <div className="saltmere-hotspots-layer">
            {/* Hotspot 1: Cáliz dorado */}
            <div className={`saltmere-hotspot hs-caliz ${activeHotspot === 'caliz' ? 'active' : ''}`}>
              <button
                className="hotspot-trigger"
                onClick={() => handleHotspotClick('caliz')}
                aria-label="Inspeccionar cáliz"
              >
                <span className="hs-plus">+</span> Inspeccionar cáliz
              </button>
              {activeHotspot === 'caliz' && (
                <div className="hotspot-card">
                  <h4>Capacho dorado</h4>
                  <p>Envoltura papirácea que protege el fruto contra plagas, radiación UV y heladas andinas.</p>
                </div>
              )}
            </div>

            {/* Hotspot 2: Fruto y pulpa */}
            <div className={`saltmere-hotspot hs-fruto ${activeHotspot === 'fruto' ? 'active' : ''}`}>
              <button
                className="hotspot-trigger"
                onClick={() => handleHotspotClick('fruto')}
                aria-label="Inspeccionar fruto"
              >
                <span className="hs-plus">+</span> Frutos maduros
              </button>
              {activeHotspot === 'fruto' && (
                <div className="hotspot-card">
                  <h4>Baya naranja andina</h4>
                  <p>Alto contenido de antioxidantes, provitamina A y fósforo. Pulpa jugosa agridulce.</p>
                </div>
              )}
            </div>

            {/* Hotspot 3: Tallo y ramas */}
            <div className={`saltmere-hotspot hs-tallo ${activeHotspot === 'tallo' ? 'active' : ''}`}>
              <button
                className="hotspot-trigger"
                onClick={() => handleHotspotClick('tallo')}
                aria-label="Inspeccionar tallo"
              >
                <span className="hs-plus">+</span> Estructura vascular
              </button>
              {activeHotspot === 'tallo' && (
                <div className="hotspot-card">
                  <h4>Tallo monopódico</h4>
                  <p>Tallos angulosos con vellosidades protectoras y entrenudos con ramificación dicotómica.</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Tarjetas flotantes de telemetría (Glassmorphism) */}
          <div className="saltmere-telemetry">
            {/* Card 1: Altitud y clima */}
            <div className="telemetry-card">
              <div className="tc-header">
                <span>Rango Altitudinal</span>
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
                <strong>2,400</strong>
                <small>msnm</small>
              </div>
              <p className="tc-sub">13°C – 18°C · Andes óptimos</p>
            </div>

            {/* Card 2: Salubridad foliar */}
            <div className="telemetry-card">
              <div className="tc-header">
                <span>Salubridad foliar</span>
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
                <strong>98.4</strong>
                <small>%</small>
              </div>
              <p className="tc-sub">Modelo TFLite · Sin anomalías</p>
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

      <main>
        {/* ───── Propiedades y vitrina de fotos reales ───── */}
        <section className="possibilities section" id="sabores">
          <div className="possibilities-head">
            <p className="eyebrow">POTENCIAL AGRONÓMICO Y BOTÁNICO</p>
            <h2>Pequeña por fuera.<br /><em>Inmensa en beneficios.</em></h2>
          </div>

          {/* Vitrina de fotos con datos — 3 imágenes reales del usuario */}
          <div className="fruit-vitrine">
            <div className="vitrine-photo vitrine-photo--caliz">
              <img
                src="/photos/caliz-planta.jpg"
                alt="Cálices secos dorados de uvilla en la planta"
              />
              <div className="vitrine-label">
                <span>CÁLIZ (CAPACHO)</span>
                <p>Envoltura protectora natural. Cambia de verde a dorado pajizo cuando el fruto alcanza su punto óptimo.</p>
              </div>
            </div>
            <div className="vitrine-photo vitrine-photo--fruto">
              <img
                src="/photos/frutos-naranja.jpg"
                alt="Frutos naranjas de uvilla maduros apilados y cortados"
              />
              <div className="vitrine-label">
                <span>FRUTO Y PULPA</span>
                <p>Baya naranja brillante y jugosa. Pulpa aromática cargada de antioxidantes y semillas ricas en fibra.</p>
              </div>
            </div>
            <div className="vitrine-photo vitrine-photo--cosecha">
              <img
                src="/photos/frutos-cosecha.jpg"
                alt="Frutos y hojas de uvilla en cosecha"
              />
              <div className="vitrine-label">
                <span>HOJAS Y TALLOS</span>
                <p>Planta perenne de porte herbáceo arbustivo. Tallos angulosos con vellosidades y hojas aterciopeladas.</p>
              </div>
            </div>
            <div className="vitrine-data">
              <h3>Composición nutricional</h3>
              <div className="nutrient-list">
                <div className="nutrient"><span>Vit. C</span><strong>43 mg/100g</strong></div>
                <div className="nutrient"><span>Vit. A</span><strong>648 IU</strong></div>
                <div className="nutrient"><span>Hierro</span><strong>1.7 mg/100g</strong></div>
                <div className="nutrient"><span>Altitud óptima</span><strong>1 800 – 2 800 msnm</strong></div>
                <div className="nutrient"><span>Antioxidantes</span><strong>Índice alto</strong></div>
              </div>
            </div>
          </div>

          <div className="uses">
            <article>
              <div className="use-icon">◉</div>
              <h3>Sabor de los Andes</h3>
              <p>Rica en provitamina A, vitamina C y complejo B. Sus flavonoides y polifenoles
                potencian el sistema inmune y regulan la glicemia.</p>
            </article>
            <article>
              <div className="use-icon">◒</div>
              <h3>Transformación y Mercado</h3>
              <p>Alta demanda para exportación fresca en capacho, deshidratados, mermeladas gourmet,
                destilados y salsas agridulces para gastronomía internacional.</p>
            </article>
            <article>
              <div className="use-icon">✳</div>
              <h3>Manejo Sostenible</h3>
              <p>El monitoreo fitosanitario con IA reduce agroquímicos hasta un 40 %, protege
                polinizadores y prolonga la vida productiva del cultivo perenne.</p>
            </article>
          </div>
        </section>

        {/* ───── CTA Laboratorio (Acceso directo sin registro) ───── */}
        <section className="lab-cta-section">
          <div className="lab-cta-inner">
            <div className="lab-cta-copy">
              <p className="eyebrow">LABORATORIO DE IMÁGENES · SIN REGISTRO</p>
              <h2>Sube una foto.<br /><em>El modelo te orienta.</em></h2>
              <p>Nuestro motor de visión artificial analiza hojas, tallos y frutos. Tres modelos
                TFLite especializados, resultado inmediato, sin necesidad de cuenta.</p>
              <a className="button button-large" href="/laboratorio">
                Entrar al laboratorio →
              </a>
              <small>Sin registro · Sin descarga · Acceso directo desde el navegador</small>
            </div>
            <div className="lab-cta-visual">
              <div className="lab-phone-preview">
                <div className="lp-screen">
                  <img
                    src="/photos/caliz-planta.jpg"
                    alt="Vista previa del laboratorio analizando un fruto"
                  />
                  <div className="lp-reticle">
                    <span /><span /><span /><span />
                  </div>
                </div>
                <div className="lp-result">
                  <span>MODELO · FRUTOS</span>
                  <strong>Fruto sano · 98.4%</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ───── Footer ───── */}
      <footer>
        <a className="brand" href="#inicio">
          <span className="brand-mark">✳</span> uvillas<span className="brand-dot">.</span>
        </a>
        <p>
          De la hoja al fruto. Del conocimiento al cuidado del agro.<br />
          <em>Proyecto Uvillas · Ingeniería de Software y Machine Learning</em>
        </p>
        <a href="/photos/CREDITS.txt" className="footer-credit">Créditos fotográficos</a>
      </footer>
    </>
  );
}
