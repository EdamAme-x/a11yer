FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run typecheck && bun run lint && bun run test && bun run build

FROM scratch AS dist
COPY --from=build /app/dist /dist
COPY --from=build /app/package.json /package.json
