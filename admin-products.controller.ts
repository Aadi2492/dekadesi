import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from './prisma.service';
import { AdminKeyGuard } from './phase4/admin-key.guard';

class ProductWriteDto {
  @IsString() @Length(2, 140) name!: string;
  @IsString() @Length(2, 160) slug!: string;
  @IsString() @Length(1, 100) sku!: string;
  @IsString() @Length(1, 80) category!: string;
  @Type(() => Number) @IsInt() @Min(1) pricePaise!: number;
  @Type(() => Number) @IsInt() @Min(0) stockOnHand!: number;
  @IsString() @Length(1, 80) variantLabel!: string;
  @IsOptional() @IsString() @MaxLength(500) shortDescription?: string;
  @IsOptional() @IsBoolean() publish?: boolean;
}

class ProductUpdateDto {
  @IsOptional() @IsString() @Length(2, 140) name?: string;
  @IsOptional() @IsString() @Length(2, 160) slug?: string;
  @IsOptional() @IsString() @Length(1, 100) sku?: string;
  @IsOptional() @IsString() @Length(1, 80) category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pricePaise?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockOnHand?: number;
  @IsOptional() @IsString() @Length(1, 80) variantLabel?: string;
  @IsOptional() @IsString() @MaxLength(500) shortDescription?: string;
  @IsOptional() @IsBoolean() publish?: boolean;
}

@Controller('admin/products')
@UseGuards(AdminKeyGuard)
export class AdminProductsController {
  constructor(private readonly db: PrismaService) {}

  @Get()
  list() {
    return this.db.product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: true, variants: true, assets: true },
    });
  }

  @Post()
  async create(@Body() dto: ProductWriteDto) {
    const categoryName = dto.category.trim();
    const categorySlug = slugify(categoryName);
    const slug = slugify(dto.slug);
    const sku = dto.sku.trim().toUpperCase();
    if (!slug || !sku) throw new BadRequestException('A valid slug and SKU are required');
    const category = await this.db.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: categoryName, slug: categorySlug },
    });
    return this.db.product.create({
      data: {
        name: dto.name.trim(), slug, shortDescription: dto.shortDescription?.trim(),
        status: dto.publish ? 'ACTIVE' : 'DRAFT', categoryId: category.id,
        variants: { create: { sku, label: dto.variantLabel.trim(), pricePaise: dto.pricePaise, stockOnHand: dto.stockOnHand } },
      },
      include: { category: true, variants: true, assets: true },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: ProductUpdateDto) {
    const existing = await this.db.product.findUnique({ where: { id }, include: { variants: true } });
    if (!existing) throw new NotFoundException('Product not found');
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.shortDescription !== undefined) data.shortDescription = dto.shortDescription.trim();
    if (dto.publish !== undefined) data.status = dto.publish ? 'ACTIVE' : 'DRAFT';
    if (dto.category !== undefined) {
      const name = dto.category.trim(); const slug = slugify(name);
      const category = await this.db.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
      data.categoryId = category.id;
    }
    return this.db.$transaction(async tx => {
      const product = await tx.product.update({ where: { id }, data });
      const variant = existing.variants[0];
      if (variant && (dto.pricePaise !== undefined || dto.stockOnHand !== undefined || dto.sku !== undefined || dto.variantLabel !== undefined)) {
        await tx.productVariant.update({ where: { id: variant.id }, data: {
          ...(dto.pricePaise !== undefined ? { pricePaise: dto.pricePaise } : {}),
          ...(dto.stockOnHand !== undefined ? { stockOnHand: dto.stockOnHand } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku.trim().toUpperCase() } : {}),
          ...(dto.variantLabel !== undefined ? { label: dto.variantLabel.trim() } : {}),
        }});
      }
      return tx.product.findUnique({ where: { id: product.id }, include: { category: true, variants: true, assets: true } });
    });
  }

  /** Soft-delete by archiving to preserve historical order references. */
  @Delete(':id')
  async archive(@Param('id') id: string) {
    const product = await this.db.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.db.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
