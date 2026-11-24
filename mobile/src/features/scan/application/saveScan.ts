import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import type { CameraView } from 'expo-camera';
import { randomUUID } from 'expo-crypto';

import { scansRepo } from '@/db/repositories/scansRepo';
import type { Part, Prediction } from '@/ml/types';

async function currentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude } : null;
  } catch {
    return null; // la ubicación es opcional
  }
}

interface Input {
  userId: string;
  camera: CameraView;
  part: Part;
  predictions: Prediction[];
  farmId: string | null;
  plotId: string | null;
  engine: 'local' | 'server';
}

/** Guarda el diagnóstico actual con su foto en el teléfono (queda pendiente de sincronizar). */
export async function saveScan({ userId, camera, part, predictions, farmId, plotId, engine }: Input): Promise<string> {
  if (predictions.length === 0) throw new Error('Aún no hay un resultado para guardar.');
  const id = randomUUID();
  const photo = await camera.takePictureAsync({ quality: 0.7, shutterSound: false });
  const dir = `${FileSystem.documentDirectory}scans/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const imageUri = `${dir}${id}.jpg`;
  await FileSystem.copyAsync({ from: photo.uri, to: imageUri });
  const pos = await currentPosition();
  return scansRepo.create(userId, {
    id, part, best: predictions[0], topK: predictions.slice(0, 3), imageUri, farmId, plotId,
    latitude: pos?.latitude ?? null, longitude: pos?.longitude ?? null, source: engine,
  });
}
