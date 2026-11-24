import jpeg from 'jpeg-js';

export const MODEL_INPUT_SIZE = 224;

/** JPEG (base64) de 224x224 -> Float32 RGB normalizado a [-1, 1], igual que Teachable Machine. */
export function jpegToModelInput(base64: string, size = MODEL_INPUT_SIZE): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { data, width, height } = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: false });
  if (width !== size || height !== size) throw new Error(`Se esperaba ${size}x${size} y llegó ${width}x${height}.`);

  const out = new Float32Array(size * size * 3);
  for (let i = 0; i < out.length; i++) out[i] = data[i] / 127.5 - 1;
  return out;
}
