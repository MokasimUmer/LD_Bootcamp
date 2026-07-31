import { Module } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { LnurlResolverService } from './lnurl.resolver';
import { LightningNodeService } from './lightning-node.service';

@Module({
  controllers: [PayoutsController],
  providers: [PayoutsService, LnurlResolverService, LightningNodeService],
  exports: [PayoutsService, LnurlResolverService, LightningNodeService],
})
export class PayoutsModule {}
