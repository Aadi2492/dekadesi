import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class RazorpayService {
  private get keyId() { return process.env.RAZORPAY_KEY_ID ?? ''; }
  private get keySecret() { return process.env.RAZORPAY_KEY_SECRET ?? ''; }
  private get webhookSecret() { return process.env.RAZORPAY_WEBHOOK_SECRET ?? ''; }
  private assertConfigured() {
    if (!this.keyId || !this.keySecret) throw new ServiceUnavailableException('Online payments are not configured. Use COD or configure Razorpay keys.');
  }
  async createOrder(amountPaise: number, receipt: string) {
    this.assertConfigured();
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, payment_capture: 1 }),
    });
    const payload = await response.json().catch(() => ({})) as any;
    if (!response.ok) throw new InternalServerErrorException(payload?.error?.description ?? 'Razorpay order creation failed');
    return { id: String(payload.id), amount: Number(payload.amount), currency: String(payload.currency), keyId: this.keyId };
  }
  verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
    this.assertConfigured();
    return this.safeEqual(createHmac('sha256', this.keySecret).update(`${orderId}|${paymentId}`).digest('hex'), signature);
  }
  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined) {
    if (!this.webhookSecret || !signature) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    return this.safeEqual(expected, signature);
  }
  async refund(paymentId: string, amountPaise?: number, notes?: Record<string, string>) {
    this.assertConfigured();
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(amountPaise ? { amount: amountPaise } : {}), notes: notes ?? {} }),
    });
    const payload = await response.json().catch(() => ({})) as any;
    if (!response.ok) throw new InternalServerErrorException(payload?.error?.description ?? 'Razorpay refund failed');
    return payload;
  }
  private safeEqual(expected: string, actual: string) {
    const a = Buffer.from(expected); const b = Buffer.from(actual);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
