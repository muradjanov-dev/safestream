import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGE, Events, VideoUploadedPayload } from '@safestream/events';
import { StorageService } from '@safestream/storage';
import { EventsService } from '@safestream/events';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { spawn } from 'child_process';

interface HlsProfile {
  name: string;
  resolution: string;
  videoBitrate: string;
  audioBitrate: string;
}

const HLS_PROFILES: HlsProfile[] = [
  { name: '360p',  resolution: '640x360',   videoBitrate: '600k',  audioBitrate: '64k'  },
  { name: '480p',  resolution: '854x480',   videoBitrate: '1200k', audioBitrate: '96k'  },
  { name: '720p',  resolution: '1280x720',  videoBitrate: '2500k', audioBitrate: '128k' },
  { name: '1080p', resolution: '1920x1080', videoBitrate: '5000k', audioBitrate: '192k' },
];

@Injectable()
export class TranscodingWorker {
  private readonly logger = new Logger(TranscodingWorker.name);

  constructor(
    private readonly storage: StorageService,
    private readonly events: EventsService,
  ) {}

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: Events.VIDEO_UPLOADED,
    queue: 'transcoding.queue',
    queueOptions: { durable: true, arguments: { 'x-max-priority': 10 } },
  })
  async handleVideoUploaded(payload: VideoUploadedPayload) {
    this.logger.log(`Transcoding video ${payload.videoId}`);
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'safestream-'));

    try {
      // 1. Download original from S3
      const inputPath = path.join(workDir, 'input.mp4');
      await this.downloadFromS3(payload.storagePath, inputPath);

      // 2. Extract duration
      const durationSeconds = await this.getDuration(inputPath);

      // 3. Transcode to each quality + HLS
      const outputDir = path.join(workDir, 'hls');
      await fs.mkdir(outputDir, { recursive: true });
      await this.transcodeToHls(inputPath, outputDir);

      // 4. Generate thumbnail
      const thumbnailPath = path.join(workDir, 'thumbnail.jpg');
      await this.generateThumbnail(inputPath, thumbnailPath, durationSeconds);

      // 5. Upload HLS files to S3
      const hlsBaseKey = `videos/${payload.videoId}/hls`;
      await this.uploadHlsFiles(outputDir, hlsBaseKey, payload.videoId);

      // 6. Upload thumbnail
      const thumbnailBuffer = await fs.readFile(thumbnailPath);
      await this.storage.upload(
        this.storage.buildThumbnailKey(payload.videoId),
        thumbnailBuffer,
        'image/jpeg',
      );

      const hlsManifestUrl = this.storage.getPublicUrl(`${hlsBaseKey}/master.m3u8`);

      // 7. Notify video-service
      await this.events.publish(Events.VIDEO_TRANSCODED, {
        videoId: payload.videoId,
        hlsManifestUrl,
        qualities: HLS_PROFILES.map((p) => p.name),
        durationSeconds,
      });

      // 8. Trigger moderation
      await this.events.publish(Events.MODERATION_NEEDED, {
        resourceType: 'video',
        resourceId: payload.videoId,
        priority: 5,
      });

      this.logger.log(`Transcoding complete for ${payload.videoId}`);
    } catch (error) {
      this.logger.error(`Transcoding failed for ${payload.videoId}`, error);
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }

  private async transcodeToHls(inputPath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const varStreamMap = HLS_PROFILES.map((p, i) => `v:${i},a:${i}`).join(' ');

      // Build -map and encoding flags for each profile
      const maps = HLS_PROFILES.flatMap((p, i) => ['-map', '0:v:0', '-map', '0:a:0']);
      const encoding = HLS_PROFILES.flatMap((p, i) => [
        `-c:v:${i}`, 'libx264',
        `-b:v:${i}`, p.videoBitrate,
        `-s:v:${i}`, p.resolution,
        `-c:a:${i}`, 'aac',
        `-b:a:${i}`, p.audioBitrate,
      ]);

      const args = [
        '-i', inputPath,
        ...maps,
        ...encoding,
        '-f', 'hls',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-hls_flags', 'independent_segments',
        '-hls_segment_type', 'mpegts',
        '-hls_segment_filename', path.join(outputDir, 'stream_%v_%03d.ts'),
        '-master_pl_name', 'master.m3u8',
        '-var_stream_map', varStreamMap,
        path.join(outputDir, 'stream_%v.m3u8'),
      ];

      const ffmpeg = spawn('ffmpeg', args);
      ffmpeg.stderr.on('data', (d) => this.logger.debug(d.toString()));
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });
  }

  private async generateThumbnail(
    inputPath: string,
    outputPath: string,
    durationSeconds: number,
  ): Promise<void> {
    const seekTime = Math.min(Math.floor(durationSeconds * 0.1), 5);
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-ss', String(seekTime),
        '-i', inputPath,
        '-vframes', '1',
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease',
        '-y',
        outputPath,
      ]);
      ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`thumbnail failed: ${code}`))));
    });
  }

  private async getDuration(inputPath: string): Promise<number> {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet', '-print_format', 'json', '-show_format', inputPath,
      ]);
      let output = '';
      ffprobe.stdout.on('data', (d) => (output += d));
      ffprobe.on('close', () => {
        try {
          const data = JSON.parse(output);
          resolve(parseFloat(data.format?.duration ?? '0'));
        } catch {
          resolve(0);
        }
      });
    });
  }

  private async downloadFromS3(key: string, localPath: string): Promise<void> {
    const url = await this.storage.getPresignedDownloadUrl(key, 3600);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download ${key}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localPath, buffer);
  }

  private async uploadHlsFiles(localDir: string, s3Prefix: string, videoId: string): Promise<void> {
    const files = await fs.readdir(localDir, { recursive: true });
    await Promise.all(
      (files as string[]).map(async (file) => {
        if (typeof file !== 'string') return;
        const filePath = path.join(localDir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) return;
        const buffer = await fs.readFile(filePath);
        const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
        await this.storage.upload(`${s3Prefix}/${file}`, buffer, contentType);
      }),
    );
  }
}
