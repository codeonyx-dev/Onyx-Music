import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const defaults = {
  prefetchNext: true,
  crossfadeDefault: false,
};

let cached = null;

export function useSettings() {
  const [settings, setSettings] = useState(cached || defaults);
  const [ready, setReady] = useState(!!cached);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          cached = {
            prefetchNext: !!data.prefetch_next,
            crossfadeDefault: !!data.crossfade_default,
          };
          if (!cancelled) setSettings(cached);
        }
      } catch {
        /* sin sesión aún: defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { settings, ready };
}
