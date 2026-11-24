/**
 * Datos del proyecto tomados del informe "Contexto general del proyecto" (UPEC, 2026 B).
 * Las cifras son las que reportó Teachable Machine en el conjunto de prueba (15 %).
 */

export const ORGANS = [
  { part: 'Hojas', classes: 8, images: 5710, test: 860, list: 'Mancha gris, Muerte descendente, Esclerotiniosis, Moho blanco, Pudrición dura, Mancha grasienta, Marchitez bacterial, Hoja sana' },
  { part: 'Frutos', classes: 7, images: 1124, test: 170, list: 'Mancha gris, Muerte descendente, Esclerotiniosis, Moho blanco, Pudrición dura, Mancha grasienta, Fruto sano' },
  { part: 'Tallos', classes: 4, images: 457, test: 70, list: 'Esclerotiniosis, Moho blanco, Pudrición dura, Tallo sano' },
] as const;

export const TOTAL_IMAGES = 7291;
export const TOTAL_CLASSES = 19;

export const RESULTS = [
  { part: 'Hojas', global: 24, chance: 12.5, healthy: 80, diseases: 14, train: 90, best: 'Moho blanco (22 %)', worst: 'Pudrición dura y Esclerotiniosis (5 %)', confusion: 'Muerte descendente → Mancha gris (32)', loss: '1,7 → 5,6' },
  { part: 'Frutos', global: 40, chance: 14.3, healthy: 95, diseases: 24, train: 82, best: 'Mancha grasienta (38 %)', worst: 'Moho blanco (10 %)', confusion: 'Muerte descendente → Mancha gris (8)', loss: '1,5 → 3,4' },
  { part: 'Tallos', global: 50, chance: 25, healthy: 84, diseases: 31, train: 95, best: 'Moho blanco (43 %)', worst: 'Pudrición dura (20 %)', confusion: 'Esclerotiniosis → Moho blanco (5)', loss: '1,0 → 2,3 (100 épocas)' },
] as const;

export const TEAM = [
  { name: 'Cristian Vásquez', role: 'Arquitectura y repositorio' },
  { name: 'Edison Godoy', role: 'Backend' },
  { name: 'Oscar Ger', role: 'Backend' },
  { name: 'Francis Revelo', role: 'Frontend y sistema experto' },
  { name: 'Joel Pilacuán', role: 'Frontend' },
] as const;

export const REFERENCES = [
  {
    text: 'Lagos Burbano, T. C., Mejía España, D. F., Pabón Villalobos, J., Ordoñez Jurado, H. R., & Benavides Cardona, C. A. (2020). Manejo de enfermedades de uchuva (Physalis peruviana) en zonas productoras del departamento de Nariño [Cartilla]. Universidad de Nariño.',
    url: 'https://sired.udenar.edu.co/14872/1/CARTILLA%20MANEJO%20DE%20ENFERMEDADES%20UCHUVA%20VF.pdf',
  },
  {
    text: 'Posada Vélez, L. M., Restrepo Correa, L., & Castaño Zapata, J. (2020). Guía ilustrada de enfermedades y agentes causantes en cultivos frutales de importancia económica en Colombia. Asohofrucol.',
    url: 'https://www.asohofrucol.com.co/img/pdflibros/9libro.pdf',
  },
  { text: 'Google. (s. f.). Teachable Machine.', url: 'https://teachablemachine.withgoogle.com/' },
] as const;
