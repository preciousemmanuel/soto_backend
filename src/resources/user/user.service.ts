import { User, ShippingAddress } from "@/resources/user/user.interface";
import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import { createToken } from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import { AddShippingAddressDto, CreateUserDto } from "./user.dto";
import { hashPassword } from "@/utils/helpers/token";
import { StatusMessages } from "@/utils/enums/base.enum";
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
  ): Promise<User | Error> {
    try {
      user.ShippingAddress = {
        full_address: addShippingAddress.address
      }
      await user.save()
      return user;
    } catch (error: any) {
      return error;
    }

  }


  public async getProfile(user: User): Promise<User | Error> {
    try {
      return user;
    } catch (error: any) {
      return error;
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