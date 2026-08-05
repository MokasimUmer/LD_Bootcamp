import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { LnurlResolverService } from './lnurl.resolver';
import { LightningNodeService } from './lightning-node.service';

export class ProcessPayoutDto {
  @IsString()
  @IsNotEmpty()
  developerId: string;

  @IsString()
  @IsNotEmpty()
  bootcampId: string;

  @IsString()
  @IsOptional()
  submissionId?: string;

  @IsNumber()
  @IsNotEmpty()
  amountSats: number; // Amount in satoshis

  @IsString()
  @IsOptional()
  lightningAddress?: string;

  @IsString()
  @IsOptional()
  bolt11Invoice?: string;

  @IsString()
  @IsOptional()
  customPreimage?: string;
}

export class ClaimWinnerPrizeDto {
  @IsString()
  @IsNotEmpty()
  bootcampId: string;

  @IsNumber()
  @IsNotEmpty()
  dayNumber: number;

  @IsString()
  @IsOptional()
  lightningAddress?: string;

  @IsString()
  @IsOptional()
  bolt11Invoice?: string;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private prisma: PrismaService,
    private lnurlResolver: LnurlResolverService,
    private lightningNode: LightningNodeService,
  ) {}

  async processPayout(dto: ProcessPayoutDto) {
    const developer = await this.prisma.user.findUnique({ where: { id: dto.developerId } });
    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    const lnAddress = dto.lightningAddress || developer.lightningAddress || `${developer.name.toLowerCase().replace(/\s+/g, '')}@getalby.com`;
    const amountMsat = BigInt(dto.amountSats) * BigInt(1000); // convert sats to millisatoshis

    // Check for existing pending payout
    const existingPending = await this.prisma.payout.findFirst({
      where: {
        developerId: dto.developerId,
        bootcampId: dto.bootcampId,
        status: 'PENDING',
      },
    });

    // 1. MANUAL SETTLEMENT WITH POLAR PREIMAGE
    if (dto.customPreimage) {
      const preimage = dto.customPreimage.trim();
      const settled = existingPending
        ? await this.prisma.payout.update({
            where: { id: existingPending.id },
            data: {
              status: 'PAID',
              preimage,
              paidAt: new Date(),
            },
          })
        : await this.prisma.payout.create({
            data: {
              developerId: dto.developerId,
              bootcampId: dto.bootcampId,
              lightningAddress: lnAddress,
              amountMsat,
              status: 'PAID',
              preimage,
              paidAt: new Date(),
            },
          });

      return {
        success: true,
        message: `⚡ Payout of ${dto.amountSats} Sats marked as PAID with proof preimage!`,
        payoutId: settled.id,
        lightningAddress: lnAddress,
        amountSats: dto.amountSats,
        preimage,
        paidAt: settled.paidAt,
      };
    }

    // 2. BOLT11 INVOICE PAYMENT VIA POLAR LND NODE
    const targetBolt11 = dto.bolt11Invoice || existingPending?.bolt11;
    if (targetBolt11) {
      const paymentResult = await this.lightningNode.payInvoice(targetBolt11);
      if (paymentResult.success && paymentResult.preimage) {
        const settled = existingPending
          ? await this.prisma.payout.update({
              where: { id: existingPending.id },
              data: {
                status: 'PAID',
                bolt11: targetBolt11,
                preimage: paymentResult.preimage,
                paidAt: new Date(),
              },
            })
          : await this.prisma.payout.create({
              data: {
                developerId: dto.developerId,
                bootcampId: dto.bootcampId,
                lightningAddress: lnAddress,
                amountMsat,
                status: 'PAID',
                bolt11: targetBolt11,
                preimage: paymentResult.preimage,
                paidAt: new Date(),
              },
            });

        return {
          success: true,
          message: `⚡ Payout of ${dto.amountSats} sats to ${lnAddress} settled successfully via Lightning!`,
          payoutId: settled.id,
          lightningAddress: lnAddress,
          amountSats: dto.amountSats,
          bolt11: targetBolt11,
          preimage: paymentResult.preimage,
          paidAt: settled.paidAt,
        };
      }
    }

    // 3. LNURL RESOLUTION FALLBACK
    const payout = existingPending || (await this.prisma.payout.create({
      data: {
        developerId: dto.developerId,
        bootcampId: dto.bootcampId,
        submissionId: dto.submissionId || null,
        lightningAddress: lnAddress,
        amountMsat,
        status: 'PROCESSING',
      },
    }));

    try {
      // Resolve LUD-16 LNURL-pay endpoint
      const params = await this.lnurlResolver.resolveLightningAddress(lnAddress);
      const { pr: bolt11 } = await this.lnurlResolver.fetchBolt11Invoice(params.callback, Number(amountMsat));
      const paymentResult = await this.lightningNode.payInvoice(bolt11);

      if (paymentResult.success && paymentResult.preimage) {
        const settledPayout = await this.prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'PAID',
            bolt11,
            preimage: paymentResult.preimage,
            paidAt: new Date(),
          },
        });

        return {
          success: true,
          message: `Payout of ${dto.amountSats} sats to ${lnAddress} settled successfully!`,
          payoutId: settledPayout.id,
          lightningAddress: lnAddress,
          amountSats: dto.amountSats,
          bolt11,
          preimage: paymentResult.preimage,
          paidAt: settledPayout.paidAt,
        };
      } else {
        throw new Error(paymentResult.errorMessage || 'Lightning payment settlement failed');
      }
    } catch (err) {
      this.logger.error(`Payout failed for ${lnAddress}: ${err.message}`);
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      });

      throw new BadRequestException(`Payout settlement failed: ${err.message}`);
    }
  }

  async getBootcampPayouts(bootcampId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { bootcampId },
      include: {
        developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
        submission: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map((p) => ({
      ...p,
      amountMsat: p.amountMsat.toString(),
      amountSats: Number(p.amountMsat / BigInt(1000)),
    }));
  }

  async getDeveloperPayouts(developerId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { developerId },
      include: {
        bootcamp: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map((p) => ({
      ...p,
      amountMsat: p.amountMsat.toString(),
      amountSats: Number(p.amountMsat / BigInt(1000)),
    }));
  }

  async claimWinnerPrize(developerId: string, dto: ClaimWinnerPrizeDto) {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: dto.bootcampId } });
    if (!bootcamp) throw new NotFoundException('Bootcamp not found');

    // 1. Verify Quiz is Stopped / Closed by Organizer
    const curriculum = (bootcamp.curriculum as any[]) || [];
    const dayModule = curriculum.find((c) => c.day === Number(dto.dayNumber));

    if (dayModule && dayModule.quizUnlocked) {
      if (dayModule.quizStartedAt && dayModule.timeLimitMinutes) {
        const elapsed = Math.floor((Date.now() - new Date(dayModule.quizStartedAt).getTime()) / 1000);
        const limitSec = Number(dayModule.timeLimitMinutes) * 60;
        if (elapsed < limitSec) {
          throw new BadRequestException(
            `The Day ${dto.dayNumber} quiz is still active! Wait until the organizer stops the quiz to lock final leaderboard standings before generating your invoice.`,
          );
        }
      } else {
        throw new BadRequestException(
          `The Day ${dto.dayNumber} quiz is still active! Wait until the organizer stops the quiz to lock final leaderboard standings before generating your invoice.`,
        );
      }
    }

    const devScore = await this.prisma.quizScore.findUnique({
      where: {
        developerId_bootcampId_dayNumber: {
          developerId,
          bootcampId: dto.bootcampId,
          dayNumber: Number(dto.dayNumber),
        },
      },
    });

    if (!devScore) {
      throw new BadRequestException(`You have not completed the Day ${dto.dayNumber} Milestone Quiz yet.`);
    }

    const allScores = await this.prisma.quizScore.findMany({
      where: { bootcampId: dto.bootcampId, dayNumber: Number(dto.dayNumber) },
      orderBy: { score: 'desc' },
    });

    const rankIndex = allScores.findIndex((s) => s.developerId === developerId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : 999;

    if (rank > 3) {
      throw new BadRequestException(`Prize withdrawals are strictly for Top 3 leaderboard winners. Your final rank is #${rank}.`);
    }

    const prizeSatsMap: { [r: number]: number } = { 1: 10000, 2: 5000, 3: 2500 };
    const amountSats = prizeSatsMap[rank] || 2500;

    if (dto.lightningAddress) {
      await this.prisma.user.update({
        where: { id: developerId },
        data: { lightningAddress: dto.lightningAddress },
      }).catch(() => null);
    }

    const developer = await this.prisma.user.findUnique({ where: { id: developerId } });
    const targetAddress = dto.lightningAddress || developer?.lightningAddress || `${developer?.name?.toLowerCase().replace(/\s+/g, '')}@getalby.com`;



    // Resolve or generate BOLT11 Invoice
    let generatedBolt11 = dto.bolt11Invoice || '';

    // If no explicit BOLT11 was provided, try resolving BOLT11 via LNURL from developer's Lightning Address
    if (!generatedBolt11 && targetAddress && targetAddress.includes('@')) {
      try {
        const amountMsat = BigInt(amountSats) * BigInt(1000);
        const params = await this.lnurlResolver.resolveLightningAddress(targetAddress);
        const { pr } = await this.lnurlResolver.fetchBolt11Invoice(params.callback, Number(amountMsat));
        if (pr) {
          generatedBolt11 = pr;
          this.logger.log(`Generated BOLT11 invoice via LNURL for ${targetAddress}: ${pr.substring(0, 20)}...`);
        }
      } catch (err: any) {
        this.logger.warn(`Could not auto-generate BOLT11 via LNURL for ${targetAddress}: ${err.message}`);
      }
    }

    // Check for existing pending invoice
    const existingPending = await this.prisma.payout.findFirst({
      where: {
        developerId,
        bootcampId: dto.bootcampId,
        status: 'PENDING',
      },
    });

    let payoutRecord;
    if (existingPending) {
      payoutRecord = await this.prisma.payout.update({
        where: { id: existingPending.id },
        data: {
          lightningAddress: targetAddress,
          bolt11: generatedBolt11 || existingPending.bolt11,
          amountMsat: BigInt(amountSats) * BigInt(1000),
          status: 'PENDING',
        },
      });
    } else {
      payoutRecord = await this.prisma.payout.create({
        data: {
          developerId,
          bootcampId: dto.bootcampId,
          lightningAddress: targetAddress,
          amountMsat: BigInt(amountSats) * BigInt(1000),
          status: 'PENDING',
          bolt11: generatedBolt11 || null,
        },
      });
    }

    return {
      success: true,
      pending: true,
      rank,
      amountSats,
      lightningAddress: targetAddress,
      bolt11: generatedBolt11 || payoutRecord.bolt11,
      payout: {
        ...payoutRecord,
        amountMsat: payoutRecord.amountMsat.toString(),
        amountSats,
      },
      message: `⚡ Invoice for ${amountSats} Sats created and sent to Organizer Portal for settlement!`,
    };
  }
}
