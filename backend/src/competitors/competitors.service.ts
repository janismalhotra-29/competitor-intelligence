import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompetitorDto } from './dto/create-competitor.dto.js';

@Injectable()
export class CompetitorsService {
  constructor(private prisma: PrismaService) {}

  async create(createCompetitorDto: CreateCompetitorDto) {
    try {
      return await this.prisma.competitor.create({
        data: { url: createCompetitorDto.url },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Competitor URL already exists');
      }
      throw new BadRequestException('Invalid data');
    }
  }

  async findAll() {
    return this.prisma.competitor.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.competitor.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Competitor not found');
      }
      throw new BadRequestException('Failed to delete competitor');
    }
  }
}
