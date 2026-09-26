/** Keeps uploads small enough to post quickly on venue wifi. */
export const MAX_EDGE = 1280;

export function drawToDataUrl(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function fileToScaledDataUrl(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  return drawToDataUrl(bitmap, bitmap.width, bitmap.height);
}

/** A same-origin photo (the Dive page's samples) prepared exactly like an upload. */
export async function urlToScaledDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Couldn't load ${url}`);
  return fileToScaledDataUrl(await response.blob());
}
