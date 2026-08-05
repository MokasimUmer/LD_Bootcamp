import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a cryptographic QR token for developer attendance badges
   */
  private generateQrToken(developerId: string, bootcampId: string): string {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const hmac = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'afr_lightning_secret_key_jwt_2026')
      .update(`${developerId}:${bootcampId}:${randomBytes}`)
      .digest('hex');
    return `AFR-${developerId.slice(0, 8)}-${hmac.slice(0, 16)}`;
  }

  async registerDeveloper(developerId: string, bootcampId: string) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id: bootcampId },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!bootcamp) {
      throw new NotFoundException('Bootcamp not found');
    }

    if (bootcamp._count.registrations >= bootcamp.maxSeats) {
      throw new BadRequestException('Bootcamp is at full capacity (0 seats remaining)');
    }

    const existing = await this.prisma.registration.findUnique({
      where: {
        developerId_bootcampId: { developerId, bootcampId },
      },
    });

    if (existing) {
      throw new ConflictException('You are already registered for this bootcamp');
    }

    const qrToken = this.generateQrToken(developerId, bootcampId);

    const registration = await this.prisma.registration.create({
      data: {
        developerId,
        bootcampId,
        qrToken,
      },
      include: {
        bootcamp: {
          include: {
            city: { include: { country: true } },
          },
        },
        developer: {
          select: { id: true, name: true, email: true, lightningAddress: true },
        },
      },
    });

    return registration;
  }

  async getDeveloperRegistrations(developerId: string) {
    return this.prisma.registration.findMany({
      where: { developerId },
      include: {
        bootcamp: {
          include: {
            city: { include: { country: true } },
            createdBy: { select: { name: true, email: true } },
          },
        },
        attendanceLogs: {
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async getRegistrationByQrToken(qrToken: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { qrToken },
      include: {
        developer: {
          select: { id: true, name: true, email: true, lightningAddress: true },
        },
        bootcamp: {
          include: { city: { include: { country: true } } },
        },
        attendanceLogs: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Invalid or expired QR token');
    }

    return registration;
  }
}
