import { MathQuestionGenerator } from './math-question-generator.service';
import { DifficultyLevel } from '../entities/math-question.entity';
import { OllamaService } from '../../ai/ollama.service';
import { SubCategoriesService } from '../../subcategories/subcategories.service';

/**
 * Covers the sub-category round-robin distribution logic added for RAG
 * retrieval coverage (see openspec/changes/add-question-subcategory-tagging):
 * generation should spread the requested count evenly across every
 * sub-category available for the topic's category + difficulty, and fall
 * back to today's single-pool behavior (no sub-category) when none exist.
 */
describe('MathQuestionGenerator — sub-category distribution', () => {
  let mockOllamaService: jest.Mocked<Partial<OllamaService>>;
  let mockSubCategoriesService: jest.Mocked<Partial<SubCategoriesService>>;

  const buildGeneratedQuestion = (index: number) => ({
    question: `What is $${index} + 1$?`,
    answer: index + 1,
    explanation: 'Add one.',
    options: [],
    visualSelections: [],
    visuals: [],
  });

  beforeEach(() => {
    let callCount = 0;
    mockOllamaService = {
      generateMathQuestion: jest
        .fn()
        .mockImplementation(async () => buildGeneratedQuestion(callCount++)),
    };
    mockSubCategoriesService = {
      list: jest.fn(),
    };
  });

  function buildGenerator(): MathQuestionGenerator {
    return new MathQuestionGenerator(
      mockOllamaService as unknown as OllamaService,
      undefined,
      mockSubCategoriesService as unknown as SubCategoriesService
    );
  }

  it('distributes count evenly across sub-categories with remainder to the first ones', async () => {
    (mockSubCategoriesService.list as jest.Mock).mockResolvedValue([
      {
        slug: 'skip-counting',
        name: 'Skip Counting',
        description: 'Counting up or down in equal steps',
      },
      { slug: 'word-problems', name: 'Word Problems', description: undefined },
      {
        slug: 'number-lines',
        name: 'Number Lines',
        description: 'Using a number line to add or subtract',
      },
    ]);

    const generator = buildGenerator();
    const questions = await generator.generateQuestions(
      DifficultyLevel.GRADE_3,
      5,
      'ADDITION',
      false,
      'medium',
      3
    );

    expect(questions).toHaveLength(5);
    expect(questions.map((q) => q.subCategory)).toEqual([
      'skip-counting',
      'word-problems',
      'number-lines',
      'skip-counting',
      'word-problems',
    ]);

    const calledSubCategories = (
      mockOllamaService.generateMathQuestion as jest.Mock
    ).mock.calls.map(([request]) => request.subCategory);
    expect(calledSubCategories).toEqual([
      {
        slug: 'skip-counting',
        name: 'Skip Counting',
        description: 'Counting up or down in equal steps',
      },
      { slug: 'word-problems', name: 'Word Problems', description: undefined },
      {
        slug: 'number-lines',
        name: 'Number Lines',
        description: 'Using a number line to add or subtract',
      },
      {
        slug: 'skip-counting',
        name: 'Skip Counting',
        description: 'Counting up or down in equal steps',
      },
      { slug: 'word-problems', name: 'Word Problems', description: undefined },
    ]);
  });

  it('falls back to no sub-category assignment when none are defined yet', async () => {
    (mockSubCategoriesService.list as jest.Mock).mockResolvedValue([]);

    const generator = buildGenerator();
    const questions = await generator.generateQuestions(
      DifficultyLevel.GRADE_3,
      3,
      'ADDITION',
      false,
      'medium',
      3
    );

    expect(questions).toHaveLength(3);
    questions.forEach((q) => expect(q.subCategory).toBeUndefined());

    const calledSubCategories = (
      mockOllamaService.generateMathQuestion as jest.Mock
    ).mock.calls.map(([request]) => request.subCategory);
    expect(calledSubCategories).toEqual([undefined, undefined, undefined]);
  });

  it('falls back to no sub-category assignment when SubCategoriesService is not available', async () => {
    const generator = new MathQuestionGenerator(
      mockOllamaService as unknown as OllamaService,
      undefined,
      undefined
    );

    const questions = await generator.generateQuestions(
      DifficultyLevel.GRADE_3,
      2,
      'ADDITION',
      false,
      'medium',
      3
    );

    expect(questions).toHaveLength(2);
    questions.forEach((q) => expect(q.subCategory).toBeUndefined());
    expect(mockSubCategoriesService.list).not.toHaveBeenCalled();
  });

  it('queries sub-categories using the topic-resolved category and requested difficulty', async () => {
    (mockSubCategoriesService.list as jest.Mock).mockResolvedValue([]);

    const generator = buildGenerator();
    await generator.generateQuestions(
      DifficultyLevel.GRADE_3,
      1,
      'ADDITION',
      false,
      'hard',
      3
    );

    expect(mockSubCategoriesService.list).toHaveBeenCalledWith(
      'number-operations',
      'hard'
    );
  });
});
