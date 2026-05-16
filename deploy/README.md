# Despliegue con imagen única

Un solo contenedor incluye la API (Go) y la interfaz web (Nginx + React).

## Construir la imagen

El **contexto de build debe ser la raíz del repositorio** (`Onyx-Music/`), no solo la carpeta `deploy/`.

Desde `deploy/`:

```bash
cd /opt/Onyx-Music/deploy
docker build -f Dockerfile -t onyx-music:v1 ..
```

Desde la raíz del repo:

```bash
cd /opt/Onyx-Music
docker build -f deploy/Dockerfile -t onyx-music:v1 .
```

O usa el script:

```bash
cd /opt/Onyx-Music/deploy
chmod +x build.sh
./build.sh
```

> **Error habitual:** `docker build -t onyx-music:v1 .` dentro de `deploy/` falla porque el contexto no incluye `backend/` ni `frontend/`.

## Ejecutar

```bash
docker run -d \
  --name onyx-music \
  --restart unless-stopped \
  -p 4000:80 \
  -v /ruta/a/tu/musica:/music:ro \
  -v onyx-cache:/cache \
  -e ONYX_USER=admin \
  -e ONYX_PASSWORD=tu-contraseña \
  -e JWT_SECRET=tu-secreto-jwt \
  onyx-music:v1
```

Abre `http://IP-DEL-SERVIDOR:4000`.

## Dos contenedores (alternativa)

Si prefieres backend y frontend separados, usa el `docker-compose.yml` de la raíz del proyecto o `deploy/openmediavault/`.
