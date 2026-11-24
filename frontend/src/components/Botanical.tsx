import { useId } from 'react';

export function Botanical({ stage }: { stage: number }) {
  const id = useId().replace(/:/g, '');
  const labels = [
    'Ilustración de una hoja de uvilla',
    'Flor amarilla de uvilla',
    'Cáliz protector de la uvilla',
    'Fruto dorado de uvilla',
    'Estructura del tallo de uvilla',
  ];

  return (
    <svg
      className="botanical"
      viewBox="0 0 650 720"
      role="img"
      aria-label={labels[stage] || 'Ilustración botánica de uvilla'}
    >
      <defs>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a3bb69" />
          <stop offset=".45" stopColor="#587d39" />
          <stop offset="1" stopColor="#183e29" />
        </linearGradient>
        <radialGradient id={`${id}-fruit`} cx=".32" cy=".25">
          <stop stopColor="#ffe2a1" />
          <stop offset=".35" stopColor="#f8be43" />
          <stop offset=".8" stopColor="#e48918" />
          <stop offset="1" stopColor="#ac5013" />
        </radialGradient>
        <linearGradient id={`${id}-husk`}>
          <stop stopColor="#dcc285" />
          <stop offset=".5" stopColor="#a68543" />
          <stop offset="1" stopColor="#eee0b0" />
        </linearGradient>
        <linearGradient id={`${id}-stem`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#43653b" />
          <stop offset=".5" stopColor="#76985a" />
          <stop offset="1" stopColor="#314e28" />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="0" dy="24" stdDeviation="20" floodOpacity=".25" />
        </filter>
      </defs>

      {/* Stage 0: Hoja */}
      <g className={`specimen ${stage === 0 ? 'visible' : ''}`} filter={`url(#${id}-shadow)`}>
        <path d="M325 623 Q350 490 335 372" fill="none" stroke="#73965a" strokeWidth="7" />
        <path
          d="M328 510 C126 478 93 276 165 142 C243 185 319 156 368 239 C462 201 524 135 528 85 C594 285 531 490 328 510Z"
          fill={`url(#${id}-leaf)`}
        />
        <path
          d="M328 510 Q334 316 528 85 M332 459 Q213 397 164 267 M347 397 Q253 331 210 211 M382 318 Q319 263 303 208 M339 460 Q479 407 537 292 M355 389 Q469 342 548 217 M392 307 Q485 262 545 154"
          fill="none"
          stroke="#c5d297"
          strokeOpacity=".48"
          strokeWidth="2"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M${335 + i * 4} ${455 - i * 13} q-70 -10 -135 -90`}
            fill="none"
            stroke="#c7d297"
            strokeOpacity=".1"
          />
        ))}
      </g>

      {/* Stage 1: Flor */}
      <g className={`specimen ${stage === 1 ? 'visible' : ''}`} filter={`url(#${id}-shadow)`}>
        <path d="M325 605 Q270 395 330 300" fill="none" stroke="#74965c" strokeWidth="8" />
        {[0, 72, 144, 216, 288].map((a) => (
          <path
            key={a}
            transform={`rotate(${a} 325 320)`}
            d="M325 320 Q200 235 250 129 Q329 90 401 160 Q410 264 325 320"
            fill="#e9c953"
            stroke="#b7a342"
            strokeWidth="2"
          />
        ))}
        <circle cx="325" cy="320" r="52" fill="#73502c" />
        <circle cx="325" cy="320" r="25" fill="#cba346" />
      </g>

      {/* Stage 2: Cáliz cerrado */}
      <g className={`specimen ${stage === 2 ? 'visible' : ''}`} filter={`url(#${id}-shadow)`}>
        <path d="M325 165 Q370 94 341 60" fill="none" stroke="#73965a" strokeWidth="8" />
        <path
          d="M325 160 C140 215 155 427 325 590 C500 425 511 221 325 160Z"
          fill={`url(#${id}-husk)`}
        />
        {[-100, -60, 0, 60, 100].map((n) => (
          <path
            key={n}
            d={`M325 160 Q${325 + n * 2} 350 325 590`}
            fill="none"
            stroke="#735c30"
            strokeOpacity=".45"
            strokeWidth="2"
          />
        ))}
      </g>

      {/* Stage 3: Fruto con cáliz abierto */}
      <g className={`specimen ${stage === 3 ? 'visible' : ''}`} filter={`url(#${id}-shadow)`}>
        <path
          d="M320 376 Q130 330 97 160 Q259 144 334 351 Q407 125 568 160 Q539 324 352 397 Q509 356 569 441 Q462 517 341 449 Q159 531 90 441 Q189 354 320 376"
          fill={`url(#${id}-husk)`}
        />
        <path
          d="M327 393 L108 170 M335 400 L553 171 M332 417 L555 440 M322 420 L106 441"
          stroke="#7e663b"
          strokeWidth="2"
          opacity=".5"
        />
        <circle cx="325" cy="431" r="125" fill={`url(#${id}-fruit)`} />
        <ellipse
          cx="285"
          cy="378"
          rx="30"
          ry="16"
          fill="#fff3d0"
          opacity=".28"
          transform="rotate(-35 285 378)"
        />
      </g>

      {/* Stage 4: Tallo (Estructura vascular y ramificaciones) */}
      <g className={`specimen ${stage === 4 ? 'visible' : ''}`} filter={`url(#${id}-shadow)`}>
        {/* Tallo principal */}
        <path
          d="M325 680 Q315 480 335 340 T320 80"
          fill="none"
          stroke={`url(#${id}-stem)`}
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Nudos */}
        <ellipse cx="328" cy="490" rx="14" ry="7" fill="#2d4824" />
        <ellipse cx="334" cy="340" rx="13" ry="6" fill="#2d4824" />
        <ellipse cx="323" cy="200" rx="11" ry="5" fill="#2d4824" />
        {/* Ramas laterales */}
        <path
          d="M328 490 Q240 450 180 410"
          fill="none"
          stroke={`url(#${id}-stem)`}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M334 340 Q430 300 480 250"
          fill="none"
          stroke={`url(#${id}-stem)`}
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Brotes y pequeñas hojas auxiliares */}
        <path
          d="M180 410 Q140 370 120 400 Q150 430 180 410Z"
          fill={`url(#${id}-leaf)`}
        />
        <path
          d="M480 250 Q520 210 540 240 Q510 270 480 250Z"
          fill={`url(#${id}-leaf)`}
        />
        {/* Vellosidades protectoras típicas de Physalis */}
        {[-3, 0, 3].map((off) => (
          <path
            key={off}
            d={`M${325 + off} 640 L${325 + off} 120`}
            fill="none"
            stroke="#a4ba81"
            strokeOpacity=".2"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        ))}
      </g>
    </svg>
  );
}
