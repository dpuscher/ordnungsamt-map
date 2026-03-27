# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.14.1

FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

RUN corepack enable

ENV YARN_CACHE_FOLDER=/var/cache/yarn

FROM base AS deps

COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/collector/package.json ./apps/collector/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN --mount=type=cache,target=/var/cache/yarn \
    yarn install --immutable

FROM deps AS build

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN yarn workspace @ordnungsamt/shared build
RUN yarn workspace @ordnungsamt/backend build

FROM base AS prod-deps

ENV NODE_ENV=production

COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/collector/package.json ./apps/collector/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN --mount=type=cache,target=/var/cache/yarn \
    yarn workspaces focus --production @ordnungsamt/backend

FROM node:${NODE_VERSION}-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/package.json ./package.json
COPY --from=prod-deps --chown=node:node /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=prod-deps --chown=node:node /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/apps/backend/dist ./apps/backend/dist

USER node

EXPOSE 4000

CMD ["node", "apps/backend/dist/index.js"]
