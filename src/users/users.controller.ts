import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
//import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/register')
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createAdmin(createUserDto);
  }

  @Post('/make-admin')
  makeAdmin(@Body() updateAdminDto: UpdateAdminDto) {
    return this.usersService.makeAdmin(updateAdminDto);
  }

  @Get()
  getAllUsers(@Query() query: GetUsersDto) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put('update-customer/:id')
  updateCustomer(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //  console.log("UPDATE CUSTOMER ID: " + id);
    return this.usersService.updateCustomer(id, updateUserDto);
  }

  @Put('update-customer-address/:id')
  updateCustomerAddress(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //  console.log("UPDATE CUSTOMER ID: " + id);
    return this.usersService.updateCustomerAddress(id, updateUserDto);
  }

  @Delete(':id')
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':id/active')
  activeUser(@Param('id') id: number) {
    console.log(id);
    // return this.usersService.getUsers(updateUserInput.id);
  }

  @Post(':id/ban')
  banUser(@Param('id') id: number) {
    console.log(id);
    // return this.usersService.getUsers(updateUserInput.id);
  }
}

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createProfile(@Body() createProfileDto: CreateProfileDto) {
    console.log(createProfileDto);
  }

  @Put(':id')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    console.log(updateProfileDto);
  }
  @Delete(':id')
  deleteProfile(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
