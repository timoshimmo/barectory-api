import { CoreEntity } from 'src/common/entities/core.entity';
// import { Order } from 'src/orders/entities/order.entity';
import { Profile } from './profile.entity';

export class Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  profile?: Profile;
  is_active?: boolean = true;
  permissions?: Permissions[];
}

export class Permissions {
  id: number;
  name: string;
}
