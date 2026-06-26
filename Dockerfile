FROM node:22 AS base
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
RUN apt-get update && \
    apt-get install -y chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY . .

FROM base AS build
ARG VITE_ESCRUTA_CORE_URL=http://localhost:6542
ENV VITE_ESCRUTA_CORE_URL=$VITE_ESCRUTA_CORE_URL
RUN pnpm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
