# Production Docker image for TriliumNext MCP Server
# Build the application locally before building the Docker image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (ignore scripts to avoid build step)
RUN npm install --omit=dev --ignore-scripts

# Copy pre-built application
COPY build ./build

# Set environment variables with defaults
ENV TRILIUM_API_URL=http://host.docker.internal:8080/etapi \
    PERMISSIONS=READ;WRITE \
    VERBOSE=false

# Note: This server uses stdio transport for MCP protocol
LABEL description="TriliumNext MCP Server - Model Context Protocol server for TriliumNext Notes" \
      version="0.3.15" \
      maintainer="tan-yong-sheng"

# Run the MCP server
CMD ["node", "build/index.js"]
