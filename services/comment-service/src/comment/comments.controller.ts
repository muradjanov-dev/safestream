import {
  Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CommentsService, CreateCommentDto } from './comments.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, Public, RequestUser } from '@safestream/auth';
import { UserRole } from '@safestream/database';
import { PaginationDto } from '@safestream/pagination';
import { Throttle } from '@nestjs/throttler';

@Controller('videos/:videoId/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Public()
  @Get()
  async list(
    @Param('videoId') videoId: string,
    @Query('parentId') parentId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.comments.list(videoId, parentId ?? null, pagination ?? new PaginationDto());
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post()
  async create(
    @Param('videoId') videoId: string,
    @Body() dto: Omit<CreateCommentDto, 'videoId'>,
    @CurrentUser() user: RequestUser,
  ) {
    const comment = await this.comments.create({ ...dto, videoId }, user.id);
    return { success: true, data: comment };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const isAdmin = user.role === UserRole.SUPER_ADMIN;
    await this.comments.delete(id, user.id, isAdmin);
    return { success: true };
  }

  @Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
  @Patch(':id/pin')
  @HttpCode(HttpStatus.OK)
  async pin(@Param('id') id: string) {
    await this.comments.pin(id);
    return { success: true };
  }
}
