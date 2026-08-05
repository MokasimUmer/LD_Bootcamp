import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';

export interface LnurlPayParams {
  callback: string;
  minSendable: number; // in msat
  maxSendable: number; // in msat
  metadata: string;
  commentAllowed?: number;
}

@Injectable()
export class LnurlResolverService {
  private readonly logger = new Logger(LnurlResolverService.name);

  /**
   * Resolves a LUD-16 Lightning Address (e.g., satoshi@getalby.com) to LNURL-pay parameters
   */
  async resolveLightningAddress(lightningAddress: string): Promise<LnurlPayParams> {
    if (!lightningAddress || !lightningAddress.includes('@')) {
      throw new BadRequestException('Invalid Lightning Address format. Expected user@domain.com');
    }

    const [username, domain] = lightningAddress.trim().toLowerCase().split('@');
    if (!username || !domain) {
      throw new BadRequestException('Invalid Lightning Address syntax');
    }

    const wellKnownUrl = `https://${domain}/.well-known/lnurlp/${username}`;
    this.logger.log(`Resolving LNURL-pay endpoint: ${wellKnownUrl}`);

    try {
      const response = await axios.get(wellKnownUrl, { timeout: 8000 });
      const data = response.data;

      if (!data || data.status === 'ERROR' || data.tag !== 'payRequest') {
        throw new BadRequestException(data.reason || 'LNURL-pay endpoint returned invalid payload');
      }

      return {
        callback: data.callback,
        minSendable: data.minSendable || 1000,
        maxSendable: data.maxSendable || 100000000,
        metadata: data.metadata || '',
        commentAllowed: data.commentAllowed,
      };
    } catch (err) {
      this.logger.error(`LNURL resolution failed for ${lightningAddress}: ${err.message}`);
      throw new BadRequestException(`Could not resolve Lightning Address '${lightningAddress}': ${err.message}`);
    }
  }

  /**
   * Requests a BOLT-11 invoice for the specified amount in millisatoshis
   */
  async fetchBolt11Invoice(callbackUrl: string, amountMsat: number): Promise<{ pr: string }> {
    const separator = callbackUrl.includes('?') ? '&' : '?';
    const requestUrl = `${callbackUrl}${separator}amount=${amountMsat}`;
    this.logger.log(`Requesting BOLT11 invoice for ${amountMsat} msat from ${requestUrl}`);

    try {
      const response = await axios.get(requestUrl, { timeout: 8000 });
      const data = response.data;

      if (!data || data.status === 'ERROR' || !data.pr) {
        throw new BadRequestException(data.reason || 'Failed to obtain BOLT11 payment request');
      }

      return { pr: data.pr };
    } catch (err) {
      this.logger.error(`Failed to fetch BOLT11 invoice: ${err.message}`);
      throw new BadRequestException(`Invoice generation failed: ${err.message}`);
    }
  }
}
