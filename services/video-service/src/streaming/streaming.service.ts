import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from '@safestream/database';
import { NotFoundException } from '@safestream/exceptions';
import { StorageService } from '@safestream/storage';

@Injectable()
export class StreamingService {
  constructor(
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
    private readonly storage: StorageService,
  ) {}

  async getManifestUrl(videoId: string): Promise<string> {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video || video.status !== VideoStatus.PUBLISHED) {
      throw new NotFoundException('Video', videoId);
    }
    if (!video.hlsManifestUrl) throw new NotFoundException('Stream not ready');
    return video.hlsManifestUrl;
  }

  async getThumbnailUrl(videoId: string): Promise<string> {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video', videoId);
    if (video.thumbnailUrl) return video.thumbnailUrl;
    return this.storage.getPublicUrl(this.storage.buildThumbnailKey(videoId));
  }
}
