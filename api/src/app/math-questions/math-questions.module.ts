import { Module } from '@nestjs/common';
import { MathQuestionsController } from './math-questions.controller';
import { MathQuestionGenerator } from './services/math-question-generator.service';

/**
 * NestJS module for mathematical question generation functionality
 * Organizes controllers, services, and providers for the math questions feature
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
  controllers: [MathQuestionsController],
  providers: [MathQuestionGenerator],
  exports: [MathQuestionGenerator], // Allow other modules to use the generator service
})
export class MathQuestionsModule {}
