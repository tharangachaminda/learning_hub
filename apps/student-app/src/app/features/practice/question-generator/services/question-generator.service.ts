import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GeneratedQuestion,
  HealthCheckResponse,
} from '../models/question.model';

/**
 * Service for communicating with the math-questions API endpoints.
 *
 * Handles health checks and question generation HTTP calls.
 *
 * @example
 * ```typescript
 * const service = inject(QuestionGeneratorService);
 * service.checkHealth().subscribe(h => console.log(h.status));
 * service.generateQuestions('grade_3', 10, 'addition').subscribe(qs => ...);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class QuestionGeneratorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/math-questions';

  /**
   * Checks the backend health status.
   *
   * @returns Observable of HealthCheckResponse
   * @throws HttpErrorResponse if the backend is unreachable
   */
  checkHealth(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(`${this.baseUrl}/health`);
  }

  /**
   * Generates AI-powered math questions.
   *
   * @param difficulty - Difficulty level param (e.g. 'grade_3')
   * @param count - Number of questions to generate
   * @param type - Topic type, lowercased (e.g. 'addition')
   * @returns Observable of GeneratedQuestion array
   * @throws HttpErrorResponse on API failure
   */
  generateQuestions(
    difficulty: string,
    count: number,
    type: string
  ): Observable<GeneratedQuestion[]> {
    const params = new HttpParams()
      .set('difficulty', difficulty)
      .set('count', count.toString())
      .set('type', type);

    return this.http.get<GeneratedQuestion[]>(`${this.baseUrl}/generate`, {
      params,
    });
  }
}
