FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_GIT_RUN_NUMBER=local
ARG VITE_GIT_REVISION=dev

ENV CI=true

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
