# OpenMediaVault (NAS)

## Pasos

1. Clona el repo en el NAS, por ejemplo `/opt/onyx-music`.
2. En esa carpeta:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env`:
   ```env
   COMPOSE_PROFILES=single
   MUSIC_PATH=/srv/dev-disk-by-label-xxx/Musica
   FRONTEND_PORT=4000
   ONYX_PASSWORD=tu-contraseña-segura
   JWT_SECRET=un-secreto-largo-aleatorio
   PREFETCH_NEXT=false
   ```
4. OMV → **Servicios → Compose** → nuevo proyecto → ruta del `docker-compose.yml` de la raíz.
5. `docker compose up -d --build` (o botón Up en OMV).
6. Abre `http://IP-DEL-NAS:4000`.

## Consejos NAS

- Usa **ruta absoluta** en `MUSIC_PATH` (carpeta compartida de OMV).
- Preferible **modo `single`** (un contenedor, un puerto).
- Si publicas en internet con Cloudflare, lee [cloudflare.md](cloudflare.md).
- El primer escaneo de muchos MP3 puede tardar; los reinicios siguientes usan caché en el volumen `onyx-cache`.
