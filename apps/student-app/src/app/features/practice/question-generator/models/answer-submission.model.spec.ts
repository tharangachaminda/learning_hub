/**
 * Test Suite: AnswerSubmission & ScoringResult Models
 *
 * Validates the shape of models used for batch answer submission
 * and client-side scoring results.
 */
import { AnswerSubmission, ScoringResult } from './answer-submission.model';
import { StudentAnswer } from './student-answer.model';

describe('AnswerSubmission Model', () => {
  it('should define AnswerSubmission with generationParams, answers, totalTimeSpent, and submittedAt', () => {
    const submission: AnswerSubmission = {
      generationParams: {
        grade: 3,
        topic: 'ADDITION',
        category: 'number-operations',
        difficulty: 'easy',
        country: 'NZ',
      },
      answers: [
        {
          questionIndex: 0,
          selectedOption: 'B',
          hintUsed: false,
          timeSpent: 30,
        },
      ],
      totalTimeSpent: 120,
      submittedAt: '2026-02-14T10:00:00.000Z',
    };

    expect(submission.generationParams.grade).toBe(3);
    expect(submission.generationParams.topic).toBe('ADDITION');
    expect(submission.generationParams.category).toBe('number-operations');
    expect(submission.generationParams.difficulty).toBe('easy');
    expect(submission.generationParams.country).toBe('NZ');
    expect(submission.answers).toHaveLength(1);
    expect(submission.totalTimeSpent).toBe(120);
    expect(submission.submittedAt).toBe('2026-02-14T10:00:00.000Z');
  });

  it('should allow answers with optional fields', () => {
    const submission: AnswerSubmission = {
      generationParams: {
        grade: 5,
        topic: 'SUBTRACTION',
        category: 'number-operations',
        difficulty: 'medium',
        country: 'AU',
      },
      answers: [
        {
          questionIndex: 0,
          hintUsed: true,
          timeSpent: 45,
          additionalNotes: 'I used estimation.',
        },
        {
          questionIndex: 1,
          selectedOption: 'A',
          hintUsed: false,
          timeSpent: 20,
        },
      ],
      totalTimeSpent: 65,
      submittedAt: '2026-02-14T10:05:00.000Z',
    };

    expect(submission.answers[0].selectedOption).toBeUndefined();
    expect(submission.answers[0].additionalNotes).toBe('I used estimation.');
    expect(submission.answers[1].selectedOption).toBe('A');
  });
});

describe('ScoringResult Model', () => {
  it('should define ScoringResult with correct, incorrect, skipped, total, percentage, and timeSpent', () => {
    const result: ScoringResult = {
      correct: 7,
      incorrect: 2,
      skipped: 1,
      total: 10,
      percentage: 70,
      timeSpent: '02:30',
    };

    expect(result.correct).toBe(7);
    expect(result.incorrect).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.total).toBe(10);
    expect(result.percentage).toBe(70);
    expect(result.timeSpent).toBe('02:30');
  });

  it('should support edge case of 0 correct answers', () => {
    const result: ScoringResult = {
      correct: 0,
      incorrect: 3,
      skipped: 7,
      total: 10,
      percentage: 0,
      timeSpent: '00:45',
    };

    expect(result.correct).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should support perfect score', () => {
    const result: ScoringResult = {
      correct: 10,
      incorrect: 0,
      skipped: 0,
      total: 10,
      percentage: 100,
      timeSpent: '05:00',
    };

    expect(result.correct).toBe(10);
    expect(result.percentage).toBe(100);
    expect(result.skipped).toBe(0);
  });
});
