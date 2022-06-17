import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import * as admin from 'firebase-admin';
const cloudinaryConfig = require("../config/cloudinary-config");
import DatauriParser  from 'datauri/parser';
import path from 'path';
const { getStorage } = require('firebase-admin/storage');

@Controller('attachments')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('attachment[]'))
  async uploadFile(@UploadedFiles() attachment: Array<Express.Multer.File>) {

    let downloadUrl = '';
    try {
      const fileName = attachment[0].originalname.replace(/\s+/g, "_");

      const parser = new DatauriParser();
      const blobString = parser.format(path.extname(fileName).toString(), attachment[0].buffer);

      await cloudinaryConfig.uploads(blobString.content, "barectory").then((result) => {
          downloadUrl = result.url;
      });

    }
    catch (error) {
        console.log (error.message);
    }

    return [
      {
        id: '883',
        original: downloadUrl,
        thumbnail: downloadUrl,
      },
    ];


  }
}
