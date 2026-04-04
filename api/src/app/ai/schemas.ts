import { z } from 'zod';

/**
 * Zod Schemas for AI Question Generation
 *
 * Provides runtime validation and type safety for LLM outputs,
 * ensuring structured and reliable question generation.
 */

/**
 * Country context for cultural relevance
 */
export const CountrySchema = z.enum([
  'NZ', // New Zealand (primary)
  'AU', // Australia
  'UK', // United Kingdom
  'US', // United States
  'CA', // Canada
]);

export type Country = z.infer<typeof CountrySchema>;

/**
 * Enhanced question generation request with country context
 */
export const QuestionGenerationRequestSchema = z.object({
  grade: z.number().int().min(1).max(12),
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  country: CountrySchema.default('NZ'),
  context: z.string().optional(),
});

export type QuestionGenerationRequest = z.infer<
  typeof QuestionGenerationRequestSchema
>;

/**
 * Structured LLM response schema for math questions
 *
 * Ensures AI responses follow expected format:
 * - question: Mathematical problem text
 * - answer: Numerical answer
 * - explanation: Age-appropriate explanation
 * - context_elements: Cultural references used
 */
export const LLMQuestionResponseSchema = z.object({
  question: z.string().min(5),
  answer: z.coerce.number(),
  explanation: z.string().min(10),
  context_elements: z
    .object({
      names: z.array(z.string()).optional(),
      scenarios: z.array(z.string()).optional(),
      cultural_references: z.array(z.string()).optional(),
    })
    .optional(),
});

export type LLMQuestionResponse = z.infer<typeof LLMQuestionResponseSchema>;

/**
 * Complete question generation response with metadata
 */
export const GeneratedQuestionSchema = z.object({
  question: z.string(),
  answer: z.number(),
  explanation: z.string(),
  metadata: z.object({
    grade: z.number(),
    topic: z.string(),
    difficulty: z.string(),
    country: CountrySchema,
    generated_by: z.string(),
    generation_time: z.number(),
    fallback_used: z.boolean().optional(),
    validation_score: z.number().min(0).max(1).optional(),
    latexValid: z.boolean().optional(),
  }),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

/**
 * Mathematical validation result schema
 */
export const ValidationResultSchema = z.object({
  isCorrect: z.boolean(),
  accuracy_score: z.number().min(0).max(1),
  curriculum_aligned: z.boolean(),
  age_appropriate: z.boolean(),
  validation_details: z
    .object({
      expected_answer: z.number().optional(),
      operation_detected: z.string().optional(),
      complexity_score: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Explanation style enum for different teaching approaches
 */
export const ExplanationStyleSchema = z.enum([
  'visual', // Uses diagrams, counting aids, visual references
  'verbal', // Conversational, friendly tone
  'step-by-step', // Procedural breakdown with numbered steps
  'story', // Narrative-based explanation with context
]);

export type ExplanationStyle = z.infer<typeof ExplanationStyleSchema>;

/**
 * Explanation generation request schema
 */
export const ExplanationRequestSchema = z.object({
  question: z.string().min(1),
  answer: z.number(),
  studentAnswer: z.number().optional(),
  grade: z.number().int().min(1).max(12),
  style: ExplanationStyleSchema.default('step-by-step'),
  country: CountrySchema.default('NZ'),
});

export type ExplanationRequest = z.infer<typeof ExplanationRequestSchema>;

/**
 * Generated explanation response schema
 */
export const GeneratedExplanationSchema = z.object({
  explanation: z.string().min(10),
  style: ExplanationStyleSchema,
  grade_level: z.number(),
  vocabulary_level: z.enum(['simple', 'moderate', 'complex']),
  encouragement: z.string().optional(),
  visual_aids: z.array(z.string()).optional(),
  metadata: z.object({
    generation_time: z.number(),
    word_count: z.number(),
    sentence_count: z.number(),
    avg_sentence_length: z.number(),
    educational_appropriate: z.boolean(),
  }),
});

export type GeneratedExplanation = z.infer<typeof GeneratedExplanationSchema>;

/**
 * Ollama health check response schema
 */
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'error']),
  models: z.array(z.string()).optional(),
  responseTime: z.number().optional(),
  error: z.string().optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

/**
 * Country-specific context data for prompts
 */
export const COUNTRY_CONTEXTS = {
  NZ: {
    currency: 'dollars',
    currencySymbol: '$',
    commonNames: [
      'Emma',
      'Liam',
      'Olivia',
      'Noah',
      'Charlotte',
      'Mason',
      'Amelia',
      'James',
    ],
    scenarios: [
      'visiting the Auckland Zoo',
      'playing rugby at school',
      'collecting shells at the beach',
      'hiking in the mountains',
      'going to the dairy for ice cream',
      'feeding the sheep on the farm',
    ],
    culturalElements: [
      'kiwi birds',
      'pohutukawa trees',
      'meat pies',
      'L&P drink',
      'All Blacks rugby team',
    ],
  },
  AU: {
    currency: 'dollars',
    currencySymbol: '$',
    commonNames: [
      'Charlotte',
      'Oliver',
      'Amelia',
      'Jack',
      'Isla',
      'William',
      'Ava',
      'Noah',
    ],
    scenarios: [
      'visiting Taronga Zoo',
      'playing cricket at the park',
      'surfing at Bondi Beach',
      'exploring the Outback',
      'buying snags for the barbie',
    ],
    culturalElements: [
      'kangaroos',
      'koalas',
      'Vegemite',
      'cricket matches',
      'eucalyptus trees',
    ],
  },
  // Add more countries as needed
} as const;

/**
 * Grade-level vocabulary and complexity patterns for AI prompt engineering.
 * Each grade defines age-appropriate vocabulary, sentence complexity,
 * encouraging phrases, visual aids, and teaching approaches aligned
 * with NZ Mathematics Curriculum levels.
 *
 * Grade-to-NZ-Curriculum mapping:
 * - Grades 3–4 → Level 2
 * - Grades 5–6 → Level 3
 * - Grades 7–8 → Level 4
 *
 * @example
 * ```typescript
 * const patterns = GRADE_LEVEL_PATTERNS.GRADE_5;
 * console.log(patterns.vocabularyLevel); // 'moderate'
 * ```
 */
export const GRADE_LEVEL_PATTERNS = {
  GRADE_3: {
    vocabularyLevel: 'simple',
    maxSyllablesPerWord: 2,
    targetSentenceLength: 6, // 5-8 words
    encouragingPhrases: [
      "Let's try together!",
      "You're doing great!",
      "Let's count it out!",
      'Great effort!',
      "Let's figure this out!",
    ],
    visualAidsKeywords: [
      'count on your fingers',
      'use blocks',
      'draw circles',
      'make groups',
      'count together',
    ],
    teachingApproaches: [
      'Start with what you know',
      'Count step by step',
      'Use your fingers to help',
      'Think of it like...',
    ],
  },
  GRADE_4: {
    vocabularyLevel: 'simple',
    maxSyllablesPerWord: 2,
    targetSentenceLength: 8, // 6-10 words
    encouragingPhrases: [
      'Good thinking!',
      "You're on the right track!",
      "Let's work through this!",
      'Keep going, you can do it!',
      'Nice problem-solving!',
    ],
    visualAidsKeywords: [
      'draw a number line',
      'use a hundreds chart',
      'make an array',
      'sketch a diagram',
      'use place value blocks',
    ],
    teachingApproaches: [
      'Break the problem into smaller parts',
      'Use what you already know',
      'Try a simpler number first',
      'Look for a pattern',
    ],
  },
  GRADE_5: {
    vocabularyLevel: 'moderate',
    maxSyllablesPerWord: 3,
    targetSentenceLength: 10, // 8-12 words
    encouragingPhrases: [
      'Great reasoning!',
      "You're developing strong skills!",
      "Let's think about this carefully!",
      'Excellent strategy!',
      'Keep building on your ideas!',
    ],
    visualAidsKeywords: [
      'draw a diagram',
      'use a number line',
      'create a table',
      'sketch a model',
      'use fraction strips',
    ],
    teachingApproaches: [
      'Estimate first, then calculate',
      'Look for relationships between numbers',
      'Use place value understanding',
      'Try working backwards',
    ],
  },
  GRADE_6: {
    vocabularyLevel: 'moderate',
    maxSyllablesPerWord: 3,
    targetSentenceLength: 12, // 10-14 words
    encouragingPhrases: [
      'Solid mathematical thinking!',
      "You're making great connections!",
      "Let's analyse this problem!",
      'Strong approach!',
      'Your reasoning is sound!',
    ],
    visualAidsKeywords: [
      'create a ratio table',
      'draw a bar model',
      'use a double number line',
      'sketch a pie chart',
      'model with fractions',
    ],
    teachingApproaches: [
      'Identify the key information',
      'Consider multiple strategies',
      'Use equivalent representations',
      'Check your answer makes sense',
    ],
  },
  GRADE_7: {
    vocabularyLevel: 'moderate',
    maxSyllablesPerWord: 4,
    targetSentenceLength: 14, // 12-16 words
    encouragingPhrases: [
      'Excellent analytical thinking!',
      "You're building strong mathematical reasoning!",
      "Let's explore this systematically!",
      'Well-structured approach!',
      'Your logic is well-developed!',
    ],
    visualAidsKeywords: [
      'plot on a coordinate plane',
      'draw a graph',
      'create an equation model',
      'use algebra tiles',
      'construct a geometric diagram',
    ],
    teachingApproaches: [
      'Define your variables clearly',
      'Look for generalisable patterns',
      'Use algebraic reasoning',
      'Verify with substitution',
    ],
  },
  GRADE_8: {
    vocabularyLevel: 'complex',
    maxSyllablesPerWord: 4,
    targetSentenceLength: 16, // 14-18 words
    encouragingPhrases: [
      'Impressive mathematical reasoning!',
      "You're thinking like a mathematician!",
      "Let's approach this rigorously!",
      'Sophisticated problem-solving!',
      'Excellent use of logical reasoning!',
    ],
    visualAidsKeywords: [
      'graph the function',
      'plot the relationship',
      'model algebraically',
      'use a Cartesian plane',
      'construct a proof diagram',
    ],
    teachingApproaches: [
      'Formulate the problem algebraically',
      'Consider edge cases and constraints',
      'Apply inverse operations strategically',
      'Justify each step of your reasoning',
    ],
  },
} as const;

/**
 * Helper function to get country context
 */
export function getCountryContext(country: Country) {
  return COUNTRY_CONTEXTS[country] || COUNTRY_CONTEXTS.NZ;
}

/**
 * Retrieves the grade-level patterns for a given numeric grade.
 * Maps grade numbers (3–8) to their corresponding GRADE_LEVEL_PATTERNS entry.
 * Clamps out-of-range grades to the nearest supported grade (3 or 8).
 *
 * @param grade - The numeric grade level (3–8)
 * @returns The grade-level patterns object with vocabulary, phrases, and teaching approaches
 *
 * @example
 * ```typescript
 * const patterns = getGradePatterns(5);
 * console.log(patterns.vocabularyLevel); // 'moderate'
 * console.log(patterns.encouragingPhrases); // ['Great reasoning!', ...]
 * ```
 */
export function getGradePatterns(
  grade: number
): (typeof GRADE_LEVEL_PATTERNS)[keyof typeof GRADE_LEVEL_PATTERNS] {
  const gradeKey = `GRADE_${Math.max(
    3,
    Math.min(8, grade)
  )}` as keyof typeof GRADE_LEVEL_PATTERNS;
  return GRADE_LEVEL_PATTERNS[gradeKey] ?? GRADE_LEVEL_PATTERNS.GRADE_3;
}

/**
 * Validates and parses LLM response with structured error handling
 */
export function parseLLMResponse(
  rawResponse: string
): LLMQuestionResponse | null {
  try {
    // First try to parse as JSON (for structured responses)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];

      // Always sanitize LaTeX backslashes BEFORE JSON.parse.
      // LLMs output LaTeX commands like \frac, \times, \sqrt inside JSON strings.
      // These collide with valid JSON escape sequences (\f=formfeed, \t=tab, \b=backspace),
      // causing JSON.parse to silently misinterpret them rather than failing.
      // Fix: double-escape lone backslashes followed by 2+ alpha chars (LaTeX commands).
      // Already-escaped \\frac is preserved by the negative lookbehind.
      const sanitized = jsonStr.replace(/(?<!\\)\\([a-zA-Z]{2,})/g, '\\\\$1');

      try {
        const parsed = JSON.parse(sanitized);
        return LLMQuestionResponseSchema.parse(parsed);
      } catch {
        // Sanitized parse failed — try original as last resort
        try {
          const parsed = JSON.parse(jsonStr);
          return LLMQuestionResponseSchema.parse(parsed);
        } catch {
          // Still failed — try field-level regex extraction from JSON-like text
        }
      }
    }

    // Extract individual fields from JSON-like or malformed JSON responses
    // Handles unescaped quotes, missing closing braces, and rambling explanations
    const jsonQuestion = rawResponse.match(
      /"question"\s*:\s*"((?:[^"\\]|\\.)*)"/s
    );
    const jsonAnswer = rawResponse.match(/"answer"\s*:\s*"?(\d+)"?/);
    if (jsonQuestion && jsonAnswer) {
      const jsonExplanation = rawResponse.match(
        /"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/s
      );
      const response = {
        question: jsonQuestion[1].trim(),
        answer: parseInt(jsonAnswer[1], 10),
        explanation: jsonExplanation?.[1]?.trim() || 'Solve step by step.',
      };
      try {
        return LLMQuestionResponseSchema.parse(response);
      } catch {
        // field-level extraction failed validation — fall through
      }
    }

    // Fallback to regex parsing for text responses
    const questionMatch = rawResponse.match(
      /QUESTION:\s*(.+?)(?=\n|ANSWER:|$)/s
    );
    const answerMatch = rawResponse.match(/ANSWER:\s*(\d+)/);
    const explanationMatch = rawResponse.match(/EXPLANATION:\s*([\s\S]+?)$/m);

    if (questionMatch && answerMatch) {
      const response = {
        question: questionMatch[1].trim(),
        answer: parseInt(answerMatch[1], 10),
        explanation: explanationMatch?.[1]?.trim() || 'Solve step by step.',
      };

      return LLMQuestionResponseSchema.parse(response);
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse LLM response:', error);
    return null;
  }
}
