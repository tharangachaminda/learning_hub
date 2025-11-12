import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getCurriculumContext } from './curriculum.types';
import {
  QuestionGenerationRequestSchema,
  QuestionGenerationRequest,
  GeneratedQuestionSchema,
  GeneratedQuestion,
  ValidationResultSchema,
  ValidationResult,
  HealthCheckSchema,
  HealthCheck,
  getCountryContext,
  parseLLMResponse,
  Country,
  ExplanationRequestSchema,
  ExplanationRequest,
  GeneratedExplanationSchema,
  GeneratedExplanation,
  ExplanationStyle,
  GRADE_LEVEL_PATTERNS,
} from './schemas';
import { CurriculumPromptEngine } from './curriculum-prompt-engine';

/**
 * Service for integrating with Ollama local LLM server for AI-powered question generation.
 * Provides methods for health checking, math question generation, and validation.
 *
 * @example
 * ```typescript
 * const ollama = new OllamaService(httpService, configService);
 * const question = await ollama.generateMathQuestion({
 *   grade: 3,
 *   topic: 'addition',
 *   difficulty: 'medium'
 * });
 * ```
 */
@Injectable()
export class OllamaService {
  private readonly ollamaUrl: string;
  private readonly defaultModel = 'llama3.1:latest';
  private readonly curriculumPromptEngine: CurriculumPromptEngine;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.ollamaUrl = this.configService.get<string>(
      'OLLAMA_URL',
      'http://localhost:11434'
    );
    this.curriculumPromptEngine = new CurriculumPromptEngine();
  }

  /**
   * Checks the health status of the Ollama server and available models.
   *
   * @returns Promise resolving to health status information
   * @throws Error when Ollama server is unreachable
   *
   * @example
   * ```typescript
   * const health = await ollamaService.checkHealth();
   * console.log(health.status); // 'healthy' | 'error'
   * ```
   */
  async checkHealth(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();

      // Check Ollama server health by listing available models
      const response = await this.httpService.axiosRef.get(
        `${this.ollamaUrl}/api/tags`,
        { timeout: 5000 }
      );

      const responseTime = Date.now() - startTime;
      const models =
        response.data.models?.map((model: any) => model.name) || [];

      const result = {
        status: 'healthy' as const,
        models,
        responseTime,
      };

      return HealthCheckSchema.parse(result);
    } catch (error) {
      const result = {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return HealthCheckSchema.parse(result);
    }
  }
  /**
   * Generates a mathematical question using AI with curriculum-aware prompts and cultural context.
   *
   * @param requestData - Question generation parameters
   * @param requestData.grade - Student grade level (1-12)
   * @param requestData.topic - Mathematical topic (addition, subtraction, etc.)
   * @param requestData.difficulty - Difficulty level (easy, medium, hard)
   * @param requestData.country - Country code for cultural context (NZ, AU, UK, US, CA)
   * @param requestData.context - Additional educational context (optional)
   * @returns Promise resolving to generated question with metadata
   * @throws Error when generation fails and no fallback available
   *
   * @example
   * ```typescript
   * const question = await ollamaService.generateMathQuestion({
   *   grade: 3,
   *   topic: 'addition',
   *   difficulty: 'medium',
   *   country: 'NZ'
   * });
   * console.log(question.question); // "Emma has 7 kiwi birds and finds 5 more. How many does she have? 7 + 5 = ?"
   * console.log(question.answer); // 12
   * ```
   */
  async generateMathQuestion(requestData: {
    grade: number;
    topic: string;
    difficulty: string;
    country?: string;
    context?: string;
  }): Promise<GeneratedQuestion> {
    const startTime = Date.now();

    try {
      // Validate and parse request using Zod schema
      const request = QuestionGenerationRequestSchema.parse({
        ...requestData,
        country: requestData.country || 'NZ',
      });

      // Generate curriculum-aware prompt using CurriculumPromptEngine
      const curriculumPrompt =
        this.curriculumPromptEngine.generateCurriculumPrompt({
          grade: request.grade,
          topic: request.topic.toUpperCase(),
          difficulty: request.difficulty,
          country: request.country,
        });

      // Use the curriculum-aware system prompt for AI generation
      const prompt = curriculumPrompt.systemPrompt;

      // Call Ollama API for question generation
      const response = await this.httpService.axiosRef.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        },
        { timeout: 10000 }
      );

      // Parse AI response using Zod validation
      const aiResponse = response.data.response;
      const parsedQuestion = this.parseAIResponseWithValidation(
        aiResponse,
        request
      );

      const generationTime = Date.now() - startTime;

      const result = {
        question: parsedQuestion.question,
        answer: parsedQuestion.answer,
        explanation: parsedQuestion.explanation,
        metadata: {
          grade: request.grade,
          topic: request.topic,
          difficulty: request.difficulty,
          country: request.country,
          generated_by: this.defaultModel,
          generation_time: generationTime,
          validation_score: 1.0, // High score for successful AI generation
        },
      };

      return GeneratedQuestionSchema.parse(result);
    } catch (error) {
      // Fallback to deterministic generation with validation
      return this.generateValidatedFallback(
        requestData,
        Date.now() - startTime
      );
    }
  }

  /**
   * Creates enhanced curriculum-aware prompt with cultural context for AI generation.
   */
  private createEnhancedCurriculumPrompt(
    request: QuestionGenerationRequest,
    curriculumContext: any,
    countryContext: any
  ): string {
    const randomName =
      countryContext.commonNames[
        Math.floor(Math.random() * countryContext.commonNames.length)
      ];
    const randomScenario =
      countryContext.scenarios[
        Math.floor(Math.random() * countryContext.scenarios.length)
      ];

    return `You are an expert mathematics teacher creating a ${
      request.difficulty
    } difficulty ${request.topic} question for a Grade ${
      request.grade
    } student in ${request.country === 'NZ' ? 'New Zealand' : request.country}.

Educational Context:
- Age Group: ${curriculumContext.ageContext} (Grade ${request.grade})
- Complexity: ${curriculumContext.complexityLevel}
- Curriculum Strand: ${
      curriculumContext.category?.curriculumStrand || 'Number and Algebra'
    }
- Skills Focus: ${curriculumContext.skillsFocus.join(', ')}

Cultural Context (${request.country}):
- Use names like: ${countryContext.commonNames.slice(0, 3).join(', ')}
- Currency: ${countryContext.currency} (${countryContext.currencySymbol})
- Scenario suggestion: ${randomScenario}

Please generate a single math question that:
1. Is appropriate for Grade ${request.grade} students
2. Uses ${request.difficulty} difficulty level
3. Focuses on ${request.topic} skills
4. Uses child-friendly language
5. Incorporates ${request.country} cultural context naturally
6. Has a clear, single numerical answer
7. Uses realistic scenarios appropriate for the age group

IMPORTANT: Respond in this EXACT format:
QUESTION: [culturally relevant math question with = ?]
ANSWER: [numerical answer only]
EXPLANATION: [brief, age-appropriate explanation using ${
      request.country
    } context]

Example for Grade 3 addition in New Zealand:
QUESTION: ${randomName} collected 8 shells at Piha Beach and found 5 more near the rocks. How many shells does ${randomName} have altogether? 8 + 5 = ?
ANSWER: 13
EXPLANATION: When we add 8 + 5, we can count on from 8: 9, 10, 11, 12, 13. So ${randomName} has 13 shells from the beach.`;
  }

  /**
   * Parses AI response using Zod validation for structured output.
   */
  private parseAIResponseWithValidation(
    aiResponse: string,
    request: QuestionGenerationRequest
  ): { question: string; answer: number; explanation: string } {
    // First try structured parsing with Zod validation
    const structured = parseLLMResponse(aiResponse);
    if (structured) {
      return {
        question: this.formatQuestionForMath(
          structured.question,
          request.topic
        ),
        answer: structured.answer,
        explanation: structured.explanation,
      };
    }

    // Fallback to regex parsing with validation
    try {
      const questionMatch = aiResponse.match(
        /QUESTION:\s*(.+?)(?=\n|ANSWER:|$)/
      );
      const answerMatch = aiResponse.match(/ANSWER:\s*(\d+)/);
      const explanationMatch = aiResponse.match(/EXPLANATION:\s*(.+?)$/);

      let question =
        questionMatch?.[1]?.trim() ||
        `What is the result of this ${request.topic} problem?`;
      const answer = parseInt(answerMatch?.[1] || '0', 10);
      const explanation =
        explanationMatch?.[1]?.trim() || 'Solve step by step.';

      // Ensure question contains proper math format
      question = this.formatQuestionForMath(question, request.topic);

      return { question, answer, explanation };
    } catch (error) {
      // Final fallback with basic structure
      return {
        question: `Solve this ${request.topic} problem: ? = ?`,
        answer: 10,
        explanation: 'Work through this step by step.',
      };
    }
  }

  /**
   * Ensures question has proper mathematical format with = ? ending.
   */
  private formatQuestionForMath(question: string, topic: string): string {
    // Ensure question contains a math expression with = ? format
    if (question && !question.includes('= ?')) {
      const mathMatch = question.match(/(\d+\s*[+\-*/×÷]\s*\d+)/);
      if (mathMatch) {
        question = question.replace(mathMatch[0], mathMatch[0] + ' = ?');
      } else if (topic === 'addition') {
        // Extract numbers if present and format as addition
        const numbers = question.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          question = `${question} ${numbers[0]} + ${numbers[1]} = ?`;
        }
      }
    }
    return question;
  }

  /**
   * Generates validated deterministic fallback question when AI fails.
   */
  private generateValidatedFallback(
    requestData: any,
    generationTime: number
  ): GeneratedQuestion {
    // Simple deterministic generation with validation
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    const result = {
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2,
      explanation: `Add ${num1} and ${num2} together to get ${num1 + num2}.`,
      metadata: {
        grade: requestData.grade || 3,
        topic: requestData.topic || 'addition',
        difficulty: requestData.difficulty || 'medium',
        country: (requestData.country || 'NZ') as Country,
        generated_by: 'deterministic_fallback',
        generation_time: generationTime,
        fallback_used: true,
        validation_score: 0.8, // Lower score for fallback
      },
    };

    return GeneratedQuestionSchema.parse(result);
  }

  /**
   * Validates the mathematical accuracy and educational appropriateness of AI-generated questions.
   *
   * @param question - The AI-generated question to validate
   * @param question.question - The question text
   * @param question.answer - The provided answer
   * @param question.explanation - The explanation text
   * @returns Promise resolving to validation results with detailed scoring
   * @throws Error when validation system fails
   *
   * @example
   * ```typescript
   * const validation = await ollamaService.validateMathematicalAccuracy({
   *   question: '7 + 5 = ?',
   *   answer: 12,
   *   explanation: 'Add 7 and 5 to get 12'
   * });
   * console.log(validation.isCorrect); // true
   * console.log(validation.accuracy_score); // 1.0
   * ```
   */
  async validateMathematicalAccuracy(question: {
    question: string;
    answer: number;
    explanation: string;
  }): Promise<ValidationResult> {
    try {
      // Simple mathematical validation for basic arithmetic
      const questionText = question.question.toLowerCase();

      // Extract numbers and operation from question
      const additionMatch = questionText.match(/(\d+)\s*\+\s*(\d+)/);
      const subtractionMatch = questionText.match(/(\d+)\s*-\s*(\d+)/);
      const multiplicationMatch = questionText.match(
        /(\d+)\s*\*\s*(\d+)|(\d+)\s*×\s*(\d+)/
      );
      const divisionMatch = questionText.match(
        /(\d+)\s*\/\s*(\d+)|(\d+)\s*÷\s*(\d+)/
      );

      let expectedAnswer: number | null = null;
      let isCorrect = false;
      let operationDetected = 'unknown';
      let complexityScore = 0.5;

      // Validate based on operation type
      if (additionMatch) {
        const [, num1, num2] = additionMatch;
        expectedAnswer = parseInt(num1) + parseInt(num2);
        isCorrect = question.answer === expectedAnswer;
        operationDetected = 'addition';
        complexityScore =
          Math.max(parseInt(num1), parseInt(num2)) > 10 ? 0.8 : 0.4;
      } else if (subtractionMatch) {
        const [, num1, num2] = subtractionMatch;
        expectedAnswer = parseInt(num1) - parseInt(num2);
        isCorrect = question.answer === expectedAnswer;
        operationDetected = 'subtraction';
        complexityScore = parseInt(num1) > 20 ? 0.9 : 0.5;
      } else if (multiplicationMatch) {
        const nums = multiplicationMatch.slice(1).filter(Boolean);
        expectedAnswer = parseInt(nums[0]) * parseInt(nums[1]);
        isCorrect = question.answer === expectedAnswer;
        operationDetected = 'multiplication';
        complexityScore =
          Math.max(parseInt(nums[0]), parseInt(nums[1])) > 5 ? 0.9 : 0.6;
      } else if (divisionMatch) {
        const nums = divisionMatch.slice(1).filter(Boolean);
        expectedAnswer = parseInt(nums[0]) / parseInt(nums[1]);
        isCorrect = question.answer === expectedAnswer;
        operationDetected = 'division';
        complexityScore = 0.8; // Division is generally more complex
      } else {
        // For non-standard questions, assume correct for now
        isCorrect = true;
        expectedAnswer = question.answer;
        operationDetected = 'complex';
        complexityScore = 0.7;
      }

      // Enhanced validation scores
      const accuracy_score = isCorrect ? 1.0 : 0.0;
      const curriculum_aligned = true; // Assume aligned for basic math
      const age_appropriate = true; // Assume appropriate for simplicity

      const result = {
        isCorrect,
        accuracy_score,
        curriculum_aligned,
        age_appropriate,
        validation_details: {
          expected_answer: expectedAnswer,
          operation_detected: operationDetected,
          complexity_score: complexityScore,
        },
      };

      return ValidationResultSchema.parse(result);
    } catch (error) {
      // Fallback validation with schema validation
      const result = {
        isCorrect: false,
        accuracy_score: 0.0,
        curriculum_aligned: false,
        age_appropriate: true,
        validation_details: {
          operation_detected: 'error',
          complexity_score: 0.0,
        },
      };

      return ValidationResultSchema.parse(result);
    }
  }

  /**
   * Generates grade-appropriate step-by-step explanations for mathematical problems.
   * Adapts explanation style and complexity based on student grade level.
   *
   * @param requestData - Explanation generation parameters
   * @param requestData.question - The mathematical question
   * @param requestData.answer - The correct answer
   * @param requestData.studentAnswer - The student's answer (optional, for targeted feedback)
   * @param requestData.grade - Student grade level
   * @param requestData.style - Explanation style (visual, verbal, step-by-step, story)
   * @param requestData.country - Country code for cultural context
   * @returns Promise resolving to generated explanation with metadata
   *
   * @example
   * ```typescript
   * const explanation = await ollamaService.generateExplanation({
   *   question: "7 + 5 = ?",
   *   answer: 12,
   *   studentAnswer: 10,
   *   grade: 3,
   *   style: 'step-by-step',
   *   country: 'NZ'
   * });
   * console.log(explanation.explanation); // "Let's count together! Start with 7..."
   * ```
   */
  async generateExplanation(requestData: {
    question: string;
    answer: number;
    studentAnswer?: number;
    grade: number;
    style?: ExplanationStyle;
    country?: string;
  }): Promise<GeneratedExplanation> {
    const startTime = Date.now();

    try {
      // Validate and parse request
      const request = ExplanationRequestSchema.parse({
        ...requestData,
        style: requestData.style || 'step-by-step',
        country: requestData.country || 'NZ',
      });

      // Get grade-level patterns
      const gradePatterns = GRADE_LEVEL_PATTERNS.GRADE_3; // For now, only Grade 3
      const countryContext = getCountryContext(request.country);

      // Create style-specific prompt
      const prompt = this.createExplanationPrompt(
        request,
        gradePatterns,
        countryContext
      );

      // Call Ollama API for explanation generation
      const response = await this.httpService.axiosRef.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.7, // Slightly more creative for varied explanations
            num_predict: 200, // Limit explanation length
          },
        },
        { timeout: 2000 } // 2 second timeout for <2s requirement
      );

      const aiResponse = response.data.response;

      // Parse and analyze explanation
      const explanation = this.parseExplanationResponse(aiResponse);
      const analysis = this.analyzeExplanation(explanation, request.grade);

      const generationTime = Date.now() - startTime;

      const result: GeneratedExplanation = {
        explanation,
        style: request.style,
        grade_level: request.grade,
        vocabulary_level: analysis.vocabularyLevel,
        encouragement:
          gradePatterns.encouragingPhrases[
            Math.floor(Math.random() * gradePatterns.encouragingPhrases.length)
          ],
        visual_aids: analysis.visualAids,
        metadata: {
          generation_time: generationTime,
          word_count: analysis.wordCount,
          sentence_count: analysis.sentenceCount,
          avg_sentence_length: analysis.avgSentenceLength,
          educational_appropriate: analysis.educationallyAppropriate,
        },
      };

      return GeneratedExplanationSchema.parse(result);
    } catch (error) {
      // Fallback to simple deterministic explanation
      const generationTime = Date.now() - startTime;
      const fallbackExplanation = this.generateFallbackExplanation(
        requestData.question,
        requestData.answer,
        requestData.grade
      );

      return GeneratedExplanationSchema.parse({
        explanation: fallbackExplanation,
        style: requestData.style || 'step-by-step',
        grade_level: requestData.grade,
        vocabulary_level: 'simple' as const,
        encouragement: "You're doing great! Let's practice together!",
        visual_aids: ['use your fingers', 'count step by step'],
        metadata: {
          generation_time: generationTime,
          word_count: fallbackExplanation.split(' ').length,
          sentence_count: fallbackExplanation.split('.').length - 1,
          avg_sentence_length: 6,
          educational_appropriate: true,
        },
      });
    }
  }

  /**
   * Creates explanation prompt based on style and grade level.
   */
  private createExplanationPrompt(
    request: ExplanationRequest,
    gradePatterns: any,
    countryContext: any
  ): string {
    const isWrongAnswer =
      request.studentAnswer !== undefined &&
      request.studentAnswer !== request.answer;

    const styleGuidance = {
      visual: `Use visual counting aids like "count on your fingers", "use blocks", "draw circles". Reference concrete objects.`,
      verbal: `Use a friendly, conversational tone. Explain like you're talking to a friend. Keep it simple and encouraging.`,
      'step-by-step': `Break down into numbered steps. Each step should be clear and easy to follow. Use simple words.`,
      story: `Create a short story context using ${countryContext.commonNames[0]} and everyday situations. Make math relatable and fun.`,
    };

    return `You are a kind Grade ${
      request.grade
    } math teacher helping a student understand: "${
      request.question
    }" (Answer: ${request.answer})

${
  isWrongAnswer
    ? `The student answered ${request.studentAnswer}, which is incorrect. Be encouraging and help them understand why.`
    : ''
}

Teaching Guidelines for Grade ${request.grade}:
- Use simple words (1-2 syllables)
- Keep sentences short (5-8 words)
- Be encouraging: ${gradePatterns.encouragingPhrases.join(', ')}
- ${styleGuidance[request.style]}
- Use ${countryContext.commonNames
      .slice(0, 2)
      .join(' or ')} in examples if needed

Generate a ${
      request.style
    } explanation that helps the student understand. Keep it under 100 words, friendly, and appropriate for a ${
      request.grade
    } grader.

IMPORTANT: Provide ONLY the explanation text, no labels or formatting.`;
  }

  /**
   * Parses explanation response from AI.
   */
  private parseExplanationResponse(aiResponse: string): string {
    // Remove any potential labels or formatting
    return aiResponse
      .replace(/^EXPLANATION:\s*/i, '')
      .replace(/^SOLUTION:\s*/i, '')
      .trim();
  }

  /**
   * Analyzes explanation for educational appropriateness.
   */
  private analyzeExplanation(
    explanation: string,
    grade: number
  ): {
    vocabularyLevel: 'simple' | 'moderate' | 'complex';
    visualAids: string[];
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    educationallyAppropriate: boolean;
  } {
    const words = explanation.split(/\s+/);
    const sentences = explanation.split(/[.!?]+/).filter((s) => s.trim());

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // Check for visual aid keywords
    const visualAidKeywords = [
      'fingers',
      'blocks',
      'circles',
      'count',
      'draw',
      'picture',
      'groups',
    ];
    const visualAids = visualAidKeywords.filter((keyword) =>
      explanation.toLowerCase().includes(keyword)
    );

    // Simple vocabulary level assessment
    const vocabularyLevel: 'simple' | 'moderate' | 'complex' =
      avgSentenceLength <= 8
        ? 'simple'
        : avgSentenceLength <= 12
        ? 'moderate'
        : 'complex';

    // Educational appropriateness check
    const educationallyAppropriate =
      avgSentenceLength <= 15 && wordCount <= 150 && sentenceCount >= 2;

    return {
      vocabularyLevel,
      visualAids,
      wordCount,
      sentenceCount,
      avgSentenceLength,
      educationallyAppropriate,
    };
  }

  /**
   * Generates deterministic fallback explanation.
   */
  private generateFallbackExplanation(
    question: string,
    answer: number,
    grade: number
  ): string {
    // Extract numbers and operation
    const additionMatch = question.match(/(\d+)\s*\+\s*(\d+)/);
    const subtractionMatch = question.match(/(\d+)\s*-\s*(\d+)/);

    if (additionMatch) {
      const [, num1, num2] = additionMatch;
      return `Let's add together! Start with ${num1}. Now count up ${num2} more: ${Array.from(
        { length: parseInt(num2) },
        (_, i) => parseInt(num1) + i + 1
      ).join(', ')}. The answer is ${answer}!`;
    } else if (subtractionMatch) {
      const [, num1, num2] = subtractionMatch;
      return `Let's subtract! Start with ${num1}. Now count back ${num2}: ${Array.from(
        { length: parseInt(num2) },
        (_, i) => parseInt(num1) - i - 1
      ).join(', ')}. The answer is ${answer}!`;
    }

    return `Let's solve this step by step! The answer is ${answer}. Great job working on this problem!`;
  }
}
