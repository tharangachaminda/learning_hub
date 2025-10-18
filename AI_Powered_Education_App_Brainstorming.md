# AI-Powered Educational Web Application — Brainstorming Document
**Date:** 2025-10-17

## 1. Project Overview
An AI-powered educational platform designed for **primary and middle school students (Grades 2–8)**.  
The system focuses on providing adaptive, curriculum-aligned learning experiences for subjects such as **Mathematics**, **Science**, **English**, and **Technology**.  

The platform will generate, evaluate, and adapt question sets using local AI models and will later support seamless cloud deployment for scalability.  
Its main objective is to enhance learning through AI-powered evaluation, progress tracking, and balanced curriculum coverage.

---

## 2. Core Objectives
- Deliver **AI-generated and adaptive question sets** for students.
- Support **multiple educational curricula** (New Zealand, US, UK).
- Provide **personalized progress tracking** and insights.
- Ensure **balanced learning** across all subjects and topics.
- Enable **data-driven visualization** for student and parent dashboards.
- Maintain **local-first architecture**, extensible to cloud environments.

---

## 3. Supported Subjects
1. **Mathematics** — Numbers, Algebra, Geometry, Fractions, Word Problems.  
2. **Science** — Life Science, Physical Science, Chemistry, Environmental Science.  
3. **English** — Grammar, Vocabulary, Comprehension, Writing, Speaking.  
4. **Technology** — Coding, Robotics, Digital Literacy, Internet Safety.

---

## 4. Curriculum Support
The application will support multiple curricula, including the **New Zealand Curriculum**, **US Curriculum**, and **UK Curriculum**.  
Each curriculum can be defined through a modular content mapping system.

### Curriculum Structure Example
**New Zealand Curriculum → Mathematics → Number and Algebra → Fractions**  
**US Curriculum → Science → Physical Science → Motion and Forces**

### Curriculum Management
- Admin-defined curriculum structures.  
- Each includes:
  - Grade levels
  - Subjects and categories
  - Subtopics and objectives
  - Skill tags and difficulty mapping

---

## 5. Functional Modules

### 5.1 Question Generation Engine
- **AI-driven question creation** using local models via Ollama.  
- Integrates with **LangChain** and **LangGraph** for structured prompt management.  
- Supports multiple question types: MCQs, drag-and-drop, fill-in-the-blank, and descriptive answers.  
- Tagged with difficulty, topic, and skill-level metadata.

### 5.2 Evaluation & Feedback
- **Objective questions** auto-evaluated using predefined logic.  
- **Descriptive answers** analyzed via NLP-based evaluation (local LLM).  
- AI generates personalized feedback and explanations.  
- Reinforcement suggestions based on weak areas.

### 5.3 Progress Tracking & Analytics
- Continuous tracking of:
  - Accuracy rates by subject/topic
  - Time-based progress
  - Performance growth trends
- AI identifies learning gaps and generates personalized study plans.

### 5.4 Balanced Learning Algorithm
- AI ensures no subject is neglected.  
- Dynamically adjusts question sets for balance.  
- Detects over- and under-performance areas.  

### 5.5 Dashboards & Reports
- **Student Dashboard**: Progress charts, skill analysis, AI suggestions.  
- **Parent Dashboard**: Child’s progress overview and strengths/weaknesses.  
- **Admin Dashboard**: Curriculum insights, user performance summaries.  

---

## 6. Proposed Technology Stack
Initially, all components—including AI models—will run **locally** for development and testing.  
The design will remain **modular and cloud-ready**, supporting easy future deployment to AWS, GCP, or Azure.

| Layer | Technology | Purpose |
| :---- | :---- | :---- |
| **Frontend** | Angular 20.x | Interactive web UI |
| **CSS Framework(s)** | Angular MDB 5 | Elegant, responsive UI/UX |
| **Backend** | NestJS (Node.js) | API gateway and microservices framework |
| **Database** | MongoDB | Store user profiles, progress data, curriculum metadata |
| **AI Layer** | LangChain + LangGraph + Ollama models (via REST API) | Question generation and AI-based evaluation |
| **Vector Database** | OpenSearch | Semantic search and question retrieval |

### AI Models Used
| Purpose | Model | Description |
| :---- | :---- | :---- |
| Question Generation | `llama3.1:latest`, `qwen3:14b` | Used for generating adaptive, curriculum-based question sets |
| Vectorization / Embeddings | `nomic-embed-text:latest` | Used for content retrieval, semantic search, and embeddings |

---

## 7. Technical Architecture

### 7.1 Frontend (Angular 20.x)
- Modular structure for grade and curriculum-based content.  
- Interactive question components (drag-and-drop, fill-in-the-blank, etc.).  
- Progress visualization using Angular charts and MDB5 UI elements.  

### 7.2 Backend (NestJS)
- Modular microservices:  
  1. **Auth Service** — JWT-based authentication (student, parent, admin roles).  
  2. **Curriculum Service** — Load curriculum structure and topics.  
  3. **Question Service** — Integrate with AI (LangChain + Ollama).  
  4. **Evaluation Service** — Analyze answers, provide scores.  
  5. **Progress Service** — Store and analyze student performance.  

### 7.3 AI & Data Layer
- **LangChain + LangGraph** pipelines for prompt management and response evaluation.  
- **Ollama Models** serve through a local REST API for offline inference.  
- **OpenSearch** stores vector embeddings for semantic retrieval of similar questions.  

### 7.4 Future Cloud Integration
When scaling to cloud:  
- Use **AWS EC2** for backend hosting.  
- Store content in **S3**.  
- Use **AWS OpenSearch Service** for managed vector search.  
- Deploy AI models in **AWS SageMaker** or **Lambda Containers**.  

---

## 8. Data Flow (Example)
1. Student selects subject and subtopic.  
2. Backend requests AI engine (via LangChain/Ollama REST API).  
3. AI generates tailored question set.  
4. Student submits answers → Evaluation Service processes them.  
5. Scores and analytics stored in MongoDB.  
6. Dashboard visualizes data using pre-aggregated metrics.  

---

## 9. AI-Driven Features
- **Adaptive difficulty**: Questions get harder/easier based on performance.  
- **Personalized recommendations**: Suggests revision topics.  
- **Semantic question retrieval**: Finds similar or related concepts.  
- **AI tutoring assistance**: Explains solutions conversationally.  

---

## 10. Future Enhancements
- Cloud scalability (multi-user, real-time sync).  
- Support for multimedia (audio/video-based learning).  
- Gamified learning progression (badges, levels, leaderboards).  
- AI voice tutor (speech recognition for English speaking practice).  
- Teacher content management portal.  

---

## 11. Expected Outcomes
- Engaging, AI-assisted learning for students.  
- Detailed progress insight for parents.  
- Curriculum-aligned evaluation and analytics.  
- Local-first setup ensuring privacy and cost efficiency.  

---

## 12. Next Steps
1. Define curriculum JSON schema.  
2. Build local prototype using Angular + NestJS + Ollama.  
3. Implement AI question generator pipeline with LangChain/LangGraph.  
4. Create mock dashboards using dummy data.  
5. Test balanced learning algorithm locally.  
6. Prepare for cloud migration (Docker + OpenSearch setup).  

---

**End of Document**
