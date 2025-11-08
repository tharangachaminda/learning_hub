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
  answer: z.number(),
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
 * Grade-level vocabulary and complexity patterns
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
      "Great effort!",
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
} as const;

/**
 * Helper function to get country context
 */
export function getCountryContext(country: Country) {
  return COUNTRY_CONTEXTS[country] || COUNTRY_CONTEXTS.NZ;
}

/**
 * Validates and parses LLM response with structured error handling
 */
export function parseLLMResponse(
  rawResponse: string
): LLMQuestionResponse | null {
  try {
    // First try to parse as JSON (for structured responses)
    const jsonMatch = rawResponse.match(/\{.*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return LLMQuestionResponseSchema.parse(parsed);
    }

    // Fallback to regex parsing for text responses
    const questionMatch = rawResponse.match(
      /QUESTION:\s*(.+?)(?=\n|ANSWER:|$)/
    );
    const answerMatch = rawResponse.match(/ANSWER:\s*(\d+)/);
    const explanationMatch = rawResponse.match(/EXPLANATION:\s*(.+?)$/);

    if (questionMatch && answerMatch && explanationMatch) {
      const response = {
        question: questionMatch[1].trim(),
        answer: parseInt(answerMatch[1], 10),
        explanation: explanationMatch[1].trim(),
      };

      return LLMQuestionResponseSchema.parse(response);
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse LLM response:', error);
    return null;
  }
}
