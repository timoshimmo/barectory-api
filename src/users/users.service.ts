import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto, UserPaginator } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import Fuse from 'fuse.js';

//const functions = require("firebase-functions");
//const admin = require('firebase-admin');
//const serviceAccount = require('../config/barectory-firebase-adminsdk-91i9o-5b1b877ed7.json');

import { User } from './entities/user.entity';
import usersJson from './users.json';
import { paginate } from 'src/common/pagination/paginate';
const users = plainToClass(User, usersJson);

/*admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}); */

//const db = admin.firestore();

const options = {
  keys: ['name', 'type.slug', 'categories.slug', 'status'],
  threshold: 0.3,
};
const fuse = new Fuse(users, options);
@Injectable()
export class UsersService {

  private users: User[] = users;

  create(createUserDto: CreateUserDto) {
    return this.users[0];
  }

  createAdmin({ name, email, password }: CreateUserDto) {
  /*  try {
      const docRef = db.collection('admin');
      admin
      .auth()
      .createUser({
        email: email,
        emailVerified: true,
        password: password,
        displayName: name,
      })
      .then(async(userRecord) => {
        // See the UserRecord reference doc for the contents of userRecord.
        const result = await docRef.doc(userRecord.uid).set({name: name, email: email, role: "admin"}).catch(console.error);
        console.log('Successfully created new user:', userRecord.uid);
        return result;
      });

    } catch (e) {
        throw e;
    }*/
    return this.users[0];
  }

  async getUsers({ text, limit, page }: GetUsersDto): Promise<UserPaginator> {
    if (!page) page = 1;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let data: User[] = this.users;
    if (text?.replace(/%/g, '')) {
      data = fuse.search(text)?.map(({ item }) => item);
    }
    const results = data.slice(startIndex, endIndex);
    const url = `/users?limit=${limit}`;

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }
  
  findOne(id: number) {
    return this.users.find((user) => user.id === id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.users[0];
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
