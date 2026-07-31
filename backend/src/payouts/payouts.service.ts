import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LnurlResolverService } from './lnurl.resolver';
import { LightningNodeService } from './lightning-node.service';

export class ProcessPayoutDto {
  developerId: string;
  bootcampId: string;
  submissionId?: string;
  amountSats: number; // Amount in satoshis
  lightningAddress?: string;
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

    const lnAddress = dto.lightningAddress || developer.lightningAddress;
    if (!lnAddress) {
      throw new BadRequestException(`Developer '${developer.name}' does not have a Lightning Address configured`);
    }

    const amountMsat = BigInt(dto.amountSats) * BigInt(1000); // convert sats to millisatoshis

    // Create pending payout record
    const payout = await this.prisma.payout.create({
      data: {
        developerId: dto.developerId,
        bootcampId: dto.bootcampId,
        submissionId: dto.submissionId || null,
        lightningAddress: lnAddress,
        amountMsat,
        status: 'PROCESSING',
      },
    });

    try {
      // 1. Resolve LUD-16 LNURL-pay endpoint
      const params = await this.lnurlResolver.resolveLightningAddress(lnAddress);

      if (Number(amountMsat) < params.minSendable || Number(amountMsat) > params.maxSendable) {
        throw new BadRequestException(
          `Prize amount (${dto.amountSats} sats) outside LNURL limits (${params.minSendable / 1000} - ${params.maxSendable / 1000} sats)`,
        );
      }

      // 2. Request BOLT-11 invoice
      const { pr: bolt11 } = await this.lnurlResolver.fetchBolt11Invoice(params.callback, Number(amountMsat));

      // 3. Dispatch payment via connected Lightning node
      const paymentResult = await this.lightningNode.payInvoice(bolt11);

      if (paymentResult.success && paymentResult.preimage) {
        // 4. Update status to PAID with preimage proof
        const settledPayout = await this.prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'PAID',
            bolt11,
            preimage: paymentResult.preimage,
            paidAt: new Date(),
          },
          include: {
            developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
            bootcamp: { select: { id: true, title: true } },
          },
        });

        return {
          success: true,
          message: `Payout of ${dto.amountSats} sats (${amountMsat} msat) to ${lnAddress} settled successfully!`,
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
}
