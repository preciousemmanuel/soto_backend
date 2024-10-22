import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./order.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { CreateOrderDto, FetchMyOrdersDto } from "./order.dto";
import upload from "@/utils/config/multer";
import OrderService from "./order.service";


class OrderController implements Controller {
  public path = "/order";
  public router = Router();
  private orderService = new OrderService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    this.router.post(
      `${this.path}/create`,
      authenticatedMiddleware,
      validationMiddleware(validate.createOrderSchema),
      this.createOrder
    )

    this.router.get(
      `${this.path}/fetch/by-vendor`,
      authenticatedMiddleware,
      validationMiddleware(validate.fetchMyOrdersSchema),
      this.fetchMyOrders
    )

  }

  private createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const body: CreateOrderDto = req.body
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.orderService.createOrder(body, user);
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

  private fetchMyOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const user = req.user
      const payload: FetchMyOrdersDto = {
        limit: Number(req?.query?.limit),
        page: Number(req?.query?.page),
        filter: {
          ...(req?.query?.status && { status: String(req?.query?.status) }),
          ...(req?.query?.start_date && { start_date: String(req?.query?.start_date) }),
          ...(req?.query?.end_date && { end_date: String(req?.query?.end_date) }),
        }
      }


      const {
        status,
        code,
        message,
        data
      } = await this.orderService.getMyOrders(payload, user);
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

export default OrderController;