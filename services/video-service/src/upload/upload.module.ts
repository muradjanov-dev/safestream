import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { VideosModule } from '../video/videos.module';

@Module({
  imports: [VideosModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
