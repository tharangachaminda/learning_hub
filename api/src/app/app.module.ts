import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MathQuestionsModule } from './math-questions/math-questions.module';
import { OpenSearchModule } from './opensearch/opensearch.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OpenSearchModule,
    MathQuestionsModule,
    ProgressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
