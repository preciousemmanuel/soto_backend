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
	VerificationDto,
} from "./adminPeople.dto";
import { Business } from "./adminPeople.interface";
import upload from "@/utils/config/multer";
import { endOfDay, startOfDay } from "date-fns";
import { backDaterForChart, backTrackToADate } from "@/utils/helpers";
import {
	AccessControlOptions,
	AdminPermissions,
	RequestData,
} from "@/utils/enums/base.enum";
import adminAuthMiddleware from "@/middleware/adminAuth.middleware";

class AdminPeopleController implements Controller {
	public path = "/admin";
	public router = Router();
	private adminOverviewService = new AdminOverviewService();

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
			);
	}

	private getBuyers = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(query?.search &&
					query?.search !== "" &&
					query?.search !== null && { search: String(query.search) }),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.getBuyers(payload);
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

	private getSellers = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: query.timeLine
					? (
							await backDaterForChart({
								input: new Date(),
								format: query.timeLine,
							})
						).array.slice(-1)[0]?.end
					: undefined;

			const payload: OverviewDto = {
				...(start_date && { start_date }),
				...(end_date && { end_date }),
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(query?.search &&
					query?.search !== "" &&
					query?.search !== null && { search: String(query.search) }),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminOverviewService.getSellers(payload);
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
}

export default AdminPeopleController;
