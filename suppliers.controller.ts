import { Body, Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AdminKeyGuard } from './admin-key.guard';
class SupplierDto { @IsString() @MaxLength(160) name!: string; @IsOptional() @IsString() contactName?: string; @IsOptional() @IsEmail() email?: string; @IsOptional() @IsString() phone?: string; @IsOptional() @IsString() notes?: string; }
@Controller('admin/suppliers') @UseGuards(AdminKeyGuard)
export class SuppliersController { constructor(private db: PrismaService) {} @Get() list(){ return this.db.supplier.findMany({ orderBy: { name: 'asc' } }); } @Post() create(@Body() dto: SupplierDto){ return this.db.supplier.create({data:dto}); } @Patch(':id') update(@Param('id') id:string,@Body() dto: Partial<SupplierDto>){ return this.db.supplier.update({where:{id},data:dto}); } }
