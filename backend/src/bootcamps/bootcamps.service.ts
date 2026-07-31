import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBootcampDto, UpdateBootcampDto } from './dto/bootcamp.dto';

export interface CurriculumDayDto {
  day: number;
  title: string;
  contentMarkdown: string;
  tasks?: string[];
  quizDifficulty?: string;
  quizUnlocked?: boolean;
  timeLimitMinutes?: number;
  quizStartedAt?: string;
}

@Injectable()
export class BootcampsService {
  constructor(private prisma: PrismaService) {}

  async create(organizerId: string, dto: CreateBootcampDto) {
    // Step 1: Try direct UUID lookup
    let city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
      include: { country: true },
    }).catch(() => null);

    // Step 2: If UUID failed, resolve by cityName + countryCode
    if (!city && dto.cityName && dto.countryCode) {
      const country = await this.prisma.country.findFirst({
        where: { code: dto.countryCode },
      });
      if (country) {
        city = await this.prisma.city.findFirst({
          where: { name: dto.cityName, countryId: country.id },
          include: { country: true },
        });
        // If city doesn't exist yet, create it
        if (!city) {
          city = await this.prisma.city.create({
            data: { name: dto.cityName, countryId: country.id },
            include: { country: true },
          });
        }
      } else {
        // Country doesn't exist either — create both
        const newCountry = await this.prisma.country.create({
          data: { name: dto.countryCode, code: dto.countryCode },
        });
        city = await this.prisma.city.create({
          data: { name: dto.cityName, countryId: newCountry.id },
          include: { country: true },
        });
      }
    }

    // Step 3: Final fallback — pick first city in DB
    if (!city) {
      city = await this.prisma.city.findFirst({
        include: { country: true },
      });
    }

    if (!city) {
      throw new NotFoundException('No cities available in the database. Please seed locations first.');
    }

    const defaultCurriculum: CurriculumDayDto[] = dto.curriculum || [
      {
        day: 1,
        title: 'Introduction to Bitcoin & Lightning Network Protocols',
        contentMarkdown: '# Day 1: Bitcoin & Lightning Fundamentals\n\nWelcome to Day 1 of the Africa Free Routing (AFR) Bootcamp! Today we explore payment channels, HTLCs, and Lightning Node architecture.',
        tasks: [
          'Understand Payment Channels & Off-Chain Balance Updates',
          'Learn Hashed Timelock Contracts (HTLCs) and Revocation Secrets',
          'Explore Lightning Node Architecture (LND / Core Lightning)',
        ],
        quizDifficulty: 'EASY',
        quizUnlocked: false,
      },
      {
        day: 2,
        title: 'LNURL Specs & LUD-16 Lightning Addresses',
        contentMarkdown: '# Day 2: LNURL Specs & Lightning Addresses\n\nLearn how LUD-06 (LNURL-pay) and LUD-16 (Lightning Addresses) work to create human-readable payment endpoints.',
        tasks: [
          'Understand LUD-16 DNS email-like identifier resolution',
          'Inspect .well-known/lnurlp/<username> HTTP JSON specs',
          'Request BOLT-11 invoices with millisatoshi amounts',
        ],
        quizDifficulty: 'MEDIUM',
        quizUnlocked: false,
      },
      {
        day: 3,
        title: 'Building Lightning Apps with WebLN & LND REST APIs',
        contentMarkdown: '# Day 3: Developer Tooling & Node APIs\n\nIntegrate WebLN in browser apps, interact with LND / Core Lightning REST APIs, and verify invoice preimages.',
        tasks: [
          'Integrate WebLN in browser applications',
          'Connect to LND REST API using macaroon headers',
          'Verify 32-byte payment preimage settlement proofs',
        ],
        quizDifficulty: 'MEDIUM',
        quizUnlocked: false,
      },
      {
        day: 4,
        title: 'Routing Topology, Fees & Liquidity Management',
        contentMarkdown: '# Day 4: Channel Management & Routing\n\nAnalyze liquidity balancing, channel rebalancing, zero-conf channels, and fee policies in African routing nodes.',
        tasks: [
          'Understand channel rebalancing & submarine swaps',
          'Configure routing fee schedules for high throughput',
          'Analyze node topology and peer connectivity in African hubs',
        ],
        quizDifficulty: 'HARD',
        quizUnlocked: false,
      },
      {
        day: 5,
        title: 'Day 5 Hackathon: Build & Submit Lightning Apps',
        contentMarkdown: '# Day 5: Hackathon Day!\n\nBuild your Lightning application, submit your GitHub repository link and demo URL to compete for prize payouts in satoshis.',
        tasks: [
          'Complete Lightning Web App implementation',
          'Deploy live demo and verify WebLN / LNURL payment flow',
          'Submit GitHub repo link & description to Day 5 Portal',
        ],
        quizDifficulty: 'HARD',
        quizUnlocked: false,
      },
    ];

    return this.prisma.bootcamp.create({
      data: {
        title: dto.title,
        description: dto.description,
        cityId: city.id,
        maxSeats: dto.maxSeats,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        curriculum: defaultCurriculum as any,
        createdById: organizerId,
      },
      include: {
        city: {
          include: { country: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async findAll(cityId?: string, countryId?: string) {
    const whereClause: any = {};

    if (cityId) {
      whereClause.cityId = cityId;
    } else if (countryId) {
      whereClause.city = { countryId };
    }

    const bootcamps = await this.prisma.bootcamp.findMany({
      where: whereClause,
      include: {
        city: {
          include: { country: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return bootcamps.map((b) => ({
      ...b,
      registeredCount: b._count.registrations,
      remainingSeats: Math.max(0, b.maxSeats - b._count.registrations),
      isFull: b._count.registrations >= b.maxSeats,
    }));
  }

  async findOne(id: string) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id },
      include: {
        city: {
          include: { country: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        registrations: {
          include: {
            developer: {
              select: { id: true, name: true, email: true, lightningAddress: true },
            },
            attendanceLogs: true,
          },
        },
        submissions: {
          include: {
            developer: {
              select: { id: true, name: true, email: true, lightningAddress: true },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!bootcamp) {
      throw new NotFoundException('Bootcamp not found');
    }

    return {
      ...bootcamp,
      registeredCount: bootcamp._count.registrations,
      remainingSeats: Math.max(0, bootcamp.maxSeats - bootcamp._count.registrations),
      isFull: bootcamp._count.registrations >= bootcamp.maxSeats,
    };
  }

  async update(id: string, organizerId: string, dto: UpdateBootcampDto) {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id } });
    if (!bootcamp) {
      throw new NotFoundException('Bootcamp not found');
    }

    if (bootcamp.createdById !== organizerId) {
      throw new BadRequestException('Only the creating organizer can update this bootcamp');
    }

    return this.prisma.bootcamp.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.maxSeats && { maxSeats: dto.maxSeats }),
        ...(dto.status && { status: dto.status }),
        ...(dto.curriculum && { curriculum: dto.curriculum }),
      },
      include: {
        city: { include: { country: true } },
      },
    });
  }

  /**
   * Organizer feeds/updates content & tasks for a specific day
   */
  async updateDayCurriculum(
    bootcampId: string,
    organizerId: string,
    dayNumber: number,
    update: { title?: string; contentMarkdown?: string; tasks?: string[]; quizDifficulty?: string },
  ) {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: bootcampId } });
    if (!bootcamp) throw new NotFoundException('Bootcamp not found');
    if (bootcamp.createdById !== organizerId) {
      throw new BadRequestException('Only the creating organizer can edit curriculum content');
    }

    const curriculum = (bootcamp.curriculum as unknown as CurriculumDayDto[]) || [];
    const dayIndex = curriculum.findIndex((c) => c.day === Number(dayNumber));

    if (dayIndex >= 0) {
      curriculum[dayIndex] = {
        ...curriculum[dayIndex],
        ...(update.title && { title: update.title }),
        ...(update.contentMarkdown && { contentMarkdown: update.contentMarkdown }),
        ...(update.tasks && { tasks: update.tasks }),
        ...(update.quizDifficulty && { quizDifficulty: update.quizDifficulty }),
      };
    } else {
      curriculum.push({
        day: Number(dayNumber),
        title: update.title || `Day ${dayNumber} Curriculum`,
        contentMarkdown: update.contentMarkdown || '',
        tasks: update.tasks || [],
        quizDifficulty: update.quizDifficulty || 'MEDIUM',
        quizUnlocked: false,
      });
    }

    return this.prisma.bootcamp.update({
      where: { id: bootcampId },
      data: { curriculum: curriculum as any },
      include: { city: { include: { country: true } } },
    });
  }

  /**
   * Organizer toggles quiz unlock state and live timer for a specific day
   */
  async toggleQuizUnlock(
    bootcampId: string,
    organizerId: string,
    dayNumber: number,
    unlocked: boolean,
    timeLimitMinutes?: number,
  ) {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: bootcampId } });
    if (!bootcamp) throw new NotFoundException('Bootcamp not found');
    if (bootcamp.createdById !== organizerId) {
      throw new BadRequestException('Only the creating organizer can toggle quiz status');
    }

    const curriculum = (bootcamp.curriculum as unknown as CurriculumDayDto[]) || [];
    const dayIndex = curriculum.findIndex((c) => c.day === Number(dayNumber));

    const selectedLimit = timeLimitMinutes && timeLimitMinutes > 0 ? Number(timeLimitMinutes) : 10;
    const startedAt = unlocked ? new Date().toISOString() : undefined;

    if (dayIndex >= 0) {
      curriculum[dayIndex].quizUnlocked = unlocked;
      curriculum[dayIndex].timeLimitMinutes = selectedLimit;
      curriculum[dayIndex].quizStartedAt = startedAt;
    } else {
      curriculum.push({
        day: Number(dayNumber),
        title: `Day ${dayNumber} Curriculum`,
        contentMarkdown: '',
        tasks: [],
        quizDifficulty: 'MEDIUM',
        quizUnlocked: unlocked,
        timeLimitMinutes: selectedLimit,
        quizStartedAt: startedAt,
      });
    }

    return this.prisma.bootcamp.update({
      where: { id: bootcampId },
      data: { curriculum: curriculum as any },
      include: { city: { include: { country: true } } },
    });
  }
}
