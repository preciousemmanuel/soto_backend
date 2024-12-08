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
	CreatePurchaserDto,
	CreateRoleDto,
	EditSettingsDto,
	UpdateAdminProfileDto,
	UpdateRoleDto,
} from "./adminConfig.dto";
import upload from "@/utils/config/multer";
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
			`${this.path}/purchasers/create-new`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.WRITE),
			upload.single("passport"),
			validationMiddleware(validate.adminPurchaserSchema),
			this.createPurchaser
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

		this.router.put(
			`${this.path}/role/update/:id`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.WRITE),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			validationMiddleware(validate.UpdateAdminRoleSchema),
			this.updateAdminRole
		);

		this.router.get(
			`${this.path}/staffs/fetch`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
			validationMiddleware(validate.paginationSchema, RequestData.query),
			this.getStaffs
		);

		this.router.put(
			`${this.path}/staffs/update-role/:id`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.WRITE),
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			validationMiddleware(validate.updateStaffRoleSchema, RequestData.query),
			this.updateStaffRole
		);

		this.router.get(
			`${this.path}/profile`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
			this.getProfile
		);
		this.router.put(
			`${this.path}/edit-profile`,
			adminAuthMiddleware(AdminPermissions.ADMIN, AccessControlOptions.READ),
			upload.single("profile_image"),
			validationMiddleware(validate.editProfileSchema),
			this.editProfile
		);

		this.router.get(
			`${this.path}/get-settings`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.READ),
			this.getConfigSettings
		);

		this.router.put(
			`${this.path}/update-settings`,
			adminAuthMiddleware(AdminPermissions.CONFIG, AccessControlOptions.WRITE),
			validationMiddleware(validate.editSettingsSchema),
			this.editConfigSettings
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

	private getProfile = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.adminOverviewService.getProfile(req.admin);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private editProfile = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: UpdateAdminProfileDto = req.body;
			if (req.file) {
				payload.profile_image = req.file as Express.Multer.File;
			}
			const { status, code, message, data } =
				await this.adminOverviewService.editProfile(req.admin, payload);
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

	private createPurchaser = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: CreatePurchaserDto = req.body;
			if (req.file) {
				payload.passport = req.file as Express.Multer.File;
			}
			const { status, code, message, data } =
				await this.adminOverviewService.createPurchaser(payload);
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

	private updateAdminRole = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: UpdateRoleDto = {
				...req.body,
				...(req?.admin && { created_by: String(req.admin._id) }),
			};
			const { status, code, message, data } =
				await this.adminOverviewService.updateRole(
					payload,
					String(req.params.id)
				);
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

	private updateStaffRole = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const staff_id = String(req.params.id);
			const role_id = String(req.query.role_id);
			const { status, code, message, data } =
				await this.adminOverviewService.updateStaffRole(staff_id, role_id);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getConfigSettings = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.adminOverviewService.getConfigSettings();
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private editConfigSettings = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: EditSettingsDto = req.body;
			const { status, code, message, data } =
				await this.adminOverviewService.editConfigSettings(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default AdminConfigController;
