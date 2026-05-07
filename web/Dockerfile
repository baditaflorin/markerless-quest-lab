FROM --platform=$BUILDPLATFORM node:20-alpine AS build

WORKDIR /src/web
COPY web/package*.json ./
RUN npm ci

COPY web ./
RUN npm run build

FROM --platform=$TARGETPLATFORM nginx:1.27-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/web/dist /usr/share/nginx/html

EXPOSE 25342
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:25342/healthz >/dev/null || exit 1
