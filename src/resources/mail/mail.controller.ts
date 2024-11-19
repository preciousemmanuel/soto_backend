import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import MailService from "./mail.service";


class MailController implements Controller {
  public path = "/mail";
  public router = Router();
  private mailService = new MailService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    // this.router.post(
    //   `${this.path}/create`,
    //   authenticatedMiddleware,
    //   upload.single("business_logo"),
    //   validationMiddleware(validate.createBusinessSchema),
    //   this.createCreateBusiness
    // )

    // this.router.put(
    //   `${this.path}/verify`,
    //   authenticatedMiddleware,
    //   upload.single("business_logo"),
    //   validationMiddleware(validate.verifyBusinessSchema),
    //   this.verifyBusiness
    // )

  }

  // private createCreateBusiness = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<Response | void> => {

  //   try {

  //     const body: CreateBusinessDto = req.body
  //     if (req.file) {
  //       body.business_logo = req.file
  //     }
  //     const user = req.user
  //     const {
  //       status,
  //       code,
  //       message,
  //       data
  //     } = await this.businessService.createBusiness(body, user);
  //     return responseObject(
  //       res,
  //       code,
  //       status,
  //       message,
  //       data
  //     );

  //   } catch (error: any) {
  //     next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
  //   }
  // }

  // private verifyBusiness = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<Response | void> => {

  //   try {
  //     const body: VerificationDto = req.body
  //     const user = req.user
  //     const {
  //       status,
  //       code,
  //       message,
  //       data
  //     } = await this.businessService.verifyBusiness(body, user);
  //     return responseObject(
  //       res,
  //       code,
  //       status,
  //       message,
  //       data
  //     );

  //   } catch (error: any) {
  //     next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()))
  //   }
  // }




}

export default MailController;