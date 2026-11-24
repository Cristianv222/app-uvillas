/**
 * Reduce una foto en el navegador antes de enviarla: las cámaras de los teléfonos producen
 * archivos de 3 a 8 MB y el servidor acepta 5 MB. El modelo usa 224 × 224 px, así que
 * 1600 px de lado mayor sobra para el recorte central.
 */
const MAX_SIDE = 1600;

export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('No se pudo leer la imagen. Usa una foto JPG o PNG.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png'].includes(file.type)) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('No se pudo preparar la imagen.');
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}
