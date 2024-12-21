import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import BusinessService from "@/resources/business/business.service";
import validate from "./transaction.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	GeneratePaymentLinkDto,
	GetTransactionsDto,
	VerificationDto,
} from "./transaction.dto";
import { Business } from "./transaction.interface";
import upload from "@/utils/config/multer";
import TransactionService from "./transaction.service";
import { Platform, YesOrNo } from "@/utils/enums/base.enum";
import { RequestExt } from "@/utils/interfaces/expRequest.interface";
import userModel from "../user/user.model";

class TransactionController implements Controller {
	public path = "/transaction";
	public router = Router();
	private transactionService = new TransactionService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.post(
			`${this.path}/generate-payment-link`,
			authenticatedMiddleware,
			validationMiddleware(validate.generatePaymentLinkSchema),
			this.generatePaymentLink
		);

		this.router.get(
			`${this.path}/add-card`,
			authenticatedMiddleware,
			this.addCard
		);

		this.router.post(
			`${this.path}/paystack/callback`,
			this.paystackCallbackService
		);

		this.router.get(
			`${this.path}/logs`,
			authenticatedMiddleware,
			this.gettransactionLogs
		);
	}

	private generatePaymentLink = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const path = "/payment-success";
			const base_url =
				req.headers.origin ||
				(req.headers.referer && new URL(req.headers.referer).origin) ||
				"https://soto-web.vercel.app" ||
				"http://localhost:5174";
			const callback_url = base_url + path;
			const payload: GeneratePaymentLinkDto = {
				amount: req.body.amount,
				card_id: req.body?.card_id,
				narration_id: req.body?.narration_id,
				narration: req.body.narration,
				save_card: req.body?.save_card === YesOrNo.YES ? true : false,
				platform: req.body?.platform,
				base_url: callback_url,
			};

			const user = req._user || new userModel();
			const { status, code, message, data } =
				await this.transactionService.initializePayment(payload, user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private addCard = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const user = req._user || new userModel();
			const { status, code, message, data } =
				await this.transactionService.addCard(user);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private paystackCallbackService = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const body: any = req.body;
			const { status, code, message, data } =
				await this.transactionService.paystackCallbackService(body);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private gettransactionLogs = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			const payload: GetTransactionsDto = {
				user: req._user || new userModel(),
				limit: req?.query?.limit ? Number(req?.query.limit) : 10,
				page: req?.query?.page ? Number(req?.query.page) : 1,
				...(req?.query?.narration && {
					narration: String(req?.query.narration),
				}),
			};
			const { status, code, message, data } =
				await this.transactionService.getTransactionLogs(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default TransactionController;
