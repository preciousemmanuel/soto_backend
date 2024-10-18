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
import mongoose from "mongoose";
import UserService from "../user/user.service";
import { CreateUserDto } from "../user/user.dto";
import cloudUploader from "@/utils/config/cloudUploader";

class BusinessService {
  private Business = BusinessModel;
  private User = UserModel

  public async createBusiness(
    createBusinessDto: CreateBusinessDto,
    user: InstanceType<typeof UserModel>
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const existingBusiness = await this.Business.findOne({
        user: user?._id
      })
      if (existingBusiness) {
        const logo = createBusinessDto?.business_logo ?
          await cloudUploader.imageUploader(createBusinessDto.business_logo) :
          undefined
        const updateBusiness = await this.Business.findByIdAndUpdate(existingBusiness._id, {
          ...(createBusinessDto?.business_name && { business_name: createBusinessDto.business_name }),
          ...(createBusinessDto?.email && { email: createBusinessDto.email }),
          ...(createBusinessDto?.phone_number && { phone_number: createBusinessDto.phone_number }),
          ...(createBusinessDto?.adress && { adress: createBusinessDto.adress }),
          ...(createBusinessDto?.category && { category: createBusinessDto.category }),
          ...(createBusinessDto?.description && { description: createBusinessDto.description }),
          ...(logo && { business_logo: logo }),
        }, { new: true })
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_OK,
          message: "Business Updated Successfully",
          data: updateBusiness
        }

      } else {
        const logo = createBusinessDto?.business_logo ?
          await cloudUploader.imageUploader(createBusinessDto.business_logo) :
          undefined
        const new_business = await this.Business.create({
          business_name: createBusinessDto.business_name,
          email: createBusinessDto.email,
          phone_number: createBusinessDto.phone_number,
          adress: createBusinessDto.adress,
          category: createBusinessDto.category,
          description: createBusinessDto.description,
          ...(logo && { business_logo: logo }),
          user: user?._id
        })
        await this.User.findByIdAndUpdate(user._id, {
          business: new_business?._id
        })

        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_CREATED,
          message: "Business Created Successfully",
          data: new_business
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