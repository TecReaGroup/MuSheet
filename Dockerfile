# syntax=docker/dockerfile:1

FROM node:22-alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine3.23 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY backend ./backend
COPY contract ./contract
COPY config ./config
RUN mkdir -p data log temp && chown -R node:node data log temp

USER node

EXPOSE 8787

CMD ["npx", "tsx", "backend/server.ts"]
