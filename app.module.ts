import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ProductsController } from './products.controller';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { RazorpayService } from './payments/razorpay.service';
import { PrismaService } from './prisma.service';
import { AdminKeyGuard } from './phase4/admin-key.guard';
import { ShipmentsController } from './phase4/shipments.controller';
import { SuppliersController } from './phase4/suppliers.controller';
import { CouponsController } from './phase4/coupons.controller';
import { SupportController } from './phase4/support.controller';
import { ReportsController } from './phase4/reports.controller';
import { NotificationsController } from './phase4/notifications.controller';
import { CategoriesController } from './categories.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminOrdersController } from './admin-orders.controller';

@Module({ controllers: [HealthController, ProductsController, CategoriesController, AdminProductsController, AdminOrdersController, OrdersController, ShipmentsController, SuppliersController, CouponsController, SupportController, ReportsController, NotificationsController], providers: [PrismaService, OrdersService, RazorpayService, AdminKeyGuard] })
export class AppModule {}
