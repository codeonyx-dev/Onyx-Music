# Onyx Music Player

Reproductor de música web autoalojado: biblioteca local, listas, favoritos, cola, shuffle y PWA.

## Inicio rápido

```bash
cp .env.example .env
# Edita .env (contraseña, MUSIC_PATH, etc.)
docker compose up -d --build
```

Abre **http://localhost:4000** — login por defecto en `.env` (`ONYX_USER` / `ONYX_PASSWORD`).

Coloca música en la carpeta `MUSIC_PATH` (por defecto `./music`).

## Estructura del proyecto

```
onyx-music/
├── .env.example          ← única plantilla de configuración
├── docker-compose.yml    ← despliegue Docker
├── docker/               ← nginx optimizado para streaming
├── backend/              ← API Go
├── frontend/             ← React
├── deploy/               ← imagen Docker todo-en-uno
├── docs/                 ← guías (Docker, OMV, Cloudflare)
└── music/                ← tu biblioteca (no se sube a Git)
```

## Documentación

| Guía | Contenido |
|------|-----------|
| [docs/docker.md](docs/docker.md) | Docker, modos split/single, variables |
| [docs/omv.md](docs/omv.md) | OpenMediaVault / NAS |
| [docs/cloudflare.md](docs/cloudflare.md) | Audio lento detrás de Cloudflare |

## Desarrollo local

**Backend:** `cd backend && go run .` (con `MUSIC_DIR=../music`)

**Frontend:** `cd frontend && npm install && npm start` (proxy `/api` en `package.json`)

## Reproducción lenta

1. Revisa [docs/cloudflare.md](docs/cloudflare.md) si usas Cloudflare.
2. En `.env`: `PREFETCH_NEXT=false` y `CROSSFADE_DEFAULT=false`.
3. F12 → Red → petición `stream` → si tarda muchos segundos en ~6 MB, el cuello de botella es red/servidor, no la interfaz.

## Licencia

Uso personal y autoalojado. Cambia credenciales antes de exponer en internet.
