import { Address } from 'src/addresses/entities/address.entity';
// import { Order } from 'src/orders/entities/order.entity';
import { Shop } from 'src/shops/entities/shop.entity';
import { Profile } from './profile.entity';

export class Customer {
  uid: string;
  name: string;
  email: string;
  password?: string;
  shop_id?: number;
  profile?: Profile;
  is_active?: boolean = true;
  address?: Address[];
  // orders?: Order[];
}
