import {
  Injectable,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

@Injectable()
export class UploadsService {

  @UseInterceptors(FilesInterceptor('attachment[]'))
  async uploadFile(@UploadedFiles() attachment: Array<Express.Multer.File>) {
    console.log(attachment);
    return [
      {
        id: '883',
        original:
          'https://pickbazarlaravel.s3.ap-southeast-1.amazonaws.com/881/aatik-tasneem-7omHUGhhmZ0-unsplash%402x.png',
        thumbnail:
          'https://pickbazarlaravel.s3.ap-southeast-1.amazonaws.com/881/conversions/aatik-tasneem-7omHUGhhmZ0-unsplash%402x-thumbnail.jpg',
      },
    ];
  }

  findAll() {
    return `This action returns all uploads`;
  }

  findOne(id: number) {
    return `This action returns a #${id} upload`;
  }

  remove(id: number) {
    return `This action removes a #${id} upload`;
  }
}
