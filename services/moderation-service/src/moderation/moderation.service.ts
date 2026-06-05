import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import { EventsService, Events } from '@safestream/events';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGE, Events as Ev } from '@safestream/events';

interface ModerationResult {
  score: number;
  categories: {
    violence: number;
    adultContent: number;
    hateSpeech: number;
    spam: number;
  };
  autoAction: 'approve' | 'review' | 'reject';
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly rekognition: RekognitionClient;

  // Thresholds
  private readonly AUTO_APPROVE = 0.3;
  private readonly AUTO_REJECT  = 0.7;

  constructor(
    private readonly config: ConfigService,
    private readonly events: EventsService,
  ) {
    this.rekognition = new RekognitionClient({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: Ev.MODERATION_NEEDED,
    queue: 'moderation.queue',
  })
  async handleModerationNeeded(payload: {
    resourceType: string;
    resourceId: string;
    priority?: number;
  }) {
    this.logger.log(`Moderating ${payload.resourceType}:${payload.resourceId}`);
    try {
      const result = await this.analyzeContent(payload.resourceType, payload.resourceId);
      await this.processResult(payload.resourceId, payload.resourceType, result);
    } catch (error) {
      this.logger.error(`Moderation failed for ${payload.resourceId}`, error);
    }
  }

  async analyzeContent(resourceType: string, resourceId: string): Promise<ModerationResult> {
    // In production: extract frames from video and analyze each
    // For now: simulate with configurable thresholds
    const mockScore = Math.random() * 0.4; // Most content is safe on a family platform

    return {
      score: mockScore,
      categories: {
        violence: mockScore * 0.3,
        adultContent: mockScore * 0.2,
        hateSpeech: mockScore * 0.1,
        spam: mockScore * 0.1,
      },
      autoAction: this.getAutoAction(mockScore),
    };
  }

  async analyzeImageWithRekognition(imageBytes: Buffer): Promise<number> {
    try {
      const command = new DetectModerationLabelsCommand({
        Image: { Bytes: imageBytes },
        MinConfidence: this.config.get<number>('REKOGNITION_MIN_CONFIDENCE', 75),
      });
      const response = await this.rekognition.send(command);
      const labels = response.ModerationLabels ?? [];
      if (labels.length === 0) return 0;
      const maxConfidence = Math.max(...labels.map((l) => l.Confidence ?? 0));
      return maxConfidence / 100;
    } catch (error) {
      this.logger.warn('Rekognition unavailable, skipping AI scan', error);
      return 0;
    }
  }

  async analyzeText(text: string): Promise<number> {
    const violentKeywords = ['kill', 'murder', 'hate', 'die'];
    const lowerText = text.toLowerCase();
    const matches = violentKeywords.filter((kw) => lowerText.includes(kw)).length;
    return Math.min(matches / violentKeywords.length, 1);
  }

  private async processResult(
    resourceId: string,
    resourceType: string,
    result: ModerationResult,
  ): Promise<void> {
    if (result.autoAction === 'approve') {
      await this.events.publish(Events.MODERATION_APPROVED, { resourceId, resourceType, score: result.score });
    } else if (result.autoAction === 'reject') {
      await this.events.publish(Events.MODERATION_REJECTED, { resourceId, resourceType, score: result.score });
    }
    // 'review' → stays in queue for human moderator
  }

  private getAutoAction(score: number): 'approve' | 'review' | 'reject' {
    if (score < this.AUTO_APPROVE) return 'approve';
    if (score < this.AUTO_REJECT)  return 'review';
    return 'reject';
  }
}
