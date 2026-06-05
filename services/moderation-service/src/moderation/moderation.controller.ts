import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, RequestUser } from '@safestream/auth';
import { UserRole } from '@safestream/database';
import { EventsService, Events } from '@safestream/events';
import { IsString, IsIn, IsOptional } from 'class-validator';

class ReviewDto {
  @IsIn(['approve', 'reject']) action: 'approve' | 'reject';
  @IsOptional() @IsString() notes?: string;
}

@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ModerationController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly events: EventsService,
  ) {}

  @Get('queue')
  getQueue(@Query('status') status = 'pending') {
    // In production: query moderation_queue table
    return { success: true, data: [], meta: { total: 0, status } };
  }

  @Post('analyze/:resourceType/:resourceId')
  async analyze(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    const result = await this.moderation.analyzeContent(resourceType, resourceId);
    return { success: true, data: result };
  }

  @Patch('review/:resourceId')
  async review(
    @Param('resourceId') resourceId: string,
    @Body() dto: ReviewDto,
    @CurrentUser() reviewer: RequestUser,
  ) {
    const event = dto.action === 'approve' ? Events.MODERATION_APPROVED : Events.MODERATION_REJECTED;
    await this.events.publish(event, {
      resourceId,
      resourceType: 'video',
      reviewedBy: reviewer.id,
      notes: dto.notes,
    });
    return { success: true };
  }
}
