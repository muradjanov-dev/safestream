import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnDomain: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.bucket = config.get<string>('AWS_S3_BUCKET', 'safestream-videos');
    this.cdnDomain = config.get<string>('AWS_CLOUDFRONT_DOMAIN', '');
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return this.getPublicUrl(key);
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn },
    );
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async initMultipartUpload(key: string, contentType: string): Promise<string> {
    const result = await this.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
    );
    return result.UploadId!;
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer,
  ): Promise<string> {
    const result = await this.s3.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      }),
    );
    return result.ETag!;
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[],
  ): Promise<string> {
    await this.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );
    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    if (this.cdnDomain) return `https://${this.cdnDomain}/${key}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  buildVideoKey(videoId: string, filename: string): string {
    return `videos/${videoId}/original/${filename}`;
  }

  buildHlsKey(videoId: string, quality: string): string {
    return `videos/${videoId}/hls/${quality}`;
  }

  buildThumbnailKey(videoId: string): string {
    return `videos/${videoId}/thumbnail.jpg`;
  }

  buildAvatarKey(userId: string): string {
    return `avatars/${userId}.jpg`;
  }

  buildMessageAttachmentKey(messageId: string, filename: string): string {
    return `messages/${messageId}/${filename}`;
  }
}
