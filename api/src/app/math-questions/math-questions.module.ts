import { Module } from '@nestjs/common';
import { MathQuestionsController } from './math-questions.controller';
import { MathQuestionGenerator } from './services/math-question-generator.service';
import { AiModule } from '../ai/ai.module';
import { QuestionsModule } from '../questions/questions.module';

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
  imports: [AiModule, QuestionsModule],
  controllers: [MathQuestionsController],
  providers: [MathQuestionGenerator],
  exports: [MathQuestionGenerator],
})
export class MathQuestionsModule {}
