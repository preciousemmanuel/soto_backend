import { v2 as cloudinary } from 'cloudinary'
import envConfig from './env.config'

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_NAME as string,
  api_key: envConfig.CLOUDINARY_API_KEY as string,
  api_secret: envConfig.CLOUDINARY_API_SECRET as string,
})

export default cloudinary