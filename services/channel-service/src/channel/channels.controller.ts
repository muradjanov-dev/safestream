import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ChannelsService, CreateChannelDto, UpdateChannelDto } from './channels.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, Public, RequestUser } from '@safestream/auth';
import { UserRole } from '@safestream/database';

@Controller('channels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Public()
  @Get(':handle')
  async getOne(@Param('handle') handle: string) {
    const channel = await this.channels.findByHandle(handle);
    return { success: true, data: channel };
  }

  @Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
  @Post()
  async create(@Body() dto: CreateChannelDto, @CurrentUser() user: RequestUser) {
    const channel = await this.channels.create(dto, user.id);
    return { success: true, data: channel };
  }

  @Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
    @CurrentUser() user: RequestUser,
  ) {
    const channel = await this.channels.update(id, dto, user.id);
    return { success: true, data: channel };
  }

  @Post(':id/subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.channels.subscribe(id, user.id);
    return { success: true };
  }

  @Delete(':id/subscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.channels.unsubscribe(id, user.id);
    return { success: true };
  }

  @Get(':id/analytics')
  async analytics(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const data = await this.channels.getAnalytics(id, user.id);
    return { success: true, data };
  }
}
