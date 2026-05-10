import {
  LearningObjective,
  getCurriculumLevel,
  getLearningObjectivesByStrand,
} from './curriculum-knowledge.types';
import {
  getMathematicsTopicCriteria,
  getMathematicsYearPlan,
  MATHEMATICS_CURRICULUM,
} from './mathematics-curriculum.criteria';
import { CurriculumTopicDefinition } from './curriculum-criteria.types';

/**
 * Curriculum-aware prompt template for AI question generation
 * Includes learning objectives, teaching methodologies, and assessment guidance
 *
 * @example
 * ```typescript
 * const template: CurriculumPromptTemplate = {
 *   systemPrompt: 'You are an expert NZ mathematics educator...',
 *   curriculumContext: 'Level 2, Number strand...',
 *   curriculumLevel: 2,
 *   curriculumStrand: 'Number',
 *   learningObjectives: [...],
 *   teachingMethodology: 'Use concrete materials...',
 *   assessmentGuidance: 'Assess accuracy and strategy...',
 *   exampleQuestions: ['7 + 5 = ?', ...]
 * };
 * ```
 */
export interface CurriculumPromptTemplate {
  /** System-level prompt for AI with curriculum context */
  systemPrompt: string;

  /** Detailed curriculum context string */
  curriculumContext: string;

  /** NZ Curriculum level (1-4) */
  curriculumLevel: number;

  /** Curriculum strand name */
  curriculumStrand: string;

  /** Relevant learning objectives for this prompt */
  learningObjectives: LearningObjective[];

  /** NZ teaching methodology guidance */
  teachingMethodology: string;

  /** Assessment criteria guidance */
  assessmentGuidance: string;

  /** Example questions from curriculum */
  exampleQuestions: string[];

  /** Resolved year-specific curriculum topic criteria, if available */
  topicCriteria: CurriculumTopicDefinition | null;

  /** Version of the curriculum criteria artifact used to build the prompt */
  criteriaVersion: string | null;
}

/**
 * Request parameters for curriculum prompt generation
 */
export interface CurriculumPromptRequest {
  /** Student grade level (1-12) */
  grade: number;

  /** Mathematical topic (ADDITION, SUBTRACTION, etc.) */
  topic: string;

  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';

  /** Country code for cultural context */
  country: string;
}

/**
 * Curriculum-Aware Prompt Engineering Engine
 *
 * Generates AI prompts that integrate NZ Mathematics Curriculum learning objectives,
 * teaching methodologies, and assessment criteria for curriculum-aligned question generation.
 *
 * @example
 * ```typescript
 * const engine = new CurriculumPromptEngine();
 * const prompt = engine.generateCurriculumPrompt({
 *   grade: 3,
 *   topic: 'ADDITION',
 *   difficulty: 'medium',
 *   country: 'NZ'
 * });
 * console.log(prompt.systemPrompt); // Curriculum-aware system prompt
 * ```
 */
export class CurriculumPromptEngine {
  /**
   * Generates curriculum-aware prompt for AI question generation
   *
   * @param request - Prompt generation parameters
   * @returns Complete curriculum prompt template
   *
   * @example
   * ```typescript
   * const prompt = engine.generateCurriculumPrompt({
   *   grade: 3,
   *   topic: 'ADDITION',
   *   difficulty: 'medium',
   *   country: 'NZ'
   * });
   * ```
   */
  generateCurriculumPrompt(
    request: CurriculumPromptRequest
  ): CurriculumPromptTemplate {
    const yearPlan = getMathematicsYearPlan(request.grade);
    const topicCriteria = getMathematicsTopicCriteria(
      request.grade,
      request.topic
    );

    // Map grade to curriculum level
    const curriculumLevel = this.mapGradeToLevel(request.grade);

    // Map topic to curriculum strand
    const curriculumStrand =
      topicCriteria?.strand ?? this.mapTopicToStrand(request.topic);

    // Get curriculum level data
    const levelData = getCurriculumLevel(curriculumLevel);

    // Get learning objectives for this strand
    const learningObjectives = getLearningObjectivesByStrand(
      curriculumLevel,
      curriculumStrand
    );

    // Build curriculum context
    const curriculumContext = this.buildCurriculumContext(
      levelData,
      curriculumStrand,
      learningObjectives,
      request.topic,
      request,
      topicCriteria,
      yearPlan?.focusSummary
    );

    // Extract teaching methodologies
    const teachingMethodology = this.extractTeachingMethodologies(
      learningObjectives,
      topicCriteria
    );

    // Extract assessment guidance
    const assessmentGuidance = this.extractAssessmentGuidance(
      learningObjectives,
      request,
      topicCriteria
    );

    // Extract example questions
    const exampleQuestions = this.extractExampleQuestions(learningObjectives);

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(
      curriculumLevel,
      curriculumStrand,
      learningObjectives,
      request,
      topicCriteria,
      yearPlan?.focusSummary
    );

    return {
      systemPrompt,
      curriculumContext,
      curriculumLevel,
      curriculumStrand,
      learningObjectives,
      teachingMethodology,
      assessmentGuidance,
      exampleQuestions,
      topicCriteria,
      criteriaVersion: topicCriteria ? MATHEMATICS_CURRICULUM.version : null,
    };
  }

  /**
   * Maps student grade to NZ Curriculum level
   *
   * @param grade - Student grade (1-12)
   * @returns Curriculum level (1-4)
   */
  private mapGradeToLevel(grade: number): number {
    if (grade <= 2) return 1;
    if (grade <= 4) return 2;
    if (grade <= 6) return 3;
    return 4;
  }

  /**
   * Maps mathematical topic to curriculum strand
   *
   * @param topic - Mathematical topic (ADDITION, PATTERN_RECOGNITION, etc.)
   * @returns Curriculum strand name
   */
  private mapTopicToStrand(topic: string): string {
    const topicUpper = topic.toUpperCase();

    // Number strand topics
    if (
      topicUpper.includes('ADDITION') ||
      topicUpper.includes('SUBTRACTION') ||
      topicUpper.includes('MULTIPLICATION') ||
      topicUpper.includes('DIVISION') ||
      topicUpper.includes('DECIMAL') ||
      topicUpper.includes('FRACTION')
    ) {
      return 'Number';
    }

    // Algebra strand topics
    if (
      topicUpper.includes('PATTERN') ||
      topicUpper.includes('ALGEBRA') ||
      topicUpper.includes('EQUATION')
    ) {
      return 'Algebra';
    }

    // Geometry strand topics
    if (
      topicUpper.includes('SHAPE') ||
      topicUpper.includes('GEOMETRY') ||
      topicUpper.includes('ANGLE')
    ) {
      return 'Geometry';
    }

    // Measurement strand topics
    if (
      topicUpper.includes('MEASUREMENT') ||
      topicUpper.includes('TIME') ||
      topicUpper.includes('LENGTH') ||
      topicUpper.includes('WEIGHT')
    ) {
      return 'Measurement';
    }

    // Statistics strand topics
    if (
      topicUpper.includes('DATA') ||
      topicUpper.includes('STATISTICS') ||
      topicUpper.includes('PROBABILITY')
    ) {
      return 'Statistics';
    }

    // Default to Number strand
    return 'Number';
  }

  /**
   * Builds comprehensive curriculum context string
   *
   * @param levelData - Curriculum level data
   * @param strandName - Curriculum strand name
   * @param objectives - Learning objectives
   * @param topic - Mathematical topic
   * @returns Formatted curriculum context string
   */
  private buildCurriculumContext(
    levelData: any,
    strandName: string,
    objectives: LearningObjective[],
    topic: string,
    request: CurriculumPromptRequest,
    topicCriteria: CurriculumTopicDefinition | null,
    yearFocusSummary?: string
  ): string {
    const objectiveDescriptions = objectives
      .map((obj) => `${obj.id}: ${obj.description}`)
      .join('\n');

    const keywords = objectives
      .flatMap((obj) => obj.keywords)
      .filter((keyword, index, self) => self.indexOf(keyword) === index)
      .join(', ');

    const difficultyCriteria = topicCriteria?.criteria[request.difficulty];
    const criteriaBlock = topicCriteria
      ? [
          `Resolved Curriculum Topic: ${topicCriteria.label} (${topicCriteria.key})`,
          `Topic Overview: ${topicCriteria.overview}`,
          `Year Focus: ${yearFocusSummary || 'Not specified'}`,
          `Required Skills: ${
            difficultyCriteria?.requiredSkills.join(', ') || 'Not specified'
          }`,
          `Allowed Question Forms: ${
            difficultyCriteria?.allowedQuestionForms.join(', ') ||
            'Not specified'
          }`,
          `Representations: ${
            difficultyCriteria?.representations.join(', ') || 'Not specified'
          }`,
          `Criteria Version: ${MATHEMATICS_CURRICULUM.version}`,
        ].join('\n')
      : 'Resolved Curriculum Topic: Not available';

    return `
NZ Mathematics Curriculum - Level ${levelData.level}
Strand: ${strandName}
Topic: ${topic}
Difficulty: ${request.difficulty}

Learning Objectives:
${objectiveDescriptions}

Key Mathematical Concepts: ${keywords}

Year Groups: ${levelData.yearGroups.join(', ')}

${criteriaBlock}
`.trim();
  }

  /**
   * Extracts teaching methodologies from learning objectives
   *
   * @param objectives - Learning objectives
   * @returns Formatted teaching methodology guidance
   */
  private extractTeachingMethodologies(
    objectives: LearningObjective[],
    topicCriteria: CurriculumTopicDefinition | null
  ): string {
    const methods = objectives
      .flatMap((obj) => obj.teachingMethods)
      .filter((method, index, self) => self.indexOf(method) === index);

    const representations = topicCriteria
      ? topicCriteria.criteria.medium.representations.join(', ')
      : '';

    if (methods.length === 0) {
      return topicCriteria
        ? `Use curriculum-aligned representations: ${representations}`
        : 'Use concrete materials and visual representations';
    }

    return topicCriteria
      ? `Teaching Approaches: ${methods.join(
          ', '
        )}. Preferred representations: ${representations}`
      : `Teaching Approaches: ${methods.join(', ')}`;
  }

  /**
   * Extracts assessment guidance from learning objectives
   *
   * @param objectives - Learning objectives
   * @returns Formatted assessment guidance
   */
  private extractAssessmentGuidance(
    objectives: LearningObjective[],
    request: CurriculumPromptRequest,
    topicCriteria: CurriculumTopicDefinition | null
  ): string {
    const criteria = objectives
      .flatMap((obj) => obj.assessmentCriteria)
      .filter((criterion, index, self) => self.indexOf(criterion) === index);

    const topicCriteriaItems =
      topicCriteria?.criteria[request.difficulty].assessmentCriteria ?? [];
    const mergedCriteria = [...criteria, ...topicCriteriaItems].filter(
      (criterion, index, self) => self.indexOf(criterion) === index
    );

    if (mergedCriteria.length === 0) {
      return 'Assess student understanding and accuracy';
    }

    return `Assessment Focus: ${mergedCriteria.join(', ')}`;
  }

  /**
   * Extracts example questions from learning objectives
   *
   * @param objectives - Learning objectives
   * @returns Array of example questions
   */
  private extractExampleQuestions(objectives: LearningObjective[]): string[] {
    const examples = objectives.flatMap((obj) => obj.examples);
    return examples.length > 0 ? examples : ['Example not available'];
  }

  /**
   * Builds comprehensive system prompt with curriculum awareness
   *
   * @param level - Curriculum level
   * @param strand - Curriculum strand
   * @param objectives - Learning objectives
   * @param request - Original request parameters
   * @returns Formatted system prompt
   */
  private buildSystemPrompt(
    level: number,
    strand: string,
    objectives: LearningObjective[],
    request: CurriculumPromptRequest,
    topicCriteria: CurriculumTopicDefinition | null,
    yearFocusSummary?: string
  ): string {
    const objectiveDescriptions = objectives
      .map((obj) => obj.description)
      .join('; ');

    const teachingMethods = objectives
      .flatMap((obj) => obj.teachingMethods)
      .filter((method, index, self) => self.indexOf(method) === index)
      .join(', ');

    const resolvedCriteria = topicCriteria?.criteria[request.difficulty];
    const criteriaGuidance = topicCriteria
      ? `
CURRICULUM CRITERIA ARTIFACT:
- Criteria Version: ${MATHEMATICS_CURRICULUM.version}
- Resolved Topic: ${topicCriteria.label} (${topicCriteria.key})
- Topic Overview: ${topicCriteria.overview}
- Year Focus: ${yearFocusSummary || 'Not specified'}
- Required Skills: ${
          resolvedCriteria?.requiredSkills.join(', ') || 'Not specified'
        }
- Allowed Question Forms: ${
          resolvedCriteria?.allowedQuestionForms.join(', ') || 'Not specified'
        }
- Preferred Representations: ${
          resolvedCriteria?.representations.join(', ') || 'Not specified'
        }
- Constraints: ${resolvedCriteria?.constraints.join(' | ') || 'Not specified'}
- Assessment Checks: ${
          resolvedCriteria?.assessmentCriteria.join(', ') || 'Not specified'
        }
`
      : '';

    return `You are an expert New Zealand mathematics educator specializing in Curriculum Level ${level}.

CURRICULUM CONTEXT:
- Strand: ${strand}
- Topic: ${request.topic}
- Learning Objectives: ${objectiveDescriptions}
- Teaching Approaches: ${teachingMethods}
- Target Students: Year ${request.grade} (Level ${level})
${criteriaGuidance}

DIFFICULTY LEVEL: ${request.difficulty.toUpperCase()}
${this.buildDifficultyGuidance(request)}
QUESTION REQUIREMENTS:
1. Align with NZ Curriculum Level ${level} ${strand} strand
2. Focus specifically on ${request.topic}
3. Use age-appropriate language and contexts for ${request.grade}-year-olds
4. Incorporate NZ cultural references (kiwi birds, rugby, local contexts)
5. Follow learning objective: ${
      objectives[0]?.description || 'Mathematical understanding'
    }
6. Use teaching methods: ${teachingMethods}
7. Ensure questions are assessable using: ${
      objectives[0]?.assessmentCriteria.join(', ') || 'accuracy'
    }
8. Match the ${request.difficulty.toUpperCase()} difficulty level described above
9. If curriculum criteria are provided, obey the required skills, allowed question forms, and constraints exactly

STRICT TOPIC ENFORCEMENT:
${this.buildTopicEnforcement(request.topic)}

${this.buildQuestionFormatRules(request)}
PROHIBITED QUESTION PATTERNS:
- NEVER generate vague or self-referential questions like "What is the result of this MULTIPLICATION problem?" or "Solve this ADDITION problem" without an actual math expression.
- Every question MUST contain concrete numbers and a specific mathematical operation (e.g. "$7 \\times 8 = ?$", "What is $12 + 5$?").
- Do NOT ask ABOUT a math topic — ask an actual math problem with real numbers.
- Do NOT generate questions that just name the operation without providing numbers to work with.

MANDATORY LATEX FORMATTING:
Use $...$ ONLY around mathematical expressions and operators — NOT around plain narrative text.
- Wrap math expressions: $5 + 3$, $12 \\times 4$, $18 \\div 3$, $\\frac{3}{4}$, $\\sqrt{16}$
- Wrap standalone numbers in questions: $12$ apples, $25$ birds
- Do NOT wrap plain prose or non-mathematical text in $...$
- Do NOT use $$...$$ (double dollar) — always use single $...$
- Do NOT use \\text{} inside math — write plain text outside of $ delimiters
- CORRECT: "What is $5 + 3$?" | "There are $12$ apples"
- CORRECT: "$25 - 12 = ?$"
- WRONG: "$25 dollars - 12 dollars = ?$" (do not put words inside math)
- WRONG: "$$25 - 12 = ?$$" (do not use double dollar)
- WRONG: "$25 \\text{dollar} - 12 = ?$" (do not use \\text inside math)
- For the explanation field: write plain text with NO LaTeX. Just explain in simple prose.

RESPONSE FORMAT:
You MUST respond with ONLY valid JSON in this exact format, nothing else:
{"question": "<question text with LaTeX>", "answer": <numeric answer>, "explanation": "<step-by-step explanation with LaTeX>"}

Generate a ${request.difficulty.toUpperCase()} difficulty ${
      request.topic
    } question that meets these curriculum requirements.`;
  }

  /**
   * Builds question format style rules based on difficulty, grade, and topic.
   *
   * For easy difficulty + basic operations (addition, subtraction, multiplication, division)
   * at lower grades (3-4), instructs LLM to produce simple numeric questions only.
   * Medium and hard difficulties may include sentence-based or word problems.
   *
   * @param request - The curriculum prompt request containing difficulty, grade, and topic
   * @returns A formatted string block for the system prompt, or empty string if no special rules apply
   */
  private buildQuestionFormatRules(request: CurriculumPromptRequest): string {
    const basicOps = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION'];
    const isBasicOp = basicOps.includes(request.topic.toUpperCase());
    const isLowerGrade = request.grade <= 4;
    const isEasy = request.difficulty === 'easy';

    if (isEasy && isBasicOp && isLowerGrade) {
      return `QUESTION FORMAT STYLE:
Generate simple numeric questions ONLY (e.g. "$5 + 3 = ?$", "$12 \\times 4 = ?$").
Do NOT use word problems, sentences, or story contexts for this question.
Keep the format direct: a math expression followed by "= ?".
`;
    }

    return '';
  }

  /**
   * Builds difficulty-specific guidance for the LLM to scale question complexity.
   *
   * - EASY: smaller numbers, single-step operations, straightforward format
   * - MEDIUM: moderate numbers, may require intermediate steps
   * - HARD: larger numbers, multi-step reasoning, word problems, real-world context
   *
   * @param request - The curriculum prompt request
   * @returns Formatted difficulty guidance block for the system prompt
   */
  private buildDifficultyGuidance(request: CurriculumPromptRequest): string {
    const grade = request.grade;

    switch (request.difficulty) {
      case 'easy':
        if (grade <= 4) {
          return `- EASY means: use small, simple numbers appropriate for Grade ${grade}; single-step operation; no word problems or multi-part reasoning; straightforward computation.
`;
        }
        return `- EASY means: use straightforward numbers appropriate for Grade ${grade}; single-step operation; minimal complexity; brief context is okay but keep the math simple.
`;
      case 'medium':
        return `- MEDIUM means: use moderate numbers appropriate for Grade ${grade}; may involve a brief real-world context; single to two-step operations; some carrying/borrowing is acceptable.
`;
      case 'hard':
        return `- HARD means: use larger or more complex numbers appropriate for Grade ${grade}; multi-step reasoning; word problems with real-world context required; may combine operations or require careful thinking.
`;
      default:
        return '';
    }
  }

  /**
   * Builds explicit topic enforcement rules to prevent off-topic generation.
   * Maps each topic to its allowed operator(s) and forbidden alternatives.
   *
   * @param topic - The requested mathematical topic
   * @returns Formatted enforcement block for the system prompt
   */
  private buildTopicEnforcement(topic: string): string {
    const operatorMap: Record<string, { allowed: string; forbidden: string }> =
      {
        ADDITION: {
          allowed: 'addition (+)',
          forbidden:
            'Do NOT use subtraction (-), multiplication (×), or division (÷)',
        },
        SUBTRACTION: {
          allowed: 'subtraction (-)',
          forbidden:
            'Do NOT use addition (+), multiplication (×), or division (÷)',
        },
        MULTIPLICATION: {
          allowed: 'multiplication (×)',
          forbidden:
            'Do NOT use addition (+), subtraction (-), or division (÷)',
        },
        DIVISION: {
          allowed: 'division (÷)',
          forbidden:
            'Do NOT use addition (+), subtraction (-), or multiplication (×)',
        },
      };

    const topicUpper = topic.toUpperCase();
    const enforcement = operatorMap[topicUpper];

    if (enforcement) {
      return `CRITICAL: The question MUST use ONLY ${enforcement.allowed} as the primary mathematical operation.
${enforcement.forbidden} as the main operation, even if they are "related" or "inverse" operations.
The core computation the student performs MUST be ${enforcement.allowed}.`;
    }

    return `The question MUST focus on the topic: ${topic}. Do not generate questions about other topics.`;
  }
}
