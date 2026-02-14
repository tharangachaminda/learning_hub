/**
 * Test Suite: Frontend Curriculum Data
 *
 * Validates that curriculum data constants are correctly structured
 * for populating generation controls (grade/topic dropdowns, category cards).
 */
import {
  GRADE_TOPICS,
  QUESTION_CATEGORIES,
  QUESTION_TYPE_DISPLAY_NAMES,
  SUPPORTED_GRADES,
  CategoryInfo,
} from './curriculum.data';

describe('Curriculum Data', () => {
  describe('SUPPORTED_GRADES', () => {
    it('should contain grades 3 through 8', () => {
      expect(SUPPORTED_GRADES).toEqual([3, 4, 5, 6, 7, 8]);
    });
  });

  describe('GRADE_TOPICS', () => {
    it('should have entries for all supported grades (3-8)', () => {
      for (const grade of SUPPORTED_GRADES) {
        expect(GRADE_TOPICS[grade]).toBeDefined();
        expect(GRADE_TOPICS[grade].mathematics.length).toBeGreaterThan(0);
      }
    });

    it('should have grade 3 topics including basic operations', () => {
      const grade3Topics = GRADE_TOPICS[3].mathematics;
      expect(grade3Topics).toContain('ADDITION');
      expect(grade3Topics).toContain('SUBTRACTION');
      expect(grade3Topics).toContain('MULTIPLICATION');
      expect(grade3Topics).toContain('DIVISION');
    });

    it('should have grade 4 topics including decimals and fractions', () => {
      const grade4Topics = GRADE_TOPICS[4].mathematics;
      expect(grade4Topics).toContain('DECIMAL_BASICS');
      expect(grade4Topics).toContain('FRACTION_BASICS');
    });

    it('should only contain mathematics subject key per grade', () => {
      for (const grade of SUPPORTED_GRADES) {
        expect(Object.keys(GRADE_TOPICS[grade])).toEqual(['mathematics']);
      }
    });
  });

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

    it('should have display names for all topics across all grades', () => {
      for (const grade of SUPPORTED_GRADES) {
        const topics = GRADE_TOPICS[grade].mathematics;
        for (const topic of topics) {
          expect(QUESTION_TYPE_DISPLAY_NAMES[topic]).toBeDefined();
        }
      }
    });
  });
});
