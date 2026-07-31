import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

export class SubmitQuizDto {
  bootcampId: string;
  dayNumber: number;
  answers: { questionId: number; selectedIndex: number }[];
}

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @UseGuards(JwtAuthGuard)
  @Get('bootcamp/:bootcampId/day/:dayNumber')
  async getQuiz(
    @Param('bootcampId') bootcampId: string,
    @Param('dayNumber') dayNumber: string,
  ) {
    return this.quizService.generateDailyQuiz(bootcampId, Number(dayNumber));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER, Role.ADMIN)
  @Post('submit')
  async submitQuiz(@Request() req: any, @Body() dto: SubmitQuizDto) {
    return this.quizService.submitQuizAnswers(
      req.user.id,
      dto.bootcampId,
      Number(dto.dayNumber),
      dto.answers,
    );
  }

  @Get('leaderboard/:bootcampId/day/:dayNumber')
  async getLeaderboard(
    @Param('bootcampId') bootcampId: string,
    @Param('dayNumber') dayNumber: string,
  ) {
    return this.quizService.getLiveLeaderboard(bootcampId, Number(dayNumber));
  }
}
