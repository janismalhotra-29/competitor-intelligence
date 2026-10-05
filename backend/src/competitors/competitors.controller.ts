import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { CompetitorsService } from './competitors.service.js';
import { CreateCompetitorDto } from './dto/create-competitor.dto.js';

@Controller('competitors')
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Post()
  create(@Body() createCompetitorDto: CreateCompetitorDto) {
    return this.competitorsService.create(createCompetitorDto);
  }

  @Get()
  findAll() {
    return this.competitorsService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.competitorsService.remove(id);
  }
}
