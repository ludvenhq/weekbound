# syntax=docker/dockerfile:1
# The website as one container. The context is the repository root, because the studio roads in
# roads/ sit next to web/; build it from the committed tree (`git archive`), so nothing that is not
# committed reaches the image. No secret is a build argument: the Blizzard client id and secret
# reach only the running container, as environment variables.
FROM node:24-alpine AS deps
WORKDIR /repo/web
COPY web/package.json web/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /repo/web/node_modules ./web/node_modules
COPY web ./web
COPY roads ./roads
RUN cd web && npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# The standalone server keeps the repository's layout: web/server.js, with its static files beside it.
COPY --from=build --chown=node:node /repo/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/web/.next/static ./web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "web/server.js"]
