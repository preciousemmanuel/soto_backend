import UserModel from "@/resources/user/user.model";
import { uniqueCode } from "@/utils/helpers";
import {
	comparePassword,
	createToken,
	generateOtpModel,
	isOtpCorrect,
} from "@/utils/helpers/token";

// import logger from "@/utils/logger";
import {
	ApproveOrDecineWithdrawalAdminDto,
	CreateBusinessDto,
	OverviewDto,
	VerificationDto,
} from "./adminTransaction.dto";
import { hashPassword } from "@/utils/helpers/token";
import {
	ApproveOrDecline,
	OrderStatus,
	OtpPurposeOptions,
	StatusMessages,
	TransactionCurrency,
	TransactionNarration,
	TransactionStatus,
	UserTypes,
} from "@/utils/enums/base.enum";
import ResponseData from "@/utils/interfaces/responseData.interface";
import { HttpCodes } from "@/utils/constants/httpcode";
import MailService from "../mail/mail.service";
import { MatchStage$and } from "@/utils/interfaces/base.interface";
import withdrawalModel from "../business/withdrawal.model";
import { PipelineStage } from "mongoose";
import { catchBlockResponseFn } from "@/utils/constants/data";
import { HttpCodesEnum } from "@/utils/enums/httpCodes.enum";
import transactionLogModel from "../transaction/transactionLog.model";
import { PaystackTransferDto } from "../transaction/transaction.dto";
import bankDetailsModel from "../business/bankDetails.model";
import bankModel from "../transaction/bank.model";
import PaymentProviderService from "../transaction/paypment-provider.service";
import BusinessService from "../business/business.service";

class AdminTransactionService {
	private Bank = bankModel;
	private BankDetails = bankDetailsModel;
	private User = UserModel;
	private TxnLog = transactionLogModel;
	private Withdrawal = withdrawalModel;
	private mailService = new MailService();
	private businessService = new BusinessService();
	private paymentProviderService = new PaymentProviderService();

	public async getWithdrawalRequests(payload: any): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Requests Retrieved Successfully",
		};
		try {
			const { limit, page, search, status } = payload;
			const skip = (page - 1) * limit;
			const matchStage: MatchStage$and = { $and: [] };
			if (search) {
				matchStage.$and.push({
					$or: [
						{ amount: { $gte: Number(search) } },
						{ account_name: { $regex: search, $options: "i" } },
						{ "user.FirstName": { $regex: search, $options: "i" } },
						{ "user.LastName": { $regex: search, $options: "i" } },
						{ "user.Email": { $regex: search, $options: "i" } },
						{ "bank.name": { $regex: search, $options: "i" } },
					],
				});
			}

			if (status) {
				matchStage.$and.push({ status });
			}
			const match_stage = matchStage.$and.length > 0 ? matchStage : {};
			const pipeline = [
				{
					$lookup: {
						from: "Users",
						localField: "user",
						foreignField: "_id",
						as: "user",
					},
				},
				{ $unwind: "$user" },
				{
					$lookup: {
						from: "Businesses",
						localField: "user.business",
						foreignField: "_id",
						as: "business",
					},
				},
				{ $unwind: "$business" },
				{
					$lookup: {
						from: "BankDetails",
						localField: "bank_details",
						foreignField: "_id",
						as: "bank_details",
					},
				},
				{ $unwind: "$bank_details" },
				{
					$lookup: {
						from: "Banks",
						localField: "bank_details.bank",
						foreignField: "_id",
						as: "bank",
					},
				},
				{ $unwind: "$bank" },
				{ $match: match_stage },

				{
					$facet: {
						totalCount: [{ $count: "count" }],
						withdrawals: [
							{ $sort: { createdAt: -1 } },
							{ $skip: skip },
							{ $limit: limit },
							{
								$project: {
									_id: 1,
									vendor_name: "$business.business_name",
									vendor_email: "$business.email",
									vendor_logo: "$business.business_logo",
									account_name: 1,
									account_number: 1,
									amount: 1,
									status: 1,
									bank: "$bank.name",
									createdAt: 1,
								},
							},
						],
					},
				} as PipelineStage,
				{
					$addFields: {
						totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
					},
				},
			];

			const aggregateResult = await this.Withdrawal.aggregate(pipeline);

			const data =
				aggregateResult.length > 0 ? aggregateResult[0]?.withdrawals : [];
			const totalCount =
				aggregateResult.length > 0 ? aggregateResult[0]?.totalCount : 0;
			const pageCount = Math.ceil(Number(totalCount) / limit);
			const currentPage = page;
			const hasNext = page * limit < totalCount;
			const pagination = {
				data,
				pagination: {
					pageSize: limit,
					totalCount,
					pageCount,
					currentPage,
					hasNext,
				},
			};
			responseData.data = pagination;

			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ getWithdrawalRequests ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}

	public async approveOrDeclineWithdrawalRequest(
		payload: ApproveOrDecineWithdrawalAdminDto
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Requests Treated Successfully",
		};
		try {
			const { withdrawal_id, approve_or_decline } = payload;
			const withdrawal = await this.Withdrawal.findById(withdrawal_id);
			if (!withdrawal) {
				return {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Withdrawal Not Found",
				};
			}
			const bank_details = await this.BankDetails.findById(
				withdrawal.toObject().bank_details
			);
			const bank = bank_details
				? await this.Bank.findById(bank_details.toObject().bank)
				: undefined;

			switch (approve_or_decline) {
				case ApproveOrDecline.APPROVED:
					if (bank) {
						const transferPayload: PaystackTransferDto = {
							account_name: withdrawal.account_name,
							account_number: withdrawal.account_number,
							amount: withdrawal.amount,
							bank_code: bank.code,
							// account_name: "Tolu Robert",
							// account_number: "01000000010",
							// amount: withdrawal.amount,
							// bank_code: "058",
							currency: TransactionCurrency.NGN,
							narration: TransactionNarration.WITHDRAWAL,
							reference: withdrawal.reference,
						};
						responseData =
							await this.paymentProviderService.paystackTransfer(
								transferPayload
							);
						if (responseData.status === StatusMessages.success) {
							const transfer_code =
								responseData.data?.transfer_code ||
								responseData.data?.data?.transfer_code;
							await this.TxnLog.findOneAndUpdate(
								{ reference: withdrawal.reference },
								{ transfer_request: transfer_code }
							);
						}
					} else {
						responseData = {
							status: StatusMessages.error,
							code: HttpCodes.HTTP_BAD_REQUEST,
							message: "Unable To Verify Bank Details",
						};
					}
					break;

				default:
					withdrawal.status = TransactionStatus.FAILED;
					await this.TxnLog.findOneAndUpdate(
						{ reference: withdrawal.reference },
						{ status: TransactionStatus.FAILED }
					);
					await withdrawal.save();
					const user_id = String(withdrawal.user).toString();
					this.businessService.walletCredit(user_id, withdrawal.amount);
					responseData = {
						status: StatusMessages.success,
						code: HttpCodes.HTTP_OK,
						message: "Withdrawal Request Declined Successfully",
						data: withdrawal,
					};
					break;
			}
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ getWithdrawalRequests ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}

	public async completeWithdrawalApproval(
		transfer_code: string,
		otp: string
	): Promise<ResponseData> {
		let responseData: ResponseData = {
			status: StatusMessages.success,
			code: HttpCodes.HTTP_OK,
			message: "Withdrawal Requests Treated Successfully",
		};
		try {
			const existingLog = await this.TxnLog.findOne({
				transfer_request: transfer_code,
			});
			if (existingLog) {
				const finalize_transfer =
					await this.paymentProviderService.completePaystackTransfer(
						transfer_code,
						otp
					);
				if (finalize_transfer.status !== StatusMessages.success) {
					const user_id = String(existingLog.user).toString();
					if (existingLog.status !== TransactionStatus.REVERSAL) {
						await this.businessService.walletCredit(
							user_id,
							existingLog.amount
						);
						existingLog.status = TransactionStatus.REVERSAL;
						existingLog.save();
					}
				}
				responseData = finalize_transfer;
			} else {
				responseData = {
					status: StatusMessages.error,
					code: HttpCodesEnum.HTTP_BAD_REQUEST,
					message: "Ongoing Transaction Not Found",
				};
			}
			return responseData;
		} catch (error: any) {
			console.log(
				"🚀 ~ AdminOverviewService ~ completeWithdrawalApproval ~ error:",
				error
			);
			return catchBlockResponseFn(error);
		}
	}
}

export default AdminTransactionService;
