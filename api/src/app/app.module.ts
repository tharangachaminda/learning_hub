import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MathQuestionsModule } from './math-questions/math-questions.module';

@Module({
  imports: [MathQuestionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
