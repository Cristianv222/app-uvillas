import { Laboratory } from '../components/Laboratory';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

export default function LaboratoryPage() {
  return (
    <>
      <SiteHeader current="laboratorio" />
      <main id="contenido">
        <Laboratory />
      </main>
      <SiteFooter />
    </>
  );
}
