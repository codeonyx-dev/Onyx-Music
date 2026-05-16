# Imagen única: API Go + frontend React servido por Nginx
#
# Desde deploy/ (contexto = raíz del repo):
#   docker build -f Dockerfile -t onyx-music:v1 ..
#
# Desde la raíz del repo:
#   docker build -f deploy/Dockerfile -t onyx-music:v1 .

FROM golang:1.21-alpine AS backend-build

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/*.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /onyx-server .

FROM node:18-alpine AS frontend-build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG REACT_APP_API_URL=
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM alpine:3.19

RUN apk add --no-cache nginx ca-certificates tzdata \
    && mkdir -p /music /cache /run/nginx \
    && chown -R nginx:nginx /var/lib/nginx

COPY deploy/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=frontend-build /app/build /usr/share/nginx/html
COPY --from=backend-build /onyx-server /usr/local/bin/onyx-server
COPY deploy/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV PORT=9090 \
    MUSIC_DIR=/music \
    CACHE_DIR=/cache

EXPOSE 80

VOLUME ["/music", "/cache"]

ENTRYPOINT ["/entrypoint.sh"]
