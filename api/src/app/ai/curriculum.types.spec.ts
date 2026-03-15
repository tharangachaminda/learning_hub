import {
  GRADE_TOPICS,
  QUESTION_TYPE_TO_CATEGORY,
  QUESTION_TYPE_DISPLAY_NAMES,
  QUESTION_CATEGORIES,
  getCurriculumContext,
} from './curriculum.types';

/**
 * Collects all unique topic strings from GRADE_TOPICS across all grades.
 *
 * @returns Set of all unique topic strings
 */
function getAllTopics(): Set<string> {
  const topics = new Set<string>();
  for (const grade of Object.keys(GRADE_TOPICS)) {
    const gradeTopics = GRADE_TOPICS[Number(grade)]['mathematics'] || [];
    for (const topic of gradeTopics) {
      topics.add(topic);
    }
  }
  return topics;
}

describe('Curriculum Types — Complete Topic Coverage', () => {
  const allTopics = getAllTopics();

  describe('GRADE_TOPICS completeness', () => {
    it('should define topics for grades 3 through 8', () => {
      expect(Object.keys(GRADE_TOPICS).map(Number).sort()).toEqual([
        3, 4, 5, 6, 7, 8,
      ]);
    });

    it('should contain exactly 50 grade×topic combinations', () => {
      let count = 0;
      for (const grade of Object.keys(GRADE_TOPICS)) {
        count += GRADE_TOPICS[Number(grade)]['mathematics'].length;
      }
      expect(count).toBe(50);
    });
  });

  describe('QUESTION_TYPE_TO_CATEGORY — every topic has a category mapping', () => {
    it('should have a category mapping for every unique topic in GRADE_TOPICS', () => {
      const missingMappings: string[] = [];
      for (const topic of allTopics) {
        if (!QUESTION_TYPE_TO_CATEGORY[topic]) {
          missingMappings.push(topic);
        }
      }
      expect(missingMappings).toEqual([]);
    });

    it('should only map to valid category keys defined in QUESTION_CATEGORIES', () => {
      const validCategories = Object.keys(QUESTION_CATEGORIES);
      for (const [topic, category] of Object.entries(
        QUESTION_TYPE_TO_CATEGORY
      )) {
        expect(validCategories).toContain(category);
      }
    });
  });

  describe('QUESTION_TYPE_DISPLAY_NAMES — every topic has a display name', () => {
    it('should have a display name for every unique topic in GRADE_TOPICS', () => {
      const missingNames: string[] = [];
      for (const topic of allTopics) {
        if (!QUESTION_TYPE_DISPLAY_NAMES[topic]) {
          missingNames.push(topic);
        }
      }
      expect(missingNames).toEqual([]);
    });

    it('should have non-empty string display names', () => {
      for (const [topic, name] of Object.entries(QUESTION_TYPE_DISPLAY_NAMES)) {
        expect(typeof name).toBe('string');
        expect(name.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('getCurriculumContext — returns valid context for all topics', () => {
    it('should return a non-null category for every grade×topic combination', () => {
      const missingContext: string[] = [];
      for (const grade of Object.keys(GRADE_TOPICS)) {
        const gradeNum = Number(grade);
        const topics = GRADE_TOPICS[gradeNum]['mathematics'];
        for (const topic of topics) {
          const ctx = getCurriculumContext(gradeNum, topic);
          if (!ctx.category) {
            missingContext.push(`Grade ${gradeNum}: ${topic}`);
          }
        }
      }
      expect(missingContext).toEqual([]);
    });

    it('should return non-empty skillsFocus for every grade×topic combination', () => {
      for (const grade of Object.keys(GRADE_TOPICS)) {
        const gradeNum = Number(grade);
        const topics = GRADE_TOPICS[gradeNum]['mathematics'];
        for (const topic of topics) {
          const ctx = getCurriculumContext(gradeNum, topic);
          expect(ctx.skillsFocus.length).toBeGreaterThan(0);
        }
      }
    });

    it('should return appropriate ageContext per grade', () => {
      expect(getCurriculumContext(3, 'ADDITION').ageContext).toBe(
        'early primary'
      );
      expect(getCurriculumContext(4, 'ADDITION').ageContext).toBe(
        'early primary'
      );
      expect(getCurriculumContext(5, 'ADVANCED_ARITHMETIC').ageContext).toBe(
        'middle primary'
      );
      expect(getCurriculumContext(6, 'DATA_ANALYSIS').ageContext).toBe(
        'middle primary'
      );
      expect(getCurriculumContext(7, 'ALGEBRAIC_FOUNDATIONS').ageContext).toBe(
        'late primary'
      );
      expect(getCurriculumContext(8, 'LINEAR_EQUATIONS').ageContext).toBe(
        'late primary'
      );
    });

    it('should return appropriate complexityLevel per grade', () => {
      expect(getCurriculumContext(3, 'ADDITION').complexityLevel).toBe(
        'concrete and visual'
      );
      expect(
        getCurriculumContext(5, 'FRACTION_OPERATIONS').complexityLevel
      ).toBe('semi-abstract with examples');
      expect(
        getCurriculumContext(8, 'FINANCIAL_LITERACY').complexityLevel
      ).toBe('abstract with real-world connections');
    });
  });
});
