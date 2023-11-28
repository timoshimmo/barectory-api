import { UserAddress } from 'src/addresses/entities/address.entity';
import { CoreEntity } from 'src/common/entities/core.entity';
import { CommonEntity } from 'src/common/entities/common.entity';
import { Coupon } from 'src/coupons/entities/coupon.entity';
import { File, Product } from 'src/products/entities/product.entity';
import { OrderProduct } from 'src/products/entities/product.entity';
import { Shop } from 'src/shops/entities/shop.entity';
import { User } from 'src/users/entities/user.entity';
import { OrderUser } from 'src/users/entities/user.entity';
import { OrderStatus } from './order-status.entity';

export enum PaymentGatewayType {
  PAYSTACK = 'paystack',
  CASH_ON_DELIVERY = 'cod',
}

export class Order extends CommonEntity {
  tracking_number: string;
  customer_id: string;
  customer_contact: string;
  customer: OrderUser;
  parent_order?: Order;
  children: Order[];
  status: OrderStatus;
  amount: number;
  sales_tax: number;
  total: number;
  paid_total: number;
  payment_id?: string;
  payment_gateway: PaymentGatewayType;
  coupon?: Coupon;
  discount?: number;
  delivery_fee: number;
  delivery_time: string;
  products: OrderProduct[];
  shipping_address: any;
}

export class OrderFiles extends CoreEntity {
  purchase_key: string;
  digital_file_id: number;
  order_id?: number;
  customer_id: number;
  file: File;
  fileable: Product;
}
