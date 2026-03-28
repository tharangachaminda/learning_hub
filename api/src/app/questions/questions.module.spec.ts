import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from './schemas/question.schema';
import { LessonLearned } from './schemas/lesson-learned.schema';
import { MathQuestionGenerator } from '../math-questions/services/math-question-generator.service';
import { OllamaService } from '../ai/ollama.service';

describe('QuestionsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        QuestionsService,
        MathQuestionGenerator,
        {
          provide: getModelToken(Question.name),
          useValue: {
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            create: jest.fn(),
            countDocuments: jest.fn(),
            insertMany: jest.fn(),
          },
        },
        {
          provide: getModelToken(LessonLearned.name),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
        {
          provide: OllamaService,
          useValue: { generateRaw: jest.fn() },
        },
      ],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide QuestionsService', () => {
    const service = module.get<QuestionsService>(QuestionsService);
    expect(service).toBeDefined();
  });

  it('should provide QuestionsController', () => {
    const controller = module.get<QuestionsController>(QuestionsController);
    expect(controller).toBeDefined();
  });
});
