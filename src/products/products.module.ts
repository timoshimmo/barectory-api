import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ProductsController,
  PopularProductsController,
  SalesProductsController,
} from './products.controller';

@Module({
  controllers: [ProductsController, PopularProductsController, SalesProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
