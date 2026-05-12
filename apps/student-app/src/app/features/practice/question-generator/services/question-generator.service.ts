import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  GeneratedQuestion,
  HealthCheckResponse,
} from '../models/question.model';

/**
 * Response shape from the practice questions API.
 */
interface PracticeQuestionsResponse {
  questions: Array<{
    _id: string;
    questionText: string;
    answer: number | string;
    explanation: string;
    grade: number;
    topic: string;
    category: string;
    format: string;
    options: string[];
    stepByStepSolution: string[];
    difficulty: string;
  }>;
  total: number;
  requested: number;
  hasMore: boolean;
}

/**
 * Service for loading pre-approved practice questions from the question bank.
 *
 * @example
 * ```typescript
 * const service = inject(QuestionGeneratorService);
 * service.checkHealth().subscribe(h => console.log(h.status));
 * service.loadPracticeQuestions(6, 'ALGEBRA_AND_PATTERNS', 10).subscribe(res => ...);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class QuestionGeneratorService {
  private readonly http = inject(HttpClient);
  private readonly practiceUrl = '/api/questions/practice';
  private readonly healthUrl = '/api/math-questions/health';

  /**
   * Checks the backend health status.
   *
   * @returns Observable of HealthCheckResponse
   * @throws HttpErrorResponse if the backend is unreachable
   */
  checkHealth(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(this.healthUrl);
  }

  /**
   * Loads pre-approved practice questions from the question bank.
   *
   * @param grade - Year level (0–10)
   * @param topic - Canonical curriculum topic key (for example 'WHOLE_NUMBER_OPERATIONS')
   * @param count - Number of questions to load
   * @param difficulty - Optional difficulty filter ('easy', 'medium', 'hard')
   * @returns Observable of practice response with questions and availability info
   */
  loadPracticeQuestions(
    grade: number,
    topic: string,
    count: number,
    difficulty?: string
  ): Observable<PracticeQuestionsResponse> {
    let params = new HttpParams()
      .set('grade', grade.toString())
      .set('topic', topic)
      .set('count', count.toString());

    if (difficulty) {
      params = params.set('difficulty', difficulty);
    }

    return this.http.get<PracticeQuestionsResponse>(this.practiceUrl, {
      params,
    });
  }

  /**
   * Loads practice questions and maps them to GeneratedQuestion format
   * for the question generator UI.
   *
   * @param grade - Year level (0–10)
   * @param count - Number of questions to generate
   * @param topic - Canonical curriculum topic key
   * @returns Observable of GeneratedQuestion array
   */
  generateQuestions(
    grade: number,
    count: number,
    topic: string
  ): Observable<GeneratedQuestion[]> {
    return this.loadPracticeQuestions(grade, topic, count).pipe(
      map((response) =>
        response.questions.map((q) => ({
          question: q.questionText,
          answer:
            typeof q.answer === 'number'
              ? q.answer
              : parseFloat(String(q.answer)) || 0,
          explanation: q.explanation,
          metadata: {
            grade: q.grade,
            topic: q.topic,
            difficulty: q.difficulty,
            country: 'NZ',
            generated_by: 'question-bank',
            generation_time: 0,
          },
        }))
      )
    );
  }
}
