#!/usr/bin/env bash
set -euo pipefail

IMAGE_OWNER="${IMAGE_OWNER:-baditaflorin}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

docker buildx build --platform linux/amd64 -t "ghcr.io/${IMAGE_OWNER}/markerless-quest-lab-api:${IMAGE_TAG}" --push .
docker buildx build --platform linux/amd64 -f web/Dockerfile -t "ghcr.io/${IMAGE_OWNER}/markerless-quest-lab-web:${IMAGE_TAG}" --push .
