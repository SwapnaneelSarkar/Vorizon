# Server image (API). Build from repo root: docker build -t vorizon-server .
FROM node:20-alpine
WORKDIR /app

# Install deps with workspace layout intact (keeps @vorizon/shared symlink).
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

# Build shared + server, then drop dev dependencies.
COPY . .
RUN npm run build:shared \
  && npm run build --workspace @vorizon/server \
  && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server/dist/index.js"]
