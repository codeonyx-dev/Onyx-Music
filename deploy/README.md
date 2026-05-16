# Deploy

## Imagen única (modo `single`)

Desde la raíz del repo, con `COMPOSE_PROFILES=single` en `.env`:

```bash
docker compose up -d --build
```

O manualmente:

```bash
docker build -f deploy/Dockerfile -t onyx-music .
```

## Modo recomendado

Usa `docker compose` en la raíz con `COMPOSE_PROFILES=split` (por defecto). Ver [docs/docker.md](../docs/docker.md).
