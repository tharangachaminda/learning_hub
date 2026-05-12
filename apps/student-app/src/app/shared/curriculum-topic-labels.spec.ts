import {
  formatCurriculumSubjectLabel,
  formatCurriculumTopicLabel,
} from './curriculum-topic-labels';

describe('curriculum topic labels', () => {
  describe('formatCurriculumTopicLabel', () => {
    it('should format canonical topic keys using configured display labels', () => {
      expect(formatCurriculumTopicLabel('WHOLE_NUMBER_OPERATIONS')).toBe(
        'Whole Number Operations'
      );
    });

    it('should preserve backend-provided human-readable labels', () => {
      expect(formatCurriculumTopicLabel('Patterns and Relationships')).toBe(
        'Patterns and Relationships'
      );
      expect(
        formatCurriculumTopicLabel('Fractions, Decimals, and Percentages')
      ).toBe('Fractions, Decimals, and Percentages');
    });

    it('should still title-case underscore-delimited topic keys', () => {
      expect(formatCurriculumTopicLabel('CUSTOM_TOPIC_KEY')).toBe(
        'Custom Topic Key'
      );
    });
  });

  describe('formatCurriculumSubjectLabel', () => {
    it('should format mathematics consistently', () => {
      expect(formatCurriculumSubjectLabel('mathematics')).toBe('Mathematics');
    });

    it('should title-case other subject identifiers', () => {
      expect(formatCurriculumSubjectLabel('science')).toBe('Science');
    });
  });
});
