import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGE, Events } from '@safestream/events';
import { AnalyticsEventPayload } from '@safestream/events';

interface DailyStats {
  date: string;
  views: number;
  uniqueViewers: number;
  watchTimeSeconds: number;
  likes: number;
  comments: number;
  shares: number;
  newUsers: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  // In production: write to ClickHouse via HTTP API
  // For scaffold: in-memory aggregation
  private eventBuffer: AnalyticsEventPayload[] = [];

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: Events.ANALYTICS_EVENT,
    queue: 'analytics.events',
  })
  async handleAnalyticsEvent(payload: AnalyticsEventPayload): Promise<void> {
    this.eventBuffer.push(payload);
    if (this.eventBuffer.length >= 100) {
      await this.flush();
    }
  }

  async trackEvent(payload: AnalyticsEventPayload): Promise<void> {
    this.eventBuffer.push(payload);
    this.logger.debug(`Tracked: ${payload.eventType}`);
  }

  private async flush(): Promise<void> {
    this.logger.log(`Flushing ${this.eventBuffer.length} analytics events to ClickHouse`);
    // TODO: Batch insert to ClickHouse
    // const client = createClient({ url: this.config.get('CLICKHOUSE_URL') })
    // await client.insert({ table: 'events', values: this.eventBuffer, format: 'JSONEachRow' })
    this.eventBuffer = [];
  }

  async getDashboard(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    // In production: query ClickHouse
    return [];
  }

  async getVideoAnalytics(videoId: string, startDate: Date, endDate: Date) {
    return {
      videoId,
      totalViews: 0,
      uniqueViewers: 0,
      avgRetentionPct: 0,
      totalWatchSeconds: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
    };
  }

  async getChannelAnalytics(channelId: string, startDate: Date, endDate: Date) {
    return {
      channelId,
      totalViews: 0,
      subscriberGrowth: 0,
      totalWatchSeconds: 0,
      topVideos: [],
      audienceByCountry: [],
    };
  }
}
