import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '@safestream/storage';
import { EventsService, Events } from '@safestream/events';
import { VideosService } from '../video/videos.service';

interface UploadSession {
  uploadId: string;
  videoId: string;
  s3UploadId: string;
  key: string;
  parts: { PartNumber: number; ETag: string }[];
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private sessions = new Map<string, UploadSession>();

  constructor(
    private readonly storage: StorageService,
    private readonly videos: VideosService,
    private readonly events: EventsService,
  ) {}

  async initUpload(
    channelId: string,
    uploaderId: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadId: string; videoId: string; presignedUrls: string[] }> {
    const videoId = uuidv4();
    const key = this.storage.buildVideoKey(videoId, filename);

    const s3UploadId = await this.storage.initMultipartUpload(key, contentType);

    // Generate 10 presigned part URLs (5MB each = 50MB max; extend as needed)
    const presignedUrls = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        this.storage.getPresignedUploadUrl(
          `${key}.part${i + 1}`,
          contentType,
        ),
      ),
    );

    const uploadId = uuidv4();
    this.sessions.set(uploadId, {
      uploadId,
      videoId,
      s3UploadId,
      key,
      parts: [],
    });

    return { uploadId, videoId, presignedUrls };
  }

  async completeUpload(
    uploadId: string,
    channelId: string,
    uploaderId: string,
    parts: { PartNumber: number; ETag: string }[],
    videoMeta: { title: string; description?: string },
  ): Promise<string> {
    const session = this.sessions.get(uploadId);
    if (!session) throw new Error('Upload session not found');

    const storageUrl = await this.storage.completeMultipartUpload(
      session.key,
      session.s3UploadId,
      parts,
    );

    const video = await this.videos.create(
      {
        ...videoMeta,
        channelId,
      },
      uploaderId,
    );

    // Trigger transcoding pipeline
    await this.events.publish(Events.VIDEO_UPLOADED, {
      videoId: video.id,
      channelId,
      uploaderId,
      storagePath: session.key,
      originalFilename: session.key.split('/').pop()!,
    });

    this.sessions.delete(uploadId);
    return video.id;
  }
}
