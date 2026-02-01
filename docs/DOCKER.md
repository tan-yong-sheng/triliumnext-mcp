# Docker Deployment Guide

This guide explains how to run TriliumNext MCP Server using Docker.

## Quick Start

Run the server using the pre-built image from GitHub Container Registry:

```bash
docker run -d \
  --name triliumnext-mcp \
  --network host \
  -e TRILIUM_API_URL=http://localhost:8080/etapi \
  -e TRILIUM_API_TOKEN=your_api_token_here \
  -e PERMISSIONS=READ;WRITE \
  -e VERBOSE=false \
  ghcr.io/tan-yong-sheng/triliumnext-mcp:latest
```

## Environment Variables

The Docker container accepts the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TRILIUM_API_TOKEN` | **Yes** | - | Your TriliumNext API token (get from TriliumNext settings → ETAPI) |
| `TRILIUM_API_URL` | No | `http://host.docker.internal:8080/etapi` | URL to your TriliumNext instance |
| `PERMISSIONS` | No | `READ;WRITE` | Permissions for the MCP server (READ, WRITE, or both) |
| `VERBOSE` | No | `false` | Enable verbose logging for debugging |

## Multi-Architecture Support

The Docker images are built for multiple architectures:

- **linux/amd64** - For Intel/AMD x86_64 systems
- **linux/arm64** - For ARM64 systems (Raspberry Pi 4+, Apple Silicon via Docker Desktop, AWS Graviton, etc.)

Docker automatically pulls the correct architecture for your system.

## Usage Examples

### Basic Usage

Run with default settings (connects to TriliumNext on localhost):

```bash
docker run -d \
  --name triliumnext-mcp \
  --network host \
  -e TRILIUM_API_TOKEN=your_token_here \
  ghcr.io/tan-yong-sheng/triliumnext-mcp:latest
```

### Custom TriliumNext URL

Connect to a TriliumNext instance on a different host:

```bash
docker run -d \
  --name triliumnext-mcp \
  -e TRILIUM_API_URL=http://192.168.1.100:8080/etapi \
  -e TRILIUM_API_TOKEN=your_token_here \
  ghcr.io/tan-yong-sheng/triliumnext-mcp:latest
```

### With Another TriliumNext Docker Container

If you're running TriliumNext in Docker:

```bash
# Create a network
docker network create trilium-network

# Run TriliumNext (example)
docker run -d \
  --name trilium \
  --network trilium-network \
  -p 8080:8080 \
  -v ~/trilium-data:/home/node/trilium-data \
  triliumnext/notes

# Run TriliumNext MCP
docker run -d \
  --name triliumnext-mcp \
  --network trilium-network \
  -e TRILIUM_API_URL=http://trilium:8080/etapi \
  -e TRILIUM_API_TOKEN=your_token_here \
  ghcr.io/tan-yong-sheng/triliumnext-mcp:latest
```

### Read-Only Access

Run with read-only permissions:

```bash
docker run -d \
  --name triliumnext-mcp \
  --network host \
  -e TRILIUM_API_TOKEN=your_token_here \
  -e PERMISSIONS=READ \
  ghcr.io/tan-yong-sheng/triliumnext-mcp:latest
```

### Enable Verbose Logging

Enable detailed logging for debugging:

```bash
docker run -d \
  --name triliumnext-mcp \
  --network host \
  -e TRILIUM_API_TOKEN=your_token_here \
  -e VERBOSE=true \
  ghcr.io/tan-yong-sheng/triliumnext-mcp:latest
```

## Container Management

### View Logs

```bash
# Follow logs
docker logs -f triliumnext-mcp

# View last 100 lines
docker logs --tail 100 triliumnext-mcp
```

### Stop Container

```bash
docker stop triliumnext-mcp
```

### Start Container

```bash
docker start triliumnext-mcp
```

### Remove Container

```bash
docker rm triliumnext-mcp
```

### Restart Container

```bash
docker restart triliumnext-mcp
```

## Building from Source

If you want to build the Docker image yourself:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tan-yong-sheng/triliumnext-mcp.git
   cd triliumnext-mcp
   ```

2. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

3. **Build the Docker image:**
   ```bash
   docker build -t triliumnext-mcp:local .
   ```

4. **Run your local image:**
   ```bash
   docker run -d \
     --name triliumnext-mcp \
     --network host \
     -e TRILIUM_API_TOKEN=your_token_here \
     triliumnext-mcp:local
   ```

## CI/CD Pipeline

The project includes a GitHub Actions workflow that automatically:

- Builds Docker images for both amd64 and arm64 architectures
- Publishes images to GitHub Container Registry (ghcr.io)
- Creates version tags based on git tags
- Runs on every push to main branch and on version tags

The workflow file is located at `.github/workflows/docker-build-push.yml`.

### Image Tags

Images are tagged with:
- `latest` - Latest build from main branch
- `main` - Latest build from main branch
- `v1.2.3` - Specific version (when tagged)
- `v1.2` - Major.minor version
- `v1` - Major version

## Troubleshooting

### Container Won't Start

Check the logs for errors:
```bash
docker logs triliumnext-mcp
```

### Can't Connect to TriliumNext

1. Verify TriliumNext is running and accessible
2. Check the `TRILIUM_API_URL` is correct
3. If using `host.docker.internal`, ensure Docker Desktop is running
4. If TriliumNext is in Docker, ensure both containers are on the same network

### Permission Errors

Ensure your `TRILIUM_API_TOKEN` is valid and has the necessary permissions in TriliumNext.

### Network Issues

- Use `--network host` for simplest setup on Linux
- On macOS/Windows, use `host.docker.internal` instead of `localhost`
- For container-to-container communication, create a Docker network

## Security Considerations

1. **Protect your API token**: Never commit API tokens to version control
2. **Use environment files**: Store tokens in secure environment files
3. **Limit permissions**: Use `PERMISSIONS=READ` if write access isn't needed
4. **Network isolation**: Use Docker networks to limit container communication
5. **Regular updates**: Pull the latest image regularly for security updates

## Additional Resources

- [TriliumNext Documentation](https://github.com/TriliumNext/Notes)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
