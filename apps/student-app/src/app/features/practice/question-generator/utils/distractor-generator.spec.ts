/**
 * Test Suite: generateDistractors utility
 *
 * Validates frontend-side generation of plausible wrong answers
 * for multiple-choice question display (AC#4).
 */
import { generateDistractors } from './distractor-generator';

describe('generateDistractors', () => {
  it('should return exactly 4 options by default', () => {
    const options = generateDistractors(10);
    expect(options).toHaveLength(4);
  });

  it('should include the correct answer among the options', () => {
    const options = generateDistractors(10);
    expect(options).toContain('10');
  });

  it('should not contain duplicate values', () => {
    // Run multiple times to catch randomness edge cases
    for (let i = 0; i < 20; i++) {
      const options = generateDistractors(15);
      const unique = new Set(options);
      expect(unique.size).toBe(options.length);
    }
  });

  it('should not produce negative numbers', () => {
    // Low answer to stress-test lower bound
    for (let i = 0; i < 20; i++) {
      const options = generateDistractors(1);
      options.forEach((opt) => {
        expect(Number(opt)).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('should produce numeric string options', () => {
    const options = generateDistractors(25);
    options.forEach((opt) => {
      expect(Number(opt)).not.toBeNaN();
    });
  });

  it('should generate plausible distractors close to the correct answer', () => {
    const correctAnswer = 20;
    const options = generateDistractors(correctAnswer);
    const wrong = options.filter((o) => o !== String(correctAnswer));
    wrong.forEach((opt) => {
      const diff = Math.abs(Number(opt) - correctAnswer);
      // Distractors should be within a reasonable range (≤10)
      expect(diff).toBeLessThanOrEqual(10);
    });
  });

  it('should shuffle the correct answer position (not always first)', () => {
    const positions = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const options = generateDistractors(10);
      positions.add(options.indexOf('10'));
    }
    // Over 50 runs the correct answer should appear in at least 2 different positions
    expect(positions.size).toBeGreaterThanOrEqual(2);
  });

  it('should handle answer of 0', () => {
    const options = generateDistractors(0);
    expect(options).toHaveLength(4);
    expect(options).toContain('0');
    options.forEach((opt) => {
      expect(Number(opt)).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle large answers', () => {
    const options = generateDistractors(999);
    expect(options).toHaveLength(4);
    expect(options).toContain('999');
  });

  it('should respect custom option count', () => {
    const options = generateDistractors(10, 6);
    expect(options).toHaveLength(6);
    expect(options).toContain('10');
  });
});
