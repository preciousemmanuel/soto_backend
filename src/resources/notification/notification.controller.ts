import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from "./notification.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	AddFcmTokenOrPlayerIdDto,
	FetchNotificationsDto,
} from "./notification.dto";
import NotificationService from "./notification.service";
import { RequestData } from "@/utils/enums/base.enum";
import { RequestExt } from "@/utils/interfaces/expRequest.interface";

class NotificationController implements Controller {
	public path = "/notification";
	public router = Router();
	private notificationService = new NotificationService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/add-tokens`,
			validationMiddleware(validate.addFcmTokenOrPlayerIdSchema),
			this.addFcmTokenOrPlayerId
		);

		this.router.get(
			`${this.path}/fetch`,
			authenticatedMiddleware,
			validationMiddleware(
				validate.fetchNotificationsSchema,
				RequestData.query
			),
			this.fetchNotifications
		);

		this.router.put(
			`${this.path}/mark-as-read/:id`,
			authenticatedMiddleware,
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.markNotificationAsRead
		);

		this.router.put(
			`${this.path}/clear-all`,
			authenticatedMiddleware,
			this.clearNotifications
		);
	}

	private addFcmTokenOrPlayerId = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: AddFcmTokenOrPlayerIdDto = req.body;
			const { status, code, message, data } =
				await this.notificationService.addFcmTokenOrPlayerId(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchNotifications = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: FetchNotificationsDto = {
				user: req._user,
				...(req?.query?.type && {
					type: String(req?.query.type),
				}),
				...(req?.query?.search &&
					req?.query?.search !== "" &&
					req?.query?.search !== null && {
						search: String(req?.query.search),
					}),
				limit: req.query.limit ? Number(req?.query?.limit) : 10,
				page: req.query.page ? Number(req?.query?.page) : 1,
			};
			const { status, code, message, data } =
				await this.notificationService.fetchNotifications(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private markNotificationAsRead = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const notification_id = String(req.params.id);
			const user = req._user;
			const { status, code, message, data } =
				await this.notificationService.markNotificationAsRead(
					notification_id,
					user
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private clearNotifications = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user = req._user;
			const { status, code, message, data } =
				await this.notificationService.clearNotifications(user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default NotificationController;
