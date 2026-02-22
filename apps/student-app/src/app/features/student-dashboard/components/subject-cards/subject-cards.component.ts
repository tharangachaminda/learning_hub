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
import { SubjectProgress } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-subject-cards',
  standalone: true,
  imports: [],
  templateUrl: './subject-cards.component.html',
  styleUrls: ['./subject-cards.component.scss'],
})
export class SubjectCardsComponent {
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
}
