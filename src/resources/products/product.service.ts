import User from "@/resources/user/user.interface";
import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import { createToken } from "@/utils/token";

import logger from "@/utils/logger";
import { CreateUser } from "./product.dto";

class UserService {
  private user = UserModel;

  public async createUser(
    createUser: CreateUser
  ): Promise<boolean | Error> {

    try {
      //do some checkings
      console.log("dsdoiuueuuew", createUser);

      const userExist = await this.user.findOne({ userId: createUser.userId });
      console.log("doduhd", userExist)
      if (userExist) {
        return true;
      }
      const createdUser: User = await this.user.create(createUser as any);
      return true;
    } catch (error: any) {
      return false;
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