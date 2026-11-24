import type { CameraView } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { MODEL_INPUT_SIZE } from './jpeg';

/** Toma un fotograma, recorta al cuadrado central y lo reduce a 224x224. Devuelve JPEG en base64. */
export async function captureModelFrame(camera: CameraView): Promise<string> {
  const photo = await camera.takePictureAsync({ quality: 0.4, skipProcessing: true, shutterSound: false, exif: false });

  // Con skipProcessing, Android puede informar el ancho y alto girados respecto a la imagen real.
  // Se carga primero la imagen para recortar con sus medidas verdaderas.
  const original = await ImageManipulator.manipulate(photo.uri).renderAsync();
  const width = original.width;
  const height = original.height;
  const side = Math.min(width, height);
  const originX = Math.max(0, Math.floor((width - side) / 2));
  const originY = Math.max(0, Math.floor((height - side) / 2));

  const image = await ImageManipulator.manipulate(photo.uri)
    .crop({ originX, originY, width: side, height: side })
    .resize({ width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE })
    .renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
  if (!result.base64) throw new Error('No se pudo procesar el fotograma.');
  return result.base64;
}
