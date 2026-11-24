import { useEffect, useRef } from 'react';
import { FruitArt, LeafArt, StemArt, StepIcon } from '../components/Illustrations';
import { ObservatoryHero } from '../components/ObservatoryHero';
import { ReasoningDemo } from '../components/ReasoningDemo';
import { SiteFooter } from '../components/SiteChrome';
import { TEAM, TOTAL_CLASSES, TOTAL_IMAGES } from '../data/project';
import { CLIMATE_RULES, SYMPTOM_RULES } from '../expert/knowledgeBase';

const fmt = (n: number) => n.toLocaleString('es-EC');

const STEPS = [
  { icon: 'foto', title: 'Eliges la parte y tomas la foto', text: 'Hoja, tallo o fruto. Cada parte tiene su propio modelo de visión artificial.' },
  { icon: 'modelo', title: 'El modelo decide si está sana', text: 'Es lo que mejor hace: acierta entre 80 y 95 % de las veces en la clase sana.' },
  { icon: 'preguntas', title: 'Respondes lo que observas', text: 'Si hay enfermedad, unas preguntas de síntomas y, si lo conoces, el clima del lote.' },
  { icon: 'reglas', title: 'Las reglas dan el diagnóstico', text: 'La base de conocimiento combina la evidencia y explica por qué llegó a esa conclusión.' },
] as const;

const ORGANS = [
  { parte: 'hojas', name: 'Hoja', detail: '8 clases', note: 'Mancha gris, Muerte descendente, Marchitez bacterial y más.', Art: LeafArt },
  { parte: 'tallos', name: 'Tallo', detail: '4 clases', note: 'Esclerotiniosis, Moho blanco y Pudrición dura.', Art: StemArt },
  { parte: 'frutos', name: 'Fruto', detail: '7 clases', note: 'Del capacho a la baya: Mancha grasienta, Pudrición dura y más.', Art: FruitArt },
];

const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

/** Marca la sección cuando entra en pantalla, para la única animación de recorrido (la línea de los pasos). */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-visible'); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function LandingPage() {
  const rules = 3 + SYMPTOM_RULES.length + CLIMATE_RULES.length;
  const journeyRef = useReveal<HTMLOListElement>();

  return (
    <>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <ObservatoryHero />
      <main id="contenido" className="landing">
        {/* ── Cómo funciona ── */}
        <section id="como-funciona" className="l-section">
          <header className="l-head">
            <h2>Cómo funciona</h2>
            <p>Un sistema experto que reparte el trabajo: la visión artificial mira la foto y el conocimiento de un experto, escrito en reglas, decide la enfermedad.</p>
          </header>
          <ol className="journey" ref={journeyRef}>
            {STEPS.map(s => (
              <li key={s.title}>
                <span className="journey-icon"><StepIcon kind={s.icon} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <dl className="figures">
            <div><dt>imágenes de campo</dt><dd>{fmt(TOTAL_IMAGES)}</dd></div>
            <div><dt>clases entre sanas y enfermas</dt><dd>{TOTAL_CLASSES}</dd></div>
            <div><dt>modelos, uno por órgano</dt><dd>3</dd></div>
            <div><dt>reglas en la base de conocimiento</dt><dd>{rules}</dd></div>
          </dl>
        </section>

        {/* ── Cómo entrega el resultado ── */}
        <section id="resultado" className="l-section result-block">
          <div className="result-copy">
            <h2>Un diagnóstico que se explica</h2>
            <p className="l-lead">No se queda en un nombre y un porcentaje. Entrega cuatro cosas, y cada una se puede revisar.</p>
            <dl className="result-parts">
              <div><dt>Nivel</dt><dd>Probable desde 0,60 de certeza, posible desde 0,35. Por debajo, pide más información u otra foto.</dd></div>
              <div><dt>Factor de certeza</dt><dd>Un valor entre 0 y 1 que combina el modelo, los síntomas y el clima.</dd></div>
              <div><dt>Por qué</dt><dd>Cada regla que se activó y cuánto sumó o restó.</dd></div>
              <div><dt>Otras posibilidades</dt><dd>Las enfermedades que siguen en la lista, para no descartarlas a ciegas.</dd></div>
            </dl>
            <p className="hint">Prueba la tarjeta: marca o desmarca lo que observarías en la hoja.</p>
          </div>
          <div className="demo-stage"><ReasoningDemo /></div>
        </section>

        {/* ── Elegir órgano ── */}
        <section id="analizar" className="l-section">
          <header className="l-head">
            <h2>¿Qué parte vas a analizar?</h2>
            <p>Elige el órgano y toma la foto desde el celular o la computadora. En Android también se instala como app.</p>
          </header>
          <div className="organ-cards">
            {ORGANS.map(({ parte, name, detail, note, Art }) => (
              <a key={parte} className="organ-card" href={`/laboratorio?parte=${parte}`}>
                <Art />
                <span className="organ-card-meta">{detail}</span>
                <strong>{name}</strong>
                <span className="organ-card-note">{note}</span>
                <span className="organ-card-go">Empezar análisis</span>
              </a>
            ))}
          </div>
          <p className="docs-link"><a href="/documentacion">Leer la documentación técnica del proyecto</a></p>
        </section>

        {/* ── Equipo ── */}
        <section id="equipo" className="l-section">
          <header className="l-head">
            <h2>Equipo</h2>
            <p>Carrera de Computación, Universidad Politécnica Estatal del Carchi. Sistemas Expertos, período 2026 B. Docente: Ing. Marco Yandún.</p>
          </header>
          <ul className="team">
            {TEAM.map(m => (
              <li key={m}><span className="team-initials" aria-hidden="true">{initials(m)}</span>{m}</li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
