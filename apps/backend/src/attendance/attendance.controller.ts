import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

export class ScanAttendanceDto {
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @IsNumber()
  @IsNotEmpty()
  dayNumber: number;

  @IsString()
  @IsOptional()
  bootcampId?: string;
}

export class ToggleSessionDto {
  @IsBoolean()
  @IsNotEmpty()
  closed: boolean;
}

@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post('scan')
  async scan(@Request() req: any, @Body() dto: ScanAttendanceDto) {
    return this.attendanceService.scanQrCode(
      req.user.id,
      dto.qrToken,
      Number(dto.dayNumber),
      dto.bootcampId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Get('bootcamp/:bootcampId')
  async getBootcampLogs(@Param('bootcampId') bootcampId: string) {
    return this.attendanceService.getBootcampAttendanceLogs(bootcampId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Put('bootcamp/:bootcampId/day/:dayNumber/toggle-session')
  async toggleSession(
    @Param('bootcampId') bootcampId: string,
    @Param('dayNumber') dayNumber: string,
    @Body() dto: ToggleSessionDto,
  ) {
    return this.attendanceService.toggleAttendanceSession(
      bootcampId,
      Number(dayNumber),
      dto.closed,
    );
  }
}
