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
import type { QuestionContextPlan } from './schemas';

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

  /** Requested question format */
  format?: 'open-ended' | 'multiple-choice';

  /** Country code for cultural context */
  country: string;

  /** Optional batch-planned context guidance for this specific question */
  contextPlan?: QuestionContextPlan;
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
    levelData: ReturnType<typeof getCurriculumLevel>,
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
10. Write the entire question and explanation in English only
11. Māori proper names, place names, and culturally specific item names are allowed, but the sentence structure and instructions must remain English

STRICT TOPIC ENFORCEMENT:
${this.buildTopicEnforcement(request.topic)}

${this.buildQuestionFormatRules(request)}
${this.buildContextPlanRules(request)}
LANGUAGE REQUIREMENTS:
- Write in English only.
- Do NOT switch the question or explanation into te reo Māori.
- Māori names, place names, and culturally specific nouns are allowed when used naturally inside otherwise English sentences.
- Keep instructions, verbs, and full sentence structure in English.

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
${
  request.format === 'multiple-choice'
    ? '{"question": "<question text with LaTeX>", "answer": <correct answer value as number or string>, "answerAssetId": "<approved visual asset id for the correct answer if the answer is image-based>", "explanation": "<step-by-step explanation in plain English>", "options": [{"value": "<option label or value>", "assetId": "<approved visual asset id when this option is an image>"}], "visualSelections": [{"assetId": "<approved visual asset id>", "role": "inline-symbol|prompt-illustration|answer-option|explanation-aid", "placement": "before-question|after-question|inline|explanation"}]}'
    : '{"question": "<question text with LaTeX>", "answer": <answer as number or string>, "explanation": "<step-by-step explanation in plain English>", "visualSelections": [{"assetId": "<approved visual asset id>", "role": "inline-symbol|prompt-illustration|answer-option|explanation-aid", "placement": "before-question|after-question|inline|explanation"}]}'
}

- If an approved visual asset catalog is supplied later in the prompt, you MUST use approved asset IDs in "visualSelections".
- "visualSelections" must list the visuals in display order.
- If the question shows repeated images, include one visualSelections entry per displayed image. Do not collapse repeated images into a single item.
- Only return "visualSelections": [] when no approved visual asset catalog is supplied or the topic is not visual by nature.
- Never invent asset IDs.
- Never output SVG markup.
${
  request.format === 'multiple-choice'
    ? `- Return exactly 4 options in "options": 1 correct and 3 plausible incorrect choices.
- Each option must have a unique "value".
- If an option is image-based, include its approved "assetId" and do not place SVG markup in the response.
- If the correct answer is image-based, set "answerAssetId" to the correct option asset id. Otherwise omit "answerAssetId".
- The correct answer must match exactly one option value (and asset id when image-based).`
    : '- Omit "options" unless the request explicitly asks for multiple-choice.'
}

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
    const topicUpper = request.topic.toUpperCase();
    const isPatternTopic = this.isPatternTopic(request.topic);
    const isBasicOp = basicOps.includes(topicUpper);
    const isLowerGrade = request.grade <= 4;
    const isEasy = request.difficulty === 'easy';

    const styleGuidance = `If a REFERENCE EXAMPLES section is provided later in this prompt, derive the phrasing, tone, and narrative style of the question from those examples (using different numbers/objects/context — not a duplicate). Only use the fallback guidance below when no REFERENCE EXAMPLES section is provided.`;

    if (topicUpper === 'COUNTING_AND_QUANTITY') {
      return `QUESTION FORMAT STYLE:
${styleGuidance}
Generate a visual counting question tied only to objects actually present in the approved visual catalog.
STRUCTURAL CONSTRAINT (always applies, regardless of reference examples): do NOT invent a setting, location, or narrative scene for the shown objects (e.g. no forests, beaches, mountains, or story context) — describe only the objects and their quantity, nothing more.
Fallback (no reference examples): ask the student to count or identify the quantity of the shown objects, using clear and direct wording.
For Year ${
        request.grade
      }, keep the mathematics within early counting and quantity recognition.
${
  request.format === 'multiple-choice'
    ? 'Make it multiple-choice with exactly 4 options. When possible, include plausible counting distractors close to the correct answer.'
    : ''
}
`;
    }

    if (topicUpper === 'EARLY_OPERATIONS') {
      return `QUESTION FORMAT STYLE:
${styleGuidance}
Generate a joining or taking-away question grounded only in the visible groups of approved objects, not an unrelated story context.
STRUCTURAL CONSTRAINT (always applies, regardless of reference examples): do NOT invent a setting, location, or narrative scene for the shown objects (e.g. no forests, beaches, mountains, or story context) — describe only the objects and the joining/taking-away action, nothing more.
Fallback (no reference examples): use simple join, add, take away, left, or altogether language appropriate for Year ${
        request.grade
      }.
Do NOT turn this into a plain symbolic equation with no shown objects.
${
  request.format === 'multiple-choice'
    ? 'Return exactly 4 options with one correct answer and three age-appropriate distractors.'
    : ''
}
`;
    }

    if (isPatternTopic) {
      return `QUESTION FORMAT STYLE:
${styleGuidance}
Generate a pattern question, not a standalone arithmetic computation — ask the student to identify the repeating unit, continue the pattern, or count shapes in a shown pattern.
Fallback (no reference examples): keep the wording plain, short, and generic for Year ${
        request.grade
      }.
Do NOT mention visual asset IDs or labels such as empty circle, full circle, or full triangle in the question text.
Do NOT turn this into a plain addition, subtraction, multiplication, or division equation unless the pattern itself is central to the question.
${
  request.format === 'multiple-choice'
    ? 'When the answer is a shape/image, supply image-based options using approved asset ids.'
    : ''
}
`;
    }

    if (request.grade <= 2) {
      return `QUESTION FORMAT STYLE:
${styleGuidance}
Fallback (no reference examples): generate direct numeric or short-form questions only.
Do NOT use sentence questions, word problems, or story contexts for this question.
Very simple wording is acceptable, but keep the mathematics direct and concise.
${
  request.format === 'multiple-choice'
    ? 'Return exactly 4 simple options with one correct answer and three plausible distractors.'
    : ''
}
`;
    }

    if (isEasy && isBasicOp && isLowerGrade) {
      return `QUESTION FORMAT STYLE:
${styleGuidance}
Fallback (no reference examples): generate simple numeric questions only (e.g. "$5 + 3 = ?$", "$12 \\times 4 = ?$") — a math expression followed by "= ?", no word problems or story contexts.
${
  request.format === 'multiple-choice'
    ? 'Return exactly 4 numeric options with one correct answer and three plausible distractors.'
    : ''
}
`;
    }

    return '';
  }

  private isPatternTopic(topic: string): boolean {
    const topicUpper = topic.toUpperCase();

    return topicUpper.includes('PATTERN');
  }

  private buildContextPlanRules(request: CurriculumPromptRequest): string {
    const contextPlan = request.contextPlan;

    if (!contextPlan) {
      return '';
    }

    const avoidSettings = contextPlan.avoidSettings?.length
      ? contextPlan.avoidSettings.join(', ')
      : 'none provided';

    if (!contextPlan.sentenceQuestion) {
      return `CONTEXT PLAN:
- Planned Context Bucket: ${contextPlan.bucketLabel} (${contextPlan.bucketId})
- Suggested Setting: ${contextPlan.scenario}
- Approved Context Terms: ${contextPlan.approvedTerms.join(', ')}
- Avoid Repeating These Settings: ${avoidSettings}
- This question should remain direct numeric or short-form, not a sentence or word problem.
${
  contextPlan.simpleWordingOnly
    ? '- Use only very simple wording if any surrounding words are needed.'
    : '- If you use any surrounding words, keep them brief and secondary to the numeric task.'
}
`;
    }

    return `CONTEXT PLAN:
- Planned Context Bucket: ${contextPlan.bucketLabel} (${contextPlan.bucketId})
- Required Setting: ${contextPlan.scenario}
- Approved Context Terms: ${contextPlan.approvedTerms.join(', ')}
- Avoid Repeating These Settings: ${avoidSettings}
- This question should be a contextual sentence or word-problem style question.
- Use at least one approved context term naturally in the question.
`;
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

    if (grade <= 2) {
      return `- ${request.difficulty.toUpperCase()} means: keep the numbers and representation appropriate for Year ${grade}; keep the task direct; do not use sentence questions or word problems; very simple wording is acceptable when needed.
`;
    }

    switch (request.difficulty) {
      case 'easy':
        if (grade <= 4) {
          return `- EASY means: use small, simple numbers appropriate for Grade ${grade}; single-step operation; no word problems or multi-part reasoning; straightforward computation.
`;
        }
        if (request.contextPlan?.sentenceQuestion) {
          return `- EASY means: use straightforward numbers appropriate for Grade ${grade}; keep the computation simple; because this question is planned as contextual, use one short real-world sentence with approved terms only.
`;
        }
        return `- EASY means: use straightforward numbers appropriate for Grade ${grade}; single-step operation; minimal complexity; brief context is okay but keep the math simple.
`;
      case 'medium':
        if (request.contextPlan?.sentenceQuestion) {
          return `- MEDIUM means: use moderate numbers appropriate for Grade ${grade}; use a short real-world context tied to the planned setting; single to two-step operations; some carrying/borrowing is acceptable.
`;
        }
        return `- MEDIUM means: use moderate numbers appropriate for Grade ${grade}; may involve a brief real-world context; single to two-step operations; some carrying/borrowing is acceptable.
`;
      case 'hard':
        if (!request.contextPlan || request.contextPlan.sentenceQuestion) {
          return `- HARD means: use larger or more complex numbers appropriate for Grade ${grade}; multi-step reasoning; word problems with real-world context required; may combine operations or require careful thinking.
`;
        }
        return `- HARD means: use larger or more complex numbers appropriate for Grade ${grade}; multi-step reasoning; keep the format numeric or short-form as planned; do not turn this into a word problem; may combine operations or require careful thinking.
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

    if (topicUpper === 'COUNTING_AND_QUANTITY') {
      return `CRITICAL: The question MUST stay within counting and quantity recognition.
The student must count or recognise the quantity of shown objects.
Do NOT switch to addition, subtraction, sports scoring, number lines beyond early counting, or invented scenic word problems.`;
    }

    if (topicUpper === 'EARLY_OPERATIONS') {
      return `CRITICAL: The question MUST stay within early operations using shown groups.
Use only simple joining or taking-away situations with visible objects.
Do NOT switch to unrelated story problems, advanced number facts, multiplication, or division.`;
    }

    return `The question MUST focus on the topic: ${topic}. Do not generate questions about other topics.`;
  }
}
