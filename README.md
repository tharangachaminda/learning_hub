# 🚀 LearningHub AI - Educational Platform

> **AI-powered educational platform for Grade 3 students (ages 7-9) with Angular MDB 5 frontend, NestJS backend, and local Ollama LLM integration.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-20.x-green.svg)
![Angular](https://img.shields.io/badge/angular-20.x-red.svg)
![NestJS](https://img.shields.io/badge/nestjs-11.x-ea2845.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## 📖 Overview

LearningHub AI is a comprehensive educational platform designed specifically for elementary school students. It features AI-generated questions, real-time progress tracking, and separate interfaces for students and parents/teachers.

### ✨ Key Features

- 🎯 **AI-Generated Questions**: Dynamic math problems using local Ollama LLM
- 👶 **Child-Friendly Interface**: Touch-optimized design for tablets and young users
- 📊 **Parent Dashboard**: Comprehensive progress tracking and analytics
- 🏠 **Local-First**: All data and AI processing stays on your device
- 📱 **Responsive Design**: Works perfectly on tablets, phones, and desktops
- 🔒 **Privacy-Focused**: No external API calls, complete data control

## 📚 Project Documentation

This monorepo contains all project documentation and specifications:

### Core Documentation
- **[PRD](docs/prd-learninghub-ai.md)**: Complete Product Requirements Document
- **[Project Brief](docs/project-brief.md)**: High-level project overview  
- **[Architecture](docs/technical/architecture.md)**: System architecture design
- **[Frontend Spec](docs/technical/mdb5-frontend-specification.md)**: MDB 5 UI implementation guide
- **[Brainstorming](AI_Powered_Education_App_Brainstorming.md)**: Original project ideation

### Requirements & Stories
- **[User Stories](requirements/user-stories/)**: Complete epic and story breakdown
- **[Acceptance Criteria](requirements/acceptance-criteria/)**: Feature validation criteria
- **[Wireframes](requirements/wireframes/)**: UI/UX design mockups

## 🏗️ Architecture

### Monorepo Structure

```
learning-hub/
├── docs/                     # Project documentation
│   ├── prd-learninghub-ai.md        # Product Requirements Document
│   ├── project-brief.md             # Project overview and brief
│   └── technical/                   # Technical specifications
│       ├── architecture.md          # System architecture
│       └── mdb5-frontend-specification.md
├── requirements/             # Detailed requirements and user stories
│   ├── acceptance-criteria/         # Acceptance criteria definitions
│   ├── user-stories/               # Epic and story breakdowns
│   └── wireframes/                  # UI/UX wireframes
├── apps/                     # Applications
│   ├── student-app/                 # Angular app for students (MDB 5)
│   ├── parent-app/                  # Angular app for parents/teachers (MDB 5)  
│   └── api/                         # NestJS backend API
├── libs/                     # Shared libraries
│   ├── shared-ui/                   # Shared UI components library
│   └── shared-data/                 # Shared data models and services
├── docker/                   # Docker configurations
│   ├── nginx/                       # Nginx configurations
│   ├── mongodb-init/                # Database initialization scripts
│   └── scripts/                     # Docker utility scripts
├── scripts/                  # Development and deployment scripts
└── AI_Powered_Education_App_Brainstorming.md  # Original brainstorming document
```### Technology Stack

| Component            | Technology              | Purpose                      |
| -------------------- | ----------------------- | ---------------------------- |
| **Frontend**         | Angular 20 + MDB 5      | Student & parent interfaces  |
| **Backend**          | NestJS 11               | RESTful API server           |
| **Database**         | MongoDB 7.0             | Primary data storage         |
| **Vector DB**        | OpenSearch 2.11         | Semantic search & embeddings |
| **AI Engine**        | Ollama (Local)          | LLM for question generation  |
| **Containerization** | Docker + Docker Compose | Development & deployment     |
| **Monorepo**         | Nx Workspace            | Code organization & tooling  |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or later
- **Docker Desktop** (with Docker Compose)
- **Git**
- At least **8GB RAM** (for AI models)
- **10GB+ free disk space** (for models and containers)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd learning-hub
npm install --legacy-peer-deps
```

### 2. Start Development Environment

```bash
# Quick start (recommended for first-time setup)
npm run start:dev

# Or run the script directly
./scripts/start-dev.sh
```

### 3. Access Applications

After startup completes (~2-3 minutes):

| Application           | URL                       | Description                       |
| --------------------- | ------------------------- | --------------------------------- |
| **Student App**       | http://localhost:4201     | Child-friendly learning interface |
| **Parent Dashboard**  | http://localhost:4202     | Progress tracking & analytics     |
| **API Documentation** | http://localhost:3001/api | Swagger/OpenAPI docs              |

### 4. Setup AI Models

```bash
# Pull and configure all required AI models
npm run setup:ollama
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start full development environment
npm run start:student      # Start only student app
npm run start:parent       # Start only parent app
npm run start:api          # Start only API server

# Building & Testing
npm run build:all          # Build all apps in parallel
npm run test:all          # Run tests for all projects

# Docker Management
npm run docker:dev         # Start development containers
npm run docker:stop        # Stop all containers
npm run docker:clean       # Clean up containers and volumes
```

## 🏭 Production Deployment

```bash
# Build and start production environment
npm run start:prod
```

Access at: http://localhost (with nginx reverse proxy)

## 🗄️ Services & Databases

### Development URLs

- **MongoDB**: localhost:27018
- **OpenSearch**: localhost:9201
- **Ollama AI**: localhost:11435
- **Redis**: localhost:6380

### AI Models

- **llama3.1**: General language model
- **qwen2.5:14b**: Educational content model
- **nomic-embed-text**: Text embeddings

## 🎨 Design System

- **Student App**: Bright, child-friendly MDB 5 theme with large touch targets
- **Parent Dashboard**: Professional interface with data visualization
- **Responsive**: Optimized for tablets (primary) and mobile devices
- **Accessibility**: Large text options and keyboard navigation

## 🚨 Troubleshooting

### Common Issues

```bash
# Docker not running
./scripts/start-dev.sh
# Error: Docker is not running

# AI models taking too long
# Ensure 8GB+ RAM available, check disk space

# Port conflicts
# Stop conflicting services or modify docker-compose.dev.yml
```

### Useful Commands

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Test AI models
docker exec -it learning-hub-ollama-dev ollama run llama3.1 "What is 2+2?"
```

## 📝 Development Workflow

1. **Start Environment**: `npm run start:dev`
2. **Make Changes**: Edit code with hot reload
3. **Run Tests**: `npm run test:all`
4. **Check Build**: `npm run build:all`
5. **Commit**: Follow conventional commits

## 🎯 Roadmap

### Version 1.0 (Current - MVP)

- ✅ Basic math question generation
- ✅ Student practice interface
- ✅ Parent progress dashboard
- ✅ Local data storage

### Version 1.1 (Next)

- 🔲 Multiple choice questions
- 🔲 Achievement system
- 🔲 Step-by-step solutions
- 🔲 Weekly reports

---

**Made with ❤️ for young learners and their families**

Built using [Nx](https://nx.dev) monorepo architecture.
