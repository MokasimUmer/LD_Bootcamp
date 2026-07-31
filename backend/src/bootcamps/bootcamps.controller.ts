import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BootcampsService } from './bootcamps.service';
import { CreateBootcampDto, UpdateBootcampDto } from './dto/bootcamp.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

export class UpdateDayCurriculumDto {
  title?: string;
  contentMarkdown?: string;
  tasks?: string[];
  quizDifficulty?: string;
}

export class ToggleQuizUnlockDto {
  dayNumber: number;
  unlocked: boolean;
  timeLimitMinutes?: number;
}

@Controller('api/bootcamps')
export class BootcampsController {
  constructor(private readonly bootcampsService: BootcampsService) {}

  @Get()
  async findAll(@Query('cityId') cityId?: string, @Query('countryId') countryId?: string) {
    return this.bootcampsService.findAll(cityId, countryId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bootcampsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateBootcampDto) {
    return this.bootcampsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateBootcampDto) {
    return this.bootcampsService.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Put(':id/curriculum/day/:dayNumber')
  async updateCurriculum(
    @Param('id') id: string,
    @Param('dayNumber') dayNumber: string,
    @Request() req: any,
    @Body() dto: UpdateDayCurriculumDto,
  ) {
    return this.bootcampsService.updateDayCurriculum(id, req.user.id, Number(dayNumber), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Put(':id/quiz/unlock')
  async toggleQuiz(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ToggleQuizUnlockDto,
  ) {
    return this.bootcampsService.toggleQuizUnlock(
      id,
      req.user.id,
      Number(dto.dayNumber),
      Boolean(dto.unlocked),
      dto.timeLimitMinutes !== undefined ? Number(dto.timeLimitMinutes) : undefined,
    );
  }
}
