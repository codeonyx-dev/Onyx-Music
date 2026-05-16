import { apiFetch } from '../config';

export async function fetchLibraryStatus() {
  const res = await apiFetch('/api/library/status');
  if (!res.ok) throw new Error('No se pudo obtener el estado de la biblioteca');
  return res.json();
}

export async function triggerLibraryRescan() {
  const res = await apiFetch('/api/library/rescan', { method: 'POST' });
  if (res.status === 409) {
    return { scanning: true, already: true };
  }
  if (!res.ok) throw new Error('No se pudo iniciar el escaneo');
  return res.json();
}
