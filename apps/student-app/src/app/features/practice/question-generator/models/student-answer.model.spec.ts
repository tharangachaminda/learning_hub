import { StudentAnswer } from './student-answer.model';

/**
 * Unit tests for the StudentAnswer model.
 *
 * Validates the interface shape and ensures type safety
 * for answer persistence and time tracking (AC-8, AC-9).
 */
describe('StudentAnswer Model', () => {
  it('should create a StudentAnswer with all required fields', () => {
    const answer: StudentAnswer = {
      questionIndex: 0,
      hintUsed: false,
      timeSpent: 0,
    };

    expect(answer.questionIndex).toBe(0);
    expect(answer.hintUsed).toBe(false);
    expect(answer.timeSpent).toBe(0);
  });

  it('should create a StudentAnswer with optional selectedOption', () => {
    const answer: StudentAnswer = {
      questionIndex: 2,
      selectedOption: 'B',
      hintUsed: false,
      timeSpent: 45,
    };

    expect(answer.selectedOption).toBe('B');
  });

  it('should create a StudentAnswer with optional additionalNotes', () => {
    const answer: StudentAnswer = {
      questionIndex: 1,
      additionalNotes: 'I used long division to solve this.',
      hintUsed: true,
      timeSpent: 120,
    };

    expect(answer.additionalNotes).toBe('I used long division to solve this.');
    expect(answer.hintUsed).toBe(true);
  });

  it('should create a StudentAnswer with all optional fields populated', () => {
    const answer: StudentAnswer = {
      questionIndex: 5,
      selectedOption: 'D',
      additionalNotes: 'This was tricky!',
      hintUsed: true,
      timeSpent: 90,
    };

    expect(answer.questionIndex).toBe(5);
    expect(answer.selectedOption).toBe('D');
    expect(answer.additionalNotes).toBe('This was tricky!');
    expect(answer.hintUsed).toBe(true);
    expect(answer.timeSpent).toBe(90);
  });
});
