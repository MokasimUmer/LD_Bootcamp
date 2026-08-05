import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateLightningAddressDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Organizers cannot register via public UI; registration is strictly for Developers
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: 'DEVELOPER',
        lightningAddress: dto.lightningAddress || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lightningAddress: true,
        createdAt: true,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const inputEmail = dto.email.toLowerCase().trim();

    // Known Hardcoded Organizer Credentials
    const KNOWN_ORGANIZERS: { [key: string]: { password: string; name: string; role: 'ORGANIZER' | 'ADMIN' } } = {
      'organizer@afr.lightning': { password: 'Organizer123!', name: 'AFR Lead Organizer', role: 'ORGANIZER' },
      'admin@afr.lightning': { password: 'Admin123!', name: 'AFR Master Admin', role: 'ADMIN' },
    };

    const knownOrg = KNOWN_ORGANIZERS[inputEmail];

    if (knownOrg) {
      if (dto.password !== knownOrg.password) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if organizer user exists in database
      let user = await this.prisma.user.findUnique({
        where: { email: inputEmail },
      }).catch(() => null);

      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(knownOrg.password, salt);
        user = await this.prisma.user.create({
          data: {
            email: inputEmail,
            passwordHash,
            name: knownOrg.name,
            role: knownOrg.role,
            lightningAddress: `${knownOrg.role.toLowerCase()}@getalby.com`,
          },
        }).catch(() => null);
      }

      const userId = user ? user.id : `org-${inputEmail}`;
      const token = this.jwtService.sign({
        sub: userId,
        email: inputEmail,
        role: knownOrg.role,
      });

      return {
        user: {
          id: userId,
          email: inputEmail,
          name: user ? user.name : knownOrg.name,
          role: knownOrg.role,
          lightningAddress: user?.lightningAddress || `${knownOrg.role.toLowerCase()}@getalby.com`,
          createdAt: user?.createdAt || new Date(),
        },
        accessToken: token,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: inputEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lightningAddress: user.lightningAddress,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lightningAddress: true,
        createdAt: true,
        registrations: {
          include: {
            bootcamp: {
              include: { city: { include: { country: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateLightningAddress(userId: string, dto: UpdateLightningAddressDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { lightningAddress: dto.lightningAddress },
      select: { id: true, email: true, name: true, role: true, lightningAddress: true },
    });

    return user;
  }
}
