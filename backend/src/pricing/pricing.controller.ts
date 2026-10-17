import { Controller, Get, Param } from '@nestjs/common';
import { PricingService } from './pricing.service.js';

@Controller('competitors/:competitorId')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('pricing')
  async getPricing(@Param('competitorId') competitorId: string) {
    return this.pricingService.getPricingByCompetitor(competitorId);
  }

  @Get('report')
  async getExecutiveReport(@Param('competitorId') competitorId: string) {
    return this.pricingService.generateExecutiveReport(competitorId);
  }
}
