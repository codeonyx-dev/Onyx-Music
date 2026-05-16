# Docker — Onyx Music

## Configuración (un solo archivo)

```bash
cp .env.example .env
```

Edita `.env` en la **raíz del proyecto**. No hay otros `.env` que configurar.

## Modos de despliegue

| `COMPOSE_PROFILES` | Qué arranca | Ideal para |
|--------------------|-------------|------------|
| `split` (por defecto) | `frontend` + `backend` | PC, VPS, desarrollo |
| `single` | Un solo contenedor `onyx` | NAS, OpenMediaVault |

### Modo split (por defecto)

```bash
docker compose up -d --build
```

Abre `http://localhost:4000` (o el puerto de `FRONTEND_PORT`).

### Modo single (NAS / OMV)

En `.env`:

```env
COMPOSE_PROFILES=single
MUSIC_PATH=/ruta/absoluta/a/tu/musica
```

```bash
docker compose up -d --build
```

En OMV → **Docker → Compose**, apunta al `docker-compose.yml` de la raíz del repo.

## Variables importantes

| Variable | Descripción |
|----------|-------------|
| `MUSIC_PATH` | Carpeta de música en el host |
| `FRONTEND_PORT` | Puerto web (default 4000) |
| `ONYX_USER` / `ONYX_PASSWORD` | Login |
| `JWT_SECRET` | Secreto de sesión |
| `PREFETCH_NEXT` | `true` = guarda la siguiente canción en caché del navegador |
| `CROSSFADE_DEFAULT` | `false` = cambio de tema más rápido |

## Caché automática (navegador)

- **Biblioteca:** se guarda en `localStorage` (7 días) para abrir la lista al instante.
- **Canciones escuchadas:** se guardan en IndexedDB (hasta ~200 MB). La **segunda vez** que reproduces un tema suele ser casi instantánea.
- **Carátulas:** Service Worker las cachea una semana.
- La **primera** reproducción de cada tema sigue dependiendo de la red (y de Cloudflare si lo usas).

## Música

Coloca archivos en la carpeta definida en `MUSIC_PATH` (`.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`, `.aac`).

## Actualizar

```bash
docker compose pull   # si usas imágenes publicadas
docker compose up -d --build
```
