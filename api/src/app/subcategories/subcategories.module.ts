import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategory, SubCategorySchema } from './schemas/subcategory.schema';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { SubCategoriesService } from './subcategories.service';
import { SubCategoriesController } from './subcategories.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * NestJS module for sub-category taxonomy management, scoped to a
 * (question category, difficulty) pair.
 *
 * @example
 * ```typescript
 * import { SubCategoriesModule } from './subcategories/subcategories.module';
 *
 * @Module({
 *   imports: [SubCategoriesModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
    AuthModule,
  ],
  controllers: [SubCategoriesController],
  providers: [SubCategoriesService],
  exports: [SubCategoriesService],
})
export class SubCategoriesModule {}
