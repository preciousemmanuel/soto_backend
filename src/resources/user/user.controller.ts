import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import UserService from "@/resources/user/user.service";
import validate from "./user.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { AddShippingAddressDto, ChangePasswordDto, CreateUserDto, LoginDto, vendorDashboardDto, vendorInventoryDto } from "./user.dto";
import { User } from './user.interface'


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
    ),

      this.router.post(
        `${this.path}/signup`,
        validationMiddleware(validate.signupSchema),
        this.createUser
      )

    this.router.put(
      `${this.path}/add-shipping-address`,
      authenticatedMiddleware,
      validationMiddleware(validate.addShippingAddressSchema),
      this.addShippingAddress
    )

    this.router.get(
      `${this.path}/profile`,
      authenticatedMiddleware,
      this.getProfile
    )


    this.router.get(
      `${this.path}/vendor-overview`,
      authenticatedMiddleware,
      this.getVendorDashboard
    )

    this.router.get(
      `${this.path}/vendor-inventory`,
      authenticatedMiddleware,
      this.getVendorInventory
    )

    this.router.post(
      `${this.path}/login`,
      validationMiddleware(validate.userLoginSchema),
      this.userLogin
    )

    this.router.post(
      `${this.path}/change-password-request`,
      validationMiddleware(validate.changePasswordRequest),
      this.changePasswordRequest
    )

    this.router.post(
      `${this.path}/validate-otp`,
      validationMiddleware(validate.validateOtpSchema),
      this.validateOtp
    )

    this.router.put(
      `${this.path}/new-password`,
      authenticatedMiddleware,
      validationMiddleware(validate.newPasswordSchema),
      this.newPasswordChange
    )

  }

  private createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const body: CreateUserDto = req.body

      const {
        status,
        code,
        message,
        data
      } = await this.userService.createUser(body);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private addShippingAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const address: AddShippingAddressDto = req.body
      const user: User = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.userService.addShippingAddress(address, user);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const user: User = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.userService.getProfile(user);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private getVendorDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const is_custom =
        req?.query?.start_date !== null &&
        req?.query?.end_date !== null &&
        req?.query?.start_date !== undefined &&
        req?.query?.end_date !== undefined
      const timeFrame = (
        (is_custom === false) &&
        (req.query?.time_frame) && (req.query?.time_frame !== null) && (req.query?.time_frame !== "")) ?
        String(req.query?.time_frame) : undefined
      const custom_date = (
        is_custom === true
      ) ? {
        start_date: new Date(String(req?.query?.start_date)),
        end_date: new Date(String(req?.query?.end_date)),
      } : undefined
      const user: User = req.user
      const payload: vendorDashboardDto = {
        user,
        ...(timeFrame && { timeFrame }),
        ...((custom_date) && { custom: custom_date })
      };
      const {
        status,
        code,
        message,
        data
      } = await this.userService.getVendorDashboard(payload);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private getVendorInventory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {

      const user: User = req.user
      const payload: vendorInventoryDto = {
        user,
        limit: req?.query?.limit ? Number(req?.query?.limit) : 10,
        page: req?.query?.page ? Number(req?.query?.page) : 1,
      };
      const {
        status,
        code,
        message,
        data
      } = await this.userService.getVendorInventory(payload);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private userLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const payload: LoginDto = req.body
      const {
        status,
        code,
        message,
        data
      } = await this.userService.userLogin(payload);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private changePasswordRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const payload: ChangePasswordDto = req.body
      const {
        status,
        code,
        message,
        data
      } = await this.userService.changePasswordRequest(payload);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }

  private validateOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const otp: string = req.body.otp
      const {
        status,
        code,
        message,
        data
      } = await this.userService.validateOtp(otp, req.body.otp_purpose);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
  }


  private newPasswordChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const new_password: string = req.body.new_password
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.userService.newPasswordChange(new_password, user);
      return responseObject(
        res,
        code,
        status,
        message,
        data
      );

    } catch (error: any) {
      next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
    }
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