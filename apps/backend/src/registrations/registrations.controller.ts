import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER, Role.ADMIN)
  @Post()
  async register(@Request() req: any, @Body('bootcampId') bootcampId: string) {
    return this.registrationsService.registerDeveloper(req.user.id, bootcampId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-registrations')
  async getMyRegistrations(@Request() req: any) {
    return this.registrationsService.getDeveloperRegistrations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('qr-badge/:token')
  async getByQrToken(@Param('token') token: string) {
    return this.registrationsService.getRegistrationByQrToken(token);
  }
}
