# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.14.1

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

RUN corepack enable

ENV YARN_CACHE_FOLDER=/var/cache/yarn

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/collector/package.json ./apps/collector/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN --mount=type=cache,target=/var/cache/yarn \
    yarn install --immutable

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN yarn workspace @ordnungsamt/shared build
RUN yarn workspace @ordnungsamt/frontend build

FROM nginx:stable-alpine AS runtime

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
