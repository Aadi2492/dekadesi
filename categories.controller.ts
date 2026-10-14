import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Public category feed used by the storefront category filters. */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly db: PrismaService) {}

  @Get()
  async list() {
    return this.db.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, description: true },
    });
  }
}
