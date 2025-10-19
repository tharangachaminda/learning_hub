import {
  MathQuestion,
  OperationType,
  DifficultyLevel,
} from './math-question.entity';

describe('MathQuestion Entity', () => {
  describe('Constructor', () => {
    it('should create a MathQuestion with all required properties', () => {
      // RED PHASE: This test MUST fail initially
      // Testing that MathQuestion can be instantiated with essential properties

      const questionData = {
        question: '5 + 3 = ?',
        answer: 8,
        operation: OperationType.ADDITION,
        difficulty: DifficultyLevel.GRADE_3,
        stepByStepSolution: ['First add 5', 'Then add 3', 'Answer is 8'],
      };

      const mathQuestion = new MathQuestion(
        questionData.question,
        questionData.answer,
        questionData.operation,
        questionData.difficulty,
        questionData.stepByStepSolution
      );

      expect(mathQuestion).toBeDefined();
      expect(mathQuestion.question).toBe('5 + 3 = ?');
      expect(mathQuestion.answer).toBe(8);
      expect(mathQuestion.operation).toBe(OperationType.ADDITION);
      expect(mathQuestion.difficulty).toBe(DifficultyLevel.GRADE_3);
      expect(mathQuestion.stepByStepSolution).toEqual([
        'First add 5',
        'Then add 3',
        'Answer is 8',
      ]);
    });

    it('should validate required properties are provided', () => {
      // Testing validation - question and answer are mandatory
      expect(() => {
        new MathQuestion(
          '',
          5,
          OperationType.ADDITION,
          DifficultyLevel.GRADE_3,
          []
        );
      }).toThrow('Question text cannot be empty');

      expect(() => {
        new MathQuestion(
          '2 + 2 = ?',
          null as any,
          OperationType.ADDITION,
          DifficultyLevel.GRADE_3,
          []
        );
      }).toThrow('Answer must be a valid number');
    });

    it('should have default values for optional properties', () => {
      // Testing that entity has sensible defaults
      const basicQuestion = new MathQuestion(
        '1 + 1 = ?',
        2,
        OperationType.ADDITION,
        DifficultyLevel.GRADE_3
      );

      expect(basicQuestion.stepByStepSolution).toEqual([]);
      expect(basicQuestion.createdAt).toBeInstanceOf(Date);
      expect(basicQuestion.id).toBeUndefined(); // Will be set by database
    });
  });

  describe('Enums', () => {
    it('should define OperationType enum with required operations', () => {
      // Testing enum exists with MVP operations (AC-007: addition and subtraction)
      expect(OperationType.ADDITION).toBeDefined();
      expect(OperationType.SUBTRACTION).toBeDefined();
    });

    it('should define DifficultyLevel enum with Grade 3 level', () => {
      // Testing difficulty levels align with story requirements (Grade 3 focus)
      expect(DifficultyLevel.GRADE_3).toBeDefined();
    });
  });
});
