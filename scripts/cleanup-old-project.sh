#!/bin/bash

# LearningHub AI - Project Cleanup Script
echo "🧹 Cleaning up old project structure..."

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

# Navigate to parent directory
cd /Users/tharanga/Documents/Projects/AI/LearningHub

print_status "Current project structure:"
ls -la

echo ""
print_warning "The old project directory 'learning_hub' can now be safely removed."
print_status "All documentation, requirements, and code have been migrated to this monorepo."

echo ""
print_status "Comparison:"
echo "  OLD: /Users/tharanga/Documents/Projects/AI/LearningHub/learning_hub"
echo "  NEW: /Users/tharanga/Documents/Projects/AI/LearningHub/learning-hub-monorepo/learning-hub"

echo ""
print_status "What was migrated:"
echo "  ✅ docs/ - All project documentation"
echo "  ✅ requirements/ - User stories and acceptance criteria"
echo "  ✅ AI_Powered_Education_App_Brainstorming.md - Original brainstorming"
echo "  ✅ Git history and remote configuration"

echo ""
print_warning "To remove the old directory (AFTER VERIFICATION):"
echo "  cd /Users/tharanga/Documents/Projects/AI/LearningHub"
echo "  rm -rf learning_hub"

echo ""
print_success "✅ Monorepo is now the single source of truth!"
print_status "Working directory: $(pwd)"
