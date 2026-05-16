import { MathQuestionGenerator } from './math-question-generator.service';
import { DifficultyLevel } from '../entities/math-question.entity';
import { OllamaService } from '../../ai/ollama.service';

describe('MathQuestionGenerator batch context planner', () => {
  const createGenerator = () => {
    const generateMathQuestion = jest
      .fn()
      .mockImplementation(async (request) => ({
        question: '$8 + 4 = ?$',
        answer: 12,
        explanation: 'Add 8 and 4 to get 12.',
        metadata: {
          grade: request.grade,
          topic: request.topic,
          difficulty: request.difficulty,
          country: request.country ?? 'NZ',
          generated_by: 'test-model',
          generation_time: 1,
          latexValid: true,
        },
      }));

    const generator = new MathQuestionGenerator({
      generateMathQuestion,
    } as unknown as OllamaService);

    return { generator, generateMathQuestion };
  };

  it('should never schedule sentence questions for year 2 batches', async () => {
    const { generator } = createGenerator();
    const plans = (generator as any).buildBatchContextPlans(
      2,
      3,
      'ADDITION',
      'hard'
    );

    plans.forEach((plan: NonNullable<(typeof plans)[number]>) => {
      expect(plan.sentenceQuestion).toBe(false);
      expect(plan.simpleWordingOnly).toBe(true);
    });
  });

  it('should spread medium-difficulty batch plans across buckets without consecutive duplicate settings', async () => {
    const { generator, generateMathQuestion } = createGenerator();

    await generator.generateQuestions(
      DifficultyLevel.GRADE_3,
      5,
      'FRACTION_OPERATIONS',
      false,
      'medium'
    );

    const plans = generateMathQuestion.mock.calls.map(
      ([request]) => request.contextPlan
    );

    expect(plans).toHaveLength(5);
    expect(new Set(plans.map((plan) => plan.bucketId)).size).toBe(5);
    expect(plans.filter((plan) => plan.sentenceQuestion)).toHaveLength(3);

    for (let index = 1; index < plans.length; index++) {
      expect(plans[index].scenario).not.toBe(plans[index - 1].scenario);
      expect(plans[index].avoidSettings).toContain(plans[index - 1].scenario);
    }
  });

  it('should honor an explicit year 0 grade override when generating questions', async () => {
    const { generator, generateMathQuestion } = createGenerator();

    await generator.generateQuestions(
      DifficultyLevel.GRADE_3,
      4,
      'ADDITION',
      false,
      'hard',
      0
    );

    const plans = generateMathQuestion.mock.calls.map(
      ([request]) => request.contextPlan
    );

    plans.forEach((plan: NonNullable<(typeof plans)[number]>) => {
      expect(plan.sentenceQuestion).toBe(false);
      expect(plan.simpleWordingOnly).toBe(true);
    });
  });
});
