import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import AdminOverviewService from "./adminPeople.service";
import validate from "./adminPeople.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	CreateBusinessDto,
	OverviewDto,
	UpdateUserByAdminDto,
	VerificationDto,
} from "./adminPeople.dto";
import { Business } from "./adminPeople.interface";
import upload from "@/utils/config/multer";
import { endOfDay, startOfDay } from "date-fns";
import {
	backDaterForChart,
	backDaterForChartCustomDate,
	backTrackToADate,
} from "@/utils/helpers";
import {
	AccessControlOptions,
	AdminPermissions,
	RequestData,
} from "@/utils/enums/base.enum";
import adminAuthMiddleware from "@/middleware/adminAuth.middleware";
import mongoose from "mongoose";
import { backDaterArray } from "@/utils/interfaces/base.interface";
import NotificationService from "../notification/notification.service";
import { FetchNotificationsDto } from "../notification/notification.dto";
import userModel from "../user/user.model";
import envConfig from "@/utils/config/env.config";
import notificationValidation from "../notification/notification.validation";

class AdminPeopleController implements Controller {
	public path = "/admin";
	public router = Router();
	private adminOverviewService = new AdminOverviewService();
	private notificationService = new NotificationService();
	private User = userModel;

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.get(
			`${this.path}/get-buyers`,
			adminAuthMiddleware(AdminPermissions.BUYER, AccessControlOptions.READ),
			validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
			this.getBuyers
		),
			this.router.get(
				`${this.path}/view-a-buyer/:id`,
				adminAuthMiddleware(AdminPermissions.BUYER, AccessControlOptions.READ),
				validationMiddleware(validate.modelIdSchema, RequestData.params),
				this.viewOneBuyer
			),
			this.router.get(
				`${this.path}/get-sellers`,
				adminAuthMiddleware(AdminPermissions.SELLER, AccessControlOptions.READ),
				validationMiddleware(
					validate.DashboardOverviewSchema,
					RequestData.query
				),
				this.getSellers
			),
			this.router.get(
				`${this.path}/view-a-seller/:id`,
				adminAuthMiddleware(AdminPermissions.SELLER, AccessControlOptions.READ),
				validationMiddleware(validate.modelIdSchema, RequestData.params),
				this.viewOneSeller
			),
			this.router.put(
				`${this.path}/update-a-buyer-or-seller/:id`,
				adminAuthMiddleware(AdminPermissions.SELLER, AccessControlOptions.READ),
				validationMiddleware(validate.modelIdSchema, RequestData.params),
				validationMiddleware(validate.updateUserSchema),
				this.updateBuyerOrSeller
			),
			this.router.get(
				`${this.path}/purchasers/get-all`,
				adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
				this.getPurchasers
			),
			this.router.get(
				`${this.path}/purchasers/view-one/:id`,
				adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
				validationMiddleware(validate.modelIdSchema, RequestData.params),
				this.viewAPurchaser
			),
			this.router.get(
				`${this.path}/purchasers/get-pickups`,
				adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
				validationMiddleware(
					validate.DashboardOverviewSchema,
					RequestData.query
				),
				this.getPickupAssignments
			);

		this.router.get(
			`${this.path}/notification/fetch`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
			validationMiddleware(
				notificationValidation.fetchNotificationsSchema,
				RequestData.query
			),
			this.fetchNotifications
		);

		this.router.put(
			`${this.path}/notification/mark-as-read/:id`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			this.markNotificationAsRead
		);
	}

	private getBuyers = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const customDateRange =
				query?.start_date && query?.end_date
					? await backDaterForChartCustomDate({
							start_date: new Date(String(query.start_date)),
							end_date: new Date(String(query.end_date)),
						})
					: undefined;
			const timeLineRange = query?.timeLine
				? await backDaterForChart({
						input: new Date(),
						format: query.timeLine,
					})
				: undefined;
			const start_date = customDateRange
				? customDateRange.array[0]?.start
				: timeLineRange
					? timeLineRange.array[0]?.start
					: undefined;
			const end_date = customDateRange
				? customDateRange.array.slice(-1)[0]?.end
				: timeLineRange
					? timeLineRange.array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(query?.search &&
					query?.search !== "" &&
					query?.search !== null && { search: String(query.search) }),
				advanced_report_timeline: customDateRange
					? customDateRange.array
					: timeLineRange?.array,
			};

			const dateRange: backDaterArray[] = customDateRange
				? customDateRange.array
				: timeLineRange?.array || [];
			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.getBuyers(payload, dateRange);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewOneBuyer = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const payload: any = {
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				user_id: String(req.params.id),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.viewOneBuyer(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private updateBuyerOrSeller = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user_id = req.params.id.toString();
			const payload: UpdateUserByAdminDto = req.body;
			const admin = req.admin;
			const { status, code, message, data } =
				await this.adminOverviewService.updateBuyerOrSeller(
					admin,
					user_id,
					payload
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getSellers = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const customDateRange =
				query?.start_date && query?.end_date
					? await backDaterForChartCustomDate({
							start_date: new Date(String(query.start_date)),
							end_date: new Date(String(query.end_date)),
						})
					: undefined;
			const timeLineRange = query?.timeLine
				? await backDaterForChart({
						input: new Date(),
						format: query.timeLine,
					})
				: undefined;
			const start_date = customDateRange
				? customDateRange.array[0]?.start
				: timeLineRange
					? timeLineRange.array[0]?.start
					: undefined;
			const end_date = customDateRange
				? customDateRange.array.slice(-1)[0]?.end
				: timeLineRange
					? timeLineRange.array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(query?.search &&
					query?.search !== "" &&
					query?.search !== null && { search: String(query.search) }),
				advanced_report_timeline: customDateRange
					? customDateRange.array
					: timeLineRange?.array,
			};

			const dateRange: backDaterArray[] = customDateRange
				? customDateRange.array
				: timeLineRange?.array || [];

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.getSellers(payload, dateRange);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewOneSeller = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const payload: any = {
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				user_id: String(req.params.id),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.viewOneSeller(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getPurchasers = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const payload: any = {
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(req.query?.search &&
					req?.query?.search !== null &&
					req?.query?.search !== "" && { search: String(req.query?.search) }),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.getPurchasers(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private viewAPurchaser = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const purchaser_id = String(req.params.id);
			const { status, code, message, data } =
				await this.adminOverviewService.viewaPurchaser(purchaser_id);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getPickupAssignments = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const payload: any = {
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(req.query?.search &&
					req?.query?.search !== null &&
					req?.query?.search !== "" && { search: String(req.query?.search) }),
				...(req.query?.status &&
					req?.query?.status !== null &&
					req?.query?.status !== "" && { status: String(req.query?.status) }),
				...(req.query?.purchaser &&
					req?.query?.purchaser !== null &&
					req?.query?.purchaser !== "" && {
						purchaser: new mongoose.Types.ObjectId(
							String(req.query?.purchaser)
						),
					}),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.getPickupAssignments(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchNotifications = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user = await this.User.findById(envConfig.SOTO_USER_ID);
			const payload: FetchNotificationsDto = {
				user,
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
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const notification_id = String(req.params.id);
			const user = await this.User.findById(envConfig.SOTO_USER_ID);
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
}

export default AdminPeopleController;
