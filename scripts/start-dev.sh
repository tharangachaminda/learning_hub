#!/bin/bash

# LearningHub AI - Development Environment Startup Script
echo "🚀 Starting LearningHub AI Development Environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

print_success "Docker is running!"

# Check if docker-compose.dev.yml exists
if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "docker-compose.dev.yml not found. Please make sure you're in the project root directory."
    exit 1
fi

print_status "Starting development services..."

# Start database and supporting services first
print_status "Starting MongoDB, OpenSearch, and Redis..."
docker-compose -f docker-compose.dev.yml up -d mongodb-dev opensearch-dev redis-dev

# Wait for services to be healthy
print_status "Waiting for database services to be ready..."
sleep 10

# Check MongoDB connection
print_status "Checking MongoDB connection..."
if docker exec learning-hub-mongodb-dev mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB is ready!"
else
    print_warning "MongoDB might still be starting up..."
fi

# Check OpenSearch connection
print_status "Checking OpenSearch connection..."
if curl -s http://localhost:9201/_cluster/health > /dev/null 2>&1; then
    print_success "OpenSearch is ready!"
else
    print_warning "OpenSearch might still be starting up..."
fi

# Ollama setup skipped - using local Ollama installation
print_status "Skipping Ollama Docker container (using local Ollama)..."
print_warning "Make sure Ollama is running locally with required models:"
print_warning "  - llama3.1"
print_warning "  - qwen2.5:14b" 
print_warning "  - nomic-embed-text"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start the development API
print_status "Starting NestJS API in development mode..."
docker-compose -f docker-compose.dev.yml up -d api-dev

# Give API time to start
sleep 10

# Start Angular applications in development mode
print_status "Starting Student App (Angular) on port 4201..."
docker-compose -f docker-compose.dev.yml up -d student-app-dev

print_status "Starting Parent App (Angular) on port 4202..."
docker-compose -f docker-compose.dev.yml up -d parent-app-dev

# Wait for all services to be ready
sleep 20

print_success "🎉 Development environment is ready!"
echo ""
echo "📱 Applications:"
echo "   Student App: http://localhost:4201"
echo "   Parent App:  http://localhost:4202"
echo "   API:         http://localhost:3001"
echo ""
echo "🗄️ Development Services:"
echo "   MongoDB:     mongodb://localhost:27018"
echo "   OpenSearch:  http://localhost:9201"
echo "   Ollama:      http://localhost:11434 (local)"
echo "   Redis:       redis://localhost:6380"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:        docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop all:         docker-compose -f docker-compose.dev.yml down"
echo "   Restart API:      docker-compose -f docker-compose.dev.yml restart api-dev"
echo "   Shell into API:   docker exec -it learning-hub-api-dev sh"
echo ""

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.dev.yml ps

print_success "Development environment startup complete! 🚀"