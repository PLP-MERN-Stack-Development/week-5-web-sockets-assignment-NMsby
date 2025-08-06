#!/bin/bash

# Development environment setup script
set -e

echo "🛠️  Setting up development environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check Node.js version
log_info "Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    log_warn "Node.js version should be 18 or higher. Current: $(node -v)"
fi

# Install server dependencies
log_info "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
log_info "Installing client dependencies..."
cd client
npm install
cd ..

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p server/uploads
mkdir -p server/logs
mkdir -p backups

# Set up environment files if they don't exist
if [ ! -f "server/.env" ]; then
    log_info "Creating server .env file..."
    cp server/.env.example server/.env 2>/dev/null || cat > server/.env << EOF
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_development_jwt_secret_key_here
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
SOCKET_PING_TIMEOUT=20000
SOCKET_PING_INTERVAL=10000
EOF
fi

if [ ! -f "client/.env" ]; then
    log_info "Creating client .env file..."
    cp client/.env.example client/.env 2>/dev/null || cat > client/.env << EOF
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Socket.io Chat
VITE_MAX_MESSAGE_LENGTH=500
VITE_MAX_USERNAME_LENGTH=30
EOF
fi

# Make scripts executable
chmod +x scripts/*.sh

log_info "✅ Development environment setup complete!"
log_info ""
log_info "🚀 To start development:"
log_info "   1. Start server: cd server && npm run dev"
log_info "   2. Start client: cd client && npm run dev"
log_info ""
log_info "🐳 To run with Docker:"
log_info "   ./scripts/deploy.sh"