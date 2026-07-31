import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { BootcampsModule } from './bootcamps/bootcamps.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { AttendanceModule } from './attendance/attendance.module';
import { QuizModule } from './quiz/quiz.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { PayoutsModule } from './payouts/payouts.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LocationsModule,
    BootcampsModule,
    RegistrationsModule,
    AttendanceModule,
    QuizModule,
    SubmissionsModule,
    PayoutsModule,
  ],
})
export class AppModule {}
