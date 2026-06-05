import { Controller, Get, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { StreamingService } from './streaming.service';
import { JwtAuthGuard, Public } from '@safestream/auth';
import { Throttle } from '@nestjs/throttler';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class StreamingController {
  constructor(private readonly streaming: StreamingService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 200 } })
  @Get(':id/stream')
  async getStreamUrl(@Param('id') id: string, @Res() res: Response) {
    const manifestUrl = await this.streaming.getManifestUrl(id);
    res.redirect(302, manifestUrl);
  }

  @Public()
  @Get(':id/thumbnail')
  async getThumbnail(@Param('id') id: string, @Res() res: Response) {
    const thumbnailUrl = await this.streaming.getThumbnailUrl(id);
    res.redirect(302, thumbnailUrl);
  }
}
