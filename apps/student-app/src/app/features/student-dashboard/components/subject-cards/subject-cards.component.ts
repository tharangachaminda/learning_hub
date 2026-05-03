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

interface SubjectTone {
  accent: string;
  accentStrong: string;
  background: string;
  border: string;
}

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

  getSubjectTone(subject: SubjectProgress): SubjectTone {
    const normalized =
      `${subject.subject} ${subject.displayName}`.toLowerCase();

    if (normalized.includes('shape') || normalized.includes('geometry')) {
      return {
        accent: '#805ad5',
        accentStrong: '#6b46c1',
        background: 'rgba(128, 90, 213, 0.12)',
        border: 'rgba(128, 90, 213, 0.28)',
      };
    }

    if (normalized.includes('time')) {
      return {
        accent: '#dd6b20',
        accentStrong: '#c05621',
        background: 'rgba(221, 107, 32, 0.12)',
        border: 'rgba(221, 107, 32, 0.28)',
      };
    }

    if (
      normalized.includes('data') ||
      normalized.includes('chart') ||
      normalized.includes('probability')
    ) {
      return {
        accent: '#2b6cb0',
        accentStrong: '#1f4f82',
        background: 'rgba(43, 108, 176, 0.12)',
        border: 'rgba(43, 108, 176, 0.28)',
      };
    }

    return {
      accent: '#5c9d6a',
      accentStrong: '#467b52',
      background: 'rgba(92, 157, 106, 0.12)',
      border: 'rgba(92, 157, 106, 0.28)',
    };
  }
}
