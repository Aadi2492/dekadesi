import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AdminKeyGuard } from './admin-key.guard';

class CreateShipmentDto { @IsString() orderId!: string; @IsOptional() @IsString() carrier?: string; @IsOptional() @IsString() trackingNumber?: string; @IsOptional() @IsString() trackingUrl?: string; @IsOptional() @IsString() notes?: string; }
class UpdateShipmentDto { @IsOptional() @IsString() carrier?: string; @IsOptional() @IsString() trackingNumber?: string; @IsOptional() @IsString() trackingUrl?: string; @IsOptional() @IsString() status?: string; @IsOptional() @IsString() @MaxLength(2000) notes?: string; }
@Controller('admin/shipments')
@UseGuards(AdminKeyGuard)
export class ShipmentsController {
 constructor(private db: PrismaService) {}
 @Get() list() { return this.db.shipment.findMany({ include: { order: { select: { orderNumber: true, status: true, customerEmail: true, customerPhone: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }); }
 @Post() async create(@Body() dto: CreateShipmentDto) { const order = await this.db.order.findUnique({ where: { id: dto.orderId } }); if (!order) throw new Error('Order not found'); return this.db.shipment.create({ data: dto }); }
 @Patch(':id') async update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) { const data: any = { ...dto }; if (dto.status === 'SHIPPED') data.shippedAt = new Date(); if (dto.status === 'DELIVERED') data.deliveredAt = new Date(); return this.db.shipment.update({ where: { id }, data }); }
}
