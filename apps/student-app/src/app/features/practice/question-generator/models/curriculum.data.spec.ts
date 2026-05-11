/**
 * Test Suite: Frontend Curriculum Data
 *
 * Validates that frontend display metadata remains available for
 * topic labels, category cards, and legacy question records.
 */
import {
  QUESTION_CATEGORIES,
  QUESTION_TYPE_DISPLAY_NAMES,
  CategoryInfo,
} from './curriculum.data';

describe('Curriculum Data', () => {
  describe('QUESTION_CATEGORIES', () => {
    it('should have exactly 4 categories', () => {
      expect(Object.keys(QUESTION_CATEGORIES)).toHaveLength(4);
    });

    it('should have number-operations category', () => {
      const cat = QUESTION_CATEGORIES['number-operations'];
      expect(cat).toBeDefined();
      expect(cat.name).toBe('Number Operations & Arithmetic');
      expect(cat.icon).toBeTruthy();
      expect(cat.description).toBeTruthy();
    });

    it('should have algebra-patterns category', () => {
      const cat = QUESTION_CATEGORIES['algebra-patterns'];
      expect(cat).toBeDefined();
      expect(cat.name).toBe('Algebra & Patterns');
    });

    it('should have geometry-measurement category', () => {
      const cat = QUESTION_CATEGORIES['geometry-measurement'];
      expect(cat).toBeDefined();
      expect(cat.name).toBe('Geometry & Measurement');
    });

    it('should have problem-solving-reasoning category', () => {
      const cat = QUESTION_CATEGORIES['problem-solving-reasoning'];
      expect(cat).toBeDefined();
      expect(cat.name).toBe('Problem Solving & Reasoning');
    });

    it('each category should have name, description, icon, and emoji', () => {
      for (const key of Object.keys(QUESTION_CATEGORIES)) {
        const cat: CategoryInfo = QUESTION_CATEGORIES[key];
        expect(cat.name).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(cat.emoji).toBeTruthy();
      }
    });
  });

  describe('QUESTION_TYPE_DISPLAY_NAMES', () => {
    it('should have display names for basic operation types', () => {
      expect(QUESTION_TYPE_DISPLAY_NAMES['ADDITION']).toBe('Addition');
      expect(QUESTION_TYPE_DISPLAY_NAMES['SUBTRACTION']).toBe('Subtraction');
      expect(QUESTION_TYPE_DISPLAY_NAMES['MULTIPLICATION']).toBe(
        'Multiplication'
      );
      expect(QUESTION_TYPE_DISPLAY_NAMES['DIVISION']).toBe('Division');
    });

    it('should include labels for canonical backend curriculum topics', () => {
      expect(QUESTION_TYPE_DISPLAY_NAMES['WHOLE_NUMBER_OPERATIONS']).toBe(
        'Whole Number Operations'
      );
      expect(
        QUESTION_TYPE_DISPLAY_NAMES['FRACTIONS_DECIMALS_PERCENTAGES']
      ).toBe('Fractions, Decimals & Percentages');
      expect(QUESTION_TYPE_DISPLAY_NAMES['ALGEBRA_AND_PATTERNS']).toBe(
        'Algebra and Patterns'
      );
    });

    it('should retain labels for legacy topic keys still found in existing data', () => {
      expect(QUESTION_TYPE_DISPLAY_NAMES['ADDITION']).toBe('Addition');
      expect(QUESTION_TYPE_DISPLAY_NAMES['ALGEBRAIC_EQUATIONS']).toBe(
        'Algebraic Equations'
      );
      expect(QUESTION_TYPE_DISPLAY_NAMES['FINANCIAL_LITERACY']).toBe(
        'Financial Literacy'
      );
    });
  });
});
