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
      this.logger.warn('OPENAI_API_KEY is not set. Using grounded mock AI analysis for development.');
    }
  }

  async analyzeChange(changeId: string, oldText: string, newText: string) {
    this.logger.log(`Starting AI analysis for change: ${changeId}`);

    let analysisText = '';
    let significance = 'UNKNOWN';

    // Bounded text inputs (max 7500 chars each) to prevent token overflow and prompt injection
    const boundedOld = (oldText || '').slice(0, 7500);
    const boundedNew = (newText || '').slice(0, 7500);

    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.parse({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert business intelligence analyst. Compare the provided OLD TEXT and NEW TEXT of a competitor website. Identify only real, substantive business changes (such as genuine pricing adjustments, new features, or major positioning pivots). Ignore formatting and dynamic noise. CRITICAL: Strictly base your analysis ONLY on the actual differences between the texts. NEVER fabricate, assume, or speculate about pricing changes or new plans unless explicit numerical figures or plan names appear in the diff. If the change is trivial or non-substantive, classify significance as NONE.',
            },
            {
              role: 'user',
              content: `OLD TEXT:\n${boundedOld}\n\nNEW TEXT:\n${boundedNew}`,
            },
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
      this.logger.log('Running grounded mock AI analysis...');
      const oldLen = boundedOld.length;
      const newLen = boundedNew.length;
      const diffLen = Math.abs(newLen - oldLen);

      analysisText = `MOCK ANALYSIS: Page text modified (difference of approx ${diffLen} characters detected). Real AI summarization requires a configured OPENAI_API_KEY.`;
      significance = diffLen > 500 ? 'MEDIUM' : 'LOW';
    }

    const aiSummary = await this.prisma.aiSummary.create({
      data: {
        changeId,
        analysis: analysisText,
        significance,
      },
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
