import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import AdminConfigService from "./adminConfig.service";
import validate from "./adminConfig.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	AdminLoginDto,
	CreateAdminDto,
	CreateBusinessDto,
	CreateRoleDto,
	OverviewDto,
	VerificationDto,
} from "./adminConfig.dto";
import { Business } from "./adminConfig.interface";
import upload from "@/utils/config/multer";
import { endOfDay, startOfDay } from "date-fns";
import { backDaterForChart, backTrackToADate } from "@/utils/helpers";
import {
	AccessControlOptions,
	AdminPermissions,
	RequestData,
} from "@/utils/enums/base.enum";
import adminAuthMiddleware from "@/middleware/adminAuth.middleware";

class AdminConfigController implements Controller {
	public path = "/admin";
	public router = Router();
	private adminOverviewService = new AdminConfigService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/login`,
			validationMiddleware(validate.adminLoginSchema),
			this.adminLogin
		);
		this.router.post(
			`${this.path}/create-new-admin`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.WRITE),
			validationMiddleware(validate.adminCreateSchema),
			this.createAdmin
		);

		this.router.post(
			`${this.path}/role/create`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.WRITE),
			validationMiddleware(validate.CreateAdminRoleSchema),
			this.createAdminRole
		);
		this.router.get(
			`${this.path}/role/fetch`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.READ),
			validationMiddleware(validate.paginationSchema, RequestData.query),
			this.fetchRoles
		);

		this.router.get(
			`${this.path}/staffs/fetch`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
			validationMiddleware(validate.paginationSchema, RequestData.query),
			this.getStaffs
		);
	}

	private adminLogin = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: AdminLoginDto = req.body;
			const { status, code, message, data } =
				await this.adminOverviewService.adminLogin(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createAdmin = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: CreateAdminDto = req.body;
			const { status, code, message, data } =
				await this.adminOverviewService.createAdmin(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private createAdminRole = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: CreateRoleDto = {
				...req.body,
				...(req?.admin && { created_by: String(req.admin._id) }),
			};
			const { status, code, message, data } =
				await this.adminOverviewService.createRole(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchRoles = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const limit = Number(req.query.limit);
			const page = Number(req.query.page);
			const search = req?.query?.search ? String(req.query.search) : undefined;
			const { status, code, message, data } =
				await this.adminOverviewService.fetchRoles(limit, page, search);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getStaffs = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const limit = Number(req.query.limit);
			const page = Number(req.query.page);
			const search = req?.query?.search ? String(req.query.search) : undefined;
			const role = req?.query?.role ? String(req.query.role) : undefined;
			const { status, code, message, data } =
				await this.adminOverviewService.getStaffs(limit, page, search, role);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default AdminConfigController;
