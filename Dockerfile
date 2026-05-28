FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json package-lock.json bunfig.toml ./

# Install all dependencies (including devDependencies for build)
RUN bun install

# Copy source files
COPY src/ ./src/
COPY tsconfig.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html fest.html mioum.html admin.html favicon.svg ./

# Build frontend
RUN bun run build

# Remove devDependencies for production (optional, reduces image size)
RUN bun pm prune --production

# Create data directory for SQLite
RUN mkdir -p /data

# Set non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Railway sets PORT, we use it via process.env.PORT
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
