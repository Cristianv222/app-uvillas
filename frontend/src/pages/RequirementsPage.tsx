import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const USE = [
  { title: 'Navegador', text: 'Chrome, Edge, Firefox o Safari, en una versión reciente.' },
  { title: 'Internet', text: 'La foto se analiza en el servidor, así que hace falta conexión.' },
  { title: 'Cámara', text: 'Opcional. Sin cámara, la foto se elige desde la galería.' },
  { title: 'Android', text: 'Chrome ofrece «Instalar app» cuando la web se abre con HTTPS.' },
];

const PHOTO = [
  'Luz natural, sin sombras fuertes.',
  'Una sola hoja, tallo o fruto, cerca y centrado.',
  'Que se vea la lesión, si la hay.',
  'JPG o PNG. Las fotos grandes se reducen solas antes de enviarse.',
];

export default function RequirementsPage() {
  return (
    <>
      <SiteHeader current="requisitos" />
      <main id="contenido" className="docs">
        <header className="docs-head">
          <h1>Requisitos</h1>
          <p>Lo necesario para usar Uvillas y para ponerla en marcha.</p>
        </header>

        <section className="block req">
          <header className="block-head"><h2>Para usarla</h2></header>
          <ul className="req-grid">
            {USE.map(u => <li key={u.title}><h3>{u.title}</h3><p>{u.text}</p></li>)}
          </ul>
        </section>

        <section className="block req">
          <header className="block-head"><h2>Para una buena foto</h2></header>
          <ul className="req-list">
            {PHOTO.map(p => <li key={p}>{p}</li>)}
          </ul>
        </section>

        <section className="block req">
          <header className="block-head"><h2>Para ponerla en marcha</h2></header>
          <ul className="req-grid">
            <li><h3>Docker Desktop</h3><p>En Windows, macOS o Linux.</p></li>
            <li><h3>Puertos libres</h3><p>8080 para la web y 8000 para el servidor.</p></li>
          </ul>
          <div className="req-cmd">
            <p>En la carpeta del proyecto:</p>
            <code>docker compose up -d --build</code>
            <p>Luego abre <code>http://localhost:8080</code>.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
