import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import BusinessService from "@/resources/business/business.service";
import validate from "./business.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	AddBankDetailsDto,
	CreateBusinessDto,
	FetchBanksDto,
	FetchWithdrawalsDto,
	MakeWithdrawalDto,
	VerificationDto,
} from "./business.dto";
import { Business } from "./business.interface";
import upload from "@/utils/config/multer";
import { RequestData } from "@/utils/enums/base.enum";

class BusinessController implements Controller {
	public path = "/business";
	public router = Router();
	private businessService = new BusinessService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/create`,
			upload.single("business_logo"),
			validationMiddleware(validate.createBusinessSchema),
			this.createCreateBusiness
		);

		this.router.put(
			`${this.path}/verify`,
			authenticatedMiddleware,
			upload.single("business_logo"),
			validationMiddleware(validate.verifyBusinessSchema),
			this.verifyBusiness
		);

		this.router.get(
			`${this.path}/fetch-banks`,
			authenticatedMiddleware,
			validationMiddleware(validate.paginateSchema, RequestData.query),
			this.fethBanks
		);

		this.router.post(
			`${this.path}/add-my-bank-details`,
			authenticatedMiddleware,
			validationMiddleware(validate.addBankDetailsSchema),
			this.addBankDetails
		);

		this.router.get(
			`${this.path}/get-my-bank-details`,
			authenticatedMiddleware,
			this.fetchMyBankDetails
		);

		this.router.post(
			`${this.path}/make-withdrawal-request`,
			authenticatedMiddleware,
			validationMiddleware(validate.makeWithdrawalSchema),
			this.makeWithdrawalRequest
		);

		this.router.get(
			`${this.path}/fetch-withdrawal-requests`,
			authenticatedMiddleware,
			validationMiddleware(validate.paginateSchema, RequestData.query),
			this.fethMyWithdrawals
		);
	}

	private createCreateBusiness = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: CreateBusinessDto = req.body;
			if (req.file) {
				body.business_logo = req.file;
			}
			const user = req.user;
			const { status, code, message, data } =
				await this.businessService.createBusiness(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private verifyBusiness = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: VerificationDto = req.body;
			const user = req.user;
			const { status, code, message, data } =
				await this.businessService.verifyBusiness(body, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fethBanks = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const search = req?.query?.search;
			const payload: FetchBanksDto = {
				limit: req?.query?.limit ? Number(req?.query.limit) : 10,
				page: req?.query?.page ? Number(req?.query.page) : 1,
				...(search &&
					search !== null &&
					search !== "" && { search: String(search) }),
			};

			const { status, code, message, data } =
				await this.businessService.fetchBanks(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private addBankDetails = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body = req.body;
			const payload: AddBankDetailsDto = {
				user: req.user,
				account_number: body.account_number,
				bank_id: body.bank_id,
			};

			const { status, code, message, data } =
				await this.businessService.addBankDetails(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fetchMyBankDetails = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const { status, code, message, data } =
				await this.businessService.fetchMyBankDetails(req.user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private makeWithdrawalRequest = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body = req.body;
			const payload: MakeWithdrawalDto = {
				user: req.user,
				amount: body.amount,
				bank_details_id: body.bank_details_id,
			};

			const { status, code, message, data } =
				await this.businessService.makeWithdrawalRequest(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private fethMyWithdrawals = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const queryStatus = req?.query?.status;
			const payload: FetchWithdrawalsDto = {
				user: req.user,
				limit: req?.query?.limit ? Number(req?.query.limit) : 10,
				page: req?.query?.page ? Number(req?.query.page) : 1,
				...(queryStatus &&
					queryStatus !== null &&
					queryStatus !== "" && { status: String(queryStatus) }),
			};
			const { status, code, message, data } =
				await this.businessService.fetchMyWithdrawals(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default BusinessController;
