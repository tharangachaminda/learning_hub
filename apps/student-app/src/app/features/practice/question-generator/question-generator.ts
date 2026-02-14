import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionGeneratorService } from './services/question-generator.service';
import { StudentProfileService } from './services/student-profile.service';
import { GenerationControlsComponent } from './components/generation-controls/generation-controls';
import { QuestionCardComponent } from './components/question-card/question-card';
import { QuestionPaginationComponent } from './components/question-pagination/question-pagination';
import { GeneratedQuestion } from './models/question.model';
import { GenerationParams } from './models/generation-params.model';
import { StudentAnswer } from './models/student-answer.model';
import { generateDistractors } from './utils/distractor-generator';

/**
 * Smart container component for the AI Question Generator feature.
 *
 * Orchestrates Phase 1 (generation controls) → Phase 2 (questions)
 * flow, manages signal-based state, runs health check on init,
 * and delegates API calls to QuestionGeneratorService.
 *
 * @example
 * ```html
 * <app-question-generator></app-question-generator>
 * ```
 */
@Component({
  selector: 'app-question-generator',
  standalone: true,
  imports: [
    CommonModule,
    GenerationControlsComponent,
    QuestionCardComponent,
    QuestionPaginationComponent,
  ],
  templateUrl: './question-generator.html',
  styleUrl: './question-generator.css',
})
export class QuestionGeneratorComponent implements OnInit {
  private readonly generatorService = inject(QuestionGeneratorService);
  private readonly profileService = inject(StudentProfileService);

  /** Current phase of the question generator flow. */
  phase = signal<'controls' | 'questions' | 'results'>('controls');

  /** Whether question generation API call is in progress. */
  isGenerating = signal<boolean>(false);

  /** Whether the backend service is healthy and available. */
  serviceHealthy = signal<boolean>(true);

  /** Parameters collected from generation controls. */
  generationParams = signal<GenerationParams | null>(null);

  /** Generated questions returned from the API. */
  questions = signal<GeneratedQuestion[]>([]);

  /** Whether the API returned an error. */
  errorState = signal<boolean>(false);

  /** Whether the API returned 0 questions. */
  emptyState = signal<boolean>(false);

  /** 0-based index of the currently displayed question in Phase 2. */
  currentIndex = signal<number>(0);

  /** Map of student answers keyed by question index. */
  answers = signal<Map<number, StudentAnswer>>(new Map());

  /** Timestamp when the question session began. */
  sessionStartTime = signal<number>(0);

  /** Timestamp when the current question started being viewed. */
  questionStartTime = signal<number>(0);

  /** The currently displayed question derived from questions and currentIndex. */
  currentQuestion = computed(() => this.questions()[this.currentIndex()]);

  /** Progress percentage through the question set (0–100). */
  progressPercent = computed(() => {
    const total = this.questions().length;
    return total > 0 ? ((this.currentIndex() + 1) / total) * 100 : 0;
  });

  /** Number of questions the student has answered so far. */
  totalAnswered = computed(() => this.answers().size);

  /** The current answer for the active question, if one exists. */
  currentAnswer = computed(() => this.answers().get(this.currentIndex()));

  /** Pre-generated multiple-choice options per question index. */
  questionOptions = signal<Map<number, string[]>>(new Map());

  /** Options for the currently displayed question (empty if open-ended). */
  currentOptions = computed(() => this.questionOptions().get(this.currentIndex()) ?? []);

  /** Student profile grade (pre-filled for controls). */
  profileGrade = computed(() => this.profileService.getGrade());

  /** Student profile country (hidden, sent in API). */
  profileCountry = computed(() => this.profileService.getCountry());

  /**
   * Runs the health check on component initialisation.
   */
  ngOnInit(): void {
    this.checkServiceHealth();
  }

  /**
   * Calls the backend health endpoint and updates serviceHealthy signal.
   */
  private checkServiceHealth(): void {
    this.generatorService.checkHealth().subscribe({
      next: () => this.serviceHealthy.set(true),
      error: () => this.serviceHealthy.set(false),
    });
  }

  /**
   * Handles the generate event emitted by the generation controls.
   *
   * @param params - The generation parameters from the controls form
   */
  onGenerate(params: GenerationParams): void {
    this.isGenerating.set(true);
    this.errorState.set(false);
    this.emptyState.set(false);
    this.generationParams.set(params);

    const difficultyParam = `grade_${params.grade}`;
    const typeParam = params.topic.toLowerCase();

    this.generatorService
      .generateQuestions(difficultyParam, params.count, typeParam)
      .subscribe({
        next: (rawQuestions) => {
          const questions = this.mapApiResponse(rawQuestions, params);
          this.questions.set(questions);
          this.isGenerating.set(false);
          if (questions.length > 0) {
            this.generateOptionsForQuestions(questions, params.answerType ?? 'multiple-choice');
            this.phase.set('questions');
            this.sessionStartTime.set(Date.now());
            this.questionStartTime.set(Date.now());
          } else {
            this.emptyState.set(true);
          }
        },
        error: () => {
          this.isGenerating.set(false);
          this.errorState.set(true);
        },
      });
  }

  /**
   * Retries the last generation request after an error.
   */
  onRetry(): void {
    this.errorState.set(false);
    const params = this.generationParams();
    if (params) {
      this.onGenerate(params);
    }
  }

  /**
   * Navigates to the next question if not already on the last one.
   * Records time spent on the current question before navigating.
   */
  goToNext(): void {
    const maxIndex = this.questions().length - 1;
    if (this.currentIndex() < maxIndex) {
      this.recordTimeSpent();
      this.currentIndex.update((i) => i + 1);
      this.questionStartTime.set(Date.now());
    }
  }

  /**
   * Navigates to the previous question if not already on the first one.
   * Records time spent on the current question before navigating.
   */
  goToPrevious(): void {
    if (this.currentIndex() > 0) {
      this.recordTimeSpent();
      this.currentIndex.update((i) => i - 1);
      this.questionStartTime.set(Date.now());
    }
  }

  /**
   * Handles a student selecting a multiple-choice option.
   * Creates or updates the StudentAnswer for the current question index.
   *
   * @param option - The selected option letter ('A'|'B'|'C'|'D')
   */
  onOptionSelected(option: string): void {
    this.updateAnswer({ selectedOption: option });
  }

  /**
   * Handles a student changing the additional notes text.
   * Creates or updates the StudentAnswer for the current question index.
   *
   * @param notes - The notes text entered by the student
   */
  onNotesChanged(notes: string): void {
    this.updateAnswer({ additionalNotes: notes });
  }

  /**
   * Handles a student toggling the hint panel.
   * Persists the hint-used state in the current answer.
   *
   * @param expanded - Whether the hint is now expanded
   */
  onHintToggled(expanded: boolean): void {
    this.updateAnswer({ hintUsed: expanded });
  }

  /**
   * Records time spent on the current question since the last start time.
   * Accumulates time across multiple visits to the same question.
   */
  private recordTimeSpent(): void {
    const startTime = this.questionStartTime();
    if (startTime > 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const idx = this.currentIndex();
      const current = this.answers().get(idx);
      const previousTime = current?.timeSpent ?? 0;
      this.updateAnswer({ timeSpent: previousTime + elapsed });
    }
  }

  /**
   * Pre-generates multiple-choice options for all questions.
   * Options are generated once per session and stored by index
   * so they remain stable across navigation.
   *
   * @param questions - The mapped GeneratedQuestion array
   * @param answerType - The answer display type ('multiple-choice' | 'open-ended')
   */
  private generateOptionsForQuestions(
    questions: GeneratedQuestion[],
    answerType: string
  ): void {
    if (answerType !== 'multiple-choice') {
      this.questionOptions.set(new Map());
      return;
    }

    const optionsMap = new Map<number, string[]>();
    questions.forEach((q, index) => {
      optionsMap.set(index, generateDistractors(q.answer));
    });
    this.questionOptions.set(optionsMap);
  }

  /**
   * Maps raw API responses (MathQuestion shape) into the GeneratedQuestion
   * format expected by presentation components.
   *
   * The backend returns { question, answer, operation, difficulty, stepByStepSolution }
   * but the frontend needs { question, answer, explanation, metadata }.
   *
   * @param rawQuestions - Raw response array from the math-questions API
   * @param params - The generation parameters used for the request
   * @returns Array of GeneratedQuestion objects with proper metadata
   */
  private mapApiResponse(
    rawQuestions: GeneratedQuestion[],
    params: GenerationParams
  ): GeneratedQuestion[] {
    return rawQuestions.map((raw: any) => {
      // If already in GeneratedQuestion format (has metadata), pass through
      if (raw.metadata) {
        return raw as GeneratedQuestion;
      }

      // Map MathQuestion API shape → GeneratedQuestion
      return {
        question: raw.question,
        answer: raw.answer,
        explanation:
          raw.stepByStepSolution?.join(' ') ||
          raw.explanation ||
          'Think about the problem step by step.',
        metadata: {
          grade: params.grade,
          topic: params.topic,
          difficulty: params.difficulty,
          country: params.country,
          generated_by: raw.operation || 'deterministic',
          generation_time: 0,
        },
      };
    });
  }

  /**
   * Merges partial answer data into the current question's StudentAnswer.
   * Creates a new entry if one doesn't exist yet.
   *
   * @param partial - Partial StudentAnswer fields to merge
   */
  private updateAnswer(partial: Partial<StudentAnswer>): void {
    const idx = this.currentIndex();
    const current = this.answers().get(idx);
    const updated: StudentAnswer = {
      questionIndex: idx,
      hintUsed: current?.hintUsed ?? false,
      timeSpent: current?.timeSpent ?? 0,
      ...current,
      ...partial,
    };
    const newMap = new Map(this.answers());
    newMap.set(idx, updated);
    this.answers.set(newMap);
  }
}
