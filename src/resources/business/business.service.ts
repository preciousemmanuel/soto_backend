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
import { OtpPurposeOptions, StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import BusinessModel from "./business.model";
import mongoose from "mongoose";

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
        user: user._id
      })
      if (existingBusiness) {
        const business = await this.Business.findByIdAndUpdate(
          existingBusiness?._id,
          createBusinessDto,
          {
            new: true,
            runValidators: true
          }
        ).exec()
        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_CREATED,
          message: "Business Updated Successfully",
          data: business
        }
      } else {
        const new_business = await this.Business.create({
          user: user._id,
          ...createBusinessDto
        })
        await this.User.findByIdAndUpdate(user?._id, {
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