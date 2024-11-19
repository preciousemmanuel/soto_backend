import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import {
  comparePassword,
  createToken,
  generateOtpModel,
  isOtpCorrect
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
  CreateBusinessDto,
  VerificationDto,
} from "./business.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OtpPurposeOptions, StatusMessages, UserTypes } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import BusinessModel from "./business.model";
import cloudUploader from "@/utils/config/cloudUploader";
import walletModel from "./wallet.model";
import MailService from "../mail/mail.service";

class BusinessService {
  private Business = BusinessModel;
  private User = UserModel
  private Wallet = walletModel
  private mailService = new MailService()

  public async createBusiness(
    createBusinessDto: CreateBusinessDto,
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const existingBusiness = await this.Business.findOne({
        $or: [
          { business_name: createBusinessDto.business_name.toLowerCase() },
          { email: createBusinessDto.email.toLowerCase() },
          { phone_number: createBusinessDto.phone_number },
        ]

      })
      if (existingBusiness) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "A Business With At Least One Of These Details Already Exists"
        }
        return responseData
      }

      const logo = createBusinessDto?.business_logo ?
        await cloudUploader.imageUploader(createBusinessDto.business_logo) :
        undefined
      const newBusiness = await this.Business.create({
        ...(createBusinessDto?.business_name && { business_name: createBusinessDto.business_name.toLowerCase() }),
        ...(createBusinessDto?.email && { email: createBusinessDto.email.toLowerCase() }),
        ...(createBusinessDto?.phone_number && { phone_number: createBusinessDto.phone_number }),
        ...(createBusinessDto?.adress && { adress: createBusinessDto.adress }),
        ...(createBusinessDto?.category && { category: createBusinessDto.category }),
        ...(createBusinessDto?.description && { description: createBusinessDto.description }),
        ...(logo && { business_logo: logo }),
      })
      const hashedPassword = await hashPassword(createBusinessDto.password)
      const user = await this.User.create({
        FirstName: newBusiness?.business_name,
        LastName: newBusiness?.business_name,
        Email: newBusiness?.email,
        Password: hashedPassword,
        UserType: UserTypes.VENDOR,
        business: newBusiness?._id,
      })
      const wallet = await this.Wallet.create({
        user: user._id
      })
      await this.Business.findByIdAndUpdate(newBusiness?._id, {
        user: user?._id
      })
      const token = createToken(user)
      user.wallet = wallet._id
      user.Token = token
      await user.save()
      const newVendor = await this.User.findById(user?._id)
        .populate("business")
        .populate("wallet")
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Business Created Successfully",
        data: newVendor
      }
      const oneTimePassword = await generateOtpModel(
        OtpPurposeOptions.ACCOUNT_VALIDATION,
        user,
        user?.Email
      )

      const mailPayload = {
        email: user?.Email,
        first_name: user?.FirstName,
        otp: oneTimePassword?.otp
      }
      this.mailService.sendOtpMail(mailPayload)
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ BusinessService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async verifyBusiness(
    verificationDto: VerificationDto,
    user: InstanceType<typeof UserModel>
  ): Promise<ResponseData> {
    let responseData: ResponseData

    try {

      const existingBusiness = await this.Business.findOne({
        user: user._id
      })
      if (!existingBusiness) {

        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Business Not Found",
        }
      } else {
        const updateBusiness = await this.Business.findByIdAndUpdate(existingBusiness?._id, {
          ...verificationDto
        }, { new: true })
        const oneTimePassword = await generateOtpModel(
          OtpPurposeOptions.ACCOUNT_VALIDATION,
          user,
          user.Email
        )
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_CREATED,
          message: "verification Updated Successfully",
          data: {
            ...updateBusiness?.toObject(),
            oneTimePassword,
          }
        }
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ BusinessService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async verifyBusinessComplete(
    user_id: any
  ): Promise<ResponseData> {
    let responseData: ResponseData

    try {

      const existingBusiness = await this.Business.findOne({
        user: user_id
      })
      if (!existingBusiness) {

        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Business Not Found",
        }
      } else {
        const updateUser = await this.User.findByIdAndUpdate(user_id, {
          IsVerified: true
        }, { new: true })

        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_CREATED,
          message: "verification Completed Successfully",
          data: updateUser
        }
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ BusinessService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

}

export default BusinessService;