# User Story: OpenSearch Vector Integration

**Story ID:** US-AI-004  
**Epic:** AI-Powered Question Enhancement (EP-QG-003)  
**Priority:** P1 (High)  
**Story Points:** 8  
**Sprint:** Sprint 3 (Days 9-11)  
**Dependencies:** US-AI-002 (LangChain/Ollama Core Integration) - COMPLETED

## User Story

```
As the system
I want to store and retrieve similar questions using semantic search
So that I can provide varied but related practice problems
```

## Acceptance Criteria

### Functional Requirements

- [ ] **pre-req** Store question set in OpenSearch database
- [ ] **AC-001:** When questions are generated, the system stores semantic embeddings in OpenSearch
- [ ] **AC-002:** System can find similar questions based on mathematical concepts and difficulty
- [ ] **AC-003:** Duplicate question detection prevents repetitive content (>90% similarity threshold)
- [ ] **AC-004:** "More like this" functionality provides related practice problems
- [ ] **AC-005:** Semantic search results filter by grade level and curriculum topics
- [ ] **AC-006:** Question variety analysis helps balance content across topics

### Technical Requirements

- **REQ-VEC-001:** Integrate OpenSearch cluster for vector storage and search
- **REQ-VEC-002:** Generate embeddings for questions using sentence transformers
- **REQ-VEC-003:** Implement semantic similarity search with metadata filtering
- **REQ-VEC-004:** Create question clustering for variety analysis
- **REQ-VEC-005:** Build duplicate detection pipeline
- **REQ-VEC-006:** Design efficient indexing strategy for real-time updates

## Definition of Done

- [ ] OpenSearch cluster operational with question embeddings
- [ ] Semantic similarity search functional with <500ms response time
- [ ] Duplicate detection prevents >90% similar questions
- [ ] "More like this" API endpoint operational
- [ ] Question clustering analysis available for content balancing
- [ ] Real-time indexing of new questions functional
- [ ] Performance tests validate search speed under load
- [ ] Monitoring and alerting for OpenSearch health

## Technical Implementation Notes

### OpenSearch Integration Architecture

```typescript
interface QuestionEmbedding {
  id: string;
  questionText: string;
  embedding: number[]; // 384-dimensional vector
  metadata: {
    grade: DifficultyLevel;
    topic: string;
    curriculum_objective: string;
    difficulty_score: number;
    generation_timestamp: Date;
    mathematical_concepts: string[];
    question_type: QuestionType;
  };
}

class OpenSearchVectorService {
  async indexQuestion(question: MathQuestion): Promise<void> {
    const embedding = await this.generateEmbedding(question.question);
    await this.opensearchClient.index({
      index: 'math-questions',
      body: {
        questionText: question.question,
        embedding,
        metadata: this.extractMetadata(question),
      },
    });
  }

  async findSimilar(questionText: string, filters: SearchFilters, limit: number = 10): Promise<SimilarQuestion[]> {
    const embedding = await this.generateEmbedding(questionText);
    // Implement kNN search with metadata filtering
  }
}
```

### Embedding Generation Strategy

```typescript
interface EmbeddingGenerator {
  model: 'sentence-transformers/all-MiniLM-L6-v2'; // 384-dim, fast inference
  generateEmbedding(text: string): Promise<number[]>;
  batchGenerateEmbeddings(texts: string[]): Promise<number[][]>;
}

class SentenceTransformerService implements EmbeddingGenerator {
  // Local sentence transformer model for consistent embeddings
  // Optimized for mathematical text understanding
}
```

### Semantic Search Pipeline

```typescript
interface SearchFilters {
  grade?: DifficultyLevel;
  topic?: string;
  curriculumObjective?: string;
  difficultyRange?: [number, number];
  excludeIds?: string[];
}

interface SimilarQuestion {
  question: MathQuestion;
  similarity: number;
  explanation?: string; // Why this question is similar
}

class SemanticSearchService {
  async findSimilarQuestions(referenceQuestion: string, filters: SearchFilters): Promise<SimilarQuestion[]> {
    // 1. Generate embedding for reference question
    // 2. Perform kNN search in OpenSearch
    // 3. Apply metadata filters
    // 4. Calculate similarity scores
    // 5. Return ranked results
  }

  async detectDuplicates(newQuestion: string, threshold: number = 0.9): Promise<boolean> {
    const similar = await this.findSimilarQuestions(newQuestion, {});
    return similar.some((q) => q.similarity > threshold);
  }
}
```

## Testing Scenarios

### Scenario 1: Similar Question Discovery

```gherkin
Given a student completes question "7 + 5 = ?"
When the system searches for similar questions
Then it should return questions like "6 + 4 = ?" and "8 + 3 = ?"
And filter results to Grade 3 addition problems
And similarity scores should be > 0.7 for returned questions
And results should exclude the original question
```

### Scenario 2: Duplicate Prevention

```gherkin
Given the system generates a new question "What is 5 + 3?"
When checking for duplicates in existing questions
And a question "5 + 3 = ?" already exists with >90% similarity
Then the system should flag this as a duplicate
And prevent storage of the duplicate question
And suggest regeneration with different parameters
```

### Scenario 3: Question Variety Analysis

```gherkin
Given 100 questions have been generated for Grade 3 addition
When analyzing question distribution using clustering
Then the system should identify gaps in coverage
And recommend topic areas needing more questions
And ensure balanced difficulty distribution
And highlight over-represented question types
```

## Performance Requirements

- **Search Speed**: <500ms for similarity search (10 results)
- **Indexing Speed**: <200ms for single question indexing
- **Embedding Generation**: <100ms for question embedding
- **Duplicate Detection**: <300ms for new question validation
- **Cluster Analysis**: <2s for 1000 question analysis
- **Storage Efficiency**: <1KB per question embedding

## OpenSearch Configuration

### Index Mapping

```json
{
  "mappings": {
    "properties": {
      "questionText": { "type": "text" },
      "embedding": {
        "type": "dense_vector",
        "dims": 384,
        "index": true,
        "similarity": "cosine"
      },
      "metadata": {
        "properties": {
          "grade": { "type": "keyword" },
          "topic": { "type": "keyword" },
          "curriculum_objective": { "type": "keyword" },
          "difficulty_score": { "type": "float" },
          "generation_timestamp": { "type": "date" }
        }
      }
    }
  }
}
```

### Search Optimization

- Use script scoring for metadata boosting
- Implement result caching for common searches
- Batch indexing for performance improvement
- Regular index optimization and cleanup

---

**Story Owner**: Backend Engineer  
**Collaborators**: DevOps Engineer, Data Engineer  
**Estimated Completion**: Day 11 (Sprint 3)
