/** Ilustraciones de línea propias, en el estilo de la portada (verde hoja y ámbar de uvilla). */

export function LeafArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="organ-art">
      <defs>
        <linearGradient id="leafFill" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2f6b3c" />
          <stop offset="1" stopColor="#7fb069" />
        </linearGradient>
      </defs>
      <path d="M30 132 C 22 82, 56 34, 130 26 C 132 92, 92 136, 30 132 Z" fill="url(#leafFill)" opacity=".92" />
      <path d="M30 132 C 62 104, 92 70, 124 32" fill="none" stroke="#e7f3dc" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="none" stroke="#e7f3dc" strokeWidth="1.3" strokeLinecap="round" opacity=".7">
        <path d="M52 112 C 46 96, 48 84, 54 74" /><path d="M52 112 C 68 112, 80 108, 90 100" />
        <path d="M72 92 C 68 78, 70 66, 78 56" /><path d="M72 92 C 88 92, 100 86, 108 78" />
        <path d="M94 66 C 92 56, 96 48, 102 42" /><path d="M94 66 C 106 66, 114 60, 120 54" />
      </g>
      <g fill="#c8743a" opacity=".85"><circle cx="86" cy="78" r="5" /><circle cx="64" cy="104" r="3.5" /><circle cx="104" cy="56" r="3" /></g>
      <path d="M30 132 L 18 146" stroke="#2f6b3c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function StemArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="organ-art">
      <path d="M78 150 C 74 116, 86 84, 78 52 C 74 34, 82 20, 86 10" fill="none" stroke="#5b8f43" strokeWidth="8" strokeLinecap="round" />
      <path d="M78 150 C 74 116, 86 84, 78 52 C 74 34, 82 20, 86 10" fill="none" stroke="#a9d18e" strokeWidth="2" strokeLinecap="round" opacity=".5" />
      <path d="M80 96 C 98 84, 118 84, 136 92 C 120 104, 98 106, 80 96 Z" fill="#4f8a44" />
      <path d="M78 64 C 60 50, 40 50, 24 58 C 40 70, 62 72, 78 64 Z" fill="#6aa257" />
      <g stroke="#e7f3dc" strokeWidth="1.2" fill="none" opacity=".6"><path d="M82 95 C 100 92, 118 91, 132 92" /><path d="M76 63 C 60 60, 44 59, 28 58" /></g>
      <ellipse cx="80" cy="122" rx="7" ry="13" fill="#3b2a1d" opacity=".75" />
      <ellipse cx="80" cy="122" rx="4" ry="8" fill="#f0f3ea" opacity=".55" />
      <g fill="#111" opacity=".8"><circle cx="78" cy="118" r="1.6" /><circle cx="82" cy="126" r="1.4" /></g>
    </svg>
  );
}

export function FruitArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="organ-art">
      <defs>
        <radialGradient id="berry" cx=".38" cy=".35" r=".7">
          <stop offset="0" stopColor="#ffd28a" />
          <stop offset=".45" stopColor="#f39a2c" />
          <stop offset="1" stopColor="#b85d14" />
        </radialGradient>
      </defs>
      <path d="M80 8 L 80 22" stroke="#6f8f4a" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 22 C 48 34, 30 68, 36 104 C 42 136, 62 150, 80 150 C 98 150, 118 136, 124 104 C 130 68, 112 34, 80 22 Z" fill="#d9b56c" opacity=".35" stroke="#d9b56c" strokeWidth="2" />
      <g fill="none" stroke="#d9b56c" strokeWidth="1.4" opacity=".75">
        <path d="M80 22 C 62 46, 56 86, 64 146" /><path d="M80 22 C 98 46, 104 86, 96 146" /><path d="M80 22 V 150" />
      </g>
      <circle cx="80" cy="104" r="27" fill="url(#berry)" />
      <ellipse cx="70" cy="94" rx="7" ry="4.5" fill="#fff" opacity=".45" transform="rotate(-30 70 94)" />
    </svg>
  );
}

/* Íconos de los pasos */
export function StepIcon({ kind }: { kind: 'foto' | 'modelo' | 'preguntas' | 'reglas' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="step-icon">
      {kind === 'foto' && <g {...common}><rect x="4" y="9" width="24" height="17" rx="4" /><path d="M11 9 L13 5 H19 L21 9" /><circle cx="16" cy="17.5" r="5" /></g>}
      {kind === 'modelo' && <g {...common}><circle cx="8" cy="9" r="2.5" /><circle cx="8" cy="23" r="2.5" /><circle cx="24" cy="16" r="2.5" /><circle cx="16" cy="16" r="2.5" /><path d="M10.2 10.3 L13.8 14.7 M10.2 21.7 L13.8 17.3 M18.5 16 H21.5" /></g>}
      {kind === 'preguntas' && <g {...common}><path d="M6 7 H26 A2 2 0 0 1 28 9 V20 A2 2 0 0 1 26 22 H14 L8 27 V22 H6 A2 2 0 0 1 4 20 V9 A2 2 0 0 1 6 7 Z" /><path d="M13.5 12.5 A2.6 2.6 0 1 1 16.5 15 C 16 15.3 16 16 16 17" /><circle cx="16" cy="19.4" r=".6" fill="currentColor" /></g>}
      {kind === 'reglas' && <g {...common}><path d="M16 4 L26 8 V15 C26 21 21.5 25.5 16 28 C10.5 25.5 6 21 6 15 V8 Z" /><path d="M11.5 16 L14.8 19.2 L20.8 12.6" /></g>}
    </svg>
  );
}
