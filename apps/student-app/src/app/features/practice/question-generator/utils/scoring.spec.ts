/**
 * Test Suite: Scoring Utility
 *
 * Validates client-side scoring logic that compares student answers
 * against correct answers and produces a ScoringResult.
 */
import { scoreAnswers, formatTime } from './scoring';
import { GeneratedQuestion } from '../models/question.model';
import { StudentAnswer } from '../models/student-answer.model';

describe('formatTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format seconds under a minute', () => {
    expect(formatTime(45)).toBe('00:45');
  });

  it('should format exact minutes', () => {
    expect(formatTime(120)).toBe('02:00');
  });

  it('should format mixed minutes and seconds', () => {
    expect(formatTime(150)).toBe('02:30');
  });

  it('should pad single-digit minutes and seconds', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('should handle large values', () => {
    expect(formatTime(3661)).toBe('61:01');
  });
});

describe('scoreAnswers', () => {
  const mockQuestions: GeneratedQuestion[] = [
    {
      question: '5 + 3 = ?',
      answer: 8,
      explanation: 'Add 5 and 3.',
      metadata: {
        grade: 3,
        topic: 'ADD',
        difficulty: 'easy',
        country: 'NZ',
        generated_by: 'ollama',
        generation_time: 400,
      },
    },
    {
      question: '7 - 2 = ?',
      answer: 5,
      explanation: 'Subtract 2 from 7.',
      metadata: {
        grade: 3,
        topic: 'SUB',
        difficulty: 'easy',
        country: 'NZ',
        generated_by: 'ollama',
        generation_time: 350,
      },
    },
    {
      question: '4 × 3 = ?',
      answer: 12,
      explanation: 'Multiply 4 by 3.',
      metadata: {
        grade: 3,
        topic: 'MUL',
        difficulty: 'medium',
        country: 'NZ',
        generated_by: 'ollama',
        generation_time: 500,
      },
    },
  ];

  it('should count correct answers by comparing selectedOption with String(answer)', () => {
    const answers = new Map<number, StudentAnswer>([
      [
        0,
        {
          questionIndex: 0,
          selectedOption: '8',
          hintUsed: false,
          timeSpent: 10,
        },
      ],
      [
        1,
        {
          questionIndex: 1,
          selectedOption: '5',
          hintUsed: false,
          timeSpent: 15,
        },
      ],
      [
        2,
        {
          questionIndex: 2,
          selectedOption: '12',
          hintUsed: false,
          timeSpent: 20,
        },
      ],
    ]);

    const result = scoreAnswers(mockQuestions, answers, 45);
    expect(result.correct).toBe(3);
    expect(result.incorrect).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.percentage).toBe(100);
  });

  it('should count incorrect answers', () => {
    const answers = new Map<number, StudentAnswer>([
      [
        0,
        {
          questionIndex: 0,
          selectedOption: '9',
          hintUsed: false,
          timeSpent: 10,
        },
      ],
      [
        1,
        {
          questionIndex: 1,
          selectedOption: '3',
          hintUsed: false,
          timeSpent: 15,
        },
      ],
      [
        2,
        {
          questionIndex: 2,
          selectedOption: '12',
          hintUsed: false,
          timeSpent: 20,
        },
      ],
    ]);

    const result = scoreAnswers(mockQuestions, answers, 45);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(2);
  });

  it('should count skipped (unanswered) questions', () => {
    const answers = new Map<number, StudentAnswer>([
      [
        0,
        {
          questionIndex: 0,
          selectedOption: '8',
          hintUsed: false,
          timeSpent: 10,
        },
      ],
    ]);

    const result = scoreAnswers(mockQuestions, answers, 10);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(0);
    expect(result.skipped).toBe(2);
    expect(result.total).toBe(3);
  });

  it('should treat answers without selectedOption as skipped', () => {
    const answers = new Map<number, StudentAnswer>([
      [0, { questionIndex: 0, hintUsed: true, timeSpent: 30 }],
    ]);

    const result = scoreAnswers(mockQuestions, answers, 30);
    expect(result.skipped).toBe(3);
    expect(result.incorrect).toBe(0);
  });

  it('should calculate percentage based on correct / total', () => {
    const answers = new Map<number, StudentAnswer>([
      [
        0,
        {
          questionIndex: 0,
          selectedOption: '8',
          hintUsed: false,
          timeSpent: 10,
        },
      ],
      [
        1,
        {
          questionIndex: 1,
          selectedOption: '3',
          hintUsed: false,
          timeSpent: 15,
        },
      ],
    ]);

    const result = scoreAnswers(mockQuestions, answers, 25);
    // 1 correct / 3 total ≈ 33.33%
    expect(result.percentage).toBeCloseTo(33.33, 0);
  });

  it('should format totalTimeSpent as mm:ss in the result', () => {
    const answers = new Map<number, StudentAnswer>();
    const result = scoreAnswers(mockQuestions, answers, 150);
    expect(result.timeSpent).toBe('02:30');
  });

  it('should handle empty question set', () => {
    const answers = new Map<number, StudentAnswer>();
    const result = scoreAnswers([], answers, 0);
    expect(result.total).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should set total to questions length', () => {
    const answers = new Map<number, StudentAnswer>();
    const result = scoreAnswers(mockQuestions, answers, 0);
    expect(result.total).toBe(3);
  });

  // ────────────────────────────────────────────────────
  // Letter-based scoring (matches real UI data flow)
  // ────────────────────────────────────────────────────
  describe('with questionOptions (letter → value resolution)', () => {
    // Options map mirrors what generateDistractors produces:
    // index 0: answer=8,  options=['10','8','11','9']  → correct = 'B' (index 1)
    // index 1: answer=5,  options=['5','7','3','6']    → correct = 'A' (index 0)
    // index 2: answer=12, options=['14','11','12','10'] → correct = 'C' (index 2)
    const questionOptions = new Map<number, string[]>([
      [0, ['10', '8', '11', '9']],
      [1, ['5', '7', '3', '6']],
      [2, ['14', '11', '12', '10']],
    ]);

    it('should resolve letter selectedOption to option value and score correctly', () => {
      const answers = new Map<number, StudentAnswer>([
        [
          0,
          {
            questionIndex: 0,
            selectedOption: 'B',
            hintUsed: false,
            timeSpent: 10,
          },
        ],
        [
          1,
          {
            questionIndex: 1,
            selectedOption: 'A',
            hintUsed: false,
            timeSpent: 15,
          },
        ],
        [
          2,
          {
            questionIndex: 2,
            selectedOption: 'C',
            hintUsed: false,
            timeSpent: 20,
          },
        ],
      ]);

      const result = scoreAnswers(mockQuestions, answers, 45, questionOptions);
      expect(result.correct).toBe(3);
      expect(result.incorrect).toBe(0);
      expect(result.percentage).toBe(100);
    });

    it('should mark wrong letter as incorrect', () => {
      const answers = new Map<number, StudentAnswer>([
        [
          0,
          {
            questionIndex: 0,
            selectedOption: 'A',
            hintUsed: false,
            timeSpent: 10,
          },
        ], // 'A'→'10', answer=8 → incorrect
        [
          1,
          {
            questionIndex: 1,
            selectedOption: 'A',
            hintUsed: false,
            timeSpent: 15,
          },
        ], // 'A'→'5',  answer=5 → correct
      ]);

      const result = scoreAnswers(mockQuestions, answers, 25, questionOptions);
      expect(result.correct).toBe(1);
      expect(result.incorrect).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('should still count skipped when letter options are provided', () => {
      const answers = new Map<number, StudentAnswer>([
        [
          0,
          {
            questionIndex: 0,
            selectedOption: 'B',
            hintUsed: false,
            timeSpent: 10,
          },
        ],
      ]);

      const result = scoreAnswers(mockQuestions, answers, 10, questionOptions);
      expect(result.correct).toBe(1);
      expect(result.skipped).toBe(2);
    });
  });
});
