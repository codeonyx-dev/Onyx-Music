# Cloudflare y reproducción lenta

Si usas `music.tudominio.com` con la nube **naranja** (proxy) de Cloudflare, el audio puede tardar mucho en empezar aunque el servidor vaya bien.

## Por qué pasa

Cloudflare puede bufferizar o limitar respuestas grandes. El reproductor necesita **rangos HTTP (206)** y baja latencia en el primer byte.

## Soluciones (de más fácil a más efectiva)

### 1. Regla de caché en Cloudflare

- **URL:** `*tudominio.com/api/stream*`
- **Cache Level:** Bypass

### 2. DNS solo (recomendado para NAS)

Crea un subdominio directo al NAS, por ejemplo `nas.tudominio.com`, con la nube **gris** (solo DNS, sin proxy).

Accede a Onyx por esa URL o por IP local en casa.

### 3. Subdominio de audio sin Cloudflare

| Subdominio | Proxy Cloudflare | Uso |
|------------|------------------|-----|
| `music.tudominio.com` | Naranja | Web (opcional) |
| `stream.tudominio.com` | **Gris** | Solo si separas API en el futuro |

Con el stack actual, lo más simple es **gris en el dominio donde sirves Onyx** si la lentitud es solo por Cloudflare.

### 4. En `.env` de Onyx

```env
PREFETCH_NEXT=false
CROSSFADE_DEFAULT=false
```

Reduce descargas dobles mientras ajustas Cloudflare.

## Comprobar

```powershell
curl.exe -o NUL -s -w "HTTP %{http_code} TTFB %{time_starttransfer}s`n" `
  -H "Authorization: Bearer TU_TOKEN" `
  -H "Range: bytes=0-65535" `
  "https://tu-dominio/api/stream/cancion.mp3"
```

- **HTTP 206** y TTFB &lt; 1 s → servidor OK; si el navegador sigue lento, es Cloudflare o la app.
- **HTTP 400** con HTML de Cloudflare → token incorrecto o regla que bloquea.
