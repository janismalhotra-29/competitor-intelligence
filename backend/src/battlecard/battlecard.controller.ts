import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BattlecardService } from './battlecard.service.js';

@Controller('benchmark')
export class BattlecardController {
  constructor(private readonly battlecardService: BattlecardService) {}

  @Get('battlecard')
  async getBattlecard() {
    return this.battlecardService.generateBattlecard();
  }

  @Get('battlecard/export')
  async exportBattlecardMarkdown(@Res() res: Response) {
    const battlecard = await this.battlecardService.generateBattlecard();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `competitive_battlecard_${dateStr}.md`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(battlecard.markdownReport);
  }
}
