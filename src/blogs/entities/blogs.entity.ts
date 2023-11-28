import { CommonEntity } from 'src/common/entities/common.entity';

export class Blog extends CommonEntity {
  img: string;
  subject: string;
  topic: string;
  date: string;
  content: string;
}
