import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AdminKeyGuard } from './admin-key.guard';
class NotificationDto { @IsString() @MaxLength(160) title!: string; @IsString() @MaxLength(3000) message!: string; @IsOptional() @IsString() recipient?: string; @IsOptional() @IsString() channel?: string; }
@Controller('admin/notifications') @UseGuards(AdminKeyGuard)
export class NotificationsController { constructor(private db: PrismaService) {} @Get() list(){return this.db.storeNotification.findMany({orderBy:{createdAt:'desc'},take:200});} @Post() queue(@Body() dto:NotificationDto){return this.db.storeNotification.create({data:{...dto,status:'QUEUED'}});} }
