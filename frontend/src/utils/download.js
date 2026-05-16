import { apiFetch } from '../config';

export async function downloadSong(mediaRef) {
  const response = await apiFetch(`/api/stream/${encodeURIComponent(mediaRef)}`);
  if (!response.ok) throw new Error(`No se pudo descargar ${mediaRef}`);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = mediaRef.split('/').pop() || mediaRef;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadSongs(filenames, onProgress) {
  let done = 0;
  for (const filename of filenames) {
    await downloadSong(filename);
    done += 1;
    if (onProgress) onProgress(done, filenames.length);
    await new Promise((r) => setTimeout(r, 300));
  }
}
