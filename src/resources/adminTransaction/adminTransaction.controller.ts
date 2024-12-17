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
import { backDaterForChart, backTrackToADate } from "@/utils/helpers";
import { endOfDay, startOfDay } from "date-fns";
import { RequestExt } from "@/utils/interfaces/expRequest.interface";

class AdminTransactionController implements Controller {
	public path = "/admin/transactions";
	public router = Router();
	private adminTransactionService = new AdminTransactionService();

	constructor() {
		this.initializeRoute();
	}

	initializeRoute(): void {
		this.router.get(
			`${this.path}/get-wallet-overview`,
			validationMiddleware(validate.DashboardOverviewSchema, RequestData.query),
			this.getWalletOverview
		);

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

	private getWalletOverview = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query: OverviewDto = req.query;
			const backDaterForCurrent = query.timeLine
				? await backDaterForChart({
						input: new Date(),
						format: query.timeLine,
					})
				: undefined;

			const start_date = query?.start_date
				? startOfDay(new Date(query.start_date))
				: backDaterForCurrent
					? backDaterForCurrent.array[0]?.start
					: undefined;
			const end_date = query?.end_date
				? endOfDay(new Date(query.end_date))
				: backDaterForCurrent
					? backDaterForCurrent.array.slice(-1)[0]?.end
					: undefined;
			const previous_backtrack = backTrackToADate(String(query.timeLine));
			const backDaterForPrevious = previous_backtrack
				? await backDaterForChart({
						input: previous_backtrack,
						format: query.timeLine,
					})
				: undefined;

			const previous_start_date = backDaterForPrevious
				? backDaterForPrevious.array[0]?.start
				: undefined;

			const previous_end_date = backDaterForCurrent
				? backDaterForCurrent.array[0]?.start
				: undefined;

			const advancedReportTimeline = (
				await backDaterForChart({
					input: previous_backtrack,
					format: query.timeLine,
				})
			).array;

			const payload: OverviewDto = {
				start_date,
				end_date,
				previous_start_date,
				previous_end_date,
				limit: query?.limit ? Number(query?.limit) : 10,
				page: query?.page ? Number(query?.page) : 1,
			};

			const user = req._user;
			const { status, code, message, data } =
				await this.adminTransactionService.getWalletOverview(
					payload,
					advancedReportTimeline
				);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private getWithdrawalRequests = async (
		req: RequestExt,
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

			const user = req._user;
			const { status, code, message, data } =
				await this.adminTransactionService.getWithdrawalRequests(payload);
			return responseObject(res, code, status, message, data);
		} catch (error: any) {
			next(new HttpException(HttpCodes.HTTP_BAD_REQUEST, error.toString()));
		}
	};

	private approveOrDeclineWithdrawalRequest = async (
		req: RequestExt,
		res: Response,
		next: NextFunction
	): Promise<Response | void> => {
		try {
			var query = req.query;
			const payload: ApproveOrDecineWithdrawalAdminDto = {
				withdrawal_id: req.params.id,
				approve_or_decline: String(query?.approve_or_decline),
			};
			const user = req._user;
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
		req: RequestExt,
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
