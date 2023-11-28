import { Type } from 'class-transformer';

export class CommonEntity {
  id: string;
  @Type(() => Date)
  created_at: Date;
  @Type(() => Date)
  updated_at: Date;
}
