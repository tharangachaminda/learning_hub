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
  LLMSelectedVisual,
} from './schemas';
import { CurriculumPromptEngine } from './curriculum-prompt-engine';
import { validateLatexContent } from './latex-validation.utils';
import {
  SemanticSearchService,
  SearchResult,
} from '../opensearch/semantic-search.service';
import { VisualAssetRegistryService } from './visual-asset-registry.service';

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
  private readonly defaultModel: string;
  private readonly curriculumPromptEngine: CurriculumPromptEngine;

  /** Timeout for question generation requests (ms). Curriculum-aware prompts need more time. */
  private readonly generationTimeout: number;

  /** Similarity threshold above which a question is considered a duplicate */
  private readonly ragDuplicateThreshold = 0.95;

  /** Number of RAG examples to retrieve per generation call */
  private readonly ragExampleLimit = 10;

  /** Size of the candidate pool fetched from OpenSearch before sampling down to ragExampleLimit */
  private readonly ragPoolSize: number;

  /** Enables verbose logging of assembled prompts and sampled RAG examples */
  private readonly ragDebugLogging: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Optional()
    private readonly semanticSearchService?: SemanticSearchService,
    @Optional()
    private readonly visualAssetRegistryService?: VisualAssetRegistryService
  ) {
    this.ollamaUrl = this.configService.get<string>(
      'OLLAMA_URL',
      'http://localhost:11434'
    );
    this.defaultModel = this.configService.get<string>(
      'OLLAMA_MODEL',
      'llama3.1:latest'
    );
    this.generationTimeout = this.configService.get<number>(
      'OLLAMA_GENERATION_TIMEOUT',
      90000
    );
    this.ragPoolSize = this.configService.get<number>('RAG_POOL_SIZE', 20);
    this.ragDebugLogging = this.configService.get<string>(
      'RAG_DEBUG_LOGGING',
      'false'
    ) === 'true';
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
      const modelList = response.data.models as
        | Array<{ name: string }>
        | undefined;
      const models = modelList?.map((model) => model.name) || [];

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
    try {
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
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Unknown Ollama error';
      const status = error?.response?.status;
      throw new Error(
        `Ollama generateRaw failed${
          status ? ` (HTTP ${status})` : ''
        }: ${message}`
      );
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
    format?: 'open-ended' | 'multiple-choice';
    country?: string;
    context?: string;
    contextPlan?: QuestionGenerationRequest['contextPlan'];
    existingQuestions?: string[];
    subCategory?: { slug: string; name: string; description?: string };
  }): Promise<GeneratedQuestion> {
    const startTime = Date.now();

    try {
      // Validate and parse request using Zod schema
      const request = QuestionGenerationRequestSchema.parse({
        ...requestData,
        format: requestData.format || 'open-ended',
        country: requestData.country || 'NZ',
      });

      // Generate curriculum-aware prompt using CurriculumPromptEngine
      const curriculumPrompt =
        this.curriculumPromptEngine.generateCurriculumPrompt({
          grade: request.grade,
          topic: request.topic.toUpperCase(),
          difficulty: request.difficulty,
          format: request.format,
          country: request.country,
          contextPlan: request.contextPlan,
        });

      // Use the curriculum-aware system prompt for AI generation
      let prompt = curriculumPrompt.systemPrompt;

      const visualCatalog = await this.getVisualCatalogForRequest(request);

      if (visualCatalog.length > 0) {
        prompt += this.buildVisualCatalogPromptSection(
          request.topic,
          visualCatalog
        );
      }

      // Retrieve RAG context from OpenSearch vector store
      const ragContext = await this.retrieveRAGContext(
        request.grade,
        request.topic,
        request.difficulty,
        requestData.subCategory?.slug
      );

      // Explicit sub-category instruction — included even when no RAG
      // examples exist yet for this sub-category (unlike the RAG section
      // below, which is a no-op when the pool is empty).
      prompt += this.buildSubCategoryPromptSection(requestData.subCategory);

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

      if (this.ragDebugLogging) {
        console.log(
          `[OllamaService] Assembled prompt sent to Ollama:\n${prompt}`
        );
      }

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
      const visualSelections = parsedQuestion.visualSelections;
      const visuals = await this.resolveQuestionVisuals(
        request,
        visualSelections
      );
      const normalizedQuestion = this.normalizeVisualQuestionResponse(
        request,
        parsedQuestion,
        visuals
      );

      if (this.shouldUseVisualCatalog(request.topic)) {
        if (visualSelections.length === 0) {
          throw new Error(
            'Generated question omitted required visual selections. Retrying.'
          );
        }

        this.validateNoAssetIdLeakage(
          normalizedQuestion.question,
          visualSelections
        );

        // if (visuals.length !== visualSelections.length) {
        //   throw new Error(
        //     'Generated question used unresolved visual selections. Retrying.'
        //   );
        // }
      }

      // Validate that the generated question uses the correct operation
      this.validateTopicAlignment(normalizedQuestion.question, request.topic);
      this.validateVisualQuestionConsistency(
        request,
        normalizedQuestion.question,
        normalizedQuestion.answer,
        visualSelections,
        visuals
      );

      const generationTime = Date.now() - startTime;

      // Validate LaTeX in generated content (REQ-QG-046)
      const contentToValidate = [
        normalizedQuestion.question,
        normalizedQuestion.explanation,
      ].join(' ');
      const latexValidation = validateLatexContent(contentToValidate);

      const result = {
        question: normalizedQuestion.question,
        answer: normalizedQuestion.answer,
        answerAssetId: normalizedQuestion.answerAssetId,
        explanation: normalizedQuestion.explanation,
        options: normalizedQuestion.options ?? [],
        visualSelections,
        visuals,
        metadata: {
          grade: request.grade,
          topic: request.topic,
          difficulty: request.difficulty,
          country: request.country,
          generated_by: this.defaultModel,
          generation_time: generationTime,
          validation_score: 1.0, // High score for successful AI generation
          latexValid: latexValidation.isValid,
          contextBucketId: request.contextPlan?.bucketId,
          contextScenario: request.contextPlan?.scenario,
          contextualQuestion: request.contextPlan?.sentenceQuestion,
        },
      };

      return GeneratedQuestionSchema.parse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`LLM question generation failed: ${message}`);

      const request = QuestionGenerationRequestSchema.parse({
        ...requestData,
        format: requestData.format || 'open-ended',
        country: requestData.country || 'NZ',
      });
      const fallbackVisualSelections = await this.buildFallbackVisualSelections(
        request,
        requestData.existingQuestions?.length ?? 0
      );
      const fallbackVisuals = this.shouldUseVisualCatalog(request.topic)
        ? await this.resolveQuestionVisuals(request, fallbackVisualSelections)
        : [];
      const fallbackQuestion = this.generateFallbackQuestion({
        grade: request.grade,
        topic: request.topic,
        difficulty: request.difficulty,
        visuals: fallbackVisuals,
        existingQuestionCount: requestData.existingQuestions?.length ?? 0,
      });
      const fallbackExplanation = this.generateFallbackExplanation(
        fallbackQuestion.question,
        fallbackQuestion.answer
      );
      const generationTime = Date.now() - startTime;
      const latexValidation = validateLatexContent(
        `${fallbackQuestion.question} ${fallbackExplanation}`
      );

      return GeneratedQuestionSchema.parse({
        question: fallbackQuestion.question,
        answer: fallbackQuestion.answer,
        options: [],
        explanation: fallbackExplanation,
        visualSelections: fallbackVisualSelections,
        visuals: fallbackVisuals,
        metadata: {
          grade: request.grade,
          topic: request.topic,
          difficulty: request.difficulty,
          country: request.country,
          generated_by: 'deterministic-fallback',
          generation_time: generationTime,
          fallback_used: true,
          latexValid: latexValidation.isValid,
          contextBucketId: request.contextPlan?.bucketId,
          contextScenario: request.contextPlan?.scenario,
          contextualQuestion: request.contextPlan?.sentenceQuestion,
        },
      });
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
   * @param subCategory - Optional sub-category slug to scope retrieval to
   * @returns Object with example questions and duplicate detection flag
   */
  private async retrieveRAGContext(
    grade: number,
    topic: string,
    difficulty: string,
    subCategory?: string
  ): Promise<{ examples: SearchResult[]; duplicateQuestions: string[] }> {
    if (!this.semanticSearchService) {
      return { examples: [], duplicateQuestions: [] };
    }

    try {
      const searchQuery = `${topic} grade ${grade} ${difficulty} math question`;
      const pool = await this.semanticSearchService.findSimilar(searchQuery, {
        grade,
        topic: topic.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
        subCategory,
        limit: this.ragPoolSize,
      });

      if (pool.length < this.ragExampleLimit) {
        console.warn(
          `[OllamaService] RAG pool thin for ${topic}/grade ${grade}/${difficulty}: ${pool.length} indexed example(s), fewer than ragExampleLimit=${this.ragExampleLimit}`
        );
      }

      const results = this.samplePool(pool, this.ragExampleLimit);

      // Identify near-duplicate questions (similarity > threshold)
      const duplicateQuestions = results
        .filter((r) => r.similarityScore > this.ragDuplicateThreshold)
        .map((r) => r.questionText);

      console.log(
        `[OllamaService] RAG context: ${results.length} examples sampled from a pool of ${pool.length}, ${duplicateQuestions.length} near-duplicates`
      );

      if (this.ragDebugLogging) {
        console.log(
          `[OllamaService] RAG examples sampled:\n${results
            .map((r) => `  - [${r.id}] "${r.questionText}"`)
            .join('\n')}`
        );
      }

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
   * Randomly samples up to `sampleSize` items from `pool` without replacement.
   * Returns all items if the pool is smaller than the requested sample size.
   */
  private samplePool<T>(pool: T[], sampleSize: number): T[] {
    if (pool.length <= sampleSize) {
      return pool;
    }

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, sampleSize);
  }

  /**
   * Builds an explicit "SUB-CATEGORY FOCUS" instruction from the assigned
   * sub-category's name and description, so the LLM has direct generation
   * guidance for which sub-category this question belongs to — unlike the
   * RAG style-reference section, this is included even when no RAG examples
   * exist yet for the sub-category (the case most likely to otherwise
   * produce content that drifts from the intended sub-category).
   *
   * @param subCategory - The sub-category assigned to this generation call, if any
   * @returns Formatted prompt section string, or empty if no sub-category was assigned
   */
  private buildSubCategoryPromptSection(subCategory?: {
    slug: string;
    name: string;
    description?: string;
  }): string {
    if (!subCategory) return '';

    const guidance = subCategory.description
      ? `"${subCategory.name}" — ${subCategory.description}`
      : `"${subCategory.name}"`;

    return `\n\nSUB-CATEGORY FOCUS: This question must be about ${guidance}.`;
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
STYLE REFERENCE (match the tone, structure, and phrasing style of these indexed questions, but use different numbers/objects/context so it is not a duplicate):
${exampleLines}`;
  }

  /**
   * Creates enhanced curriculum-aware prompt with cultural context for AI generation.
   */
  private createEnhancedCurriculumPrompt(
    request: QuestionGenerationRequest,
    curriculumContext: {
      ageContext: string;
      complexityLevel: string;
      category?: { curriculumStrand?: string };
      skillsFocus: string[];
    },
    countryContext: ReturnType<typeof getCountryContext>
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
   * Validates that the question text does not embed a raw visual asset ID
   * (e.g. "counting.kiwi-bird.standing") in place of natural language.
   * Throws an error to trigger a retry if a leak is found.
   */
  private validateNoAssetIdLeakage(
    question: string,
    visualSelections: LLMSelectedVisual[]
  ): void {
    const leaked = visualSelections.find((selection) =>
      question.includes(selection.assetId)
    );

    if (leaked) {
      throw new Error(
        `Generated question text embeds a raw asset ID ("${leaked.assetId}") instead of natural language. Retrying.`
      );
    }
  }

  /**
   * Validates that a generated question aligns with the requested topic.
   * Detects off-topic operator usage (e.g., multiplication in a subtraction request).
   * Throws an error if the question uses a forbidden operator as the primary operation.
   */
  private validateTopicAlignment(question: string, topic: string): void {
    const topicUpper = topic.toUpperCase();

    if (this.shouldUseVisualCatalog(topicUpper)) {
      const hasVisualLanguage =
        /picture|shown|showing|visual|count|how many|are there|there are|group|objects|altogether|left|remain|join|take away|more|fewer|less|longer|shorter|heavier|lighter|compare|which|circles|squares|triangles|pattern|repeat|repeating|sequence|comes next|next shape|shape|full|empty|half|row/i.test(
          question
        );

      if (!hasVisualLanguage) {
        throw new Error(
          'Generated question does not reference the required visual representation. Retrying.'
        );
      }

      if (topicUpper.includes('PATTERN')) {
        const hasPatternLanguage =
          /pattern|repeat|repeating|sequence|comes next|next shape|shape|circle|square|triangle|diamond|full|empty|half|row/i.test(
            question
          );

        if (!hasPatternLanguage) {
          throw new Error(
            'Generated question does not match requested pattern topic. Retrying.'
          );
        }
      }

      if (topicUpper === 'COUNTING_AND_QUANTITY') {
        const hasCountingLanguage =
          /count|how many|same number|altogether|in the picture|shown/i.test(
            question
          );
        const hasPatternLanguage =
          /pattern|repeat|repeating|sequence|comes next/i.test(question);

        if (!hasCountingLanguage) {
          throw new Error(
            'Generated question does not match requested counting topic. Retrying.'
          );
        }

        if (hasPatternLanguage) {
          throw new Error(
            'Generated counting question drifted into a pattern prompt. Retrying.'
          );
        }
      }

      if (topicUpper === 'EARLY_OPERATIONS') {
        const hasGroupLanguage =
          /group|altogether|join|take away|left|remain|shown|count/i.test(
            question
          );

        if (!hasGroupLanguage) {
          throw new Error(
            'Generated question does not match requested early operations topic. Retrying.'
          );
        }
      }

      if (topicUpper === 'COMPARING_AND_MEASURING') {
        const hasComparisonLanguage =
          /more|fewer|less|longer|shorter|heavier|lighter|compare|which|same|different|how many|measure|unit/i.test(
            question
          );

        if (!hasComparisonLanguage) {
          throw new Error(
            'Generated question does not match requested comparing/measuring topic. Retrying.'
          );
        }
      }
    }

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

  private validateVisualQuestionConsistency(
    request: QuestionGenerationRequest,
    question: string,
    answer: number | string,
    visualSelections: LLMSelectedVisual[],
    visuals: GeneratedQuestion['visuals']
  ): void {
    if (!this.shouldUseVisualCatalog(request.topic)) {
      return;
    }

    if (visualSelections.length === 0 || visuals.length === 0) {
      throw new Error(
        'Generated visual-topic question is missing resolved visuals. Retrying.'
      );
    }

    // Answer-count consistency for COUNTING_AND_QUANTITY is handled by
    // normalizeVisualQuestionResponse (sets answer = visuals.length), so no
    // throw here. Log a warning if the LLM's original count was far off.
    if (
      request.topic.toUpperCase() === 'COUNTING_AND_QUANTITY' &&
      typeof answer === 'number' &&
      answer !== visuals.length
    ) {
      console.warn(
        `[OllamaService] Counting answer adjusted: LLM said ${answer}, showing ${visuals.length} objects (selections=${visualSelections.length})`
      );
    }
  }

  private getVisualTextDescriptors(assetId: string): string[] {
    const parts = assetId.toLowerCase().split('.');
    const shape = parts.at(-2);
    const state = parts.at(-1)?.replace(/-/g, ' ');

    if (!shape || !state) {
      return [];
    }

    return [`${state} ${shape}`, `${shape} ${state}`];
  }

  private normalizeVisualQuestionResponse(
    request: QuestionGenerationRequest,
    parsedQuestion: {
      question: string;
      answer: number | string;
      answerAssetId?: string;
      explanation: string;
      options?: Array<{ value: string; assetId?: string; svgPath?: string }>;
      visualSelections: LLMSelectedVisual[];
    },
    visuals: GeneratedQuestion['visuals']
  ) {
    // Keep the LLM's question text for diversity, but set the answer to the
    // actual resolved visual count so it is always truthful.
    // The LLM often miscounts in its narrative; the visuals array is ground truth.
    if (
      request.topic.toUpperCase() === 'COUNTING_AND_QUANTITY' &&
      visuals.length > 0
    ) {
      return {
        ...parsedQuestion,
        answer: visuals.length,
      };
    }
    return parsedQuestion;
  }

  /**
   * Parses AI response using Zod validation for structured output.
   */
  private parseAIResponseWithValidation(
    aiResponse: string,
    request: QuestionGenerationRequest
  ): {
    question: string;
    answer: number | string;
    answerAssetId?: string;
    explanation: string;
    options: Array<{ value: string; assetId?: string; svgPath?: string }>;
    visualSelections: LLMSelectedVisual[];
  } {
    // First try structured parsing with Zod validation
    const structured = parseLLMResponse(aiResponse);
    if (structured) {
      return {
        question: this.normalizeLatexDelimiters(
          this.formatQuestionForMath(structured.question, request.topic)
        ),
        answer: structured.answer,
        answerAssetId: structured.answerAssetId,
        explanation: this.stripLatex(structured.explanation),
        options: (structured.options ?? []).reduce<
          Array<{ value: string; assetId?: string; svgPath?: string }>
        >((acc, option) => {
          if (typeof option === 'string') {
            acc.push({ value: option });
            return acc;
          }

          if (!option?.value) {
            return acc;
          }

          acc.push({
            value: option.value,
            assetId: option.assetId,
            svgPath: option.svgPath,
          });

          return acc;
        }, []),
        visualSelections:
          structured.visualSelections?.length > 0
            ? structured.visualSelections
            : structured.visuals ?? [],
      };
    }

    // Fallback to regex parsing with validation
    const questionMatch = aiResponse.match(
      /QUESTION:\s*([\s\S]+?)(?=\nANSWER:|$)/
    );
    const answerMatch = aiResponse.match(/ANSWER:\s*(.+?)(?=\n[A-Z_]+:|$)/);
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
    const rawAnswer = answerMatch[1].trim();
    const answer = /^-?\d+(?:\.\d+)?$/.test(rawAnswer)
      ? Number(rawAnswer)
      : rawAnswer.replace(/^"|"$/g, '');
    const explanation = explanationMatch?.[1]?.trim() || 'Solve step by step.';

    // Ensure question contains proper math format
    question = this.formatQuestionForMath(question, request.topic);

    return {
      question: this.normalizeLatexDelimiters(question),
      answer,
      explanation: this.stripLatex(explanation),
      options: [],
      visualSelections: [],
    };
  }

  private async getVisualCatalogForRequest(request: QuestionGenerationRequest) {
    if (!this.visualAssetRegistryService) {
      return [];
    }

    if (!this.shouldUseVisualCatalog(request.topic)) {
      return [];
    }

    return this.visualAssetRegistryService.getGenerationCatalog({
      grade: request.grade,
      topic: request.topic,
    });
  }

  private async resolveQuestionVisuals(
    request: QuestionGenerationRequest,
    selectedVisuals: LLMSelectedVisual[]
  ) {
    if (!this.visualAssetRegistryService) {
      return [];
    }

    return this.visualAssetRegistryService.resolveSelectedVisuals(
      {
        grade: request.grade,
        topic: request.topic,
      },
      selectedVisuals
    );
  }

  private toVisualSelections(visuals: GeneratedQuestion['visuals']) {
    return (visuals ?? []).flatMap((visual) => {
      if (!visual.assetId || !visual.role) {
        return [];
      }

      return [
        {
          assetId: visual.assetId,
          role: visual.role,
          placement: visual.placement,
        },
      ];
    });
  }

  private async getDefaultPatternVisuals(request: QuestionGenerationRequest) {
    if (!this.visualAssetRegistryService) {
      return [];
    }

    return this.visualAssetRegistryService.getDefaultVisualsForTopic({
      grade: request.grade,
      topic: request.topic,
    });
  }

  private async buildFallbackVisualSelections(
    request: QuestionGenerationRequest,
    existingQuestionCount = 0
  ): Promise<LLMSelectedVisual[]> {
    if (!this.shouldUseVisualCatalog(request.topic)) {
      return [];
    }

    const defaultVisuals = await this.getDefaultPatternVisuals(request);
    const defaultSelections = this.toVisualSelections(defaultVisuals);
    const topicUpper = request.topic.toUpperCase();

    if (
      topicUpper === 'COUNTING_AND_QUANTITY' &&
      defaultSelections.length > 0
    ) {
      const targetLength =
        request.grade <= 1 ? 4 + (existingQuestionCount % 3) : 6;

      return Array.from({ length: targetLength }, (_, index) => {
        const selection =
          defaultSelections[
            (index + existingQuestionCount) % defaultSelections.length
          ];
        return {
          assetId: selection.assetId,
          role: selection.role,
          placement: 'before-question' as const,
        };
      });
    }

    return defaultSelections;
  }

  private shouldUseVisualCatalog(topic: string): boolean {
    const normalizedTopic = topic.toUpperCase();

    return (
      normalizedTopic === 'COUNTING_AND_QUANTITY' ||
      normalizedTopic === 'EARLY_OPERATIONS' ||
      normalizedTopic === 'COMPARING_AND_MEASURING' ||
      normalizedTopic === 'PATTERN_RECOGNITION' ||
      normalizedTopic.includes('PATTERN')
    );
  }

  private buildVisualCatalogPromptSection(
    topic: string,
    visualCatalog: Awaited<ReturnType<typeof this.getVisualCatalogForRequest>>
  ): string {
    const topicUpper = topic.toUpperCase();
    const catalogEntries = visualCatalog
      .map(
        (asset) =>
          `- ${asset.assetId}: ${asset.displayName} | semanticText=${
            asset.semanticText
          } | roles=${asset.roles.join(
            ', '
          )} | categories=${asset.categories.join(', ')}`
      )
      .join('\n');

    const styleGuidance = `If a REFERENCE EXAMPLES section is provided later in this prompt, derive the question's phrasing and narrative style from those examples. Only use the fallback wording below when no REFERENCE EXAMPLES section is provided.`;

    const topicRules =
      topicUpper === 'COUNTING_AND_QUANTITY'
        ? `Use these approved SVG assets as the visible objects the student counts.
${styleGuidance}
Fallback (no reference examples): ask generically what quantity is shown — do NOT embed specific counts in the question text.
Do NOT invent unseen scenes or use assets not in the catalog below.

CRITICAL JSON RULES:
- The "answer" value MUST equal the EXACT number of entries in "visualSelections" (one entry = one object shown on screen).
- To show multiple copies of the same object, repeat its assetId. Example — to show 3 kiwi birds:
  [{"assetId": "counting.kiwi-bird.standing", "role": "inline-symbol"},
   {"assetId": "counting.kiwi-bird.standing", "role": "inline-symbol"},
   {"assetId": "counting.kiwi-bird.standing", "role": "inline-symbol"}]
- Use ONLY role "inline-symbol" for every counting visual entry. Never use "answer-option" or "prompt-illustration".
- For easy difficulty: include exactly 2–5 total entries; for medium: 5–8; for hard: 8–12.
- "visualSelections" MUST NOT be empty.`
        : topicUpper === 'EARLY_OPERATIONS'
        ? `Use these approved SVG assets as the visible objects the student joins or takes away.
The question MUST describe what is shown — do NOT invent a scene that contradicts the visuals.

CRITICAL JSON RULES:
- Each entry in "visualSelections" represents ONE visible object on screen.
- To show a group, repeat the assetId. Example — joining 3 apples and 2 bananas:
  [{"assetId": "counting.apple.red", "role": "inline-symbol"},
   {"assetId": "counting.apple.red", "role": "inline-symbol"},
   {"assetId": "counting.apple.red", "role": "inline-symbol"},
   {"assetId": "counting.banana.yellow", "role": "inline-symbol"},
   {"assetId": "counting.banana.yellow", "role": "inline-symbol"}]
- For joining (addition): total "visualSelections" entries MUST equal the answer.
- For taking-away (subtraction): show only the starting group; "answer" is the count remaining after removal.
- Use ONLY role "inline-symbol" for every entry. Never use "answer-option" or "prompt-illustration".
- Include 2–8 total entries for easy/medium; up to 12 for hard.
- "visualSelections" MUST NOT be empty.`
        : topicUpper === 'COMPARING_AND_MEASURING'
        ? `Use these approved SVG assets to show the objects being compared or measured.

QUESTION TYPES you can generate:
1. Compare two groups: Show Group A (repeat one assetId N times) then Group B (repeat another assetId M times).
   - The question should ask which group has more/fewer, or how many more/less.
   - Example — 3 apples vs 5 oranges:
     [{"assetId": "counting.apple.red", "role": "inline-symbol"},
      {"assetId": "counting.apple.red", "role": "inline-symbol"},
      {"assetId": "counting.apple.red", "role": "inline-symbol"},
      {"assetId": "counting.orange.fruit", "role": "inline-symbol"},
      {"assetId": "counting.orange.fruit", "role": "inline-symbol"},
      {"assetId": "counting.orange.fruit", "role": "inline-symbol"},
      {"assetId": "counting.orange.fruit", "role": "inline-symbol"},
      {"assetId": "counting.orange.fruit", "role": "inline-symbol"}]
   - Answer: the count of the larger group, or the difference between the two groups.
2. Informal measurement: Show a row of unit objects (measurement.paperclip.unit, measurement.cube.unit, etc.).
   - Answer: the count of units shown.

CRITICAL JSON RULES:
- Each entry in "visualSelections" represents ONE visible object on screen.
- To show a group, repeat the assetId.
- Use ONLY role "inline-symbol" for every entry. Never use "answer-option" or "prompt-illustration".
- Show between 4 and 12 total entries across both groups.
- "visualSelections" MUST NOT be empty.
- Do NOT invent assetIds (like "kiwi-feathers", "crayon-box", "skis-01"). Use ONLY catalog assets below.

CRITICAL QUESTION TEXT RULES:
${styleGuidance}
- Fallback (no reference examples): the question text must describe the objects shown and ask which group has more/fewer or how many units are shown.
- Do NOT reference objects or scenes that are not in the catalog.`
        : topicUpper === 'EARLY_PATTERNING'
        ? `Use these approved SVG assets to show the repeating pattern sequence.
${styleGuidance}
Each entry in "visualSelections" represents ONE shape in the sequence, listed in display order.

CRITICAL JSON RULES:
- Repeat assetIds to build the pattern. Example — an AB pattern of 4 elements:
  [{"assetId": "pattern.circle.full", "role": "inline-symbol"},
   {"assetId": "pattern.square.full", "role": "inline-symbol"},
   {"assetId": "pattern.circle.full", "role": "inline-symbol"},
   {"assetId": "pattern.square.full", "role": "inline-symbol"}]
- Use role "inline-symbol" for every element shown in the sequence.
- Show between 4 and 6 elements so the student can see the pattern clearly (do NOT stop at 2).
- The "answer" should be the visual description of the shape that comes next (e.g. "full circle", "empty square").
- "visualSelections" MUST NOT be empty.

CRITICAL QUESTION TEXT RULES:
- Fallback (no reference examples): keep the question text short and ask what shape comes next in the pattern; do NOT list or spell out the individual shapes in the question text.
- The student sees the SVG shapes directly; the question only needs to ask what comes next.
- The shapes ARE geometric (circle, square, triangle). If you must name a shape, use ONLY its correct geometric name matching the assetId (e.g. pattern.circle.full → "full circle").`
        : `Use only these approved SVG assets to show the pattern sequence.
Each "visualSelections" entry represents ONE shape in the sequence. Repeat assetIds to build the repeating pattern.
You MUST include between 4 and 8 entries so the pattern is visible. The JSON "visualSelections" array must not be empty.
Use role "inline-symbol" for sequence shapes.
Return the visualSelections in display order.`;

    return `\n\nAPPROVED VISUAL ASSET CATALOG:
${topicRules}
Do not invent asset IDs, do not output raw SVG, and do not choose assets outside this list.
Do NOT embed asset IDs (e.g. "counting.apple.red") in the question text. Follow the per-topic count limits above.

AVAILABLE VISUALS:
${catalogEntries}`;
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
    } catch {
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
      const analysis = this.analyzeExplanation(explanation);

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
    } catch {
      // Fallback to simple deterministic explanation
      const generationTime = Date.now() - startTime;
      const fallbackExplanation = this.generateFallbackExplanation(
        requestData.question,
        requestData.answer
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
    gradePatterns: ReturnType<typeof getGradePatterns>,
    countryContext: ReturnType<typeof getCountryContext>
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
  private analyzeExplanation(explanation: string): {
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
    answer: number
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

  private generateFallbackQuestion(request: {
    grade: number;
    topic: string;
    difficulty: string;
    visuals?: GeneratedQuestion['visuals'];
    existingQuestionCount?: number;
  }): {
    question: string;
    answer: number;
  } {
    const topicUpper = request.topic.toUpperCase();

    if (topicUpper === 'COUNTING_AND_QUANTITY' && request.visuals?.length) {
      const variants = [
        'Look at the shapes shown. How many shapes are there altogether?',
        'Count the shapes shown. How many are there altogether?',
        'How many shapes can you see in the picture?',
        'Look at the picture. How many shapes are shown?',
        'Count all the shapes you can see. How many are there?',
        'How many shapes are shown in this picture?',
      ];
      return {
        question:
          variants[(request.existingQuestionCount ?? 0) % variants.length],
        answer: request.visuals.length,
      };
    }

    if (this.shouldUseVisualCatalog(topicUpper)) {
      if (topicUpper.includes('PATTERN')) {
        return {
          question:
            'Look at the shapes shown. How many shapes are in the repeating part?',
          answer: request.grade <= 1 ? 2 : 3,
        };
      }

      if (topicUpper === 'EARLY_OPERATIONS') {
        return {
          question:
            'Look at the groups shown. How many shapes are there altogether?',
          answer: request.grade <= 1 ? 2 : 3,
        };
      }

      if (request.grade <= 1) {
        return {
          question: 'Look at the shapes shown. How many shapes are there?',
          answer: 2,
        };
      }

      return {
        question: 'Look at the shapes shown. How many shapes are there?',
        answer: 3,
      };
    }

    if (topicUpper.includes('SUBTRACTION')) {
      const minuend = 12;
      const subtrahend = 5;
      return {
        question: `$${minuend} - ${subtrahend} = ?$`,
        answer: minuend - subtrahend,
      };
    }

    if (topicUpper.includes('MULTIPLICATION')) {
      const factor1 = 3;
      const factor2 = 4;
      return {
        question: `$${factor1} \\times ${factor2} = ?$`,
        answer: factor1 * factor2,
      };
    }

    if (topicUpper.includes('DIVISION')) {
      const dividend = 12;
      const divisor = 3;
      return {
        question: `$${dividend} \\div ${divisor} = ?$`,
        answer: dividend / divisor,
      };
    }

    const addend1 = 7;
    const addend2 = 5;
    return {
      question: `$${addend1} + ${addend2} = ?$`,
      answer: addend1 + addend2,
    };
  }
}
