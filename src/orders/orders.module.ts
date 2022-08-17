import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  OrderFilesController,
  OrdersController,
  OrderStatusController,
} from './orders.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [OrdersController, OrderStatusController, OrderFilesController],
  providers: [OrdersService],
})
export class OrdersModule {}
