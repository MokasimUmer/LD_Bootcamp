import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { RedisService } from './redis.service';
import { LeaderboardGateway } from './leaderboard.gateway';

@Module({
  controllers: [QuizController],
  providers: [QuizService, RedisService, LeaderboardGateway],
  exports: [QuizService, RedisService, LeaderboardGateway],
})
export class QuizModule {}
