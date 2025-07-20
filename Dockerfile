# Dockerfile

# --- 1. Build Stage ---
    FROM node:20-alpine AS build

    # Set working directory
    WORKDIR /app
    
    # Copy package.json and package-lock.json
    COPY package.json package-lock.json* ./
    
    # Install dependencies
    RUN npm install
    
    # Copy the rest of the application source code
    COPY . .
    
    # Build the Next.js application
    # The standalone output mode will bundle all necessary files, including node_modules.
    RUN npm run build
    
    # --- 2. Runner Stage ---
    FROM node:20-alpine AS runner
    
    WORKDIR /app
    
    # Set environment variables
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED 1
    
    # Copy the standalone output from the build stage
    COPY --from=build /app/.next/standalone ./
    # Copy static assets from the build stage
    COPY --from=build /app/.next/static ./.next/static
    # Copy public assets from the build stage (This fixes the PWA/service worker issue)
    COPY --from=build /app/public ./public
    
    
    # Expose the port the app runs on
    EXPOSE 3000
    
    # Set the user to a non-root user for security
    # USER nextjs
    
    # The command to run the application
    CMD ["node", "server.js"]
    