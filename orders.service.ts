import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { CheckoutDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly razorpay: RazorpayService) {}

  async checkout(dto: CheckoutDto) {
    if (!dto.items?.length || dto.items.length > 50) throw new BadRequestException('Add between 1 and 50 items');
    const merged = new Map<string, number>();
    for (const item of dto.items) merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: [...merged.keys()] }, isActive: true, product: { status: 'ACTIVE' } },
      include: { product: true },
    });
    if (variants.length !== merged.size) throw new BadRequestException('One or more products are unavailable');
    const byId = new Map(variants.map(v => [v.id, v]));
    let subtotalPaise = 0;
    for (const [id, quantity] of merged) {
      const v = byId.get(id)!;
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) throw new BadRequestException('Quantity must be between 1 and 100 per variant');
      if (v.stockOnHand < quantity) throw new BadRequestException(`Insufficient stock for ${v.product.name} (${v.label})`);
      subtotalPaise += v.pricePaise * quantity;
    }
    if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise < 1) throw new BadRequestException('Invalid order total');
    const shippingPaise = subtotalPaise >= 99900 ? 0 : 4900;
    const taxPaise = 0; // Configure GST rates and tax-inclusive/exclusive pricing before production.
    const totalPaise = subtotalPaise + shippingPaise + taxPaise;
    const orderNumber = `DK-${new Date().toISOString().slice(2,10).replaceAll('-', '')}-${randomUUID().slice(0,8).toUpperCase()}`;

    const order = await this.prisma.$transaction(async tx => {
      // Conditional decrement prevents two concurrent checkouts from overselling the same stock.
      for (const [id, quantity] of merged) {
        const changed = await tx.productVariant.updateMany({ where: { id, isActive: true, stockOnHand: { gte: quantity } }, data: { stockOnHand: { decrement: quantity } } });
        if (changed.count !== 1) throw new BadRequestException('Stock changed during checkout. Please refresh your cart.');
      }
      return tx.order.create({ data: {
        orderNumber, status: dto.paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING', paymentStatus: 'PENDING',
        subtotalPaise, shippingPaise, taxPaise, discountPaise: 0, totalPaise, currency: 'INR',
        customerEmail: dto.customerEmail, customerPhone: dto.shippingAddress.phone,
        shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue, notes: dto.notes,
        items: { create: [...merged].map(([id, quantity]) => { const v = byId.get(id)!; return {
          variantId: id, productName: v.product.name, variantLabel: v.label, sku: v.sku, quantity,
          unitPricePaise: v.pricePaise, totalPricePaise: v.pricePaise * quantity,
        }; }) },
      }, include: { items: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (dto.paymentMethod === 'COD') {
      await this.prisma.payment.create({ data: { orderId: order.id, provider: 'cod', amountPaise: totalPaise, status: 'PENDING' } });
      return { order: this.publicOrder(order), payment: { method: 'COD', status: 'PENDING' } };
    }
    try {
      const rp = await this.razorpay.createOrder(totalPaise, orderNumber);
      await this.prisma.payment.create({ data: { orderId: order.id, provider: 'razorpay', providerOrderId: rp.id, amountPaise: totalPaise, status: 'PENDING' } });
      return { order: this.publicOrder(order), payment: { method: 'RAZORPAY', razorpayOrderId: rp.id, amountPaise: rp.amount, currency: rp.currency, keyId: rp.keyId } };
    } catch (error) {
      // Release reserved stock if gateway order creation fails; order is retained for audit.
      await this.prisma.$transaction(async tx => {
        for (const [id, quantity] of merged) await tx.productVariant.update({ where: { id }, data: { stockOnHand: { increment: quantity } } });
        await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', paymentStatus: 'FAILED' } });
      });
      throw error;
    }
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    if (!this.razorpay.verifyCheckoutSignature(orderId, paymentId, signature)) throw new BadRequestException('Invalid payment signature');
    const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: orderId }, include: { order: true } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'PAID') return { ok: true, orderNumber: payment.order.orderNumber, paymentStatus: 'PAID' };
    await this.prisma.$transaction(async tx => {
      await tx.payment.update({ where: { id: payment.id }, data: { providerPaymentId: paymentId, providerSignature: signature, status: 'PAID' } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'PAID', status: 'CONFIRMED' } });
      await tx.auditLog.create({ data: { action: 'PAYMENT_VERIFIED', entityType: 'Order', entityId: payment.orderId, metadata: { provider: 'razorpay' } } });
    });
    return { ok: true, orderNumber: payment.order.orderNumber, paymentStatus: 'PAID' };
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) throw new BadRequestException('Invalid webhook signature');
    const event = JSON.parse(rawBody.toString('utf8')) as any;
    const eventId = String(event?.payload?.payment?.entity?.id ?? event?.payload?.refund?.entity?.id ?? '');
    if (!eventId) return { received: true, ignored: true };
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const entity = event?.payload?.payment?.entity;
      const rpOrderId = String(entity?.order_id ?? '');
      const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: rpOrderId } });
      if (payment && payment.status !== 'PAID') {
        await this.prisma.$transaction([
          this.prisma.payment.update({ where: { id: payment.id }, data: { providerPaymentId: String(entity.id), status: 'PAID', rawEvent: event } }),
          this.prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'PAID', status: 'CONFIRMED' } }),
        ]);
      }
    } else if (event.event === 'payment.failed') {
      const entity = event?.payload?.payment?.entity;
      const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: String(entity?.order_id ?? '') } });
      if (payment && payment.status === 'PENDING') await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', rawEvent: event } });
    }
    return { received: true };
  }

  async refund(orderId: string, amountPaise?: number, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order) throw new NotFoundException('Order not found');
    const payment = order.payments.find(p => p.provider === 'razorpay' && p.status === 'PAID' && p.providerPaymentId);
    if (!payment?.providerPaymentId) throw new BadRequestException('No captured Razorpay payment is available to refund');
    const alreadyRefunded = order.payments.filter(p => p.provider === 'razorpay_refund').reduce((sum, p) => sum + p.amountPaise, 0);
    const refundAmount = amountPaise ?? (payment.amountPaise - alreadyRefunded);
    if (refundAmount < 1 || refundAmount > payment.amountPaise - alreadyRefunded) throw new BadRequestException('Refund amount exceeds remaining paid amount');
    const providerRefund = await this.razorpay.refund(payment.providerPaymentId, refundAmount, { orderNumber: order.orderNumber, reason: reason ?? 'Customer refund' });
    await this.prisma.$transaction(async tx => {
      await tx.payment.create({ data: { orderId: order.id, provider: 'razorpay_refund', providerPaymentId: String(providerRefund.id), amountPaise: refundAmount, status: refundAmount === payment.amountPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED', rawEvent: providerRefund } });
      const totalRefunded = alreadyRefunded + refundAmount;
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: totalRefunded >= payment.amountPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED', ...(totalRefunded >= payment.amountPaise ? { status: 'REFUNDED' as const } : {}) } });
      await tx.auditLog.create({ data: { action: 'PAYMENT_REFUNDED', entityType: 'Order', entityId: order.id, metadata: { amountPaise: refundAmount, reason: reason ?? null } } });
    });
    return { ok: true, refundId: providerRefund.id, amountPaise: refundAmount, status: providerRefund.status };
  }

  async getOrder(orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber }, include: { items: true, payments: { select: { provider: true, status: true, amountPaise: true, createdAt: true } } } });
    if (!order) throw new NotFoundException('Order not found');
    return this.publicOrder(order);
  }
  private publicOrder(order: any) {
    return { id: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, currency: order.currency, subtotalPaise: order.subtotalPaise, shippingPaise: order.shippingPaise, taxPaise: order.taxPaise, discountPaise: order.discountPaise, totalPaise: order.totalPaise, items: order.items, createdAt: order.createdAt };
  }
}
