import { PickType } from '@nestjs/swagger';
import { Blog } from '../entities/blogs.entity';

export class CreateBlogDto extends PickType(Blog, [
  'img',
  'subject',
  'topic',
  'date',
  'content',
]) {}
