import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import BusinessService from "@/resources/business/business.service";
import validate from "./transaction.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { GeneratePaymentLinkDto, VerificationDto } from "./transaction.dto";
import { Business } from './transaction.interface'
import upload from "@/utils/config/multer";
import TransactionService from "./transaction.service";


class TransactionController implements Controller {
  public path = "/transaction";
  public router = Router();
  private transactionService = new TransactionService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    this.router.post(
      `${this.path}/generate-payment-link`,
      authenticatedMiddleware,
      validationMiddleware(validate.generatePaymentLinkSchema),
      this.generatePaymentLink
    )

    this.router.post(
      `${this.path}/paystack/callback`,
      this.paystackCallbackService
    )

  }

  private generatePaymentLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {

      const body: GeneratePaymentLinkDto = req.body

      const user = req.user
      console.log("🚀 ~ TransactionController ~ user:", user)
      const {
        status,
        code,
        message,
        data
      } = await this.transactionService.initializePayment(body, user);
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

  private paystackCallbackService = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {

    try {
      const body: any = req.body
      const {
        status,
        code,
        message,
        data
      } = await this.transactionService.paystackCallbackService(body);
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

export default TransactionController;