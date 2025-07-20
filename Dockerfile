# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package.json and lockfile
COPY package.json ./
# Assuming npm, if you use pnpm or yarn, you might need to copy pnpm-lock.yaml or yarn.lock
# COPY package-lock.json ./ 

# Install dependencies
RUN npm install

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables can be passed at build time
# For example: ARG NEXT_PUBLIC_API_BASE_URL
# ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Copy the standalone output from the builder stage.
COPY --from=builder /app/.next/standalone ./
# Copy the public folder if it exists.
# COPY --from=builder /app/public ./public
# Copy static assets.
COPY --from=builder /app/.next/static ./.next/static

# The Next.js server will run on port 3000 by default.
# You can change this by setting the PORT environment variable.
EXPOSE 3000

ENV PORT 3000

# Run the application
CMD ["node", "server.js"]
