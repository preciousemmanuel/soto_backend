import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import AdminOverviewService from "./adminTransaction.service";
import validate from "./adminTransaction.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import { CreateBusinessDto, OverviewDto, VerificationDto } from "./adminTransaction.dto";
import { Business } from './adminTransaction.interface'
import upload from "@/utils/config/multer";
import { endOfDay, startOfDay } from "date-fns";
import { backDaterForChart, backTrackToADate } from "@/utils/helpers";
import { RequestData } from "@/utils/enums/base.enum";


class AdminTransactionController implements Controller {
  public path = "/admin";
  public router = Router();
  private adminOverviewService = new AdminOverviewService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {

    this.router.get(
      `${this.path}/overview`,
      validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
      this.getOverview
    )


    this.router.get(
      `${this.path}/best-seller`,
      validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
      this.getBestSellingProducts
    )

    this.router.get(
      `${this.path}/latest-orders`,
      validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
      this.getLatestOrders
    )
  }

  private getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      var query: OverviewDto = req.query
      const start_date = query?.start_date
        ? startOfDay(new Date(query.start_date))
        : query.timeLine
          ? (await backDaterForChart({ input: new Date(), format: query.timeLine }))
              .array[0]?.start
          : undefined;
      const end_date = query?.end_date
        ? endOfDay(new Date(query.end_date))
        : query.timeLine
          ? (
              await backDaterForChart({ input: new Date(), format: query.timeLine })
            ).array.slice(-1)[0]?.end
          : undefined;
      const previous_backtrack = backTrackToADate(String(query.timeLine));
      console.log("🚀 ~ AdminOverviewController ~ previous_backtrack:", previous_backtrack)
       const previous_start_date = previous_backtrack
        ? (
            await backDaterForChart({
              input: previous_backtrack,
              format: query.timeLine,
            })
          ).array[0]?.start
        : undefined;
      const previous_end_date = previous_backtrack
        ? (
            await backDaterForChart({
              input: previous_backtrack,
              format: query.timeLine,
            })
          ).array.slice(-1)[0]?.end
        : undefined;
      
        const advancedReportTimeline = (
            await backDaterForChart({
              input: previous_backtrack,
              format: query.timeLine,
            })
          ).array

      const payload: OverviewDto = {
        start_date,
        end_date,
        previous_start_date,
        previous_end_date,
        limit: query?.limit ? Number(query?.limit) : 10,
        page: query?.page ? Number(query?.page) : 1,
      };
     
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.adminOverviewService.getOverview(payload, advancedReportTimeline);
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


   private getBestSellingProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      var query: OverviewDto = req.query
      const start_date = query?.start_date
        ? startOfDay(new Date(query.start_date))
        : query.timeLine
          ? (await backDaterForChart({ input: new Date(), format: query.timeLine }))
              .array[0]?.start
          : undefined;
      const end_date = query?.end_date
        ? endOfDay(new Date(query.end_date))
        : query.timeLine
          ? (
              await backDaterForChart({ input: new Date(), format: query.timeLine })
            ).array.slice(-1)[0]?.end
          : undefined;
       
      const payload: OverviewDto = {
        ...(start_date && {start_date}),
        ...(end_date && {end_date}),      
        limit: query?.limit ? Number(query?.limit) : 10,
        page: query?.page ? Number(query?.page) : 1,
      };
     
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.adminOverviewService.getBestSellingProducts(payload);
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

  private getLatestOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      var query: OverviewDto = req.query
      const start_date = query?.start_date
        ? startOfDay(new Date(query.start_date))
        : query.timeLine
          ? (await backDaterForChart({ input: new Date(), format: query.timeLine }))
              .array[0]?.start
          : undefined;
      const end_date = query?.end_date
        ? endOfDay(new Date(query.end_date))
        : query.timeLine
          ? (
              await backDaterForChart({ input: new Date(), format: query.timeLine })
            ).array.slice(-1)[0]?.end
          : undefined;
       
      const payload: OverviewDto = {
        ...(start_date && {start_date}),
        ...(end_date && {end_date}),      
        limit: query?.limit ? Number(query?.limit) : 10,
        page: query?.page ? Number(query?.page) : 1,
      };
     
      const user = req.user
      const {
        status,
        code,
        message,
        data
      } = await this.adminOverviewService.getLatestOrders(payload);
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

export default AdminTransactionController;