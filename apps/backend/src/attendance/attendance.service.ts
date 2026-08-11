import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async scanQrCode(organizerId: string, qrToken: string, dayNumber: number, bootcampId?: string) {
    if (dayNumber < 1 || dayNumber > 5) {
      throw new BadRequestException('Day number must be between 1 and 5');
    }

    // Find registration by QR token
    const registration = await this.prisma.registration.findUnique({
      where: { qrToken },
      include: {
        developer: {
          select: { id: true, name: true, email: true, lightningAddress: true },
        },
        bootcamp: {
          select: { id: true, title: true, createdById: true, curriculum: true },
        },
        attendanceLogs: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Invalid or unrecognized developer QR badge token');
    }

    // Validation 1: Verify badge matches the selected bootcamp
    if (bootcampId && registration.bootcampId !== bootcampId) {
      throw new BadRequestException(
        `Wrong Bootcamp: Developer '${registration.developer.name}' is registered for '${registration.bootcamp.title}', not this bootcamp.`
      );
    }

    // Validation 2: Check if Day N attendance session has been ended/closed by organizer
    const curriculum = (registration.bootcamp.curriculum as any[]) || [];
    const dayCurriculum = curriculum.find((c: any) => c.day === dayNumber);
    if (dayCurriculum?.attendanceClosed) {
      throw new BadRequestException(
        `Check-in Rejected: Day ${dayNumber} attendance session is closed. Unscanned developers are marked absent.`
      );
    }

    // Validation 3: Check duplicate daily scan
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
        `Already Checked In: Developer '${registration.developer.name}' was already marked present for Day ${dayNumber} at ${new Date(existingLog.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.`
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
      message: `Verified & Checked In '${registration.developer.name}' for Day ${dayNumber}!`,
      developer: registration.developer,
      bootcamp: { id: registration.bootcamp.id, title: registration.bootcamp.title },
      dayNumber,
      scannedAt: attendanceLog.scannedAt,
    };
  }

  async toggleAttendanceSession(bootcampId: string, dayNumber: number, closed: boolean) {
    if (dayNumber < 1 || dayNumber > 5) {
      throw new BadRequestException('Day number must be between 1 and 5');
    }

    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: bootcampId } });
    if (!bootcamp) throw new NotFoundException('Bootcamp not found');

    const curriculum = ((bootcamp.curriculum as any[]) || []).slice();
    const dayIndex = curriculum.findIndex((c: any) => c.day === dayNumber);

    if (dayIndex >= 0) {
      curriculum[dayIndex] = {
        ...curriculum[dayIndex],
        attendanceClosed: closed,
        attendanceClosedAt: closed ? new Date().toISOString() : null,
      };
    } else {
      curriculum.push({
        day: dayNumber,
        title: `Day ${dayNumber} Curriculum`,
        contentMarkdown: '',
        tasks: [],
        resources: [],
        quizDifficulty: 'MEDIUM',
        quizUnlocked: false,
        attendanceClosed: closed,
        attendanceClosedAt: closed ? new Date().toISOString() : null,
      });
    }

    const updatedBootcamp = await this.prisma.bootcamp.update({
      where: { id: bootcampId },
      data: { curriculum: curriculum as any },
    });

    return {
      success: true,
      bootcampId,
      dayNumber,
      attendanceClosed: closed,
      message: closed
        ? `Day ${dayNumber} session closed. Unscanned developers are now marked absent.`
        : `Day ${dayNumber} session reopened. Attendance scanning is active.`,
      curriculum: updatedBootcamp.curriculum,
    };
  }

  async getBootcampAttendanceLogs(bootcampId: string) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id: bootcampId },
      select: { id: true, title: true, curriculum: true },
    });

    const curriculum = ((bootcamp?.curriculum as any[]) || []);
    const closedDaysSet = new Set(
      curriculum.filter((c: any) => c.attendanceClosed).map((c: any) => c.day)
    );

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

    return {
      bootcampId,
      closedDays: Array.from(closedDaysSet),
      curriculum,
      registrations: registrations.map((reg) => {
        const attendedDaysMap = new Map(
          reg.attendanceLogs.map((l) => [l.dayNumber, l.scannedAt])
        );

        const daysStatus: { [day: number]: { status: 'PRESENT' | 'ABSENT' | 'OPEN' | 'UPCOMING'; scannedAt?: Date } } = {};

        for (let d = 1; d <= 5; d++) {
          if (attendedDaysMap.has(d)) {
            daysStatus[d] = { status: 'PRESENT', scannedAt: attendedDaysMap.get(d) };
          } else if (closedDaysSet.has(d)) {
            daysStatus[d] = { status: 'ABSENT' };
          } else {
            daysStatus[d] = { status: 'OPEN' };
          }
        }

        const daysAttended = reg.attendanceLogs.map((l) => l.dayNumber);

        return {
          registrationId: reg.id,
          developer: reg.developer,
          qrToken: reg.qrToken,
          daysAttended,
          attendanceCount: daysAttended.length,
          status: reg.status,
          daysStatus,
          attendanceLogs: reg.attendanceLogs,
        };
      }),
    };
  }
}
