import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SubmissionsService, CreateSubmissionDto, ReviewSubmissionDto } from './submissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER, Role.ADMIN)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.createSubmission(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bootcamp/:bootcampId')
  async getByBootcamp(@Param('bootcampId') bootcampId: string) {
    return this.submissionsService.getBootcampSubmissions(bootcampId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Put(':id/review')
  async review(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.submissionsService.reviewSubmission(id, req.user.id, dto);
  }
}
