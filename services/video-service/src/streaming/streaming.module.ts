import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '@safestream/database';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';

@Module({
  imports: [TypeOrmModule.forFeature([Video])],
  controllers: [StreamingController],
  providers: [StreamingService],
})
export class StreamingModule {}
