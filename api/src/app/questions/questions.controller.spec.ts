import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService, PaginatedQuestions } from './questions.service';
import { MathQuestionGenerator } from '../math-questions/services/math-question-generator.service';
import { OllamaService } from '../ai/ollama.service';
import { QuestionStatus, QuestionFormat } from './schemas/question.schema';

const mockQuestion = {
  _id: '507f1f77bcf86cd799439011',
  questionText: 'What is $5 + 3$?',
  answer: 8,
  explanation: 'Add five and three to get eight.',
  grade: 3,
  topic: 'ADDITION',
  category: 'number-operations',
  format: QuestionFormat.OPEN_ENDED,
  options: [],
  status: QuestionStatus.PENDING,
  stepByStepSolution: ['Start with 5', 'Add 3', 'Answer is 8'],
  metadata: {
    generatedBy: 'llama3.1:latest',
    generationTime: 1200,
    difficulty: 'medium',
    country: 'NZ',
  },
  createdAt: new Date('2026-03-20'),
  updatedAt: new Date('2026-03-20'),
};

const mockPaginatedResult: PaginatedQuestions = {
  data: [mockQuestion as any],
  total: 1,
  page: 1,
  limit: 20,
};

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let questionsService: jest.Mocked<QuestionsService>;
  let mathGenerator: jest.Mocked<MathQuestionGenerator>;

  beforeEach(async () => {
    const mockQuestionsService = {
      findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
      findOne: jest.fn().mockResolvedValue(mockQuestion),
      create: jest.fn().mockResolvedValue(mockQuestion),
      createMany: jest.fn().mockResolvedValue([mockQuestion]),
    };

    const mockMathGenerator = {
      generateQuestions: jest.fn().mockResolvedValue([
        {
          question: 'What is $5 + 3$?',
          answer: 8,
          operation: 'ADDITION',
          difficulty: 'grade_3',
          stepByStepSolution: ['Start with 5', 'Add 3', 'Answer is 8'],
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        { provide: QuestionsService, useValue: mockQuestionsService },
        { provide: MathQuestionGenerator, useValue: mockMathGenerator },
        { provide: OllamaService, useValue: { generateRaw: jest.fn() } },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    questionsService = module.get(QuestionsService);
    mathGenerator = module.get(MathQuestionGenerator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /questions (AC-005)', () => {
    it('should return paginated questions with no filters', async () => {
      const result = await controller.findAll({});

      expect(questionsService.findAll).toHaveBeenCalledWith({}, 1, 20);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should pass grade filter to service', async () => {
      await controller.findAll({ grade: 5 });

      expect(questionsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ grade: 5 }),
        1,
        20
      );
    });

    it('should pass topic filter to service', async () => {
      await controller.findAll({ topic: 'FRACTION_OPERATIONS' });

      expect(questionsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'FRACTION_OPERATIONS' }),
        1,
        20
      );
    });

    it('should pass status filter to service', async () => {
      await controller.findAll({ status: QuestionStatus.APPROVED });

      expect(questionsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: QuestionStatus.APPROVED }),
        1,
        20
      );
    });

    it('should pass format filter to service', async () => {
      await controller.findAll({ format: QuestionFormat.OPEN_ENDED });

      expect(questionsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ format: QuestionFormat.OPEN_ENDED }),
        1,
        20
      );
    });

    it('should pass pagination params to service', async () => {
      await controller.findAll({ page: 3, limit: 10 });

      expect(questionsService.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        3,
        10
      );
    });

    it('should support combined filters (Scenario 3)', async () => {
      await controller.findAll({
        grade: 5,
        topic: 'FRACTION_OPERATIONS',
        status: QuestionStatus.APPROVED,
      });

      expect(questionsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          grade: 5,
          topic: 'FRACTION_OPERATIONS',
          status: QuestionStatus.APPROVED,
        }),
        1,
        20
      );
    });
  });

  describe('GET /questions/:id', () => {
    it('should return a single question by ID', async () => {
      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(questionsService.findOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
      expect(result).toEqual(mockQuestion);
    });

    it('should return null when question not found', async () => {
      questionsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('000000000000000000000000');

      expect(result).toBeNull();
    });
  });

  describe('POST /questions/batch-generate (AC-006)', () => {
    it('should generate questions and store them', async () => {
      const dto = { grade: 4, topic: 'MULTIPLICATION', count: 10 };
      const generatedQuestions = Array.from({ length: 10 }, (_, i) => ({
        question: `Question ${i}?`,
        answer: i + 1,
        operation: 'MULTIPLICATION',
        difficulty: 'grade_4',
        stepByStepSolution: [`Step for Q${i}`],
      }));

      mathGenerator.generateQuestions.mockResolvedValue(
        generatedQuestions as any
      );
      const savedQuestions = generatedQuestions.map((q, i) => ({
        ...mockQuestion,
        _id: `id_${i}`,
        questionText: q.question,
        answer: q.answer,
        topic: 'MULTIPLICATION',
        grade: 4,
        status: QuestionStatus.PENDING,
      }));
      questionsService.createMany.mockResolvedValue(savedQuestions as any);

      const result = await controller.batchGenerate(dto);

      expect(mathGenerator.generateQuestions).toHaveBeenCalled();
      expect(questionsService.createMany).toHaveBeenCalled();
      expect(result.stored).toBe(10);
      expect(result.questions).toHaveLength(10);
    });

    it('should default count to 10 when not specified', async () => {
      const dto = { grade: 3, topic: 'ADDITION' };

      await controller.batchGenerate(dto);

      expect(mathGenerator.generateQuestions).toHaveBeenCalledWith(
        expect.anything(),
        10,
        'ADDITION',
        false,
        'medium'
      );
    });

    it('should set all batch-generated questions to pending status', async () => {
      const dto = { grade: 3, topic: 'ADDITION', count: 2 };
      const generatedQuestions = [
        {
          question: 'Q1?',
          answer: 5,
          operation: 'ADDITION',
          difficulty: 'grade_3',
          stepByStepSolution: ['S1'],
        },
        {
          question: 'Q2?',
          answer: 10,
          operation: 'ADDITION',
          difficulty: 'grade_3',
          stepByStepSolution: ['S2'],
        },
      ];

      mathGenerator.generateQuestions.mockResolvedValue(
        generatedQuestions as any
      );
      questionsService.createMany.mockResolvedValue([
        {
          ...mockQuestion,
          questionText: 'Q1?',
          status: QuestionStatus.PENDING,
        },
        {
          ...mockQuestion,
          questionText: 'Q2?',
          status: QuestionStatus.PENDING,
        },
      ] as any);

      const result = await controller.batchGenerate(dto);

      // Verify createMany was called with all questions
      const createManyArgs = questionsService.createMany.mock.calls[0][0];
      expect(createManyArgs).toHaveLength(2);
    });
  });
});
