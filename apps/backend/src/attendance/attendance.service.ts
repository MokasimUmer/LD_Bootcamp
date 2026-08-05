import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async scanQrCode(organizerId: string, qrToken: string, dayNumber: number) {
    if (dayNumber < 1 || dayNumber > 5) {
      throw new BadRequestException('dayNumber must be between 1 and 5');
    }

    // Find registration by QR token
    const registration = await this.prisma.registration.findUnique({
      where: { qrToken },
      include: {
        developer: {
          select: { id: true, name: true, email: true, lightningAddress: true },
        },
        bootcamp: {
          select: { id: true, title: true, createdById: true },
        },
        attendanceLogs: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Invalid or unrecognized developer QR code');
    }

    // Check duplicate daily scan
    const existingLog = await this.prisma.attendanceLog.findUnique({
      where: {
        registrationId_dayNumber: {
          registrationId: registration.id,
          dayNumber,
        },
      },
    });

    if (existingLog) {
      throw new ConflictException(
        `Developer '${registration.developer.name}' has already checked in for Day ${dayNumber} on ${existingLog.scannedAt.toLocaleTimeString()}`,
      );
    }

    // Record attendance log
    const attendanceLog = await this.prisma.attendanceLog.create({
      data: {
        registrationId: registration.id,
        dayNumber,
        scannedById: organizerId,
      },
      include: {
        scannedBy: { select: { id: true, name: true } },
      },
    });

    // Update status to ATTENDED if first check-in
    if (registration.status === 'REGISTERED') {
      await this.prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'ATTENDED' },
      });
    }

    return {
      success: true,
      message: `Checked in '${registration.developer.name}' for Day ${dayNumber}!`,
      developer: registration.developer,
      bootcamp: registration.bootcamp,
      dayNumber,
      scannedAt: attendanceLog.scannedAt,
    };
  }

  async getBootcampAttendanceLogs(bootcampId: string) {
    const registrations = await this.prisma.registration.findMany({
      where: { bootcampId },
      include: {
        developer: {
          select: { id: true, name: true, email: true, lightningAddress: true },
        },
        attendanceLogs: {
          orderBy: { dayNumber: 'asc' },
          include: {
            scannedBy: { select: { name: true } },
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    return registrations.map((reg) => {
      const daysAttended = reg.attendanceLogs.map((l) => l.dayNumber);
      return {
        registrationId: reg.id,
        developer: reg.developer,
        daysAttended,
        attendanceCount: daysAttended.length,
        status: reg.status,
        attendanceLogs: reg.attendanceLogs,
      };
    });
  }
}
