#!/bin/bash

# LearningHub AI - Production Environment Startup Script
echo "🚀 Starting LearningHub AI Production Environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running!"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please make sure you're in the project root directory."
    exit 1
fi

# Build all images
print_status "Building production images..."
docker-compose build

# Start all production services
print_status "Starting production services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check MongoDB
if docker exec learning-hub-mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB is healthy!"
else
    print_warning "MongoDB health check failed"
fi

# Check API
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "API is healthy!"
else
    print_warning "API health check failed"
fi

# Check Student App
if curl -f http://localhost:4201/health > /dev/null 2>&1; then
    print_success "Student App is healthy!"
else
    print_warning "Student App health check failed"
fi

# Check Parent App
if curl -f http://localhost:4202/health > /dev/null 2>&1; then
    print_success "Parent App is healthy!"
else
    print_warning "Parent App health check failed"
fi

print_success "🎉 Production environment is ready!"
echo ""
echo "🌐 Applications:"
echo "   Main Site:   http://localhost (nginx proxy)"
echo "   Student App: http://localhost/student"
echo "   Parent App:  http://localhost/parent"
echo "   API:         http://localhost/api"
echo ""
echo "📊 Direct Access:"
echo "   Student App: http://localhost:4201"
echo "   Parent App:  http://localhost:4202"
echo "   API:         http://localhost:3000"
echo ""
echo "🗄️ Services:"
echo "   MongoDB:     localhost:27017"
echo "   OpenSearch:  localhost:9200"
echo "   Ollama:      localhost:11434"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:   docker-compose logs -f [service-name]"
echo "   Stop all:    docker-compose down"
echo "   Restart:     docker-compose restart [service-name]"
echo "   Scale API:   docker-compose up -d --scale api=3"
echo ""

# Show running containers
print_status "Running containers:"
docker-compose ps

print_success "Production environment startup complete! 🚀"