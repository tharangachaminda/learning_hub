import {
  Question,
  QuestionDocument,
  QuestionStatus,
  QuestionFormat,
  QuestionSchema,
} from './question.schema';

describe('Question Schema', () => {
  describe('Schema Fields', () => {
    it('should define questionText as a required string field', () => {
      const path = QuestionSchema.path('questionText');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
      expect((path as any).isRequired).toBeTruthy();
    });

    it('should define answer as a required field', () => {
      const path = QuestionSchema.path('answer');
      expect(path).toBeDefined();
      expect((path as any).isRequired).toBeTruthy();
    });

    it('should define explanation as an optional string field', () => {
      const path = QuestionSchema.path('explanation');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
    });

    it('should define grade as a required number field', () => {
      const path = QuestionSchema.path('grade');
      expect(path).toBeDefined();
      expect(path.instance).toBe('Number');
      expect((path as any).isRequired).toBeTruthy();
    });

    it('should define topic as a required string field', () => {
      const path = QuestionSchema.path('topic');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
      expect((path as any).isRequired).toBeTruthy();
    });

    it('should define category as an optional string field', () => {
      const path = QuestionSchema.path('category');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
    });

    it('should define format as a string field with default "open-ended"', () => {
      const path = QuestionSchema.path('format');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
      expect((path as any).defaultValue).toBe(QuestionFormat.OPEN_ENDED);
    });

    it('should define options as an array of strings for MCQ', () => {
      const path = QuestionSchema.path('options');
      expect(path).toBeDefined();
      expect(path.instance).toBe('Array');
    });

    it('should define status with default "pending"', () => {
      const path = QuestionSchema.path('status');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
      expect((path as any).defaultValue).toBe(QuestionStatus.PENDING);
    });

    it('should define stepByStepSolution as an array of strings', () => {
      const path = QuestionSchema.path('stepByStepSolution');
      expect(path).toBeDefined();
      expect(path.instance).toBe('Array');
    });

    it('should define metadata as a nested sub-document', () => {
      const generatedByPath = QuestionSchema.path('metadata.generatedBy');
      const generationTimePath = QuestionSchema.path('metadata.generationTime');
      const difficultyPath = QuestionSchema.path('metadata.difficulty');
      const countryPath = QuestionSchema.path('metadata.country');

      expect(generatedByPath).toBeDefined();
      expect(generationTimePath).toBeDefined();
      expect(difficultyPath).toBeDefined();
      expect(countryPath).toBeDefined();
    });

    it('should define reviewedBy as an optional string field', () => {
      const path = QuestionSchema.path('reviewedBy');
      expect(path).toBeDefined();
      expect(path.instance).toBe('String');
    });

    it('should define reviewedAt as an optional date field', () => {
      const path = QuestionSchema.path('reviewedAt');
      expect(path).toBeDefined();
      expect(path.instance).toBe('Date');
    });
  });

  describe('Schema Options', () => {
    it('should have timestamps enabled for createdAt and updatedAt', () => {
      const options = (QuestionSchema as any).options;
      expect(options.timestamps).toBe(true);
    });

    it('should use "questions" as the collection name', () => {
      const options = (QuestionSchema as any).options;
      expect(options.collection).toBe('questions');
    });
  });

  describe('Indexes (REQ-QG-022)', () => {
    it('should define a compound unique index on questionText + grade + topic', () => {
      const indexes = QuestionSchema.indexes();
      const compoundIndex = indexes.find(
        ([fields]) =>
          fields['questionText'] === 1 &&
          fields['grade'] === 1 &&
          fields['topic'] === 1
      );
      expect(compoundIndex).toBeDefined();
      expect(compoundIndex[1]).toEqual(
        expect.objectContaining({ unique: true })
      );
    });

    it('should define a query index on grade', () => {
      const indexes = QuestionSchema.indexes();
      const gradeIndex = indexes.find(
        ([fields]) => fields['grade'] === 1 && Object.keys(fields).length === 1
      );
      expect(gradeIndex).toBeDefined();
    });

    it('should define a query index on topic', () => {
      const indexes = QuestionSchema.indexes();
      const topicIndex = indexes.find(
        ([fields]) => fields['topic'] === 1 && Object.keys(fields).length === 1
      );
      expect(topicIndex).toBeDefined();
    });

    it('should define a query index on status', () => {
      const indexes = QuestionSchema.indexes();
      const statusIndex = indexes.find(
        ([fields]) => fields['status'] === 1 && Object.keys(fields).length === 1
      );
      expect(statusIndex).toBeDefined();
    });

    it('should define a query index on format', () => {
      const indexes = QuestionSchema.indexes();
      const formatIndex = indexes.find(
        ([fields]) => fields['format'] === 1 && Object.keys(fields).length === 1
      );
      expect(formatIndex).toBeDefined();
    });
  });

  describe('Enums', () => {
    it('should define QuestionStatus with pending, approved, rejected values', () => {
      expect(QuestionStatus.PENDING).toBe('pending');
      expect(QuestionStatus.APPROVED).toBe('approved');
      expect(QuestionStatus.REJECTED).toBe('rejected');
    });

    it('should define QuestionFormat with open-ended and multiple-choice values', () => {
      expect(QuestionFormat.OPEN_ENDED).toBe('open-ended');
      expect(QuestionFormat.MULTIPLE_CHOICE).toBe('multiple-choice');
    });
  });

  describe('Default Values (AC-003)', () => {
    it('should default status to pending for new questions', () => {
      const path = QuestionSchema.path('status');
      expect((path as any).defaultValue).toBe('pending');
    });

    it('should default format to open-ended', () => {
      const path = QuestionSchema.path('format');
      expect((path as any).defaultValue).toBe('open-ended');
    });

    it('should default options to an empty array', () => {
      const path = QuestionSchema.path('options');
      const defaultVal = (path as any).defaultValue;
      // Mongoose defaults array to undefined or [] depending on config
      // The schema should explicitly set default to []
      expect(defaultVal).toBeDefined();
    });

    it('should default stepByStepSolution to an empty array', () => {
      const path = QuestionSchema.path('stepByStepSolution');
      const defaultVal = (path as any).defaultValue;
      expect(defaultVal).toBeDefined();
    });
  });
});
