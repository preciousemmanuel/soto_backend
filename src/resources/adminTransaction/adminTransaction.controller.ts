import { Request, Response, NextFunction, Router } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import HttpException from "@/utils/exceptions/http.exception";
import validationMiddleware from "@/middleware/validation.middleware";
import AdminTransactionService from "./adminTransaction.service";
import validate from "./adminTransaction.validation";
import { responseObject } from "@/utils/helpers/http.response";
import { HttpCodes } from "@/utils/constants/httpcode";
import authenticatedMiddleware from "@/middleware/authenticated.middleware";
import {
	ApproveOrDecineWithdrawalAdminDto,
	CreateBusinessDto,
	FetchWithdrawalsAdminDto,
	OverviewDto,
	VerificationDto,
} from "./adminTransaction.dto";
import { RequestData } from "@/utils/enums/base.enum";

class AdminTransactionController implements Controller {
	public path = "/admin/transactions";
	public router = Router();
	private adminTransactionService = new AdminTransactionService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.get(
			`${this.path}/get-withdrawal-requests`,
			validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
			this.getWithdrawalRequests
		);

		this.router.put(
			`${this.path}/approve-or-decline-withdrawal-request/:id`,
			validationMiddleware(validate.modelIdSchema, RequestData.params),
			validationMiddleware(validate.approveWithdrawalSchema, RequestData.query),
			this.approveOrDeclineWithdrawalRequest
		);
		this.router.put(
			`${this.path}/complete-withdrawal-approval`,
			validationMiddleware(validate.completeWithdrawalApprovalSchema),
			this.completeWithdrawalApproval
		);
	}

	private getWithdrawalRequests = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query = req.query;
			const payload: FetchWithdrawalsAdminDto = {
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
				...(query?.status &&
					query?.status !== null &&
					query?.status !== "" && {
						status: String(query?.status),
					}),
				...(query?.search &&
					query?.search !== null &&
					query?.search !== "" && {
						search: String(query?.search),
					}),
			};

			const user = req.user;
			const { status, code, message, data } =
				await this.adminTransactionService.getWithdrawalRequests(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private approveOrDeclineWithdrawalRequest = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query = req.query;
			const payload: ApproveOrDecineWithdrawalAdminDto = {
				withdrawal_id: req.params.id,
				approve_or_decline: String(query?.approve_or_decline),
			};
			const user = req.user;
			const { status, code, message, data } =
				await this.adminTransactionService.approveOrDeclineWithdrawalRequest(
					payload
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private completeWithdrawalApproval = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query = req.query;
			const transfer_code = req.body.transfer_code;
			const otp = req.body.otp;
			const { status, code, message, data } =
				await this.adminTransactionService.completeWithdrawalApproval(
					transfer_code,
					otp
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};
}

export default AdminTransactionController;
