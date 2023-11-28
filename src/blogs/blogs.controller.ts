import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query
 } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-new-blog.dto';
import { GetBlogsDto } from './dto/get-blogs.dto';
import { Blog } from './entities/blogs.entity';

@Controller('blogs')
export class BlogsController {
  constructor(private blogsService: BlogsService) {}

  @Post()
  async createBlog(@Body() body: CreateBlogDto) {
    return this.blogsService.createBlog(body);
  }

  @Get()
  async getBlogs(@Query() query: GetBlogsDto): Promise<Blog[]> {
    return this.blogsService.getBlogs(query);
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<Blog> {
    return this.blogsService.getBlogById(id);
  }
}
