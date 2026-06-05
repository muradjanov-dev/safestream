import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@safestream/database';
import { MfaService } from './mfa.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
