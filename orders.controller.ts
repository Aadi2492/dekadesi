import { Body, Controller, Get, Headers, Param, Post, RawBodyRequest, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CheckoutDto, RefundDto, VerifyPaymentDto } from './dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout') checkout(@Body() dto: CheckoutDto) { return this.orders.checkout(dto); }

  @Get('orders/:orderNumber') getOrder(@Param('orderNumber') orderNumber: string) { return this.orders.getOrder(orderNumber); }

  @Post('payments/verify') verify(@Body() dto: VerifyPaymentDto) {
    return this.orders.verifyPayment(dto.razorpay_order_id, dto.razorpay_payment_id, dto.razorpay_signature);
  }

  @Post('payments/webhook') webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature?: string) {
    if (!req.rawBody) throw new UnauthorizedException('Webhook raw body is unavailable; enable rawBody in Nest bootstrap');
    return this.orders.handleWebhook(req.rawBody, signature);
  }

  @Post('admin/orders/:orderId/refund') refund(@Param('orderId') orderId: string, @Body() dto: RefundDto, @Headers('x-admin-api-key') key?: string) {
    const configured = process.env.ADMIN_API_KEY;
    if (!configured || !key || key.length !== configured.length || !require('crypto').timingSafeEqual(Buffer.from(key), Buffer.from(configured))) {
      throw new UnauthorizedException('Valid admin API key required');
    }
    return this.orders.refund(orderId, dto.amountPaise, dto.reason);
  }
}
