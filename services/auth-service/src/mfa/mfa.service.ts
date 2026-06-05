import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { User } from '@safestream/database';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    const totp = new OTPAuth.TOTP({
      issuer: 'SafeStream',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();
    const qrCode = await QRCode.toDataURL(uri);
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase(),
    );

    // Store secret temporarily (not yet enabled)
    await this.userRepo.update(userId, { mfaSecret: secret });

    return { secret, qrCode, backupCodes };
  }

  async enable(userId: string, code: string): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.mfaSecret) throw new BadRequestException('MFA setup not initiated');

    const valid = await this.verifyCode(user.mfaSecret, code);
    if (!valid) throw new BadRequestException('Invalid code');

    await this.userRepo.update(userId, { mfaEnabled: true });
  }

  async disable(userId: string, code: string): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.mfaEnabled) throw new BadRequestException('MFA not enabled');

    const valid = await this.verifyCode(user.mfaSecret!, code);
    if (!valid) throw new BadRequestException('Invalid code');

    await this.userRepo.update(userId, { mfaEnabled: false, mfaSecret: '' });
  }

  async verifyCode(secret: string, code: string): Promise<boolean> {
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }
}
