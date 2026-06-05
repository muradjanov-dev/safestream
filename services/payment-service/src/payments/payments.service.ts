import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EventsService, Events } from '@safestream/events';

export interface CreateSubscriptionResult {
  subscriptionId: string;
  clientSecret: string;
  status: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  readonly PLANS = {
    monthly:   { priceEnvKey: 'STRIPE_PRICE_MONTHLY',   name: 'Monthly Premium' },
    quarterly: { priceEnvKey: 'STRIPE_PRICE_QUARTERLY', name: 'Quarterly Premium' },
    yearly:    { priceEnvKey: 'STRIPE_PRICE_YEARLY',    name: 'Annual Premium' },
  } as const;

  constructor(
    private readonly config: ConfigService,
    private readonly events: EventsService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2024-04-10',
    });
  }

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const existing = await this.stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    });
    if (existing.data.length > 0) return existing.data[0].id;

    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });
    return customer.id;
  }

  async createSubscription(
    userId: string,
    email: string,
    plan: keyof typeof PaymentsService.prototype.PLANS,
  ): Promise<CreateSubscriptionResult> {
    const priceId = this.config.get<string>(this.PLANS[plan].priceEnvKey);
    if (!priceId) throw new BadRequestException(`Plan ${plan} not configured`);

    const customerId = await this.getOrCreateCustomer(userId, email);

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: 0,
      metadata: { userId },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const intent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: intent.client_secret!,
      status: subscription.status,
    };
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature invalid: ${err}`);
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = sub.metadata.userId;
        await this.events.publish(Events.SUBSCRIPTION_ACTIVATED, {
          userId,
          planId: 1,
          expiresAt: new Date(sub.current_period_end * 1000).toISOString(),
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.events.publish(Events.SUBSCRIPTION_EXPIRED, {
          userId: sub.metadata.userId,
        });
        break;
      }
    }
  }
}
