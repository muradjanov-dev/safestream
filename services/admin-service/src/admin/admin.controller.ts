import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@safestream/auth';
import { UserRole } from '@safestream/database';
import { IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '@safestream/auth';

class BanUserDto { @IsString() reason: string; }
class RemoveVideoDto { @IsString() reason: string; }

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  async stats() {
    const data = await this.admin.getSystemStats();
    return { success: true, data };
  }

  @Get('users')
  async users(@Query('page') page = 1, @Query('limit') limit = 50, @Query('q') search?: string) {
    const data = await this.admin.listUsers(page, limit, search);
    return { success: true, data };
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  async ban(
    @Param('id') id: string,
    @Body() dto: BanUserDto,
    @CurrentUser() admin: RequestUser,
  ) {
    await this.admin.banUser(id, dto.reason, admin.id);
    return { success: true };
  }

  @Delete('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  async unban(@Param('id') id: string) {
    await this.admin.unbanUser(id);
    return { success: true };
  }

  @Patch('users/:id/promote-creator')
  @HttpCode(HttpStatus.OK)
  async promote(@Param('id') id: string) {
    await this.admin.promoteToCreator(id);
    return { success: true };
  }

  @Post('videos/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveVideo(@Param('id') id: string, @CurrentUser() admin: RequestUser) {
    await this.admin.approveVideo(id, admin.id);
    return { success: true };
  }

  @Delete('videos/:id')
  @HttpCode(HttpStatus.OK)
  async removeVideo(
    @Param('id') id: string,
    @Body() dto: RemoveVideoDto,
    @CurrentUser() admin: RequestUser,
  ) {
    await this.admin.removeVideo(id, admin.id, dto.reason);
    return { success: true };
  }
}
