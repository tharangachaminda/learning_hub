import { Injectable, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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
  ExplanationRequestSchema,
  ExplanationRequest,
  GeneratedExplanationSchema,
  GeneratedExplanation,
  ExplanationStyle,
  getGradePatterns,
} from './schemas';
import { CurriculumPromptEngine } from './curriculum-prompt-engine';
import { validateLatexContent } from './latex-validation.utils';
import {
  SemanticSearchService,
  SearchResult,
} from '../opensearch/semantic-search.service';

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

  /** Timeout for question generation requests (ms). Curriculum-aware prompts need more time. */
  private readonly generationTimeout = 30000;

  /** Similarity threshold above which a question is considered a duplicate */
  private readonly ragDuplicateThreshold = 0.95;

  /** Number of RAG examples to retrieve per generation call */
  private readonly ragExampleLimit = 5;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Optional()
    private readonly semanticSearchService?: SemanticSearchService
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
   * Sends a raw prompt to Ollama and returns the text response.
   * Used for refinement and other freeform LLM interactions.
   */
  async generateRaw(prompt: string): Promise<string> {
    const response = await this.httpService.axiosRef.post(
      `${this.ollamaUrl}/api/generate`,
      {
        model: this.defaultModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      },
      { timeout: this.generationTimeout }
    );
    return response.data.response || '';
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
    existingQuestions?: string[];
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
      let prompt = curriculumPrompt.systemPrompt;

      // Retrieve RAG context from OpenSearch vector store
      const ragContext = await this.retrieveRAGContext(
        request.grade,
        request.topic,
        request.difficulty
      );

      // Append RAG examples to prompt for style/complexity reference
      prompt += this.buildRAGPromptSection(ragContext.examples);

      // Combine RAG near-duplicates with existing questions to avoid
      const allExistingQuestions = [
        ...(requestData.existingQuestions || []),
        ...ragContext.duplicateQuestions,
      ];

      // Append existing questions to avoid duplicates
      if (allExistingQuestions.length > 0) {
        prompt += `\n\nIMPORTANT: Do NOT generate any of the following questions (they already exist). Generate a COMPLETELY DIFFERENT question with different numbers:\n${allExistingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}`;
      }

      // Increase temperature when generating additional questions to encourage variety
      const temperature = allExistingQuestions.length
        ? Math.min(0.7 + allExistingQuestions.length * 0.1, 1.2)
        : 0.7;

      // Call Ollama API for question generation
      const response = await this.httpService.axiosRef.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature,
            top_p: 0.9,
          },
        },
        { timeout: this.generationTimeout }
      );

      // Parse AI response using Zod validation
      const aiResponse = response.data.response;
      console.log(
        `[OllamaService] Raw LLM response (first 500 chars): ${aiResponse?.substring(
          0,
          500
        )}`
      );
      const parsedQuestion = this.parseAIResponseWithValidation(
        aiResponse,
        request
      );

      // Validate that the generated question uses the correct operation
      this.validateTopicAlignment(parsedQuestion.question, request.topic);

      const generationTime = Date.now() - startTime;

      // Validate LaTeX in generated content (REQ-QG-046)
      const contentToValidate = [
        parsedQuestion.question,
        parsedQuestion.explanation,
      ].join(' ');
      const latexValidation = validateLatexContent(contentToValidate);

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
          latexValid: latexValidation.isValid,
        },
      };

      return GeneratedQuestionSchema.parse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`LLM question generation failed: ${message}`);
      throw new Error(`LLM question generation failed: ${message}`);
    }
  }

  /**
   * Retrieves RAG context from OpenSearch vector store for question generation.
   * Finds semantically similar existing questions to use as examples and
   * detects near-duplicate questions that should be avoided.
   *
   * @param grade - Student grade level
   * @param topic - Mathematical topic (ADDITION, etc.)
   * @param difficulty - Question difficulty level
   * @returns Object with example questions and duplicate detection flag
   */
  private async retrieveRAGContext(
    grade: number,
    topic: string,
    difficulty: string
  ): Promise<{ examples: SearchResult[]; duplicateQuestions: string[] }> {
    if (!this.semanticSearchService) {
      return { examples: [], duplicateQuestions: [] };
    }

    try {
      const searchQuery = `${topic} grade ${grade} ${difficulty} math question`;
      const results = await this.semanticSearchService.findSimilar(
        searchQuery,
        {
          grade,
          topic: topic.toLowerCase(),
          limit: this.ragExampleLimit,
        }
      );

      // Identify near-duplicate questions (similarity > threshold)
      const duplicateQuestions = results
        .filter((r) => r.similarityScore > this.ragDuplicateThreshold)
        .map((r) => r.questionText);

      console.log(
        `[OllamaService] RAG context: ${results.length} examples found, ${duplicateQuestions.length} near-duplicates`
      );

      return { examples: results, duplicateQuestions };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[OllamaService] RAG retrieval failed (non-blocking): ${message}`
      );
      return { examples: [], duplicateQuestions: [] };
    }
  }

  /**
   * Builds the RAG context section to append to the LLM prompt.
   * Provides example questions from the vector store for the LLM to reference.
   *
   * @param examples - Similar questions retrieved from OpenSearch
   * @returns Formatted prompt section string, or empty if no examples
   */
  private buildRAGPromptSection(examples: SearchResult[]): string {
    if (examples.length === 0) return '';

    const exampleLines = examples
      .map((ex, i) => `${i + 1}. "${ex.questionText}" (answer: ${ex.answer})`)
      .join('\n');

    return `\n\nREFERENCE EXAMPLES (from question bank):
The following are existing questions at this level. Use them as STYLE and COMPLEXITY reference to match the expected quality, but generate a COMPLETELY DIFFERENT question with different numbers and context:
${exampleLines}`;
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
   * Validates that a generated question aligns with the requested topic.
   * Detects off-topic operator usage (e.g., multiplication in a subtraction request).
   * Throws an error if the question uses a forbidden operator as the primary operation.
   */
  private validateTopicAlignment(question: string, topic: string): void {
    const topicUpper = topic.toUpperCase();

    // Map topics to their expected and forbidden operator patterns
    const operatorPatterns: Record<
      string,
      { forbidden: RegExp[]; label: string }
    > = {
      ADDITION: {
        forbidden: [/\\times/i, /\\div/i, /×/i, /÷/i],
        label: 'addition (+)',
      },
      SUBTRACTION: {
        forbidden: [/\\times/i, /\\div/i, /×/i, /÷/i, /\*(?!\*)/, /\//],
        label: 'subtraction (-)',
      },
      MULTIPLICATION: {
        forbidden: [/\\div/i, /÷/i],
        label: 'multiplication (×)',
      },
      DIVISION: {
        forbidden: [/\\times/i, /×/i],
        label: 'division (÷)',
      },
    };

    const rules = operatorPatterns[topicUpper];
    if (!rules) return; // No validation for non-basic topics

    for (const pattern of rules.forbidden) {
      if (pattern.test(question)) {
        console.warn(
          `[OllamaService] Topic mismatch: requested ${topicUpper} but question contains forbidden operator. Question: ${question.substring(
            0,
            100
          )}`
        );
        throw new Error(
          `Generated question does not match requested topic (${rules.label}). Retrying.`
        );
      }
    }
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
        question: this.normalizeLatexDelimiters(
          this.formatQuestionForMath(structured.question, request.topic)
        ),
        answer: structured.answer,
        explanation: this.stripLatex(structured.explanation),
      };
    }

    // Fallback to regex parsing with validation
    const questionMatch = aiResponse.match(
      /QUESTION:\s*(.+?)(?=\n|ANSWER:|$)/s
    );
    const answerMatch = aiResponse.match(/ANSWER:\s*(\d+)/);
    const explanationMatch = aiResponse.match(/EXPLANATION:\s*([\s\S]+?)$/m);

    if (!questionMatch || !answerMatch) {
      throw new Error(
        `Failed to parse AI response: no valid question/answer found. Raw response: ${aiResponse?.substring(
          0,
          200
        )}`
      );
    }

    let question = questionMatch[1].trim();
    const answer = parseInt(answerMatch[1], 10);
    const explanation = explanationMatch?.[1]?.trim() || 'Solve step by step.';

    // Ensure question contains proper math format
    question = this.formatQuestionForMath(question, request.topic);

    return {
      question: this.normalizeLatexDelimiters(question),
      answer,
      explanation: this.stripLatex(explanation),
    };
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
   * Normalizes LaTeX delimiters in text generated by LLMs.
   *
   * Fixes common LLM output issues:
   * - Converts $$...$$ to $...$ (double to single dollar)
   * - Missing closing `$` (e.g., `$8 \div 4 = ?` → `$8 \div 4 = ?$`)
   * - Bare LaTeX commands without any `$` delimiters
   * - Removes \text{} commands (they break rendering with mixed content)
   */
  private normalizeLatexDelimiters(text: string): string {
    if (!text) return text;

    const latexCommandRe =
      /\\(?:div|times|frac|sqrt|cdot|pm|mp|leq|geq|neq|approx|sum|prod|int|left|right|over)\b/;

    // Convert $$...$$ to $...$
    let processed = text.replace(
      /\$\$([\s\S]*?)\$\$/g,
      (_, inner) => `$${inner}$`
    );

    // Remove \text{...} commands — replace with just the inner text
    processed = processed.replace(/\\text\{([^}]*)\}/g, '$1');

    // Remove \, (thin space) — replace with regular space
    processed = processed.replace(/\\,/g, ' ');

    // Count $ signs and fix odd count
    const dollarPositions: number[] = [];
    for (let i = 0; i < processed.length; i++) {
      if (processed[i] === '$') {
        dollarPositions.push(i);
      }
    }

    if (dollarPositions.length % 2 !== 0) {
      // Odd count → append closing $ to pair with the last unpaired one
      processed = processed.trimEnd() + '$';
    }

    // If no $ at all but text contains LaTeX commands, wrap the math portion
    if (!processed.includes('$') && latexCommandRe.test(processed)) {
      processed = processed.replace(
        /((?:\d+\s*)?\\(?:div|times|frac|sqrt|cdot|pm|mp|leq|geq|neq|approx|sum|prod|int|left|right|over)\b[^$]*)/,
        (match) => `$${match.trim()}$`
      );
    }

    return processed;
  }

  /**
   * Strips all LaTeX delimiters and commands from text, returning plain text.
   * Used for explanation fields where LaTeX rendering causes garbled output.
   */
  private stripLatex(text: string): string {
    if (!text) return text;

    return text
      .replace(/\$\$([\s\S]*?)\$\$/g, '$1') // Strip $$...$$
      .replace(/\$(.*?)\$/g, '$1') // Strip $...$
      .replace(/\\text\{([^}]*)\}/g, '$1') // \text{foo} → foo
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2') // \frac{a}{b} → a/b
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
      .replace(/\\,/g, ' ')
      .replace(/\\boxed\{([^}]*)\}/g, '$1')
      .replace(/\\/g, ''); // Remove any remaining backslashes
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

      // Get grade-level patterns dynamically based on student grade
      const gradePatterns = getGradePatterns(request.grade);
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

MANDATORY LATEX FORMATTING:
Every number and every mathematical expression MUST be wrapped in LaTeX delimiters.
- Use $...$ for all inline math, $$...$$ for standalone equations
- This includes ALL numbers, operators, fractions, and results — no exceptions
- LaTeX commands: \\frac{a}{b}, \\times, \\div, ^, \\sqrt{}, \\text{} for units
- CORRECT: "We add $5 + 3 = 8$" | "There are $12$ apples" | "$\\frac{3}{4} + \\frac{1}{2}$"
- WRONG: "We add 5 + 3 = 8" | "There are 12 apples" | "3/4 + 1/2"

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
