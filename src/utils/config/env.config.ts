import dotenv from 'dotenv'
import path from 'path'
import validateEnv from '../helpers/validateEnv';
import { CloudUploadOption } from '../enums/base.enum';

dotenv.config({ path: `${process.env.NODE_ENV}.env` });
validateEnv();

export default {
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || 3000,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 3000,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 3000,
  CLOUD_UPLOAD_OPTION: process.env.CLOUD_UPLOAD_OPTION || CloudUploadOption.CLOUDINARY,

}