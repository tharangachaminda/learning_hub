#!/bin/bash

# LearningHub AI - Ollama Setup Script
echo "🤖 Setting up Ollama AI Models for LearningHub..."

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

# Check if Ollama service is running
check_ollama_service() {
    local ollama_url="$1"
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$ollama_url/api/tags" > /dev/null 2>&1; then
            return 0
        fi
        print_status "Waiting for Ollama service... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    return 1
}

# Function to pull model with progress
pull_model() {
    local model_name="$1"
    local container_name="$2"
    
    print_status "Pulling model: $model_name"
    
    if docker exec "$container_name" ollama pull "$model_name"; then
        print_success "Successfully pulled $model_name"
        return 0
    else
        print_error "Failed to pull $model_name"
        return 1
    fi
}

# Function to test model
test_model() {
    local model_name="$1"
    local container_name="$2"
    local test_prompt="$3"
    
    print_status "Testing model: $model_name"
    
    local response=$(docker exec "$container_name" ollama run "$model_name" "$test_prompt" 2>/dev/null)
    
    if [ -n "$response" ]; then
        print_success "Model $model_name is working correctly"
        echo "  Sample response: ${response:0:100}..."
        return 0
    else
        print_error "Model $model_name test failed"
        return 1
    fi
}

# Determine environment (development or production)
if docker ps | grep -q "learning-hub-ollama-dev"; then
    OLLAMA_CONTAINER="learning-hub-ollama-dev"
    OLLAMA_URL="http://localhost:11435"
    ENVIRONMENT="development"
elif docker ps | grep -q "learning-hub-ollama"; then
    OLLAMA_CONTAINER="learning-hub-ollama"
    OLLAMA_URL="http://localhost:11434"
    ENVIRONMENT="production"
else
    print_error "Ollama container not found. Please start the environment first:"
    echo "  For development: ./scripts/start-dev.sh"
    echo "  For production:  ./scripts/start-prod.sh"
    exit 1
fi

print_success "Detected $ENVIRONMENT environment"
print_status "Using Ollama container: $OLLAMA_CONTAINER"

# Wait for Ollama service to be ready
print_status "Checking Ollama service availability..."
if ! check_ollama_service "$OLLAMA_URL"; then
    print_error "Ollama service is not responding after 60 seconds"
    exit 1
fi
print_success "Ollama service is ready!"

# Models configuration
declare -A MODELS=(
    ["llama3.1"]="A general-purpose language model for question generation and explanations"
    ["qwen2.5:14b"]="Specialized model for educational content and student interactions"
    ["nomic-embed-text"]="Embedding model for semantic search and content similarity"
)

declare -A MODEL_TESTS=(
    ["llama3.1"]="What is 2 + 2?"
    ["qwen2.5:14b"]="Generate a simple math question for grade 3 students about addition."
    ["nomic-embed-text"]="math education elementary school"
)

print_status "Required models for LearningHub AI:"
for model in "${!MODELS[@]}"; do
    echo "  - $model: ${MODELS[$model]}"
done
echo ""

# Check available disk space
print_status "Checking available disk space..."
available_space=$(df / | tail -1 | awk '{print $4}')
required_space=10485760  # 10GB in KB

if [ "$available_space" -lt "$required_space" ]; then
    print_warning "Low disk space detected. Models require approximately 10GB total."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled by user"
        exit 0
    fi
fi

# Pull each model
successful_models=0
total_models=${#MODELS[@]}

for model in "${!MODELS[@]}"; do
    echo ""
    print_status "Processing model $((successful_models + 1))/$total_models: $model"
    
    # Check if model already exists
    if docker exec "$OLLAMA_CONTAINER" ollama list | grep -q "$model"; then
        print_success "Model $model already exists, skipping download"
        ((successful_models++))
        continue
    fi
    
    # Pull the model
    if pull_model "$model" "$OLLAMA_CONTAINER"; then
        # Test the model
        if [[ -n "${MODEL_TESTS[$model]}" ]]; then
            test_model "$model" "$OLLAMA_CONTAINER" "${MODEL_TESTS[$model]}"
        fi
        ((successful_models++))
    fi
done

echo ""
print_success "Model setup complete! ($successful_models/$total_models models ready)"

# List all available models
print_status "Available models in Ollama:"
docker exec "$OLLAMA_CONTAINER" ollama list

# Performance recommendations
echo ""
print_status "🚀 Performance Recommendations:"
echo "  - For best performance, ensure at least 8GB RAM available"
echo "  - GPU acceleration will significantly improve response times"
echo "  - Consider model quantization for production deployments"
echo ""

# Environment-specific instructions
if [ "$ENVIRONMENT" = "development" ]; then
    echo "🔧 Development Environment Notes:"
    echo "  - API URL: http://localhost:3001"
    echo "  - Ollama URL: http://localhost:11435"
    echo "  - Models are persisted in Docker volume: ollama-dev-data"
    echo "  - To test models directly: docker exec -it $OLLAMA_CONTAINER ollama run <model-name>"
else
    echo "🏭 Production Environment Notes:"
    echo "  - API URL: http://localhost:3000"
    echo "  - Ollama URL: http://localhost:11434"
    echo "  - Models are persisted in Docker volume: ollama-data"
    echo "  - Monitor performance with: docker stats $OLLAMA_CONTAINER"
fi

echo ""
print_success "🎉 Ollama setup complete! Your AI models are ready for LearningHub."