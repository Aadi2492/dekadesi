import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AdminKeyGuard } from './admin-key.guard';
class TicketDto { @IsString() @MaxLength(160) customerName!: string; @IsOptional() @IsEmail() customerEmail?: string; @IsOptional() @IsString() customerPhone?: string; @IsString() @MaxLength(200) subject!: string; @IsString() @MaxLength(5000) message!: string; @IsOptional() @IsString() orderId?: string; @IsOptional() @IsIn(['LOW','NORMAL','HIGH','URGENT']) priority?: string; }
class TicketUpdateDto { @IsOptional() @IsIn(['OPEN','IN_PROGRESS','WAITING','RESOLVED','CLOSED']) status?: string; @IsOptional() @IsIn(['LOW','NORMAL','HIGH','URGENT']) priority?: string; @IsOptional() @IsString() assignedTo?: string; @IsOptional() @IsString() @MaxLength(5000) resolution?: string; }
@Controller('admin/support-tickets')
export class SupportController { constructor(private db: PrismaService) {}
 @Post() create(@Body() dto: TicketDto){ return this.db.supportTicket.create({data:dto}); }
 @Get() @UseGuards(AdminKeyGuard) list(){ return this.db.supportTicket.findMany({include:{order:{select:{orderNumber:true}}},orderBy:[{priority:'desc'},{createdAt:'desc'}],take:200}); }
 @Patch(':id') @UseGuards(AdminKeyGuard) update(@Param('id') id:string,@Body() dto:TicketUpdateDto){return this.db.supportTicket.update({where:{id},data:dto});}
}
