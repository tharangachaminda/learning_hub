import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuestionsModule } from './questions.module';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from './schemas/question.schema';
import { MathQuestionGenerator } from '../math-questions/services/math-question-generator.service';

describe('QuestionsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [QuestionsModule],
    })
      .overrideProvider(getModelToken(Question.name))
      .useValue({
        find: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        countDocuments: jest.fn(),
        insertMany: jest.fn(),
      })
      .overrideProvider(MathQuestionGenerator)
      .useValue({
        generateQuestions: jest.fn(),
      })
      .compile();
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
