import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

import { AlertsService } from '../alerts/alerts.service.js';

const AnalysisSchema = z.object({
  analysis: z.string().describe("A concise, plain-English summary of what changed between the old and new text."),
  significance: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]).describe("The business impact level of these changes.")
});

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private alertsService: AlertsService
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY is not set. Using mock AI analysis for development.');
    }
  }

  async analyzeChange(changeId: string, oldText: string, newText: string) {
    this.logger.log(`Starting AI analysis for change: ${changeId}`);

    let analysisText = '';
    let significance = 'UNKNOWN';

    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.parse({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business analyst. Compare the old text and new text of a competitor website. Identify meaningful changes (like pricing, features, branding). Ignore minor formatting or noise.'
            },
            {
              role: 'user',
              content: `OLD TEXT:\n${oldText}\n\nNEW TEXT:\n${newText}`
            }
          ],
          response_format: zodResponseFormat(AnalysisSchema, 'analysis_result'),
        });

        const parsed = response.choices[0]?.message?.parsed;
        
        if (parsed) {
          analysisText = parsed.analysis;
          significance = parsed.significance;
        } else {
          analysisText = 'Failed to parse AI response.';
        }
      } catch (error) {
        this.logger.error('OpenAI API call failed', error);
        analysisText = 'AI Analysis failed due to an API error.';
      }
    } else {
      this.logger.log('Running mock AI analysis...');
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      analysisText = 'MOCK ANALYSIS: The competitor appears to have updated their website text. Without a real OpenAI API key, I cannot tell you exactly what changed, but they modified several blocks of content. This could be a pricing update, a new feature launch, or a marketing copy adjustment.';
      significance = 'MEDIUM';
    }

    const aiSummary = await this.prisma.aiSummary.create({
      data: {
        changeId,
        analysis: analysisText,
        significance
      }
    });

    // If change is HIGH or MEDIUM impact, create an alert
    if (significance === 'HIGH' || significance === 'MEDIUM') {
      try {
        const changeRecord = await this.prisma.change.findUnique({
          where: { id: changeId },
          include: { competitor: true },
        });

        if (changeRecord) {
          await this.alertsService.createAlert({
            competitorId: changeRecord.competitorId,
            changeId: changeRecord.id,
            title: `${significance} Impact: ${changeRecord.competitor.url}`,
            message: analysisText,
            significance,
          });
          this.logger.log(`Created alert for competitor ${changeRecord.competitor.url}`);
        }
      } catch (alertErr) {
        this.logger.error('Failed to create alert for change', alertErr);
      }
    }

    this.logger.log(`AI analysis completed for change: ${changeId}`);
    return aiSummary;
  }
}
