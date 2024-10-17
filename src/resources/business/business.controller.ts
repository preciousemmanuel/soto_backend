import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import BusinessService from "@/resources/business/business.service";
import validate from "./business.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { CreateBusinessDto, VerificationDto } from "./business.dto";
import { Business } from './business.interface'


class BusinessController implements Controller {
  public path = "/business";
  public router = Router();
  private businessService = new BusinessService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    this.router.post(
      `${this.path}/create`,
      authenticatedMiddleware,
      validationMiddleware(validate.createBusinessSchema),
      this.createCreateBusiness
    )

    this.router.put(
      `${this.path}/verify`,
      authenticatedMiddleware,
      validationMiddleware(validate.verifyBusinessSchema),
      this.verifyBusiness
    )

  }

  private createCreateBusiness = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const body: CreateBusinessDto = req.body
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.businessService.createBusiness(body, user);
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

  private verifyBusiness = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const body: VerificationDto = req.body
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.businessService.verifyBusiness(body, user);
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




}

export default BusinessController;