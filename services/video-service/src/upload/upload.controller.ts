import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, RequestUser } from '@safestream/auth';
import { UserRole } from '@safestream/database';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsOptional, IsArray } from 'class-validator';

class InitUploadDto {
  @IsString() filename: string;
  @IsString() contentType: string;
  @IsString() channelId: string;
}

class CompleteUploadDto {
  @IsString() uploadId: string;
  @IsString() channelId: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() parts: { PartNumber: number; ETag: string }[];
}

@Controller('videos/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CREATOR, UserRole.SUPER_ADMIN)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Throttle({ default: { ttl: 3600000, limit: 20 } })
  @Post('init')
  async init(@Body() dto: InitUploadDto, @CurrentUser() user: RequestUser) {
    const result = await this.uploadService.initUpload(
      dto.channelId,
      user.id,
      dto.filename,
      dto.contentType,
    );
    return { success: true, data: result };
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Body() dto: CompleteUploadDto, @CurrentUser() user: RequestUser) {
    const videoId = await this.uploadService.completeUpload(
      dto.uploadId,
      dto.channelId,
      user.id,
      dto.parts,
      { title: dto.title, description: dto.description },
    );
    return { success: true, data: { videoId } };
  }
}
