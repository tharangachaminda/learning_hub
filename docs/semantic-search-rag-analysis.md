# Semantic Search RAG-Readiness Investigation

## Current Status: ❌ **NOT READY FOR RAG**

### Critical Issue Found

**Error**: `Engine [NMSLIB] does not support filters`

The current vector search implementation uses the NMSLIB engine, which **cannot filter by metadata** (grade, topic, operation, etc.). This is a **blocking issue** for RAG-based question generation.

---

## What RAG Needs for Question Generation

### Required Capabilities:

1. ✅ **Semantic Search**: Find similar questions based on meaning
2. ❌ **Grade Filtering**: Filter questions by grade level (e.g., grade 3, 4, 5)
3. ❌ **Topic Filtering**: Filter by mathematical topic (addition, subtraction, etc.)
4. ❌ **Operation Filtering**: Filter by operation type
5. ❌ **Difficulty Filtering**: Filter by difficulty level
6. ✅ **Similarity Scoring**: Rank questions by relevance
7. ✅ **Embeddings**: 768-dimensional vectors from nomic-embed-text

### Current Implementation Issues:

#### 1. **Engine Limitation** (CRITICAL)

- **Current**: NMSLIB engine
- **Problem**: Does not support kNN filters
- **Impact**: Cannot filter by grade/topic/operation when using vector search
- **Required**: Switch to Lucene or Faiss engine

#### 2. **Query Structure**

- ✅ Semantic search works WITHOUT filters
- ❌ Throws error WITH any metadata filter (grade, topic, operation)
- ❌ Cannot combine vector similarity with metadata filtering

#### 3. **Metadata Storage**

- ✅ All required metadata fields are stored:
  - `metadata.grade` (number): 3, 4, 5, etc.
  - `metadata.topic` (string): "addition", "subtraction", etc.
  - `metadata.operation` (string): "addition", "subtraction", etc.
  - `metadata.difficulty` (string): "grade_3", "grade_4", etc.
  - `metadata.difficulty_score` (number): 0.3, 0.6, etc.
  - `metadata.category` (string): "math"
  - `metadata.curriculum_strand` (string): "number"

---

## Test Results

### ✅ Test 1: Semantic Search WITHOUT Filters

```
Query: "division problem"
Results: 3 questions found
Status: SUCCESS
```

### ❌ Test 2: Semantic Search WITH Grade Filter

```
Query: "division problem" + grade=3
Error: "Engine [NMSLIB] does not support filters"
Status: FAILED
```

### ❌ Test 3: Semantic Search WITH Topic Filter

```
Query: "solve math" + topic="addition"
Error: "Engine [NMSLIB] does not support filters"
Status: FAILED
```

---

## Required Fixes for RAG

### Fix 1: Change Vector Search Engine

**Priority**: CRITICAL

**Current Configuration** (vector-index.service.ts):

```typescript
embedding: {
  type: 'knn_vector',
  dimension: 768,
  method: {
    name: 'hnsw',
    space_type: 'cosinesimil',
    engine: 'nmslib',  // ❌ Does not support filters
    parameters: {
      ef_construction: 128,
      m: 24,
    },
  },
}
```

**Required Configuration**:

```typescript
embedding: {
  type: 'knn_vector',
  dimension: 768,
  method: {
    name: 'hnsw',
    space_type: 'cosinesimil',
    engine: 'lucene',  // ✅ Supports filters OR 'faiss'
    parameters: {
      ef_construction: 128,
      m: 24,
    },
  },
}
```

**Actions Needed**:

1. Delete existing math-questions index
2. Update VectorIndexService to use 'lucene' or 'faiss' engine
3. Recreate index with new engine
4. Re-index all 2,533 questions

### Fix 2: Update Filter Query Structure (if needed)

The current filter implementation should work once we switch engines, but may need adjustment based on the engine.

---

## RAG Use Case Analysis

### Typical RAG Flow for Question Generation:

1. **User Request**: "Generate 5 addition questions for grade 3"
2. **RAG Process**:

   - **Step 1**: LLM understands the request
   - **Step 2**: Semantic search finds similar addition questions

     - Query: "addition problem for grade 3"
     - Filters: `grade=3`, `topic="addition"`
     - Limit: 10-20 examples

   - **Step 3**: Retrieve top similar questions as context

   - **Step 4**: LLM generates new questions using:
     - Retrieved examples as patterns
     - Grade-appropriate difficulty
     - Topic-specific structure
     - Varied question formats

3. **Expected Output**: 5 new, unique addition questions

### Current Capability:

| RAG Step          | Status | Notes                                 |
| ----------------- | ------ | ------------------------------------- |
| LLM Understanding | ✅     | Not tested, but infrastructure exists |
| Semantic Search   | ✅     | Works without filters                 |
| Grade Filtering   | ❌     | **BLOCKED by NMSLIB**                 |
| Topic Filtering   | ❌     | **BLOCKED by NMSLIB**                 |
| Context Retrieval | ✅     | Works if no filters needed            |
| LLM Generation    | ✅     | Not tested, but infrastructure exists |

---

## Recommendations

### Immediate Actions (REQUIRED):

1. ✅ **Switch to Lucene Engine**

   - Supports filters with kNN search
   - Better OpenSearch integration
   - Production-ready

2. ✅ **Re-index All Data**

   - Delete current index
   - Create new index with Lucene engine
   - Load all 2,500 questions again (~30 seconds)

3. ✅ **Test Filter Combinations**
   - Grade only
   - Topic only
   - Grade + Topic
   - Grade + Topic + Operation

### Alternative Solution (if filters still needed):

**Post-Filtering Approach**:

1. Perform kNN search without filters (get top 100 results)
2. Apply metadata filters in application code
3. Return filtered top N results

**Pros**: Works with current NMSLIB engine
**Cons**:

- Less efficient (retrieves more than needed)
- May not find enough results if filters are restrictive
- Not true filtered kNN search

---

## Current Data Status

- ✅ **2,533 questions indexed** in OpenSearch
- ✅ **768-dimensional embeddings** generated
- ✅ **All metadata fields** properly stored
- ✅ **Semantic search** works without filters
- ❌ **Filtered semantic search** blocked by engine limitation

---

## Conclusion

**The current semantic search is NOT ready for RAG-based question generation** because it cannot filter by grade, topic, or other metadata during vector search.

**Required Change**: Switch from NMSLIB to Lucene or Faiss engine to enable filtered kNN search.

**Estimated Fix Time**: 15-20 minutes

- Update index configuration: 2 minutes
- Delete and recreate index: 1 minute
- Re-index all questions: 30 seconds
- Test filters: 5 minutes
- Validate RAG flow: 10 minutes

**Impact**: After fix, the system will fully support RAG workflows with grade/topic/operation filtering during semantic search.
