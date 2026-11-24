import { Laboratory } from '../components/Laboratory';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

export default function LaboratoryPage() {
  return (
    <>
      <SiteHeader current="laboratorio" tone="dark" />
      <main id="contenido" className="lab-night">
        <Laboratory />
      </main>
      <SiteFooter />
    </>
  );
}
