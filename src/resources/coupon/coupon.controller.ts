import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import CouponService from "./coupon.service";
import validate from "./coupon.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { FetchCategoriesDto } from "./coupon.dto";
import { Business } from './coupon.interface'


class CouponController implements Controller {
  public path = "/category";
  public router = Router();
  private categoryService = new CouponService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    this.router.get(
      `${this.path}/fetch`,
      validationMiddleware(validate.fetchCategoriesSchema),
      this.fetchCategories
    )


  }

  private fetchCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const query: FetchCategoriesDto = {
        limit: req?.query?.limit ? Number(req?.query?.limit) : 10,
        page: req?.query?.page ? Number(req?.query?.page) : 1,
        ...(req?.query?.search && { search: String(req?.query?.search) })
      }
      const {
        status,
        code,
        message,
        data
      } = await this.categoryService.fetchCategories(query);
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

export default CouponController;