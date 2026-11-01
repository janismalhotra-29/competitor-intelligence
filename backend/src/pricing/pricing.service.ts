import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const PricingExtractionSchema = z.object({
  plans: z.array(
    z.object({
      name: z.string().describe('Tier name, e.g. Free, Starter, Pro, Team, Enterprise'),
      price: z.string().describe('Price with currency, e.g. $0, $29, ₹999, Custom'),
      period: z.string().optional().describe('Billing frequency, e.g. monthly, yearly, one-time'),
      features: z.array(z.string()).optional().describe('Key highlights/features of this tier'),
    }),
  ),
});

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private openai: OpenAI | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async extractPricingFromText(competitorId: string, snapshotId: string, text: string) {
    this.logger.log(`Extracting pricing for competitor ${competitorId}`);
    if (!text || text.trim().length === 0) return [];

    let extractedPlans: Array<{
      name: string;
      price: string;
      period?: string;
      features?: string[];
    }> = [];

    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.parse({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a rigorous business intelligence extraction agent. Extract only explicit pricing tiers and plan details from the provided webpage text. If no explicit pricing tables or tiers exist with concrete currency amounts or stated custom pricing, return an empty plans array. CRITICAL: NEVER invent, hallucinate, or assume plans that are not explicitly stated in the text.',
            },
            {
              role: 'user',
              content: `WEBPAGE CONTENT:\n${text.slice(0, 8000)}`,
            },
          ],
          response_format: zodResponseFormat(PricingExtractionSchema, 'pricing_extraction'),
        });

        const parsed = response.choices[0]?.message?.parsed;
        if (parsed && Array.isArray(parsed.plans)) {
          extractedPlans = parsed.plans;
        }
      } catch (err) {
        this.logger.error('Failed to parse pricing via OpenAI', err);
      }
    } else {
      // Heuristic extraction when API key is not present - strictly grounded, no fabrication
      this.logger.log('Running heuristic pricing extraction...');
      extractedPlans = this.extractHeuristicPricing(text);
    }

    // Always sync with database: replace with authentically identified plans
    await this.prisma.pricingPlan.deleteMany({
      where: { competitorId },
    });

    if (extractedPlans.length > 0) {
      for (const plan of extractedPlans) {
        await this.prisma.pricingPlan.create({
          data: {
            competitorId,
            snapshotId,
            name: plan.name,
            price: plan.price,
            period: plan.period || 'monthly',
            features: plan.features ? JSON.stringify(plan.features) : null,
          },
        });
      }
      this.logger.log(`Saved ${extractedPlans.length} authentic pricing plans for competitor ${competitorId}`);
    } else {
      this.logger.log(`No explicit pricing tables detected for competitor ${competitorId}`);
    }

    return this.getPricingByCompetitor(competitorId);
  }

  private extractHeuristicPricing(text: string): Array<{
    name: string;
    price: string;
    period?: string;
    features?: string[];
  }> {
    const plans: Array<{ name: string; price: string; period?: string; features?: string[] }> = [];

    // Strictly match currency amounts (e.g. $29, ₹999, €49) or explicit free tiers
    const priceRegex =
      /(?:(Free|Starter|Basic|Standard|Pro(?:fessional)?|Team|Business|Enterprise|Growth|Scale)\s*(?:Plan|Tier)?\s*(?:[:\-–]|is|at|for|from|starts at)?\s*)?(?:(\$|₹|€|£|Rs\.?)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(Free\s+Plan|Free\s+Tier))\s*(?:\/|\s*per\s*)?(month|mo|year|yr|user|seat)?/gi;

    const matches = Array.from(text.matchAll(priceRegex));
    const seenNames = new Set<string>();

    for (const match of matches) {
      const planNameCandidate = match[1]?.trim();
      const currency = match[2];
      const amount = match[3];
      const isExplicitFree = match[4];
      const rawPeriod = match[5]?.toLowerCase();

      if (!amount && !isExplicitFree) continue;

      const name = planNameCandidate || (isExplicitFree ? 'Free Tier' : 'Standard');
      const price = isExplicitFree ? '$0' : `${currency || '$'}${amount}`;
      let period = 'monthly';
      if (rawPeriod) {
        if (rawPeriod.includes('yr') || rawPeriod.includes('year') || rawPeriod.includes('annual')) {
          period = 'yearly';
        } else if (rawPeriod.includes('user') || rawPeriod.includes('seat')) {
          period = 'per user/month';
        }
      }

      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        plans.push({
          name,
          price,
          period,
          features: ['Identified from public page content'],
        });
      }
    }

    return plans.slice(0, 5);
  }

  async getPricingByCompetitor(competitorId: string) {
    const competitor = await this.prisma.competitor.findUnique({
      where: { id: competitorId },
    });
    if (!competitor) {
      throw new NotFoundException('Competitor not found');
    }

    return this.prisma.pricingPlan.findMany({
      where: { competitorId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async generateExecutiveReport(competitorId: string) {
    const competitor = await this.prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        snapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 5,
        },
        changes: {
          orderBy: { detectedAt: 'desc' },
          take: 5,
          include: { aiSummary: true },
        },
        pricing: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!competitor) {
      throw new NotFoundException('Competitor not found');
    }

    const latestSnapshot = competitor.snapshots[0];
    const totalSnapshots = competitor.snapshots.length;
    const totalChanges = competitor.changes.filter((c) => c.hasChanges).length;
    const now = new Date().toISOString();

    let md = `# Competitor Intelligence Executive Report\n\n`;
    md += `**Target Competitor:** ${competitor.url}\n`;
    md += `**Generated Date:** ${new Date().toLocaleString()}\n`;
    md += `**Tracking Since:** ${new Date(competitor.createdAt).toLocaleDateString()}\n`;
    md += `**Total Snapshots Analyzed:** ${totalSnapshots} | **Meaningful Changes Detected:** ${totalChanges}\n\n`;

    md += `---\n\n`;
    md += `## 1. Executive Summary\n\n`;
    if (latestSnapshot) {
      md += `- **Latest Page Title:** ${latestSnapshot.pageTitle || 'N/A'}\n`;
      md += `- **Last Scanned:** ${new Date(latestSnapshot.capturedAt).toLocaleString()}\n`;
      md += `- **Collection Status:** ${latestSnapshot.status}\n\n`;
    } else {
      md += `*No web snapshots collected yet.*\n\n`;
    }

    md += `## 2. Identified Pricing & Tier Structure\n\n`;
    if (competitor.pricing.length > 0) {
      md += `| Plan Tier | Price | Cadence | Key Features |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const p of competitor.pricing) {
        let feats = 'N/A';
        if (p.features) {
          try {
            feats = JSON.parse(p.features).join(', ');
          } catch {
            feats = p.features;
          }
        }
        md += `| **${p.name}** | \`${p.price}\` | ${p.period || 'monthly'} | ${feats} |\n`;
      }
      md += `\n`;
    } else {
      md += `*No structured pricing tables identified on the current public page.*\n\n`;
    }

    md += `## 3. Recent Strategic Movements & AI Insights\n\n`;
    const changesWithInsights = competitor.changes.filter((c) => c.hasChanges);
    if (changesWithInsights.length > 0) {
      for (const c of changesWithInsights) {
        md += `### Change on ${new Date(c.detectedAt).toLocaleString()}\n`;
        md += `- **Difference Summary:** ${c.diffSummary || 'Content modified'}\n`;
        if (c.aiSummary) {
          md += `- **Business Impact:** \`${c.aiSummary.significance}\`\n`;
          md += `- **AI Assessment:** *${c.aiSummary.analysis}*\n`;
        }
        md += `\n`;
      }
    } else {
      md += `*No significant textual changes recorded recently.*\n\n`;
    }

    md += `---\n`;
    md += `*Report automatically generated by AI Competitor Intelligence Engine.*\n`;

    return {
      competitorId,
      competitorUrl: competitor.url,
      generatedAt: now,
      reportMarkdown: md,
    };
  }
}
