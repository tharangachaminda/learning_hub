import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  MathQuestionsService,
  MathQuestion,
} from '../../services/math-questions.service';

/**
 * Component for displaying and managing mathematical questions
 * Provides interface for Grade 3 students to practice math problems
 *
 * Features:
 * - Generate new math questions
 * - Display questions with step-by-step solutions
 * - Child-friendly interface design
 * - Real-time API integration
 */
@Component({
  selector: 'app-math-questions',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './math-questions.component.html',
  styleUrls: ['./math-questions.component.scss'],
  providers: [MathQuestionsService],
})
export class MathQuestionsComponent {
  questions: MathQuestion[] = [];
  isLoading = false;
  error: string | null = null;
  selectedAnswer: number | null = null;
  currentQuestionIndex = 0;
  showSolution = false;

  constructor(private mathService: MathQuestionsService) {}

  /**
   * Generates new math questions from the API
   *
   * @param difficulty - Grade level ('grade_3' default)
   * @param count - Number of questions (default 5)
   * @param type - Operation type ('addition' default)
   */
  generateQuestions(
    difficulty = 'grade_3',
    count = 5,
    type = 'addition'
  ): void {
    this.isLoading = true;
    this.error = null;
    this.resetState();

    this.mathService.generateQuestions(difficulty, count, type).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.isLoading = false;
        console.log('Generated questions:', questions);
      },
      error: (error) => {
        this.error = 'Failed to generate questions. Please try again.';
        this.isLoading = false;
        console.error('Error generating questions:', error);
      },
    });
  }

  /**
   * Handles answer submission for the current question
   *
   * @param answer - Student's answer
   */
  submitAnswer(answer: number): void {
    this.selectedAnswer = answer;
    this.showSolution = true;
  }

  /**
   * Moves to the next question in the set
   */
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.resetQuestionState();
    }
  }

  /**
   * Moves to the previous question in the set
   */
  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.resetQuestionState();
    }
  }

  /**
   * Gets the currently displayed question
   */
  get currentQuestion(): MathQuestion | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  /**
   * Checks if the submitted answer is correct
   */
  get isAnswerCorrect(): boolean {
    return this.selectedAnswer === this.currentQuestion?.answer;
  }

  /**
   * Resets the component state for new question generation
   */
  private resetState(): void {
    this.currentQuestionIndex = 0;
    this.resetQuestionState();
  }

  /**
   * Resets the current question interaction state
   */
  resetQuestionState(): void {
    this.selectedAnswer = null;
    this.showSolution = false;
  }

  /**
   * Generates number options for multiple choice answers
   * Creates plausible incorrect options around the correct answer
   */
  getAnswerOptions(): number[] {
    if (!this.currentQuestion) return [];

    const correct = this.currentQuestion.answer;
    const options = [correct];

    // Generate 3 plausible incorrect answers
    for (let i = 0; i < 3; i++) {
      let option;
      do {
        // Generate options within ±10 of correct answer, but not negative
        option = Math.max(
          1,
          correct +
            (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 10 + 1)
        );
      } while (options.includes(option));
      options.push(option);
    }

    // Shuffle the options so correct answer isn't always first
    return options.sort(() => Math.random() - 0.5);
  }
}
