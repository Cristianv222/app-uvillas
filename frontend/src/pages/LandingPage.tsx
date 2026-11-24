import { ReasoningDemo } from '../components/ReasoningDemo';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { ORGANS, REFERENCES, RESULTS, TEAM, TOTAL_CLASSES, TOTAL_IMAGES } from '../data/project';
import { CLIMATE_RULES, DISEASES, SYMPTOM_RULES } from '../expert/knowledgeBase';

const fmt = (n: number) => n.toLocaleString('es-EC');

export default function LandingPage() {
  const symptomRules = SYMPTOM_RULES.length;
  const climateRules = CLIMATE_RULES.length;

  return (
    <>
      <SiteHeader current="inicio" />
      <main id="contenido">
        {/* ─────────────── Portada ─────────────── */}
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-kicker">Proyecto de Sistemas Expertos, UPEC 2026 B</p>
            <h1>Diagnóstico de enfermedades de la uvilla con visión artificial y un sistema experto</h1>
            <p className="lead">
              Una foto de la hoja, el tallo o el fruto indica si la planta está sana. Si está enferma, un conjunto de
              reglas basado en la bibliografía agronómica decide qué enfermedad es y con cuánta certeza.
            </p>
            <dl className="hero-facts">
              <div><dt>Imágenes</dt><dd>{fmt(TOTAL_IMAGES)}</dd></div>
              <div><dt>Clases</dt><dd>{TOTAL_CLASSES}</dd></div>
              <div><dt>Modelos</dt><dd>3</dd></div>
              <div><dt>Reglas</dt><dd>{3 + symptomRules + climateRules}</dd></div>
            </dl>
            <div className="actions">
              <a className="btn btn-primary" href="/laboratorio">Abrir laboratorio</a>
              <a className="btn btn-quiet" href="#resultados">Ver resultados</a>
            </div>
          </div>
          <ReasoningDemo />
        </section>

        {/* ─────────────── Problema ─────────────── */}
        <section id="problema" className="block">
          <header className="block-head">
            <h2>El problema</h2>
          </header>
          <div className="cols">
            <div className="prose">
              <p>
                Las enfermedades de la uvilla (<i>Physalis peruviana</i>) se reconocen por síntomas visibles en hojas,
                tallos y frutos. Varias se parecen entre sí: manchas, pudriciones y micelio blanco aparecen en más de una
                enfermedad, y un error de diagnóstico lleva a aplicar el tratamiento equivocado.
              </p>
              <p>
                Un clasificador de imágenes por sí solo no basta. Necesita el criterio de un experto expresado en reglas,
                que es lo que distingue a un sistema experto de un modelo de aprendizaje automático.
              </p>
            </div>
            <aside className="objective">
              <h3>Objetivo general</h3>
              <p>
                Entrenar un modelo de clasificación de imágenes por órgano de la planta y complementarlo con una base de
                conocimiento heurística que explique cada diagnóstico.
              </p>
            </aside>
          </div>
        </section>

        {/* ─────────────── Datos ─────────────── */}
        <section id="datos" className="block">
          <header className="block-head">
            <h2>Conjunto de datos</h2>
            <p>{fmt(TOTAL_IMAGES)} fotografías de campo en {TOTAL_CLASSES} clases, organizadas por órgano y por enfermedad.</p>
          </header>
          <div className="share" role="img" aria-label="Hojas 78 %, frutos 15 %, tallos 6 % de las imágenes">
            {ORGANS.map(o => (
              <span key={o.part} className={`share-${o.part.toLowerCase()}`} style={{ flexGrow: o.images }}>
                {o.part} {Math.round((o.images / TOTAL_IMAGES) * 100)} %
              </span>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th scope="col">Órgano</th><th scope="col" className="num">Clases</th><th scope="col" className="num">Imágenes</th><th scope="col" className="num">Prueba (15 %)</th><th scope="col" className="hide-sm">Clases incluidas</th></tr>
              </thead>
              <tbody>
                {ORGANS.map(o => (
                  <tr key={o.part}>
                    <th scope="row">{o.part}</th><td className="num">{o.classes}</td><td className="num">{fmt(o.images)}</td><td className="num">{fmt(o.test)}</td><td className="muted hide-sm">{o.list}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th><td className="num">{TOTAL_CLASSES}</td><td className="num">{fmt(TOTAL_IMAGES)}</td><td className="num">{fmt(1100)}</td><td className="hide-sm" /></tr>
              </tfoot>
            </table>
          </div>
          <p className="note">Hojas concentra el 78 % de las imágenes. En frutos y tallos hay entre 90 y 250 imágenes por clase.</p>
        </section>

        {/* ─────────────── Metodología ─────────────── */}
        <section id="metodologia" className="block">
          <header className="block-head">
            <h2>Cómo se construyó</h2>
          </header>
          <ol className="steps">
            <li><h3>Organización</h3><p>Las fotografías se clasificaron por órgano y enfermedad en carpetas de Google Drive.</p></li>
            <li><h3>Entrenamiento</h3><p>Un modelo por órgano en Teachable Machine: aprendizaje por transferencia sobre MobileNet, 85 % para entrenar y 15 % para probar.</p></li>
            <li><h3>Configuración</h3><p>200 épocas, lote de 16 imágenes y tasa de aprendizaje de 0,001.</p></li>
            <li><h3>Evaluación</h3><p>Precisión por clase, matriz de confusión y curvas de precisión y pérdida por época.</p></li>
            <li><h3>Análisis bibliográfico</h3><p>Agente causal, clima favorable, síntomas por órgano y manejo de cada enfermedad.</p></li>
            <li><h3>Base de conocimiento</h3><p>Reglas SI–ENTONCES y factores de certeza que combinan el modelo con las observaciones.</p></li>
            <li><h3>Integración</h3><p>Los modelos se exportaron a TFLite y se sirven desde el backend, la web y la app móvil.</p></li>
          </ol>
        </section>

        {/* ─────────────── Resultados ─────────────── */}
        <section id="resultados" className="block">
          <header className="block-head">
            <h2>Resultados de los modelos</h2>
            <p>Los tres modelos reconocen bien el órgano sano, pero no logran identificar qué enfermedad es.</p>
          </header>

          <div className="dotplot" role="img" aria-label="Exactitud por órgano: ver la tabla siguiente">
            <div className="dotplot-axis" aria-hidden="true">
              {[0, 25, 50, 75, 100].map(v => <span key={v} style={{ left: `${v}%` }}>{v} %</span>)}
            </div>
            {RESULTS.map(r => (
              <div className="dotplot-row" key={r.part}>
                <span className="dotplot-label">{r.part}</span>
                <div className="dotplot-track">
                  <span className="dot dot-chance" style={{ left: `${r.chance}%` }} title={`Azar ${r.chance} %`} />
                  <span className="dot dot-disease" style={{ left: `${r.diseases}%` }} title={`Enfermedades ${r.diseases} %`} />
                  <span className="dot dot-global" style={{ left: `${r.global}%` }} title={`Global ${r.global} %`} />
                  <span className="dot dot-healthy" style={{ left: `${r.healthy}%` }} title={`Clase sana ${r.healthy} %`} />
                </div>
              </div>
            ))}
            <ul className="dotplot-legend">
              <li><span className="dot dot-chance" />Acierto al azar</li>
              <li><span className="dot dot-disease" />Acierto medio en enfermedades</li>
              <li><span className="dot dot-global" />Exactitud global</li>
              <li><span className="dot dot-healthy" />Acierto en la clase sana</li>
            </ul>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th scope="col">Indicador (200 épocas)</th>{RESULTS.map(r => <th scope="col" key={r.part}>{r.part}</th>)}</tr>
              </thead>
              <tbody>
                <tr><th scope="row">Exactitud global en prueba</th>{RESULTS.map(r => <td key={r.part}>{r.global} %</td>)}</tr>
                <tr><th scope="row">Acierto esperado al azar</th>{RESULTS.map(r => <td key={r.part}>{String(r.chance).replace('.', ',')} %</td>)}</tr>
                <tr><th scope="row">Acierto en la clase sana</th>{RESULTS.map(r => <td key={r.part}>{r.healthy} %</td>)}</tr>
                <tr><th scope="row">Acierto medio en enfermedades</th>{RESULTS.map(r => <td key={r.part}>{r.diseases} %</td>)}</tr>
                <tr><th scope="row">Exactitud de entrenamiento</th>{RESULTS.map(r => <td key={r.part}>≈ {r.train} %</td>)}</tr>
                <tr><th scope="row">Mejor enfermedad</th>{RESULTS.map(r => <td key={r.part}>{r.best}</td>)}</tr>
                <tr><th scope="row">Peor enfermedad</th>{RESULTS.map(r => <td key={r.part}>{r.worst}</td>)}</tr>
                <tr><th scope="row">Confusión principal</th>{RESULTS.map(r => <td key={r.part}>{r.confusion}</td>)}</tr>
                <tr><th scope="row">Pérdida de prueba (inicio → final)</th>{RESULTS.map(r => <td key={r.part}>{r.loss}</td>)}</tr>
              </tbody>
            </table>
          </div>

          <div className="findings">
            <div>
              <h3>Sobreajuste</h3>
              <p>La exactitud de entrenamiento supera el 80 % mientras la de prueba queda entre 24 y 50 %, y la pérdida de prueba crece desde las primeras épocas. En tallos, pasar de 100 a 200 épocas bajó la exactitud de 53 a 50 %.</p>
            </div>
            <div>
              <h3>Más datos no fue mejor</h3>
              <p>Hojas tiene más imágenes y es el peor modelo: en enfermedades acierta casi lo mismo que el azar. Apunta a problemas de etiquetado y de encuadre más que a falta de datos.</p>
            </div>
            <div>
              <h3>Confianza alta no es acierto</h3>
              <p>El modelo siempre reparte el 100 % entre sus clases. Una versión previa clasificó con 100 % una imagen que no mostraba un tallo.</p>
            </div>
          </div>
        </section>

        {/* ─────────────── Sistema experto ─────────────── */}
        <section id="sistema-experto" className="block block-dark">
          <header className="block-head">
            <h2>El sistema experto</h2>
            <p>El modelo decide si el órgano está sano o enfermo, porque lo hace bien. Las reglas deciden qué enfermedad es.</p>
          </header>
          <ol className="flow">
            <li><h3>Foto</h3><p>El usuario elige hoja, tallo o fruto. El modelo de ese órgano da sus tres clases más probables.</p></li>
            <li><h3>Reglas de control</h3><p>R1 pide otra foto si la confianza es menor de 50 %. R2 acepta el órgano sano sobre 60 %. R3 pasa a las preguntas.</p></li>
            <li><h3>Síntomas y clima</h3><p>Preguntas de Sí, No o No sé según el órgano, y la temperatura y humedad del lote si se conocen.</p></li>
            <li><h3>Factores de certeza</h3><p>Cada evidencia suma o resta certeza. El resultado muestra qué reglas se activaron y por qué.</p></li>
          </ol>
          <div className="cols">
            <div className="formula">
              <p>Combinación de evidencias (MYCIN)</p>
              <code>FC = FC₁ + FC₂ × (1 − FC₁)</code>
              <span>Si una evidencia es negativa, resta certeza en lugar de sumarla. El diagnóstico es probable desde 0,60 y posible desde 0,35.</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">Componente</th><th scope="col" className="num">Reglas</th><th scope="col">Ejemplo</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Control</th><td className="num">3</td><td>SI la confianza es menor de 50 % ENTONCES pedir otra foto.</td></tr>
                  <tr><th scope="row">Síntomas</th><td className="num">{symptomRules}</td><td>SI hay esclerocios negros junto al micelio ENTONCES Esclerotiniosis (+0,80) y no Moho blanco (−0,40).</td></tr>
                  <tr><th scope="row">Clima</th><td className="num">{climateRules}</td><td>SI la temperatura supera 22 °C ENTONCES Marchitez bacterial (+0,40).</td></tr>
                  <tr><th scope="row">Modelo</th><td className="num">1</td><td>La confianza del modelo, ponderada por su fiabilidad en cada órgano.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <a className="btn btn-primary" href="/laboratorio">Probar con una foto</a>
        </section>

        {/* ─────────────── Enfermedades ─────────────── */}
        <section id="enfermedades" className="block">
          <header className="block-head">
            <h2>Enfermedades consideradas</h2>
            <p>Fuente principal: cartilla de manejo de enfermedades de uchuva de la Universidad de Nariño, elaborada en zonas productoras vecinas a Carchi.</p>
          </header>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">Enfermedad</th><th scope="col">Agente causal</th><th scope="col">Tipo</th><th scope="col">Clima favorable</th><th scope="col">Rasgo visual clave</th></tr></thead>
              <tbody>
                {Object.values(DISEASES).map(d => (
                  <tr key={d.code}><th scope="row">{d.name}</th><td><i>{d.agent}</i></td><td>{d.type}</td><td className="nowrap">{d.climate}</td><td>{d.keyTrait}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="caveats">
            <li>Moho blanco no es una enfermedad sino un signo (micelio blanco) compartido con Esclerotiniosis; por eso ambas clases se confunden.</li>
            <li>La bibliografía describe Mancha grasienta solo en el cáliz, pero el dataset tiene 679 imágenes de hoja con esa etiqueta.</li>
            <li>Esclerotiniosis se describe en cuello, tallo y cáliz, no en hojas; en hojas su acierto fue de 5 %.</li>
            <li>Pudrición dura no aparece con ese nombre en la bibliografía; su agente debe confirmarse.</li>
          </ul>
        </section>

        {/* ─────────────── Arquitectura ─────────────── */}
        <section id="arquitectura" className="block">
          <header className="block-head">
            <h2>Arquitectura</h2>
            <p>Monolito modular con Clean Architecture. La web y la app móvil comparten el backend y los mismos modelos.</p>
          </header>
          <div className="arch">
            <div className="arch-layer">
              <span className="arch-name">Clientes</span>
              <div className="arch-boxes">
                <div><strong>Web</strong><span>React, TypeScript y Vite. Laboratorio con el sistema experto; instalable en Android.</span></div>
                <div><strong>App móvil</strong><span>React Native con Expo. Inferencia TFLite en el teléfono, SQLite y sincronización.</span></div>
              </div>
            </div>
            <div className="arch-link">HTTP / REST y WebSocket, detrás de nginx</div>
            <div className="arch-layer">
              <span className="arch-name">Backend</span>
              <div className="arch-boxes">
                <div className="wide"><strong>Django 5, DRF y Channels</strong><span>Módulos de cuentas, catálogo, fincas, diagnósticos, reconocimiento, sincronización y reportes. Autenticación JWT.</span></div>
              </div>
            </div>
            <div className="arch-link">ORM, canales y archivos de modelo</div>
            <div className="arch-layer">
              <span className="arch-name">Datos</span>
              <div className="arch-boxes">
                <div><strong>PostgreSQL 16</strong><span>Usuarios, fincas, lotes y diagnósticos.</span></div>
                <div><strong>Redis 7</strong><span>Capa de canales del WebSocket.</span></div>
                <div><strong>3 modelos TFLite</strong><span>Hojas, tallos y frutos; entrada de 224 × 224 px.</span></div>
              </div>
            </div>
          </div>
          <p className="note">Todo se levanta con <code>docker compose up -d --build</code>. La web queda en el puerto 8080 y la API en el 8000.</p>
        </section>

        {/* ─────────────── Limitaciones ─────────────── */}
        <section id="trabajo-futuro" className="block">
          <header className="block-head">
            <h2>Limitaciones y trabajo futuro</h2>
          </header>
          <ul className="todo">
            <li>Entrenar con 20 a 50 épocas, donde la pérdida de prueba es menor, en lugar de 200.</li>
            <li>Recortar las fotografías para que muestren un solo órgano y la lesión, sin fondo de campo.</li>
            <li>Revisar con un especialista el etiquetado de Mancha grasienta y Esclerotiniosis en hojas, y redefinir la clase Moho blanco.</li>
            <li>Aumentar frutos y tallos a 300 o más imágenes por clase y agregar Muerte descendente al modelo de tallos.</li>
            <li>Agregar a cada modelo una clase “Otro / fondo” para rechazar fotos que no correspondan al órgano.</li>
            <li>Validar los factores de certeza de las reglas con un ingeniero agrónomo.</li>
          </ul>
        </section>

        {/* ─────────────── Equipo ─────────────── */}
        <section id="equipo" className="block">
          <header className="block-head">
            <h2>Equipo</h2>
            <p>Noveno nivel de la Carrera de Computación, Universidad Politécnica Estatal del Carchi. Docente: Ing. Marco Yandún.</p>
          </header>
          <ul className="team">
            {TEAM.map(m => <li key={m.name}><strong>{m.name}</strong><span>{m.role}</span></li>)}
          </ul>
          <h3 className="refs-title">Referencias</h3>
          <ol className="refs">
            {REFERENCES.map(r => <li key={r.url}>{r.text} <a href={r.url}>{r.url.replace(/^https?:\/\//, '')}</a></li>)}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
