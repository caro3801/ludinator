FROM oven/bun:1

WORKDIR /app

# Create non-root user
RUN useradd -m appuser

# Create /data directory and set permissions for Railway volume
RUN mkdir -p /data && chown appuser:appuser /data

# Copy package files
COPY package.json package-lock.json bunfig.toml ./

# Install all dependencies
RUN bun install

# Copy app files
COPY src/ ./src/
COPY tsconfig.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html update.html fest.html mioum.html admin.html favicon.svg ./

# Build frontend as root (Vite creates temp files)
RUN bun run build

# Change ownership of /app to appuser (except node_modules which can stay root)
RUN chown -R appuser:appuser /app

# Switch to non-root user for runtime
USER appuser

# Railway sets PORT, we use it via process.env.PORT
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
