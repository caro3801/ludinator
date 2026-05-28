FROM oven/bun:1

WORKDIR /app

# Create non-root user
RUN useradd -m appuser

# Copy package files
COPY package.json package-lock.json bunfig.toml ./

# Install all dependencies
RUN bun install

# Create /data directory for Railway's persistent volume and set permissions
RUN mkdir -p /data && chown appuser:appuser /data

# Copy app files
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser tsconfig.json tsconfig.node.json ./
COPY --chown=appuser:appuser vite.config.ts ./
COPY --chown=appuser:appuser index.html fest.html mioum.html admin.html favicon.svg ./

# Build frontend (now builds all HTML entry points)
USER appuser
RUN bun run build

# Runtime user
USER appuser

# Railway sets PORT, we use it via process.env.PORT
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
