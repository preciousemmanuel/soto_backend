import { CloudUploadOption } from "../enums/base.enum";
import cloudinary from "./cloudinary.config";
import envConfig from "./env.config";


const imageUploader = async (
  file: Express.Multer.File
) => {
  try {
    let secure_cloudinary_url: string
    let bufferStreamReturn: any
    switch (envConfig.CLOUD_UPLOAD_OPTION) {
      case CloudUploadOption.CLOUDINARY:
        if (file?.path) {
          console.log("Uploading Image to cloudinary");
          const { secure_url } = await cloudinary.uploader.upload(file?.path, {
            folder: "images",
            secure: true
          })
          secure_cloudinary_url = secure_url

        } else {
          console.log("Uploading Image Buffer to cloudinary");
          const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const { secure_url } = await cloudinary.uploader.upload(fileBase64, {
            folder: "images",
            secure: true
          })
          secure_cloudinary_url = secure_url
        }
        return secure_cloudinary_url

        break;
      default:
        break;
    }
  } catch (error) {
    console.log("imageUploader: ", error);
  }
}

const fileUploader = async (
  file: Express.Multer.File
) => {
  try {
    let secure_cloudinary_url: string
    let bufferStreamReturn: any
    switch (envConfig.CLOUD_UPLOAD_OPTION) {
      case CloudUploadOption.CLOUDINARY:
        if (file?.path) {
          console.log("Uploading file to cloudinary");
          const { secure_url } = await cloudinary.uploader.upload(file?.path, {
            folder: "files",
            secure: true
          })
          secure_cloudinary_url = secure_url

        } else {
          console.log("Uploading file Buffer to cloudinary");
          const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const { secure_url } = await cloudinary.uploader.upload(fileBase64, {
            folder: "file",
            secure: true
          })
          secure_cloudinary_url = secure_url
        }
        return secure_cloudinary_url
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("fileUploader: ", error);
  }
}

const videoUploader = async (
  file: Express.Multer.File
) => {
  try {
    let secure_cloudinary_url: string
    let bufferStreamReturn: any
    switch (envConfig.CLOUD_UPLOAD_OPTION) {
      case CloudUploadOption.CLOUDINARY:
        if (file?.path) {
          console.log("Uploading video to cloudinary");
          const { secure_url } = await cloudinary.uploader.upload_large(file?.path, {
            resource_type: "video",
            folder: "videos",
            secure: true,
            eager_async: true
          })
          secure_cloudinary_url = secure_url

        } else {
          console.log("Uploading video Buffer to cloudinary");
          const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const { secure_url } = await cloudinary.uploader.upload(fileBase64, {
            resource_type: "video",
            folder: "videos",
            eager_async: true,
            secure: true
          })
          secure_cloudinary_url = secure_url
        }
        return secure_cloudinary_url
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("videoUploader: ", error);
  }
}

export default {
  imageUploader,
  fileUploader,
  videoUploader
}