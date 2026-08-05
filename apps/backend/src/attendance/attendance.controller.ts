import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
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
}

@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Post('scan')
  async scan(@Request() req: any, @Body() dto: ScanAttendanceDto) {
    return this.attendanceService.scanQrCode(req.user.id, dto.qrToken, Number(dto.dayNumber));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Get('bootcamp/:bootcampId')
  async getBootcampLogs(@Param('bootcampId') bootcampId: string) {
    return this.attendanceService.getBootcampAttendanceLogs(bootcampId);
  }
}
