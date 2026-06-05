import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard, Public, CurrentUser, RequestUser } from '@safestream/auth';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Public()
  @Get('home')
  async home(
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const data = await this.feed.getHomeFeed(user?.id ?? null, limit, cursor);
    return { success: true, data };
  }

  @Public()
  @Get('trending')
  async trending(@Query('category') category?: string, @Query('limit') limit = 20) {
    const data = await this.feed.getTrending(category, limit);
    return { success: true, data };
  }

  @Public()
  @Get('shorts')
  async shorts(@Query('limit') limit = 20, @CurrentUser() user?: RequestUser) {
    const data = await this.feed.getShortsFeed(user?.id ?? null, limit);
    return { success: true, data };
  }

  @Get('subscriptions')
  async subscriptions(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit = 20,
  ) {
    // In production: fetch subscribed channel IDs from channel-service
    const data = await this.feed.getSubscriptionsFeed(user.id, [], limit);
    return { success: true, data };
  }

  @Public()
  @Get('explore')
  async explore(@Query('category') category = 'education', @Query('limit') limit = 20) {
    const data = await this.feed.getExploreFeed(category, limit);
    return { success: true, data };
  }
}
