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
 * service.loadPracticeQuestions(3, 'ADDITION', 10).subscribe(res => ...);
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
   * @param grade - Grade level (3–8)
   * @param topic - Topic key (e.g. 'ADDITION')
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
   * for backward compatibility with the question generator UI.
   *
   * @param difficulty - Grade-based difficulty param (e.g. 'grade_3')
   * @param count - Number of questions to generate
   * @param type - Topic type
   * @returns Observable of GeneratedQuestion array
   */
  generateQuestions(
    difficulty: string,
    count: number,
    type: string
  ): Observable<GeneratedQuestion[]> {
    // Parse grade number from difficulty param (e.g. 'grade_3' -> 3)
    const gradeMatch = difficulty.match(/grade_?(\d+)/i);
    const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 3;

    return this.loadPracticeQuestions(grade, type.toUpperCase(), count).pipe(
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
