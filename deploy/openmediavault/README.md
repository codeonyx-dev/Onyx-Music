# Onyx Music Player en OpenMediaVault

Stack Docker para NAS con OMV. Usa los mismos `Dockerfile` del repo (`backend/Dockerfile` y `frontend/Dockerfile`).

## Requisitos

- OpenMediaVault con el plugin **Docker** (o Docker Compose instalado).
- Repo clonado en el NAS, por ejemplo `/opt/onyx-music-player`.

## Pasos

1. Clona el repositorio en el NAS.
2. Copia la configuración:
   ```bash
   cd /opt/onyx-music-player/deploy/openmediavault
   cp .env.example .env
   ```
3. Edita `.env` y define `MUSIC_PATH` con la **ruta absoluta** de tu carpeta de música en OMV.
4. Cambia `ONYX_PASSWORD` y `JWT_SECRET`.
5. En OMV → **Docker → Compose**, crea un proyecto apuntando a esta carpeta (`deploy/openmediavault`).
6. Arranca el stack. Abre `http://IP-DEL-NAS:4000`.

## Desde terminal (SSH)

```bash
cd /opt/onyx-music-player/deploy/openmediavault
docker compose up -d --build
```

Solo se publica el puerto del frontend; la API va por proxy interno de Nginx.

## Estructura de build

| Servicio  | Dockerfile              | Contexto (desde esta carpeta) |
|-----------|-------------------------|-------------------------------|
| backend   | `../../backend/Dockerfile`  | `../../backend`           |
| frontend  | `../../frontend/Dockerfile` | `../../frontend`          |

No hace falta un `Dockerfile` adicional en `deploy/openmediavault`.
