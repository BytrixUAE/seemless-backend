FROM node:20-bookworm-slim AS deps

WORKDIR /usr/src/app

# Needed if native modules (e.g. bcrypt/sharp) compile from source.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Default runtime values; override with -e at docker run time.
# ENV NODE_ENV=production \
#     APP_ENV=production \
#     BACKEND_PORT=3000


COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev && npm cache clean --force

FROM node:20-bookworm-slim AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Preserve provided .env; fallback to .env.example when .env is missing.
RUN if [ ! -f .env ] && [ -f .env.example ]; then cp .env.example .env; fi && \
    mkdir -p uploads/user && chown -R node:node /usr/src/app/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]
