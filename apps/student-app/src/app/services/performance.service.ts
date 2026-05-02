import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DailyProgressSummary,
  WeeklyProgressSummary,
} from '../models/performance.model';
import { SubjectProgress } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private readonly studentApiUrl = '/api/students';
  private readonly progressApiUrl = '/api/progress';

  constructor(private readonly http: HttpClient) {}

  getDailyProgress(studentId: string): Observable<DailyProgressSummary> {
    return this.http.get<DailyProgressSummary>(
      `${this.progressApiUrl}/daily/${studentId}`
    );
  }

  getWeeklyProgress(studentId: string): Observable<WeeklyProgressSummary> {
    return this.http.get<WeeklyProgressSummary>(
      `${this.progressApiUrl}/weekly/${studentId}`
    );
  }

  getSubjectSummary(studentId: string): Observable<SubjectProgress[]> {
    return this.http.get<SubjectProgress[]>(
      `${this.studentApiUrl}/${studentId}/progress/summary`
    );
  }
}
