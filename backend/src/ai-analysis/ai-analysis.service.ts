import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import OpenAI from 'openai';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private openai: OpenAI | null = null;

  constructor(private prisma: PrismaService) {
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
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business analyst. Compare the old text and new text of a competitor website. Identify meaningful changes (like pricing, features, branding). Ignore minor formatting or noise. Provide a concise, plain-English summary of what changed. Finally, specify a SIGNIFICANCE level on the last line exactly as: [SIGNIFICANCE: HIGH|MEDIUM|LOW|NONE].'
            },
            {
              role: 'user',
              content: `OLD TEXT:\n${oldText}\n\nNEW TEXT:\n${newText}`
            }
          ]
        });

        const reply = response.choices[0]?.message?.content || '';
        
        const sigMatch = reply.match(/\[SIGNIFICANCE:\s*(HIGH|MEDIUM|LOW|NONE)\]/i);
        if (sigMatch) {
          significance = sigMatch[1].toUpperCase();
          analysisText = reply.replace(/\[SIGNIFICANCE:\s*(HIGH|MEDIUM|LOW|NONE)\]/i, '').trim();
        } else {
          analysisText = reply;
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

    this.logger.log(`AI analysis completed for change: ${changeId}`);
    return aiSummary;
  }
}
