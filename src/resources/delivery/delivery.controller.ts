import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./delivery.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { GetDeliveryRateDto } from "./delivery.dto";
import upload from "@/utils/config/multer";
import DeliveryService from "./delivery.service";
import { RequestData } from "@/utils/enums/base.enum";


class DeliveryController implements Controller {
  public path = "/delivery";
  public router = Router();
  private deliveryService = new DeliveryService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    this.router.get(
      `${this.path}/get-rate`,
      authenticatedMiddleware,
      validationMiddleware(validate.getdeliveryRateSchema, RequestData.query),
      this.getRates
    )



  }

  private getRates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const payload: GetDeliveryRateDto = {
        delivery_address: String(req.query.delivery_address),
        parcel_id: String(req.query.parcel_id)
      }
      const {
        status,
        code,
        message,
        data
      } = await this.deliveryService.getRate(payload);
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

export default DeliveryController;