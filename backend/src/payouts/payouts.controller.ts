import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PayoutsService, ProcessPayoutDto } from './payouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post('process')
  async processPayout(@Body() dto: ProcessPayoutDto) {
    return this.payoutsService.processPayout(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Get('bootcamp/:bootcampId')
  async getBootcampPayouts(@Param('bootcampId') bootcampId: string) {
    return this.payoutsService.getBootcampPayouts(bootcampId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-payouts')
  async getMyPayouts(@Request() req: any) {
    return this.payoutsService.getDeveloperPayouts(req.user.id);
  }
}
