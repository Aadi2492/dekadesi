import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AdminKeyGuard } from './admin-key.guard';
class CouponDto { @IsString() @MaxLength(40) code!: string; @IsString() discountType!: string; @IsInt() @Min(1) discountValue!: number; @IsOptional() @IsInt() @Min(0) minimumPaise?: number; @IsOptional() @IsInt() @Min(1) maxUses?: number; @IsOptional() @IsString() description?: string; }
@Controller('admin/coupons') @UseGuards(AdminKeyGuard)
export class CouponsController { constructor(private db: PrismaService) {} @Get() list(){ return this.db.coupon.findMany({orderBy:{createdAt:'desc'}}); } @Post() create(@Body() dto: CouponDto){ const type=dto.discountType.toUpperCase(); if(!['PERCENT','FIXED'].includes(type)) throw new Error('discountType must be PERCENT or FIXED'); if(type==='PERCENT' && dto.discountValue>100) throw new Error('Percent discount cannot exceed 100'); return this.db.coupon.create({data:{...dto,code:dto.code.trim().toUpperCase(),discountType:type}}); } }
