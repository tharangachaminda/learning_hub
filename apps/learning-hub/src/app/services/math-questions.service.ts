import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interface representing a mathematical question from the API
 */
export interface MathQuestion {
  question: string;
  answer: number;
  operation: string;
  difficulty: string;
  stepByStepSolution: string[];
  createdAt: string;
}

/**
 * Service for fetching mathematical questions from the backend API
 * Handles communication with NestJS math questions endpoints
 *
 * @example
 * ```typescript
 * constructor(private mathService: MathQuestionsService) {}
 *
 * loadQuestions() {
 *   this.mathService.generateQuestions('grade_3', 10, 'addition')
 *     .subscribe(questions => this.questions = questions);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class MathQuestionsService {
  private readonly apiUrl = 'http://localhost:3000/api/math-questions';

  constructor(private http: HttpClient) {}

  /**
   * Generates mathematical questions from the backend API
   *
   * @param difficulty - Grade level difficulty (e.g., 'grade_3')
   * @param count - Number of questions to generate (max 50)
   * @param type - Type of operation ('addition' or 'subtraction')
   * @returns Observable array of generated math questions
   *
   * @example
   * ```typescript
   * this.generateQuestions('grade_3', 5, 'addition')
   *   .subscribe(questions => console.log('Got questions:', questions));
   * ```
   */
  generateQuestions(
    difficulty: string,
    count: number,
    type: string
  ): Observable<MathQuestion[]> {
    const params = {
      difficulty,
      count: count.toString(),
      type,
    };

    return this.http.get<MathQuestion[]>(`${this.apiUrl}/generate`, { params });
  }

  /**
   * Checks the health status of the math questions service
   *
   * @returns Observable containing service health information
   *
   * @example
   * ```typescript
   * this.checkHealth().subscribe(health =>
   *   console.log('Service status:', health.status)
   * );
   * ```
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
