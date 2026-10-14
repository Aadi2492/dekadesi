import { Body, Controller, Get, Param, Patch, Query, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PrismaService } from './prisma.service';
import { AdminKeyGuard } from './phase4/admin-key.guard';

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'] as const;
class UpdateOrderStatusDto {
  @IsString() @IsIn(ORDER_STATUSES) status!: typeof ORDER_STATUSES[number];
  @IsOptional() @IsString() @Length(0,500) notes?: string;
}

@Controller('admin/orders')
@UseGuards(AdminKeyGuard)
export class AdminOrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('status') status?: string, @Query('q') q?: string) {
    if (status && !ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) throw new BadRequestException('Invalid order status filter');
    const search = q?.trim();
    return this.prisma.order.findMany({
      where: {
        ...(status ? { status: status as typeof ORDER_STATUSES[number] } : {}),
        ...(search ? { OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
        ] } : {}),
      },
      include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 }, shipments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  @Patch(':orderId/status')
  async updateStatus(@Param('orderId') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    const current = await this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, orderNumber: true } });
    if (!current) throw new NotFoundException('Order not found');
    if (current.status === 'REFUNDED' && dto.status !== 'REFUNDED') throw new BadRequestException('A refunded order cannot be reopened from this screen');
    const updated = await this.prisma.$transaction(async tx => {
      const order = await tx.order.update({ where: { id: orderId }, data: { status: dto.status } });
      await tx.auditLog.create({ data: { action: 'ORDER_STATUS_UPDATED', entityType: 'Order', entityId: orderId, metadata: { orderNumber: current.orderNumber, from: current.status, to: dto.status, notes: dto.notes || null } } });
      return order;
    });
    return updated;
  }
}
