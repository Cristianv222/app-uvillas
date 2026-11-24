import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import React, { useEffect, useRef, useState } from 'react';

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function Lifecycle() {
  const root = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const state = { value: 0 };
      const tween = gsap.to(state, {
        value: 1,
        ease: 'none',
        onUpdate: () => setProgress(state.value),
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    mm.add('(prefers-reduced-motion: reduce)', () => setProgress(1));
    return () => mm.revert();
  }, []);

  const split = clamp((progress - 0.08) * 6);
  const fall = clamp((progress - 0.25) * 5);
  const grow = clamp((progress - 0.48) * 2.8);
  const fruit = clamp((progress - 0.82) / 0.16);

  const index = progress < 0.23 ? 0 : progress < 0.5 ? 1 : progress < 0.73 ? 2 : 3;

  const titles = [
    'Un fruto.\nToda una vida.',
    'Lo pequeño\nlo cambia todo.',
    'La vida vuelve\na comenzar.',
    'La vida da\nnuevos frutos.',
  ];

  const descriptions = [
    'Dentro de una uvilla dorada vive el comienzo de una nueva historia. Desliza para explorar su transformación biológica.',
    'El cáliz papiráceo se abre. Las semillas descienden al suelo andino encontrando nutrientes en la tierra volcánica.',
    'La semilla germina. La raíz principal se ancla con firmeza y el primer tallo herbáceo verde busca la luz solar.',
    'La planta de uvilla florece y se ramifica. Hojas acorazonadas y cálices colgantes maduran en nuevas cosechas doradas.',
  ];

  return (
    <section className="lifecycle" data-stage={index} ref={root} id="recorrido">
      <div className="life-sticky">
        <div className="life-copy">
          <p className="eyebrow">PHYSALIS PERUVIANA · CICLO VITAL</p>
          <h2>{titles[index]}</h2>
          <p>{descriptions[index]}</p>
          <a className="text-link" href="/laboratorio">
            Cuidar mi cultivo con IA →
          </a>
        </div>

        <svg
          className="life-art"
          viewBox="0 0 800 800"
          role="img"
          aria-label="Animación botánica: ciclo completo de la uvilla (fruto, semillas, brote y planta madura)"
        >
          <defs>
            {/* Gradientes orgánicos uvilla */}
            <radialGradient id="uv-gold" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="35%" stopColor="#f5a623" />
              <stop offset="80%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#a34e0a" />
            </radialGradient>

            <radialGradient id="uv-pulp" cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#ffe47a" />
              <stop offset="60%" stopColor="#e8882a" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>

            {/* Hojas acorazonadas verde andino */}
            <linearGradient id="uv-leaf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ea844" />
              <stop offset="45%" stopColor="#437a2d" />
              <stop offset="100%" stopColor="#224c1e" />
            </linearGradient>

            {/* Tallo herbáceo verde */}
            <linearGradient id="uv-stem" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3d6828" />
              <stop offset="50%" stopColor="#5a8c3d" />
              <stop offset="100%" stopColor="#325620" />
            </linearGradient>

            {/* Cáliz papiráceo dorado */}
            <linearGradient id="uv-husk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fae29c" />
              <stop offset="50%" stopColor="#dca446" />
              <stop offset="100%" stopColor="#9c6818" />
            </linearGradient>

            {/* Suelo andino fértil */}
            <linearGradient id="soil-layer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a311b" />
              <stop offset="40%" stopColor="#332011" />
              <stop offset="100%" stopColor="#1a1008" />
            </linearGradient>

            <filter id="soft-shadow">
              <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#06120a" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Sombra base */}
          <ellipse
            cx="400"
            cy="725"
            rx={160 + grow * 65}
            ry="18"
            fill="#122416"
            opacity="0.35"
          />

          {/* ── Etapa 1: Suelo y Semillas Cayendo ── */}
          <g opacity={fall}>
            {/* Capa de sustrato andino */}
            <path
              d="M60 710 Q400 680 740 710 L740 780 Q400 795 60 780 Z"
              fill="url(#soil-layer)"
            />
            {/* Línea de humus superior */}
            <path
              d="M60 710 Q400 680 740 710"
              fill="none"
              stroke="#8a6136"
              strokeWidth="5"
            />
            {/* Partículas minerales del suelo */}
            {Array.from({ length: 40 }, (_, i) => (
              <circle
                key={i}
                cx={90 + (i * 67) % 620}
                cy={718 + (i * 19) % 45}
                r={(i % 3) + 1.2}
                fill="#b88c56"
                opacity="0.6"
              />
            ))}

            {/* Raíces primarias germinando */}
            <path
              d="M400 706 L400 765 M400 726 Q370 748 355 768 M400 738 Q435 754 450 772"
              stroke="#eedfb0"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - grow}
            />
          </g>

          {/* ── Etapa 0: Uvilla que se abre en mitades ── */}
          <g opacity={1 - clamp((progress - 0.52) * 6)} filter="url(#soft-shadow)">
            {[-1, 1].map((side) => (
              <g
                key={side}
                transform={`translate(${400 + side * split * 165} ${320 - split * 25}) rotate(${side * split * 26})`}
              >
                {/* Hemisferio exterior dorado brillante */}
                <path
                  d={
                    side === -1
                      ? 'M0 -150 A150 150 0 0 0 0 150 Z'
                      : 'M0 -150 A150 150 0 0 1 0 150 Z'
                  }
                  fill="url(#uv-gold)"
                />
                {/* Brillo especular de piel */}
                <path
                  d={
                    side === -1
                      ? 'M-35 -110 Q-105 -95 -115 -20'
                      : 'M35 -110 Q105 -95 115 -20'
                  }
                  stroke="#fffce0"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.45 * (1 - split)}
                />
                {/* Pulpa translúcida expuesta */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx={split * 70}
                  ry="145"
                  fill="url(#uv-pulp)"
                />
                {/* Semillas diminutas de uvilla en pulpa */}
                {Array.from({ length: 48 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx={Math.sin(i * 2.3) * Math.sqrt(i / 48) * split * 58}
                    cy={Math.cos(i * 2.3) * Math.sqrt(i / 48) * 126}
                    rx={split * 3.2}
                    ry="5.2"
                    fill="#fff4c2"
                    stroke="#c47814"
                    strokeWidth="0.8"
                  />
                ))}
              </g>
            ))}
          </g>

          {/* Semillas cayendo en parábola hacia la tierra */}
          {Array.from({ length: 14 }, (_, i) => {
            const f = clamp(fall * 1.35 - i * 0.024);
            const x = 400 + Math.sin(i * 14) * 110 * f;
            const y = 330 + f * f * 380;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="4.5"
                ry="6.5"
                fill="#f5c258"
                stroke="#a66212"
                strokeWidth="1"
                opacity={split * (1 - grow)}
                transform={`rotate(${i * 28 * f} ${x} ${y})`}
              />
            );
          })}

          {/* ── Etapa 2 y 3: Planta Uvilla Auténtica que Crece (Brote y Cosecha) ── */}
          <g opacity={grow}>
            {/* Tallo central herbáceo verde */}
            <path
              d="M400 710 Q390 540 405 380 T398 150"
              fill="none"
              stroke="url(#uv-stem)"
              strokeWidth="14"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - grow}
            />

            {/* Ramificaciones y Nodos */}
            <path
              d="M400 520 Q480 470 540 430"
              fill="none"
              stroke="url(#uv-stem)"
              strokeWidth="9"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - grow}
            />
            <path
              d="M403 420 Q320 370 260 330"
              fill="none"
              stroke="url(#uv-stem)"
              strokeWidth="8"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - grow}
            />
            <path
              d="M402 300 Q470 250 515 210"
              fill="none"
              stroke="url(#uv-stem)"
              strokeWidth="7"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - grow}
            />

            {/* Hojas acorazonadas reales de Uvilla (Cordate) con nervaduras */}
            {[
              // x, y, angle, scale, side
              { x: 395, y: 610, rot: -28, s: 0.9, side: -1 },
              { x: 405, y: 550, rot: 25, s: 0.95, side: 1 },
              { x: 480, y: 475, rot: 40, s: 0.85, side: 1 },
              { x: 540, y: 430, rot: 15, s: 0.8, side: 1 },
              { x: 335, y: 380, rot: -35, s: 0.85, side: -1 },
              { x: 260, y: 330, rot: -20, s: 0.75, side: -1 },
              { x: 405, y: 340, rot: 30, s: 0.8, side: 1 },
              { x: 470, y: 250, rot: 45, s: 0.75, side: 1 },
              { x: 370, y: 240, rot: -30, s: 0.75, side: -1 },
              { x: 398, y: 150, rot: 10, s: 0.65, side: 1 },
            ].map((lf, i) => {
              const leafGrow = clamp(grow * 2.2 - i * 0.12);
              return (
                <g
                  key={i}
                  transform={`translate(${lf.x} ${lf.y}) rotate(${lf.rot}) scale(${leafGrow * lf.s})`}
                >
                  {/* Peciolo */}
                  <path d="M0 0 Q15 -8 30 -5" stroke="#487332" strokeWidth="4" fill="none" />
                  {/* Hoja Acorazonada (Physalis) */}
                  <path
                    d="M30 -5 C35 -55 95 -65 140 -35 C175 -8 185 20 195 30 C155 55 95 65 50 35 C30 20 28 5 30 -5 Z"
                    fill="url(#uv-leaf)"
                    filter="url(#soft-shadow)"
                  />
                  {/* Nervadura central */}
                  <path d="M30 -5 Q110 5 195 30" stroke="#9ad172" strokeWidth="3" fill="none" opacity="0.75" />
                  {/* Nervaduras secundarias */}
                  <path d="M70 -2 Q85 -28 115 -42" stroke="#8ac460" strokeWidth="1.8" fill="none" opacity="0.5" />
                  <path d="M110 8 Q125 -15 155 -28" stroke="#8ac460" strokeWidth="1.8" fill="none" opacity="0.5" />
                  <path d="M80 5 Q95 30 115 45" stroke="#8ac460" strokeWidth="1.8" fill="none" opacity="0.5" />
                  <path d="M125 14 Q140 35 160 48" stroke="#8ac460" strokeWidth="1.8" fill="none" opacity="0.5" />
                </g>
              );
            })}

            {/* Flores amarillas de uvilla en axilas */}
            {[
              { x: 402, y: 460 },
              { x: 365, y: 320 },
              { x: 440, y: 220 },
            ].map((fl, fi) => (
              <g
                key={fi}
                transform={`translate(${fl.x} ${fl.y}) scale(${fruit})`}
                opacity={fruit}
              >
                {[0, 72, 144, 216, 288].map((deg) => (
                  <path
                    key={deg}
                    transform={`rotate(${deg})`}
                    d="M0 0 Q-10 -18 0 -26 Q10 -18 0 0"
                    fill="#facc15"
                    stroke="#eab308"
                    strokeWidth="1.2"
                  />
                ))}
                <circle cx="0" cy="0" r="5" fill="#4a2412" />
              </g>
            ))}
          </g>

          {/* ── Etapa 3: Frutos y Cálices Maduros (Cálices Colgantes y Abiertos) ── */}
          <g opacity={fruit}>
            {[
              // Cáliz 1: Abierto mostrando fruto naranja (como en foto 2 del usuario)
              { x: 480, y: 470, type: 'open', scale: 1.1 },
              // Cáliz 2: Capacho dorado colgante clásico
              { x: 535, y: 435, type: 'closed-gold', scale: 1.05 },
              // Cáliz 3: Capacho abierto a la izquierda
              { x: 265, y: 335, type: 'open', scale: 1.0 },
              // Cáliz 4: Capacho dorado superior
              { x: 510, y: 215, type: 'closed-gold', scale: 0.95 },
              // Cáliz 5: Capacho verde joven
              { x: 370, y: 245, type: 'closed-green', scale: 0.9 },
            ].map((fr, idx) => {
              const currentScale = fruit * fr.scale;
              return (
                <g key={idx} transform={`translate(${fr.x} ${fr.y}) scale(${currentScale})`}>
                  {/* Pedúnculo verde colgante */}
                  <path d="M0 -30 Q5 -15 0 0" stroke="#487332" strokeWidth="3" fill="none" />

                  {fr.type === 'open' ? (
                    // CÁLIZ ABIERTO: Sépalos papiráceos dorados que revelan la baya naranja brillante
                    <g filter="url(#soft-shadow)">
                      {/* 5 sépalos abiertos en flor */}
                      {[0, 72, 144, 216, 288].map((rot) => (
                        <path
                          key={rot}
                          transform={`rotate(${rot})`}
                          d="M0 0 Q-16 25 0 44 Q16 25 0 0"
                          fill="url(#uv-husk)"
                          stroke="#a67118"
                          strokeWidth="1.2"
                        />
                      ))}
                      {/* Baya naranja esférica y brillante */}
                      <circle cx="0" cy="0" r="22" fill="url(#uv-gold)" />
                      {/* Brillo especular de pulpa */}
                      <ellipse
                        cx="-6"
                        cy="-8"
                        rx="7"
                        ry="4"
                        fill="#ffffff"
                        opacity="0.8"
                        transform="rotate(-30 -6 -8)"
                      />
                    </g>
                  ) : fr.type === 'closed-gold' ? (
                    // CÁLIZ CERRADO DORADO: Farolillo papiráceo con costillas
                    <g filter="url(#soft-shadow)">
                      <path
                        d="M0 0 C-36 12 -42 45 0 72 C42 45 36 12 0 0 Z"
                        fill="url(#uv-husk)"
                        stroke="#9e6914"
                        strokeWidth="1.8"
                      />
                      {/* Costillas longitudinales del cáliz */}
                      <path d="M0 0 Q-22 36 0 72" stroke="#b87e22" strokeWidth="1.5" fill="none" opacity="0.6" />
                      <path d="M0 0 Q22 36 0 72" stroke="#b87e22" strokeWidth="1.5" fill="none" opacity="0.6" />
                      <path d="M0 0 L0 72" stroke="#e8af46" strokeWidth="1.8" fill="none" opacity="0.8" />
                    </g>
                  ) : (
                    // CÁLIZ VERDE JOVEN
                    <g filter="url(#soft-shadow)">
                      <path
                        d="M0 0 C-30 10 -35 40 0 64 C35 40 30 10 0 0 Z"
                        fill="#6ca33e"
                        stroke="#447320"
                        strokeWidth="1.8"
                      />
                      <path d="M0 0 Q-18 32 0 64" stroke="#447320" strokeWidth="1.4" fill="none" opacity="0.7" />
                      <path d="M0 0 Q18 32 0 64" stroke="#447320" strokeWidth="1.4" fill="none" opacity="0.7" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Botones de control de etapas */}
        <div className="life-stages" aria-label="Etapas del ciclo vital">
          {['Fruto', 'Semillas', 'Brote', 'Cosecha'].map((label, i) => (
            <button
              key={label}
              aria-current={index === i ? 'step' : undefined}
              onClick={() => {
                const el = root.current;
                if (el) {
                  window.scrollTo({
                    top:
                      window.scrollY +
                      el.getBoundingClientRect().top +
                      (el.offsetHeight - window.innerHeight) * [0, 0.32, 0.6, 0.98][i],
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'instant'
                      : 'smooth',
                  });
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="life-bottom">
          <span>FRUTO / SEMILLA / BROTE / NUEVA COSECHA</span>
          <span>DESLIZA PARA DARLE VIDA</span>
          <div style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </section>
  );
}
