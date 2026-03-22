import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MathQuestionsController } from './math-questions.controller';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import { AiModule } from '../ai/ai.module';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { QuestionsService } from '../questions/questions.service';

/**
 * NestJS module for mathematical question generation functionality
 * Integrates AI-powered generation with deterministic fallback
 *
 * @example
 * ```typescript
 * // Import in app.module.ts
 * import { MathQuestionsModule } from './math-questions/math-questions.module';
 *
 * @Module({
 *   imports: [MathQuestionsModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [MathQuestionsController],
  providers: [MathQuestionGenerator, QuestionsService],
  exports: [MathQuestionGenerator],
})
export class MathQuestionsModule {}
