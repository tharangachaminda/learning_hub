/**
 * Students Module
 *
 * Provides student-facing dashboard endpoints for US-UI-S-002.
 * Aggregates data from the ProgressModule services and the User model
 * to produce the composite payloads consumed by the student-app frontend.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { ProgressModule } from '../progress/progress.module';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentDashboardService } from './student-dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProgressModule,
  ],
  controllers: [StudentDashboardController],
  providers: [StudentDashboardService],
  exports: [StudentDashboardService],
})
export class StudentsModule {}
