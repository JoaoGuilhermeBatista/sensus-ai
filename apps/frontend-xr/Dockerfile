FROM node:20-alpine

# Build context is the monorepo root so ../../packages/shared-contracts resolves correctly
WORKDIR /app/apps/frontend-xr

COPY packages/shared-contracts /app/packages/shared-contracts/

COPY apps/frontend-xr/package*.json ./
RUN npm ci

COPY apps/frontend-xr/ ./

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5173 || exit 1

CMD ["npm", "run", "dev"]
