import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./delivery.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	DeliveryOptionDto,
	GetCitiesDto,
	GetDeliveryRateDto,
} from "./delivery.dto";
import upload from "@/utils/config/multer";
import DeliveryService from "./delivery.service";
import { RequestData } from "@/utils/enums/base.enum";
import genAuthenticatedMiddleware from "@/middleware/gendAuth.middleware";

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
		);
		this.router.get(
			`${this.path}/get-states`,
			genAuthenticatedMiddleware,
			this.getStates
		);

		this.router.get(
			`${this.path}/get-cities`,
			genAuthenticatedMiddleware,
			validationMiddleware(validate.getCitiesSchema, RequestData.query),
			this.getCities
		);

		this.router.post(
			`${this.path}/select-delivery-vendor/:id`,
			authenticatedMiddleware,
			validationMiddleware(validate.selectDeliveryOptionSchema),
			this.selectDeliveryOption
		);

		this.router.post(
			`${this.path}/login-agility`,
			// authenticatedMiddleware,
			// validationMiddleware(validate.selectDeliveryOptionSchema),
			this.loginAgilityLogistics
		);

		this.router.post(
			`${this.path}/agility-get-price`,
			// authenticatedMiddleware,
			// validationMiddleware(validate.selectDeliveryOptionSchema),
			this.getShippingPriceAgility
		);
	}

	private getRates = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: GetDeliveryRateDto = {
				delivery_address: String(req.query.delivery_address),
				parcel_id: String(req.query.parcel_id),
			};
			const { status, code, message, data } =
				await this.deliveryService.getRate(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getStates = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.deliveryService.getStates();
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getCities = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: GetCitiesDto = {
				country_code: String(req?.query?.country_code),
				...(req?.query?.state_code && {
					state_code: String(req?.query?.state_code),
				}),
			};

			const { status, code, message, data } =
				await this.deliveryService.getCities(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private selectDeliveryOption = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: DeliveryOptionDto = {
				user: req.user,
				order_id: String(req.params.id),
				delivery_details: req.body,
			};

			const { status, code, message, data } =
				await this.deliveryService.selectDeliveryOption(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private loginAgilityLogistics = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.deliveryService.loginAgilityLogistics();
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getShippingPriceAgility = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.deliveryService.getShippingPriceAgility();
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default DeliveryController;
