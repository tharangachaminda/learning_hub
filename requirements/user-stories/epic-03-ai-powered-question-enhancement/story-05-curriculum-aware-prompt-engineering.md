# User Story: Curriculum-Aware Prompt Engineering

**Story ID:** US-AI-005  
**Epic:** AI-Powered Question Enhancement (EP-QG-003)  
**Priority:** P1 (High)  
**Story Points:** 5  
**Sprint:** Sprint 3 (Days 10-11)  
**Dependencies:** US-AI-002 (LangChain/Ollama Core Integration) - COMPLETED

## User Story

```
As an AI system
I want to understand NZ Mathematics Curriculum requirements
So that I generate perfectly aligned educational content
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** When generating questions, the AI references specific NZ Curriculum Level 2-3 learning objectives
- [ ] **AC-002:** Generated questions automatically align with curriculum strand requirements (Number, Algebra, Geometry, etc.)
- [ ] **AC-003:** System validates curriculum compliance before question approval
- [ ] **AC-004:** AI understands progression between curriculum levels and adjusts accordingly
- [ ] **AC-005:** Questions include proper curriculum objective tagging for tracking
- [ ] **AC-006:** Content aligns with NZ Mathematics teaching methodologies and approaches

### Technical Requirements

- **REQ-CUR-001:** Create comprehensive NZ Mathematics Curriculum knowledge base
- **REQ-CUR-002:** Develop curriculum-specific prompt templates for each learning objective
- **REQ-CUR-003:** Implement curriculum validation engine
- **REQ-CUR-004:** Build learning objective mapping system
- **REQ-CUR-005:** Create curriculum progression understanding for AI
- **REQ-CUR-006:** Integrate curriculum tags with question metadata

## Definition of Done

- [ ] NZ Mathematics Curriculum Level 2-3 fully mapped and integrated
- [ ] Curriculum-specific prompt templates operational for all strands
- [ ] Automatic curriculum validation functional with >95% accuracy
- [ ] Learning objective tagging working for all generated questions
- [ ] Curriculum compliance reporting available
- [ ] AI demonstrates understanding of curriculum progression
- [ ] Educational specialist validation of curriculum alignment
- [ ] Performance testing shows no degradation with curriculum integration

## Technical Implementation Notes

### NZ Mathematics Curriculum Integration

```typescript
interface CurriculumLevel {
  level: number; // 1-4 for primary mathematics
  yearGroups: number[]; // [3, 4] for Level 2
  description: string;
  keyCompetencies: string[];
  strands: CurriculumStrand[];
}

interface CurriculumStrand {
  name: 'Number' | 'Algebra' | 'Geometry' | 'Measurement' | 'Statistics';
  learningObjectives: LearningObjective[];
  progressionMap: ProgressionIndicator[];
}

interface LearningObjective {
  id: string; // e.g., "NUM-2.1"
  description: string;
  keywords: string[];
  prerequisites: string[];
  examples: string[];
  teachingMethods: string[];
  assessmentCriteria: string[];
}
```

### Curriculum Knowledge Base

```typescript
class CurriculumKnowledgeBase {
  private nzMathCurriculum: Map<string, CurriculumLevel>;

  getLearningObjectives(grade: DifficultyLevel, topic: string): LearningObjective[] {
    // Retrieve specific learning objectives for grade/topic combination
  }

  validateCurriculumAlignment(question: string, objectives: LearningObjective[]): ValidationResult {
    // Validate question alignment with curriculum requirements
  }

  getProgressionPath(currentObjective: string): ProgressionIndicator[] {
    // Understand learning progression and prerequisite relationships
  }
}
```

### Curriculum-Aware Prompt Templates

```typescript
interface CurriculumPromptTemplate {
  systemPrompt: string;
  curriculumContext: string;
  learningObjective: LearningObjective;
  teachingMethodology: string;
  assessmentGuidance: string;
  exampleQuestions: string[];
}

class CurriculumPromptEngine {
  generateCurriculumPrompt(grade: DifficultyLevel, topic: string, objectives: LearningObjective[]): CurriculumPromptTemplate {
    return {
      systemPrompt: `You are an expert New Zealand mathematics educator specializing in Curriculum Level ${this.getLevel(grade)}...`,
      curriculumContext: this.buildCurriculumContext(objectives),
      learningObjective: objectives[0],
      teachingMethodology: this.getNZTeachingApproaches(topic),
      assessmentGuidance: this.getAssessmentCriteria(objectives),
      exampleQuestions: this.getCurriculumExamples(objectives),
    };
  }

  private buildCurriculumContext(objectives: LearningObjective[]): string {
    return `
      Learning Objectives: ${objectives.map((o) => o.description).join(', ')}
      Key Mathematical Concepts: ${this.extractKeyMaths(objectives)}
      Teaching Approaches: ${this.getTeachingStrategies(objectives)}
      Assessment Focus: ${this.getAssessmentFocus(objectives)}
      NZ Cultural Context: ${this.getNZContext()}
    `;
  }
}
```

### Curriculum Validation Engine

```typescript
interface CurriculumValidation {
  isAligned: boolean;
  alignmentScore: number; // 0-1
  matchedObjectives: LearningObjective[];
  gaps: string[];
  recommendations: string[];
}

class CurriculumValidator {
  async validateQuestion(question: MathQuestion, targetObjectives: LearningObjective[]): Promise<CurriculumValidation> {
    // 1. Analyze question content against learning objectives
    // 2. Check mathematical concepts alignment
    // 3. Validate teaching methodology compatibility
    // 4. Assess age-appropriateness
    // 5. Return comprehensive validation result
  }

  private analyzeContentAlignment(questionContent: string, objectives: LearningObjective[]): number {
    // NLP analysis of question content against curriculum keywords
    // Mathematical concept extraction and matching
    // Assessment of learning objective coverage
  }
}
```

## Testing Scenarios

### Scenario 1: Curriculum-Aligned Question Generation

```gherkin
Given I request Grade 3 addition questions
And the curriculum specifies "Number: Add and subtract within 100"
When the AI generates questions using curriculum prompts
Then questions should align with NZ Curriculum Level 2 Number strand
And include learning objective "NUM-2.1: Basic addition strategies"
And use NZ-appropriate contexts and examples
And validation should confirm >95% curriculum alignment
```

### Scenario 2: Learning Objective Progression

```gherkin
Given a student masters "Single-digit addition"
When the system selects next learning objectives
Then it should progress to "Double-digit addition without regrouping"
And understand prerequisite relationships from curriculum
And generate questions that build on previous learning
And align with NZ Mathematics curriculum progression
```

### Scenario 3: Curriculum Validation

```gherkin
Given an AI-generated question "If Sarah has 5 apples and buys 3 more, how many does she have?"
When validating against NZ Curriculum Level 2
Then the system should identify alignment with:
- Number strand: Addition within 20
- Learning objective: Basic addition strategies
- Assessment criteria: Problem-solving with real contexts
And assign high curriculum alignment score (>0.9)
```

## NZ Mathematics Curriculum Integration

### Level 2 (Grade 3) Focus Areas

**Number Strand:**

- Add and subtract with whole numbers to 100
- Know basic addition and subtraction facts
- Use a range of strategies for addition and subtraction

**Key Learning Objectives:**

```typescript
const level2NumberObjectives = [
  {
    id: 'NUM-2.1',
    description: 'Use simple additive strategies with whole numbers',
    keywords: ['addition', 'subtraction', 'counting', 'strategies'],
    teachingMethods: ['concrete materials', 'number lines', 'mental strategies'],
    assessmentCriteria: ['accuracy', 'strategy selection', 'explanation'],
  },
  {
    id: 'NUM-2.2',
    description: 'Know addition and subtraction facts to 20',
    keywords: ['number facts', 'recall', 'fluency'],
    teachingMethods: ['games', 'practice', 'patterns'],
    assessmentCriteria: ['speed', 'accuracy', 'retention'],
  },
];
```

### Cultural Context Integration

```typescript
interface NZCulturalContext {
  contexts: ['family', 'school', 'community', 'environment'];
  maoriPerspectives: string[];
  pacificPerspectives: string[];
  localReferences: string[];
}

// Example: "Kiwi bird counting" vs generic animal counting
// Example: "Rugby players on field" vs generic sports
```

---

**Story Owner**: Educational Technology Specialist  
**Collaborators**: NZ Curriculum Expert, AI Engineer  
**Estimated Completion**: Day 11 (Sprint 3)
