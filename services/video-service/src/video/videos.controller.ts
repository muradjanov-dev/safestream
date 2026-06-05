import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { VideosService } from './videos.service';
import { CreateVideoDto, UpdateVideoDto, RecordViewDto } from './dto/create-video.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, Public, RequestUser } from '@safestream/auth';
import { UserRole } from '@safestream/database';
import { PaginationDto } from '@safestream/pagination';
import { Throttle } from '@nestjs/throttler';

@Controller('videos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Public()
  @Get()
  async list(
    @Query() pagination: PaginationDto,
    @Query('channelId') channelId?: string,
    @Query('type') videoType?: string,
    @Query('q') search?: string,
  ) {
    return this.videosService.list(pagination, { channelId, videoType, search });
  }

  @Public()
  @Get('trending')
  async trending(@Query('limit') limit = 20) {
    const data = await this.videosService.getTrending(limit);
    return { success: true, data };
  }

  @Public()
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    const video = await this.videosService.findById(id, user?.id);
    return { success: true, data: video };
  }

  @Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
  @Post()
  async create(@Body() dto: CreateVideoDto, @CurrentUser() user: RequestUser) {
    const video = await this.videosService.create(dto, user.id);
    return { success: true, data: video };
  }

  @Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @CurrentUser() user: RequestUser,
  ) {
    const video = await this.videosService.update(id, dto, user.id);
    return { success: true, data: video };
  }

  @Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.videosService.delete(id, user.id);
    return { success: true };
  }

  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async recordView(
    @Param('id') id: string,
    @Body() dto: RecordViewDto,
    @CurrentUser() user?: RequestUser,
  ) {
    await this.videosService.recordView(id, dto, user?.id);
    return { success: true };
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.videosService.publish(id, user.id);
    return { success: true };
  }
}
