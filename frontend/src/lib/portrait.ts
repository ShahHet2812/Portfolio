const MAX_UPLOAD = 20 * 1024 * 1024;
const MAX_OUTPUT = 250_000;

/** Decode and redraw locally: preserves proportions and removes source metadata. */
export async function preparePortrait(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP photo. Export HEIC photos as JPG first.');
  }
  if (file.size > MAX_UPLOAD) throw new Error('Choose a photo under 20 MB.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This photo could not be opened. Try another JPG, PNG or WebP.');
  }
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable in this browser.');
    for (const edge of [960, 720, 540, 400]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.58]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_OUTPUT) {
          return new File([blob], 'portrait.jpg', { type: 'image/jpeg' });
        }
      }
    }
    throw new Error('Could not prepare this photo. Please try a different image.');
  } finally {
    bitmap.close();
  }
}
