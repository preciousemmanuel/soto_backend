import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./order.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	AddToCartDto,
	CreateCustomOrderDto,
	CreateOrderDto,
	FetchMyOrdersDto,
	RemoveFromCartDto,
} from "./order.dto";
import upload from "@/utils/config/multer";
import OrderService from "./order.service";
import { RequestData } from "@/utils/enums/base.enum";

class OrderController implements Controller {
	public path = "/order";
	public router = Router();
	private orderService = new OrderService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/add-to-cart`,
			authenticatedMiddleware,
			validationMiddleware(validate.addToCartSchema),
			this.addToCart
		);

		this.router.put(
			`${this.path}/remove-from-cart`,
			authenticatedMiddleware,
			validationMiddleware(validate.removeFromCartSchema),
			this.removeFromCart
		);

		this.router.post(
			`${this.path}/create`,
			authenticatedMiddleware,
			validationMiddleware(validate.createOrderSchema),
			this.createOrder
		);

		this.router.get(
			`${this.path}/fetch/by-vendor`,
			authenticatedMiddleware,
			validationMiddleware(validate.fetchMyOrdersSchema),
			this.fetchMyOrders
		);
		this.router.get(
			`${this.path}/fetch/by-buyer`,
			authenticatedMiddleware,
			validationMiddleware(validate.fetchMyOrdersSchema),
			this.fetchMyOrdersBuyer
		);

		this.router.get(
			`${this.path}/view-one/:id`,
			authenticatedMiddleware,
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.viewAnOrder
		);

		this.router.post(
			`${this.path}/create-custom`,
			authenticatedMiddleware,
			validationMiddleware(validate.CustomOrderSchema),
			this.createCustomOrder
		);
	}

	private addToCart = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: AddToCartDto = req.body;
			const user = req.user;
			const { status, code, message, data } = await this.orderService.addToCart(
				body,
				user
			);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private removeFromCart = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: RemoveFromCartDto = req.body;
			const user = req.user;
			const { status, code, message, data } =
				await this.orderService.removeFromCart(body, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createOrder = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: CreateOrderDto = req.body;
			const user = req.user;
			const { status, code, message, data } =
				await this.orderService.createOrder(body, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchMyOrders = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user = req.user;
			const payload: FetchMyOrdersDto = {
				limit: Number(req?.query?.limit),
				page: Number(req?.query?.page),
				filter: {
					...(req?.query?.status && { status: String(req?.query?.status) }),
					...(req?.query?.start_date && {
						start_date: String(req?.query?.start_date),
					}),
					...(req?.query?.end_date && {
						end_date: String(req?.query?.end_date),
					}),
				},
			};

			const { status, code, message, data } =
				await this.orderService.getMyOrders(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchMyOrdersBuyer = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user = req.user;
			const payload: FetchMyOrdersDto = {
				limit: Number(req?.query?.limit),
				page: Number(req?.query?.page),
				filter: {
					...(req?.query?.status && { status: String(req?.query?.status) }),
					...(req?.query?.start_date && {
						start_date: String(req?.query?.start_date),
					}),
					...(req?.query?.end_date && {
						end_date: String(req?.query?.end_date),
					}),
				},
			};

			const { status, code, message, data } =
				await this.orderService.getMyOrdersBuyer(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewAnOrder = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload = {
				user: req.user,
				order_id: String(req.params.id),
			};
			const { status, code, message, data } =
				await this.orderService.viewAnOrder(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createCustomOrder = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: CreateCustomOrderDto = {
				user: req.user?._id,
				...req.body,
			};
			const { status, code, message, data } =
				await this.orderService.createCustomOrder(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default OrderController;
