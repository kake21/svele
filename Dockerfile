ARG NODE_VERSION="24.12"
ARG ALPINE_VERSION="3.23"

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
WORKDIR /usr/src/app

EXPOSE 5173

COPY package*.json ./
RUN npm ci

# Generate the prisma client into generated/prisma
COPY prisma/schema prisma/schema
COPY prisma.config.ts ./
RUN npx prisma generate

COPY svelte.config.js vite.config.ts tsconfig.json ./
COPY static static

############################################################
FROM base AS dev

ENV NODE_ENV=development
# src and prisma are bind-mounted in dev
CMD ["npm", "run", "dev-seed"]

############################################################
FROM base AS prod

ENV NODE_ENV=production

COPY src src
RUN npm run build
CMD ["npm", "run", "start"]
