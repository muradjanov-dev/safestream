import {
  IsString, IsOptional, IsEnum, IsBoolean,
  MaxLength, IsArray, ArrayMaxSize,
} from 'class-validator';
import { VideoType, VideoVisibility } from '@safestream/database';

export class CreateVideoDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  channelId: string;

  @IsOptional()
  @IsEnum(VideoType)
  videoType?: VideoType;

  @IsOptional()
  @IsEnum(VideoVisibility)
  visibility?: VideoVisibility;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(VideoVisibility)
  visibility?: VideoVisibility;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}

export class InitUploadDto {
  @IsString()
  @MaxLength(300)
  filename: string;

  @IsString()
  contentType: string;

  @IsString()
  channelId: string;
}

export class RecordViewDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  watchedSeconds?: number;

  lastPosition?: number;
}
