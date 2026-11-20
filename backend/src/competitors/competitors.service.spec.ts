import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dns from 'dns';
import { CompetitorsService } from './competitors.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('CompetitorsService', () => {
  let service: CompetitorsService;
  let prismaMock: any;

  beforeEach(() => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    prismaMock = {
      competitor: {
        create: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new CompetitorsService(prismaMock as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create competitor with valid public URL', async () => {
      prismaMock.competitor.create.mockResolvedValue({
        id: 'comp-1',
        url: 'https://example.com',
      });

      const result = await service.create({ url: 'https://example.com' });
      expect(result.id).toBe('comp-1');
      expect(prismaMock.competitor.create).toHaveBeenCalledWith({
        data: { url: 'https://example.com' },
      });
    });

    it('should throw BadRequestException for SSRF private target', async () => {
      await expect(service.create({ url: 'http://127.0.0.1:3001' })).rejects.toThrow(BadRequestException);
      expect(prismaMock.competitor.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate URL', async () => {
      prismaMock.competitor.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create({ url: 'https://example.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return list of competitors ordered by createdAt desc', async () => {
      const mockList = [{ id: 'comp-1', url: 'https://example.com' }];
      prismaMock.competitor.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();
      expect(result).toEqual(mockList);
      expect(prismaMock.competitor.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('remove', () => {
    it('should delete existing competitor', async () => {
      prismaMock.competitor.delete.mockResolvedValue({ id: 'comp-1' });

      const result = await service.remove('comp-1');
      expect(result.id).toBe('comp-1');
      expect(prismaMock.competitor.delete).toHaveBeenCalledWith({
        where: { id: 'comp-1' },
      });
    });

    it('should throw NotFoundException if competitor does not exist', async () => {
      prismaMock.competitor.delete.mockRejectedValue({ code: 'P20025' /* P2025 */, code_real: 'P2025' });
      // Actually code === 'P2025' in prisma
      prismaMock.competitor.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
