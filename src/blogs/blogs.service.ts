import { Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-new-blog.dto';
import { GetBlogsDto } from './dto/get-blogs.dto';
import { Blog } from './entities/blogs.entity';
import Fuse from 'fuse.js';
import * as admin from 'firebase-admin';

import { paginate } from 'src/common/pagination/paginate';

@Injectable()
export class BlogsService {
  async createBlog(createBlogDto: CreateBlogDto) {
    return `Your email successfully subscribed`;
  }

  async getBlogs({ limit }: GetBlogsDto): Promise<Blog[]> {
    const db = admin.firestore();
    const docRef = db.collection('blog');

    const moptions = {
      keys: ['subject', 'topic', 'content'],
      threshold: 0.0,
    };

    let results;
    let data = [];

    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
    });

    const fuse = new Fuse(data, moptions);

  //  console.log(data);
    //let data: User[] = this.users;

    return data?.slice(0, limit);
  }



  async getBlogById(id: string): Promise<Blog> {

    const db = admin.firestore();
    const docRef = db.collection('blog');

    let results;
    let data = [];
  //  let data: Product[] = this.products;
    let blog;

    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());

        });
    });

    blog = data.find((p) => p.id === id);

    return blog;

  }
}
