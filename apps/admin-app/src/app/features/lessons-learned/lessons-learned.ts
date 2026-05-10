import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  LessonLearned,
  GradeInfo,
} from '../../services/auth.service';

@Component({
  selector: 'app-lessons-learned',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lessons-learned.html',
  styleUrl: './lessons-learned.scss',
})
export class LessonsLearnedComponent implements OnInit {
  lessons: LessonLearned[] = [];
  grades: GradeInfo[] = [];
  isLoading = true;
  error: string | null = null;
  success: string | null = null;

  filterGrade: number | null = null;
  filterTopic = '';
  filterCategory = '';

  actionInProgress: string | null = null;

  readonly categories = [
    'calculation-error',
    'conceptual-error',
    'formatting-issue',
    'difficulty-mismatch',
    'curriculum-mismatch',
    'ambiguous-wording',
    'incorrect-options',
    'missing-steps',
    'other',
  ];

  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.getCurriculum().subscribe({
      next: (data) => (this.grades = data.grades),
      error: () => {
        /* ignored */
      },
    });
    this.loadLessons();
  }

  loadLessons(): void {
    this.isLoading = true;
    this.error = null;
    const filters: Record<string, string | number> = {};
    if (this.filterGrade !== null) filters['grade'] = this.filterGrade;
    if (this.filterTopic) filters['topic'] = this.filterTopic;
    if (this.filterCategory) filters['category'] = this.filterCategory;

    this.authService.getLessonsLearned(filters).subscribe({
      next: (data) => {
        this.lessons = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load lessons learned.';
        this.isLoading = false;
      },
    });
  }

  get filteredTopics() {
    if (this.filterGrade === null) return [];
    const grade = this.grades.find((g) => g.grade === this.filterGrade);
    return grade?.topics ?? [];
  }

  onFilterChange(): void {
    this.loadLessons();
  }

  onGradeFilterChange(): void {
    this.filterTopic = '';
    this.onFilterChange();
  }

  toggleActive(lesson: LessonLearned): void {
    this.actionInProgress = lesson._id;
    this.authService
      .toggleLessonLearned(lesson._id, !lesson.isActive)
      .subscribe({
        next: () => {
          lesson.isActive = !lesson.isActive;
          this.actionInProgress = null;
        },
        error: () => {
          this.error = 'Failed to update lesson.';
          this.actionInProgress = null;
        },
      });
  }

  deleteLesson(id: string): void {
    this.actionInProgress = id;
    this.authService.deleteLessonLearned(id).subscribe({
      next: () => {
        this.actionInProgress = null;
        this.success = 'Lesson deleted.';
        this.loadLessons();
      },
      error: () => {
        this.error = 'Failed to delete lesson.';
        this.actionInProgress = null;
      },
    });
  }
}
