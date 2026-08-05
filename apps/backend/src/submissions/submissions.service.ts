import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  bootcampId: string;

  @IsString()
  @IsNotEmpty()
  githubUrl: string;

  @IsString()
  @IsOptional()
  demoUrl?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ReviewSubmissionDto {
  @IsNumber()
  @IsNotEmpty()
  rating: number; // 0.0 - 10.0 scale

  @IsString()
  @IsOptional()
  reviewComment?: string;
}

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async createSubmission(developerId: string, dto: CreateSubmissionDto) {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: dto.bootcampId } });
    if (!bootcamp) {
      throw new NotFoundException('Bootcamp not found');
    }

    const registration = await this.prisma.registration.findUnique({
      where: {
        developerId_bootcampId: { developerId, bootcampId: dto.bootcampId },
      },
    });

    if (!registration) {
      throw new ForbiddenException('You must be registered in this bootcamp to submit a Day 5 project');
    }

    const existing = await this.prisma.submission.findUnique({
      where: {
        developerId_bootcampId: { developerId, bootcampId: dto.bootcampId },
      },
    });

    if (existing) {
      // Update existing submission
      return this.prisma.submission.update({
        where: { id: existing.id },
        data: {
          githubUrl: dto.githubUrl,
          demoUrl: dto.demoUrl || null,
          description: dto.description,
        },
      });
    }

    return this.prisma.submission.create({
      data: {
        developerId,
        bootcampId: dto.bootcampId,
        githubUrl: dto.githubUrl,
        demoUrl: dto.demoUrl || null,
        description: dto.description,
      },
      include: {
        developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
      },
    });
  }

  async getBootcampSubmissions(bootcampId: string) {
    return this.prisma.submission.findMany({
      where: { bootcampId },
      include: {
        developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
        reviewedBy: { select: { id: true, name: true } },
        payouts: true,
      },
      orderBy: [{ rating: 'desc' }, { submittedAt: 'asc' }],
    });
  }

  async reviewSubmission(submissionId: string, organizerId: string, dto: ReviewSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (dto.rating < 0 || dto.rating > 10) {
      throw new ForbiddenException('Rating must be between 0.0 and 10.0');
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        rating: dto.rating,
        reviewComment: dto.reviewComment || null,
        reviewedById: organizerId,
      },
      include: {
        developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  }
}
