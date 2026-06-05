import {
  Controller, Post, Get, Delete, Body, Param, Req,
  UseGuards, RawBodyRequest, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard, CurrentUser, RequestUser } from '@safestream/auth';
import { IsEnum } from 'class-validator';

class CreateSubscriptionDto {
  @IsEnum(['monthly', 'quarterly', 'yearly'])
  plan: 'monthly' | 'quarterly' | 'yearly';
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('subscription')
  async subscribe(
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: RequestUser,
  ) {
    // In production: fetch user email from user-service
    const result = await this.payments.createSubscription(user.id, 'user@example.com', dto.plan);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscription/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('subscriptionId') id: string) {
    await this.payments.cancelSubscription(id);
    return { success: true };
  }

  // Stripe calls this — NO auth guard, validated by signature
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    await this.payments.handleWebhook(req.rawBody!, signature);
    return { received: true };
  }
}
