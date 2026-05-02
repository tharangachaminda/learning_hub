/**
 * Subject Cards Component
 *
 * Displays available subjects with progress indicators showing
 * mastery percentage, questions answered, and last practiced date.
 *
 * Implements:
 * - AC8: Subject cards with progress indicators (initially Mathematics)
 * - AC25: Screen reader compatible with ARIA labels
 *
 * @example
 * ```html
 * <app-subject-cards
 *   [subjects]="dashboardData.subjects">
 * </app-subject-cards>
 * ```
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faCalculator,
  faChartColumn,
  faClock,
  faShapes,
} from '@fortawesome/free-solid-svg-icons';
import { SubjectProgress } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-subject-cards',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './subject-cards.component.html',
  styleUrls: ['./subject-cards.component.scss'],
})
export class SubjectCardsComponent {
  protected readonly bookIcon = faCalculator;
  protected readonly arrowIcon = faArrowRight;

  /** List of subjects with progress data. */
  @Input() subjects: SubjectProgress[] = [];

  /** Emitted when the student clicks a subject card to start practising. */
  @Output() practiceSubject = new EventEmitter<SubjectProgress>();

  /**
   * Handle a subject card click.
   *
   * @param subject - The subject the student wants to practise
   */
  onSubjectClick(subject: SubjectProgress): void {
    this.practiceSubject.emit(subject);
  }

  getSubjectIcon(subject: SubjectProgress): IconDefinition {
    const normalized =
      `${subject.subject} ${subject.displayName}`.toLowerCase();

    if (normalized.includes('shape') || normalized.includes('geometry')) {
      return faShapes;
    }

    if (normalized.includes('time')) {
      return faClock;
    }

    if (
      normalized.includes('data') ||
      normalized.includes('chart') ||
      normalized.includes('probability')
    ) {
      return faChartColumn;
    }

    return faCalculator;
  }
}
