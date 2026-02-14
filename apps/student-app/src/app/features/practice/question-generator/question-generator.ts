import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionGeneratorService } from './services/question-generator.service';
import { StudentProfileService } from './services/student-profile.service';
import { GenerationControlsComponent } from './components/generation-controls/generation-controls';
import { GeneratedQuestion } from './models/question.model';
import { GenerationParams } from './models/generation-params.model';

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
  imports: [CommonModule, GenerationControlsComponent],
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
        next: (questions) => {
          this.questions.set(questions);
          this.isGenerating.set(false);
          if (questions.length > 0) {
            this.phase.set('questions');
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
}
