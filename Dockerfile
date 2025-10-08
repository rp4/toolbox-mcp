FROM node:20-slim AS deps
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY apps/mcp-server/package*.json ./apps/mcp-server/
COPY packages/schemas/package*.json ./packages/schemas/

# Install all dependencies (workspaces)
RUN npm ci

# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy everything from deps stage
COPY --from=deps /app ./

# Copy source files
COPY packages/schemas ./packages/schemas
COPY apps/mcp-server ./apps/mcp-server

# Build
RUN npm run build --workspace=@audittoolbox/schemas
RUN npm run build --workspace=@audittoolbox/mcp-server

# Production stage
FROM node:20-slim
WORKDIR /app

# Copy node_modules and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/mcp-server/dist ./apps/mcp-server/dist
COPY --from=builder /app/apps/mcp-server/package.json ./apps/mcp-server/package.json
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/schemas/package.json ./packages/schemas/package.json
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3001
ENV UI_URL=https://audittoolbox-ui.vercel.app

EXPOSE 3001

CMD ["node", "apps/mcp-server/dist/index.js"]
