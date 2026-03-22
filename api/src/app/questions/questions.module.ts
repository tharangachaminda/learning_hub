import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schemas/question.schema';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { MathQuestionGenerator } from '../math-questions/services/math-question-generator.service';
import { AiModule } from '../ai/ai.module';

/**
 * NestJS module for question persistence and retrieval.
 *
 * Registers the {@link Question} Mongoose schema, exposes {@link QuestionsService}
 * for CRUD operations, and provides REST endpoints via {@link QuestionsController}.
 *
 * @example
 * ```typescript
 * import { QuestionsModule } from './questions/questions.module';
 *
 * @Module({
 *   imports: [QuestionsModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
    AiModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, MathQuestionGenerator],
  exports: [QuestionsService],
})
export class QuestionsModule {}
