import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto, UserPaginator } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
//import { Category } from 'src/categories/entities/category.entity';
//import { Product } from 'src/products/entities/product.entity';
//import productsJson from '@db/products.json';
import Fuse from 'fuse.js';
import * as admin from 'firebase-admin';

//const products = plainToClass(Product, productsJson);

enum Permission {
  SUPER_ADMIN = 'Super admin',
  STORE_OWNER = 'Store owner',
  STAFF = 'Staff',
  CUSTOMER = 'Customer',
  ADMIN = 'Admin'
}

/*
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const serviceAccount = require('../config/barectory-firebase-adminsdk.json');

var firestore = admin.firestore();
var batch = firestore.batch();

for(var myKey in productsJson) {
  var myKeyRef = firestore.collection('products').doc();
  batch.set(myKeyRef, productsJson[myKey]);
}
batch.commit().then(function () {
  console.log("Successful");
});

*/

import { User } from './entities/user.entity';
import usersJson from './users.json';
import { paginate } from 'src/common/pagination/paginate';
const users = plainToClass(User, usersJson);

/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

*/

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
    const db = admin.firestore();
    const docRef = db.collection('admin');
    let results;
    let url;
    if (!page) page = 1;
    let data = [];
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());

          if (text?.replace(/%/g, '')) {
            data = fuse.search(text)?.map(({ item }) => item);
          }
          results = data.slice(startIndex, endIndex);
          url = `/users?limit=${limit}`;
        });
    });

  //  console.log(data);
    //let data: User[] = this.users;


    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  async makeAdmin({user_id}: UpdateAdminDto) {
    //const db = admin.firestore();
    const docRef = admin.firestore().collection('admin').doc(user_id);
    const doc = await docRef.get();
    let result;
    if(!doc.exists) {
      console.log('No such document!');
    }
    else {
      //console.log('Document data:', doc.data().permissions[0].name);
      if(doc.data().permissions[0].name === Permission.ADMIN) {
        await docRef.update({
          permissions: admin.firestore.FieldValue.arrayRemove({
            id: 1,
            name: Permission.ADMIN
          }),
        }).then(() => {
          docRef.update({
            permissions: admin.firestore.FieldValue.arrayUnion({
              id: 1,
              name: Permission.STAFF
            }),
          }).then(() => {
            console.log('Write succeeded!');
            result = true;
          })
        });
        //  const permsRef = ref.child('permissions');
        //  const hopperRef = usersRef.child('gracehop');
      //  await docRef.update({'permissions.0.name': Permission.STAFF});
      }
      else {
        await docRef.update({
          permissions: admin.firestore.FieldValue.arrayRemove({
            id: 1,
            name: Permission.STAFF
          }),
        }).then(() => {
          docRef.update({
            permissions: admin.firestore.FieldValue.arrayUnion({
              id: 1,
              name: Permission.ADMIN
            }),
          }).then(() => {
            console.log('Write succeeded!');
            result = true;
          })
        });
      }
    }
    /*let result = false;
    await docRef.doc(user_id).update({
      permissions: admin.firestore.FieldValue.arrayUnion({
        id: 1,
        name: Permission.ADMIN
      }),
    }).then(() => {
      console.log('Write succeeded!');
      result = true;
    }); */

    return {
      success: result,
      message: 'Admin permissions updated',
    };
  }

  findOne(id: number) {
    return this.users.find((user) => user.id === id);
  }

  async updateCustomer(id: string, updateUserDto: UpdateUserDto) {
    let result = false;
    let uMobileNo = null;
    let picurl = null;
    //console.log("UPDATE DATA: " + JSON.stringify(updateUserDto, null, 2));
    if(updateUserDto.profile.contact) {
      uMobileNo = updateUserDto.profile.contact;
      if(uMobileNo.charAt(0) === '0') {
        const xMobileNo = uMobileNo.substring(1);
        uMobileNo = '+234'+xMobileNo;
      }
    }

    if(updateUserDto.profile.avatar.original) {
      picurl = updateUserDto.profile.avatar.original;
    }

    await admin.auth().updateUser(id, {
      phoneNumber: uMobileNo,
      displayName: updateUserDto.name,
      photoURL: picurl,
    })
    .then(async(userRecord) => {
      // See the UserRecord reference doc for the contents of `userRecord`.
      //  console.log("Successfully updated user", userRecord.toJSON());
      if(userRecord) {
        const docRef = admin.firestore().collection('customer').doc(id);

        await docRef.update({
          name: updateUserDto.name,
          profile: updateUserDto.profile
        }).then(() => {
          console.log('Write succeeded!');
          result = true;
        })
      }

    })
    .catch(function(error) {
      console.log("Error updating user:", error);
    });

    return {
      success: result,
      message: 'Customer profile updated',
    };
  }

  async updateCustomerAddress(id: string, updateUserDto: UpdateUserDto) {

    let result = false;

    const docRef = admin.firestore().collection('customer').doc(id);

    await docRef.update({
      address: updateUserDto.address,
    }).then(() => {
      console.log('Write succeeded!');
      result = true;
    })

    return {
      success: result,
      message: 'Customer address updated',
    };

  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let result = false;
    let uMobileNo = "";

    if(updateUserDto.profile.contact) {
      uMobileNo = updateUserDto.profile.contact;
      if(uMobileNo.charAt(0) === '0') {
        const xMobileNo = uMobileNo.substring(1);
        uMobileNo = '+234'+xMobileNo;
      }
    }

    await admin.auth().updateUser(id, {
      phoneNumber: uMobileNo,
      displayName: updateUserDto.name,
      photoURL: updateUserDto.profile.avatar.original,
    })
    .then(async(userRecord) => {
      // See the UserRecord reference doc for the contents of `userRecord`.
      //  console.log("Successfully updated user", userRecord.toJSON());
      if(userRecord) {
        const docRef = admin.firestore().collection('admin').doc(id);

        await docRef.update({
          name: updateUserDto.name,
          profile: updateUserDto.profile
        }).then(() => {
          console.log('Write succeeded!');
          result = true;
        })
      }

    })
    .catch(function(error) {
      console.log("Error updating user:", error);
    });

    return {
      success: result,
      message: 'Admin profile updated',
    };
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
