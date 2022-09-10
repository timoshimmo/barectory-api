import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  OrderFilesController,
  OrdersController,
  OrderStatusController,
} from './orders.controller';
import { SalesMailModule } from 'src/mail/sales.mail.module';

@Module({
  imports: [SalesMailModule],
  controllers: [OrdersController, OrderStatusController, OrderFilesController],
  providers: [OrdersService],
})
export class OrdersModule {}
