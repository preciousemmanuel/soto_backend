import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import UserService from "@/resources/user/user.service";
import validate from "./product.validation";
import { responseObject } from "@/utils/http.response";
import { HttpCodes } from "@/utils/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";



class UserController implements Controller {
  public path = "/user";
  public router = Router();
  private userService = new UserService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {


    this.router.post(
      `${this.path}/fcm`,
      authenticatedMiddleware,
      validationMiddleware(validate.updateFcm),
      this.updateFcmToken
    )

  }



  private updateFcmToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const userId = 1;
      const { token } = req.body;

      const data = await this.userService.updateFcmToken(userId, token);
      return responseObject(res, HttpCodes.HTTP_OK, "success", "Update fcm token Successfull", data);

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.message))
    }
  }




}

export default UserController;