import { User, ShippingAddress } from "@/resources/user/user.interface";
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
  AddShippingAddressDto,
  ChangePasswordDto,
  CreateUserDto,
  LoginDto,
} from "./user.dto";
import { hashPassword } from "@/utils/helpers/token";
import { OtpPurposeOptions, StatusMessages } from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";

class UserService {
  private user = UserModel;

  public async createUser(
    createUser: CreateUserDto
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {

      const userExist = await this.user.findOne({
        $or: [
          { Email: createUser.Email.toLowerCase() },
          { PhoneNumber: createUser.PhoneNumber },
        ]
      });

      if (userExist) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "User With These Details Already Exists",
        }
      } else {
        const full_name_split = createUser.FullName.split(" ")
        const hashedPassword = await hashPassword(createUser.Password)
        const createdUser: User = await this.user.create({
          FirstName: full_name_split.length > 0 ? full_name_split[0].toLowerCase() : "",
          LastName: full_name_split.length > 1 ? full_name_split[1].toLowerCase() : "",
          Email: createUser.Email.toLowerCase(),
          PhoneNumber: createUser.PhoneNumber,
          Password: hashedPassword,
          SignupChannel: createUser?.SignupChannel,
          UserType: createUser?.UserType,
        });
        const token = createToken(createdUser)
        createdUser.Token = token
        await createdUser.save()

        responseData = {
          status: StatusMessages.success,
          code: HttpCodes.HTTP_CREATED,
          message: "User Created Successfully",
          data: createdUser
        }
      }

      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async addShippingAddress(
    addShippingAddress: AddShippingAddressDto,
    user: User
  ): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      user.ShippingAddress = {
        full_address: addShippingAddress.address,
        country: "Nigeria"
      }
      await user.save()
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Shipping Address Added Successfully",
        data: user
      }
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }


  public async getProfile(user: User): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Profile Retreived Successfully",
        data: user
      }
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ getProfile ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }


  public async userLogin(login: LoginDto): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const user = await this.user.findOne({
        $or: [
          {
            Email: login.email_or_phone_number.toLowerCase(),
            UserType: login.userType
          },
          {
            PhoneNumber: login.email_or_phone_number.toLowerCase(),
            UserType: login.userType
          }
        ]
      })
      if (!user) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Incorrect Username Or Password"
        }
        return responseData
      }
      const isPasswordCorrect = await comparePassword(login.password, user?.Password)
      if (isPasswordCorrect === false) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "Incorrect Username Or Password"
        }
        return responseData
      }
      const token = createToken(user)
      user.Token = token
      await user.save()
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "User Login Successful",
        data: user
      }
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ login ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async changePasswordRequest(changePasswordDto: ChangePasswordDto): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const user = await this.user.findOne({
        $or: [
          {
            Email: changePasswordDto.email_or_phone_number.toLowerCase(),
          },
          {
            PhoneNumber: changePasswordDto.email_or_phone_number.toLowerCase(),
          }
        ]
      })
      if (!user) {
        responseData = {
          status: StatusMessages.error,
          code: HttpCodes.HTTP_BAD_REQUEST,
          message: "User Not Found"
        }
        return responseData
      }
      const oneTimePassword = await generateOtpModel(
        OtpPurposeOptions.CHANGE_PASSWORD,
        user,
        user?.Email
      )
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Otp Generated Successfully",
        data: oneTimePassword
      }
      return responseData;
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ login ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async validateOtp(otp: string): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const otpValiationResponse = await isOtpCorrect(
        otp,
        OtpPurposeOptions.CHANGE_PASSWORD
      )
      return otpValiationResponse
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ login ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }

  public async newPasswordChange(new_password: string, user: User): Promise<ResponseData> {
    let responseData: ResponseData
    try {
      const hashed_password = await hashPassword(new_password)
      user.Password = hashed_password
      await user.save()
      responseData = {
        status: StatusMessages.success,
        code: HttpCodes.HTTP_OK,
        message: "Password Changed Successflly",
        data: user
      }
      return responseData
    } catch (error: any) {
      console.log("🚀 ~ UserService ~ login ~ error:", error)
      responseData = {
        status: StatusMessages.error,
        code: HttpCodes.HTTP_SERVER_ERROR,
        message: error.toString()
      }
      return responseData;
    }

  }






  public async getUserById(id: number): Promise<User | Error | null> {
    try {

      const user = await this.user.findOne({ userId: id }).select("-passwword");
      if (user) {
        return user!;
      }
      return null;
      // throw new Error("user does not exist");
    } catch (error: any) {
      console.log("notforur", error);
      throw new Error(error.toString());
    }
  }




  public async updateFcmToken(

    userId: number,
    token: string,


  ): Promise<User | Error> {
    try {
      const data = await this.user.findOneAndUpdate({ userId }, {
        fcmToken: token
      }, { new: true })
      return data!;


    } catch (error) {
      console.log("dsdsddsad", error)
      //logger.log("error",`cannotcreateusername ${JSON.stringify(error)}`);
      throw new Error("unable to update fcmtoken");
    }
  }
}

export default UserService;