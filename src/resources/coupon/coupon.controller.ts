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
import { Business } from "./coupon.interface";
import { RequestExt } from "@/utils/interfaces/expRequest.interface";
import userModel from "../user/user.model";

class CouponController implements Controller {
	public path = "/coupon";
	public router = Router();
	private couponService = new CouponService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.get(
			`${this.path}/fetch-used-coupons`,
			authenticatedMiddleware,
			validationMiddleware(validate.fetchCategoriesSchema),
			this.getMyAppliedCoupons
		);
		this.router.get(
			`${this.path}/fetch-available`,
			validationMiddleware(validate.fetchCategoriesSchema),
			this.getAvailableCoupons
		);
	}

	private getMyAppliedCoupons = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const limit = req?.query?.limit ? Number(req?.query?.limit) : 10;
			const page = req?.query?.page ? Number(req?.query?.page) : 1;
			const user = req._user || new userModel();

			const { status, code, message, data } =
				await this.couponService.getMyAppliedCoupons(limit, page, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getAvailableCoupons = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const limit = req?.query?.limit ? Number(req?.query?.limit) : 10;
			const page = req?.query?.page ? Number(req?.query?.page) : 1;
			const user = req._user || new userModel();

			const { status, code, message, data } =
				await this.couponService.getAvailableCoupons(limit, page, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default CouponController;
