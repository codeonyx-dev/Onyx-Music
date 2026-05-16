#!/bin/sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-onyx-music:v1}"

cd "$ROOT"
docker build -f deploy/Dockerfile -t "$TAG" .
echo "Imagen creada: $TAG"
