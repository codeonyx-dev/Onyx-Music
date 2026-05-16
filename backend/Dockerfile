FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

FROM scratch

COPY --from=builder /app/server /server

ENV PORT=9090
ENV MUSIC_DIR=/music

EXPOSE 9090

ENTRYPOINT ["/server"]
