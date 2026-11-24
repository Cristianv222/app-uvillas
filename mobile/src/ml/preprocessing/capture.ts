import type { CameraView } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { MODEL_INPUT_SIZE } from './jpeg';

/** Toma un fotograma, recorta al cuadrado central y lo reduce a 224x224. Devuelve JPEG en base64. */
export async function captureModelFrame(camera: CameraView): Promise<string> {
  const photo = await camera.takePictureAsync({ quality: 0.4, skipProcessing: true, shutterSound: false, exif: false });
  const side = Math.min(photo.width, photo.height);
  const image = await ImageManipulator.manipulate(photo.uri)
    .crop({ originX: Math.floor((photo.width - side) / 2), originY: Math.floor((photo.height - side) / 2), width: side, height: side })
    .resize({ width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE })
    .renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
  if (!result.base64) throw new Error('No se pudo procesar el fotograma.');
  return result.base64;
}
