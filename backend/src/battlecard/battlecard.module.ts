import { Module } from '@nestjs/common';
import { BattlecardController } from './battlecard.controller.js';
import { BattlecardService } from './battlecard.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [BattlecardController],
  providers: [BattlecardService],
  exports: [BattlecardService],
})
export class BattlecardModule {}
