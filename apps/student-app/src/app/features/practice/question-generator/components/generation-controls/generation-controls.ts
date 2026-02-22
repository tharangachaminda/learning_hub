import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenerationParams } from '../../models/generation-params.model';
import {
  GRADE_TOPICS,
  QUESTION_TYPE_DISPLAY_NAMES,
  SUPPORTED_GRADES,
} from '../../models/curriculum.data';

/**
 * Presentation component for the AI Question Generator controls (Phase 1).
 *
 * Renders grade/topic dropdowns, difficulty toggle,
 * question count slider, and generate button. Emits a `generate`
 * event with the collected parameters.
 *
 * @example
 * ```html
 * <app-generation-controls
 *   [grade]="3"
 *   [country]="'NZ'"
 *   [isGenerating]="false"
 *   [serviceHealthy]="true"
 *   (generate)="onGenerate($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-generation-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generation-controls.html',
  styleUrl: './generation-controls.css',
})
export class GenerationControlsComponent implements OnInit, OnChanges {
  /** Pre-filled grade from student profile. */
  @Input() grade = 3;

  /** Country code from student profile (hidden). */
  @Input() country = 'NZ';

  /** Whether generation is in progress. */
  @Input() isGenerating = false;

  /** Whether the backend service is healthy. */
  @Input() serviceHealthy = true;

  /** Optional topic key from URL to pre-select (e.g. 'ADDITION'). */
  @Input() initialTopic = '';

  /** Emits generation parameters when Generate is clicked. */
  @Output() generate = new EventEmitter<GenerationParams>();

  /** Curriculum data references. */
  readonly supportedGrades = SUPPORTED_GRADES;
  readonly displayNames = QUESTION_TYPE_DISPLAY_NAMES;

  /** Selected values. */
  selectedGrade = signal<number>(3);
  selectedDifficulty = signal<'easy' | 'medium' | 'hard'>('easy');
  selectedCount = signal<number>(10);

  /** Topics filtered by selected grade. */
  availableTopics = computed(() => {
    const grade = this.selectedGrade();
    const topics = GRADE_TOPICS[grade]?.['mathematics'] ?? [];
    return topics;
  });

  /** Currently selected topic key. */
  selectedTopic = signal<string>('');

  ngOnInit(): void {
    this.selectedGrade.set(this.grade);
    this.applyInitialTopicOrFirst();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grade'] && !changes['grade'].firstChange) {
      this.selectedGrade.set(this.grade);
      this.updateTopicToFirst();
    }
    if (changes['initialTopic'] && !changes['initialTopic'].firstChange) {
      this.applyInitialTopicOrFirst();
    }
  }

  /**
   * Handles grade dropdown change. Resets topic to first available.
   *
   * @param grade - The newly selected grade number
   */
  onGradeChange(grade: number): void {
    this.selectedGrade.set(grade);
    this.updateTopicToFirst();
  }

  /**
   * Handles topic dropdown change.
   *
   * @param topic - The newly selected topic key
   */
  onTopicChange(topic: string): void {
    this.selectedTopic.set(topic);
  }

  /**
   * Handles difficulty toggle selection.
   *
   * @param difficulty - The selected difficulty level
   */
  onDifficultySelect(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.selectedDifficulty.set(difficulty);
  }

  /**
   * Handles count slider change.
   *
   * @param count - The new question count value
   */
  onCountChange(count: number): void {
    this.selectedCount.set(count);
  }

  /**
   * Emits the generate event with collected parameters.
   */
  onGenerateClick(): void {
    if (!this.selectedTopic()) return;

    const params: GenerationParams = {
      grade: this.selectedGrade(),
      topic: this.selectedTopic(),
      difficulty: this.selectedDifficulty(),
      count: this.selectedCount(),
      country: this.country || 'NZ',
    };
    this.generate.emit(params);
  }

  /**
   * Returns the display name for a topic key.
   *
   * @param topicKey - The topic key (e.g. 'ADDITION')
   * @returns Human-readable display name
   */
  getTopicDisplayName(topicKey: string): string {
    return this.displayNames[topicKey] ?? topicKey;
  }

  /**
   * Whether the generate button should be enabled.
   *
   * @returns true if a topic is selected and not generating
   */
  canGenerate(): boolean {
    return !!this.selectedTopic() && !this.isGenerating && this.serviceHealthy;
  }

  /**
   * Resets selected topic to the first available topic for the current grade.
   */
  private updateTopicToFirst(): void {
    const topics = this.availableTopics();
    this.selectedTopic.set(topics.length > 0 ? topics[0] : '');
  }

  /**
   * Sets the selected topic to initialTopic if it exists in the
   * available topics for the current grade; otherwise falls back
   * to the first available topic.
   */
  private applyInitialTopicOrFirst(): void {
    const topics = this.availableTopics();
    if (this.initialTopic && topics.includes(this.initialTopic)) {
      this.selectedTopic.set(this.initialTopic);
    } else {
      this.updateTopicToFirst();
    }
  }
}
