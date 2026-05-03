import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { DailyProgressSummary } from '../models/performance.model';

export interface RecordQuestionAttemptRequest {
  studentId: string;
  questionId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeSpentSeconds: number;
  sessionId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StudentProgressService {
  private readonly apiUrl = '/api/progress';

  constructor(private readonly http: HttpClient) {}

  recordQuestionAttempts(
    attempts: RecordQuestionAttemptRequest[]
  ): Observable<DailyProgressSummary[]> {
    if (attempts.length === 0) {
      return of([]);
    }

    return forkJoin(
      attempts.map((attempt) =>
        this.http.post<DailyProgressSummary>(`${this.apiUrl}/record`, attempt)
      )
    );
  }
}
