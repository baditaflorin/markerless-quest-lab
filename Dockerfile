FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS build

WORKDIR /src
ARG TARGETOS=linux
ARG TARGETARCH
RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 GOOS="${TARGETOS:-linux}" GOARCH="${TARGETARCH:-$(go env GOARCH)}" go build -trimpath -ldflags="-s -w" -o /out/markerless-api ./cmd/server

FROM scratch

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /out/markerless-api /usr/local/bin/markerless-api

USER 65532:65532
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/markerless-api"]
