#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE_NAME="socketio-chat"
CONTAINER_NAME="socketio-chat-app"
BACKUP_DIR="./backups"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup current uploads if container exists
if docker ps -a --format 'table {{.Names}}' | grep -q $CONTAINER_NAME; then
    log_info "Creating backup of uploads..."
    docker cp $CONTAINER_NAME:/app/server/uploads $BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S)
fi

# Stop and remove existing container
log_info "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build new image
log_info "Building Docker image..."
docker build -t $DOCKER_IMAGE_NAME:latest .

# Run new container
log_info "Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p 5000:5000 \
    -v $(pwd)/server/uploads:/app/server/uploads \
    -v $(pwd)/server/logs:/app/server/logs \
    -e NODE_ENV=production \
    -e CLIENT_URL=${CLIENT_URL:-"http://localhost:5173"} \
    -e JWT_SECRET=${JWT_SECRET:-"your_secure_jwt_secret"} \
    $DOCKER_IMAGE_NAME:latest

# Wait for container to be healthy
log_info "Waiting for application to start..."
sleep 10

# Health check
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log_info "✅ Deployment successful! Application is running."
    log_info "🌐 Application URL: http://localhost:5000"
    log_info "📊 Health check: http://localhost:5000/api/health"
else
    log_error "❌ Deployment failed! Application is not responding."
    log_error "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi

# Clean up old images
log_info "Cleaning up old Docker images..."
docker image prune -f

log_info "🎉 Deployment completed successfully!"