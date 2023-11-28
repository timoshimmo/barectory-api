import { OmitType } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Tag } from 'src/tags/entities/tag.entity';

export class CreateProductDto extends OmitType(Product, [
  'id',
  'name',
  'slug',
  'created_at',
  'updated_at',
  'orders',
  'pivot',
  'shop',
  'categories',
  'in_stock',
  'sku',
  'quantity',
  'sale_price',
  'image',
  'gallery',
  'unit',
  'product_type',
  'price',
  'tags',
  'type',
  'related_products',
  'variation_options',
]) {
  categories: Category[];
  tags: Tag[];
}
