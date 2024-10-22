import UserModel from "@/resources/user/user.model";
import { StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import EmailSenderService from "./ejs.sender.service ";
import fs from "fs"
import { filePaths } from "./ejs";
import ejs from "ejs"


class MailService {
  private User = UserModel
  private EmailSenderService = new EmailSenderService()

  public async sendOtpMail(payload: any): Promise<ResponseData> {
    let responseData: ResponseData = {
      status: StatusMessages.error,
      code: HttpCodes.HTTP_BAD_REQUEST,
      message: "Unable To Send Mail At The Moment"
    }
    try {
      const {
        email,
      } = payload
      const template = fs.readFileSync(process.cwd() + filePaths.sendOTP, {
        encoding: "utf-8"
      })
      const html = ejs.render(template, payload)
      const mailData = {
        email,
        subject: "One Time Password",
        html
      }
      const sendEmailViaEJS = await this.EmailSenderService.sendEmailEJS(mailData)
      console.log("🚀 ~ MailService ~ sendOtpMail ~ sendEmailViaEJS:", sendEmailViaEJS)
      return sendEmailViaEJS
    } catch (error: any) {
      console.log("🚀 ~ MailService ~ sendOtpMail ~ error:", error)
      responseData.message = error.toString()
      return responseData
    }

  }

  // public async createBusiness(
  //   createBusinessDto: CreateBusinessDto,
  //   user: InstanceType<typeof UserModel>
  // ): Promise<ResponseData> {
  //   let responseData: ResponseData
  //   try {
  //     const existingBusiness = await this.Business.findOne({
  //       user: user?._id
  //     })
  //     if (existingBusiness) {
  //       const logo = createBusinessDto?.business_logo ?
  //         await cloudUploader.imageUploader(createBusinessDto.business_logo) :
  //         undefined
  //       const updateBusiness = await this.Business.findByIdAndUpdate(existingBusiness._id, {
  //         ...(createBusinessDto?.business_name && { business_name: createBusinessDto.business_name }),
  //         ...(createBusinessDto?.email && { email: createBusinessDto.email }),
  //         ...(createBusinessDto?.phone_number && { phone_number: createBusinessDto.phone_number }),
  //         ...(createBusinessDto?.adress && { adress: createBusinessDto.adress }),
  //         ...(createBusinessDto?.category && { category: createBusinessDto.category }),
  //         ...(createBusinessDto?.description && { description: createBusinessDto.description }),
  //         ...(logo && { business_logo: logo }),
  //       }, { new: true })
  //       responseData = {
  //         status: StatusMessages.success,
  //         code: HttpCodes.HTTP_OK,
  //         message: "Business Updated Successfully",
  //         data: updateBusiness
  //       }

  //     } else {
  //       const logo = createBusinessDto?.business_logo ?
  //         await cloudUploader.imageUploader(createBusinessDto.business_logo) :
  //         undefined
  //       const new_business = await this.Business.create({
  //         business_name: createBusinessDto.business_name,
  //         email: createBusinessDto.email,
  //         phone_number: createBusinessDto.phone_number,
  //         adress: createBusinessDto.adress,
  //         category: createBusinessDto.category,
  //         description: createBusinessDto.description,
  //         ...(logo && { business_logo: logo }),
  //         user: user?._id
  //       })
  //       await this.User.findByIdAndUpdate(user._id, {
  //         business: new_business?._id
  //       })

  //       responseData = {
  //         status: StatusMessages.success,
  //         code: HttpCodes.HTTP_CREATED,
  //         message: "Business Created Successfully",
  //         data: new_business
  //       }
  //     }

  //     return responseData;
  //   } catch (error: any) {
  //     console.log("🚀 ~ BusinessService ~ error:", error)
  //     responseData = {
  //       status: StatusMessages.error,
  //       code: HttpCodes.HTTP_SERVER_ERROR,
  //       message: error.toString()
  //     }
  //     return responseData;
  //   }

  // }

  // public async verifyBusiness(
  //   verificationDto: VerificationDto,
  //   user: InstanceType<typeof UserModel>
  // ): Promise<ResponseData> {
  //   let responseData: ResponseData

  //   try {

  //     const existingBusiness = await this.Business.findOne({
  //       user: user._id
  //     })
  //     if (!existingBusiness) {

  //       responseData = {
  //         status: StatusMessages.error,
  //         code: HttpCodes.HTTP_BAD_REQUEST,
  //         message: "Business Not Found",
  //       }
  //     } else {
  //       const updateBusiness = await this.Business.findByIdAndUpdate(existingBusiness?._id, {
  //         ...verificationDto
  //       }, { new: true })
  //       const oneTimePassword = await generateOtpModel(
  //         OtpPurposeOptions.ACCOUNT_VALIDATION,
  //         user,
  //         user.Email
  //       )
  //       responseData = {
  //         status: StatusMessages.success,
  //         code: HttpCodes.HTTP_CREATED,
  //         message: "verification Updated Successfully",
  //         data: {
  //           ...updateBusiness?.toObject(),
  //           oneTimePassword,
  //         }
  //       }
  //     }

  //     return responseData;
  //   } catch (error: any) {
  //     console.log("🚀 ~ BusinessService ~ error:", error)
  //     responseData = {
  //       status: StatusMessages.error,
  //       code: HttpCodes.HTTP_SERVER_ERROR,
  //       message: error.toString()
  //     }
  //     return responseData;
  //   }

  // }

  // public async verifyBusinessComplete(
  //   user_id: any
  // ): Promise<ResponseData> {
  //   let responseData: ResponseData

  //   try {

  //     const existingBusiness = await this.Business.findOne({
  //       user: user_id
  //     })
  //     if (!existingBusiness) {

  //       responseData = {
  //         status: StatusMessages.error,
  //         code: HttpCodes.HTTP_BAD_REQUEST,
  //         message: "Business Not Found",
  //       }
  //     } else {
  //       const updateUser = await this.User.findByIdAndUpdate(user_id, {
  //         IsVerified: true
  //       }, { new: true })

  //       responseData = {
  //         status: StatusMessages.success,
  //         code: HttpCodes.HTTP_CREATED,
  //         message: "verification Completed Successfully",
  //         data: updateUser
  //       }
  //     }

  //     return responseData;
  //   } catch (error: any) {
  //     console.log("🚀 ~ BusinessService ~ error:", error)
  //     responseData = {
  //       status: StatusMessages.error,
  //       code: HttpCodes.HTTP_SERVER_ERROR,
  //       message: error.toString()
  //     }
  //     return responseData;
  //   }

  // }

}

export default MailService;