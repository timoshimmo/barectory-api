import { Injectable } from '@nestjs/common';
import {
  AuthResponse,
  ChangePasswordDto,
  ForgetPasswordDto,
  LoginDto,
  CoreResponse,
  RegisterDto,
  CreateAdminDto,
  ResetPasswordDto,
  VerifyForgetPasswordDto,
  SocialLoginDto,
  OtpLoginDto,
  OtpResponse,
  VerifyOtpDto,
  OtpDto,
} from './dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import { Customer } from 'src/users/entities/customer.entity';
import { Admin } from 'src/users/entities/admin.entity';
import { Profile } from 'src/users/entities/profile.entity';
import usersJson from 'src/users/users.json';
import * as admin from 'firebase-admin';

const users = plainToClass(User, usersJson);

enum Permission {
  SUPER_ADMIN = 'Super admin',
  STORE_OWNER = 'Store owner',
  STAFF = 'Staff',
  CUSTOMER = 'Customer',
}

@Injectable()
export class AuthService {
  private users: User[] = users;
  async register(createUserInput: RegisterDto): Promise<AuthResponse> {

    const db = admin.firestore();
    let token;
    try {
        const docRef = db.collection('admin');
        admin
        .auth()
        .createUser({
          email: createUserInput.email,
          emailVerified: true,
          password: createUserInput.password,
          displayName: createUserInput.name,
        })
        .then(async(userRecord) => {
          // See the UserRecord reference doc for the contents of userRecord.

          const profile: Profile = {
            id: 1,
            avatar: null,
            bio: "",
            socials: null,
            contact: "",
            created_at: new Date(),
            updated_at: new Date(),
          };
          const user: Admin = {
            id: userRecord.uid,
            is_active: true,
            permissions: [{
              id: 1,
              name: Permission.SUPER_ADMIN
            }],
            profile: profile,
            email: createUserInput.email,
            name: createUserInput.name
          };
          const result = await docRef.doc(userRecord.uid).set(user).catch(console.error);
          console.log('Successfully created new user:', userRecord.uid);
          token = userRecord.uid;
          //return result;
        });

      } catch (e) {
          throw e;

      }

      return {
        token: 'jwt token',
        permissions: ['super_admin'],
      };

  }

  async createAdmin(createUserInput: CreateAdminDto): Promise<AuthResponse> {
  //  console.log("USER INPUT: " + JSON.stringify(createUserInput));
    const db = admin.firestore();
    let token;
    try {
        const docRef = db.collection('admin');
        admin
        .auth()
        .createUser({
          email: createUserInput.email,
          emailVerified: true,
          password: createUserInput.password,
          displayName: createUserInput.name,
        })
        .then(async(userRecord) => {
          // See the UserRecord reference doc for the contents of userRecord.

          const profile: Profile = {
            id: 1,
            avatar: null,
            bio: "",
            socials: null,
            contact: "",
            created_at: new Date(),
            updated_at: new Date(),
          };
          const user: Admin = {
            id: userRecord.uid,
            is_active: true,
            permissions: [{
              id: 1,
              name: Permission.STAFF
            }],
            profile: profile,
            email: createUserInput.email,
            name: createUserInput.name
          };
          const result = await docRef.doc(userRecord.uid).set(user).catch(console.error);
          console.log('Successfully created new user:', userRecord.uid);
          token = userRecord.uid;
          //return result;
        });

      } catch (e) {
          throw e;

      }

      return {
        token: 'jwt token',
        permissions: ['super_admin'],
      };

  }

  async createCustomer(createUserInput: RegisterDto): Promise<AuthResponse> {
    const db = admin.firestore();
    let token;
    try {

        const docRef = db.collection('customer');

        admin
        .auth()
        .createUser({
          email: createUserInput.email,
          emailVerified: true,
          password: createUserInput.password,
          displayName: createUserInput.name,
        })
        .then(async(userRecord) => {
          // See the UserRecord reference doc for the contents of userRecord.

          const profile: Profile = {
            id: 1,
            avatar: null,
            bio: "",
            socials: null,
            contact: "",
            created_at: new Date(),
            updated_at: new Date(),
          };
          const user: Customer = {
            uid: userRecord.uid,
            is_active: true,
            shop_id: null,
            loyaltyPoints: 0,
            address: [],
            profile: profile,
            email: createUserInput.email,
            name: createUserInput.name
          };
          const result = await docRef.doc(userRecord.uid).set(user).catch(console.error);
          console.log('Successfully created new user:', userRecord.uid);
          token = userRecord.uid;
          //return result;
        });

      } catch (e) {
          throw e;
      }

      return {
        token: 'jwt token',
        permissions: ['customer'],
      };

  }

  async login(loginInput: LoginDto): Promise<AuthResponse> {
    console.log(loginInput);
    return {
      token: 'jwt token',
      permissions: ['super_admin', 'customer'],
    };
  }

  async changePassword(
    changePasswordInput: ChangePasswordDto,
  ): Promise<CoreResponse> {
    console.log(changePasswordInput);
  /*  admin.auth().currentUser.reauthenticateWithCredential(
      admin.auth.EmailAuthProvider.credential(admin.auth().currentUser.email, changePasswordInput.oldPassword)
    );*/
    return {
      success: true,
      message: 'Password change successful',
    };
  }

  async forgetPassword(
    forgetPasswordInput: ForgetPasswordDto,
  ): Promise<CoreResponse> {

    console.log(forgetPasswordInput);
    return {
      success: true,
      message: 'Password change successful',
    };
  }

  async verifyForgetPasswordToken(
    verifyForgetPasswordTokenInput: VerifyForgetPasswordDto,
  ): Promise<CoreResponse> {
    console.log(verifyForgetPasswordTokenInput);

    return {
      success: true,
      message: 'Password change successful',
    };
  }

  async resetPassword(
    resetPasswordInput: ResetPasswordDto,
  ): Promise<CoreResponse> {
    console.log(resetPasswordInput);

    return {
      success: true,
      message: 'Password change successful',
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto): Promise<AuthResponse> {
    console.log(socialLoginDto);
    return {
      token: 'jwt token',
      permissions: ['super_admin', 'customer'],
    };
  }

  async otpLogin(otpLoginDto: OtpLoginDto): Promise<AuthResponse> {
    console.log(otpLoginDto);
    return {
      token: 'jwt token',
      permissions: ['super_admin', 'customer'],
    };
  }

  async verifyOtpCode(verifyOtpInput: VerifyOtpDto): Promise<CoreResponse> {
    console.log(verifyOtpInput);
    return {
      message: 'success',
      success: true,
    };
  }

  async sendOtpCode(otpInput: OtpDto): Promise<OtpResponse> {
    console.log(otpInput);
    return {
      message: 'success',
      success: true,
      id: '1',
      provider: 'google',
      phone_number: '+919494949494',
      is_contact_exist: true,
    };
  }

  // async getUsers({ text, first, page }: GetUsersArgs): Promise<UserPaginator> {
  //   const startIndex = (page - 1) * first;
  //   const endIndex = page * first;
  //   let data: User[] = this.users;
  //   if (text?.replace(/%/g, '')) {
  //     data = fuse.search(text)?.map(({ item }) => item);
  //   }
  //   const results = data.slice(startIndex, endIndex);
  //   return {
  //     data: results,
  //     paginatorInfo: paginate(data.length, page, first, results.length),
  //   };
  // }
  // public getUser(getUserArgs: GetUserArgs): User {
  //   return this.users.find((user) => user.id === getUserArgs.id);
  // }

  async me(id: string): Promise<Admin> {

    const db = admin.firestore();
    let result: Admin;
    let response;

    const docRef = db.collection('admin').doc(id);

    await docRef.get().then((doc) => {
        if (doc.exists) {
            result = {
              id: doc.data().id,
              is_active: doc.data().is_active,
              profile: doc.data().profile,
              email: doc.data().email,
              name: doc.data().name,
            };
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });

    return result;
  }

  customer(): User {
    return this.users[0];
  }

  // updateUser(id: number, updateUserInput: UpdateUserInput) {
  //   return `This action updates a #${id} user`;
  // }
}
