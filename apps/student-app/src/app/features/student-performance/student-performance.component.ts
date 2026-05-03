import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PerformanceService } from '../../services/performance.service';
import {
  DailyProgressSummary,
  WeeklyProgressSummary,
} from '../../models/performance.model';
import { SubjectProgress } from '../../models/dashboard.model';

@Component({
  selector: 'app-student-performance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-performance.component.html',
  styleUrl: './student-performance.component.scss',
})
export class StudentPerformanceComponent implements OnInit {
  dailyProgress: DailyProgressSummary | null = null;
  weeklyProgress: WeeklyProgressSummary | null = null;
  subjects: SubjectProgress[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.loadPerformance();
  }

  loadPerformance(): void {
    const studentId = this.authService.getUserId();
    if (!studentId) {
      this.error =
        'We could not find your student session. Please sign in again.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    forkJoin({
      dailyProgress: this.performanceService.getDailyProgress(studentId),
      weeklyProgress: this.performanceService.getWeeklyProgress(studentId),
      subjects: this.performanceService.getSubjectSummary(studentId),
    }).subscribe({
      next: ({ dailyProgress, weeklyProgress, subjects }) => {
        this.dailyProgress = dailyProgress;
        this.weeklyProgress = weeklyProgress;
        this.subjects = subjects;
        this.loading = false;
      },
      error: () => {
        this.error =
          'Performance data is not available right now. Please try again shortly.';
        this.loading = false;
      },
    });
  }

  getDailyAccuracyWidth(day: DailyProgressSummary): number {
    if (day.accuracyPercentage <= 0) {
      return 0;
    }

    return Math.max(8, day.accuracyPercentage);
  }

  trackByDate(_: number, day: DailyProgressSummary): string {
    return day.date;
  }

  trackBySubject(_: number, subject: SubjectProgress): string {
    return subject.subject;
  }
}
